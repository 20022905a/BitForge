import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import api from '../hooks/useApi'
import './Converter.css'

const fmt = (n,d=6) => Number(n||0).toLocaleString('en-US',{minimumFractionDigits:0,maximumFractionDigits:d})

const COINS = [
  { id:'bitcoin',   label:'Bitcoin (BTC)' },
  { id:'ethereum',  label:'Ethereum (ETH)' },
  { id:'solana',    label:'Solana (SOL)' },
  { id:'ripple',    label:'XRP (XRP)' },
  { id:'cardano',   label:'Cardano (ADA)' },
  { id:'dogecoin',  label:'Dogecoin (DOGE)' },
  { id:'avalanche-2', label:'Avalanche (AVAX)' },
  { id:'chainlink', label:'Chainlink (LINK)' },
]

export default function Converter() {
  const [amount, setAmount] = useState('100')
  const [from, setFrom] = useState('usd')
  const [to, setTo] = useState('bitcoin')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [prices, setPrices] = useState([])

  useEffect(() => {
    api.get('/prices').then(r => setPrices(r.data.prices || [])).catch(()=>{})
  }, [])

  const convert = async () => {
    if (!amount || parseFloat(amount) <= 0) return
    setLoading(true)
    try {
      const res = await api.get(`/converter?from=${from}&to=${to}&amount=${amount}`)
      setResult(res.data)
    } catch { setResult(null) } finally { setLoading(false) }
  }

  useEffect(() => { if (amount) convert() }, [amount, from, to])

  const currentCoin = prices.find(p => p.id === to)

  return (
    <div className="layout">
      <Sidebar/>
      <main className="main-content fade-up">
        <div className="page-hdr">
          <div><h1>Converter</h1><p>Instantly convert between USD and crypto</p></div>
        </div>

        <div className="converter-layout">
          <div className="card converter-card">
            <h2 style={{fontSize:18,fontWeight:700,marginBottom:24}}>Currency Converter</h2>

            <div className="converter-row">
              <div className="field">
                <label>Amount</label>
                <input type="number" value={amount} min="0" onChange={e=>setAmount(e.target.value)} placeholder="Enter amount"/>
              </div>
              <div className="field">
                <label>From</label>
                <select value={from} onChange={e=>setFrom(e.target.value)}>
                  <option value="usd">US Dollar (USD)</option>
                  <option value="eur">Euro (EUR)</option>
                  <option value="gbp">British Pound (GBP)</option>
                </select>
              </div>
            </div>

            <div className="converter-swap">
              <button className="swap-btn" onClick={()=>{}}>⇅</button>
            </div>

            <div className="field" style={{marginBottom:24}}>
              <label>To Cryptocurrency</label>
              <select value={to} onChange={e=>setTo(e.target.value)}>
                {COINS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </div>

            {loading ? (
              <div style={{textAlign:'center',padding:20}}><div className="spinner" style={{margin:'0 auto'}}/></div>
            ) : result ? (
              <div className="converter-result">
                <div className="result-from">
                  <span className="result-label">You spend</span>
                  <span className="result-amount">{fmt(result.amount, 2)} {from.toUpperCase()}</span>
                </div>
                <div className="result-arrow">→</div>
                <div className="result-to">
                  <span className="result-label">You get</span>
                  <span className="result-amount result-crypto">{fmt(result.converted, 8)}</span>
                  <span className="result-sym">{to.toUpperCase().slice(0,4)}</span>
                </div>
              </div>
            ) : null}

            {result && (
              <div className="converter-rate">
                1 {from.toUpperCase()} = {fmt(1/result.price, 8)} {to.toUpperCase().slice(0,4)}
                &nbsp;·&nbsp;
                1 {to.toUpperCase().slice(0,4)} = ${fmt(result.price, 2)}
              </div>
            )}
          </div>

          <div className="converter-sidebar">
            {currentCoin && (
              <div className="card coin-detail-card">
                <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:16}}>
                  <img src={currentCoin.image} alt={currentCoin.name} width={40} height={40} style={{borderRadius:'50%'}}/>
                  <div>
                    <div style={{fontWeight:700,fontSize:16,fontFamily:'var(--font-display)'}}>{currentCoin.name}</div>
                    <div style={{fontSize:12,color:'var(--text3)'}}>{currentCoin.symbol.toUpperCase()}</div>
                  </div>
                </div>
                {[
                  ['Current price', `$${fmt(currentCoin.current_price,2)}`],
                  ['24h change', `${currentCoin.price_change_percentage_24h>=0?'+':''}${fmt(currentCoin.price_change_percentage_24h,2)}%`],
                  ['Market cap', `$${(currentCoin.market_cap/1e9).toFixed(2)}B`],
                  ['24h volume', `$${(currentCoin.total_volume/1e9).toFixed(2)}B`],
                  ['All time high', `$${fmt(currentCoin.ath,2)}`],
                ].map(([k,v]) => (
                  <div key={k} style={{display:'flex',justifyContent:'space-between',padding:'10px 0',borderBottom:'1px solid var(--border)',fontSize:13}}>
                    <span style={{color:'var(--text2)'}}>{k}</span>
                    <strong style={{color: k==='24h change'?(currentCoin.price_change_percentage_24h>=0?'var(--up)':'var(--down)'):'var(--text)'}}>{v}</strong>
                  </div>
                ))}
              </div>
            )}

            <div className="card" style={{marginTop:14,background:'var(--blue-light)',border:'1px solid var(--blue-mid)'}}>
              <div style={{fontSize:13,fontWeight:700,color:'var(--blue)',marginBottom:8}}>Quick Buy</div>
              <p style={{fontSize:12,color:'var(--text2)',marginBottom:14,lineHeight:1.6}}>Ready to buy? Purchase {currentCoin?.name || 'crypto'} instantly with your card.</p>
              <a href="/buy" className="btn btn-primary btn-sm" style={{width:'100%',justifyContent:'center'}}>
                Buy {currentCoin?.symbol?.toUpperCase()} →
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
