const bcrypt = require('bcrypt');
const pool = require('../config/db');

async function listUsers(req, res) {
    try {
        const [rows] = await pool.query(
            'SELECT id, name, email, role, is_active, created_at FROM users WHERE apartment_id = ? ORDER BY name',
            [req.user.apartmentId]
        );
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Errore del server' });
    }
}

async function createUser(req, res) {
    const { name, email, password, role = 'user' } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ error: 'Nome, email e password sono obbligatori' });
    }
    if (password.length < 8) {
        return res.status(400).json({ error: 'La password deve avere almeno 8 caratteri' });
    }
    if (!['admin', 'user'].includes(role)) {
        return res.status(400).json({ error: 'Ruolo non valido' });
    }

    try {
        const passwordHash = await bcrypt.hash(password, 10);
        const cleanEmail = email.toLowerCase().trim();

        const [result] = await pool.query(
            `INSERT INTO users (apartment_id, name, email, password_hash, role)
       VALUES (?, ?, ?, ?, ?)`,
            [req.user.apartmentId, name, cleanEmail, passwordHash, role]
        );

        res.status(201).json({
            id: result.insertId,
            name,
            email: cleanEmail,
            role,
        });
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'Email già registrata' });
        }
        console.error(err);
        res.status(500).json({ error: 'Errore del server' });
    }
}

async function updateUser(req, res) {
    const targetId = Number(req.params.id);
    const { name, role, isActive } = req.body || {};
    const hasActive = typeof isActive === 'boolean';

    if (!name && !role && !hasActive) {
        return res.status(400).json({ error: 'Niente da aggiornare' });
    }
    if (role && !['admin', 'user'].includes(role)) {
        return res.status(400).json({ error: 'Ruolo non valido' });
    }
    if (hasActive && !isActive && targetId === req.user.id) {
        return res.status(400).json({ error: 'Non puoi disattivare te stesso' });
    }

    try {
        const [rows] = await pool.query(
            'SELECT id, role FROM users WHERE id = ? AND apartment_id = ?',
            [targetId, req.user.apartmentId]
        );
        if (!rows[0]) {
            return res.status(404).json({ error: 'Utente non trovato' });
        }

        // L'appartamento deve sempre avere almeno un admin attivo
        const losesAdmin =
            rows[0].role === 'admin' && (role === 'user' || (hasActive && !isActive));
        if (losesAdmin) {
            const [admins] = await pool.query(
                `SELECT COUNT(*) AS total FROM users
         WHERE apartment_id = ? AND role = 'admin' AND is_active = TRUE AND id <> ?`,
                [req.user.apartmentId, targetId]
            );
            if (admins[0].total === 0) {
                return res.status(400).json({ error: 'Deve esserci almeno un amministratore attivo' });
            }
        }

        await pool.query(
            `UPDATE users
       SET name = COALESCE(?, name),
           role = COALESCE(?, role),
           is_active = COALESCE(?, is_active)
       WHERE id = ?`,
            [name || null, role || null, hasActive ? isActive : null, targetId]
        );

        res.json({ message: 'Utente aggiornato' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Errore del server' });
    }
}

async function deleteUser(req, res) {
    const targetId = Number(req.params.id);

    if (targetId === req.user.id) {
        return res.status(400).json({ error: 'Non puoi eliminare te stesso' });
    }

    try {
        const [result] = await pool.query(
            'DELETE FROM users WHERE id = ? AND apartment_id = ?',
            [targetId, req.user.apartmentId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Utente non trovato' });
        }
        res.json({ message: 'Utente eliminato' });
    } catch (err) {
        // L'utente ha spese collegate: il DB blocca la cancellazione
        if (err.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(409).json({
                error: "L'utente ha spese registrate: disattivalo invece di eliminarlo",
            });
        }
        console.error(err);
        res.status(500).json({ error: 'Errore del server' });
    }
}

async function changePassword(req, res) {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Compila entrambi i campi' });
    }
    if (newPassword.length < 8) {
        return res.status(400).json({ error: 'La nuova password deve avere almeno 8 caratteri' });
    }

    try {
        const [rows] = await pool.query(
            `SELECT id, name, email, role, is_active, created_at
            FROM users WHERE apartment_id = ?
            ORDER BY is_active DESC, name`,
            [req.user.apartmentId]
        );

        const valid = await bcrypt.compare(currentPassword, rows[0].password_hash);
        if (!valid) {
            return res.status(400).json({ error: 'Password attuale errata' });
        }

        const newHash = await bcrypt.hash(newPassword, 10);
        await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [
            newHash,
            req.user.id,
        ]);

        res.json({ message: 'Password aggiornata' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Errore del server' });
    }
}

module.exports = { listUsers, createUser, updateUser, deleteUser, changePassword };