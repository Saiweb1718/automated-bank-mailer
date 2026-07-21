import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import Emails from './pages/Emails';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <div className="app-layout">
        <aside className="sidebar">
          <div className="sidebar-logo">
            <div className="logo-icon">✉</div>
            <div>
              <h2>BankMailer</h2>
              <span>Admin Panel</span>
            </div>
          </div>

          <nav className="sidebar-nav">
            <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <span className="nav-icon">📊</span> Dashboard
            </NavLink>
            <NavLink to="/customers" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <span className="nav-icon">👥</span> Customers
            </NavLink>
            <NavLink to="/emails" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
              <span className="nav-icon">📧</span> Notifications
            </NavLink>
          </nav>

          <div className="sidebar-footer">
            <p><span className="status-dot"></span>System Online</p>
          </div>
        </aside>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/emails" element={<Emails />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
