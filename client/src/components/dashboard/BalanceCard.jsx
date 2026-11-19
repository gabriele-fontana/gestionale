import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { formatEuro, formatEuroSigned } from '../../utils/format';

export default function BalanceCard() {
    const { user: me } = useAuth();
    const [data, setData] = useState(null);
    const [error, setError] = useState(false);

    useEffect(() => {
        api
            .get('/expenses/balances')
            .then((res) => setData(res.data))
            .catch(() => setError(true));
    }, []);

    const mine = data?.balances.find((b) => b.userId === me.id);
    const myTransfers =
        data?.transfers.filter((t) => t.fromUserId === me.id || t.toUserId === me.id) ?? [];

    return (
        <div className="card">
            <h2>Il tuo saldo</h2>

            {error && <p className="error">Impossibile caricare i saldi</p>}
            {!data && !error && <p className="muted">Caricamento...</p>}

            {mine && (
                <>
                    <p
                        className={`big-number ${mine.balance > 0 ? 'positive' : mine.balance < 0 ? 'negative' : ''
                            }`}
                    >
                        {formatEuroSigned(mine.balance)}
                    </p>
                    {myTransfers.length === 0 ? (
                        <p className="muted">Sei in pari con tutti 🎉</p>
                    ) : (
                        myTransfers.map((t) => (
                            <p key={`${t.fromUserId}-${t.toUserId}`} className="muted">
                                {t.fromUserId === me.id
                                    ? `Devi ${formatEuro(t.amount)} a ${t.toName}`
                                    : `${t.fromName} ti deve ${formatEuro(t.amount)}`}
                            </p>
                        ))
                    )}
                </>
            )}

            <Link to="/expenses" className="card-link">
                Vai alle spese →
            </Link>
        </div>
    );
}