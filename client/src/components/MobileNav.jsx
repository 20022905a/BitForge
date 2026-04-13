import { NavLink } from 'react-router-dom'

const ITEMS = [
  { to: '/dashboard', icon: '▦', label: 'Home' },
  { to: '/markets',   icon: '◈', label: 'Markets' },
  { to: '/buy',       icon: '+', label: 'Buy' },
  { to: '/wallet',    icon: '◉', label: 'Wallet' },
  { to: '/settings',  icon: '⚙', label: 'Settings' },
]

export default function MobileNav() {
  return (
    <nav className="mobile-nav">
      {ITEMS.map(({ to, icon, label }) => (
        <NavLink key={to} to={to} className={({ isActive }) => `mobile-nav-item ${isActive ? 'active' : ''}`}>
          <span>{icon}</span>
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
