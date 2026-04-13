import { Link } from 'react-router-dom'
import './Landing.css'

const COINS = [
  { name: 'Bitcoin', sym: 'BTC', color: '#F7931A', change: '+2.4%', up: true },
  { name: 'Ethereum', sym: 'ETH', color: '#627EEA', change: '+1.8%', up: true },
  { name: 'Solana', sym: 'SOL', color: '#9945FF', change: '+5.2%', up: true },
  { name: 'XRP', sym: 'XRP', color: '#00AAE4', change: '-0.9%', up: false },
]

const FEATURES = [
  { icon: '🔒', title: 'Bank-Grade Security', desc: 'AES-256 encryption, biometric auth, and 2FA keep your assets safe.' },
  { icon: '📊', title: 'Real-Time Markets', desc: 'Live prices for 8000+ cryptocurrencies updated every 30 seconds.' },
  { icon: '✅', title: 'KYC Verified', desc: 'Fully compliant identity verification for regulated access.' },
  { icon: '⚡', title: 'Instant Purchases', desc: 'Buy crypto with your card or bank in under 2 minutes via MoonPay.' },
]

export default function Landing() {
  return (
    <div className="landing">
      <header className="land-nav">
        <div className="land-brand">
          <div className="land-logo">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L4 6v6c0 5.25 3.5 10.15 8 11.35C16.5 22.15 20 17.25 20 12V6l-8-4z" fill="white"/>
            </svg>
          </div>
          <span>BitForge</span>
        </div>
        <div className="land-nav-links">
          <Link to="/login" className="btn btn-outline btn-sm">Sign in</Link>
          <Link to="/register" className="btn btn-primary btn-sm">Get started</Link>
        </div>
      </header>

      <section className="hero">
        <div className="hero-badge">🛡️ Trusted by 2M+ users worldwide</div>
        <h1>The crypto wallet<br /><span className="hero-accent">built for everyone</span></h1>
        <p className="hero-sub">Buy, store, and track your crypto portfolio in one secure place. Real-time prices. Instant purchases. Full KYC compliance.</p>
        <div className="hero-cta">
          <Link to="/register" className="btn btn-primary btn-lg">Create free wallet</Link>
          <Link to="/login" className="btn btn-ghost btn-lg">Sign in</Link>
        </div>

        <div className="hero-ticker">
          {COINS.map(c => (
            <div key={c.sym} className="ticker-item">
              <div className="ticker-dot" style={{ background: c.color }} />
              <span className="ticker-sym">{c.sym}</span>
              <span className={`ticker-change ${c.up ? 'up-text' : 'down-text'}`}>{c.change}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="features-section">
        <h2>Everything you need to manage crypto</h2>
        <div className="features-grid">
          {FEATURES.map(f => (
            <div key={f.title} className="feature-card card">
              <div className="feature-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="land-cta-section">
        <div className="land-cta-card">
          <h2>Start your crypto journey today</h2>
          <p>Join millions of users who trust BitForge with their digital assets.</p>
          <Link to="/register" className="btn btn-primary btn-lg">Open free account →</Link>
        </div>
      </section>

      <footer className="land-footer">
        <p>© 2025 BitForge · Educational project · Not financial advice</p>
      </footer>
    </div>
  )
}
