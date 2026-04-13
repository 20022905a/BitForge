import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Markets from './pages/Markets'
import Wallet from './pages/Wallet'
import Portfolio from './pages/Portfolio'
import BuyCrypto from './pages/BuyCrypto'
import KYC from './pages/KYC'
import Transactions from './pages/Transactions'
import Settings from './pages/Settings'
import AdminPanel from './pages/AdminPanel'
import Converter from './pages/Converter'

function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="page-loading"><div className="spinner" /></div>
  if (!user) return <Navigate to="/login" replace />
  if (adminOnly && user.role !== 'admin') return <Navigate to="/dashboard" replace />
  return children
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  return user ? <Navigate to="/dashboard" replace /> : children
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login"    element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
            <Route path="/dashboard"    element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/markets"      element={<ProtectedRoute><Markets /></ProtectedRoute>} />
            <Route path="/wallet"       element={<ProtectedRoute><Wallet /></ProtectedRoute>} />
            <Route path="/portfolio"    element={<ProtectedRoute><Portfolio /></ProtectedRoute>} />
            <Route path="/buy"          element={<ProtectedRoute><BuyCrypto /></ProtectedRoute>} />
            <Route path="/kyc"          element={<ProtectedRoute><KYC /></ProtectedRoute>} />
            <Route path="/transactions" element={<ProtectedRoute><Transactions /></ProtectedRoute>} />
            <Route path="/settings"     element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/converter"    element={<ProtectedRoute><Converter /></ProtectedRoute>} />
            <Route path="/admin"        element={<ProtectedRoute adminOnly><AdminPanel /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}
