import { useState } from 'react'
import Sidebar from '../components/Sidebar'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import api from '../hooks/useApi'

export default function Settings() {
  const { user, refreshUser } = useAuth()
  const { dark, toggle } = useTheme()
  const [form, setForm] = useState({ firstName:user?.firstName||'', lastName:user?.lastName||'', phone:user?.phone||'' })
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [twoFALoading, setTwoFALoading] = useState(false)
  const [showOTPBox, setShowOTPBox] = useState(false)
  const [otp, setOtp] = useState('')
  const [otpError, setOtpError] = useState('')
  const [devOtp, setDevOtp] = useState('')
  const set = k => e => setForm(p=>({...p,[k]:e.target.value}))

  const handleSave = async e => {
    e.preventDefault(); setSaved(false); setError(''); setLoading(true)
    try {
      await api.patch('/user/profile', form)
      await refreshUser()
      setSaved(true); setTimeout(()=>setSaved(false),3000)
    } catch { setError('Update failed') } finally { setLoading(false) }
  }

  const handleEnable2FA = async () => {
    setTwoFALoading(true); setOtpError('')
    try {
      const res = await api.post('/2fa/send')
      setDevOtp(res.data.devOtp || '')
      setShowOTPBox(true)
    } catch { setOtpError('Failed to send code') } finally { setTwoFALoading(false) }
  }

  const handleVerifyOTP = async () => {
    setTwoFALoading(true); setOtpError('')
    try {
      await api.post('/2fa/verify', { code: otp })
      await refreshUser()
      setShowOTPBox(false); setOtp(''); setDevOtp('')
    } catch (err) { setOtpError(err.response?.data?.error || 'Invalid code') }
    finally { setTwoFALoading(false) }
  }

  const handleToggle2FA = async () => {
    setTwoFALoading(true)
    try {
      await api.post('/2fa/toggle')
      await refreshUser()
    } catch { } finally { setTwoFALoading(false) }
  }

  return (
    <div className="layout">
      <Sidebar/>
      <main className="main-content fade-up">
        <div className="page-hdr"><h1>Settings</h1></div>
        <div style={{maxWidth:620,display:'flex',flexDirection:'column',gap:16}}>

          {/* Profile */}
          <div className="card">
            <h2 style={{fontSize:16,fontWeight:700,marginBottom:20,paddingBottom:14,borderBottom:'1px solid var(--border)'}}>Profile</h2>
            {error && <div className="error-box">{error}</div>}
            {saved && <div className="success-box">✓ Profile updated successfully</div>}
            <form onSubmit={handleSave} className="form">
              <div className="field-row">
                <div className="field"><label>First name</label><input value={form.firstName} onChange={set('firstName')}/></div>
                <div className="field"><label>Last name</label><input value={form.lastName} onChange={set('lastName')}/></div>
              </div>
              <div className="field"><label>Email</label><input value={user?.email||''} disabled style={{opacity:0.5}}/></div>
              <div className="field"><label>Phone</label><input value={form.phone} onChange={set('phone')} placeholder="+1 555 000 0000"/></div>
              <button type="submit" className="btn btn-primary" disabled={loading} style={{alignSelf:'flex-start',minWidth:120}}>
                {loading?<span className="spinner" style={{width:16,height:16,borderTopColor:'white'}}/>:'Save changes'}
              </button>
            </form>
          </div>

          {/* Appearance */}
          <div className="card">
            <h2 style={{fontSize:16,fontWeight:700,marginBottom:20,paddingBottom:14,borderBottom:'1px solid var(--border)'}}>Appearance</h2>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <div>
                <div style={{fontWeight:600,fontSize:14}}>Dark mode</div>
                <div style={{fontSize:12,color:'var(--text2)',marginTop:3}}>Switch between light and dark theme</div>
              </div>
              <button onClick={toggle} className="btn btn-ghost btn-sm">
                {dark ? '☀️ Switch to Light' : '🌙 Switch to Dark'}
              </button>
            </div>
          </div>

          {/* 2FA */}
          <div className="card">
            <h2 style={{fontSize:16,fontWeight:700,marginBottom:20,paddingBottom:14,borderBottom:'1px solid var(--border)'}}>Two-Factor Authentication</h2>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',gap:16}}>
              <div>
                <div style={{fontWeight:600,fontSize:14}}>2FA via Email</div>
                <div style={{fontSize:12,color:'var(--text2)',marginTop:3,lineHeight:1.6}}>
                  Require a 6-digit code sent to your email every time you sign in.
                </div>
                <div style={{marginTop:8}}>
                  <span className={`tag ${user?.twoFAEnabled?'tag-green':'tag-red'}`}>
                    {user?.twoFAEnabled ? '✓ Enabled' : '✗ Disabled'}
                  </span>
                </div>
              </div>
              <div>
                {!user?.twoFAEnabled ? (
                  <button className="btn btn-primary btn-sm" onClick={handleEnable2FA} disabled={twoFALoading}>
                    {twoFALoading?<span className="spinner" style={{width:14,height:14,borderTopColor:'white'}}/>:'Enable 2FA'}
                  </button>
                ) : (
                  <button className="btn btn-danger btn-sm" onClick={handleToggle2FA} disabled={twoFALoading}>
                    {twoFALoading?<span className="spinner" style={{width:14,height:14}}/>:'Disable 2FA'}
                  </button>
                )}
              </div>
            </div>

            {showOTPBox && (
              <div style={{marginTop:20,padding:20,background:'var(--bg)',borderRadius:'var(--radius-lg)',border:'1px solid var(--border)'}}>
                <div style={{fontSize:14,fontWeight:600,marginBottom:8}}>Enter verification code</div>
                {devOtp && <div className="success-box">Dev mode code: <strong>{devOtp}</strong></div>}
                {otpError && <div className="error-box">{otpError}</div>}
                <div style={{display:'flex',gap:10,alignItems:'center'}}>
                  <input
                    type="text" maxLength={6} placeholder="000000" value={otp}
                    onChange={e=>setOtp(e.target.value.replace(/\D/g,''))}
                    style={{maxWidth:140,fontSize:18,letterSpacing:'0.2em',textAlign:'center',fontWeight:700}}
                  />
                  <button className="btn btn-primary btn-sm" onClick={handleVerifyOTP} disabled={otp.length!==6||twoFALoading}>
                    Verify
                  </button>
                  <button className="btn btn-ghost btn-sm" onClick={()=>{setShowOTPBox(false);setOtp('')}}>Cancel</button>
                </div>
              </div>
            )}
          </div>

          {/* Account info */}
          <div className="card">
            <h2 style={{fontSize:16,fontWeight:700,marginBottom:20,paddingBottom:14,borderBottom:'1px solid var(--border)'}}>Account Details</h2>
            {[
              ['Account number', user?.accountNumber],
              ['Member since', new Date(user?.createdAt).toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})],
              ['KYC status', user?.kycStatus==='approved'?'✓ Verified':user?.kycStatus==='under_review'?'Under Review':'Not verified'],
              ['2FA status', user?.twoFAEnabled?'✓ Enabled':'Disabled'],
              ['Account type', user?.role==='admin'?'Administrator':'Standard user'],
            ].map(([k,v]) => (
              <div key={k} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 0',borderBottom:'1px solid var(--border)',fontSize:14}}>
                <span style={{color:'var(--text2)'}}>{k}</span>
                <span style={{fontWeight:600}}>{v}</span>
              </div>
            ))}
          </div>

          {/* Security info */}
          <div className="card" style={{background:'var(--blue-light)',border:'1px solid var(--blue-mid)'}}>
            <h2 style={{fontSize:15,fontWeight:700,color:'var(--blue)',marginBottom:10}}>🔒 Security</h2>
            <p style={{fontSize:13,color:'var(--text2)',lineHeight:1.7}}>
              Passwords hashed with bcrypt (12 rounds). JWT tokens expire in 7 days.
              MoonPay payments signed with HMAC-SHA256. 2FA codes expire in 10 minutes.
              All data encrypted at rest in MongoDB Atlas.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
