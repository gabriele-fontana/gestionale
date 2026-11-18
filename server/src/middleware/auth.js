const jwt = require('jsonwebtoken');

function authenticate(req, res, next) {
    const header = req.headers.authorization;

    if (!header || !header.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Token mancante' });
    }

    const token = header.split(' ')[1];

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        req.user = payload; // { id, role, apartmentId }
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Token non valido o scaduto' });
    }
}

function requireAdmin(req, res, next) {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Permesso negato: serve il ruolo admin' });
    }
    next();
}

module.exports = { authenticate, requireAdmin };