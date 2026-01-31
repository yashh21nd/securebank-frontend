import React, { useState, useEffect } from 'react'
import Dashboard from './components/Dashboard'
import About from './components/About'
import Payment from './components/Payment'
import VoicePayment from './components/VoicePayment'
import NotificationCenter from './components/NotificationCenter'
import { authAPI, getAuthToken, setAuthToken, clearAuthToken } from './services/api'

export default function App() {
  const [activeSection, setActiveSection] = useState('dashboard')
  const [user, setUser] = useState(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [showLogin, setShowLogin] = useState(false)
  const [loginForm, setLoginForm] = useState({ username: '', password: '' })
  const [registerForm, setRegisterForm] = useState({ 
    username: '', 
    email: '', 
    password: '', 
    full_name: '',
    phone: '' 
  })
  const [isRegistering, setIsRegistering] = useState(false)
  const [authError, setAuthError] = useState('')
  const [balance, setBalance] = useState(10000)
  const [pendingTransaction, setPendingTransaction] = useState(null)

  useEffect(() => {
    const token = getAuthToken()
    if (token) {
      loadUserProfile()
    }
  }, [])

  const loadUserProfile = async () => {
    try {
      const data = await authAPI.getProfile()
      setUser(data.user)
      setIsLoggedIn(true)
      if (data.accounts && data.accounts.length > 0) {
        setBalance(data.accounts[0].balance)
      }
    } catch (err) {
      console.error('Failed to load profile:', err)
      clearAuthToken()
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setAuthError('')
    
    try {
      const data = await authAPI.login(loginForm)
      setUser(data.user)
      setIsLoggedIn(true)
      setShowLogin(false)
      if (data.accounts && data.accounts.length > 0) {
        setBalance(data.accounts[0].balance)
      }
    } catch (err) {
      setAuthError(err.message || 'Login failed')
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setAuthError('')
    
    try {
      const data = await authAPI.register(registerForm)
      setUser(data.user)
      setAuthToken(data.token)
      setIsLoggedIn(true)
      setShowLogin(false)
      if (data.account) {
        setBalance(data.account.balance)
      }
    } catch (err) {
      setAuthError(err.message || 'Registration failed')
    }
  }

  const handleLogout = () => {
    authAPI.logout()
    setUser(null)
    setIsLoggedIn(false)
    setActiveSection('dashboard')
  }

  const handleBalanceUpdate = (newBalance) => {
    setBalance(newBalance)
  }

  const handleTransactionAdd = (transaction) => {
    setPendingTransaction(transaction)
    // Delay switching to dashboard to allow animation to complete
    setTimeout(() => {
      if (activeSection !== 'dashboard') {
        setActiveSection('dashboard')
      }
    }, 4000) // Wait 4 seconds for animation to complete
  }

  const handleTransactionProcessed = (txId) => {
    if (pendingTransaction?.id === txId) {
      setPendingTransaction(null)
    }
  }

  const handleDemoLogin = () => {
    const demoUser = {
      id: 'demo-user-1',
      username: 'demo_user',
      email: 'demo@securebank.com',
      full_name: 'Demo User',
      upi_id: 'demo_user@securebank'
    }
    setUser(demoUser)
    setIsLoggedIn(true)
    setShowLogin(false)
    // Set a demo token for API calls
    setAuthToken('demo-token-' + Date.now())
  }

  return (
    <div className="app-root">
      <header className="app-header">
        <div className="brand">
          <div className="logo">SB</div>
          <div>
            <h1>SecureBank</h1>
            <p className="subtitle">Enhancing Trust Through Advanced Web Security</p>
          </div>
        </div>
        <nav className="nav-links">
          <button 
            onClick={() => setActiveSection('dashboard')} 
            className={`nav-link ${activeSection === 'dashboard' ? 'active' : ''}`}
          >
            Dashboard
          </button>
          <button 
            onClick={() => setActiveSection('payments')} 
            className={`nav-link ${activeSection === 'payments' ? 'active' : ''}`}
          >
            Payments
          </button>
          <button 
            onClick={() => setActiveSection('voice')} 
            className={`nav-link ${activeSection === 'voice' ? 'active' : ''}`}
          >
            Voice Pay
          </button>
          <button 
            onClick={() => setActiveSection('about')} 
            className={`nav-link ${activeSection === 'about' ? 'active' : ''}`}
          >
            About
          </button>
          
          {isLoggedIn ? (
            <div className="user-menu">
              <span className="user-name">{user?.full_name || user?.username}</span>
              <span className="user-balance">₹{balance.toFixed(2)}</span>
              <button className="btn-logout" onClick={handleLogout}>Logout</button>
            </div>
          ) : (
            <button className="btn-login" onClick={() => setShowLogin(true)}>
              Login
            </button>
          )}
        </nav>
      </header>

      <main className="app-main">
        {activeSection === 'dashboard' && (
          <>
            {isLoggedIn && <NotificationCenter getAuthToken={getAuthToken} />}
            <Dashboard 
              newTransaction={pendingTransaction} 
              onTransactionProcessed={handleTransactionProcessed}
            />
          </>
        )}
        {activeSection === 'payments' && (
          <Payment 
            user={user} 
            onBalanceUpdate={handleBalanceUpdate} 
            isLoggedIn={isLoggedIn}
            onTransactionAdd={handleTransactionAdd}
          />
        )}
        {activeSection === 'voice' && (
          <VoicePayment 
            user={user} 
            onPaymentComplete={(result) => {
              if (result?.new_balance) handleBalanceUpdate(result.new_balance)
            }} 
            isLoggedIn={isLoggedIn}
            currentBalance={balance}
            onTransactionAdd={handleTransactionAdd}
          />
        )}
        {activeSection === 'about' && <About />}
      </main>

      <footer className="app-footer">
        <div className="footer-content">
          <span>© 2026 SecureBank - All Rights Reserved</span>
          <span className="footer-features">
            ML Fraud Detection • Blockchain QR • Voice Payments • Real-time Updates
          </span>
        </div>
      </footer>

      {showLogin && (
        <div className="modal-overlay" onClick={() => setShowLogin(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowLogin(false)}>×</button>
            
            <h2>{isRegistering ? 'Create Account' : 'Welcome Back'}</h2>
            
            {authError && <div className="auth-error">{authError}</div>}
            
            {!isRegistering ? (
              <form onSubmit={handleLogin}>
                <input
                  type="text"
                  placeholder="Username"
                  value={loginForm.username}
                  onChange={e => setLoginForm({...loginForm, username: e.target.value})}
                  required
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={loginForm.password}
                  onChange={e => setLoginForm({...loginForm, password: e.target.value})}
                  required
                />
                <button type="submit" className="btn-primary" style={{width: '100%', marginTop: '8px'}}>
                  Login
                </button>
                <button type="button" className="btn-demo" onClick={handleDemoLogin}>
                  Try Demo Mode
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegister}>
                <input
                  type="text"
                  placeholder="Full Name"
                  value={registerForm.full_name}
                  onChange={e => setRegisterForm({...registerForm, full_name: e.target.value})}
                  required
                />
                <input
                  type="text"
                  placeholder="Username"
                  value={registerForm.username}
                  onChange={e => setRegisterForm({...registerForm, username: e.target.value})}
                  required
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={registerForm.email}
                  onChange={e => setRegisterForm({...registerForm, email: e.target.value})}
                  required
                />
                <input
                  type="tel"
                  placeholder="Phone (optional)"
                  value={registerForm.phone}
                  onChange={e => setRegisterForm({...registerForm, phone: e.target.value})}
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={registerForm.password}
                  onChange={e => setRegisterForm({...registerForm, password: e.target.value})}
                  required
                />
                <button type="submit" className="btn-primary" style={{width: '100%', marginTop: '8px'}}>
                  Register
                </button>
              </form>
            )}
            
            <p className="auth-switch">
              {isRegistering ? (
                <>Already have an account? <button onClick={() => setIsRegistering(false)}>Login</button></>
              ) : (
                <>Don't have an account? <button onClick={() => setIsRegistering(true)}>Register</button></>
              )}
            </p>
          </div>
        </div>
      )}

      <style>{`
        .user-menu {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-left: 16px;
          padding-left: 16px;
          border-left: 1px solid rgba(255, 255, 255, 0.3);
        }
        
        .user-name {
          font-weight: 500;
          color: white;
        }
        
        .user-balance {
          background: white;
          color: #059669;
          padding: 8px 16px;
          border-radius: 20px;
          font-weight: 700;
          font-size: 14px;
        }
        
        .btn-logout {
          padding: 8px 16px;
          background: rgba(255, 255, 255, 0.15);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 8px;
          cursor: pointer;
          color: white;
          font-weight: 500;
          transition: all 0.2s;
        }
        
        .btn-logout:hover {
          background: rgba(255, 255, 255, 0.25);
        }
        
        .btn-login {
          padding: 10px 24px;
          background: white;
          color: #059669;
          border: none;
          border-radius: 10px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          margin-left: 16px;
        }
        
        .btn-login:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
        }
        
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 3000;
          animation: fadeIn 0.2s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        .modal-card {
          background: white;
          padding: 40px;
          border-radius: 24px;
          width: 420px;
          max-width: 90%;
          position: relative;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
          animation: slideUp 0.3s ease;
        }

        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        
        .modal-close {
          position: absolute;
          top: 16px;
          right: 20px;
          background: #f3f4f6;
          border: none;
          font-size: 20px;
          color: #6b7280;
          cursor: pointer;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }
        
        .modal-close:hover {
          background: #e5e7eb;
          color: #374151;
        }
        
        .modal-card h2 {
          margin: 0 0 24px 0;
          text-align: center;
          font-family: 'Poppins', sans-serif;
          color: #1f2937;
        }
        
        .modal-card form {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        
        .btn-demo {
          padding: 14px;
          background: #f3f4f6;
          color: #6b7280;
          border: none;
          border-radius: 12px;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
          width: 100%;
        }
        
        .btn-demo:hover {
          background: #e5e7eb;
        }
        
        .auth-error {
          background: #fef2f2;
          color: #dc2626;
          padding: 12px 16px;
          border-radius: 10px;
          margin-bottom: 16px;
          text-align: center;
          font-size: 14px;
        }
        
        .auth-switch {
          text-align: center;
          margin-top: 20px;
          color: #6b7280;
          font-size: 14px;
        }
        
        .auth-switch button {
          background: none;
          border: none;
          color: #059669;
          cursor: pointer;
          font-weight: 600;
          margin-left: 4px;
        }
        
        .auth-switch button:hover {
          text-decoration: underline;
        }

        @media (max-width: 900px) {
          .user-menu {
            margin-left: 0;
            padding-left: 0;
            border-left: none;
            margin-top: 8px;
            padding-top: 16px;
            border-top: 1px solid rgba(255, 255, 255, 0.2);
            flex-wrap: wrap;
            justify-content: center;
          }
          
          .btn-login {
            margin-left: 0;
            margin-top: 8px;
          }
        }
      `}</style>
    </div>
  )
}
