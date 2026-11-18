import { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const byName = (a, b) => a.name.localeCompare(b.name);

export default function Users() {
    const { user: me } = useAuth();
    const isAdmin = me.role === 'admin';

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ name: '', email: '', password: '' });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        api
            .get('/users')
            .then((res) => setUsers(res.data))
            .catch((err) =>
                setError(err.response?.data?.error || 'Errore nel caricamento')
            )
            .finally(() => setLoading(false));
    }, []);

    function handleChange(e) {
        setForm({ ...form, [e.target.name]: e.target.value });
    }

    async function handleCreate(e) {
        e.preventDefault();
        setError('');
        setSubmitting(true);
        try {
            const { data } = await api.post('/users', form);
            setUsers((prev) => [...prev, data].sort(byName));
            setForm({ name: '', email: '', password: '' });
            setShowForm(false);
        } catch (err) {
            setError(err.response?.data?.error || 'Errore del server');
        } finally {
            setSubmitting(false);
        }
    }

    async function handleToggleRole(target) {
        const newRole = target.role === 'admin' ? 'user' : 'admin';
        setError('');
        try {
            await api.patch(`/users/${target.id}`, { role: newRole });
            setUsers((prev) =>
                prev.map((u) => (u.id === target.id ? { ...u, role: newRole } : u))
            );
        } catch (err) {
            setError(err.response?.data?.error || 'Errore del server');
        }
    }

    async function handleDelete(target) {
        if (!window.confirm(`Eliminare ${target.name}?`)) return;
        setError('');
        try {
            await api.delete(`/users/${target.id}`);
            setUsers((prev) => prev.filter((u) => u.id !== target.id));
        } catch (err) {
            setError(err.response?.data?.error || 'Errore del server');
        }
    }

    return (
        <section>
            <h1>Coinquilini</h1>

            {error && <p className="error">{error}</p>}
            {loading && <p className="muted">Caricamento...</p>}

            <ul className="card-list">
                {users.map((u) => (
                    <li key={u.id} className="card">
                        <div className="info">
                            <strong>
                                {u.name}
                                {u.id === me.id && ' (tu)'}
                            </strong>
                            <span className="muted">{u.email}</span>
                            <span className={`badge ${u.role}`}>
                                {u.role === 'admin' ? 'Amministratore' : 'Utente'}
                            </span>
                        </div>

                        {isAdmin && u.id !== me.id && (
                            <div className="actions">
                                <button className="secondary" onClick={() => handleToggleRole(u)}>
                                    {u.role === 'admin' ? 'Rendi utente' : 'Rendi admin'}
                                </button>
                                <button className="danger" onClick={() => handleDelete(u)}>
                                    Elimina
                                </button>
                            </div>
                        )}
                    </li>
                ))}
            </ul>

            {isAdmin && (
                <div className="add-section">
                    {!showForm ? (
                        <button onClick={() => setShowForm(true)}>+ Aggiungi coinquilino</button>
                    ) : (
                        <form className="panel" onSubmit={handleCreate}>
                            <label>
                                Nome
                                <input name="name" value={form.name} onChange={handleChange} required />
                            </label>
                            <label>
                                Email
                                <input
                                    type="email"
                                    name="email"
                                    value={form.email}
                                    onChange={handleChange}
                                    required
                                />
                            </label>
                            <label>
                                Password provvisoria (min. 8 caratteri)
                                <input
                                    type="password"
                                    name="password"
                                    value={form.password}
                                    onChange={handleChange}
                                    minLength={8}
                                    required
                                />
                            </label>
                            <div className="actions">
                                <button type="button" className="secondary" onClick={() => setShowForm(false)}>
                                    Annulla
                                </button>
                                <button type="submit" disabled={submitting}>
                                    {submitting ? 'Creazione...' : 'Crea'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            )}
        </section>
    );
}