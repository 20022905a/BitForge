import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Auth.css'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ firstName:'', lastName:'', email:'', phone:'', password:'', confirm:'' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const set = k => e => setForm(p => ({...p, [k]: e.target.value}))

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm) return setError('Passwords do not match')
    if (form.password.length < 8) return setError('Password must be at least 8 characters')
    setLoading(true)
    try {
      await register({ firstName:form.firstName, lastName:form.lastName, email:form.email, phone:form.phone, password:form.password })
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed')
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
        <h2>Your crypto journey starts here</h2>
        <p>Create a secure wallet in under 2 minutes. No hidden fees. No surprises.</p>
        <div className="auth-left-features">
          {['Free to create', 'Instant KYC verification', 'Buy crypto immediately', '150+ countries supported'].map(f => (
            <div key={f} className="auth-feature"><div className="auth-feature-dot"/>{f}</div>
          ))}
        </div>
      </div>
      <div className="auth-right">
        <div className="auth-card fade-up" style={{maxWidth:440}}>
          <h1>Create account</h1>
          <p className="auth-sub">Start managing crypto in minutes</p>
          {error && <div className="error-box">{error}</div>}
          <form onSubmit={handleSubmit} className="form">
            <div className="field-row">
              <div className="field"><label>First name</label><input required placeholder="John" value={form.firstName} onChange={set('firstName')} /></div>
              <div className="field"><label>Last name</label><input required placeholder="Doe" value={form.lastName} onChange={set('lastName')} /></div>
            </div>
            <div className="field"><label>Email address</label><input type="email" required placeholder="you@example.com" value={form.email} onChange={set('email')} /></div>
            <div className="field"><label>Phone (optional)</label><input type="tel" placeholder="+1 555 000 0000" value={form.phone} onChange={set('phone')} /></div>
            <div className="field"><label>Password</label><input type="password" required placeholder="At least 8 characters" value={form.password} onChange={set('password')} /></div>
            <div className="field"><label>Confirm password</label><input type="password" required placeholder="••••••••" value={form.confirm} onChange={set('confirm')} /></div>
            <p className="auth-terms">By creating an account you confirm this is an educational project and not real financial services.</p>
            <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
              {loading ? <span className="spinner" style={{width:18,height:18,borderTopColor:'white'}}/> : 'Create account'}
            </button>
          </form>
          <p className="auth-switch">Already have an account? <Link to="/login">Sign in →</Link></p>
        </div>
      </div>
    </div>
  )
}
