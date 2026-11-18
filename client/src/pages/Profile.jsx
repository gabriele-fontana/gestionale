import { useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
    const { user, logout } = useAuth();
    const [form, setForm] = useState({ currentPassword: '', newPassword: '' });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [submitting, setSubmitting] = useState(false);

    function handleChange(e) {
        setForm({ ...form, [e.target.name]: e.target.value });
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');
        setSuccess('');
        setSubmitting(true);
        try {
            await api.patch('/users/me/password', form);
            setSuccess('Password aggiornata');
            setForm({ currentPassword: '', newPassword: '' });
        } catch (err) {
            setError(err.response?.data?.error || 'Errore del server');
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <section>
            <h1>Profilo</h1>

            <div className="card">
                <div className="info">
                    <strong>{user.name}</strong>
                    <span className="muted">{user.email}</span>
                    <span className={`badge ${user.role}`}>
                        {user.role === 'admin' ? 'Amministratore' : 'Utente'}
                    </span>
                </div>
            </div>

            <h2>Cambia password</h2>
            <form className="panel" onSubmit={handleSubmit}>
                <label>
                    Password attuale
                    <input
                        type="password"
                        name="currentPassword"
                        value={form.currentPassword}
                        onChange={handleChange}
                        required
                    />
                </label>
                <label>
                    Nuova password (min. 8 caratteri)
                    <input
                        type="password"
                        name="newPassword"
                        value={form.newPassword}
                        onChange={handleChange}
                        minLength={8}
                        required
                    />
                </label>
                {error && <p className="error">{error}</p>}
                {success && <p className="success">{success}</p>}
                <button type="submit" disabled={submitting}>
                    {submitting ? 'Salvataggio...' : 'Aggiorna password'}
                </button>
            </form>

            <button className="danger logout" onClick={logout}>
                Esci
            </button>
        </section>
    );
}