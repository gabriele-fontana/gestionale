import { formatEuro, formatEuroSigned } from '../utils/format';

export default function BalanceSummary({ data, meId, onSettle }) {
    const { balances, transfers } = data;

    // Nascondi chi è stato disattivato e non ha più saldo
    const visible = balances.filter((b) => b.isActive || b.balance !== 0);

    return (
        <div className="card">
            <h2>Saldi</h2>

            <ul className="balance-list">
                {visible.map((b) => (
                    <li key={b.userId}>
                        <span>
                            {b.name}
                            {b.userId === meId && ' (tu)'}
                            {!b.isActive && ' · disattivato'}
                        </span>
                        <span
                            className={b.balance > 0 ? 'positive' : b.balance < 0 ? 'negative' : 'muted'}
                        >
                            {formatEuroSigned(b.balance)}
                        </span>
                    </li>
                ))}
            </ul>

            {transfers.length === 0 ? (
                <p className="muted">Siete pari, nessun debito 🎉</p>
            ) : (
                transfers.map((t) => {
                    const iPay = t.fromUserId === meId;
                    return (
                        <div className="transfer" key={`${t.fromUserId}-${t.toUserId}`}>
                            <span>
                                <strong>{iPay ? 'Tu' : t.fromName}</strong> {iPay ? 'devi' : 'deve'}{' '}
                                <strong>{formatEuro(t.amount)}</strong> a{' '}
                                <strong>{t.toUserId === meId ? 'te' : t.toName}</strong>
                            </span>
                            {iPay && (
                                <button className="secondary" onClick={() => onSettle(t)}>
                                    Segna come pagato
                                </button>
                            )}
                        </div>
                    );
                })
            )}
        </div>
    );
}