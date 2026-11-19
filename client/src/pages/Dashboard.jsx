import { useAuth } from '../context/AuthContext';
import NotesCard from '../components/dashboard/NotesCard';
import BalanceCard from '../components/dashboard/BalanceCard';
import ShoppingCard from '../components/dashboard/ShoppingCard';
import RecentExpensesCard from '../components/dashboard/RecentExpensesCard';

export default function Dashboard() {
    const { user } = useAuth();

    return (
        <section className="stack">
            <h1>Ciao {user.name}</h1>
            <NotesCard />
            <BalanceCard />
            <ShoppingCard />
            <RecentExpensesCard />
        </section>
    );
}