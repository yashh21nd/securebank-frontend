import React, { useState, useEffect } from 'react'
import Dashboard from './components/Dashboard'
import About from './components/About'
import Payment from './components/Payment'
import VoicePayment from './components/VoicePayment'
import NotificationCenter from './components/NotificationCenter'
import Profile from './components/Profile'
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
          {isLoggedIn && (
            <button 
              onClick={() => setActiveSection('profile')} 
              className={`nav-link ${activeSection === 'profile' ? 'active' : ''}`}
            >
              Profile
            </button>
          )}
          
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
        {activeSection === 'profile' && (
          <Profile 
            user={user} 
            isLoggedIn={isLoggedIn}
            onUserUpdate={(updatedUser) => setUser(updatedUser)}
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
          border-left: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .user-name {
          font-weight: 500;
          color: white;
        }
        
        .user-balance {
          background: rgba(253, 252, 247, 0.95);
          color: #4a5a3c;
          padding: 10px 18px;
          border-radius: 24px;
          font-weight: 700;
          font-size: 14px;
          font-family: 'Playfair Display', serif;
        }
        
        .btn-logout {
          padding: 10px 18px;
          background: rgba(255, 255, 255, 0.12);
          border: 1px solid rgba(255, 255, 255, 0.25);
          border-radius: 12px;
          cursor: pointer;
          color: white;
          font-weight: 500;
          transition: all 0.3s ease;
        }
        
        .btn-logout:hover {
          background: rgba(255, 255, 255, 0.22);
          transform: translateY(-2px);
        }
        
        .btn-login {
          padding: 12px 28px;
          background: rgba(253, 252, 247, 0.95);
          color: #4a5a3c;
          border: none;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
          margin-left: 16px;
        }
        
        .btn-login:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
        }
        
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(61, 74, 51, 0.6);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 3000;
          animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        .modal-card {
          background: rgba(255, 254, 249, 0.98);
          padding: 48px;
          border-radius: 28px;
          width: 440px;
          max-width: 90%;
          position: relative;
          box-shadow: 0 30px 60px rgba(61, 74, 51, 0.25);
          animation: slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          border: 1px solid rgba(255, 255, 255, 0.5);
        }

        @keyframes slideUp {
          from { transform: translateY(30px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        
        .modal-close {
          position: absolute;
          top: 18px;
          right: 22px;
          background: rgba(246, 247, 244, 0.9);
          border: none;
          font-size: 20px;
          color: #5d7049;
          cursor: pointer;
          width: 38px;
          height: 38px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        }
        
        .modal-close:hover {
          background: rgba(212, 218, 201, 0.8);
          color: #3d4a33;
        }
        
        .modal-card h2 {
          margin: 0 0 28px 0;
          text-align: center;
          font-family: 'Playfair Display', serif;
          color: #3d4a33;
          font-size: 26px;
        }
        
        .modal-card form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        
        .btn-demo {
          padding: 15px;
          background: rgba(246, 247, 244, 0.9);
          color: #5d7049;
          border: 2px solid rgba(212, 218, 201, 0.6);
          border-radius: 14px;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.3s ease;
          width: 100%;
          font-weight: 500;
        }
        
        .btn-demo:hover {
          background: rgba(232, 235, 227, 0.9);
          border-color: #94a37e;
        }
        
        .auth-error {
          background: rgba(254, 242, 242, 0.9);
          color: #b91c1c;
          padding: 14px 18px;
          border-radius: 12px;
          margin-bottom: 16px;
          text-align: center;
          font-size: 14px;
        }
        
        .auth-switch {
          text-align: center;
          margin-top: 24px;
          color: #5d7049;
          font-size: 14px;
        }
        
        .auth-switch button {
          background: none;
          border: none;
          color: #768b5f;
          cursor: pointer;
          font-weight: 600;
          margin-left: 4px;
        }
        
        .auth-switch button:hover {
          text-decoration: underline;
          color: #4a5a3c;
        }

        @media (max-width: 900px) {
          .user-menu {
            margin-left: 0;
            padding-left: 0;
            border-left: none;
            margin-top: 8px;
            padding-top: 16px;
            border-top: 1px solid rgba(255, 255, 255, 0.15);
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
