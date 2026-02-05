import React, { useState, useEffect } from 'react'
import { authAPI, pinAPI } from '../services/api'

export default function Profile({ user, isLoggedIn, onUserUpdate }) {
  const [activeTab, setActiveTab] = useState('profile')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  
  // PIN States
  const [pinStatus, setPinStatus] = useState({ has_pin: false, is_locked: false, attempts_remaining: 3 })
  const [setupPinForm, setSetupPinForm] = useState({ pin: '', confirmPin: '' })
  const [changePinForm, setChangePinForm] = useState({ currentPin: '', newPin: '', confirmPin: '' })
  const [resetPinForm, setResetPinForm] = useState({ password: '', newPin: '', confirmPin: '' })
  const [showResetPin, setShowResetPin] = useState(false)
  
  // Profile States
  const [profileForm, setProfileForm] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    phone: user?.phone || ''
  })

  useEffect(() => {
    loadPinStatus()
  }, [])

  useEffect(() => {
    if (user) {
      setProfileForm({
        full_name: user.full_name || '',
        email: user.email || '',
        phone: user.phone || ''
      })
    }
  }, [user])

  const loadPinStatus = async () => {
    try {
      const status = await pinAPI.getStatus()
      setPinStatus(status)
    } catch (err) {
      console.error('Failed to load PIN status:', err)
    }
  }

  const showMessage = (type, text) => {
    setMessage({ type, text })
    setTimeout(() => setMessage({ type: '', text: '' }), 4000)
  }

  const handleSetupPin = async (e) => {
    e.preventDefault()
    if (setupPinForm.pin !== setupPinForm.confirmPin) {
      showMessage('error', 'PINs do not match')
      return
    }
    if (setupPinForm.pin.length !== 4 || !/^\d+$/.test(setupPinForm.pin)) {
      showMessage('error', 'PIN must be exactly 4 digits')
      return
    }

    setLoading(true)
    try {
      await pinAPI.setup(setupPinForm.pin, setupPinForm.confirmPin)
      showMessage('success', 'Security PIN created successfully')
      setSetupPinForm({ pin: '', confirmPin: '' })
      loadPinStatus()
    } catch (err) {
      showMessage('error', err.message || 'Failed to set up PIN')
    } finally {
      setLoading(false)
    }
  }

  const handleChangePin = async (e) => {
    e.preventDefault()
    if (changePinForm.newPin !== changePinForm.confirmPin) {
      showMessage('error', 'New PINs do not match')
      return
    }
    if (changePinForm.newPin.length !== 4 || !/^\d+$/.test(changePinForm.newPin)) {
      showMessage('error', 'PIN must be exactly 4 digits')
      return
    }

    setLoading(true)
    try {
      await pinAPI.change(changePinForm.currentPin, changePinForm.newPin, changePinForm.confirmPin)
      showMessage('success', 'PIN changed successfully')
      setChangePinForm({ currentPin: '', newPin: '', confirmPin: '' })
      loadPinStatus()
    } catch (err) {
      showMessage('error', err.message || 'Failed to change PIN')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPin = async (e) => {
    e.preventDefault()
    if (resetPinForm.newPin !== resetPinForm.confirmPin) {
      showMessage('error', 'PINs do not match')
      return
    }

    setLoading(true)
    try {
      await pinAPI.reset(resetPinForm.password, resetPinForm.newPin, resetPinForm.confirmPin)
      showMessage('success', 'PIN reset successfully')
      setResetPinForm({ password: '', newPin: '', confirmPin: '' })
      setShowResetPin(false)
      loadPinStatus()
    } catch (err) {
      showMessage('error', err.message || 'Failed to reset PIN')
    } finally {
      setLoading(false)
    }
  }

  const handleProfileUpdate = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await authAPI.updateProfile(profileForm)
      showMessage('success', 'Profile updated successfully')
      if (onUserUpdate) {
        onUserUpdate({ ...user, ...profileForm })
      }
    } catch (err) {
      showMessage('error', err.message || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="profile-page">
      {/* Page Header */}
      <div className="page-intro">
        <div className="intro-icon">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
        </div>
        <h1>Profile & Security</h1>
        <p className="intro-description">
          Manage your account settings and security preferences. Set up your Security PIN
          to protect all payments and sensitive transactions.
        </p>
        <div className="intro-features">
          <div className="intro-feature">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            <span>PIN Protection</span>
          </div>
          <div className="intro-feature">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            <span>Secure Payments</span>
          </div>
          <div className="intro-feature">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            <span>Profile Settings</span>
          </div>
        </div>
      </div>

      <div className="profile-container">
        {/* Tabs */}
        <div className="profile-tabs">
          <button 
            className={`tab ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            Profile Info
          </button>
          <button 
            className={`tab ${activeTab === 'pin' ? 'active' : ''}`}
            onClick={() => setActiveTab('pin')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            Security PIN
          </button>
        </div>

        {/* Message Display */}
        {message.text && (
          <div className={`alert alert-${message.type}`}>
            {message.type === 'success' && (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            )}
            {message.type === 'error' && (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
            )}
            {message.text}
          </div>
        )}

        {/* Profile Tab Content */}
        {activeTab === 'profile' && (
          <div className="profile-content">
            <div className="profile-card">
              <div className="card-header">
                <h3>Personal Information</h3>
              </div>
              <form onSubmit={handleProfileUpdate} className="profile-form">
                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    value={profileForm.full_name}
                    onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                    placeholder="Enter your full name"
                  />
                </div>
                <div className="form-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                    placeholder="Enter your email"
                  />
                </div>
                <div className="form-group">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    placeholder="Enter your phone number"
                  />
                </div>
                <div className="form-group readonly">
                  <label>UPI ID</label>
                  <input
                    type="text"
                    value={user?.upi_id || 'Not assigned'}
                    readOnly
                    className="readonly-input"
                  />
                  <span className="help-text">UPI ID cannot be changed</span>
                </div>
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* PIN Tab Content */}
        {activeTab === 'pin' && (
          <div className="profile-content">
            {/* PIN Status Card */}
            <div className="profile-card pin-status-card">
              <div className="card-header">
                <h3>Security PIN Status</h3>
                <span className={`status-badge ${pinStatus.has_pin ? 'active' : 'inactive'}`}>
                  {pinStatus.has_pin ? 'PIN Active' : 'PIN Not Set'}
                </span>
              </div>
              <div className="pin-status-info">
                <div className="status-item">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    {pinStatus.has_pin ? (
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    ) : (
                      <>
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                      </>
                    )}
                  </svg>
                  <div>
                    <strong>{pinStatus.has_pin ? 'Your payments are protected' : 'Payments not protected'}</strong>
                    <p>{pinStatus.has_pin 
                      ? 'Security PIN is required for all transactions'
                      : 'Set up a PIN to secure your payments'}
                    </p>
                  </div>
                </div>
                {pinStatus.is_locked && (
                  <div className="status-warning">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                      <line x1="12" y1="9" x2="12" y2="13"/>
                      <line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                    PIN is temporarily locked due to multiple incorrect attempts
                  </div>
                )}
              </div>
            </div>

            {/* Setup PIN (if no PIN exists) */}
            {!pinStatus.has_pin && (
              <div className="profile-card">
                <div className="card-header">
                  <h3>Set Up Security PIN</h3>
                </div>
                <p className="card-description">
                  Create a 4-digit PIN to secure all your payment transactions. 
                  You will need to enter this PIN before confirming any payment.
                </p>
                <form onSubmit={handleSetupPin} className="pin-form">
                  <div className="pin-input-group">
                    <label>Enter 4-digit PIN</label>
                    <input
                      type="password"
                      inputMode="numeric"
                      maxLength="4"
                      value={setupPinForm.pin}
                      onChange={(e) => setSetupPinForm({ ...setupPinForm, pin: e.target.value.replace(/\D/g, '') })}
                      placeholder="****"
                      className="pin-input"
                    />
                  </div>
                  <div className="pin-input-group">
                    <label>Confirm PIN</label>
                    <input
                      type="password"
                      inputMode="numeric"
                      maxLength="4"
                      value={setupPinForm.confirmPin}
                      onChange={(e) => setSetupPinForm({ ...setupPinForm, confirmPin: e.target.value.replace(/\D/g, '') })}
                      placeholder="****"
                      className="pin-input"
                    />
                  </div>
                  <button type="submit" className="btn-primary" disabled={loading || setupPinForm.pin.length !== 4}>
                    {loading ? 'Setting up...' : 'Create PIN'}
                  </button>
                </form>
              </div>
            )}

            {/* Change PIN (if PIN exists) */}
            {pinStatus.has_pin && !showResetPin && (
              <div className="profile-card">
                <div className="card-header">
                  <h3>Change Security PIN</h3>
                </div>
                <form onSubmit={handleChangePin} className="pin-form">
                  <div className="pin-input-group">
                    <label>Current PIN</label>
                    <input
                      type="password"
                      inputMode="numeric"
                      maxLength="4"
                      value={changePinForm.currentPin}
                      onChange={(e) => setChangePinForm({ ...changePinForm, currentPin: e.target.value.replace(/\D/g, '') })}
                      placeholder="****"
                      className="pin-input"
                    />
                  </div>
                  <div className="pin-input-group">
                    <label>New PIN</label>
                    <input
                      type="password"
                      inputMode="numeric"
                      maxLength="4"
                      value={changePinForm.newPin}
                      onChange={(e) => setChangePinForm({ ...changePinForm, newPin: e.target.value.replace(/\D/g, '') })}
                      placeholder="****"
                      className="pin-input"
                    />
                  </div>
                  <div className="pin-input-group">
                    <label>Confirm New PIN</label>
                    <input
                      type="password"
                      inputMode="numeric"
                      maxLength="4"
                      value={changePinForm.confirmPin}
                      onChange={(e) => setChangePinForm({ ...changePinForm, confirmPin: e.target.value.replace(/\D/g, '') })}
                      placeholder="****"
                      className="pin-input"
                    />
                  </div>
                  <div className="pin-form-actions">
                    <button type="submit" className="btn-primary" disabled={loading}>
                      {loading ? 'Changing...' : 'Change PIN'}
                    </button>
                    <button 
                      type="button" 
                      className="btn-link"
                      onClick={() => setShowResetPin(true)}
                    >
                      Forgot PIN?
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Reset PIN with Password */}
            {showResetPin && (
              <div className="profile-card">
                <div className="card-header">
                  <h3>Reset PIN with Password</h3>
                  <button className="btn-close" onClick={() => setShowResetPin(false)}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18"/>
                      <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                  </button>
                </div>
                <p className="card-description">
                  Enter your account password to reset your Security PIN.
                </p>
                <form onSubmit={handleResetPin} className="pin-form">
                  <div className="pin-input-group">
                    <label>Account Password</label>
                    <input
                      type="password"
                      value={resetPinForm.password}
                      onChange={(e) => setResetPinForm({ ...resetPinForm, password: e.target.value })}
                      placeholder="Enter your password"
                    />
                  </div>
                  <div className="pin-input-group">
                    <label>New PIN</label>
                    <input
                      type="password"
                      inputMode="numeric"
                      maxLength="4"
                      value={resetPinForm.newPin}
                      onChange={(e) => setResetPinForm({ ...resetPinForm, newPin: e.target.value.replace(/\D/g, '') })}
                      placeholder="****"
                      className="pin-input"
                    />
                  </div>
                  <div className="pin-input-group">
                    <label>Confirm New PIN</label>
                    <input
                      type="password"
                      inputMode="numeric"
                      maxLength="4"
                      value={resetPinForm.confirmPin}
                      onChange={(e) => setResetPinForm({ ...resetPinForm, confirmPin: e.target.value.replace(/\D/g, '') })}
                      placeholder="****"
                      className="pin-input"
                    />
                  </div>
                  <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? 'Resetting...' : 'Reset PIN'}
                  </button>
                </form>
              </div>
            )}

            {/* PIN Info Card */}
            <div className="profile-card info-card">
              <div className="card-header">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="16" x2="12" y2="12"/>
                  <line x1="12" y1="8" x2="12.01" y2="8"/>
                </svg>
                <h3>About Security PIN</h3>
              </div>
              <ul className="info-list">
                <li>Your PIN is a 4-digit code required before every payment</li>
                <li>PIN is encrypted and stored securely - we never see it</li>
                <li>After 3 incorrect attempts, PIN is locked for 15 minutes</li>
                <li>You can reset PIN anytime using your account password</li>
                <li>Demo PIN for testing: 1234</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
