import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../hooks/useApi'
import './Auth.css'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [needs2FA, setNeeds2FA] = useState(false)
  const [otpEmail, setOtpEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [devOtp, setDevOtp] = useState('')

  const handleSubmit = async e => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      const res = await api.post('/auth/login', { email: form.email, password: form.password })
      if (res.data.requires2FA) {
        setNeeds2FA(true)
        setOtpEmail(form.email)
        setDevOtp(res.data.devOtp || '')
      } else {
        localStorage.setItem('bt_token', res.data.token)
        window.location.href = '/dashboard'
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid email or password')
    } finally { setLoading(false) }
  }

  const handleVerify2FA = async e => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      const res = await api.post('/auth/login/2fa', { email: otpEmail, code: otp })
      localStorage.setItem('bt_token', res.data.token)
      window.location.href = '/dashboard'
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid code')
    } finally { setLoading(false) }
  }

  if (needs2FA) return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-left-logo">
          <div className="auth-left-logo-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 2L4 6v6c0 5.25 3.5 10.15 8 11.35C16.5 22.15 20 17.25 20 12V6l-8-4z" fill="white"/></svg>
          </div>
          <span>BitForge</span>
        </div>
        <h2>Two-factor authentication</h2>
        <p>A 6-digit verification code has been sent to your email address for security.</p>
      </div>
      <div className="auth-right">
        <div className="auth-card fade-up">
          <div style={{fontSize:40,marginBottom:16,textAlign:'center'}}>🔐</div>
          <h1 style={{textAlign:'center'}}>Enter your code</h1>
          <p className="auth-sub" style={{textAlign:'center'}}>
            We sent a 6-digit code to <strong>{otpEmail}</strong>
          </p>
          {devOtp && (
            <div className="success-box" style={{textAlign:'center'}}>
              Dev mode code: <strong>{devOtp}</strong>
            </div>
          )}
          {error && <div className="error-box">{error}</div>}
          <form onSubmit={handleVerify2FA} className="form">
            <div className="field">
              <label>Verification code</label>
              <input
                type="text" maxLength={6} required
                placeholder="000000"
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g,''))}
                style={{fontSize:24,letterSpacing:'0.3em',textAlign:'center',fontFamily:'var(--font-display)',fontWeight:700}}
                autoFocus
              />
            </div>
            <button type="submit" className="btn btn-primary auth-submit" disabled={loading||otp.length!==6}>
              {loading ? <span className="spinner" style={{width:18,height:18,borderTopColor:'white'}}/> : 'Verify →'}
            </button>
          </form>
          <p className="auth-switch">
            <button style={{background:'none',border:'none',color:'var(--blue)',cursor:'pointer',fontSize:13,fontWeight:600}} onClick={()=>setNeeds2FA(false)}>
              ← Back to login
            </button>
          </p>
        </div>
      </div>
    </div>
  )

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
          {['Real-time market data','KYC verified accounts','MoonPay crypto purchases','2FA security'].map(f=>(
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
                value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))}/>
            </div>
            <div className="field">
              <label>Password</label>
              <input type="password" required placeholder="••••••••"
                value={form.password} onChange={e=>setForm(p=>({...p,password:e.target.value}))}/>
            </div>
            <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
              {loading?<span className="spinner" style={{width:18,height:18,borderTopColor:'white'}}/>:'Sign in'}
            </button>
          </form>
          <p className="auth-switch">Don't have an account? <Link to="/register">Create one →</Link></p>
        </div>
      </div>
    </div>
  )
}
