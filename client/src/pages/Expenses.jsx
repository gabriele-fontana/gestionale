import { useCallback, useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import BalanceSummary from '../components/BalanceSummary';
import ExpenseForm from '../components/ExpenseForm';
import { formatEuro, formatDate } from '../utils/format';

export default function Expenses() {
    const { user: me } = useAuth();
    const [expenses, setExpenses] = useState([]);
    const [balances, setBalances] = useState(null);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showForm, setShowForm] = useState(false);

    const loadAll = useCallback(async () => {
        try {
            const [exp, bal, usr] = await Promise.all([
                api.get('/expenses'),
                api.get('/expenses/balances'),
                api.get('/users'),
            ]);
            setExpenses(exp.data);
            setBalances(bal.data);
            setUsers(usr.data);
            setError('');
        } catch (err) {
            setError(err.response?.data?.error || 'Errore nel caricamento');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadAll();
    }, [loadAll]);

    async function handleCreated() {
        setShowForm(false);
        await loadAll();
    }

    async function handleDelete(expense) {
        if (!window.confirm(`Eliminare "${expense.description}"?`)) return;
        try {
            await api.delete(`/expenses/${expense.id}`);
            await loadAll();
        } catch (err) {
            setError(err.response?.data?.error || 'Errore del server');
        }
    }

    async function handleSettle(transfer) {
        const message = `Confermi di aver dato ${formatEuro(transfer.amount)} a ${transfer.toName}?`;
        if (!window.confirm(message)) return;
        try {
            await api.post('/expenses/settlements', {
                toUserId: transfer.toUserId,
                amount: transfer.amount,
            });
            await loadAll();
        } catch (err) {
            setError(err.response?.data?.error || 'Errore del server');
        }
    }

    return (
        <section className="stack">
            <h1>Spese</h1>

            {error && <p className="error">{error}</p>}
            {loading && <p className="muted">Caricamento...</p>}

            {balances && <BalanceSummary data={balances} meId={me.id} onSettle={handleSettle} />}

            {showForm ? (
                <ExpenseForm
                    users={users}
                    meId={me.id}
                    onCreated={handleCreated}
                    onCancel={() => setShowForm(false)}
                />
            ) : (
                <button onClick={() => setShowForm(true)} disabled={loading}>
                    + Nuova spesa
                </button>
            )}

            <h2>Ultime spese</h2>
            {!loading && expenses.length === 0 && (
                <p className="muted">Nessuna spesa registrata.</p>
            )}

            <ul className="card-list">
                {expenses.map((e) => {
                    const canDelete = e.paid_by === me.id || me.role === 'admin';
                    return (
                        <li key={e.id} className="card">
                            <div className="expense-top">
                                <div className="info">
                                    <strong>{e.description}</strong>
                                    <span className="muted">
                                        {formatDate(e.expense_date)} · pagato da{' '}
                                        {e.paid_by === me.id ? 'te' : e.paid_by_name}
                                    </span>
                                </div>
                                <span className="amount">{formatEuro(e.amount)}</span>
                            </div>

                            {e.category === 'rimborso' ? (
                                <span className="badge">Rimborso</span>
                            ) : (
                                e.category && <span className="badge">{e.category}</span>
                            )}

                            <span className="muted">
                                {e.shares.map((s) => `${s.name} ${formatEuro(s.amount)}`).join(' · ')}
                            </span>

                            {canDelete && (
                                <div className="actions">
                                    <button className="danger" onClick={() => handleDelete(e)}>
                                        Elimina
                                    </button>
                                </div>
                            )}
                        </li>
                    );
                })}
            </ul>
        </section>
    );
}