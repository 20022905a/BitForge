import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import api from '../hooks/useApi'
import './Portfolio.css'

const fmt = (n,d=2) => Number(n||0).toLocaleString('en-US',{minimumFractionDigits:d,maximumFractionDigits:d})

const COIN_COLORS = {
  BTC:'#F7931A', ETH:'#627EEA', SOL:'#9945FF', XRP:'#00AAE4',
  ADA:'#0033AD', DOGE:'#C2A633', AVAX:'#E84142', LINK:'#2A5ADA'
}

function DonutChart({ data }) {
  const canvasRef = useRef(null)
  useEffect(() => {
    if (!canvasRef.current || !data?.length) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const size = canvas.width
    const cx = size/2, cy = size/2, r = size*0.38, inner = size*0.24
    ctx.clearRect(0, 0, size, size)
    const total = data.reduce((s, d) => s + d.value, 0)
    if (!total) return
    let angle = -Math.PI/2
    data.forEach(d => {
      const slice = (d.value / total) * Math.PI * 2
      ctx.beginPath()
      ctx.moveTo(cx, cy)
      ctx.arc(cx, cy, r, angle, angle + slice)
      ctx.closePath()
      ctx.fillStyle = d.color
      ctx.fill()
      angle += slice
    })
    // Inner circle (donut hole)
    ctx.beginPath()
    ctx.arc(cx, cy, inner, 0, Math.PI * 2)
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--white') || '#fff'
    ctx.fill()
  }, [data])
  return <canvas ref={canvasRef} width={200} height={200} style={{display:'block',margin:'0 auto'}}/>
}

function PerformanceChart({ breakdown }) {
  const canvasRef = useRef(null)
  useEffect(() => {
    if (!canvasRef.current || !breakdown?.length) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const W = canvas.width, H = canvas.height
    ctx.clearRect(0, 0, W, H)

    // Simulate 30-day portfolio value history
    const base = breakdown.reduce((s, h) => s + (h.valueUSD || 0), 0)
    const points = Array.from({length: 30}, (_, i) => {
      const noise = (Math.random() - 0.48) * 0.04
      return base * (1 + noise * (i/30))
    })
    points[29] = base

    const min = Math.min(...points) * 0.99
    const max = Math.max(...points) * 1.01
    const range = max - min || 1

    const xs = points.map((_, i) => (i / (points.length-1)) * (W-2) + 1)
    const ys = points.map(v => H - ((v - min) / range) * (H-4) - 2)

    // Gradient fill
    const gradient = ctx.createLinearGradient(0, 0, 0, H)
    gradient.addColorStop(0, 'rgba(51,117,187,0.25)')
    gradient.addColorStop(1, 'rgba(51,117,187,0.01)')

    ctx.beginPath()
    ctx.moveTo(xs[0], ys[0])
    xs.slice(1).forEach((x, i) => ctx.lineTo(x, ys[i+1]))
    ctx.strokeStyle = '#3375BB'
    ctx.lineWidth = 2
    ctx.lineJoin = 'round'
    ctx.stroke()

    ctx.lineTo(xs[xs.length-1], H)
    ctx.lineTo(xs[0], H)
    ctx.closePath()
    ctx.fillStyle = gradient
    ctx.fill()
  }, [breakdown])
  return <canvas ref={canvasRef} width={600} height={120} style={{display:'block',width:'100%',height:120}}/>
}

