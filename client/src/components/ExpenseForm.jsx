import { useState } from 'react';
import api from '../services/api';
import { formatEuro } from '../utils/format';

const CATEGORIES = ['Spesa', 'Bollette', 'Affitto', 'Casa', 'Ristorante', 'Altro'];

function today() {
    const d = new Date();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${d.getFullYear()}-${month}-${day}`;
}

export default function ExpenseForm({ users, meId, onCreated, onCancel }) {
    const activeUsers = users.filter((u) => u.is_active);

    const [form, setForm] = useState({
        description: '',
        amount: '',
        expenseDate: today(),
        category: 'Spesa',
        paidBy: meId,
    });
    const [participants, setParticipants] = useState(
        () => new Set(activeUsers.map((u) => u.id))
    );
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    function handleChange(e) {
        setForm({ ...form, [e.target.name]: e.target.value });
    }

    function toggleParticipant(id) {
        setParticipants((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');

        if (participants.size === 0) {
            setError('Seleziona almeno una persona con cui dividere');
            return;
        }

        setSubmitting(true);
        try {
            await api.post('/expenses', {
                description: form.description,
                amount: form.amount,
                category: form.category,
                expenseDate: form.expenseDate,
                paidBy: Number(form.paidBy),
                participants: [...participants],
            });
            await onCreated();
        } catch (err) {
            setError(err.response?.data?.error || 'Errore del server');
            setSubmitting(false);
        }
    }

    const amountNumber = Number(form.amount);
    const perPerson =
        amountNumber > 0 && participants.size > 0 ? amountNumber / participants.size : null;

    return (
        <form className="panel" onSubmit={handleSubmit}>
            <label>
                Descrizione
                <input
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    placeholder="Es. Spesa al supermercato"
                    required
                />
            </label>

            <label>
                Importo (€)
                <input
                    type="number"
                    name="amount"
                    value={form.amount}
                    onChange={handleChange}
                    step="0.01"
                    min="0.01"
                    inputMode="decimal"
                    required
                />
            </label>

            <label>
                Data
                <input
                    type="date"
                    name="expenseDate"
                    value={form.expenseDate}
                    onChange={handleChange}
                    required
                />
            </label>

            <label>
                Categoria
                <select name="category" value={form.category} onChange={handleChange}>
                    {CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                            {c}
                        </option>
                    ))}
                </select>
            </label>

            <label>
                Pagato da
                <select name="paidBy" value={form.paidBy} onChange={handleChange}>
                    {activeUsers.map((u) => (
                        <option key={u.id} value={u.id}>
                            {u.name}
                            {u.id === meId ? ' (tu)' : ''}
                        </option>
                    ))}
                </select>
            </label>

            <fieldset>
                <legend>Dividi tra</legend>
                {activeUsers.map((u) => (
                    <label key={u.id} className="check-row">
                        <input
                            type="checkbox"
                            checked={participants.has(u.id)}
                            onChange={() => toggleParticipant(u.id)}
                        />
                        {u.name}
                        {u.id === meId ? ' (tu)' : ''}
                    </label>
                ))}
            </fieldset>

            {perPerson && <p className="muted">≈ {formatEuro(perPerson)} a testa</p>}
            {error && <p className="error">{error}</p>}

            <div className="actions">
                <button type="button" className="secondary" onClick={onCancel}>
                    Annulla
                </button>
                <button type="submit" disabled={submitting}>
                    {submitting ? 'Salvataggio...' : 'Salva spesa'}
                </button>
            </div>
        </form>
    );
}