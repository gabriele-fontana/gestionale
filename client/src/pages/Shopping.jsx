import { useCallback, useEffect, useState } from 'react';
import api from '../services/api';

function ItemRow({ item, onToggle, onDelete }) {
    return (
        <li className="item-row">
            <label className="check-row item-label">
                <input
                    type="checkbox"
                    checked={item.purchased}
                    onChange={() => onToggle(item)}
                />
                <div>
                    <span className="item-text">{item.item}</span>
                    {item.added_by_name && (
                        <span className="item-sub">aggiunto da {item.added_by_name}</span>
                    )}
                </div>
            </label>
            <button
                className="icon-btn"
                onClick={() => onDelete(item)}
                aria-label={`Elimina ${item.item}`}
            >
                ✕
            </button>
        </li>
    );
}

export default function Shopping() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [newItem, setNewItem] = useState('');
    const [adding, setAdding] = useState(false);

    const loadItems = useCallback(async () => {
        try {
            const { data } = await api.get('/shopping');
            setItems(data);
            setError('');
        } catch (err) {
            setError(err.response?.data?.error || 'Errore nel caricamento');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadItems();
    }, [loadItems]);

    async function handleAdd(e) {
        e.preventDefault();
        if (!newItem.trim()) return;
        setAdding(true);
        setError('');
        try {
            await api.post('/shopping', { item: newItem });
            setNewItem('');
            await loadItems();
        } catch (err) {
            setError(err.response?.data?.error || 'Errore del server');
        } finally {
            setAdding(false);
        }
    }

    async function handleToggle(item) {
        const purchased = !item.purchased;
        setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, purchased } : i)));
        try {
            await api.patch(`/shopping/${item.id}`, { purchased });
        } catch (err) {
            setError(err.response?.data?.error || 'Errore del server');
            await loadItems();
        }
    }

    async function handleDelete(item) {
        setItems((prev) => prev.filter((i) => i.id !== item.id));
        try {
            await api.delete(`/shopping/${item.id}`);
        } catch (err) {
            setError(err.response?.data?.error || 'Errore del server');
            await loadItems();
        }
    }

    async function handleClearBought() {
        if (!window.confirm('Rimuovere tutti gli articoli già comprati?')) return;
        try {
            await api.delete('/shopping/purchased');
            setItems((prev) => prev.filter((i) => !i.purchased));
        } catch (err) {
            setError(err.response?.data?.error || 'Errore del server');
        }
    }

    const toBuy = items.filter((i) => !i.purchased);
    const bought = items.filter((i) => i.purchased);

    return (
        <section className="stack">
            <h1>Lista della spesa</h1>

            <form className="add-item" onSubmit={handleAdd}>
                <input
                    value={newItem}
                    onChange={(e) => setNewItem(e.target.value)}
                    placeholder="Aggiungi un articolo"
                    maxLength={150}
                    aria-label="Nuovo articolo"
                />
                <button type="submit" disabled={adding}>
                    Aggiungi
                </button>
            </form>

            {error && <p className="error">{error}</p>}
            {loading && <p className="muted">Caricamento...</p>}
            {!loading && items.length === 0 && <p className="muted">La lista è vuota.</p>}

            {toBuy.length > 0 && (
                <ul className="item-list">
                    {toBuy.map((item) => (
                        <ItemRow key={item.id} item={item} onToggle={handleToggle} onDelete={handleDelete} />
                    ))}
                </ul>
            )}

            {bought.length > 0 && (
                <>
                    <div className="section-head">
                        <h2>Già comprati</h2>
                        <button className="secondary small" onClick={handleClearBought}>
                            Svuota
                        </button>
                    </div>
                    <ul className="item-list bought">
                        {bought.map((item) => (
                            <ItemRow key={item.id} item={item} onToggle={handleToggle} onDelete={handleDelete} />
                        ))}
                    </ul>
                </>
            )}
        </section>
    );
}