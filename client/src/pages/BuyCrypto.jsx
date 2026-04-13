import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import { useAuth } from '../context/AuthContext'
import api from '../hooks/useApi'
import './BuyCrypto.css'

const COINS = [
  { id:'bitcoin',   symbol:'BTC', name:'Bitcoin',  moonpay:'btc',  color:'#F7931A' },
  { id:'ethereum',  symbol:'ETH', name:'Ethereum', moonpay:'eth',  color:'#627EEA' },
  { id:'solana',    symbol:'SOL', name:'Solana',   moonpay:'sol',  color:'#9945FF' },
  { id:'ripple',    symbol:'XRP', name:'XRP',      moonpay:'xrp',  color:'#00AAE4' },
  { id:'cardano',   symbol:'ADA', name:'Cardano',  moonpay:'ada',  color:'#0033AD' },
  { id:'dogecoin',  symbol:'DOGE',name:'Dogecoin', moonpay:'doge', color:'#C2A633' },
]
const AMOUNTS = [25, 50, 100, 250, 500, 1000]

const fmt = (n,d=2) => Number(n||0).toLocaleString('en-US',{minimumFractionDigits:d,maximumFractionDigits:d})

export default function BuyCrypto() {
  const { user } = useAuth()
  const location = useLocation()
  const preselected = COINS.find(c => c.id === location.state?.coinId)
  const [selected, setSelected] = useState(preselected || COINS[0])
  const [amount, setAmount] = useState(100)
  const [custom, setCustom] = useState('')
  const [prices, setPrices] = useState({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.get('/prices').then(r => {
      const m = {}; r.data.prices.forEach(c => m[c.id] = c.current_price)
      setPrices(m)
    }).catch(()=>{})
  }, [])

  const finalAmt = custom ? parseFloat(custom)||0 : amount
  const estCrypto = prices[selected.id] ? (finalAmt / prices[selected.id]).toFixed(6) : '—'

  const openMoonPay = async () => {
    if (user?.kycStatus !== 'approved') {
      alert('You need to complete KYC verification before buying crypto. Please go to the Verification page.')
      return
    }
    setLoading(true)
    try {
      const { data: config } = await api.get('/moonpay/config')
      const sdk = window.MoonPayWebSdk?.init({
        flow: 'buy',
        environment: config.environment,
        variant: 'overlay',
        params: {
          apiKey: config.apiKey,
          baseCurrencyCode: 'usd',
          baseCurrencyAmount: String(finalAmt),
          defaultCurrencyCode: selected.moonpay,
          email: config.email,
          externalTransactionId: user._id,
          colorCode: '%233375BB',
          theme: 'light',
        },
        handlers: {
          async onTransactionCompleted(tx) { console.log('TX complete:', tx) }
        }
      })
      if (!sdk) throw new Error('MoonPay SDK not loaded')
      const urlForSigning = sdk.generateUrlForSigning?.()
      if (urlForSigning) {
        const { data: sig } = await api.post('/moonpay/sign-url', { url: urlForSigning })
        sdk.updateSignature?.(sig.signature)
      }
      sdk.show()
    } catch (err) {
      console.error(err)
      alert('Could not open payment. Make sure backend is running with MoonPay keys set.')
    } finally { setLoading(false) }
  }

  const kycNotApproved = user?.kycStatus !== 'approved'

  return (
    <div className="layout">
      <Sidebar/>
      <main className="main-content fade-up">
        <div className="page-hdr">
          <div><h1>Buy Crypto</h1><p>Purchase crypto instantly with your card or bank transfer</p></div>
        </div>

        {kycNotApproved && (
          <div className="buy-kyc-notice">
            <span>🔐</span>
            <div>
              <strong>KYC required to buy crypto.</strong> Complete identity verification to unlock purchases.
              {user?.kycStatus === 'under_review' ? ' Your verification is currently under review.' : ''}
            </div>
            {user?.kycStatus !== 'under_review' && (
              <a href="/kyc" className="btn btn-primary btn-sm">Verify now →</a>
            )}
          </div>
        )}

        <div className="buy-layout">
          <div className="card buy-left">
            <h3 className="buy-section-label">Select asset</h3>
            <div className="coin-grid">
              {COINS.map(c => (
                <button key={c.id} className={`coin-btn ${selected.id===c.id?'active':''}`}
                  style={selected.id===c.id?{borderColor:c.color,background:`${c.color}10`}:{}}
                  onClick={()=>setSelected(c)}>
                  <div className="coin-dot" style={{background:c.color}}/>
                  <div>
                    <div style={{fontWeight:700,fontSize:14,fontFamily:'var(--font-display)'}}>{c.symbol}</div>
                    <div style={{fontSize:11,color:'var(--text2)'}}>{c.name}</div>
                  </div>
                  {prices[c.id] && <div style={{marginLeft:'auto',fontSize:12,color:'var(--text2)',fontVariantNumeric:'tabular-nums'}}>${fmt(prices[c.id])}</div>}
                </button>
              ))}
            </div>

            <h3 className="buy-section-label" style={{marginTop:24}}>Amount (USD)</h3>
            <div className="amount-grid">
              {AMOUNTS.map(a => (
                <button key={a} className={`amt-btn ${!custom&&amount===a?'active':''}`}
                  onClick={()=>{setAmount(a);setCustom('')}}>
                  ${a}
                </button>
              ))}
            </div>
            <div style={{position:'relative',marginTop:10}}>
              <span style={{position:'absolute',left:14,top:'50%',transform:'translateY(-50%)',color:'var(--text2)',fontSize:15,pointerEvents:'none'}}>$</span>
              <input type="number" placeholder="Custom amount" min="10" value={custom}
                style={{paddingLeft:28}} onChange={e=>setCustom(e.target.value)}/>
            </div>
          </div>

          <div className="buy-right">
            <div className="card buy-summary">
              <h3 className="buy-section-label">Order summary</h3>
              <div className="summary-rows">
                <div className="summary-row"><span>You pay</span><strong className="mono">${fmt(finalAmt)} USD</strong></div>
                <div className="summary-row"><span>You receive (est.)</span><strong className="mono">{estCrypto} {selected.symbol}</strong></div>
                <div className="summary-row"><span>Rate</span><strong className="mono">${prices[selected.id]?fmt(prices[selected.id]):'—'}</strong></div>
                <div className="summary-row"><span>Provider</span>
                  <span style={{background:'var(--blue-light)',color:'var(--blue)',fontSize:12,fontWeight:700,padding:'3px 10px',borderRadius:100}}>MoonPay</span>
                </div>
              </div>

              <button className="btn btn-primary" style={{width:'100%',padding:14,fontSize:15,marginTop:4,minHeight:50}}
                onClick={openMoonPay} disabled={!finalAmt||finalAmt<10||loading||kycNotApproved}>
                {loading
                  ? <span className="spinner" style={{width:18,height:18,borderTopColor:'white'}}/>
                  : kycNotApproved ? '🔐 KYC Required'
                  : `Buy ${selected.symbol} →`}
              </button>

              {!kycNotApproved && (
                <p style={{fontSize:11,color:'var(--text3)',marginTop:12,lineHeight:1.6}}>
                  Min $10 · Powered by MoonPay. Test card: <code style={{background:'var(--bg)',padding:'1px 5px',borderRadius:4}}>4000 0209 5159 5032</code>
                </p>
              )}
            </div>

            <div className="card" style={{background:'var(--blue-light)',border:'1px solid var(--blue-mid)',marginTop:14}}>
              <div style={{fontSize:13,fontWeight:700,color:'var(--blue)',marginBottom:6}}>About MoonPay</div>
              <p style={{fontSize:12,color:'var(--text2)',lineHeight:1.6}}>MoonPay supports 150+ countries, Visa, Mastercard, Apple Pay, Google Pay and bank transfers. All transactions are secured and KYC-compliant.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
