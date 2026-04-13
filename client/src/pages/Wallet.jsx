import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import api from '../hooks/useApi'
import './Wallet.css'

const fmt = (n,d=2) => Number(n||0).toLocaleString('en-US',{minimumFractionDigits:d,maximumFractionDigits:d})

const COIN_COLORS = {
  BTC:'#F7931A', ETH:'#627EEA', SOL:'#9945FF', XRP:'#00AAE4',
  ADA:'#0033AD', DOGE:'#C2A633', AVAX:'#E84142', LINK:'#2A5ADA'
}

export default function Wallet() {
  const [portfolio, setPortfolio] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/portfolio/value').then(r=>setPortfolio(r.data)).catch(console.error).finally(()=>setLoading(false))
  }, [])

  return (
    <div className="layout">
      <Sidebar/>
      <main className="main-content fade-up">
        <div className="page-hdr">
          <div><h1>Wallet</h1><p>Your crypto holdings and balances</p></div>
          <Link to="/buy" className="btn btn-primary">+ Buy Crypto</Link>
        </div>

        {loading ? (
          <div style={{display:'flex',justifyContent:'center',padding:80}}><div className="spinner"/></div>
        ) : (
          <>
            <div className="wallet-total card">
              <div className="wallet-total-inner">
                <div>
                  <div style={{fontSize:12,fontWeight:600,color:'rgba(255,255,255,0.6)',textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:8}}>Total Balance</div>
                  <div style={{fontSize:40,fontWeight:800,color:'white',fontFamily:'var(--font-display)',lineHeight:1}}>${fmt(portfolio?.totalUSD)}</div>
                  <div style={{fontSize:13,color:'rgba(255,255,255,0.6)',marginTop:8}}>≈ {portfolio?.totalUSD ? (portfolio.totalUSD/43000).toFixed(6) : '0'} BTC</div>
                </div>
                <div className="wallet-actions">
                  <Link to="/buy" className="wallet-action-btn">
                    <span>↓</span><span>Buy</span>
                  </Link>
                  <button className="wallet-action-btn" onClick={()=>alert('Send feature coming soon')}>
                    <span>↑</span><span>Send</span>
                  </button>
                  <button className="wallet-action-btn" onClick={()=>alert('Receive feature coming soon')}>
                    <span>⊕</span><span>Receive</span>
                  </button>
                  <button className="wallet-action-btn" onClick={()=>alert('Swap feature coming soon')}>
                    <span>⇄</span><span>Swap</span>
                  </button>
                </div>
              </div>
            </div>

            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:24}}>
              <div className="card">
                <div style={{fontSize:11,fontWeight:600,color:'var(--text3)',textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:10}}>Crypto</div>
                <div style={{fontSize:24,fontWeight:800,fontFamily:'var(--font-display)'}}>${fmt(portfolio?.cryptoUSD)}</div>
              </div>
              <div className="card">
                <div style={{fontSize:11,fontWeight:600,color:'var(--text3)',textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:10}}>Cash (USD)</div>
                <div style={{fontSize:24,fontWeight:800,fontFamily:'var(--font-display)'}}>${fmt(portfolio?.cashUSD)}</div>
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
              <div className="card" style={{padding:0,overflow:'hidden'}}>
                <div style={{padding:'14px 18px',borderBottom:'1px solid var(--border)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <span style={{fontSize:14,fontWeight:700,fontFamily:'var(--font-display)'}}>Assets</span>
                  <span style={{fontSize:12,color:'var(--text3)'}}>{portfolio?.breakdown?.length} tokens</span>
                </div>
                {portfolio?.breakdown?.map(h => {
                  const color = COIN_COLORS[h.symbol] || '#3375BB'
                  const pct = portfolio.cryptoUSD > 0 ? (h.valueUSD / portfolio.cryptoUSD * 100).toFixed(1) : 0
                  return (
                    <div key={h.symbol} className="asset-row">
                      <div className="asset-icon" style={{background:`${color}18`,color}}>{h.symbol.slice(0,2)}</div>
                      <div className="asset-info">
                        <div style={{fontWeight:600,fontSize:14,fontFamily:'var(--font-display)'}}>{h.symbol}</div>
                        <div style={{fontSize:12,color:'var(--text2)',marginTop:2}}>{fmt(h.amount,6)} · ${fmt(h.currentPrice)} each</div>
                      </div>
                      <div style={{textAlign:'right'}}>
                        <div style={{fontWeight:700,fontSize:15,fontFamily:'var(--font-display)'}}>${fmt(h.valueUSD)}</div>
                        <div style={{display:'flex',alignItems:'center',gap:8,justifyContent:'flex-end',marginTop:4}}>
                          <span style={{fontSize:11,color:'var(--text3)'}}>{pct}%</span>
                          <span className={`tag ${h.gainLoss>=0?'tag-up':'tag-down'}`}>{h.gainLoss>=0?'+':''}{fmt(h.gainLossPct,2)}%</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
