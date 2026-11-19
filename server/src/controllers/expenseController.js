const pool = require('../config/db');

const toCents = (value) => Math.round(Number(value) * 100);
const fromCents = (cents) => (cents / 100).toFixed(2);
const isValidDate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s);

// Divide equamente in centesimi, distribuendo il resto ai primi
function splitEqually(totalCents, userIds) {
    const base = Math.floor(totalCents / userIds.length);
    let remainder = totalCents - base * userIds.length;
    return userIds.map((userId) => {
        const extra = remainder > 0 ? 1 : 0;
        remainder -= extra;
        return { userId, cents: base + extra };
    });
}

// Conta quanti degli id indicati appartengono all'appartamento
async function countMembers(conn, apartmentId, ids, onlyActive) {
    const [rows] = await conn.query(
        `SELECT COUNT(*) AS total FROM users
     WHERE apartment_id = ? AND id IN (?) ${onlyActive ? 'AND is_active = TRUE' : ''}`,
        [apartmentId, ids]
    );
    return rows[0].total;
}

// Da saldi netti a "chi paga chi" con il minor numero di bonifici
function computeTransfers(users, net) {
    const names = new Map(users.map((u) => [u.id, u.name]));
    const creditors = [];
    const debtors = [];

    for (const [id, cents] of net) {
        if (cents > 0) creditors.push({ id, cents });
        else if (cents < 0) debtors.push({ id, cents: -cents });
    }
    creditors.sort((a, b) => b.cents - a.cents);
    debtors.sort((a, b) => b.cents - a.cents);

    const transfers = [];
    let i = 0;
    let j = 0;
    while (i < debtors.length && j < creditors.length) {
        const cents = Math.min(debtors[i].cents, creditors[j].cents);
        transfers.push({
            fromUserId: debtors[i].id,
            fromName: names.get(debtors[i].id),
            toUserId: creditors[j].id,
            toName: names.get(creditors[j].id),
            amount: cents / 100,
        });
        debtors[i].cents -= cents;
        creditors[j].cents -= cents;
        if (debtors[i].cents === 0) i++;
        if (creditors[j].cents === 0) j++;
    }
    return transfers;
}

async function listExpenses(req, res) {
    try {
        const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 100, 1), 100);
        const [expenses] = await pool.query(
            `SELECT e.id, e.description, e.amount, e.category, e.expense_date,
              e.paid_by, u.name AS paid_by_name
       FROM expenses e
       JOIN users u ON u.id = e.paid_by
       WHERE e.apartment_id = ?
       ORDER BY e.expense_date DESC, e.id DESC
       LIMIT ?`,
            [req.user.apartmentId, limit]
        );

        if (expenses.length === 0) return res.json([]);

        const [shares] = await pool.query(
            `SELECT es.expense_id, es.user_id, es.share_amount, u.name
       FROM expense_shares es
       JOIN users u ON u.id = es.user_id
       WHERE es.expense_id IN (?)`,
            [expenses.map((e) => e.id)]
        );

        res.json(
            expenses.map((e) => ({
                ...e,
                amount: Number(e.amount),
                shares: shares
                    .filter((s) => s.expense_id === e.id)
                    .map((s) => ({
                        userId: s.user_id,
                        name: s.name,
                        amount: Number(s.share_amount),
                    })),
            }))
        );
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Errore del server' });
    }
}

async function createExpense(req, res) {
    const { description, amount, category, expenseDate, paidBy, participants, shares } =
        req.body || {};
    const apartmentId = req.user.apartmentId;

    const totalCents = toCents(amount);
    if (!description || !description.trim()) {
        return res.status(400).json({ error: 'Inserisci una descrizione' });
    }
    if (!Number.isInteger(totalCents) || totalCents <= 0) {
        return res.status(400).json({ error: 'Importo non valido' });
    }
    if (expenseDate && !isValidDate(expenseDate)) {
        return res.status(400).json({ error: 'Data non valida (formato AAAA-MM-GG)' });
    }

    // Due modalità: quote personalizzate oppure divisione equa tra i partecipanti
    let split;
    if (Array.isArray(shares) && shares.length > 0) {
        split = shares.map((s) => ({ userId: Number(s.userId), cents: toCents(s.amount) }));
        const invalid = split.some(
            (s) => !Number.isInteger(s.userId) || !Number.isInteger(s.cents) || s.cents <= 0
        );
        if (invalid || new Set(split.map((s) => s.userId)).size !== split.length) {
            return res.status(400).json({ error: 'Quote non valide' });
        }
        const sum = split.reduce((total, s) => total + s.cents, 0);
        if (sum !== totalCents) {
            return res
                .status(400)
                .json({ error: "La somma delle quote deve essere uguale all'importo" });
        }
    } else if (Array.isArray(participants) && participants.length > 0) {
        const ids = [...new Set(participants.map(Number))];
        if (ids.some((id) => !Number.isInteger(id))) {
            return res.status(400).json({ error: 'Partecipanti non validi' });
        }
        split = splitEqually(totalCents, ids);
    } else {
        return res.status(400).json({ error: 'Indica con chi dividere la spesa' });
    }

    const payerId = paidBy ? Number(paidBy) : req.user.id;
    const involved = [...new Set([payerId, ...split.map((s) => s.userId)])];
    if (involved.some((id) => !Number.isInteger(id))) {
        return res.status(400).json({ error: 'Utente non valido' });
    }

    const conn = await pool.getConnection();
    try {
        // Pagatore e partecipanti devono essere membri attivi di questo appartamento
        const members = await countMembers(conn, apartmentId, involved, true);
        if (members !== involved.length) {
            return res.status(400).json({ error: 'Utente non valido per questo appartamento' });
        }

        await conn.beginTransaction();

        const [result] = await conn.query(
            `INSERT INTO expenses (apartment_id, description, amount, paid_by, category, expense_date)
       VALUES (?, ?, ?, ?, ?, COALESCE(?, CURRENT_DATE))`,
            [
                apartmentId,
                description.trim(),
                fromCents(totalCents),
                payerId,
                category || null,
                expenseDate || null,
            ]
        );

        await conn.query(
            'INSERT INTO expense_shares (expense_id, user_id, share_amount) VALUES ?',
            [split.map((s) => [result.insertId, s.userId, fromCents(s.cents)])]
        );

        await conn.commit();
        res.status(201).json({ id: result.insertId });
    } catch (err) {
        await conn.rollback();
        console.error(err);
        res.status(500).json({ error: 'Errore del server' });
    } finally {
        conn.release();
    }
}

