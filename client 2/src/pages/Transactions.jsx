import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import api from '../hooks/useApi'

const fmt = (n,d=2) => Number(n||0).toLocaleString('en-US',{minimumFractionDigits:d,maximumFractionDigits:d})

const TYPE_META = {
  deposit:    { label:'Deposit',    cls:'tag-green' },
  withdrawal: { label:'Withdrawal', cls:'tag-red' },
  gain:       { label:'Gain',       cls:'tag-blue' },
  fee:        { label:'Fee',        cls:'tag-orange' },
}
const STATUS_META = {
  completed: { label:'Completed', color:'var(--up)' },
  pending:   { label:'Pending',   color:'var(--orange)' },
  failed:    { label:'Failed',    color:'var(--down)' },
}

export default function Transactions() {
  const [txns, setTxns] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    api.get('/user/transactions').then(r=>setTxns(r.data.transactions)).catch(console.error).finally(()=>setLoading(false))
  }, [])

  const filtered = filter==='all' ? txns : txns.filter(t=>t.type===filter)

  return (
    <div className="layout">
      <Sidebar/>
      <main className="main-content fade-up">
        <div className="page-hdr">
          <div><h1>Activity</h1><p>Your complete transaction history</p></div>
        </div>

        <div style={{display:'flex',gap:8,marginBottom:16,flexWrap:'wrap'}}>
          {['all','deposit','withdrawal','gain','fee'].map(f => (
            <button key={f} onClick={()=>setFilter(f)}
              style={{padding:'7px 16px',borderRadius:100,border:`1.5px solid ${filter===f?'var(--blue)':'var(--border)'}`,background:filter===f?'var(--blue-light)':'transparent',color:filter===f?'var(--blue)':'var(--text2)',fontSize:13,fontWeight:500,cursor:'pointer',fontFamily:'var(--font-display)'}}>
              {f.charAt(0).toUpperCase()+f.slice(1)}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{display:'flex',justifyContent:'center',padding:80}}><div className="spinner"/></div>
        ) : filtered.length===0 ? (
          <div className="card"><div className="empty-state"><div className="empty-icon">↕</div><h3>No transactions yet</h3><p>Your transaction history will appear here.</p></div></div>
        ) : (
          <div className="card" style={{padding:0,overflow:'hidden'}}>
            <div style={{display:'grid',gridTemplateColumns:'120px 80px 130px 120px 100px 1fr',padding:'10px 18px',fontSize:11,fontWeight:600,color:'var(--text3)',textTransform:'uppercase',letterSpacing:'0.07em',borderBottom:'1px solid var(--border)',background:'var(--bg)'}}>
              <span>Type</span><span>Asset</span><span>Amount</span><span>USD Value</span><span>Status</span><span>Date</span>
            </div>
            {filtered.map(tx => {
              const tm = TYPE_META[tx.type]||TYPE_META.fee
              const sm = STATUS_META[tx.status]||STATUS_META.completed
              return (
                <div key={tx._id} style={{display:'grid',gridTemplateColumns:'120px 80px 130px 120px 100px 1fr',alignItems:'center',padding:'13px 18px',borderTop:'1px solid var(--border)',fontSize:13,transition:'background 0.12s'}}
                  onMouseEnter={e=>e.currentTarget.style.background='var(--bg)'}
                  onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                  <span><span className={`tag ${tm.cls}`}>{tm.label}</span></span>
                  <span style={{fontWeight:700,fontFamily:'var(--font-display)'}}>{tx.asset}</span>
                  <span className="mono">{fmt(tx.amount,6)}</span>
                  <span className="mono">{tx.amountUSD?`$${fmt(tx.amountUSD)}`:'—'}</span>
                  <span style={{color:sm.color,fontSize:12,fontWeight:600}}>{sm.label}</span>
                  <span style={{color:'var(--text2)',fontSize:12}}>
                    {new Date(tx.createdAt).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
