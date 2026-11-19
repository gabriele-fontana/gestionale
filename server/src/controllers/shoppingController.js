const pool = require('../config/db');

async function listItems(req, res) {
    try {
        const [rows] = await pool.query(
            `SELECT s.id, s.item, s.purchased, s.created_at, u.name AS added_by_name
       FROM shopping_list s
       LEFT JOIN users u ON u.id = s.added_by
       WHERE s.apartment_id = ?
       ORDER BY s.purchased ASC, s.created_at DESC, s.id DESC`,
            [req.user.apartmentId]
        );
        res.json(rows.map((r) => ({ ...r, purchased: Boolean(r.purchased) })));
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Errore del server' });
    }
}

async function createItem(req, res) {
    const raw = req.body?.item;
    const item = typeof raw === 'string' ? raw.trim() : '';

    if (!item) {
        return res.status(400).json({ error: 'Scrivi cosa vuoi aggiungere' });
    }
    if (item.length > 150) {
        return res.status(400).json({ error: 'Nome troppo lungo (max 150 caratteri)' });
    }

    try {
        // Evita doppioni tra gli articoli ancora da comprare
        const [existing] = await pool.query(
            'SELECT id FROM shopping_list WHERE apartment_id = ? AND item = ? AND purchased = FALSE',
            [req.user.apartmentId, item]
        );
        if (existing[0]) {
            return res.status(409).json({ error: 'È già in lista' });
        }

        const [result] = await pool.query(
            'INSERT INTO shopping_list (apartment_id, item, added_by) VALUES (?, ?, ?)',
            [req.user.apartmentId, item, req.user.id]
        );
        res.status(201).json({ id: result.insertId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Errore del server' });
    }
}

async function setPurchased(req, res) {
    const itemId = Number(req.params.id);
    const purchased = req.body?.purchased;

    if (typeof purchased !== 'boolean') {
        return res.status(400).json({ error: 'Il campo purchased deve essere true o false' });
    }

    try {
        const [result] = await pool.query(
            'UPDATE shopping_list SET purchased = ? WHERE id = ? AND apartment_id = ?',
            [purchased, itemId, req.user.apartmentId]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Articolo non trovato' });
        }
        res.json({ message: 'Articolo aggiornato' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Errore del server' });
    }
}

async function deleteItem(req, res) {
    try {
        const [result] = await pool.query(
            'DELETE FROM shopping_list WHERE id = ? AND apartment_id = ?',
            [Number(req.params.id), req.user.apartmentId]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Articolo non trovato' });
        }
        res.json({ message: 'Articolo eliminato' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Errore del server' });
    }
}

async function clearPurchased(req, res) {
    try {
        const [result] = await pool.query(
            'DELETE FROM shopping_list WHERE apartment_id = ? AND purchased = TRUE',
            [req.user.apartmentId]
        );
        res.json({ deleted: result.affectedRows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Errore del server' });
    }
}

module.exports = { listItems, createItem, setPurchased, deleteItem, clearPurchased };