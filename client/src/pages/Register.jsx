import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
    const { register } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({
        name: '',
        email: '',
        password: '',
        apartmentName: '',
    });
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    function handleChange(e) {
        setForm({ ...form, [e.target.name]: e.target.value });
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');
        setSubmitting(true);
        try {
            await register(form);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.error || 'Impossibile contattare il server');
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <main className="auth-page">
            <h1>Crea il tuo appartamento</h1>
            <form onSubmit={handleSubmit}>
                <label>
                    Il tuo nome
                    <input name="name" value={form.name} onChange={handleChange} required />
                </label>
                <label>
                    Nome dell&apos;appartamento
                    <input
                        name="apartmentName"
                        value={form.apartmentName}
                        onChange={handleChange}
                        required
                    />
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
                    Password (min. 8 caratteri)
                    <input
                        type="password"
                        name="password"
                        value={form.password}
                        onChange={handleChange}
                        minLength={8}
                        required
                    />
                </label>
                {error && <p className="error">{error}</p>}
                <button type="submit" disabled={submitting}>
                    {submitting ? 'Creazione...' : 'Registrati'}
                </button>
            </form>
            <p>
                Hai già un account? <Link to="/login">Accedi</Link>
            </p>
        </main>
    );
}