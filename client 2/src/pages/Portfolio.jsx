import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Doughnut } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import Sidebar from '../components/Sidebar'
import api from '../hooks/useApi'
import './Portfolio.css'

ChartJS.register(ArcElement, Tooltip, Legend)

function fmt(n, d = 2) {
  return Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d })
}

const CHART_COLORS = ['#c9a84c','#3b82f6','#22c55e','#a78bfa','#f97316','#06b6d4','#ec4899']

export default function Portfolio() {
  const [portfolio, setPortfolio] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/portfolio/value')
      .then(r => setPortfolio(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const chartData = portfolio?.breakdown?.length ? {
    labels: portfolio.breakdown.map(h => h.symbol),
    datasets: [{
      data: portfolio.breakdown.map(h => h.valueUSD),
      backgroundColor: CHART_COLORS,
      borderColor: 'var(--bg2)',
      borderWidth: 3,
      hoverOffset: 6,
    }]
  } : null

  const chartOptions = {
    plugins: {
      legend: {
        position: 'right',
        labels: { color: '#8a9ab5', font: { family: 'DM Sans', size: 13 }, padding: 16 }
      },
      tooltip: {
        callbacks: {
          label: ctx => ` $${fmt(ctx.raw)}`,
        }
      }
    },
    cutout: '68%',
  }

  return (
    <div className="layout">
      <Sidebar />
      <main className="main-content fade-up">
        <div className="page-header">
          <div>
            <h1>Portfolio</h1>
            <p className="dash-sub">Your holdings and performance</p>
          </div>
          <Link to="/buy" className="btn btn-gold">+ Buy Crypto</Link>
        </div>

        {loading ? (
          <div style={{ display:'flex', justifyContent:'center', padding: 80 }}>
            <div className="spinner" />
          </div>
        ) : portfolio?.breakdown?.length === 0 ? (
          <div className="empty-portfolio card">
            <div className="empty-icon">◉</div>
            <h2>No holdings yet</h2>
            <p>Buy your first crypto to start tracking your portfolio.</p>
            <Link to="/buy" className="btn btn-gold" style={{ marginTop: 20 }}>Buy Crypto →</Link>
          </div>
        ) : (
          <>
            {/* Summary row */}
            <div className="port-summary">
              <div className="card port-stat">
                <span className="card-label">Total Value</span>
                <div className="card-value">${fmt(portfolio?.totalUSD)}</div>
              </div>
              <div className="card port-stat">
                <span className="card-label">Crypto</span>
                <div className="card-value">${fmt(portfolio?.cryptoUSD)}</div>
              </div>
              <div className="card port-stat">
                <span className="card-label">Total P&L</span>
                <div className={`card-value ${portfolio?.breakdown?.reduce((s,h) => s+h.gainLoss, 0) >= 0 ? 'up' : 'down'}`}>
                  ${fmt(portfolio?.breakdown?.reduce((s, h) => s + h.gainLoss, 0))}
                </div>
              </div>
            </div>

            {/* Chart + breakdown */}
            <div className="port-main">
              {chartData && (
                <div className="card chart-card">
                  <h2 style={{ fontSize:18, marginBottom:24 }}>Allocation</h2>
                  <div style={{ maxWidth: 340, margin: '0 auto' }}>
                    <Doughnut data={chartData} options={chartOptions} />
                  </div>
                </div>
              )}

              <div className="holdings-detail">
                <h2 style={{ fontSize:18, marginBottom:16 }}>Holdings detail</h2>
                {portfolio?.breakdown?.map(h => (
                  <div key={h.symbol} className="card holding-detail-card">
                    <div className="hd-top">
                      <div>
                        <span className="hd-symbol">{h.symbol}</span>
                        <span className="hd-asset">{h.asset}</span>
                      </div>
                      <span className="hd-value mono">${fmt(h.valueUSD)}</span>
                    </div>
                    <div className="hd-stats">
                      <div className="hd-stat">
                        <span>Holdings</span>
                        <span className="mono">{fmt(h.amount, 6)}</span>
                      </div>
                      <div className="hd-stat">
                        <span>Current price</span>
                        <span className="mono">${fmt(h.currentPrice)}</span>
                      </div>
                      <div className="hd-stat">
                        <span>Avg. buy price</span>
                        <span className="mono">${fmt(h.avgBuyPrice)}</span>
                      </div>
                      <div className="hd-stat">
                        <span>P&L</span>
                        <span className={`mono ${h.gainLoss >= 0 ? 'up' : 'down'}`}>
                          {h.gainLoss >= 0 ? '+' : ''}${fmt(h.gainLoss)} ({fmt(h.gainLossPct, 2)}%)
                        </span>
                      </div>
                      <div className="hd-stat">
                        <span>24h change</span>
                        <span className={h.change24h >= 0 ? 'up' : 'down'}>
                          {h.change24h >= 0 ? '+' : ''}{fmt(h.change24h, 2)}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
