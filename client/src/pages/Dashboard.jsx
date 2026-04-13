import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Sidebar from '../components/Sidebar'
import api from '../hooks/useApi'
import './Dashboard.css'

const fmt = (n, d=2) => Number(n||0).toLocaleString('en-US',{minimumFractionDigits:d,maximumFractionDigits:d})

const COIN_META = {
  bitcoin:       { color:'#F7931A', bg:'#FFF5E6' },
  ethereum:      { color:'#627EEA', bg:'#EEF1FD' },
  solana:        { color:'#9945FF', bg:'#F3ECFF' },
  ripple:        { color:'#00AAE4', bg:'#E5F6FD' },
  cardano:       { color:'#0033AD', bg:'#E5EAFF' },
  dogecoin:      { color:'#C2A633', bg:'#FAF5E4' },
  'avalanche-2': { color:'#E84142', bg:'#FDEAEA' },
  chainlink:     { color:'#2A5ADA', bg:'#EAF0FF' },
}

function MiniChart({ prices, positive }) {
  const canvasRef = useRef(null)
  useEffect(() => {
    if (!canvasRef.current || !prices?.length) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const w = canvas.width, h = canvas.height
    ctx.clearRect(0, 0, w, h)
    const min = Math.min(...prices), max = Math.max(...prices)
    const range = max - min || 1
    const points = prices.map((v, i) => ({
      x: (i / (prices.length - 1)) * w,
      y: h - ((v - min) / range) * (h - 4) - 2
    }))
    ctx.beginPath()
    ctx.moveTo(points[0].x, points[0].y)
    points.slice(1).forEach(p => ctx.lineTo(p.x, p.y))
    ctx.strokeStyle = positive ? '#22C55E' : '#EF4444'
    ctx.lineWidth = 1.5
    ctx.lineJoin = 'round'
    ctx.stroke()
    // Fill
    ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.closePath()
    ctx.fillStyle = positive ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)'
    ctx.fill()
  }, [prices, positive])
  return <canvas ref={canvasRef} width={80} height={32} style={{display:'block'}}/>
}

function CryptoCard({ coin, onBuy, onWatch, isWatched }) {
  const meta = COIN_META[coin.id] || { color:'#3375BB', bg:'#EBF2FA' }
  const change = coin.price_change_percentage_24h || 0
  const isUp = change >= 0
  const [chartData, setChartData] = useState(null)

  useEffect(() => {
    api.get(`/prices/${coin.id}`).then(r => {
      setChartData(r.data.prices?.map(p => p[1]))
    }).catch(()=>{})
  }, [coin.id])

  return (
    <div className="crypto-card">
      <div className="crypto-card-top">
        <div className="crypto-card-icon" style={{background: meta.bg}}>
          <img src={coin.image} alt={coin.name} width={28} height={28} style={{borderRadius:'50%'}}/>
        </div>
        <div style={{display:'flex',gap:6,alignItems:'center'}}>
          <button className="watch-btn" onClick={e=>{e.stopPropagation();onWatch(coin.id)}}
            style={{color: isWatched ? '#F7931A' : 'var(--text3)'}}>
            {isWatched ? '★' : '☆'}
          </button>
          <span className={`tag ${isUp ? 'tag-up' : 'tag-down'}`}>
            {isUp ? '↑' : '↓'}{fmt(Math.abs(change), 2)}%
          </span>
        </div>
      </div>
      <div className="crypto-card-name">{coin.name}</div>
      <div className="crypto-card-sym">{coin.symbol.toUpperCase()}</div>
      <div className="crypto-card-price">${fmt(coin.current_price)}</div>
      {chartData && (
        <div style={{margin:'8px 0'}}>
          <MiniChart prices={chartData} positive={isUp}/>
        </div>
      )}
      <div className="crypto-card-cap">MCap ${(coin.market_cap/1e9).toFixed(1)}B</div>
      <button className="crypto-card-btn" style={{background: meta.color}} onClick={()=>onBuy(coin)}>
        Buy {coin.symbol.toUpperCase()}
      </button>
    </div>
  )
}

