import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Auth.css'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async e => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      await login(form.email, form.password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid email or password')
    } finally { setLoading(false) }
  }

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-left-logo">
          <div className="auth-left-logo-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 2L4 6v6c0 5.25 3.5 10.15 8 11.35C16.5 22.15 20 17.25 20 12V6l-8-4z" fill="white"/></svg>
          </div>
          <span>BitForge</span>
        </div>
        <h2>Welcome back to your crypto wallet</h2>
        <p>Manage your digital assets securely from anywhere in the world.</p>
        <div className="auth-left-features">
          {['Real-time market data', 'KYC verified accounts', 'MoonPay crypto purchases', 'Bank-grade security'].map(f => (
            <div key={f} className="auth-feature"><div className="auth-feature-dot"/>{f}</div>
          ))}
        </div>
      </div>
      <div className="auth-right">
        <div className="auth-card fade-up">
          <h1>Sign in</h1>
          <p className="auth-sub">Enter your credentials to access your wallet</p>
          {error && <div className="error-box">{error}</div>}
          <form onSubmit={handleSubmit} className="form">
            <div className="field">
              <label>Email address</label>
              <input type="email" required autoFocus placeholder="you@example.com"
                value={form.email} onChange={e => setForm(p => ({...p, email: e.target.value}))} />
            </div>
            <div className="field">
              <label>Password</label>
              <input type="password" required placeholder="••••••••"
                value={form.password} onChange={e => setForm(p => ({...p, password: e.target.value}))} />
            </div>
            <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
              {loading ? <span className="spinner" style={{width:18,height:18,borderTopColor:'white'}}/> : 'Sign in'}
            </button>
          </form>
          <p className="auth-switch">Don't have an account? <Link to="/register">Create one →</Link></p>
        </div>
      </div>
    </div>
  )
}