export default function Portfolio() {
  const [portfolio, setPortfolio] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/portfolio/value').then(r=>setPortfolio(r.data)).catch(console.error).finally(()=>setLoading(false))
  }, [])

  const donutData = portfolio?.breakdown?.map(h => ({
    label: h.symbol,
    value: h.valueUSD,
    color: COIN_COLORS[h.symbol] || '#3375BB'
  })) || []

  const totalPnL = portfolio?.breakdown?.reduce((s, h) => s + h.gainLoss, 0) || 0
  const isPnLUp = totalPnL >= 0

  return (
    <div className="layout">
      <Sidebar/>
      <main className="main-content fade-up">
        <div className="page-hdr">
          <div><h1>Portfolio</h1><p>Your holdings and performance overview</p></div>
          <Link to="/buy" className="btn btn-primary">+ Buy Crypto</Link>
        </div>

        {loading ? (
          <div style={{display:'flex',justifyContent:'center',padding:80}}><div className="spinner"/></div>
        ) : (
          <>
            {/* Summary stats */}
            <div className="port-summary-grid">
              <div className="card port-stat-card port-stat-main">
                <div style={{fontSize:11,fontWeight:600,color:'rgba(255,255,255,0.6)',textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:8}}>Total Balance</div>
                <div style={{fontSize:36,fontWeight:800,color:'white',fontFamily:'var(--font-display)',lineHeight:1}}>${fmt(portfolio?.totalUSD)}</div>
                <div style={{fontSize:12,color:'rgba(255,255,255,0.5)',marginTop:8}}>Crypto + Cash</div>
              </div>
              <div className="card port-stat-card">
                <div className="port-stat-label">Crypto Value</div>
                <div className="port-stat-val">${fmt(portfolio?.cryptoUSD)}</div>
                <div className="port-stat-sub">{portfolio?.breakdown?.length || 0} assets</div>
              </div>
              <div className="card port-stat-card">
                <div className="port-stat-label">Cash (USD)</div>
                <div className="port-stat-val">${fmt(portfolio?.cashUSD)}</div>
                <div className="port-stat-sub">Available</div>
              </div>
              <div className="card port-stat-card">
                <div className="port-stat-label">Total P&L</div>
                <div className="port-stat-val" style={{color: isPnLUp ? 'var(--up)' : 'var(--down)'}}>
                  {isPnLUp ? '+' : ''}${fmt(Math.abs(totalPnL))}
                </div>
                <div className="port-stat-sub" style={{color: isPnLUp ? 'var(--up)' : 'var(--down)'}}>
                  {isPnLUp ? '↑' : '↓'} All time
                </div>
              </div>
            </div>

            {portfolio?.breakdown?.length === 0 ? (
              <div className="card">
                <div className="empty-state">
                  <div className="empty-icon">₿</div>
                  <h3>No crypto yet</h3>
                  <p>Buy your first crypto to start building your portfolio.</p>
                  <Link to="/buy" className="btn btn-primary" style={{marginTop:16}}>Buy crypto →</Link>
                </div>
              </div>
            ) : (
              <>
                {/* Performance chart */}
                <div className="card" style={{marginBottom:16,padding:'20px 20px 12px'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
                    <h2 style={{fontSize:16,fontWeight:700}}>Portfolio Performance</h2>
                    <span style={{fontSize:11,color:'var(--text3)'}}>30-day estimate</span>
                  </div>
                  <PerformanceChart breakdown={portfolio?.breakdown}/>
                  <div style={{display:'flex',justifyContent:'space-between',marginTop:8,fontSize:11,color:'var(--text3)'}}>
                    <span>30 days ago</span><span>Today</span>
                  </div>
                </div>

                {/* Donut + breakdown */}
                <div className="port-main-grid">
                  <div className="card">
                    <h2 style={{fontSize:16,fontWeight:700,marginBottom:20}}>Allocation</h2>
                    <DonutChart data={donutData}/>
                    <div style={{marginTop:16,display:'flex',flexDirection:'column',gap:8}}>
                      {donutData.map(d => (
                        <div key={d.label} style={{display:'flex',alignItems:'center',gap:10,fontSize:13}}>
                          <div style={{width:10,height:10,borderRadius:'50%',background:d.color,flexShrink:0}}/>
                          <span style={{fontWeight:600}}>{d.label}</span>
                          <span style={{marginLeft:'auto',color:'var(--text2)'}}>
                            ${fmt(d.value)} ({portfolio?.cryptoUSD > 0 ? (d.value/portfolio.cryptoUSD*100).toFixed(1) : 0}%)
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h2 style={{fontSize:16,fontWeight:700,marginBottom:14}}>Holdings Detail</h2>
                    {portfolio?.breakdown?.map(h => (
                      <div key={h.symbol} className="card holding-detail" style={{marginBottom:10}}>
                        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
                          <div style={{display:'flex',alignItems:'center',gap:10}}>
                            <div style={{width:38,height:38,borderRadius:'50%',background:`${COIN_COLORS[h.symbol]}18`,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:800,fontSize:11,color:COIN_COLORS[h.symbol]||'var(--blue)',fontFamily:'var(--font-display)'}}>
                              {h.symbol.slice(0,3)}
                            </div>
                            <div>
                              <div style={{fontWeight:700,fontSize:15,fontFamily:'var(--font-display)'}}>{h.symbol}</div>
                              <div style={{fontSize:11,color:'var(--text3)',textTransform:'capitalize'}}>{h.asset}</div>
                            </div>
                          </div>
                          <div style={{textAlign:'right'}}>
                            <div style={{fontWeight:800,fontSize:17,fontFamily:'var(--font-display)'}}>${fmt(h.valueUSD)}</div>
                            <span className={`tag ${h.gainLoss>=0?'tag-up':'tag-down'}`}>{h.gainLoss>=0?'+':''}{fmt(h.gainLossPct,2)}%</span>
                          </div>
                        </div>
                        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,paddingTop:12,borderTop:'1px solid var(--border)'}}>
                          {[
                            ['Holdings', `${fmt(h.amount,6)} ${h.symbol}`],
                            ['Current price', `$${fmt(h.currentPrice)}`],
                            ['Avg buy price', `$${fmt(h.avgBuyPrice)}`],
                            ['P&L', `${h.gainLoss>=0?'+':''}$${fmt(h.gainLoss)}`],
                          ].map(([k,v]) => (
                            <div key={k}>
                              <div style={{fontSize:10,color:'var(--text3)',textTransform:'uppercase',letterSpacing:'0.06em',fontWeight:600,marginBottom:2}}>{k}</div>
                              <div style={{fontSize:13,fontWeight:600,color:k==='P&L'?(h.gainLoss>=0?'var(--up)':'var(--down)'):'var(--text)'}}>{v}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </main>
    </div>
  )
}
