import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { formatEuro, formatDate } from '../../utils/format';

export default function RecentExpensesCard() {
    const { user: me } = useAuth();
    const [expenses, setExpenses] = useState(null);
    const [error, setError] = useState(false);

    useEffect(() => {
        api
            .get('/expenses', { params: { limit: 3 } })
            .then((res) => setExpenses(res.data))
            .catch(() => setError(true));
    }, []);

    return (
        <div className="card">
            <h2>Ultime spese</h2>

            {error && <p className="error">Impossibile caricare le spese</p>}
            {!expenses && !error && <p className="muted">Caricamento...</p>}
            {expenses && expenses.length === 0 && (
                <p className="muted">Nessuna spesa registrata.</p>
            )}

            {expenses && expenses.length > 0 && (
                <ul className="mini-list">
                    {expenses.map((e) => (
                        <li key={e.id}>
                            <div className="info">
                                <strong>{e.description}</strong>
                                <span className="muted">
                                    {formatDate(e.expense_date)} · {e.paid_by === me.id ? 'tu' : e.paid_by_name}
                                </span>
                            </div>
                            <span className="amount">{formatEuro(e.amount)}</span>
                        </li>
                    ))}
                </ul>
            )}

            <Link to="/expenses" className="card-link">
                Tutte le spese →
            </Link>
        </div>
    );
}