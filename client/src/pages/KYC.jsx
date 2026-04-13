import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import { useAuth } from '../context/AuthContext'
import api from '../hooks/useApi'
import './KYC.css'

const STEPS = ['Personal Info', 'Address', 'Document', 'Review']
const COUNTRIES = ['United States','United Kingdom','Canada','Australia','Germany','France','Nigeria','India','Brazil','Japan','Singapore','UAE']
const DOC_TYPES = [
  { value: 'passport', label: '🛂 Passport' },
  { value: 'drivers_license', label: '🪪 Driver\'s License' },
  { value: 'national_id', label: '🪪 National ID' },
]

export default function KYC() {
  const { user, refreshUser } = useAuth()
  const [step, setStep] = useState(0)
  const [kycData, setKycData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [form, setForm] = useState({
    firstName: user?.firstName || '', lastName: user?.lastName || '',
    dateOfBirth: '', nationality: 'United States',
    address: '', city: '', country: 'United States', zipCode: '',
    documentType: 'passport', documentNumber: '',
    documentFront: '', documentBack: '', selfie: '',
  })

  useEffect(() => {
    api.get('/kyc/status').then(r => setKycData(r.data.kyc)).catch(()=>{}).finally(()=>setLoading(false))
  }, [])

  const set = k => e => setForm(p => ({...p, [k]: e.target.value}))

  const handleFile = k => e => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => setForm(p => ({...p, [k]: ev.target.result.split(',')[1]}))
    reader.readAsDataURL(file)
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      await api.post('/kyc/submit', form)
      await refreshUser()
      setSuccess(true)
    } catch (err) {
      alert(err.response?.data?.error || 'Submission failed')
    } finally { setSubmitting(false) }
  }

  if (loading) return <div className="layout"><Sidebar/><main className="main-content"><div className="page-loading" style={{height:'60vh',display:'flex',alignItems:'center',justifyContent:'center'}}><div className="spinner"/></div></main></div>

  if (success || kycData?.status === 'under_review') return (
    <div className="layout"><Sidebar/>
      <main className="main-content fade-up">
        <div className="kyc-status-card card">
          <div className="kyc-status-icon">⏳</div>
          <h2>Verification Under Review</h2>
          <p>Your documents have been submitted and are being reviewed. This usually takes 1–2 business days. You'll be notified once your account is verified.</p>
          <div className="tag tag-orange" style={{fontSize:13,padding:'6px 16px'}}>Under Review</div>
        </div>
      </main>
    </div>
  )

  if (kycData?.status === 'approved') return (
    <div className="layout"><Sidebar/>
      <main className="main-content fade-up">
        <div className="kyc-status-card card">
          <div className="kyc-status-icon">✅</div>
          <h2>Identity Verified</h2>
          <p>Your identity has been successfully verified. You have full access to all BitForge features.</p>
          <div className="tag tag-green" style={{fontSize:13,padding:'6px 16px'}}>✓ Verified</div>
        </div>
      </main>
    </div>
  )

  if (kycData?.status === 'rejected') return (
    <div className="layout"><Sidebar/>
      <main className="main-content fade-up">
        <div className="kyc-status-card card">
          <div className="kyc-status-icon">❌</div>
          <h2>Verification Rejected</h2>
          <p>Your verification was rejected. Reason: <strong>{kycData.rejectionReason || 'Documents unclear'}</strong>. Please resubmit with clearer documents.</p>
          <button className="btn btn-primary" onClick={() => setKycData(null)}>Resubmit KYC</button>
        </div>
      </main>
    </div>
  )

  return (
    <div className="layout"><Sidebar/>
      <main className="main-content fade-up">
        <div className="page-hdr">
          <div><h1>Identity Verification</h1><p>Complete KYC to unlock full platform access</p></div>
        </div>

        <div className="kyc-steps">
          {STEPS.map((s, i) => (
            <div key={s} className={`kyc-step ${i===step?'active':i<step?'done':''}`}>
              <div className="kyc-step-num">{i < step ? '✓' : i+1}</div>
              <span>{s}</span>
            </div>
          ))}
        </div>

        <div className="card kyc-form-card">
          {step === 0 && (
            <div className="form">
              <h2 className="kyc-step-title">Personal Information</h2>
              <div className="field-row">
                <div className="field"><label>First name</label><input value={form.firstName} onChange={set('firstName')} /></div>
                <div className="field"><label>Last name</label><input value={form.lastName} onChange={set('lastName')} /></div>
              </div>
              <div className="field"><label>Date of birth</label><input type="date" value={form.dateOfBirth} onChange={set('dateOfBirth')} /></div>
              <div className="field"><label>Nationality</label>
                <select value={form.nationality} onChange={set('nationality')}>
                  {COUNTRIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="form">
              <h2 className="kyc-step-title">Residential Address</h2>
              <div className="field"><label>Street address</label><input placeholder="123 Main St" value={form.address} onChange={set('address')} /></div>
              <div className="field-row">
                <div className="field"><label>City</label><input placeholder="New York" value={form.city} onChange={set('city')} /></div>
                <div className="field"><label>ZIP / Postal code</label><input placeholder="10001" value={form.zipCode} onChange={set('zipCode')} /></div>
              </div>
              <div className="field"><label>Country</label>
                <select value={form.country} onChange={set('country')}>
                  {COUNTRIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="form">
              <h2 className="kyc-step-title">Identity Document</h2>
              <div className="field"><label>Document type</label>
                <select value={form.documentType} onChange={set('documentType')}>
                  {DOC_TYPES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                </select>
              </div>
              <div className="field"><label>Document number</label><input placeholder="e.g. A12345678" value={form.documentNumber} onChange={set('documentNumber')} /></div>
              <div className="field">
                <label>Document front photo</label>
                <div className="file-upload">
                  <input type="file" accept="image/*" onChange={handleFile('documentFront')} id="doc-front" style={{display:'none'}}/>
                  <label htmlFor="doc-front" className="file-upload-label">
                    {form.documentFront ? '✓ Front uploaded' : '📷 Upload front of document'}
                  </label>
                </div>
              </div>
              {form.documentType !== 'passport' && (
                <div className="field">
                  <label>Document back photo</label>
                  <div className="file-upload">
                    <input type="file" accept="image/*" onChange={handleFile('documentBack')} id="doc-back" style={{display:'none'}}/>
                    <label htmlFor="doc-back" className="file-upload-label">
                      {form.documentBack ? '✓ Back uploaded' : '📷 Upload back of document'}
                    </label>
                  </div>
                </div>
              )}
              <div className="field">
                <label>Selfie with document</label>
                <div className="file-upload">
                  <input type="file" accept="image/*" capture="user" onChange={handleFile('selfie')} id="selfie" style={{display:'none'}}/>
                  <label htmlFor="selfie" className="file-upload-label">
                    {form.selfie ? '✓ Selfie uploaded' : '🤳 Take selfie holding document'}
                  </label>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="form">
              <h2 className="kyc-step-title">Review & Submit</h2>
              <div className="review-grid">
                <div className="review-item"><span>Name</span><strong>{form.firstName} {form.lastName}</strong></div>
                <div className="review-item"><span>Date of birth</span><strong>{form.dateOfBirth}</strong></div>
                <div className="review-item"><span>Nationality</span><strong>{form.nationality}</strong></div>
                <div className="review-item"><span>Address</span><strong>{form.address}, {form.city}</strong></div>
                <div className="review-item"><span>Country</span><strong>{form.country} {form.zipCode}</strong></div>
                <div className="review-item"><span>Document</span><strong>{DOC_TYPES.find(d=>d.value===form.documentType)?.label} #{form.documentNumber}</strong></div>
                <div className="review-item"><span>Front photo</span><strong>{form.documentFront?'✓ Uploaded':'Not uploaded'}</strong></div>
                <div className="review-item"><span>Selfie</span><strong>{form.selfie?'✓ Uploaded':'Not uploaded'}</strong></div>
              </div>
              <div className="kyc-disclaimer">
                By submitting, you confirm all information is accurate and you consent to identity verification. Your data is encrypted and stored securely.
              </div>
            </div>
          )}

          <div className="kyc-nav">
            {step > 0 && <button className="btn btn-ghost" onClick={() => setStep(s=>s-1)}>← Back</button>}
            <div style={{flex:1}}/>
            {step < 3
              ? <button className="btn btn-primary" onClick={() => setStep(s=>s+1)}>Continue →</button>
              : <button className="btn btn-green" onClick={handleSubmit} disabled={submitting}>
                  {submitting ? <span className="spinner" style={{width:16,height:16,borderTopColor:'white'}}/> : '✓ Submit for Review'}
                </button>
            }
          </div>
        </div>
      </main>
    </div>
  )
}
