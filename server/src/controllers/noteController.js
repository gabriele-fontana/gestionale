const pool = require('../config/db');

async function listNotes(req, res) {
    try {
        // UNIX_TIMESTAMP restituisce l'istante reale, indipendente dal fuso del server:
        // sarà il browser a mostrarlo nell'ora locale di chi legge
        const [rows] = await pool.query(
            `SELECT n.id, n.content, n.created_by, u.name AS author_name,
              UNIX_TIMESTAMP(n.created_at) AS created_ts
       FROM notes n
       LEFT JOIN users u ON u.id = n.created_by
       WHERE n.apartment_id = ?
       ORDER BY n.created_at DESC, n.id DESC
       LIMIT 20`,
            [req.user.apartmentId]
        );
        res.json(rows.map((r) => ({ ...r, created_ts: Number(r.created_ts) })));
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Errore del server' });
    }
}

async function createNote(req, res) {
    const raw = req.body?.content;
    const content = typeof raw === 'string' ? raw.trim() : '';

    if (!content) {
        return res.status(400).json({ error: 'Scrivi qualcosa' });
    }
    if (content.length > 500) {
        return res.status(400).json({ error: 'Nota troppo lunga (max 500 caratteri)' });
    }

    try {
        const [result] = await pool.query(
            'INSERT INTO notes (apartment_id, content, created_by) VALUES (?, ?, ?)',
            [req.user.apartmentId, content, req.user.id]
        );
        res.status(201).json({ id: result.insertId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Errore del server' });
    }
}

async function deleteNote(req, res) {
    const noteId = Number(req.params.id);

    try {
        const [rows] = await pool.query(
            'SELECT created_by FROM notes WHERE id = ? AND apartment_id = ?',
            [noteId, req.user.apartmentId]
        );
        if (!rows[0]) {
            return res.status(404).json({ error: 'Nota non trovata' });
        }
        if (rows[0].created_by !== req.user.id && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Puoi eliminare solo le tue note' });
        }

        await pool.query('DELETE FROM notes WHERE id = ?', [noteId]);
        res.json({ message: 'Nota eliminata' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Errore del server' });
    }
}

module.exports = { listNotes, createNote, deleteNote };