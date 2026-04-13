import { useState } from 'react'
import Sidebar from '../components/Sidebar'
import { useAuth } from '../context/AuthContext'
import api from '../hooks/useApi'

export default function Settings() {
  const { user, refreshUser } = useAuth()
  const [form, setForm] = useState({ firstName:user?.firstName||'', lastName:user?.lastName||'', phone:user?.phone||'' })
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const set = k => e => setForm(p=>({...p,[k]:e.target.value}))

  const handleSave = async e => {
    e.preventDefault(); setSaved(false); setError(''); setLoading(true)
    try {
      await api.patch('/user/profile', form)
      await refreshUser()
      setSaved(true); setTimeout(()=>setSaved(false),3000)
    } catch { setError('Update failed') } finally { setLoading(false) }
  }

  return (
    <div className="layout">
      <Sidebar/>
      <main className="main-content fade-up">
        <div className="page-hdr"><h1>Settings</h1></div>
        <div style={{maxWidth:600,display:'flex',flexDirection:'column',gap:16}}>

          <div className="card">
            <h2 style={{fontSize:16,fontWeight:700,marginBottom:20,paddingBottom:14,borderBottom:'1px solid var(--border)'}}>Profile</h2>
            {error && <div className="error-box">{error}</div>}
            {saved && <div className="success-box">✓ Profile updated successfully</div>}
            <form onSubmit={handleSave} className="form">
              <div className="field-row">
                <div className="field"><label>First name</label><input value={form.firstName} onChange={set('firstName')}/></div>
                <div className="field"><label>Last name</label><input value={form.lastName} onChange={set('lastName')}/></div>
              </div>
              <div className="field"><label>Email</label><input value={user?.email||''} disabled style={{opacity:0.5,cursor:'not-allowed'}}/></div>
              <div className="field"><label>Phone</label><input value={form.phone} onChange={set('phone')} placeholder="+1 555 000 0000"/></div>
              <button type="submit" className="btn btn-primary" disabled={loading} style={{alignSelf:'flex-start',minWidth:120}}>
                {loading?<span className="spinner" style={{width:16,height:16,borderTopColor:'white'}}/>:'Save changes'}
              </button>
            </form>
          </div>

          <div className="card">
            <h2 style={{fontSize:16,fontWeight:700,marginBottom:20,paddingBottom:14,borderBottom:'1px solid var(--border)'}}>Account Details</h2>
            {[
              ['Account number', user?.accountNumber],
              ['Member since', new Date(user?.createdAt).toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'})],
              ['KYC status', user?.kycStatus==='approved'?'✓ Verified':user?.kycStatus==='under_review'?'Under Review':'Not verified'],
              ['Account type', user?.role==='admin'?'Administrator':'Standard user'],
            ].map(([k,v]) => (
              <div key={k} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'12px 0',borderBottom:'1px solid var(--border)',fontSize:14}}>
                <span style={{color:'var(--text2)'}}>{k}</span>
                <span style={{fontWeight:600,fontFamily:'var(--font-display)'}}>{v}</span>
              </div>
            ))}
          </div>

          <div className="card" style={{background:'var(--blue-light)',border:'1px solid var(--blue-mid)'}}>
            <h2 style={{fontSize:15,fontWeight:700,color:'var(--blue)',marginBottom:10}}>🔒 Security</h2>
            <p style={{fontSize:13,color:'var(--text2)',lineHeight:1.7}}>
              Your password is hashed with bcrypt (12 rounds). All API requests are signed with JWT tokens (7-day expiry). MoonPay payments are server-signed with HMAC-SHA256. Your data is encrypted at rest in MongoDB Atlas.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
