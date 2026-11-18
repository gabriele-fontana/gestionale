import { NavLink, Outlet } from 'react-router-dom';

export default function Layout() {
    return (
        <div className="app-shell">
            <main className="page">
                <Outlet />
            </main>

            <nav className="bottom-nav">
                <NavLink to="/" end>
                    <span className="icon">🏠</span>
                    Home
                </NavLink>
                <NavLink to="/users">
                    <span className="icon">👥</span>
                    Coinquilini
                </NavLink>
                <NavLink to="/profile">
                    <span className="icon">👤</span>
                    Profilo
                </NavLink>
            </nav>
        </div>
    );
}