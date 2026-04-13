import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Sidebar from '../components/Sidebar'
import api from '../hooks/useApi'
import './Dashboard.css'

const fmt = (n, d=2) => Number(n||0).toLocaleString('en-US',{minimumFractionDigits:d,maximumFractionDigits:d})

const COIN_META = {
  bitcoin:      { color:'#F7931A', bg:'#FFF5E6' },
  ethereum:     { color:'#627EEA', bg:'#EEF1FD' },
  solana:       { color:'#9945FF', bg:'#F3ECFF' },
  ripple:       { color:'#00AAE4', bg:'#E5F6FD' },
  cardano:      { color:'#0033AD', bg:'#E5EAFF' },
  dogecoin:     { color:'#C2A633', bg:'#FAF5E4' },
  'avalanche-2':{ color:'#E84142', bg:'#FDEAEA' },
  chainlink:    { color:'#2A5ADA', bg:'#EAF0FF' },
}

function KYCBanner({ status }) {
  const navigate = useNavigate()
  if (status === 'approved' || status === 'under_review') return null
  return (
    <div className="kyc-banner" onClick={() => navigate('/kyc')} style={{cursor:'pointer'}}>
      <span>🔐</span>
      <div>
        <strong>Complete KYC verification</strong> to unlock buying and withdrawing crypto.
      </div>
      <button className="btn btn-primary btn-sm" onClick={e=>{e.stopPropagation();navigate('/kyc')}}>Verify now →</button>
    </div>
  )
}

function CryptoCard({ coin, onBuy }) {
  const meta = COIN_META[coin.id] || { color:'#3375BB', bg:'#EBF2FA' }
  const change = coin.price_change_percentage_24h || 0
  const isUp = change >= 0

  return (
    <div className="crypto-card" onClick={() => onBuy(coin)}>
      <div className="crypto-card-top">
        <div className="crypto-card-icon" style={{background: meta.bg}}>
          <img src={coin.image} alt={coin.name} width={28} height={28} style={{borderRadius:'50%'}}/>
        </div>
        <span className={`tag ${isUp ? 'tag-up' : 'tag-down'}`}>
          {isUp ? '↑' : '↓'}{fmt(Math.abs(change), 2)}%
        </span>
      </div>
      <div className="crypto-card-name">{coin.name}</div>
      <div className="crypto-card-sym">{coin.symbol.toUpperCase()}</div>
      <div className="crypto-card-price">${fmt(coin.current_price)}</div>
      <div className="crypto-card-cap">MCap ${(coin.market_cap/1e9).toFixed(1)}B</div>
      <button className="crypto-card-btn" style={{background: meta.color}}>
        Buy {coin.symbol.toUpperCase()}
      </button>
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [portfolio, setPortfolio] = useState(null)
  const [prices, setPrices] = useState([])
  const [loadingPrices, setLoadingPrices] = useState(true)
  const [loadingPort, setLoadingPort] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(null)

  const loadPrices = () => {
    api.get('/prices').then(r => {
      setPrices(r.data.prices || [])
      setLastUpdated(new Date())
    }).catch(console.error).finally(() => setLoadingPrices(false))
  }

  useEffect(() => {
    loadPrices()
    api.get('/portfolio/value').then(r => setPortfolio(r.data)).catch(console.error).finally(() => setLoadingPort(false))
    const iv = setInterval(loadPrices, 30000)
    return () => clearInterval(iv)
  }, [])

  const handleBuy = (coin) => {
    navigate('/buy', { state: { coinId: coin.id, symbol: coin.symbol, name: coin.name } })
  }

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
            <p style={{color:'var(--text2)',fontSize:13,marginTop:4}}>
              {lastUpdated ? `Prices updated ${lastUpdated.toLocaleTimeString()}` : 'Loading live prices...'}
            </p>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={loadPrices}>↻ Refresh</button>
        </div>

        {/* Portfolio summary */}
        <div className="port-cards">
          <div className="card port-total">
            <div className="port-label">Total Portfolio</div>
            <div className="port-value">{loadingPort ? '—' : `$${fmt(portfolio?.totalUSD)}`}</div>
            <div className="port-sub">Account {user?.accountNumber}</div>
          </div>
          <div className="card port-card">
            <div className="port-label">Crypto Holdings</div>
            <div className="port-value">{loadingPort ? '—' : `$${fmt(portfolio?.cryptoUSD)}`}</div>
            <div className="port-sub">{portfolio?.breakdown?.length || 0} assets</div>
          </div>
          <div className="card port-card">
            <div className="port-label">Cash Balance</div>
            <div className="port-value">{loadingPort ? '—' : `$${fmt(portfolio?.cashUSD)}`}</div>
            <div className="port-sub">USD Available</div>
          </div>
          <div className="card port-card">
            <div className="port-label">KYC Status</div>
            <div style={{marginTop:10}}>
              <span className={`tag ${user?.kycStatus==='approved'?'tag-green':user?.kycStatus==='under_review'?'tag-orange':'tag-red'}`}>
                {user?.kycStatus==='approved'?'✓ Verified':user?.kycStatus==='under_review'?'⏳ Under Review':'✗ Not Verified'}
              </span>
            </div>
            <div className="port-sub" style={{marginTop:8}}>{user?.role==='admin'?'Admin':'Standard User'}</div>
          </div>
        </div>

        {/* Live crypto cards */}
        <div className="section-hdr" style={{marginBottom:16}}>
          <h2>Live Crypto Markets</h2>
          <span style={{fontSize:12,color:'var(--text3)'}}>Click any coin to buy instantly</span>
        </div>

        {loadingPrices ? (
          <div className="crypto-cards-loading">
            {[1,2,3,4,5,6,7,8].map(i => (
              <div key={i} className="card crypto-card-skeleton" />
            ))}
          </div>
        ) : prices.length === 0 ? (
          <div className="card" style={{padding:32,textAlign:'center',color:'var(--text2)'}}>
            <p>Could not load prices. <button className="btn btn-ghost btn-sm" onClick={loadPrices}>Try again</button></p>
          </div>
        ) : (
          <div className="crypto-cards-grid">
            {prices.map(coin => (
              <CryptoCard key={coin.id} coin={coin} onBuy={handleBuy} />
            ))}
          </div>
        )}

        {/* Holdings if any */}
        {portfolio?.breakdown?.length > 0 && (
          <section style={{marginTop:28}}>
            <div className="section-hdr"><h2>Your Holdings</h2></div>
            <div className="card" style={{padding:0,overflow:'hidden'}}>
              {portfolio.breakdown.map(h => (
                <div key={h.symbol} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'14px 18px',borderTop:'1px solid var(--border)'}}>
                  <div style={{display:'flex',alignItems:'center',gap:12}}>
                    <div style={{width:36,height:36,borderRadius:'50%',background:COIN_META[h.asset]?.bg||'var(--bg)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:11,color:COIN_META[h.asset]?.color||'var(--blue)',fontFamily:'var(--font-display)'}}>
                      {h.symbol.slice(0,3)}
                    </div>
                    <div>
                      <div style={{fontWeight:600,fontSize:14}}>{h.symbol}</div>
                      <div style={{fontSize:12,color:'var(--text2)'}}>{fmt(h.amount,6)} units</div>
                    </div>
                  </div>
                  <div style={{textAlign:'right'}}>
                    <div style={{fontWeight:700,fontSize:15}}>${fmt(h.valueUSD)}</div>
                    <span className={`tag ${h.gainLoss>=0?'tag-up':'tag-down'}`}>{h.gainLoss>=0?'+':''}{fmt(h.gainLossPct,2)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
