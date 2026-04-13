import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Sidebar from '../components/Sidebar'
import api from '../hooks/useApi'
import './Dashboard.css'

const fmt = (n, d=2) => Number(n||0).toLocaleString('en-US',{minimumFractionDigits:d,maximumFractionDigits:d})

function KYCBanner({ status }) {
  if (status === 'approved' || status === 'under_review') return null
  return (
    <div className="kyc-banner">
      <span>🔐</span>
      <div>
        <strong>Complete KYC verification</strong> to unlock full access to buying and withdrawing crypto.
      </div>
      <Link to="/kyc" className="btn btn-primary btn-sm">Verify now →</Link>
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const [portfolio, setPortfolio] = useState(null)
  const [prices, setPrices] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([api.get('/portfolio/value'), api.get('/prices')])
      .then(([p, m]) => { setPortfolio(p.data); setPrices(m.data.prices.slice(0,6)) })
      .catch(console.error).finally(() => setLoading(false))
  }, [])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="layout">
      <Sidebar />
      <main className="main-content fade-up">
        <KYCBanner status={user?.kycStatus} />
        <div className="dash-header">
          <div>
            <h1>{greeting}, {user?.firstName} 👋</h1>
            <p style={{color:'var(--text2)',fontSize:13,marginTop:4}}>Here's your portfolio overview</p>
          </div>
          <Link to="/buy" className="btn btn-primary">+ Buy Crypto</Link>
        </div>

        {loading ? <div style={{display:'flex',justifyContent:'center',padding:80}}><div className="spinner"/></div> : (
          <>
            <div className="port-cards">
              <div className="card port-total">
                <div className="port-label">Total Portfolio</div>
                <div className="port-value">${fmt(portfolio?.totalUSD)}</div>
                <div className="port-sub">Account {user?.accountNumber}</div>
              </div>
              <div className="card port-card">
                <div className="port-label">Crypto Holdings</div>
                <div className="port-value">${fmt(portfolio?.cryptoUSD)}</div>
                <div className="port-sub">{portfolio?.breakdown?.length || 0} assets</div>
              </div>
              <div className="card port-card">
                <div className="port-label">Cash Balance</div>
                <div className="port-value">${fmt(portfolio?.cashUSD)}</div>
                <div className="port-sub">USD Available</div>
              </div>
              <div className="card port-card">
                <div className="port-label">KYC Status</div>
                <div style={{marginTop:10}}>
                  <span className={`tag tag-${user?.kycStatus==='approved'?'green':user?.kycStatus==='under_review'?'orange':'red'}`}>
                    {user?.kycStatus==='approved'?'✓ Verified':user?.kycStatus==='under_review'?'Under Review':'Not Verified'}
                  </span>
                </div>
                <div className="port-sub" style={{marginTop:8}}>{user?.role==='admin'?'Admin Account':'User Account'}</div>
              </div>
            </div>

            {portfolio?.breakdown?.length > 0 && (
              <section style={{marginBottom:28}}>
                <div className="section-hdr"><h2>Holdings</h2><Link to="/wallet">See all →</Link></div>
                <div className="holdings-list">
                  {portfolio.breakdown.map(h => (
                    <div key={h.symbol} className="card holding-row">
                      <div className="holding-left">
                        <div className="holding-sym">{h.symbol}</div>
                        <div className="holding-amt">{fmt(h.amount,6)} {h.symbol}</div>
                      </div>
                      <div className="holding-right">
                        <div className="holding-val">${fmt(h.valueUSD)}</div>
                        <span className={`tag ${h.gainLoss>=0?'tag-up':'tag-down'}`}>{h.gainLoss>=0?'↑':'↓'}{fmt(Math.abs(h.gainLossPct),2)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section>
              <div className="section-hdr"><h2>Live Markets</h2><Link to="/markets">Full markets →</Link></div>
              <div className="card" style={{padding:0,overflow:'hidden'}}>
                <div className="mkt-head"><span>Asset</span><span>Price</span><span>24h</span></div>
                {prices.map(c => (
                  <div key={c.id} className="mkt-row">
                    <div className="mkt-asset">
                      <img src={c.image} alt={c.name} width={28} height={28} style={{borderRadius:'50%'}}/>
                      <div><div className="mkt-name">{c.name}</div><div className="mkt-sym2">{c.symbol.toUpperCase()}</div></div>
                    </div>
                    <span className="mono" style={{fontWeight:500}}>${fmt(c.current_price)}</span>
                    <span style={{color:c.price_change_percentage_24h>=0?'var(--up)':'var(--down)',fontWeight:600,fontSize:13}}>
                      {c.price_change_percentage_24h>=0?'+':''}{fmt(c.price_change_percentage_24h,2)}%
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  )
}
