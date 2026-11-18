import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
    const { user } = useAuth();

    return (
        <section>
            <h1>Ciao {user.name}</h1>
            <p className="muted">Qui compariranno spese, faccende e calendario.</p>
        </section>
    );
}