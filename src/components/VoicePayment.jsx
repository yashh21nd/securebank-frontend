import React, { useState, useRef, useEffect } from 'react'
import { speechAPI, paymentAPI, getAuthToken } from '../services/api'
import { analyzeTransaction, checkFraudServiceHealth, getContactFraudProfile, getDatasetStats } from '../services/fraudDetection'

export default function VoicePayment({ user, onPaymentComplete, isLoggedIn, currentBalance = 10000, onTransactionAdd }) {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [parsedCommand, setParsedCommand] = useState(null)
  const [confirmation, setConfirmation] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [browserSupport, setBrowserSupport] = useState(true)
  const [balance, setBalance] = useState(currentBalance)
  const [fraudAnalysis, setFraudAnalysis] = useState(null)
  const [fraudServiceActive, setFraudServiceActive] = useState(false)
  const [showFraudWarning, setShowFraudWarning] = useState(false)
  const [selectedContact, setSelectedContact] = useState(null)
  const [contactFraudProfile, setContactFraudProfile] = useState(null)
  const [loadingProfile, setLoadingProfile] = useState(false)
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false)
  const [lastPaymentAmount, setLastPaymentAmount] = useState(0)
  const [lastPaymentRecipient, setLastPaymentRecipient] = useState('')
  const [datasetStats, setDatasetStats] = useState(null)
  const [contacts, setContacts] = useState([])
  const [showAmountInput, setShowAmountInput] = useState(false)
  const [quickPayAmount, setQuickPayAmount] = useState('')
  
  const recognitionRef = useRef(null)

  // Base contacts - will be enriched with dataset fraud profiles
  const baseContacts = [
    { id: 'contact-1', full_name: 'Priya Sharma', username: 'priya', upi_id: 'priya@securebank', riskBias: 'low' },
    { id: 'contact-2', full_name: 'Rahul Patel', username: 'rahul', upi_id: 'rahul@securebank', riskBias: 'low' },
    { id: 'contact-3', full_name: 'Amit Kumar', username: 'amit', upi_id: 'amit@securebank', riskBias: 'medium' },
    { id: 'contact-4', full_name: 'Deepak Verma', username: 'deepak', upi_id: 'deepak@securebank', riskBias: 'high' },
    { id: 'contact-5', full_name: 'Sneha Reddy', username: 'sneha', upi_id: 'sneha@securebank', riskBias: 'low' },
    { id: 'contact-6', full_name: 'Vikram Singh', username: 'vikram', upi_id: 'vikram@securebank', riskBias: 'critical' },
    { id: 'contact-7', full_name: 'Ananya Gupta', username: 'ananya', upi_id: 'ananya@securebank', riskBias: 'low' },
    { id: 'contact-8', full_name: 'Karthik Nair', username: 'karthik', upi_id: 'karthik@securebank', riskBias: 'medium' },
  ]

  // Load fraud profiles from PaySim dataset on mount
  useEffect(() => {
    const loadFraudProfiles = async () => {
      const isHealthy = await checkFraudServiceHealth()
      setFraudServiceActive(isHealthy)
      
      if (isHealthy) {
        // Get dataset statistics
        const stats = await getDatasetStats()
        if (stats.status === 'success') {
          setDatasetStats(stats.statistics)
        }
        
        // Load fraud profile for each contact
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
        setContacts(baseContacts)
      }
    }
    
    loadFraudProfiles()
  }, [])

  useEffect(() => {
    // Update balance when prop changes
    setBalance(currentBalance)
  }, [currentBalance])

  useEffect(() => {
    // Initialize Web Speech API if available
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = false
      recognitionRef.current.interimResults = true
      recognitionRef.current.lang = 'en-IN'

      recognitionRef.current.onresult = (event) => {
        const result = event.results[event.results.length - 1]
        const text = result[0].transcript
        setTranscript(text)

        if (result.isFinal) {
          processVoiceCommand(text)
        }
      }

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error)
        if (event.error === 'not-allowed') {
          setError('Microphone access denied. Please allow microphone access and try again.')
        } else {
          setError(`Voice recognition error: ${event.error}`)
        }
        setIsListening(false)
      }

      recognitionRef.current.onend = () => {
        setIsListening(false)
      }
    } else {
      setBrowserSupport(false)
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [])

  const startListening = () => {
    setError('')
    setSuccess('')
    setTranscript('')
    setParsedCommand(null)
    setConfirmation(null)

    if (recognitionRef.current) {
      try {
        recognitionRef.current.start()
        setIsListening(true)
      } catch (err) {
        setError('Failed to start voice recognition. Please try again.')
      }
    } else {
      setError('Voice recognition not supported in this browser')
    }
  }

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }
    setIsListening(false)
  }

  const parseCommandLocally = (text) => {
    const lowerText = text.toLowerCase()
    
    // Payment patterns
    const paymentPatterns = [
      /(?:pay|send|transfer)\s+(?:rs\.?|₹|rupees?)?\s*(\d+(?:\.\d{2})?)\s+(?:to|for)\s+(\w+)/i,
      /(?:pay|send|transfer)\s+(\w+)\s+(?:rs\.?|₹|rupees?)?\s*(\d+(?:\.\d{2})?)/i,
      /(\d+(?:\.\d{2})?)\s+(?:to|for)\s+(\w+)/i,
    ]
    
    for (const pattern of paymentPatterns) {
      const match = text.match(pattern)
      if (match) {
        let amount, recipient
        if (pattern === paymentPatterns[1]) {
          recipient = match[1]
          amount = parseFloat(match[2])
        } else {
          amount = parseFloat(match[1])
          recipient = match[2]
        }
        
        // Find matching contact from dataset-enriched contacts
        const matchedContact = contacts.find(c => 
          c.username.toLowerCase() === recipient.toLowerCase() ||
          c.full_name.toLowerCase().includes(recipient.toLowerCase())
        )
        
        if (matchedContact) {
          setSelectedContact(matchedContact)
          setContactFraudProfile(matchedContact.fraudProfile || null)
        }
        
        return {
          action: 'payment',
          amount,
          recipient: matchedContact ? matchedContact.full_name : recipient,
          recipientId: matchedContact ? matchedContact.id : 'unknown-' + recipient.toLowerCase(),
          matchedContact: matchedContact || null,
          raw_text: text
        }
      }
    }
    
    // Balance check
    if (lowerText.includes('balance') || lowerText.includes('how much')) {
      return { action: 'balance_check', raw_text: text }
    }
    
    // Transaction history
    if (lowerText.includes('transaction') || lowerText.includes('history')) {
      return { action: 'transactions', raw_text: text }
    }
    
    return null
  }

  const processVoiceCommand = async (text) => {
    setLoading(true)
    setFraudAnalysis(null)
    setShowFraudWarning(false)
    
    // First try local parsing
    const localParsed = parseCommandLocally(text)
    
    if (localParsed) {
      setParsedCommand(localParsed)
      
      if (localParsed.action === 'payment') {
        // Check if amount exceeds balance
        if (localParsed.amount > balance) {
          setError(`Insufficient balance. Your current balance is ₹${balance.toFixed(2)}`)
          speakResponse(`Insufficient balance. Your current balance is ${balance} rupees`)
          setLoading(false)
          return
        }

        setConfirmation({
          confirmation_required: true,
          payment_details: {
            amount: localParsed.amount,
            recipient_name: localParsed.recipient,
            receiver_id: localParsed.recipientId
          },
          message: `Send ₹${localParsed.amount} to ${localParsed.recipient}?`
        })
      } else if (localParsed.action === 'balance_check') {
        setSuccess(`Your current balance is ₹${balance.toFixed(2)}`)
        speakResponse(`Your current balance is ${balance} rupees`)
      } else if (localParsed.action === 'transactions') {
        setSuccess('You have 5 recent transactions')
        speakResponse('You have 5 recent transactions')
      }
      
      setLoading(false)
      return
    }
    
    // Try backend if available
    if (getAuthToken() && !getAuthToken()?.startsWith('demo-')) {
      try {
        const result = await speechAPI.parseText(text)
        
        if (result.success && result.parsed) {
          setParsedCommand(result.parsed)
          
          const execution = await speechAPI.executeCommand(result.parsed)
          
          if (execution.confirmation_required) {
            setConfirmation(execution)
          } else if (execution.action === 'balance_check') {
            setSuccess(execution.message)
            speakResponse(execution.message)
          } else if (execution.action === 'transactions') {
            setSuccess(execution.message)
            speakResponse(execution.message)
          }
        } else {
          setError('Could not understand the command. Try saying "Send 500 to John" or "Check balance"')
        }
      } catch (err) {
        setError('Could not process command. Try: "Pay 500 to John" or "Check my balance"')
      }
    } else {
      setError('Could not understand the command. Try: "Pay 500 to John" or "Check my balance"')
    }
    
    setLoading(false)
  }

  const confirmPayment = async () => {
    console.log('confirmPayment called, confirmation:', confirmation)
    if (!confirmation || !confirmation.payment_details) {
      console.log('No confirmation or payment details, returning')
      return
    }

    setLoading(true)
    setError('')

    const { amount, receiver_id, recipient_name } = confirmation.payment_details

    // Check balance first
    if (amount > balance) {
      setError(`Insufficient balance. Your current balance is ₹${balance.toFixed(2)}`)
      speakResponse(`Insufficient balance. Your current balance is ${balance} rupees`)
      setLoading(false)
      return
    }

    // Run fraud detection analysis
    try {
      const fraudResult = await analyzeTransaction({
        senderId: user?.id || 'C' + Date.now(),
        recipientId: receiver_id,
        amount: amount,
        senderBalance: balance,
        recipientBalance: 0,
        type: 'transfer'
      })

      setFraudAnalysis(fraudResult)

      // Block transaction if fraud is detected
      if (fraudResult.shouldBlock) {
        setShowFraudWarning(true)
        setLoading(false)
        setError(`🚨 Transaction Blocked: ${fraudResult.recommendation}`)
        speakResponse('Transaction blocked due to fraud risk. Please review.')
        return
      }

      // Show warning for high-risk transactions
      if (fraudResult.requiresReview) {
        setShowFraudWarning(true)
        setLoading(false)
        speakResponse('This transaction has been flagged for review. Please confirm.')
        return // Wait for user confirmation
      }
    } catch (fraudError) {
      console.error('Fraud detection failed:', fraudError)
      // Continue with transaction if fraud service is down
    }

    await processVoicePayment(amount, receiver_id, recipient_name)
  }

  const processVoicePayment = async (amount, receiver_id, recipient_name) => {
    console.log('processVoicePayment called:', { amount, receiver_id, recipient_name })
    setLoading(true)
    setShowFraudWarning(false)

    // Save recipient name for animation display
    setLastPaymentRecipient(recipient_name)
    console.log('Set lastPaymentRecipient to:', recipient_name)

    // Demo mode
    if (!getAuthToken() || getAuthToken()?.startsWith('demo-')) {
      console.log('In demo mode, starting payment...')
      setTimeout(() => {
        const newBalance = balance - amount
        setBalance(newBalance)
        setLastPaymentAmount(amount)
        console.log('Showing success animation with amount:', amount, 'recipient:', recipient_name)
        setShowSuccessAnimation(true)
        setLoading(false)
        
        // Create transaction record for dashboard
        const newTransaction = {
          id: 'TX' + Date.now(),
          desc: `Payment to ${recipient_name}`,
          amount: -amount,
          date: new Date().toISOString().split('T')[0],
          category: 'Transfer',
          recipient: recipient_name,
          status: 'completed'
        }
        
        // Notify parent to update dashboard
        if (onTransactionAdd) {
          onTransactionAdd(newTransaction)
        }
        
        // Hide animation after 3.5 seconds and show success message
        setTimeout(() => {
          setShowSuccessAnimation(false)
          setSuccess(`Payment successful! ₹${amount} sent to ${recipient_name}. New balance: ₹${newBalance.toFixed(2)}`)
          speakResponse(`Payment successful! ${amount} rupees sent to ${recipient_name}. Your new balance is ${newBalance.toFixed(2)} rupees.`)
          
          // Clear all form state after animation
          setConfirmation(null)
          setTranscript('')
          setParsedCommand(null)
          setFraudAnalysis(null)
          setSelectedContact(null)
          setContactFraudProfile(null)
        }, 3500)
        
        if (onPaymentComplete) {
          onPaymentComplete({ new_balance: newBalance, transaction: newTransaction })
        }
      }, 1000)
      return
    }

    try {
      const result = await paymentAPI.sendMoney({
        receiver_id,
        amount,
        description: 'Voice payment'
      })

      const newBalance = result.new_balance || (balance - amount)
      setBalance(newBalance)
      setLastPaymentAmount(amount)
      setShowSuccessAnimation(true)
      setLoading(false)
      
      // Create transaction record
      const newTransaction = {
        id: 'TX' + Date.now(),
        desc: `Payment to ${recipient_name}`,
        amount: -amount,
        date: new Date().toISOString().split('T')[0],
        category: 'Transfer',
        recipient: recipient_name,
        status: 'completed'
      }
      
      if (onTransactionAdd) {
        onTransactionAdd(newTransaction)
      }
      
      setTimeout(() => {
        setShowSuccessAnimation(false)
        setSuccess(`Payment successful! ₹${amount} sent to ${recipient_name}.`)
        speakResponse(`Payment successful! ${amount} rupees sent to ${recipient_name}.`)
        
        // Clear all form state after animation
        setConfirmation(null)
        setFraudAnalysis(null)
        setSelectedContact(null)
        setContactFraudProfile(null)
      }, 3500)
      
      if (onPaymentComplete) {
        onPaymentComplete({ ...result, transaction: newTransaction })
      }
    } catch (err) {
      setError(err.message || 'Payment failed')
      speakResponse('Payment failed. Please try again.')
      setLoading(false)
    }
  }

  const confirmRiskyPayment = () => {
    if (confirmation && confirmation.payment_details) {
      const { amount, receiver_id, recipient_name } = confirmation.payment_details
      processVoicePayment(amount, receiver_id, recipient_name)
    }
  }

  const cancelRiskyPayment = () => {
    setShowFraudWarning(false)
    setFraudAnalysis(null)
    setLoading(false)
    speakResponse('Transaction cancelled due to risk')
  }

  const cancelConfirmation = () => {
    setConfirmation(null)
    setTranscript('')
    setParsedCommand(null)
    setFraudAnalysis(null)
    setShowFraudWarning(false)
    speakResponse('Payment cancelled')
  }

  const speakResponse = (text) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = 'en-IN'
      utterance.rate = 1.0
      speechSynthesis.speak(utterance)
    }
  }

  const handleTextSubmit = (e) => {
    e.preventDefault()
    if (transcript.trim()) {
      processVoiceCommand(transcript.trim())
    }
  }

  if (!browserSupport) {
    return (
      <div className="voice-container">
        <div className="voice-card">
          <div className="voice-header">
            <h2>Voice Payments</h2>
          </div>
          <div className="voice-content">
            <div className="alert alert-error">
              Voice recognition is not supported in this browser. 
              Please use Chrome, Edge, or Safari for voice payments.
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="voice-payment-page">
      {/* Page Header with Description */}
      <div className="page-intro">
        <div className="intro-icon">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
            <line x1="12" y1="19" x2="12" y2="23"/>
            <line x1="8" y1="23" x2="16" y2="23"/>
          </svg>
        </div>
        <h1>Voice Payments</h1>
        <p className="intro-description">
          Experience the future of banking with hands-free voice commands. Simply speak to send money, 
          check your balance, or view recent transactions. Our AI-powered voice recognition understands 
          natural language, making payments as easy as having a conversation.
        </p>
        <div className="intro-features">
          <div className="intro-feature">
            <span className="feature-icon">🎤</span>
            <span>Natural Language</span>
          </div>
          <div className="intro-feature">
            <span className="feature-icon">🛡️</span>
            <span>Fraud Protected</span>
          </div>
          <div className="intro-feature">
            <span className="feature-icon">⚡</span>
            <span>Instant Processing</span>
          </div>
        </div>
      </div>

      <div className="voice-container">
        <div className="voice-card">
          <div className="voice-header">
            <h2>Voice Payments</h2>
            <p>Speak to send money, check balance, or view transactions</p>
            <div className="voice-balance">
              <span className="balance-label">Available Balance</span>
              <span className="balance-amount">₹{balance.toFixed(2)}</span>
            </div>
          </div>

          <div className="voice-content">
            {/* Fraud Service Status */}
            {fraudServiceActive && (
              <div className="fraud-service-badge">
                <span className="badge-icon">🛡️</span>
                <span>ML Fraud Protection Active</span>
              </div>
            )}

            {/* Fraud Warning Modal */}
            {showFraudWarning && fraudAnalysis && (
              <div className="fraud-warning-overlay">
                <div className="fraud-warning-modal">
                  <div className={`fraud-header ${fraudAnalysis.riskLevel}`}>
                    <span className="fraud-icon">
                      {fraudAnalysis.shouldBlock ? '🚨' : '⚠️'}
                    </span>
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

          {/* Voice Button */}
          <div className="voice-button-container">
            <button 
              className={`voice-button ${isListening ? 'listening' : ''}`}
              onClick={isListening ? stopListening : startListening}
              disabled={loading}
            >
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                <line x1="12" y1="19" x2="12" y2="23"/>
                <line x1="8" y1="23" x2="16" y2="23"/>
              </svg>
            </button>
            <p className="voice-status">
              {isListening ? 'Listening...' : 'Tap to speak'}
            </p>
            
            {isListening && (
              <div className="listening-animation">
                <span className="wave"></span>
                <span className="wave"></span>
                <span className="wave"></span>
              </div>
            )}
          </div>

          {/* Manual Text Input */}
          <form onSubmit={handleTextSubmit} className="manual-input-form">
            <input
              type="text"
              placeholder="Or type your command here..."
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              className="manual-input"
            />
            <button type="submit" className="btn-submit" disabled={loading || !transcript.trim()}>
              Go
            </button>
          </form>

          {/* Error/Success Messages */}
          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          {/* Transcript Display */}
          {transcript && !error && !success && (
            <div className="transcript-display">
              <label>You said:</label>
              <p className="transcript-text">"{transcript}"</p>
            </div>
          )}

          {/* Parsed Command */}
          {parsedCommand && !confirmation && (
            <div className="parsed-command">
              <label>Understood:</label>
              <div className="command-info">
                {parsedCommand.action === 'payment' && (
                  <p>Send ₹{parsedCommand.amount} to {parsedCommand.recipient}</p>
                )}
                {parsedCommand.action === 'balance_check' && (
                  <p>Check account balance</p>
                )}
                {parsedCommand.action === 'transactions' && (
                  <p>View recent transactions</p>
                )}
              </div>
            </div>
          )}

          {/* Confirmation Dialog */}
          {confirmation && (
            <div className="confirmation-dialog">
              <h3>Confirm Payment</h3>
              <div className="confirmation-details">
                <div className="confirm-item">
                  <span className="label">To</span>
                  <span className="value">{confirmation.payment_details.recipient_name}</span>
                </div>
                <div className="confirm-item">
                  <span className="label">Amount</span>
                  <span className="value amount">₹{confirmation.payment_details.amount}</span>
                </div>
              </div>
              <div className="confirmation-buttons">
                <button 
                  className="btn-confirm"
                  onClick={confirmPayment}
                  disabled={loading}
                >
                  {loading ? 'Processing...' : 'Confirm'}
                </button>
                <button 
                  className="btn-cancel"
                  onClick={cancelConfirmation}
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Example Commands */}
          <div className="example-commands">
            <h4>Try saying:</h4>
            <ul>
              <li>"Pay 500 to Priya"</li>
              <li>"Send 1000 rupees to Rahul"</li>
              <li>"Check my balance"</li>
              <li>"Show my transactions"</li>
            </ul>
          </div>

          {/* Quick Contact Suggestions with Fraud Risk */}
          {contacts.length > 0 && (
            <div className="contact-suggestions">
              <div className="suggestions-header">
                <h4>Quick Pay - Select Contact</h4>
                {fraudServiceActive && datasetStats && (
                  <span className="dataset-indicator">
                    <span className="pulse-dot"></span>
                    ML Dataset Active ({datasetStats.total_records?.toLocaleString()} records)
                  </span>
                )}
              </div>
              <div className="contact-chips">
                {contacts.map(contact => (
                  <button
                    key={contact.id}
                    className={`contact-chip ${contact.fraudProfile?.riskLevel || 'unknown'}`}
                    onClick={() => {
                      setSelectedContact(contact)
                      setContactFraudProfile(contact.fraudProfile)
                      setShowAmountInput(true)
                      setQuickPayAmount('')
                      setError('')
                      setSuccess('')
                    }}
                  >
                    <span className="chip-avatar">
                      {contact.full_name[0]}
                      <span className={`risk-dot ${contact.fraudProfile?.riskLevel || 'unknown'}`}></span>
                    </span>
                    <span className="chip-info">
                      <span className="chip-name">{contact.full_name.split(' ')[0]}</span>
                      <span className={`chip-risk ${contact.fraudProfile?.riskLevel || 'unknown'}`}>
                        {contact.fraudProfile?.riskLevel === 'low' && '✓ Safe'}
                        {contact.fraudProfile?.riskLevel === 'medium' && '⚠ Caution'}
                        {contact.fraudProfile?.riskLevel === 'high' && '⚠ High Risk'}
                        {contact.fraudProfile?.riskLevel === 'critical' && '🚨 Critical'}
                        {!contact.fraudProfile?.riskLevel && '? Unknown'}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quick Pay Amount Input */}
          {showAmountInput && selectedContact && (
            <div className="quick-pay-input-section">
              <div className="quick-pay-header">
                <h4>Send Money to {selectedContact.full_name}</h4>
                <button className="close-quick-pay" onClick={() => { setShowAmountInput(false); setSelectedContact(null); setContactFraudProfile(null); setQuickPayAmount(''); }}>×</button>
              </div>
              <div className="quick-pay-form">
                <div className="amount-input-wrapper">
                  <span className="currency-symbol">₹</span>
                  <input
                    type="number"
                    placeholder="Enter amount"
                    value={quickPayAmount}
                    onChange={(e) => setQuickPayAmount(e.target.value)}
                    className="quick-pay-amount-input"
                    autoFocus
                  />
                </div>
                <button
                  className="btn-quick-pay"
                  disabled={!quickPayAmount || parseFloat(quickPayAmount) <= 0 || loading}
                  onClick={() => {
                    const amount = parseFloat(quickPayAmount)
                    if (amount > 0) {
                      setShowAmountInput(false)
                      setConfirmation({
                        confirmation_required: true,
                        payment_details: {
                          amount: amount,
                          recipient_name: selectedContact.full_name,
                          receiver_id: selectedContact.id
                        },
                        message: `Send ₹${amount} to ${selectedContact.full_name}?`
                      })
                    }
                  }}
                >
                  Continue
                </button>
              </div>
              {selectedContact.fraudProfile && (
                <div className={`quick-pay-risk-indicator ${selectedContact.fraudProfile.riskLevel}`}>
                  <span className="risk-icon">
                    {selectedContact.fraudProfile.riskLevel === 'low' && '✓'}
                    {selectedContact.fraudProfile.riskLevel === 'medium' && '⚠'}
                    {selectedContact.fraudProfile.riskLevel === 'high' && '⚠'}
                    {selectedContact.fraudProfile.riskLevel === 'critical' && '🚨'}
                  </span>
                  <span>Risk Level: {selectedContact.fraudProfile.riskLevel.toUpperCase()}</span>
                </div>
              )}
            </div>
          )}

          {/* Selected Contact Fraud Profile */}
          {selectedContact && contactFraudProfile && !showAmountInput && (
            <div className={`contact-fraud-profile ${contactFraudProfile.riskLevel}`}>
              <div className="profile-header">
                <div className="profile-avatar">
                  {selectedContact.full_name[0]}
                  <span className={`risk-badge-avatar ${contactFraudProfile.riskLevel}`}>
                    {contactFraudProfile.riskLevel === 'low' && '✓'}
                    {contactFraudProfile.riskLevel === 'medium' && '!'}
                    {contactFraudProfile.riskLevel === 'high' && '⚠'}
                    {contactFraudProfile.riskLevel === 'critical' && '🚨'}
                  </span>
                </div>
                <div className="profile-info">
                  <h4>{selectedContact.full_name}</h4>
                  <p>{selectedContact.upi_id}</p>
                </div>
                <button className="close-profile" onClick={() => { setSelectedContact(null); setContactFraudProfile(null); }}>×</button>
              </div>
              
              <div className="profile-risk-summary">
                <div className={`risk-score-display ${contactFraudProfile.riskLevel}`}>
                  <span className="score-value">{(contactFraudProfile.riskScore * 100).toFixed(1)}%</span>
                  <span className="score-label">Risk Score</span>
                </div>
                <div className="risk-level-badge">
                  <span className={`level-indicator ${contactFraudProfile.riskLevel}`}>
                    {contactFraudProfile.riskLevel.toUpperCase()}
                  </span>
                  <span className="data-source">Source: {contactFraudProfile.dataSource || 'PaySim Dataset'}</span>
                </div>
              </div>

              <div className="profile-stats-grid">
                <div className="stat-box">
                  <span className="stat-num">{contactFraudProfile.historicalTransactions}</span>
                  <span className="stat-label">Transactions</span>
                </div>
                <div className="stat-box">
                  <span className="stat-num">₹{(contactFraudProfile.avgTransactionAmount || 0).toFixed(0)}</span>
                  <span className="stat-label">Avg Amount</span>
                </div>
                <div className="stat-box">
                  <span className={`stat-num ${contactFraudProfile.flaggedTransactions > 0 ? 'flagged' : ''}`}>
                    {contactFraudProfile.flaggedTransactions}
                  </span>
                  <span className="stat-label">Flagged</span>
                </div>
                <div className="stat-box">
                  <span className="stat-num">{contactFraudProfile.accountAge}</span>
                  <span className="stat-label">Account Age</span>
                </div>
              </div>

              {contactFraudProfile.riskFactors && contactFraudProfile.riskFactors.length > 0 && (
                <div className="risk-factors-list">
                  <h5>⚠️ Risk Factors (from PaySim Dataset):</h5>
                  <ul>
                    {contactFraudProfile.riskFactors.slice(0, 4).map((factor, idx) => (
                      <li key={idx}>{factor}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className={`recommendation-banner ${contactFraudProfile.riskLevel}`}>
                <strong>AI Recommendation:</strong>
                <p>{contactFraudProfile.recommendation}</p>
              </div>

              {contactFraudProfile.commonTransactionTypes && (
                <div className="transaction-types">
                  <span className="types-label">Common Types:</span>
                  {contactFraudProfile.commonTransactionTypes.map((type, idx) => (
                    <span key={idx} className="type-tag">{type}</span>
                  ))}
                </div>
              )}
            </div>
          )}
          </div>
        </div>
      </div>

      {/* Success Animation Overlay */}
      {showSuccessAnimation && (
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
              <p className="amount-display">₹{lastPaymentAmount.toFixed(2)}</p>
              <p className="recipient-display">Sent to {lastPaymentRecipient}</p>
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
        .voice-payment-page {
          max-width: 600px;
          margin: 0 auto;
        }

        .page-intro {
          background: rgba(255, 255, 253, 0.85);
          backdrop-filter: blur(20px);
          border-radius: 24px;
          padding: 36px;
          text-align: center;
          border: 1px solid rgba(212, 218, 201, 0.4);
          margin-bottom: 28px;
        }

        .intro-icon {
          width: 72px;
          height: 72px;
          background: linear-gradient(135deg, #d4a84b, #b87333);
          border-radius: 18px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
          color: white;
          box-shadow: 0 8px 24px rgba(212, 168, 75, 0.3);
        }

        .page-intro h1 {
          font-family: 'Playfair Display', serif;
          font-size: 32px;
          color: #3d4a33;
          margin: 0 0 14px;
        }

        .intro-description {
          font-size: 15px;
          line-height: 1.8;
          color: #5d7049;
          margin: 0 0 24px;
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
          padding: 10px 18px;
          background: rgba(212, 218, 201, 0.4);
          border-radius: 24px;
          font-size: 13px;
          font-weight: 500;
          color: #4a5a3c;
        }

        .intro-feature .feature-icon {
          font-size: 16px;
        }

        .voice-container {
          max-width: 500px;
          margin: 0 auto;
        }

        .voice-card {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(8px);
          border-radius: 28px;
          overflow: hidden;
          box-shadow: 0 12px 48px rgba(22, 163, 74, 0.12);
          border: 1px solid rgba(34, 197, 94, 0.2);
        }

        .voice-header {
          background: linear-gradient(135deg, #16a34a 0%, #22c55e 100%);
          padding: 32px;
          color: white;
          text-align: center;
        }

        .voice-header h2 {
          margin: 0;
          font-size: 26px;
          font-family: 'Playfair Display', serif;
          font-weight: 600;
          letter-spacing: 0.5px;
        }

        .voice-header p {
          margin: 8px 0 0;
          opacity: 0.9;
          font-size: 14px;
        }

        .voice-balance {
          margin-top: 18px;
          padding: 14px 24px;
          background: rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(8px);
          border-radius: 14px;
          display: inline-block;
          border: 1px solid rgba(255, 255, 255, 0.3);
        }

        .voice-balance .balance-label {
          display: block;
          font-size: 11px;
          opacity: 0.9;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .voice-balance .balance-amount {
          font-size: 28px;
          font-weight: 600;
          font-family: 'Playfair Display', serif;
        }

        .fraud-service-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: linear-gradient(135deg, rgba(220, 252, 231, 0.9) 0%, rgba(187, 247, 208, 0.9) 100%);
          color: #15803d;
          padding: 10px 18px;
          border-radius: 24px;
          font-size: 13px;
          font-weight: 500;
          margin-bottom: 18px;
          border: 1px solid rgba(34, 197, 94, 0.4);
        }

        .fraud-service-badge .badge-icon {
          font-size: 16px;
        }

        .fraud-warning-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(61, 74, 51, 0.7);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .fraud-warning-modal {
          background: white;
          border-radius: 16px;
          max-width: 500px;
          width: 90%;
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          animation: slideUp 0.3s ease;
        }

        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        .fraud-header {
          padding: 24px;
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .fraud-header.critical,
        .fraud-header.high {
          background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
          border-bottom: 2px solid #f87171;
        }

        .fraud-header.medium {
          background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%);
          border-bottom: 2px solid #fbbf24;
        }

        .fraud-header.low {
          background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
          border-bottom: 2px solid #4ade80;
        }

        .fraud-icon {
          font-size: 40px;
        }

        .fraud-header h3 {
          margin: 0;
          font-size: 20px;
          font-weight: 600;
          color: #1f2937;
        }

        .fraud-content {
          padding: 24px;
        }

        .fraud-stats {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 20px;
        }

        .fraud-stat {
          background: #f9fafb;
          padding: 16px;
          border-radius: 12px;
          text-align: center;
        }

        .stat-label {
          display: block;
          font-size: 12px;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 4px;
        }

        .stat-value {
          display: block;
          font-size: 18px;
          font-weight: 700;
        }

        .stat-value.risk-critical {
          color: #dc2626;
        }

        .stat-value.risk-high {
          color: #ea580c;
        }

        .stat-value.risk-medium {
          color: #d97706;
        }

        .stat-value.risk-low {
          color: #059669;
        }

        .risk-factors {
          margin-bottom: 16px;
        }

        .risk-factors h4 {
          font-size: 14px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 12px;
        }

        .risk-factors ul {
          list-style: none;
          padding: 0;
        }

        .risk-factors li {
          padding: 8px 12px;
          background: #fef2f2;
          color: #991b1b;
          border-radius: 8px;
          margin-bottom: 8px;
          font-size: 13px;
          border-left: 3px solid #f87171;
        }

        .fraud-recommendation {
          background: #f3f4f6;
          padding: 16px;
          border-radius: 12px;
          font-size: 14px;
          color: #374151;
          line-height: 1.5;
          margin-top: 16px;
        }

        .fraud-actions {
          display: flex;
          gap: 12px;
          padding: 20px 24px;
          background: #f9fafb;
          border-top: 1px solid #e5e7eb;
        }

        .btn-danger {
          flex: 1;
          padding: 14px 24px;
          background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%);
          color: white;
          border: none;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-danger:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(220, 38, 38, 0.4);
        }

        .btn-secondary {
          flex: 1;
          padding: 14px 24px;
          background: white;
          color: #374151;
          border: 2px solid #e5e7eb;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-secondary:hover {
          background: rgba(246, 247, 244, 0.8);
          border-color: rgba(212, 218, 201, 0.8);
        }

        .voice-content {
          padding: 36px 28px;
        }

        .voice-button-container {
          text-align: center;
          margin-bottom: 28px;
        }

        .voice-button {
          width: 110px;
          height: 110px;
          border-radius: 50%;
          border: none;
          background: linear-gradient(135deg, #768b5f 0%, #5d7049 100%);
          color: white;
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 8px 28px rgba(93, 112, 73, 0.35);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto;
        }

        .voice-button:hover:not(:disabled) {
          transform: scale(1.08);
          box-shadow: 0 14px 40px rgba(93, 112, 73, 0.45);
        }

        .voice-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .voice-button.listening {
          background: linear-gradient(135deg, #b87333 0%, #d4a84b 100%);
          animation: pulse 1.5s infinite;
          box-shadow: 0 8px 28px rgba(184, 115, 51, 0.4);
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }

        .voice-status {
          margin-top: 14px;
          font-size: 14px;
          color: #5d7049;
          font-weight: 500;
        }

        .listening-animation {
          display: flex;
          justify-content: center;
          gap: 5px;
          margin-top: 14px;
        }

        .wave {
          width: 4px;
          height: 20px;
          background: linear-gradient(180deg, #768b5f, #5d7049);
          border-radius: 2px;
          animation: wave 0.8s ease-in-out infinite;
        }

        .wave:nth-child(2) { animation-delay: 0.1s; }
        .wave:nth-child(3) { animation-delay: 0.2s; }

        @keyframes wave {
          0%, 100% { height: 20px; }
          50% { height: 40px; }
        }

        .manual-input-form {
          display: flex;
          gap: 10px;
          margin-bottom: 24px;
        }

        .manual-input {
          flex: 1;
          background: rgba(255, 254, 249, 0.9);
          border: 2px solid rgba(212, 218, 201, 0.6);
          border-radius: 14px;
        }

        .manual-input:focus {
          border-color: #768b5f;
          box-shadow: 0 0 0 4px rgba(118, 139, 95, 0.12);
        }

        .btn-submit {
          padding: 14px 28px;
          background: linear-gradient(135deg, #768b5f 0%, #5d7049 100%);
          color: white;
          border: none;
          border-radius: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-submit:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(93, 112, 73, 0.35);
        }

        .btn-submit:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .transcript-display {
          background: rgba(246, 247, 244, 0.8);
          padding: 18px;
          border-radius: 14px;
          margin-bottom: 18px;
          border: 1px solid rgba(212, 218, 201, 0.6);
        }

        .transcript-display label {
          font-size: 11px;
          color: #5d7049;
          text-transform: uppercase;
          letter-spacing: 1px;
          font-weight: 600;
        }

        .transcript-text {
          margin: 10px 0 0 0;
          font-size: 18px;
          font-style: italic;
          color: #4a5a3c;
        }

        .parsed-command {
          background: rgba(246, 247, 244, 0.8);
          padding: 18px;
          border-radius: 14px;
          margin-bottom: 18px;
          border: 1px solid rgba(212, 218, 201, 0.6);
        }

        .parsed-command label {
          font-size: 11px;
          color: #5d7049;
          text-transform: uppercase;
          letter-spacing: 1px;
          font-weight: 600;
        }

        .command-info {
          margin-top: 10px;
        }

        .command-info p {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: #4a5a3c;
        }

        .confirmation-dialog {
          background: rgba(246, 247, 244, 0.9);
          padding: 28px;
          border-radius: 18px;
          border: 2px solid #94a37e;
          margin-bottom: 18px;
        }

        .confirmation-dialog h3 {
          margin: 0 0 18px 0;
          color: #3d4a33;
          font-family: 'Playfair Display', serif;
          font-size: 20px;
        }

        .confirmation-details {
          margin-bottom: 24px;
        }

        .confirm-item {
          display: flex;
          justify-content: space-between;
          padding: 14px 0;
          border-bottom: 1px solid rgba(212, 218, 201, 0.6);
        }

        .confirm-item:last-child {
          border-bottom: none;
        }

        .confirm-item .label {
          color: #5d7049;
        }

        .confirm-item .value {
          font-weight: 600;
          color: #3d4a33;
        }

        .confirm-item .value.amount {
          font-size: 28px;
          color: #4a5a3c;
          font-family: 'Playfair Display', serif;
        }

        .confirmation-buttons {
          display: flex;
          gap: 14px;
        }

        .btn-confirm {
          flex: 1;
          padding: 15px;
          background: linear-gradient(135deg, #768b5f 0%, #5d7049 100%);
          color: white;
          border: none;
          border-radius: 14px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 16px rgba(93, 112, 73, 0.3);
        }

        .btn-confirm:hover:not(:disabled) {
          transform: translateY(-3px);
          box-shadow: 0 6px 24px rgba(93, 112, 73, 0.4);
        }

        .btn-confirm:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-cancel {
          flex: 1;
          padding: 15px;
          background: rgba(253, 252, 247, 0.9);
          color: #5d7049;
          border: 2px solid rgba(212, 218, 201, 0.8);
          border-radius: 14px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .btn-cancel:hover:not(:disabled) {
          background: rgba(246, 247, 244, 0.9);
          border-color: #94a37e;
        }

        .example-commands {
          background: rgba(253, 252, 247, 0.8);
          padding: 22px;
          border-radius: 16px;
          border: 1px solid rgba(212, 218, 201, 0.5);
          margin-bottom: 24px;
        }

        .example-commands h4 {
          margin: 0 0 14px 0;
          color: #3d4a33;
          font-size: 14px;
          font-weight: 600;
        }

        .example-commands ul {
          margin: 0;
          padding-left: 20px;
        }

        .example-commands li {
          color: #5d7049;
          margin-bottom: 10px;
          font-style: italic;
        }

        /* Contact Suggestions */
        .contact-suggestions {
          margin-top: 28px;
          padding: 24px;
          background: rgba(253, 252, 247, 0.85);
          backdrop-filter: blur(10px);
          border-radius: 18px;
          border: 1px solid rgba(212, 218, 201, 0.5);
        }

        .suggestions-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 18px;
          flex-wrap: wrap;
          gap: 10px;
        }

        .suggestions-header h4 {
          margin: 0;
          color: #3d4a33;
          font-size: 15px;
          font-weight: 600;
        }

        .dataset-indicator {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          color: #4a5a3c;
          background: rgba(212, 218, 201, 0.6);
          padding: 6px 12px;
          border-radius: 14px;
        }

        .pulse-dot {
          width: 6px;
          height: 6px;
          background: #10b981;
          border-radius: 50%;
          animation: pulse-dot 2s infinite;
        }

        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }

        .contact-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .contact-chip {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
          background: white;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .contact-chip:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }

        .contact-chip.low { border-color: #86efac; }
        .contact-chip.medium { border-color: #fcd34d; }
        .contact-chip.high { border-color: #fca5a5; }
        .contact-chip.critical { border-color: #ef4444; }

        .chip-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          position: relative;
        }

        .risk-dot {
          position: absolute;
          bottom: -2px;
          right: -2px;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          border: 2px solid white;
        }

        .risk-dot.low { background: #22c55e; }
        .risk-dot.medium { background: #f59e0b; }
        .risk-dot.high { background: #ef4444; }
        .risk-dot.critical { background: #7c2d12; }
        .risk-dot.unknown { background: #9ca3af; }

        .chip-info {
          display: flex;
          flex-direction: column;
          text-align: left;
        }

        .chip-name {
          font-weight: 600;
          color: #1f2937;
          font-size: 13px;
        }

        .chip-risk {
          font-size: 11px;
          font-weight: 500;
        }

        .chip-risk.low { color: #16a34a; }
        .chip-risk.medium { color: #d97706; }
        .chip-risk.high { color: #dc2626; }
        .chip-risk.critical { color: #7c2d12; }

        /* Contact Fraud Profile Card */
        .contact-fraud-profile {
          margin-top: 20px;
          background: white;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        }

        .contact-fraud-profile.low { border-top: 4px solid #22c55e; }
        .contact-fraud-profile.medium { border-top: 4px solid #f59e0b; }
        .contact-fraud-profile.high { border-top: 4px solid #ef4444; }
        .contact-fraud-profile.critical { border-top: 4px solid #7c2d12; }

        .profile-header {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 20px;
          background: #f8fafc;
          position: relative;
        }

        .profile-avatar {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          font-weight: 600;
          position: relative;
        }

        .risk-badge-avatar {
          position: absolute;
          bottom: -4px;
          right: -4px;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          border: 2px solid white;
        }

        .risk-badge-avatar.low { background: #22c55e; color: white; }
        .risk-badge-avatar.medium { background: #f59e0b; color: white; }
        .risk-badge-avatar.high { background: #ef4444; color: white; }
        .risk-badge-avatar.critical { background: #7c2d12; color: white; }

        .profile-info h4 {
          margin: 0;
          font-size: 18px;
          color: #1f2937;
        }

        .profile-info p {
          margin: 4px 0 0;
          font-size: 13px;
          color: #6b7280;
        }

        .close-profile {
          position: absolute;
          top: 12px;
          right: 12px;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          border: none;
          background: #e5e7eb;
          color: #6b7280;
          font-size: 20px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .profile-risk-summary {
          display: flex;
          justify-content: space-around;
          padding: 20px;
          background: #f8fafc;
          border-bottom: 1px solid #e5e7eb;
        }

        .risk-score-display {
          text-align: center;
        }

        .score-value {
          display: block;
          font-size: 32px;
          font-weight: 700;
        }

        .risk-score-display.low .score-value { color: #22c55e; }
        .risk-score-display.medium .score-value { color: #f59e0b; }
        .risk-score-display.high .score-value { color: #ef4444; }
        .risk-score-display.critical .score-value { color: #7c2d12; }

        .score-label {
          font-size: 12px;
          color: #6b7280;
        }

        .risk-level-badge {
          text-align: center;
        }

        .level-indicator {
          display: inline-block;
          padding: 8px 20px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 700;
        }

        .level-indicator.low { background: #d1fae5; color: #065f46; }
        .level-indicator.medium { background: #fef3c7; color: #92400e; }
        .level-indicator.high { background: #fee2e2; color: #991b1b; }
        .level-indicator.critical { background: #7c2d12; color: white; }

        .data-source {
          display: block;
          font-size: 10px;
          color: #9ca3af;
          margin-top: 6px;
        }

        .profile-stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1px;
          background: #e5e7eb;
        }

        .stat-box {
          background: white;
          padding: 16px;
          text-align: center;
        }

        .stat-num {
          display: block;
          font-size: 18px;
          font-weight: 700;
          color: #1f2937;
        }

        .stat-num.flagged {
          color: #ef4444;
        }

        .stat-label {
          font-size: 10px;
          color: #9ca3af;
          text-transform: uppercase;
        }

        .risk-factors-list {
          padding: 16px 20px;
          background: #fef2f2;
        }

        .risk-factors-list h5 {
          margin: 0 0 12px;
          font-size: 13px;
          color: #991b1b;
        }

        .risk-factors-list ul {
          margin: 0;
          padding-left: 20px;
        }

        .risk-factors-list li {
          font-size: 12px;
          color: #7f1d1d;
          margin-bottom: 6px;
        }

        .recommendation-banner {
          padding: 16px 20px;
          margin: 16px;
          border-radius: 12px;
        }

        .recommendation-banner.low { background: #d1fae5; color: #065f46; }
        .recommendation-banner.medium { background: #fef3c7; color: #92400e; }
        .recommendation-banner.high { background: #fee2e2; color: #991b1b; }
        .recommendation-banner.critical { background: #7c2d12; color: white; }

        .recommendation-banner strong {
          font-size: 12px;
          display: block;
          margin-bottom: 6px;
        }

        .recommendation-banner p {
          margin: 0;
          font-size: 13px;
        }

        .transaction-types {
          padding: 12px 20px 20px;
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
        }

        .types-label {
          font-size: 12px;
          color: #6b7280;
        }

        .type-tag {
          padding: 4px 10px;
          background: #e5e7eb;
          border-radius: 12px;
          font-size: 11px;
          color: #374151;
          font-weight: 500;
        }

        /* Quick Pay Input Section */
        .quick-pay-input-section {
          margin-top: 20px;
          background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
          border-radius: 16px;
          padding: 20px;
          border: 2px solid #10b981;
        }

        .quick-pay-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .quick-pay-header h4 {
          margin: 0;
          color: #065f46;
          font-size: 16px;
        }

        .close-quick-pay {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          border: none;
          background: #d1fae5;
          color: #065f46;
          font-size: 20px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .quick-pay-form {
          display: flex;
          gap: 12px;
          margin-bottom: 12px;
        }

        .amount-input-wrapper {
          flex: 1;
          display: flex;
          align-items: center;
          background: white;
          border-radius: 12px;
          border: 2px solid #a7f3d0;
          padding: 0 16px;
        }

        .currency-symbol {
          font-size: 20px;
          font-weight: 600;
          color: #059669;
        }

        .quick-pay-amount-input {
          flex: 1;
          border: none;
          padding: 14px 8px;
          font-size: 18px;
          font-weight: 600;
          background: transparent;
          outline: none;
        }

        .quick-pay-amount-input::-webkit-outer-spin-button,
        .quick-pay-amount-input::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }

        .btn-quick-pay {
          padding: 14px 28px;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          border: none;
          border-radius: 12px;
          font-weight: 600;
          font-size: 15px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-quick-pay:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
        }

        .btn-quick-pay:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .quick-pay-risk-indicator {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          border-radius: 10px;
          font-size: 13px;
          font-weight: 500;
        }

        .quick-pay-risk-indicator.low {
          background: #d1fae5;
          color: #065f46;
        }

        .quick-pay-risk-indicator.medium {
          background: #fef3c7;
          color: #92400e;
        }

        .quick-pay-risk-indicator.high {
          background: #fee2e2;
          color: #991b1b;
        }

        .quick-pay-risk-indicator.critical {
          background: #7c2d12;
          color: white;
        }

        /* Success Animation */
        .success-animation-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
          animation: fadeIn 0.3s ease;
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
          .voice-container {
            margin: 0 16px;
          }

          .profile-stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .contact-chips {
            justify-content: center;
          }
        }
      `}</style>
    </div>
  )
}