function NewsCard({ item }) {
  return (
    <a href={item.url} target="_blank" rel="noopener noreferrer" className="news-card">
      {item.imageurl && (
        <img src={item.imageurl} alt={item.title} className="news-img" onError={e=>e.target.style.display='none'}/>
      )}
      <div className="news-content">
        <div className="news-source">{item.source}</div>
        <div className="news-title">{item.title}</div>
        <div className="news-time">
          {new Date(item.publishedAt).toLocaleDateString('en-US',{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'})}
        </div>
      </div>
    </a>
  )
}

function KYCBanner({ status }) {
  const navigate = useNavigate()
  if (status === 'approved' || status === 'under_review') return null
  return (
    <div className="kyc-banner" onClick={() => navigate('/kyc')} style={{cursor:'pointer'}}>
      <span>🔐</span>
      <div><strong>Complete KYC verification</strong> to unlock buying and withdrawing crypto.</div>
      <button className="btn btn-primary btn-sm" onClick={e=>{e.stopPropagation();navigate('/kyc')}}>Verify now →</button>
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [portfolio, setPortfolio] = useState(null)
  const [prices, setPrices] = useState([])
  const [news, setNews] = useState([])
  const [watchlist, setWatchlist] = useState([])
  const [loadingPrices, setLoadingPrices] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [activeTab, setActiveTab] = useState('all')

  const loadPrices = () => {
    api.get('/prices').then(r => {
      setPrices(r.data.prices || [])
      setLastUpdated(new Date())
    }).catch(console.error).finally(() => setLoadingPrices(false))
  }

  useEffect(() => {
    loadPrices()
    api.get('/portfolio/value').then(r => setPortfolio(r.data)).catch(console.error)
    api.get('/news').then(r => setNews(r.data.news || [])).catch(()=>{})
    api.get('/watchlist').then(r => setWatchlist(r.data.watchlist || [])).catch(()=>{})
    const iv = setInterval(loadPrices, 60000)
    return () => clearInterval(iv)
  }, [])

  const toggleWatch = async (coinId) => {
    if (watchlist.includes(coinId)) {
      await api.delete(`/watchlist/${coinId}`)
      setWatchlist(w => w.filter(id => id !== coinId))
    } else {
      await api.post(`/watchlist/${coinId}`)
      setWatchlist(w => [...w, coinId])
    }
  }

  const displayedCoins = activeTab === 'watchlist'
    ? prices.filter(c => watchlist.includes(c.id))
    : prices

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
              {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : 'Loading...'}
            </p>
          </div>
          <div style={{display:'flex',gap:8}}>
            <button className="btn btn-ghost btn-sm" onClick={loadPrices}>↻ Refresh</button>
            <Link to="/converter" className="btn btn-ghost btn-sm">⇄ Convert</Link>
            <Link to="/buy" className="btn btn-primary btn-sm">+ Buy Crypto</Link>
          </div>
        </div>

        {/* Portfolio cards */}
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
              <span className={`tag ${user?.kycStatus==='approved'?'tag-green':user?.kycStatus==='under_review'?'tag-orange':'tag-red'}`}>
                {user?.kycStatus==='approved'?'✓ Verified':user?.kycStatus==='under_review'?'⏳ Pending':'✗ Not Verified'}
              </span>
            </div>
            <div className="port-sub" style={{marginTop:8}}>{user?.role==='admin'?'Admin':'Standard User'}</div>
          </div>
        </div>

        {/* Markets + News layout */}
        <div className="dash-main-layout">
          <div className="dash-left">
            {/* Crypto cards */}
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
              <h2 style={{fontSize:16,fontWeight:700}}>Live Markets</h2>
              <div style={{display:'flex',gap:4}}>
                {['all','watchlist'].map(t => (
                  <button key={t} onClick={()=>setActiveTab(t)}
                    style={{padding:'5px 14px',borderRadius:100,border:`1.5px solid ${activeTab===t?'var(--blue)':'var(--border)'}`,background:activeTab===t?'var(--blue-light)':'transparent',color:activeTab===t?'var(--blue)':'var(--text2)',fontSize:12,fontWeight:600,cursor:'pointer',fontFamily:'var(--font-display)'}}>
                    {t === 'all' ? 'All' : '★ Watchlist'}
                  </button>
                ))}
              </div>
            </div>

            {loadingPrices ? (
              <div className="crypto-cards-loading">
                {[1,2,3,4,5,6].map(i => <div key={i} className="card crypto-card-skeleton"/>)}
              </div>
            ) : displayedCoins.length === 0 ? (
              <div className="card" style={{padding:40,textAlign:'center',color:'var(--text2)'}}>
                {activeTab === 'watchlist' ? (
                  <p>No coins in watchlist yet. Click ☆ on any coin to add it!</p>
                ) : (
                  <p>Could not load prices. <button className="btn btn-ghost btn-sm" onClick={loadPrices}>Try again</button></p>
                )}
              </div>
            ) : (
              <div className="crypto-cards-grid">
                {displayedCoins.map(coin => (
                  <CryptoCard key={coin.id} coin={coin}
                    onBuy={c => navigate('/buy', { state: { coinId: c.id, symbol: c.symbol, name: c.name }})}
                    onWatch={toggleWatch}
                    isWatched={watchlist.includes(coin.id)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* News sidebar */}
          <div className="dash-right">
            <h2 style={{fontSize:16,fontWeight:700,marginBottom:14}}>Crypto News</h2>
            {news.length === 0 ? (
              <div className="card" style={{padding:20,textAlign:'center',color:'var(--text2)',fontSize:13}}>
                Loading news...
              </div>
            ) : (
              <div className="news-list">
                {news.map(item => <NewsCard key={item.id} item={item}/>)}
              </div>
            )}
          </div>
        </div>

        {/* Holdings */}
        {portfolio?.breakdown?.length > 0 && (
          <section style={{marginTop:24}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
              <h2 style={{fontSize:16,fontWeight:700}}>Your Holdings</h2>
              <Link to="/wallet" style={{fontSize:13,color:'var(--blue)',fontWeight:500}}>View all →</Link>
            </div>
            <div className="card" style={{padding:0,overflow:'hidden'}}>
              {portfolio.breakdown.map(h => (
                <div key={h.symbol} style={{display:'flex',alignItems:'center',gap:14,padding:'14px 18px',borderTop:'1px solid var(--border)'}}>
                  <div style={{width:36,height:36,borderRadius:'50%',background:COIN_META[h.asset]?.bg||'var(--bg)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:11,color:COIN_META[h.asset]?.color||'var(--blue)',fontFamily:'var(--font-display)'}}>
                    {h.symbol.slice(0,3)}
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:600,fontSize:14}}>{h.symbol}</div>
                    <div style={{fontSize:12,color:'var(--text2)'}}>{fmt(h.amount,6)} units</div>
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
