import { useEffect, useRef, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const TABS = [
  { to: '/employees', label: 'Employees' },
  { to: '/attendance', label: 'Attendance' },
  { to: '/time-off', label: 'Time Off' },
];

function initials(name = '') {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

export function Navbar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Close the avatar dropdown on outside click, same as any real app menu.
  useEffect(() => {
    function handleClick(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = () => {
    setMenuOpen(false);
    signOut();
    navigate('/sign-in', { replace: true });
  };

  return (
    <header className="navbar">
      <div className="navbar__brand">HRMS</div>

      <nav className="navbar__tabs">
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) => `navbar__tab${isActive ? ' navbar__tab--active' : ''}`}
          >
            {tab.label}
          </NavLink>
        ))}
      </nav>

      <div className="navbar__menu" ref={menuRef}>
        <button
          type="button"
          className="navbar__avatar-btn"
          onClick={() => setMenuOpen((open) => !open)}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
        >
          <span className="navbar__avatar">{initials(user?.name)}</span>
        </button>

        {menuOpen && (
          <div className="navbar__dropdown" role="menu">
            <div className="navbar__dropdown-header">
              <div className="navbar__dropdown-name">{user?.name}</div>
              <div className="navbar__dropdown-code">{user?.employeeCode}</div>
            </div>
            <button
              type="button"
              role="menuitem"
              className="navbar__dropdown-item"
              onClick={() => {
                setMenuOpen(false);
                navigate('/profile');
              }}
            >
              My Profile
            </button>
            <button type="button" role="menuitem" className="navbar__dropdown-item" onClick={handleLogout}>
              Log Out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