async function deleteExpense(req, res) {
    const expenseId = Number(req.params.id);

    try {
        const [rows] = await pool.query(
            'SELECT paid_by FROM expenses WHERE id = ? AND apartment_id = ?',
            [expenseId, req.user.apartmentId]
        );
        if (!rows[0]) {
            return res.status(404).json({ error: 'Spesa non trovata' });
        }
        if (rows[0].paid_by !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Puoi eliminare solo le spese che hai pagato' });
        }

        await pool.query('DELETE FROM expenses WHERE id = ?', [expenseId]);
        res.json({ message: 'Spesa eliminata' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Errore del server' });
    }
}

async function getBalances(req, res) {
    const apartmentId = req.user.apartmentId;

    try {
        const [paid] = await pool.query(
            `SELECT paid_by AS user_id, SUM(amount) AS total
       FROM expenses WHERE apartment_id = ? GROUP BY paid_by`,
            [apartmentId]
        );
        const [owed] = await pool.query(
            `SELECT es.user_id, SUM(es.share_amount) AS total
       FROM expense_shares es
       JOIN expenses e ON e.id = es.expense_id
       WHERE e.apartment_id = ? GROUP BY es.user_id`,
            [apartmentId]
        );
        const [users] = await pool.query(
            'SELECT id, name, is_active FROM users WHERE apartment_id = ?',
            [apartmentId]
        );

        // Saldo netto in centesimi: pagato - dovuto
        const net = new Map(users.map((u) => [u.id, 0]));
        paid.forEach((r) => net.set(r.user_id, net.get(r.user_id) + toCents(r.total)));
        owed.forEach((r) => net.set(r.user_id, net.get(r.user_id) - toCents(r.total)));

        res.json({
            balances: users.map((u) => ({
                userId: u.id,
                name: u.name,
                isActive: Boolean(u.is_active),
                balance: net.get(u.id) / 100,
            })),
            transfers: computeTransfers(users, net),
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Errore del server' });
    }
}

// Rimborso: "io ho dato X euro a un coinquilino"
async function createSettlement(req, res) {
    const { toUserId, amount } = req.body || {};
    const to = Number(toUserId);
    const cents = toCents(amount);

    if (!Number.isInteger(to) || !Number.isInteger(cents) || cents <= 0) {
        return res.status(400).json({ error: 'Dati non validi' });
    }
    if (to === req.user.id) {
        return res.status(400).json({ error: 'Non puoi saldare con te stesso' });
    }

    const conn = await pool.getConnection();
    try {
        const members = await countMembers(conn, req.user.apartmentId, [to], false);
        if (members !== 1) {
            return res.status(404).json({ error: 'Utente non trovato' });
        }

        await conn.beginTransaction();

        const [result] = await conn.query(
            `INSERT INTO expenses (apartment_id, description, amount, paid_by, category)
       VALUES (?, 'Rimborso', ?, ?, 'rimborso')`,
            [req.user.apartmentId, fromCents(cents), req.user.id]
        );
        await conn.query(
            'INSERT INTO expense_shares (expense_id, user_id, share_amount) VALUES (?, ?, ?)',
            [result.insertId, to, fromCents(cents)]
        );

        await conn.commit();
        res.status(201).json({ id: result.insertId });
    } catch (err) {
        await conn.rollback();
        console.error(err);
        res.status(500).json({ error: 'Errore del server' });
    } finally {
        conn.release();
    }
}

module.exports = {
    listExpenses,
    createExpense,
    deleteExpense,
    getBalances,
    createSettlement,
};