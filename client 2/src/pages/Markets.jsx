import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import api from '../hooks/useApi'
import './Markets.css'

const fmt = (n,d=2) => Number(n||0).toLocaleString('en-US',{minimumFractionDigits:d,maximumFractionDigits:d})

function Spark({ data, positive }) {
  if (!data || data.length < 2) return null
  const w=80,h=32,min=Math.min(...data),max=Math.max(...data),range=max-min||1
  const pts = data.map((v,i)=>`${(i/(data.length-1))*w},${h-((v-min)/range)*h}`).join(' ')
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{display:'block'}}>
      <polyline points={pts} fill="none" stroke={positive?'var(--up)':'var(--down)'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

export default function Markets() {
  const [coins, setCoins] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('market_cap')

  useEffect(() => {
    api.get('/prices').then(r => setCoins(r.data.prices)).catch(console.error).finally(()=>setLoading(false))
    const iv = setInterval(() => api.get('/prices').then(r=>setCoins(r.data.prices)).catch(()=>{}), 30000)
    return () => clearInterval(iv)
  }, [])

  const filtered = coins
    .filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.symbol.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="layout">
      <Sidebar/>
      <main className="main-content fade-up">
        <div className="page-hdr">
          <div><h1>Markets</h1><p>Live crypto prices · Auto-refreshes every 30s</p></div>
          <Link to="/buy" className="btn btn-primary">+ Buy</Link>
        </div>

        <div className="markets-controls card" style={{padding:'12px 16px',marginBottom:16,flexDirection:'row',display:'flex',alignItems:'center',gap:12}}>
          <input style={{maxWidth:280,borderRadius:100,padding:'9px 16px',fontSize:13}} placeholder="Search coins..." value={search} onChange={e=>setSearch(e.target.value)}/>
          <span style={{fontSize:12,color:'var(--text3)',marginLeft:'auto'}}>
            {filtered.length} coins · Live data from CoinGecko
          </span>
        </div>

        {loading ? (
          <div style={{display:'flex',justifyContent:'center',padding:80}}><div className="spinner"/></div>
        ) : (
          <div className="card" style={{padding:0,overflow:'hidden'}}>
            <div className="mkts-head">
              <span>#</span><span>Name</span><span>Price</span>
              <span>1h</span><span>24h</span><span>7d</span>
              <span>Market Cap</span><span>7d Chart</span>
            </div>
            {filtered.map((c,i) => {
              const p1h  = c.price_change_percentage_1h_in_currency||0
              const p24h = c.price_change_percentage_24h_in_currency||0
              const p7d  = c.price_change_percentage_7d_in_currency||0
              return (
                <div key={c.id} className="mkts-row">
                  <span className="mkts-rank">{i+1}</span>
                  <div className="mkts-name">
                    <img src={c.image} alt={c.name} width={32} height={32} style={{borderRadius:'50%',flexShrink:0}}/>
                    <div>
                      <div style={{fontWeight:600,fontSize:14}}>{c.name}</div>
                      <div style={{fontSize:11,color:'var(--text3)'}}>{c.symbol.toUpperCase()}</div>
                    </div>
                  </div>
                  <span className="mono" style={{fontWeight:600}}>${fmt(c.current_price)}</span>
                  <span style={{color:p1h>=0?'var(--up)':'var(--down)',fontWeight:500,fontSize:13}}>{p1h>=0?'+':''}{fmt(p1h)}%</span>
                  <span style={{color:p24h>=0?'var(--up)':'var(--down)',fontWeight:500,fontSize:13}}>{p24h>=0?'+':''}{fmt(p24h)}%</span>
                  <span style={{color:p7d>=0?'var(--up)':'var(--down)',fontWeight:500,fontSize:13}}>{p7d>=0?'+':''}{fmt(p7d)}%</span>
                  <span className="mono" style={{fontSize:13,color:'var(--text2)'}}>${(c.market_cap/1e9).toFixed(2)}B</span>
                  <Spark data={c.sparkline_in_7d?.price} positive={p7d>=0}/>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
