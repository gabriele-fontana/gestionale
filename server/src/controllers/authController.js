const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

function createToken(user) {
    return jwt.sign(
        { id: user.id, role: user.role, apartmentId: user.apartment_id },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    );
}

async function register(req, res) {
    const { name, email, password, apartmentName } = req.body;

    if (process.env.ALLOW_REGISTRATION === 'false') {
        return res.status(403).json({ error: 'Le registrazioni sono chiuse' });
    }

    if (!name || !email || !password || !apartmentName) {
        return res.status(400).json({ error: 'Compila tutti i campi' });
    }
    if (password.length < 8) {
        return res.status(400).json({ error: 'La password deve avere almeno 8 caratteri' });
    }

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const passwordHash = await bcrypt.hash(password, 10);

        const [apartment] = await conn.query(
            'INSERT INTO apartments (name) VALUES (?)',
            [apartmentName]
        );

        const [result] = await conn.query(
            `INSERT INTO users (apartment_id, name, email, password_hash, role)
       VALUES (?, ?, ?, ?, 'admin')`,
            [apartment.insertId, name, email.toLowerCase().trim(), passwordHash]
        );

        await conn.commit();

        const user = {
            id: result.insertId,
            name,
            email: email.toLowerCase().trim(),
            role: 'admin',
            apartment_id: apartment.insertId,
        };

        res.status(201).json({ token: createToken(user), user });
    } catch (err) {
        await conn.rollback();
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'Email già registrata' });
        }
        console.error(err);
        res.status(500).json({ error: 'Errore del server' });
    } finally {
        conn.release();
    }
}

async function login(req, res) {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email e password obbligatorie' });
    }

    try {
        const [rows] = await pool.query(
            'SELECT * FROM users WHERE email = ?',
            [email.toLowerCase().trim()]
        );
        const user = rows[0];

        // Stesso messaggio per email sbagliata e password sbagliata
        const valid = user && (await bcrypt.compare(password, user.password_hash));
        if (!valid) {
            return res.status(401).json({ error: 'Credenziali non valide' });
        }
        if (!user.is_active) {
            return res.status(403).json({ error: 'Account disattivato' });
        }

        res.json({
            token: createToken(user),
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                apartment_id: user.apartment_id,
            },
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Errore del server' });
    }
}

async function me(req, res) {
    try {
        const [rows] = await pool.query(
            'SELECT id, name, email, role, apartment_id FROM users WHERE id = ?',
            [req.user.id]
        );
        if (!rows[0]) return res.status(404).json({ error: 'Utente non trovato' });
        res.json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Errore del server' });
    }
}

module.exports = { register, login, me };