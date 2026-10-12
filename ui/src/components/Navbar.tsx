import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useApi } from '../hooks/useApi';

export function Navbar() {
  const { user, logout } = useApi();
  const location = useLocation();

  const links = [
    { to: '/', label: '📖 Timeline', icon: '📖' },
    { to: '/create', label: '✨ New Memory', icon: '✨' },
    { to: '/moods', label: '🎭 Moods', icon: '🎭' },
    { to: '/year-in-review', label: '📊 Review', icon: '📊' },
    { to: '/capsules', label: '⏰ Capsules', icon: '⏰' },
  ];

  return (
    <nav className="navbar">
      <div className="nav-brand">
        <Link to="/" className="brand-link">💝 LoveLog</Link>
        {user && <span className="nav-subtitle">{user.name} & {user.partnerName}</span>}
      </div>
      <div className="nav-links">
        {links.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className={`nav-link ${location.pathname === link.to ? 'active' : ''}`}
          >
            {link.label}
          </Link>
        ))}
      </div>
      <div className="nav-user">
        {user && <span className="nav-greeting">👋 {user.name}</span>}
        <button onClick={logout} className="btn btn-ghost btn-sm">Logout</button>
      </div>
    </nav>
  );
}
