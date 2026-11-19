const express = require('express');
const rateLimit = require('express-rate-limit');
const { register, login, me } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minuti
    max: 10, // Limite di 10 richieste per IP
    message: { error: 'Troppe richieste, riprova più tardi' },
});
const router = express.Router();

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.get('/me', authenticate, me);

module.exports = router;