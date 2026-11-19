import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

export default function ShoppingCard() {
    const [items, setItems] = useState(null);
    const [error, setError] = useState(false);

    useEffect(() => {
        api
            .get('/shopping')
            .then((res) => setItems(res.data.filter((i) => !i.purchased)))
            .catch(() => setError(true));
    }, []);

    const preview = items ? items.slice(0, 4) : [];
    const extra = items ? items.length - preview.length : 0;

    return (
        <div className="card">
            <h2>Lista della spesa</h2>

            {error && <p className="error">Impossibile caricare la lista</p>}
            {!items && !error && <p className="muted">Caricamento...</p>}
            {items && items.length === 0 && <p className="muted">Niente da comprare 👍</p>}

            {items && items.length > 0 && (
                <>
                    <p>
                        <strong>{items.length}</strong>{' '}
                        {items.length === 1 ? 'articolo' : 'articoli'} da comprare
                    </p>
                    <p className="muted">
                        {preview.map((i) => i.item).join(', ')}
                        {extra > 0 && ` e altri ${extra}`}
                    </p>
                </>
            )}

            <Link to="/shopping" className="card-link">
                Apri la lista →
            </Link>
        </div>
    );
}