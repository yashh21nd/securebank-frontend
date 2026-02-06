import React, { useState, useEffect, useRef } from 'react'
import { paymentAPI, userAPI, blockchainAPI, getAuthToken, pinAPI } from '../services/api'
import { analyzeTransaction, checkFraudServiceHealth, getContactFraudProfile, getDatasetStats } from '../services/fraudDetection'

export default function Payment({ user, onBalanceUpdate, isLoggedIn, onTransactionAdd }) {
  const [activeTab, setActiveTab] = useState('send')
  const [recipient, setRecipient] = useState(null)
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [qrCode, setQrCode] = useState(null)
  const [balance, setBalance] = useState(null)
  const [fraudAnalysis, setFraudAnalysis] = useState(null)
  const [fraudServiceActive, setFraudServiceActive] = useState(false)
  const [showFraudWarning, setShowFraudWarning] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [scanResult, setScanResult] = useState(null)
  const [scannedQRData, setScannedQRData] = useState(null)
  const videoRef = useRef(null)
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [selectedContactFraudInfo, setSelectedContactFraudInfo] = useState(null)
  const [datasetStats, setDatasetStats] = useState(null)
  const [loadingProfiles, setLoadingProfiles] = useState(false)
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false)
  const [lastPaymentDetails, setLastPaymentDetails] = useState(null)
  
  // PIN verification states
  const [showPinModal, setShowPinModal] = useState(false)
  const [pinInput, setPinInput] = useState('')
  const [pinError, setPinError] = useState('')
  const [pinVerifying, setPinVerifying] = useState(false)
  const [pendingPaymentData, setPendingPaymentData] = useState(null)
  const [pinStatus, setPinStatus] = useState({ has_pin: false })
  const [postPaymentAnalysis, setPostPaymentAnalysis] = useState(null)
  const [showPostPaymentModal, setShowPostPaymentModal] = useState(false)

  // Base contact info - fraud profiles will be loaded from dataset
  const baseContacts = [
    { id: 'contact-1', full_name: 'Priya Sharma', username: 'priya_sharma', upi_id: 'priya@securebank', riskBias: 'low' },
    { id: 'contact-2', full_name: 'Rahul Patel', username: 'rahul_patel', upi_id: 'rahul@securebank', riskBias: 'low' },
    { id: 'contact-3', full_name: 'Amit Kumar', username: 'amit_kumar', upi_id: 'amit@securebank', riskBias: 'medium' },
    { id: 'contact-4', full_name: 'Deepak Verma', username: 'deepak_verma', upi_id: 'deepak@securebank', riskBias: 'high' },
    { id: 'contact-5', full_name: 'Sneha Reddy', username: 'sneha_reddy', upi_id: 'sneha@securebank', riskBias: 'low' },
    { id: 'contact-6', full_name: 'Vikram Singh', username: 'vikram_singh', upi_id: 'vikram@securebank', riskBias: 'critical' },
  ]

  // Load fraud profiles from PaySim dataset on mount
  useEffect(() => {
    const loadFraudProfiles = async () => {
      setLoadingProfiles(true)
      
      // Check if fraud service is available
      const isHealthy = await checkFraudServiceHealth()
      setFraudServiceActive(isHealthy)
      
      if (isHealthy) {
        // Get dataset statistics
        const stats = await getDatasetStats()
        if (stats.status === 'success') {
          setDatasetStats(stats.statistics)
        }
        
        // Load fraud profile for each contact from the actual dataset
        const contactsWithProfiles = await Promise.all(
          baseContacts.map(async (contact) => {
            const profile = await getContactFraudProfile(contact.id, contact.riskBias)
            if (profile) {
              return {
                ...contact,
                fraudProfile: {
                  riskScore: profile.risk_score,
                  riskLevel: profile.risk_level,
                  isFlagged: profile.is_flagged,
                  historicalTransactions: profile.historical_transactions,
                  flaggedTransactions: profile.flagged_transactions,
                  avgTransactionAmount: profile.avg_transaction_amount,
                  maxTransactionAmount: profile.max_transaction_amount,
                  commonTransactionTypes: profile.common_transaction_types,
                  accountAge: profile.account_age,
                  riskFactors: profile.risk_factors,
                  recommendation: profile.recommendation,
                  dataSource: profile.data_source,
                  modelConfidence: profile.model_confidence,
                  lastActivity: profile.last_activity
                }
              }
            }
            return contact
          })
        )
        setContacts(contactsWithProfiles)
      } else {
        // Fallback to base contacts without profiles
        setContacts(baseContacts.map(c => ({
          ...c,
          fraudProfile: {
            riskScore: 0,
            riskLevel: 'unknown',
            isFlagged: false,
            recommendation: 'Fraud detection service unavailable',
            dataSource: 'Offline'
          }
        })))
      }
      
      setLoadingProfiles(false)
    }
    
    loadFraudProfiles()
    loadPinStatus()
  }, [])

  // Load PIN status
  const loadPinStatus = async () => {
    try {
      const status = await pinAPI.getStatus()
      setPinStatus(status)
    } catch (err) {
      console.error('Failed to load PIN status:', err)
      // Default to has_pin: true for demo
      setPinStatus({ has_pin: true })
    }
  }

  // Load balance on mount
  useEffect(() => {
    const token = getAuthToken()
    if (!token || token.startsWith('demo-')) {
      setBalance(10000)
    } else if (isLoggedIn) {
      loadBalance()
    } else {
      setBalance(10000)
    }
  }, [isLoggedIn])

  const loadBalance = async () => {
    try {
      const data = await paymentAPI.getBalance()
      setBalance(data.total_balance || 10000)
    } catch (err) {
      console.error('Failed to load balance:', err)
      setBalance(10000)
    }
  }

  // Fuzzy search helper function for better name matching
  const fuzzyMatch = (text, query) => {
    const textLower = text.toLowerCase()
    const queryLower = query.toLowerCase()
    
    // Direct match
    if (textLower.includes(queryLower)) return { match: true, score: 100 }
    
    // Split query into words and check if all words match
    const queryWords = queryLower.split(/\s+/)
    const textWords = textLower.split(/\s+/)
    
    let matchedWords = 0
    for (const qWord of queryWords) {
      for (const tWord of textWords) {
        if (tWord.startsWith(qWord) || tWord.includes(qWord)) {
          matchedWords++
          break
        }
      }
    }
    
    if (matchedWords === queryWords.length) return { match: true, score: 80 }
    
    // Partial first letter match for each word
    const queryInitials = queryWords.map(w => w[0]).join('')
    const textInitials = textWords.map(w => w[0]).join('')
    if (textInitials.includes(queryInitials)) return { match: true, score: 60 }
    
    // Levenshtein-like similarity for typo tolerance
    let matches = 0
    for (let i = 0; i < queryLower.length; i++) {
      if (textLower.includes(queryLower[i])) matches++
    }
    const similarity = matches / queryLower.length
    if (similarity > 0.7) return { match: true, score: Math.floor(similarity * 50) }
    
    return { match: false, score: 0 }
  }

  const handleSearch = async (query) => {
    setSearchQuery(query)
    if (query.length < 1) {
      setSearchResults([])
      return
    }

    // Filter demo contacts for demo mode with improved fuzzy matching
    if (!getAuthToken() || getAuthToken()?.startsWith('demo-')) {
      const scoredResults = contacts
        .map(c => {
          const nameMatch = fuzzyMatch(c.full_name, query)
          const usernameMatch = fuzzyMatch(c.username, query)
          const upiMatch = fuzzyMatch(c.upi_id, query)
          const bestScore = Math.max(nameMatch.score, usernameMatch.score, upiMatch.score)
          return { 
            contact: c, 
            score: bestScore,
            matched: nameMatch.match || usernameMatch.match || upiMatch.match
          }
        })
        .filter(r => r.matched)
        .sort((a, b) => b.score - a.score)
        .map(r => r.contact)
      
      setSearchResults(scoredResults)
      return
    }

    try {
      const data = await userAPI.search(query)
      if (data.users && data.users.length > 0) {
        setSearchResults(data.users)
      } else {
        // Fall back to local fuzzy search if API returns no results
        const scoredResults = contacts
          .map(c => {
            const nameMatch = fuzzyMatch(c.full_name, query)
            const usernameMatch = fuzzyMatch(c.username, query)
            const bestScore = Math.max(nameMatch.score, usernameMatch.score)
            return { contact: c, score: bestScore, matched: nameMatch.match || usernameMatch.match }
          })
          .filter(r => r.matched)
          .sort((a, b) => b.score - a.score)
          .map(r => r.contact)
        setSearchResults(scoredResults)
      }
    } catch (err) {
      console.error('Search failed:', err)
      // Fall back to demo contacts filtering with fuzzy matching
      const scoredResults = contacts
        .map(c => {
          const nameMatch = fuzzyMatch(c.full_name, query)
          return { contact: c, score: nameMatch.score, matched: nameMatch.match }
        })
        .filter(r => r.matched)
        .sort((a, b) => b.score - a.score)
        .map(r => r.contact)
      setSearchResults(scoredResults)
    }
  }

  const selectRecipient = (selectedUser) => {
    setRecipient(selectedUser)
    setSearchQuery('')
    setSearchResults([])
    setFraudAnalysis(null) // Reset fraud analysis when recipient changes
    // Set fraud info from contact's profile if available (demo mode)
    if (selectedUser.fraudProfile) {
      setSelectedContactFraudInfo(selectedUser.fraudProfile)
    } else {
      setSelectedContactFraudInfo(null)
    }
  }

  // Preview fraud analysis when amount changes (debounced)
  useEffect(() => {
    if (recipient && amount && parseFloat(amount) > 0) {
      const timer = setTimeout(() => {
        previewFraudAnalysis()
      }, 500)
      return () => clearTimeout(timer)
    } else {
      setFraudAnalysis(null)
    }
  }, [amount, recipient])

  const previewFraudAnalysis = async () => {
    if (!recipient || !amount || parseFloat(amount) <= 0) return
    
    setIsAnalyzing(true)
    try {
      const fraudResult = await analyzeTransaction({
        senderId: user?.id || 'C' + Date.now(),
        recipientId: recipient.id || 'C' + Date.now(),
        amount: parseFloat(amount),
        senderBalance: balance || 10000,
        recipientBalance: 0,
        type: 'transfer'
      })
      setFraudAnalysis(fraudResult)
    } catch (err) {
      console.error('Fraud preview failed:', err)
    } finally {
      setIsAnalyzing(false)
    }
  }

  // QR Scanner functions
  const startQRScanner = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        setIsCameraActive(true)
      }
    } catch (err) {
      setError('Camera access denied. Please allow camera access to scan QR codes.')
    }
  }

  const stopQRScanner = () => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop())
      videoRef.current.srcObject = null
    }
    setIsCameraActive(false)
  }

  // Demo QR scan - simulates scanning a QR code
  const handleDemoQRScan = () => {
    // Simulate scanning a QR code
    const demoQRPayments = [
      { receiver: 'john_doe', name: 'John Doe', upi_id: 'john@securebank', amount: null },
      { receiver: 'jane_smith', name: 'Jane Smith', upi_id: 'jane@securebank', amount: 500 },
      { receiver: 'bob_wilson', name: 'Bob Wilson', upi_id: 'bob@securebank', amount: 1000 },
    ]
    const randomQR = demoQRPayments[Math.floor(Math.random() * demoQRPayments.length)]
    
    setScanResult({
      success: true,
      data: {
        payment_id: 'QR-' + Date.now(),
        receiver_name: randomQR.name,
        receiver_upi: randomQR.upi_id,
        amount: randomQR.amount,
        blockchain_verified: true
      }
    })
    setScannedQRData(randomQR)
  }

  const payViaScannedQR = async () => {
    if (!scannedQRData) return
    
    const payAmount = parseFloat(amount) || scannedQRData.amount
    if (!payAmount || payAmount <= 0) {
      setError('Please enter a valid amount')
      return
    }

    if (payAmount > (balance || 10000)) {
      setError('Insufficient balance')
      return
    }

    setLoading(true)
    setError('')

    // Run fraud detection
    try {
      const fraudResult = await analyzeTransaction({
        senderId: user?.id || 'C' + Date.now(),
        recipientId: scannedQRData.receiver || 'C' + Date.now(),
        amount: payAmount,
        senderBalance: balance || 10000,
        recipientBalance: 0,
        type: 'transfer'
      })

      setFraudAnalysis(fraudResult)

      if (fraudResult.shouldBlock) {
        setShowFraudWarning(true)
        setLoading(false)
        return
      }

      if (fraudResult.requiresReview) {
        setShowFraudWarning(true)
        setLoading(false)
        return
      }
    } catch (err) {
      console.error('Fraud check failed:', err)
    }

    // Process payment
    setTimeout(() => {
      const newBalance = (balance || 10000) - payAmount
      setBalance(newBalance)
      setSuccess(`₹${payAmount.toFixed(2)} sent to ${scannedQRData.name}! Transaction verified on blockchain.`)
      setScanResult(null)
      setScannedQRData(null)
      setAmount('')
      setFraudAnalysis(null)
      if (onBalanceUpdate) onBalanceUpdate(newBalance)
      setLoading(false)
    }, 1500)
  }

  const handleSendMoney = async () => {
    if (!recipient || !amount) {
      setError('Please select a recipient and enter an amount')
      return
    }

    const amountNum = parseFloat(amount)
    if (amountNum <= 0) {
      setError('Amount must be positive')
      return
    }

    if (amountNum > (balance || 10000)) {
      setError('Insufficient balance')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')
    setFraudAnalysis(null)

    // Run fraud detection analysis
    try {
      const fraudResult = await analyzeTransaction({
        senderId: user?.id || 'C' + Date.now(),
        recipientId: recipient.id || 'C' + Date.now(),
        amount: amountNum,
        senderBalance: balance || 10000,
        recipientBalance: 0,
        type: 'transfer'
      })

      setFraudAnalysis(fraudResult)

      // Block transaction if fraud is detected
      if (fraudResult.shouldBlock) {
        setShowFraudWarning(true)
        setLoading(false)
        setError('Transaction Blocked: ' + fraudResult.recommendation)
        return
      }

      // Show warning for high-risk transactions
      if (fraudResult.requiresReview) {
        setShowFraudWarning(true)
        setLoading(false)
        return // Wait for user confirmation
      }
    } catch (fraudError) {
      console.error('Fraud detection failed:', fraudError)
      // Continue with transaction if fraud service is down
    }

    // Require PIN verification before processing payment
    setPendingPaymentData({ amount: amountNum, fraudAnalysis: fraudAnalysis })
    setShowPinModal(true)
    setLoading(false)
  }

  // Verify PIN and process payment
  const handlePinVerification = async () => {
    if (pinInput.length !== 4) {
      setPinError('Please enter a 4-digit PIN')
      return
    }

    setPinVerifying(true)
    setPinError('')

    try {
      await pinAPI.verify(pinInput)
      // PIN verified, process payment
      setShowPinModal(false)
      setPinInput('')
      if (pendingPaymentData) {
        await processPayment(pendingPaymentData.amount)
      }
    } catch (err) {
      setPinError(err.message || 'Invalid PIN')
    } finally {
      setPinVerifying(false)
    }
  }

  const cancelPinVerification = () => {
    setShowPinModal(false)
    setPinInput('')
    setPinError('')
    setPendingPaymentData(null)
    setLoading(false)
  }

  const processPayment = async (amountNum) => {
    setLoading(true)
    setShowFraudWarning(false)

    const recipientName = recipient.full_name || recipient.username

    // Demo mode handling
    if (!getAuthToken() || getAuthToken()?.startsWith('demo-')) {
      setTimeout(() => {
        const newBalance = (balance || 10000) - amountNum
        setBalance(newBalance)
        
        // Show success animation
        setLastPaymentDetails({ amount: amountNum, recipient: recipientName })
        setShowSuccessAnimation(true)
        
        // Create transaction for dashboard
        const newTransaction = {
          id: 'TX' + Date.now(),
          desc: `Payment to ${recipientName}`,
          amount: -amountNum,
          date: new Date().toISOString().split('T')[0],
          category: 'Transfer',
          recipient: recipientName,
          status: 'completed'
        }
        
        if (onTransactionAdd) {
          onTransactionAdd(newTransaction)
        }
        
        // Hide animation after 3 seconds
        setTimeout(() => {
          setShowSuccessAnimation(false)
          setSuccess(`₹${amountNum.toFixed(2)} sent to ${recipientName}!`)
        }, 3000)
        
        setAmount('')
        setDescription('')
        setRecipient(null)
        setSelectedContactFraudInfo(null)
        setFraudAnalysis(null)
        if (onBalanceUpdate) onBalanceUpdate(newBalance)
        setLoading(false)
      }, 1000)
      return
    }

    try {
      const result = await paymentAPI.sendMoney({
        receiver_id: recipient.id,
        amount: amountNum,
        description: description
      })

      // Show success animation
      setLastPaymentDetails({ amount: amountNum, recipient: recipientName })
      setShowSuccessAnimation(true)
      
      // Create transaction for dashboard
      const newTransaction = {
        id: 'TX' + Date.now(),
        desc: `Payment to ${recipientName}`,
        amount: -amountNum,
        date: new Date().toISOString().split('T')[0],
        category: 'Transfer',
        recipient: recipientName,
        status: 'completed'
      }
      
      if (onTransactionAdd) {
        onTransactionAdd(newTransaction)
      }
      
      setTimeout(() => {
        setShowSuccessAnimation(false)
        setSuccess(`₹${amountNum.toFixed(2)} sent to ${recipientName}!`)
      }, 3000)
      
      setAmount('')
      setDescription('')
      setRecipient(null)
      setSelectedContactFraudInfo(null)
      setFraudAnalysis(null)
      
      if (onBalanceUpdate) {
        onBalanceUpdate(result.new_balance)
      }
      loadBalance()
    } catch (err) {
      setError(err.message || 'Payment failed')
    } finally {
      setLoading(false)
    }
  }

  const confirmRiskyPayment = () => {
    const amountNum = parseFloat(amount)
    // Require PIN for risky payments too
    setPendingPaymentData({ amount: amountNum, fraudAnalysis: fraudAnalysis })
    setShowFraudWarning(false)
    setShowPinModal(true)
  }

  const cancelRiskyPayment = () => {
    setShowFraudWarning(false)
    setFraudAnalysis(null)
    setLoading(false)
  }

  const handleRequestMoney = async () => {
    if (!recipient || !amount) {
      setError('Please select a user and enter an amount')
      return
    }

    setLoading(true)
    setError('')

    // Demo mode
    if (!getAuthToken() || getAuthToken()?.startsWith('demo-')) {
      setTimeout(() => {
        setSuccess(`Money request sent to ${recipient.full_name || recipient.username}!`)
        setAmount('')
        setDescription('')
        setRecipient(null)
        setLoading(false)
      }, 1000)
      return
    }

    try {
      await paymentAPI.requestMoney({
        from_user_id: recipient.id,
        amount: parseFloat(amount),
        note: description
      })

      setSuccess(`Money request sent to ${recipient.full_name || recipient.username}!`)
      setAmount('')
      setDescription('')
      setRecipient(null)
    } catch (err) {
      setError(err.message || 'Request failed')
    } finally {
      setLoading(false)
    }
  }

  const generateQRCode = async () => {
    setLoading(true)
    setError('')

    // Helper to generate a proper QR-like pattern
    const generateQRPattern = (data) => {
      const size = 200
      const modules = 25  // QR code grid size
      const moduleSize = size / modules
      
      // Generate deterministic pattern from data string
      const hash = data.split('').reduce((acc, char) => {
        return ((acc << 5) - acc + char.charCodeAt(0)) & 0xffffffff
      }, 0)
      
      let pattern = ''
      
      // Position patterns (corners)
      const drawPositionPattern = (x, y) => {
        // Outer square
        pattern += `<rect x="${x}" y="${y}" width="${7 * moduleSize}" height="${7 * moduleSize}" fill="black"/>`
        pattern += `<rect x="${x + moduleSize}" y="${y + moduleSize}" width="${5 * moduleSize}" height="${5 * moduleSize}" fill="white"/>`
        pattern += `<rect x="${x + 2 * moduleSize}" y="${y + 2 * moduleSize}" width="${3 * moduleSize}" height="${3 * moduleSize}" fill="black"/>`
      }
      
      drawPositionPattern(0, 0)
      drawPositionPattern((modules - 7) * moduleSize, 0)
      drawPositionPattern(0, (modules - 7) * moduleSize)
      
      // Data modules (pseudo-random based on hash)
      let seed = Math.abs(hash)
      for (let row = 0; row < modules; row++) {
        for (let col = 0; col < modules; col++) {
          // Skip position patterns
          if ((row < 8 && col < 8) || (row < 8 && col >= modules - 8) || (row >= modules - 8 && col < 8)) continue
          
          seed = (seed * 1103515245 + 12345) & 0x7fffffff
          if (seed % 3 === 0) {
            pattern += `<rect x="${col * moduleSize}" y="${row * moduleSize}" width="${moduleSize}" height="${moduleSize}" fill="black"/>`
          }
        }
      }
      
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
        <rect width="${size}" height="${size}" fill="white"/>
        ${pattern}
      </svg>`
    }
    
    // Generate unique payment ID and blockchain hash
    const paymentId = 'PAY-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 6).toUpperCase()
    const blockchainHash = '0x' + Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('')
    
    // Demo mode
    if (!getAuthToken() || getAuthToken()?.startsWith('demo-')) {
      setTimeout(() => {
        const qrData = JSON.stringify({
          type: 'payment_request',
          payee: user?.upi_id || 'demo@securebank',
          amount: amount || null,
          payment_id: paymentId,
          timestamp: Date.now()
        })
        
        setQrCode({
          qr_image: 'data:image/svg+xml,' + encodeURIComponent(generateQRPattern(qrData)),
          payment_id: paymentId,
          blockchain_hash: blockchainHash,
          amount: amount ? parseFloat(amount) : null,
          expires_at: new Date(Date.now() + 5 * 60000).toISOString()
        })
        setLoading(false)
      }, 800)
      return
    }

    try {
      const result = await blockchainAPI.generatePaymentQR({
        amount: amount ? parseFloat(amount) : null,
        description: description,
        expires_in_minutes: 5
      })
      setQrCode(result)
    } catch (err) {
      setError(err.message || 'Failed to generate QR code')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="payment-page">
      {/* Page Header with Description */}
      <div className="page-intro">
        <div className="intro-icon">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
            <line x1="1" y1="10" x2="23" y2="10"/>
          </svg>
        </div>
        <h1>Payments</h1>
        <p className="intro-description">
          Send money instantly to anyone, scan QR codes for quick payments, or generate your own QR code 
          to receive funds. Every transaction is protected by our AI-powered fraud detection system 
          trained on millions of real transactions.
        </p>
        <div className="intro-features">
          <div className="intro-feature">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            <span>Bank-grade Security</span>
          </div>
          <div className="intro-feature">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
              <line x1="12" y1="18" x2="12.01" y2="18"/>
            </svg>
            <span>QR Payments</span>
          </div>
          <div className="intro-feature">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
            <span>Fraud Protected</span>
          </div>
        </div>
      </div>

      <div className="payment-container">
        <div className="payment-card">
          {/* Header */}
          <div className="payment-header">
            <h2>Payments</h2>
            {balance !== null && (
              <div className="balance-display">
                <span className="balance-label">Available Balance</span>
                <span className="balance-amount">₹{balance.toFixed(2)}</span>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="payment-tabs">
            <button 
              className={`tab ${activeTab === 'send' ? 'active' : ''}`}
              onClick={() => { setActiveTab('send'); setError(''); setSuccess(''); }}
            >
              Send Money
            </button>
            <button 
              className={`tab ${activeTab === 'scan' ? 'active' : ''}`}
              onClick={() => { setActiveTab('scan'); setError(''); setSuccess(''); }}
            >
              Scan QR
            </button>
            <button 
              className={`tab ${activeTab === 'request' ? 'active' : ''}`}
              onClick={() => { setActiveTab('request'); setError(''); setSuccess(''); }}
            >
              Request
            </button>
            <button 
              className={`tab ${activeTab === 'qr' ? 'active' : ''}`}
              onClick={() => { setActiveTab('qr'); setError(''); setSuccess(''); }}
            >
              My QR
            </button>
          </div>

          <div className="payment-content">
            {/* Error/Success Messages */}
            {error && <div className="alert alert-error">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            {/* Fraud Detection Service Status */}
            {fraudServiceActive && (
              <div className="fraud-service-badge">
                <svg className="badge-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
                <span>ML Fraud Protection Active</span>
              </div>
            )}

            {/* Fraud Warning Modal */}
            {showFraudWarning && fraudAnalysis && (
            <div className="fraud-warning-overlay">
              <div className="fraud-warning-modal">
                <div className={`fraud-header ${fraudAnalysis.riskLevel}`}>
                  <svg className="fraud-icon" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    {fraudAnalysis.shouldBlock ? (
                      <><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></>
                    ) : (
                      <><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>
                    )}
                  </svg>
                  <h3>
                    {fraudAnalysis.shouldBlock 
                      ? 'Transaction Blocked' 
                      : 'High Risk Transaction Detected'}
                  </h3>
                </div>
                
                <div className="fraud-content">
                  <div className="fraud-stats">
                    <div className="fraud-stat">
                      <span className="stat-label">Risk Level</span>
                      <span className={`stat-value risk-${fraudAnalysis.riskLevel}`}>
                        {fraudAnalysis.riskLevel.toUpperCase()}
                      </span>
                    </div>
                    <div className="fraud-stat">
                      <span className="stat-label">Fraud Probability</span>
                      <span className="stat-value">
                        {(fraudAnalysis.fraudProbability * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  <div className="risk-factors">
                    <h4>Risk Factors Identified:</h4>
                    <ul>
                      {fraudAnalysis.riskFactors.map((factor, idx) => (
                        <li key={idx}>{factor}</li>
                      ))}
                    </ul>
                  </div>

                  <p className="fraud-recommendation">
                    {fraudAnalysis.recommendation}
                  </p>
                </div>

                <div className="fraud-actions">
                  {!fraudAnalysis.shouldBlock && (
                    <button 
                      className="btn-danger"
                      onClick={confirmRiskyPayment}
                    >
                      Proceed Anyway
                    </button>
                  )}
                  <button 
                    className="btn-secondary"
                    onClick={cancelRiskyPayment}
                  >
                    Cancel Transaction
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* PIN Verification Modal */}
          {showPinModal && (
            <div className="pin-modal-overlay">
              <div className="pin-modal">
                <div className="pin-modal-header">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  <h3>Enter Security PIN</h3>
                  <p>Verify your identity to complete this payment</p>
                </div>

                <div className="pin-modal-content">
                  {pendingPaymentData && (
                    <div className="pin-payment-summary">
                      <div className="summary-row">
                        <span>Amount:</span>
                        <strong>₹{pendingPaymentData.amount?.toLocaleString()}</strong>
                      </div>
                      <div className="summary-row">
                        <span>To:</span>
                        <strong>{recipient?.full_name || recipient?.username}</strong>
                      </div>
                    </div>
                  )}

                  <div className="pin-input-container">
                    <input
                      type="password"
                      inputMode="numeric"
                      maxLength="4"
                      value={pinInput}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '')
                        setPinInput(val)
                        setPinError('')
                      }}
                      placeholder="****"
                      className="pin-input-field"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && pinInput.length === 4) {
                          handlePinVerification()
                        }
                      }}
                    />
                    <div className="pin-dots">
                      {[0, 1, 2, 3].map(i => (
                        <span key={i} className={`pin-dot ${pinInput.length > i ? 'filled' : ''}`}></span>
                      ))}
                    </div>
                  </div>

                  {pinError && (
                    <div className="pin-error">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="15" y1="9" x2="9" y2="15"/>
                        <line x1="9" y1="9" x2="15" y2="15"/>
                      </svg>
                      {pinError}
                    </div>
                  )}

                  <p className="pin-hint">Demo PIN: 1234</p>
                </div>

                <div className="pin-modal-actions">
                  <button 
                    className="btn-primary"
                    onClick={handlePinVerification}
                    disabled={pinVerifying || pinInput.length !== 4}
                  >
                    {pinVerifying ? (
                      <>
                        <span className="spinner-small"></span>
                        Verifying...
                      </>
                    ) : (
                      'Confirm Payment'
                    )}
                  </button>
                  <button 
                    className="btn-secondary"
                    onClick={cancelPinVerification}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Send Money Tab */}
          {activeTab === 'send' && (
            <div className="payment-form">
              {/* Recipient Search */}
              {!recipient ? (
                <div className="recipient-search">
                  <label>Send to</label>
                  <input
                    type="text"
                    placeholder="Search by name, phone, or UPI ID..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="search-input"
                  />
                  
                  {searchResults.length > 0 && (
                    <div className="search-results">
                      {searchResults.map(u => (
                        <div 
                          key={u.id} 
                          className="search-result-item"
                          onClick={() => selectRecipient(u)}
                        >
                          <div className="user-avatar">
                            {(u.full_name || u.username)[0].toUpperCase()}
                          </div>
                          <div className="user-info">
                            <div className="user-name">{u.full_name || u.username}</div>
                            <div className="user-upi">{u.upi_id}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Recent Contacts with Risk Indicators */}
                  {contacts.length > 0 && !searchQuery && (
                    <div className="recent-contacts">
                      <div className="contacts-header">
                        <label>Recent Contacts</label>
                        {fraudServiceActive && datasetStats && (
                          <div className="dataset-badge" title={`Trained on ${(datasetStats.total_records || 0).toLocaleString()} transactions with ${(datasetStats.fraud_rate || 0).toFixed(2)}% fraud rate`}>
                            <span className="badge-dot"></span>
                            <span>ML Active</span>
                            <span className="badge-detail">PaySim Dataset</span>
                          </div>
                        )}
                        {loadingProfiles && (
                          <div className="loading-profiles">
                            <span className="spinner">⏳</span>
                            <span>Loading from dataset...</span>
                          </div>
                        )}
                      </div>
                      <div className="contacts-grid">
                        {contacts.slice(0, 6).map(c => (
                          <div 
                            key={c.id} 
                            className={`contact-item ${c.fraudProfile?.riskLevel || 'unknown'}-risk`}
                            onClick={() => selectRecipient(c)}
                          >
                            <div className="contact-avatar">
                              {(c.full_name || c.username)[0].toUpperCase()}
                              {c.fraudProfile && (
                                <span className={`risk-indicator ${c.fraudProfile.riskLevel}`}>
                                  {c.fraudProfile.riskLevel === 'low' && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                                  {c.fraudProfile.riskLevel === 'medium' && '!'}
                                  {c.fraudProfile.riskLevel === 'high' && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>}
                                  {c.fraudProfile.riskLevel === 'critical' && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>}
                                </span>
                              )}
                            </div>
                            <div className="contact-name">
                              {(c.full_name || c.username).split(' ')[0]}
                            </div>
                            {c.fraudProfile && (
                              <div className={`contact-risk-badge ${c.fraudProfile.riskLevel}`}>
                                {c.fraudProfile.riskLevel}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="selected-recipient-section">
                  <div className="selected-recipient">
                    <div className="recipient-info">
                      <div className={`user-avatar large ${selectedContactFraudInfo?.riskLevel || ''}`}>
                        {(recipient.full_name || recipient.username)[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="user-name">{recipient.full_name || recipient.username}</div>
                        <div className="user-upi">{recipient.upi_id}</div>
                      </div>
                    </div>
                    <button className="btn-change" onClick={() => { setRecipient(null); setSelectedContactFraudInfo(null); }}>
                      Change
                    </button>
                  </div>

                  {/* Recipient Fraud Profile Card */}
                  {selectedContactFraudInfo && (
                    <div className={`recipient-fraud-profile ${selectedContactFraudInfo.riskLevel}`}>
                      <div className="fraud-profile-header">
                        <svg className="profile-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          {selectedContactFraudInfo.riskLevel === 'low' && <><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></>}
                          {selectedContactFraudInfo.riskLevel === 'medium' && <><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>}
                          {selectedContactFraudInfo.riskLevel === 'high' && <><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></>}
                          {selectedContactFraudInfo.riskLevel === 'critical' && <><polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>}
                        </svg>
                        <div className="profile-title">
                          <h4>Recipient Risk Profile</h4>
                          <span className={`risk-badge ${selectedContactFraudInfo.riskLevel}`}>
                            {selectedContactFraudInfo.riskLevel.toUpperCase()} RISK
                          </span>
                        </div>
                        <div className="risk-score">
                          <span className="score-label">Fraud Score</span>
                          <span className="score-value">{(selectedContactFraudInfo.riskScore * 100).toFixed(0)}%</span>
                        </div>
                      </div>

                      <div className="fraud-profile-stats">
                        <div className="stat-item">
                          <span className="stat-label">Account Age</span>
                          <span className="stat-value">{selectedContactFraudInfo.accountAge}</span>
                        </div>
                        <div className="stat-item">
                          <span className="stat-label">Total Transactions</span>
                          <span className="stat-value">{selectedContactFraudInfo.historicalTransactions}</span>
                        </div>
                        <div className="stat-item">
                          <span className="stat-label">Flagged Transactions</span>
                          <span className={`stat-value ${selectedContactFraudInfo.fraudulentTransactions > 0 ? 'flagged' : ''}`}>
                            {selectedContactFraudInfo.fraudulentTransactions}
                          </span>
                        </div>
                        <div className="stat-item">
                          <span className="stat-label">Avg. Amount</span>
                          <span className="stat-value">₹{(selectedContactFraudInfo.avgTransactionAmount || 0).toLocaleString()}</span>
                        </div>
                      </div>

                      {selectedContactFraudInfo.riskFactors && selectedContactFraudInfo.riskFactors.length > 0 && (
                        <div className="risk-factors-section">
                          <h5>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                            </svg>
                            Risk Factors Identified
                          </h5>
                          <ul>
                            {selectedContactFraudInfo.riskFactors.map((factor, idx) => (
                              <li key={idx}>{factor}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className={`recommendation-box ${selectedContactFraudInfo.riskLevel}`}>
                        <strong>ML Recommendation:</strong>
                        <p>{selectedContactFraudInfo.recommendation}</p>
                      </div>

                      <div className="last-activity">
                        Last activity: {selectedContactFraudInfo.lastActivity}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Amount Input */}
              <div className="amount-section">
                <label>Amount</label>
                <div className="amount-input-container">
                  <span className="currency-symbol">₹</span>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="amount-input"
                  />
                </div>

                {/* Quick Amount Buttons */}
                <div className="quick-amounts">
                  {[100, 200, 500, 1000, 2000].map(amt => (
                    <button 
                      key={amt}
                      className="quick-amount-btn"
                      onClick={() => setAmount(amt.toString())}
                    >
                      ₹{amt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div className="description-section">
                <label>Note (Optional)</label>
                <input
                  type="text"
                  placeholder="Add a note"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              {/* Fraud Analysis Preview */}
              {recipient && amount && parseFloat(amount) > 0 && (
                <div className="fraud-preview-panel">
                  <div className="fraud-preview-header">
                    <svg className="fraud-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    </svg>
                    <span>ML Fraud Analysis</span>
                    {isAnalyzing && <span className="analyzing-spinner"></span>}
                  </div>
                  {fraudAnalysis && !isAnalyzing && (
                    <div className="fraud-preview-content">
                      <div className={`fraud-risk-badge ${fraudAnalysis.riskLevel}`}>
                        <svg className="risk-indicator" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          {fraudAnalysis.riskLevel === 'low' && <><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></>}
                          {fraudAnalysis.riskLevel === 'medium' && <><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>}
                          {fraudAnalysis.riskLevel === 'high' && <><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></>}
                          {fraudAnalysis.riskLevel === 'critical' && <><polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></>}
                        </svg>
                        <span className="risk-text">
                          {fraudAnalysis.riskLevel.toUpperCase()} RISK
                        </span>
                        <span className="fraud-prob">
                          {(fraudAnalysis.fraudProbability * 100).toFixed(1)}% fraud probability
                        </span>
                      </div>
                      {fraudAnalysis.isFraud && (
                        <div className="fraud-alert-inline">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                          </svg>
                          This transaction has been flagged as potentially fraudulent
                        </div>
                      )}
                      {fraudAnalysis.riskFactors && fraudAnalysis.riskFactors.length > 0 && (
                        <div className="risk-factors-preview">
                          <strong>Risk factors:</strong>
                          <ul>
                            {fraudAnalysis.riskFactors.slice(0, 3).map((f, i) => (
                              <li key={i}>{f}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <div className="fraud-recommendation-preview">
                        {fraudAnalysis.recommendation}
                      </div>
                    </div>
                  )}
                  {!fraudAnalysis && !isAnalyzing && (
                    <div className="fraud-preview-loading">Analyzing transaction...</div>
                  )}
                </div>
              )}

              <button 
                className="btn-primary btn-send"
                onClick={handleSendMoney}
                disabled={loading || !recipient || !amount}
              >
                {loading ? 'Processing...' : 'Send Money'}
              </button>
            </div>
          )}

          {/* Scan QR Tab */}
          {activeTab === 'scan' && (
            <div className="scan-qr-section">
              <div className="scan-info">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
                <h3>Scan QR Code to Pay</h3>
                <p>Scan any SecureBank QR code to make instant payments</p>
              </div>

              {!scanResult ? (
                <div className="scanner-container">
                  {isCameraActive ? (
                    <div className="camera-preview">
                      <video ref={videoRef} autoPlay playsInline className="qr-video" />
                      <div className="scan-overlay">
                        <div className="scan-frame"></div>
                      </div>
                      <button className="btn-stop-scan" onClick={stopQRScanner}>
                        Stop Scanner
                      </button>
                    </div>
                  ) : (
                    <div className="scanner-placeholder">
                      <div className="scanner-icon">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
                          <line x1="12" y1="18" x2="12.01" y2="18"/>
                        </svg>
                      </div>
                      <p>Position the QR code within the frame</p>
                      <button className="btn-primary" onClick={startQRScanner}>
                        Start Camera Scanner
                      </button>
                      <div className="scan-divider">
                        <span>or</span>
                      </div>
                      <button className="btn-secondary" onClick={handleDemoQRScan}>
                        Demo: Scan Sample QR
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="scan-result">
                  <div className="scan-success-header">
                    <svg className="success-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                      <polyline points="22 4 12 14.01 9 11.01"/>
                    </svg>
                    <h3>QR Code Scanned Successfully</h3>
                  </div>

                  <div className="scanned-payment-details">
                    <div className="payment-recipient">
                      <div className="recipient-avatar">
                        {scanResult.data.receiver_name[0].toUpperCase()}
                      </div>
                      <div className="recipient-info">
                        <div className="recipient-name">{scanResult.data.receiver_name}</div>
                        <div className="recipient-upi">{scanResult.data.receiver_upi}</div>
                      </div>
                    </div>

                    {scanResult.data.blockchain_verified && (
                      <div className="blockchain-badge">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                        </svg>
                        Blockchain Verified QR
                      </div>
                    )}

                    {scanResult.data.amount ? (
                      <div className="fixed-amount">
                        <label>Amount to Pay</label>
                        <div className="amount-display">₹{scanResult.data.amount}</div>
                      </div>
                    ) : (
                      <div className="amount-section">
                        <label>Enter Amount</label>
                        <div className="amount-input-container">
                          <span className="currency-symbol">₹</span>
                          <input
                            type="number"
                            placeholder="0.00"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="amount-input"
                          />
                        </div>
                      </div>
                    )}

                    {/* Fraud Analysis for QR Payment */}
                    {(amount || scanResult.data.amount) && fraudAnalysis && (
                      <div className={`fraud-preview-panel ${fraudAnalysis.riskLevel}`}>
                        <div className="fraud-preview-header">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                          </svg>
                          <span>ML Risk Analysis</span>
                        </div>
                        <div className={`fraud-risk-badge ${fraudAnalysis.riskLevel}`}>
                          <span>{fraudAnalysis.riskLevel.toUpperCase()} RISK</span>
                          <span>{(fraudAnalysis.fraudProbability * 100).toFixed(1)}%</span>
                        </div>
                        {fraudAnalysis.isFraud && (
                          <div className="fraud-warning-inline">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                            </svg>
                            Potential fraud detected
                          </div>
                        )}
                      </div>
                    )}

                    <div className="scan-actions">
                      <button 
                        className="btn-primary"
                        onClick={payViaScannedQR}
                        disabled={loading || (!amount && !scanResult.data.amount)}
                      >
                        {loading ? 'Processing...' : `Pay ₹${amount || scanResult.data.amount || '0'}`}
                      </button>
                      <button 
                        className="btn-secondary"
                        onClick={() => { setScanResult(null); setScannedQRData(null); setAmount(''); setFraudAnalysis(null); }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Request Money Tab */}
          {activeTab === 'request' && (
            <div className="payment-form">
              {!recipient ? (
                <div className="recipient-search">
                  <label>Request from</label>
                  <input
                    type="text"
                    placeholder="Search by name, phone, or UPI ID..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                  />
                  
                  {searchResults.length > 0 && (
                    <div className="search-results">
                      {searchResults.map(u => (
                        <div 
                          key={u.id} 
                          className="search-result-item"
                          onClick={() => selectRecipient(u)}
                        >
                          <div className="user-avatar">
                            {(u.full_name || u.username)[0].toUpperCase()}
                          </div>
                          <div className="user-info">
                            <div className="user-name">{u.full_name || u.username}</div>
                            <div className="user-upi">{u.upi_id}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {contacts.length > 0 && !searchQuery && (
                    <div className="recent-contacts">
                      <label>Recent Contacts</label>
                      <div className="contacts-grid">
                        {contacts.slice(0, 6).map(c => (
                          <div 
                            key={c.id} 
                            className="contact-item"
                            onClick={() => selectRecipient(c)}
                          >
                            <div className="contact-avatar">
                              {(c.full_name || c.username)[0].toUpperCase()}
                            </div>
                            <div className="contact-name">
                              {(c.full_name || c.username).split(' ')[0]}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="selected-recipient">
                  <div className="recipient-info">
                    <div className="user-avatar large">
                      {(recipient.full_name || recipient.username)[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="user-name">{recipient.full_name || recipient.username}</div>
                      <div className="user-upi">{recipient.upi_id}</div>
                    </div>
                  </div>
                  <button className="btn-change" onClick={() => setRecipient(null)}>
                    Change
                  </button>
                </div>
              )}

              <div className="amount-section">
                <label>Amount</label>
                <div className="amount-input-container">
                  <span className="currency-symbol">₹</span>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="amount-input"
                  />
                </div>
              </div>

              <div className="description-section">
                <label>Reason (Optional)</label>
                <input
                  type="text"
                  placeholder="Why are you requesting?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <button 
                className="btn-primary btn-request"
                onClick={handleRequestMoney}
                disabled={loading || !recipient || !amount}
              >
                {loading ? 'Processing...' : 'Request Money'}
              </button>
            </div>
          )}

          {/* QR Code Tab - My QR */}
          {activeTab === 'qr' && (
            <div className="qr-section">
              <div className="qr-info-header">
                <h3>🔗 Your Blockchain QR Code</h3>
                <p>Share this unique QR code for others to pay you securely</p>
              </div>

              <div className="amount-section">
                <label>Set Amount (Optional)</label>
                <div className="amount-input-container">
                  <span className="currency-symbol">₹</span>
                  <input
                    type="number"
                    placeholder="Leave empty for any amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="amount-input"
                  />
                </div>
              </div>

              <div className="description-section">
                <label>Payment Note (Optional)</label>
                <input
                  type="text"
                  placeholder="What's this payment for?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <button 
                className="btn-primary btn-generate-qr"
                onClick={generateQRCode}
                disabled={loading}
              >
                {loading ? '🔄 Generating...' : '🔗 Generate Blockchain QR'}
              </button>

              {qrCode && (
                <div className="qr-display-card">
                  <div className="qr-blockchain-badge">
                    <span className="badge-icon">🔗</span>
                    <span>Blockchain Verified</span>
                  </div>
                  
                  <div className="qr-code-container">
                    <img 
                      src={qrCode.qr_image || qrCode.qr_code_image} 
                      alt="Payment QR Code"
                      className="qr-image"
                    />
                  </div>

                  <div className="qr-user-info">
                    <div className="qr-user-avatar">
                      {(user?.full_name || user?.username || 'U')[0].toUpperCase()}
                    </div>
                    <div className="qr-user-details">
                      <div className="qr-user-name">{user?.full_name || user?.username || 'Demo User'}</div>
                      <div className="qr-user-upi">{user?.upi_id || 'demo@securebank'}</div>
                    </div>
                  </div>
                  
                  <div className="qr-details-card">
                    {qrCode.amount && (
                      <div className="qr-amount-display">
                        <span className="amount-label">Amount</span>
                        <span className="amount-value">₹{parseFloat(qrCode.amount).toLocaleString()}</span>
                      </div>
                    )}
                    
                    <div className="qr-meta-info">
                      <div className="meta-item">
                        <span className="meta-label">Payment ID</span>
                        <span className="meta-value">{qrCode.payment_id}</span>
                      </div>
                      {qrCode.blockchain_hash && (
                        <div className="meta-item">
                          <span className="meta-label">Blockchain Hash</span>
                          <span className="meta-value hash">{qrCode.blockchain_hash.substring(0, 16)}...</span>
                        </div>
                      )}
                      <div className="meta-item">
                        <span className="meta-label">Valid Until</span>
                        <span className="meta-value">{new Date(qrCode.expires_at).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="qr-security-note">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    </svg>
                    <span>Secured with ML fraud detection & blockchain verification</span>
                  </div>
                </div>
              )}
            </div>
          )}
          </div>
        </div>
      </div>

      {/* Success Animation Overlay */}
      {showSuccessAnimation && lastPaymentDetails && (
        <div className="success-animation-overlay">
          <div className="success-animation-content">
            <div className="coin-animation">
              <div className="coin">
                <div className="coin-front">₹</div>
                <div className="coin-back">✓</div>
              </div>
            </div>
            <div className="success-text">
              <h2>Payment Successful!</h2>
              <p className="amount-display">₹{lastPaymentDetails.amount.toFixed(2)}</p>
              <p className="recipient-display">Sent to {lastPaymentDetails.recipient}</p>
            </div>
            <div className="sparkles">
              {[...Array(12)].map((_, i) => (
                <span key={i} className="sparkle" style={{ '--delay': `${i * 0.1}s`, '--angle': `${i * 30}deg` }}></span>
              ))}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .payment-container {
          max-width: 480px;
          margin: 0 auto;
        }

        .payment-card {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(8px);
          border-radius: 24px;
          overflow: hidden;
          box-shadow: 0 10px 40px rgba(22, 163, 74, 0.1);
          border: 1px solid rgba(34, 197, 94, 0.2);
        }

        .payment-header {
          background: linear-gradient(135deg, #16a34a 0%, #22c55e 100%);
          padding: 28px;
          color: white;
          text-align: center;
        }

        .payment-header h2 {
          margin: 0;
          font-size: 24px;
          font-family: 'Playfair Display', serif;
          font-weight: 600;
        }

        .balance-display {
          margin-top: 12px;
        }

        .balance-label {
          display: block;
          font-size: 13px;
          opacity: 0.9;
        }

        .balance-amount {
          font-size: 32px;
          font-weight: 700;
          font-family: 'Poppins', sans-serif;
        }

        .payment-tabs {
          display: flex;
          border-bottom: 1px solid rgba(34, 197, 94, 0.15);
          background: rgba(255, 255, 255, 0.5);
        }

        .payment-tabs .tab {
          flex: 1;
          padding: 16px;
          border: none;
          background: none;
          font-size: 14px;
          font-weight: 500;
          color: #16a34a;
          cursor: pointer;
          transition: all 0.3s;
          font-family: 'Inter', sans-serif;
        }

        .payment-tabs .tab.active {
          color: #15803d;
          border-bottom: 3px solid #22c55e;
          background: linear-gradient(to bottom, rgba(34, 197, 94, 0.1), transparent);
        }

        .payment-tabs .tab:hover:not(.active) {
          background: rgba(34, 197, 94, 0.08);
        }

        .payment-content {
          padding: 24px;
        }

        .payment-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .payment-form label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: var(--sage-700, #4d7c0f);
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .search-results {
          border: 1px solid rgba(0, 0, 0, 0.08);
          border-radius: 12px;
          max-height: 200px;
          overflow-y: auto;
          margin-top: 8px;
          background: rgba(255, 255, 255, 0.8);
        }

        .search-result-item {
          display: flex;
          align-items: center;
          padding: 12px 16px;
          cursor: pointer;
          transition: background 0.2s;
          border-bottom: 1px solid rgba(0, 0, 0, 0.04);
        }

        .search-result-item:last-child {
          border-bottom: none;
        }

        .search-result-item:hover {
          background: rgba(132, 204, 22, 0.1);
        }

        .user-avatar {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--sage-500, #84cc16) 0%, var(--sage-600, #65a30d) 100%);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 16px;
          margin-right: 12px;
          flex-shrink: 0;
        }

        .user-avatar.large {
          width: 56px;
          height: 56px;
          font-size: 20px;
        }

        .user-name {
          font-weight: 600;
          color: var(--sage-800, #166534);
        }

        .user-upi {
          font-size: 13px;
          color: #16a34a;
        }

        .selected-recipient {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          background: linear-gradient(135deg, rgba(34, 197, 94, 0.12) 0%, rgba(22, 163, 74, 0.12) 100%);
          border-radius: 16px;
          border: 1px solid rgba(34, 197, 94, 0.3);
        }

        .recipient-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .btn-change {
          padding: 8px 16px;
          border: 2px solid #22c55e;
          background: white;
          color: #16a34a;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          font-size: 13px;
          transition: all 0.2s;
        }

        .btn-change:hover {
          background: rgba(34, 197, 94, 0.1);
        }

        .recent-contacts {
          margin-top: 16px;
        }

        .contacts-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
        }

        .dataset-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          background: linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(22, 163, 74, 0.15));
          border-radius: 16px;
          font-size: 11px;
          color: #16a34a;
          font-weight: 500;
        }

        .badge-dot {
          width: 6px;
          height: 6px;
          background: #22c55e;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .badge-detail {
          color: #16a34a;
          font-size: 10px;
        }

        .loading-profiles {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          color: var(--sage-600, #65a30d);
        }

        .loading-profiles .spinner {
          animation: spin 1s linear infinite;
        }

        .contacts-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-top: 12px;
        }

        .contact-item {
          text-align: center;
          cursor: pointer;
          padding: 16px 8px;
          border-radius: 12px;
          transition: all 0.2s;
          border: 1px solid transparent;
          background: rgba(255, 255, 255, 0.5);
        }

        .contact-item:hover {
          background: rgba(132, 204, 22, 0.1);
          border-color: rgba(132, 204, 22, 0.3);
        }

        .contact-avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--sage-500, #84cc16) 0%, var(--sage-600, #65a30d) 100%);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          margin: 0 auto 8px;
        }

        .contact-name {
          font-size: 13px;
          color: var(--sage-700, #4d7c0f);
          font-weight: 500;
        }

        .amount-section {
          margin-top: 8px;
        }

        .amount-input-container {
          display: flex;
          align-items: center;
          background: rgba(255, 255, 255, 0.8);
          border-radius: 12px;
          padding: 4px 16px;
          border: 2px solid rgba(0, 0, 0, 0.08);
          transition: all 0.3s;
        }

        .amount-input-container:focus-within {
          border-color: var(--sage-500, #84cc16);
          background: white;
        }

        .currency-symbol {
          font-size: 28px;
          font-weight: 600;
          color: var(--sage-700, #4d7c0f);
          margin-right: 8px;
        }

        .amount-input {
          border: none !important;
          background: transparent !important;
          font-size: 28px;
          font-weight: 600;
          padding: 12px 0 !important;
          box-shadow: none !important;
          color: var(--sage-800, #166534);
        }

        .amount-input:focus {
          outline: none;
        }

        .quick-amounts {
          display: flex;
          gap: 8px;
          margin-top: 12px;
          flex-wrap: wrap;
        }

        .quick-amount-btn {
          padding: 8px 16px;
          border: 2px solid rgba(0, 0, 0, 0.08);
          background: rgba(255, 255, 255, 0.8);
          border-radius: 20px;
          cursor: pointer;
          font-weight: 500;
          color: var(--sage-700, #4d7c0f);
          transition: all 0.2s;
          font-size: 14px;
        }

        .quick-amount-btn:hover {
          border-color: var(--sage-500, #84cc16);
          color: var(--sage-600, #65a30d);
          background: rgba(132, 204, 22, 0.1);
        }

        .description-section {
          margin-top: 8px;
        }

        .btn-send, .btn-request {
          width: 100%;
          padding: 16px;
          font-size: 16px;
          margin-top: 8px;
          background: linear-gradient(135deg, var(--sage-600, #65a30d) 0%, var(--sage-500, #84cc16) 100%);
          border: none;
          color: white;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }

        .btn-send:hover, .btn-request:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(101, 163, 13, 0.3);
        }

        .btn-send:disabled, .btn-request:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .qr-section {
          text-align: center;
        }

        .qr-info-header {
          margin-bottom: 24px;
        }

        .qr-info-header h3 {
          font-size: 20px;
          font-weight: 600;
          color: var(--sage-800, #166534);
          margin: 0 0 8px 0;
        }

        .qr-info-header p {
          color: var(--sage-600, #65a30d);
          margin: 0;
          font-size: 14px;
        }

        .qr-section .amount-section,
        .qr-section .description-section {
          text-align: left;
          margin-bottom: 16px;
        }

        .btn-generate-qr {
          width: 100%;
          padding: 16px;
          font-size: 16px;
          font-weight: 600;
          margin-top: 8px;
          background: linear-gradient(135deg, var(--sage-600, #65a30d) 0%, var(--sage-500, #84cc16) 100%);
          border: none;
          color: white;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.3s;
        }

        .btn-generate-qr:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(101, 163, 13, 0.3);
        }

        .qr-display-card {
          margin-top: 24px;
          padding: 24px;
          background: linear-gradient(135deg, rgba(132, 204, 22, 0.1) 0%, rgba(101, 163, 13, 0.1) 100%);
          border-radius: 20px;
          border: 2px solid var(--sage-500, #84cc16);
          position: relative;
          overflow: hidden;
        }

        .qr-blockchain-badge {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          background: linear-gradient(90deg, var(--sage-500, #84cc16), var(--sage-600, #65a30d));
          color: white;
          padding: 8px 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 600;
        }

        .badge-icon {
          font-size: 16px;
        }

        .qr-code-container {
          margin-top: 48px;
          padding: 16px;
          background: white;
          border-radius: 16px;
          display: inline-block;
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        }

        .qr-image {
          width: 180px;
          height: 180px;
          border-radius: 8px;
        }

        .qr-user-info {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin: 20px 0;
          padding: 16px;
          background: white;
          border-radius: 12px;
        }

        .qr-user-avatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--copper, #b87333), var(--gold, #c9a227));
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          font-weight: 600;
        }

        .qr-user-details {
          text-align: left;
        }

        .qr-user-name {
          font-size: 16px;
          font-weight: 600;
          color: var(--sage-800, #166534);
        }

        .qr-user-upi {
          font-size: 13px;
          color: var(--sage-600, #65a30d);
        }

        .qr-details-card {
          background: white;
          border-radius: 12px;
          padding: 16px;
          margin-top: 16px;
        }

        .qr-amount-display {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 12px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.08);
          margin-bottom: 12px;
        }

        .amount-label {
          font-size: 14px;
          color: var(--sage-600, #65a30d);
        }

        .amount-value {
          font-size: 24px;
          font-weight: 700;
          color: var(--sage-600, #65a30d);
        }

        .qr-meta-info {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .meta-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .meta-label {
          font-size: 12px;
          color: var(--sage-500, #84cc16);
        }

        .meta-value {
          font-size: 12px;
          color: var(--sage-700, #4d7c0f);
          font-family: monospace;
        }

        .meta-value.hash {
          background: rgba(132, 204, 22, 0.1);
          padding: 2px 8px;
          border-radius: 4px;
          color: var(--copper, #b87333);
        }

        .qr-security-note {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: 16px;
          padding: 12px;
          background: rgba(132, 204, 22, 0.1);
          border-radius: 8px;
          font-size: 12px;
          color: var(--sage-700, #4d7c0f);
        }

        /* Fraud Preview Panel Styles */
        .fraud-preview-panel {
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0.6) 100%);
          border: 1px solid rgba(0, 0, 0, 0.08);
          border-radius: 12px;
          padding: 16px;
          margin: 16px 0;
          backdrop-filter: blur(10px);
        }

        .fraud-preview-panel.high, .fraud-preview-panel.critical {
          background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
          border-color: #fecaca;
        }

        .fraud-preview-header {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
          color: var(--sage-700, #4d7c0f);
          margin-bottom: 12px;
        }

        .fraud-preview-header .fraud-icon {
          font-size: 18px;
        }

        .analyzing-spinner {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .fraud-risk-badge {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border-radius: 8px;
          background: white;
          margin-bottom: 12px;
        }

        .fraud-risk-badge.low {
          border-left: 4px solid var(--sage-500, #84cc16);
        }

        .fraud-risk-badge.medium {
          border-left: 4px solid #f59e0b;
        }

        .fraud-risk-badge.high {
          border-left: 4px solid #ef4444;
        }

        .fraud-risk-badge.critical {
          border-left: 4px solid #7c2d12;
          background: #fef2f2;
        }

        .risk-indicator {
          font-size: 20px;
        }

        .risk-text {
          font-weight: 700;
          font-size: 14px;
        }

        .fraud-risk-badge.low .risk-text { color: #059669; }
        .fraud-risk-badge.medium .risk-text { color: #d97706; }
        .fraud-risk-badge.high .risk-text { color: #dc2626; }
        .fraud-risk-badge.critical .risk-text { color: #7c2d12; }

        .fraud-prob {
          font-size: 13px;
          color: #6b7280;
          margin-left: auto;
        }

        .fraud-alert-inline {
          background: #fef2f2;
          color: #991b1b;
          padding: 10px 14px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
          margin-bottom: 12px;
        }

        .risk-factors-preview {
          font-size: 13px;
          color: var(--sage-700, #4d7c0f);
          margin-bottom: 12px;
        }

        .risk-factors-preview ul {
          margin: 6px 0 0 20px;
          padding: 0;
        }

        .risk-factors-preview li {
          margin: 4px 0;
        }

        .fraud-recommendation-preview {
          font-size: 12px;
          color: var(--sage-700, #4d7c0f);
          font-weight: 500;
          padding: 8px 12px;
          background: rgba(132, 204, 22, 0.15);
          border-radius: 6px;
        }

        .fraud-preview-loading {
          color: var(--sage-600, #65a30d);
          font-size: 13px;
          text-align: center;
          padding: 12px;
        }

        /* Scan QR Section Styles */
        .scan-qr-section {
          text-align: center;
        }

        .scan-info {
          margin-bottom: 24px;
        }

        .scan-info h3 {
          font-size: 20px;
          color: var(--sage-800, #166534);
          margin: 0 0 8px;
        }

        .scan-info p {
          color: var(--sage-600, #65a30d);
          margin: 0;
        }

        .scanner-container {
          margin: 24px 0;
        }

        .scanner-placeholder {
          padding: 40px 20px;
          background: linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0.6) 100%);
          border: 2px dashed rgba(132, 204, 22, 0.4);
          border-radius: 16px;
        }

        .scanner-icon {
          font-size: 48px;
          margin-bottom: 16px;
        }

        .scanner-placeholder p {
          color: var(--sage-600, #65a30d);
          margin-bottom: 20px;
        }

        .scan-divider {
          display: flex;
          align-items: center;
          margin: 20px 0;
          color: var(--sage-500, #84cc16);
        }

        .scan-divider::before,
        .scan-divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: rgba(0, 0, 0, 0.1);
        }

        .scan-divider span {
          padding: 0 16px;
          font-size: 13px;
        }

        .camera-preview {
          position: relative;
          border-radius: 16px;
          overflow: hidden;
        }

        .qr-video {
          width: 100%;
          max-height: 300px;
          object-fit: cover;
          border-radius: 16px;
        }

        .scan-overlay {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
        }

        .scan-frame {
          width: 200px;
          height: 200px;
          border: 3px solid #10b981;
          border-radius: 16px;
          box-shadow: 0 0 0 9999px rgba(0,0,0,0.5);
        }

        .btn-stop-scan {
          position: absolute;
          bottom: 16px;
          left: 50%;
          transform: translateX(-50%);
          padding: 12px 24px;
          background: #ef4444;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
        }

        .scan-result {
          text-align: left;
        }

        .scan-success-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px;
          background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
          border-radius: 12px;
          margin-bottom: 20px;
        }

        .success-icon {
          font-size: 28px;
        }

        .scan-success-header h3 {
          margin: 0;
          color: #065f46;
        }

        .scanned-payment-details {
          padding: 20px;
          background: rgba(255, 255, 255, 0.8);
          border-radius: 12px;
        }

        .payment-recipient {
          display: flex;
          align-items: center;
          gap: 12px;
          padding-bottom: 16px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.08);
          margin-bottom: 16px;
        }

        .recipient-avatar {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--sage-500, #84cc16) 0%, var(--sage-600, #65a30d) 100%);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 22px;
        }

        .recipient-name {
          font-weight: 600;
          font-size: 18px;
          color: var(--sage-800, #166534);
        }

        .recipient-upi {
          color: var(--sage-600, #65a30d);
          font-size: 14px;
        }

        .blockchain-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          background: linear-gradient(135deg, rgba(184, 115, 51, 0.1) 0%, rgba(201, 162, 39, 0.1) 100%);
          color: var(--copper, #b87333);
          border-radius: 20px;
          font-size: 13px;
          font-weight: 500;
          margin-bottom: 16px;
        }

        .fixed-amount {
          padding: 16px;
          background: white;
          border-radius: 12px;
          text-align: center;
          margin-bottom: 16px;
        }

        .fixed-amount label {
          display: block;
          font-size: 13px;
          color: var(--sage-600, #65a30d);
          margin-bottom: 8px;
        }

        .amount-display {
          font-size: 32px;
          font-weight: 700;
          color: var(--sage-600, #65a30d);
        }

        .fraud-warning-inline {
          background: #fef2f2;
          color: #991b1b;
          padding: 10px 14px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 500;
          text-align: center;
          margin-top: 12px;
        }

        .scan-actions {
          display: flex;
          gap: 12px;
          margin-top: 20px;
        }

        .scan-actions button {
          flex: 1;
        }

        /* Contact Risk Indicators */
        .contact-item.low-risk .contact-avatar {
          border: 2px solid var(--sage-500, #84cc16);
        }
        
        .contact-item.medium-risk .contact-avatar {
          border: 2px solid #f59e0b;
        }
        
        .contact-item.high-risk .contact-avatar {
          border: 2px solid #ef4444;
        }
        
        .contact-item.critical-risk .contact-avatar {
          border: 2px solid #7c2d12;
        }

        .contact-avatar .risk-indicator {
          position: absolute;
          bottom: -2px;
          right: -2px;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          border: 2px solid white;
        }

        .contact-avatar {
          position: relative;
        }

        .risk-indicator.low {
          background: var(--sage-500, #84cc16);
          color: white;
        }

        .risk-indicator.medium {
          background: #f59e0b;
          color: white;
        }

        .risk-indicator.high {
          background: #ef4444;
          color: white;
        }

        .risk-indicator.critical {
          background: #7c2d12;
          color: white;
        }

        .contact-risk-badge {
          font-size: 8px;
          text-transform: uppercase;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 4px;
          margin-top: 4px;
        }

        .contact-risk-badge.low {
          background: rgba(132, 204, 22, 0.2);
          color: var(--sage-700, #4d7c0f);
        }

        .contact-risk-badge.medium {
          background: #fef3c7;
          color: #92400e;
        }

        .contact-risk-badge.high {
          background: #fee2e2;
          color: #991b1b;
        }

        .contact-risk-badge.critical {
          background: #7c2d12;
          color: white;
        }

        /* Recipient Fraud Profile Card */
        .selected-recipient-section {
          margin-bottom: 20px;
        }

        .recipient-fraud-profile {
          margin-top: 16px;
          padding: 20px;
          border-radius: 16px;
          background: white;
          border: 1px solid rgba(0, 0, 0, 0.08);
        }

        .recipient-fraud-profile.low {
          border-left: 4px solid var(--sage-500, #84cc16);
          background: linear-gradient(135deg, rgba(132, 204, 22, 0.1) 0%, rgba(132, 204, 22, 0.05) 100%);
        }

        .recipient-fraud-profile.medium {
          border-left: 4px solid #f59e0b;
          background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
        }

        .recipient-fraud-profile.high {
          border-left: 4px solid #ef4444;
          background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
        }

        .recipient-fraud-profile.critical {
          border-left: 4px solid #7c2d12;
          background: linear-gradient(135deg, #fef2f2 0%, #fecaca 100%);
        }

        .fraud-profile-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }

        .fraud-profile-header .profile-icon {
          font-size: 24px;
        }

        .fraud-profile-header .profile-title {
          flex: 1;
        }

        .fraud-profile-header .profile-title h4 {
          margin: 0;
          font-size: 14px;
          color: #374151;
        }

        .fraud-profile-header .risk-badge {
          display: inline-block;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 700;
          margin-top: 4px;
        }

        .risk-badge.low {
          background: #10b981;
          color: white;
        }

        .risk-badge.medium {
          background: #f59e0b;
          color: white;
        }

        .risk-badge.high {
          background: #ef4444;
          color: white;
        }

        .risk-badge.critical {
          background: #7c2d12;
          color: white;
        }

        .fraud-profile-header .risk-score {
          text-align: right;
        }

        .fraud-profile-header .score-label {
          display: block;
          font-size: 11px;
          color: var(--sage-600, #65a30d);
        }

        .fraud-profile-header .score-value {
          font-size: 24px;
          font-weight: 700;
          color: var(--sage-800, #166534);
        }

        .fraud-profile-stats {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          padding: 16px;
          background: rgba(255,255,255,0.7);
          border-radius: 12px;
          margin-bottom: 16px;
        }

        .fraud-profile-stats .stat-item {
          text-align: center;
        }

        .fraud-profile-stats .stat-label {
          display: block;
          font-size: 11px;
          color: var(--sage-600, #65a30d);
          margin-bottom: 4px;
        }

        .fraud-profile-stats .stat-value {
          font-size: 16px;
          font-weight: 600;
          color: var(--sage-800, #166534);
        }

        .fraud-profile-stats .stat-value.flagged {
          color: #ef4444;
        }

        .risk-factors-section {
          margin-bottom: 16px;
        }

        .risk-factors-section h5 {
          margin: 0 0 10px 0;
          font-size: 13px;
          color: #991b1b;
        }

        .risk-factors-section ul {
          margin: 0;
          padding-left: 20px;
        }

        .risk-factors-section li {
          font-size: 13px;
          color: #7f1d1d;
          margin-bottom: 6px;
        }

        .recommendation-box {
          padding: 14px;
          border-radius: 10px;
          margin-bottom: 12px;
        }

        .recommendation-box.low {
          background: rgba(132, 204, 22, 0.2);
          color: var(--sage-700, #4d7c0f);
        }

        .recommendation-box.medium {
          background: #fef3c7;
          color: #92400e;
        }

        .recommendation-box.high {
          background: #fee2e2;
          color: #991b1b;
        }

        .recommendation-box.critical {
          background: #7c2d12;
          color: white;
        }

        .recommendation-box strong {
          display: block;
          font-size: 12px;
          margin-bottom: 4px;
        }

        .recommendation-box p {
          margin: 0;
          font-size: 13px;
        }

        .last-activity {
          font-size: 12px;
          color: var(--sage-500, #84cc16);
          text-align: right;
        }

        /* Fraud Service Badge */
        .fraud-service-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          background: linear-gradient(135deg, rgba(132, 204, 22, 0.15) 0%, rgba(101, 163, 13, 0.15) 100%);
          border-radius: 12px;
          font-size: 13px;
          font-weight: 500;
          color: var(--sage-700, #4d7c0f);
          margin-bottom: 16px;
          border: 1px solid rgba(132, 204, 22, 0.3);
        }

        .fraud-service-badge .badge-icon {
          font-size: 16px;
        }

        /* Alert Styles */
        .alert {
          padding: 14px 18px;
          border-radius: 12px;
          margin-bottom: 16px;
          font-size: 14px;
          font-weight: 500;
        }

        .alert-error {
          background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
          color: #991b1b;
          border: 1px solid #fecaca;
        }

        .alert-success {
          background: linear-gradient(135deg, rgba(132, 204, 22, 0.15) 0%, rgba(101, 163, 13, 0.15) 100%);
          color: var(--sage-700, #4d7c0f);
          border: 1px solid rgba(132, 204, 22, 0.3);
        }

        /* Success Animation Styles */
        .success-animation-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.85);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
          animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .success-animation-content {
          text-align: center;
          position: relative;
        }

        .coin-animation {
          perspective: 1000px;
          margin-bottom: 24px;
        }

        .coin {
          width: 120px;
          height: 120px;
          position: relative;
          transform-style: preserve-3d;
          animation: flip-coin 1s ease-in-out infinite;
          margin: 0 auto;
        }

        @keyframes flip-coin {
          0% { transform: rotateY(0deg); }
          50% { transform: rotateY(180deg); }
          100% { transform: rotateY(360deg); }
        }

        .coin-front, .coin-back {
          position: absolute;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 48px;
          font-weight: 700;
          backface-visibility: hidden;
          box-shadow: 0 0 40px rgba(255, 215, 0, 0.6);
        }

        .coin-front {
          background: linear-gradient(145deg, #ffd700, #ffb700, #ffd700);
          color: #8b6914;
          border: 4px solid #b8860b;
        }

        .coin-back {
          background: linear-gradient(145deg, #ffd700, #ffb700, #ffd700);
          color: #22c55e;
          border: 4px solid #b8860b;
          transform: rotateY(180deg);
        }

        .success-text h2 {
          color: #22c55e;
          font-size: 28px;
          margin: 0 0 12px;
          font-family: 'Poppins', sans-serif;
        }

        .amount-display {
          font-size: 42px;
          font-weight: 700;
          color: #ffd700;
          margin: 0;
          text-shadow: 0 2px 10px rgba(255, 215, 0, 0.5);
        }

        .recipient-display {
          color: rgba(255, 255, 255, 0.8);
          font-size: 16px;
          margin: 8px 0 0;
        }

        .sparkles {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 200px;
          height: 200px;
          margin: -100px 0 0 -100px;
          pointer-events: none;
        }

        .sparkle {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 8px;
          height: 8px;
          background: #ffd700;
          border-radius: 50%;
          animation: sparkle 1.5s ease-out infinite;
          animation-delay: var(--delay);
          transform: rotate(var(--angle)) translateX(80px);
        }

        @keyframes sparkle {
          0% { opacity: 1; transform: rotate(var(--angle)) translateX(40px) scale(1); }
          100% { opacity: 0; transform: rotate(var(--angle)) translateX(120px) scale(0); }
        }

        @media (max-width: 600px) {
          .payment-container {
            margin: 0 16px;
          }

          .contacts-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 8px;
          }

          .contact-item {
            padding: 12px 4px;
          }

          .contact-avatar {
            width: 40px;
            height: 40px;
          }

          .fraud-profile-stats {
            grid-template-columns: repeat(2, 1fr);
          }

          .page-intro {
            padding: 0 20px;
          }

          .intro-features {
            flex-direction: column;
            gap: 12px;
          }
        }

        /* Page Intro Styles */
        .payment-page {
          min-height: 100vh;
          padding: 40px 20px;
        }

        .page-intro {
          max-width: 600px;
          margin: 0 auto 40px;
          text-align: center;
        }

        .page-intro .intro-icon {
          width: 80px;
          height: 80px;
          background: rgba(255, 255, 255, 0.9);
          border-radius: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 24px;
          color: #16a34a;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        }

        .page-intro h1 {
          font-family: 'Playfair Display', serif;
          font-size: 36px;
          font-weight: 600;
          color: #ffffff;
          margin: 0 0 16px;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .page-intro .intro-description {
          font-size: 16px;
          line-height: 1.7;
          color: #ffffff;
          max-width: 520px;
          margin: 0 auto 28px;
          text-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
        }

        .intro-features {
          display: flex;
          justify-content: center;
          gap: 20px;
          flex-wrap: wrap;
        }

        .intro-feature {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(5px);
          padding: 10px 18px;
          border-radius: 50px;
          font-size: 14px;
          font-weight: 500;
          color: #15803d;
          border: 1px solid rgba(255, 255, 255, 0.5);
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }

        .intro-feature .feature-icon {
          font-size: 16px;
        }
      `}</style>
    </div>
  )
}