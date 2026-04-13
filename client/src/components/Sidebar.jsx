import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import './Sidebar.css'

const NAV = [
  { to: '/dashboard',    icon: '▦', label: 'Dashboard' },
  { to: '/markets',      icon: '◈', label: 'Markets' },
  { to: '/wallet',       icon: '◉', label: 'Wallet' },
  { to: '/portfolio',    icon: '◎', label: 'Portfolio' },
  { to: '/buy',          icon: '+', label: 'Buy Crypto' },
  { to: '/converter',    icon: '⇄', label: 'Converter' },
  { to: '/kyc',          icon: '✦', label: 'Verification' },
  { to: '/transactions', icon: '↕', label: 'Activity' },
  { to: '/settings',     icon: '⚙', label: 'Settings' },
]

export default function Sidebar() {
  const { user, logout } = useAuth()
  const { dark, toggle } = useTheme()
  const navigate = useNavigate()
  const handleLogout = () => { logout(); navigate('/') }
  const isAdmin = user?.role === 'admin'

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L4 6v6c0 5.25 3.5 10.15 8 11.35C16.5 22.15 20 17.25 20 12V6l-8-4z" fill="white"/>
          </svg>
        </div>
        <div>
          <div className="logo-name">BitForge</div>
          <div className="logo-sub">Web3 Wallet</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {NAV.map(({ to, icon, label }) => (
          <NavLink key={to} to={to} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <span className="nav-icon">{icon}</span>
            <span>{label}</span>
            {label === 'Verification' && user?.kycStatus === 'none' && (
              <span className="nav-dot" />
            )}
          </NavLink>
        ))}
        {isAdmin && (
          <NavLink to="/admin" className={({ isActive }) => `nav-item nav-admin ${isActive ? 'active' : ''}`}>
            <span className="nav-icon">◆</span>
            <span>Admin Panel</span>
          </NavLink>
        )}
      </nav>

      <div className="sidebar-theme">
        <button className="theme-toggle" onClick={toggle}>
          <span>{dark ? '☀️' : '🌙'}</span>
          <span>{dark ? 'Light mode' : 'Dark mode'}</span>
        </button>
      </div>

      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar">
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </div>
          <div className="user-details">
            <div className="user-name">{user?.firstName} {user?.lastName}</div>
            <div className="user-acct">{user?.accountNumber}</div>
          </div>
        </div>
        <button className="logout-btn" onClick={handleLogout} title="Sign out">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
          </svg>
        </button>
      </div>
    </aside>
  )
}
