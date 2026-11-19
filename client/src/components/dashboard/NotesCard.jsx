import { useCallback, useEffect, useState } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { formatDateTime } from '../../utils/format';

export default function NotesCard() {
    const { user: me } = useAuth();
    const [notes, setNotes] = useState(null);
    const [text, setText] = useState('');
    const [error, setError] = useState('');
    const [sending, setSending] = useState(false);

    const loadNotes = useCallback(async () => {
        try {
            const { data } = await api.get('/notes');
            setNotes(data);
        } catch (err) {
            setError(err.response?.data?.error || 'Errore nel caricamento');
        }
    }, []);

    useEffect(() => {
        loadNotes();
    }, [loadNotes]);

    async function handleSubmit(e) {
        e.preventDefault();
        if (!text.trim()) return;
        setSending(true);
        setError('');
        try {
            await api.post('/notes', { content: text });
            setText('');
            await loadNotes();
        } catch (err) {
            setError(err.response?.data?.error || 'Errore del server');
        } finally {
            setSending(false);
        }
    }

    async function handleDelete(note) {
        try {
            await api.delete(`/notes/${note.id}`);
            setNotes((prev) => prev.filter((n) => n.id !== note.id));
        } catch (err) {
            setError(err.response?.data?.error || 'Errore del server');
        }
    }

    return (
        <div className="card">
            <h2>Bacheca</h2>

            <form className="note-form" onSubmit={handleSubmit}>
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Scrivi un avviso per i coinquilini..."
                    rows={2}
                    maxLength={500}
                    aria-label="Nuova nota"
                />
                <button type="submit" disabled={sending}>
                    Pubblica
                </button>
            </form>

            {error && <p className="error">{error}</p>}
            {notes === null && !error && <p className="muted">Caricamento...</p>}
            {notes && notes.length === 0 && <p className="muted">Nessun avviso per ora.</p>}

            {notes &&
                notes.map((n) => (
                    <div key={n.id} className="note">
                        <div>
                            <p className="note-text">{n.content}</p>
                            <span className="note-meta">
                                {n.created_by === me.id ? 'Tu' : n.author_name || 'Ex coinquilino'} ·{' '}
                                {formatDateTime(n.created_ts)}
                            </span>
                        </div>
                        {(n.created_by === me.id || me.role === 'admin') && (
                            <button
                                className="icon-btn"
                                onClick={() => handleDelete(n)}
                                aria-label="Elimina nota"
                            >
                                ✕
                            </button>
                        )}
                    </div>
                ))}
        </div>
    );
}