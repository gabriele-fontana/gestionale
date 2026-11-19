require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const pool = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const shoppingRoutes = require('./routes/shoppingRoutes');
const noteRoutes = require('./routes/noteRoutes');

const app = express();
const isProduction = process.env.NODE_ENV === 'production';

// Dietro il proxy dell'hosting: serve per leggere l'IP reale (limite tentativi di login)
app.set('trust proxy', 1);

// In produzione frontend e API hanno la stessa origine, quindi CORS non serve
if (!isProduction) app.use(cors());
app.use(express.json());

app.get('/api/health', async (req, res) => {
    try {
        await pool.query('SELECT 1');
        res.json({ status: 'ok', database: 'connesso' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ status: 'errore', database: 'non raggiungibile' });
    }
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/shopping', shoppingRoutes);
app.use('/api/notes', noteRoutes);

// Un endpoint API inesistente deve rispondere 404, non con la pagina del sito
app.use('/api', (req, res) => res.status(404).json({ error: 'Endpoint non trovato' }));

if (isProduction) {
    const clientDist = path.join(__dirname, '../../client/dist');
    app.use(express.static(clientDist));
    // Qualsiasi altro indirizzo (es. /expenses) lo gestisce React Router
    app.get('/{*splat}', (req, res) => res.sendFile(path.join(clientDist, 'index.html')));
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server in ascolto sulla porta ${PORT}`);
});