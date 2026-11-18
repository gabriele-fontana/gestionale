gestionale-appartamento/
├── client/                    # React (frontend)
│   ├── src/
│   │   ├── components/        # componenti riutilizzabili (Button, Card, Modal...)
│   │   ├── pages/              # una cartella/file per vista (Login, Dashboard, Spese, Faccende, Calendario)
│   │   ├── context/             # AuthContext (utente loggato, ruolo)
│   │   ├── services/            # funzioni che chiamano le API (api.js, expensesApi.js...)
│   │   ├── hooks/                # hook custom (useAuth, useFetch)
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
│
├── server/                    # Express (backend)
│   ├── src/
│   │   ├── controllers/        # logica delle richieste (expensesController.js...)
│   │   ├── routes/              # definizione endpoint (expensesRoutes.js...)
│   │   ├── middleware/          # auth.js (verifica JWT + ruolo)
│   │   ├── models/               # query verso il DB (o modelli ORM)
│   │   ├── config/               # connessione DB
│   │   └── app.js
│   ├── .env                    # credenziali DB, JWT_SECRET (mai su git)
│   └── package.json
│
└── README.md