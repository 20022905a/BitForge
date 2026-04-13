import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import api from '../hooks/useApi'
import './AdminPanel.css'

const fmt = (n,d=2) => Number(n||0).toLocaleString('en-US',{minimumFractionDigits:d,maximumFractionDigits:d})

function StatCard({ label, value, color }) {
  return (
    <div className="card admin-stat">
      <div className="admin-stat-label">{label}</div>
      <div className="admin-stat-value" style={color?{color}:{}}>{value}</div>
    </div>
  )
}

function UsersTab({ users, onRefresh }) {
  const [selected, setSelected] = useState(null)
  const [balanceInput, setBalanceInput] = useState('')
  const [note, setNote] = useState('')
  const [updating, setUpdating] = useState(false)

  const updateBalance = async () => {
    if (!selected) return
    setUpdating(true)
    try {
      await api.patch(`/admin/users/${selected._id}/balance`, {
        cashBalanceUSD: parseFloat(balanceInput),
        note,
      })
      alert('✅ Balance updated!')
      setSelected(null); setBalanceInput(''); setNote('')
      onRefresh()
    } catch { alert('Failed') } finally { setUpdating(false) }
  }

  const toggleSuspend = async (user) => {
    try {
      await api.patch(`/admin/users/${user._id}/suspend`, { suspended: !user.suspended })
      onRefresh()
    } catch { alert('Failed') }
  }

  return (
    <div>
      <div className="card" style={{padding:0,overflow:'hidden',marginBottom:16}}>
        <div className="admin-table-head">
          <span>User</span><span>Account #</span><span>KYC</span><span>Balance</span><span>Status</span><span>Actions</span>
        </div>
        {users.map(u => (
          <div key={u._id} className="admin-table-row">
            <div>
              <div style={{fontWeight:600,fontSize:13}}>{u.firstName} {u.lastName}</div>
              <div style={{fontSize:11,color:'var(--text3)'}}>{u.email}</div>
            </div>
            <span style={{fontFamily:'var(--font-display)',fontSize:12}}>{u.accountNumber}</span>
            <span>
              <span className={`tag ${u.kycStatus==='approved'?'tag-green':u.kycStatus==='under_review'?'tag-orange':'tag-red'}`}>
                {u.kycStatus==='approved'?'Verified':u.kycStatus==='under_review'?'Pending':'None'}
              </span>
            </span>
            <span className="mono" style={{fontWeight:600}}>${fmt(u.cashBalanceUSD)}</span>
            <span>
              <span className={`tag ${u.suspended?'tag-red':'tag-green'}`}>{u.suspended?'Suspended':'Active'}</span>
            </span>
            <div style={{display:'flex',gap:6}}>
              <button className="btn btn-primary btn-sm" onClick={()=>{setSelected(u);setBalanceInput(u.cashBalanceUSD||0)}}>
                Edit
              </button>
              <button className={`btn btn-sm ${u.suspended?'btn-green':'btn-danger'}`} onClick={()=>toggleSuspend(u)}>
                {u.suspended?'Unsuspend':'Suspend'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <div className="admin-modal-overlay" onClick={()=>setSelected(null)}>
          <div className="admin-modal card" onClick={e=>e.stopPropagation()}>
            <h3 style={{marginBottom:20}}>Edit: {selected.firstName} {selected.lastName}</h3>
            <div className="form">
              <div className="field">
                <label>Cash Balance (USD)</label>
                <input type="number" value={balanceInput} onChange={e=>setBalanceInput(e.target.value)} placeholder="0.00"/>
              </div>
              <div className="field">
                <label>Note (internal)</label>
                <input value={note} onChange={e=>setNote(e.target.value)} placeholder="e.g. Admin adjustment"/>
              </div>
              <div style={{display:'flex',gap:10,marginTop:8}}>
                <button className="btn btn-primary" onClick={updateBalance} disabled={updating}>
                  {updating?<span className="spinner" style={{width:16,height:16,borderTopColor:'white'}}/>:'Update Balance'}
                </button>
                <button className="btn btn-ghost" onClick={()=>setSelected(null)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function KYCTab({ kycs, onRefresh }) {
  const [processing, setProcessing] = useState(null)
  const [rejectReason, setRejectReason] = useState('')
  const [rejectTarget, setRejectTarget] = useState(null)

  const approve = async (id) => {
    setProcessing(id)
    try {
      await api.patch(`/admin/kyc/${id}/approve`)
      onRefresh()
    } catch { alert('Failed') } finally { setProcessing(null) }
  }

  const reject = async () => {
    if (!rejectTarget) return
    setProcessing(rejectTarget)
    try {
      await api.patch(`/admin/kyc/${rejectTarget}/reject`, { reason: rejectReason })
      setRejectTarget(null); setRejectReason('')
      onRefresh()
    } catch { alert('Failed') } finally { setProcessing(null) }
  }

  const pending = kycs.filter(k=>k.status==='under_review')
  const reviewed = kycs.filter(k=>k.status!=='under_review')

  return (
    <div>
      <h2 style={{fontSize:16,fontWeight:700,marginBottom:14}}>Pending Review ({pending.length})</h2>
      {pending.length===0 ? (
        <div className="card"><div className="empty-state"><div className="empty-icon">✅</div><h3>All caught up!</h3><p>No KYC submissions pending review.</p></div></div>
      ) : (
        <div className="card" style={{padding:0,overflow:'hidden',marginBottom:24}}>
          <div className="admin-kyc-head">
            <span>User</span><span>Document</span><span>Submitted</span><span>Actions</span>
          </div>
          {pending.map(k => (
            <div key={k._id} className="admin-kyc-row">
              <div>
                <div style={{fontWeight:600,fontSize:13}}>{k.user?.firstName} {k.user?.lastName}</div>
                <div style={{fontSize:11,color:'var(--text3)'}}>{k.user?.email}</div>
              </div>
              <div>
                <div style={{fontSize:13,fontWeight:500}}>{k.documentType?.replace('_',' ')}</div>
                <div style={{fontSize:11,color:'var(--text3)'}}>#{k.documentNumber}</div>
              </div>
              <span style={{fontSize:12,color:'var(--text2)'}}>
                {new Date(k.submittedAt).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}
              </span>
              <div style={{display:'flex',gap:8}}>
                <button className="btn btn-green btn-sm" onClick={()=>approve(k._id)} disabled={processing===k._id}>
                  {processing===k._id?<span className="spinner" style={{width:14,height:14,borderTopColor:'white'}}/>:'✓ Approve'}
                </button>
                <button className="btn btn-danger btn-sm" onClick={()=>setRejectTarget(k._id)}>✗ Reject</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {reviewed.length > 0 && (
        <>
          <h2 style={{fontSize:16,fontWeight:700,marginBottom:14}}>Reviewed</h2>
          <div className="card" style={{padding:0,overflow:'hidden'}}>
            <div className="admin-kyc-head"><span>User</span><span>Document</span><span>Status</span><span>Date</span></div>
            {reviewed.map(k => (
              <div key={k._id} className="admin-kyc-row">
                <div><div style={{fontWeight:600,fontSize:13}}>{k.user?.firstName} {k.user?.lastName}</div></div>
                <div style={{fontSize:13}}>{k.documentType?.replace('_',' ')}</div>
                <span className={`tag ${k.status==='approved'?'tag-green':'tag-red'}`}>{k.status}</span>
                <span style={{fontSize:12,color:'var(--text2)'}}>
                  {k.reviewedAt?new Date(k.reviewedAt).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}):'—'}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {rejectTarget && (
        <div className="admin-modal-overlay" onClick={()=>setRejectTarget(null)}>
          <div className="admin-modal card" onClick={e=>e.stopPropagation()}>
            <h3 style={{marginBottom:16}}>Reject KYC</h3>
            <div className="field" style={{marginBottom:16}}>
              <label>Rejection reason</label>
              <input value={rejectReason} onChange={e=>setRejectReason(e.target.value)} placeholder="e.g. Document image unclear"/>
            </div>
            <div style={{display:'flex',gap:10}}>
              <button className="btn btn-danger" onClick={reject}>Confirm Rejection</button>
              <button className="btn btn-ghost" onClick={()=>setRejectTarget(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function AdminPanel() {
  const [tab, setTab] = useState('users')
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [kycs, setKycs] = useState([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    Promise.all([
      api.get('/admin/stats'),
      api.get('/admin/users'),
      api.get('/admin/kyc'),
    ]).then(([s,u,k]) => {
      setStats(s.data); setUsers(u.data.users); setKycs(k.data.kycs)
    }).catch(console.error).finally(()=>setLoading(false))
  }

  useEffect(()=>{ load() }, [])

  return (
    <div className="layout">
      <Sidebar/>
      <main className="main-content fade-up">
        <div className="page-hdr">
          <div>
            <h1>Admin Panel</h1>
            <p>Manage users, KYC approvals, and account settings</p>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={load}>↻ Refresh</button>
        </div>

        {loading ? (
          <div style={{display:'flex',justifyContent:'center',padding:80}}><div className="spinner"/></div>
        ) : (
          <>
            <div className="admin-stats">
              <StatCard label="Total Users" value={stats?.totalUsers||0}/>
              <StatCard label="KYC Pending" value={stats?.kycPending||0} color="var(--orange)"/>
              <StatCard label="KYC Approved" value={stats?.kycApproved||0} color="var(--up)"/>
              <StatCard label="Total Deposits" value={`$${fmt(stats?.totalPortfolio)}`} color="var(--blue)"/>
            </div>

            <div className="admin-tabs">
              {[['users','Users'],['kyc','KYC Review']].map(([id,label])=>(
                <button key={id} className={`admin-tab ${tab===id?'active':''}`} onClick={()=>setTab(id)}>
                  {label}
                  {id==='kyc' && stats?.kycPending>0 && (
                    <span className="admin-tab-badge">{stats.kycPending}</span>
                  )}
                </button>
              ))}
            </div>

            {tab==='users' && <UsersTab users={users} onRefresh={load}/>}
            {tab==='kyc'   && <KYCTab   kycs={kycs}   onRefresh={load}/>}
          </>
        )}
      </main>
    </div>
  )
}
