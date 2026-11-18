const jwt = require('jsonwebtoken');
const pool = require('../config/db');

async function authenticate(req, res, next) {
    const header = req.headers.authorization;

    if (!header || !header.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Token mancante' });
    }

    let payload;
    try {
        payload = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET);
    } catch (err) {
        return res.status(401).json({ error: 'Token non valido o scaduto' });
    }

    try {
        const [rows] = await pool.query(
            'SELECT id, role, apartment_id, is_active FROM users WHERE id = ?',
            [payload.id]
        );
        const user = rows[0];

        if (!user || !user.is_active) {
            return res.status(401).json({ error: 'Account non attivo' });
        }

        req.user = { id: user.id, role: user.role, apartmentId: user.apartment_id };
        next();
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Errore del server' });
    }
}

function requireAdmin(req, res, next) {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Permesso negato: serve il ruolo admin' });
    }
    next();
}

module.exports = { authenticate, requireAdmin };