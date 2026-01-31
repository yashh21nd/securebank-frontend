import React, { useState, useEffect } from 'react'
import { io } from 'socket.io-client'

export default function NotificationCenter({ getAuthToken }) {
  const [notifications, setNotifications] = useState([])
  const [socket, setSocket] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    const token = getAuthToken?.()
    
    // Demo mode - add sample notifications
    if (!token || token.startsWith('demo-')) {
      setNotifications([
        {
          id: 1,
          type: 'payment_received',
          title: 'Payment Received',
          message: 'You received $250.00 from Prasad Gavhane',
          timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
          read: false
        },
        {
          id: 2,
          type: 'security_alert',
          title: 'Security Alert',
          message: 'Unusual login attempt blocked from unknown device',
          timestamp: new Date(Date.now() - 30 * 60000).toISOString(),
          read: false
        },
        {
          id: 3,
          type: 'payment_sent',
          title: 'Payment Sent',
          message: 'You sent $75.00 to Atharva Ghule',
          timestamp: new Date(Date.now() - 2 * 3600000).toISOString(),
          read: true
        },
        {
          id: 4,
          type: 'fraud_detected',
          title: 'Fraud Prevention',
          message: 'ML system blocked suspicious transaction attempt',
          timestamp: new Date(Date.now() - 5 * 3600000).toISOString(),
          read: true
        }
      ])
      return
    }

    // Connect to WebSocket for real notifications
    const newSocket = io('http://localhost:5000', {
      auth: { token },
      transports: ['websocket', 'polling']
    })

    newSocket.on('connect', () => {
      setIsConnected(true)
      console.log('Connected to notification service')
    })

    newSocket.on('disconnect', () => {
      setIsConnected(false)
      console.log('Disconnected from notification service')
    })

    newSocket.on('notification', (data) => {
      setNotifications(prev => [{
        id: Date.now(),
        type: data.type || 'general',
        title: data.title || 'Notification',
        message: data.message,
        timestamp: new Date().toISOString(),
        read: false
      }, ...prev])
    })

    newSocket.on('balance_update', (data) => {
      setNotifications(prev => [{
        id: Date.now(),
        type: 'balance',
        title: 'Balance Updated',
        message: `Your new balance is $${data.balance?.toFixed(2) || '0.00'}`,
        timestamp: new Date().toISOString(),
        read: false
      }, ...prev])
    })

    newSocket.on('fraud_alert', (data) => {
      setNotifications(prev => [{
        id: Date.now(),
        type: 'fraud_detected',
        title: 'Fraud Alert',
        message: data.message || 'Suspicious activity detected',
        timestamp: new Date().toISOString(),
        read: false
      }, ...prev])
    })

    setSocket(newSocket)

    return () => {
      newSocket.close()
    }
  }, [getAuthToken])

  const markAsRead = (id) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    )
  }

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const clearAll = () => {
    setNotifications([])
  }

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} min ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    return date.toLocaleDateString()
  }

  const getIcon = (type) => {
    switch (type) {
      case 'payment_received':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="19" x2="12" y2="5"/>
            <polyline points="5 12 12 5 19 12"/>
          </svg>
        )
      case 'payment_sent':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <polyline points="19 12 12 19 5 12"/>
          </svg>
        )
      case 'security_alert':
      case 'fraud_detected':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
        )
      case 'balance':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="1" x2="12" y2="23"/>
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
          </svg>
        )
      default:
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
        )
    }
  }

  const getTypeClass = (type) => {
    switch (type) {
      case 'payment_received':
        return 'type-received'
      case 'payment_sent':
        return 'type-sent'
      case 'security_alert':
      case 'fraud_detected':
        return 'type-alert'
      case 'balance':
        return 'type-balance'
      default:
        return 'type-general'
    }
  }

  const unreadCount = notifications.filter(n => !n.read).length
  const displayNotifications = showAll ? notifications : notifications.slice(0, 5)

  return (
    <div className="notification-container">
      <div className="notification-card">
        <div className="notification-header">
          <div className="header-left">
            <h2>Notifications</h2>
            {unreadCount > 0 && (
              <span className="unread-badge">{unreadCount} new</span>
            )}
          </div>
          <div className="header-right">
            <div className={`connection-status ${isConnected || getAuthToken?.()?.startsWith('demo-') ? 'connected' : 'disconnected'}`}>
              <span className="status-dot"></span>
              {isConnected ? 'Live' : (getAuthToken?.()?.startsWith('demo-') ? 'Demo' : 'Offline')}
            </div>
            {notifications.length > 0 && (
              <div className="header-actions">
                <button onClick={markAllAsRead} className="action-btn">
                  Mark all read
                </button>
                <button onClick={clearAll} className="action-btn clear">
                  Clear all
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="notification-list">
          {displayNotifications.length === 0 ? (
            <div className="empty-state">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              <p>No notifications yet</p>
              <span>You'll see transaction alerts and updates here</span>
            </div>
          ) : (
            displayNotifications.map(notification => (
              <div 
                key={notification.id} 
                className={`notification-item ${notification.read ? 'read' : 'unread'} ${getTypeClass(notification.type)}`}
                onClick={() => markAsRead(notification.id)}
              >
                <div className="notification-icon">
                  {getIcon(notification.type)}
                </div>
                <div className="notification-content">
                  <div className="notification-title">{notification.title}</div>
                  <div className="notification-message">{notification.message}</div>
                  <div className="notification-time">{formatTimestamp(notification.timestamp)}</div>
                </div>
                {!notification.read && <span className="unread-dot"></span>}
              </div>
            ))
          )}
        </div>

        {notifications.length > 5 && (
          <div className="notification-footer">
            <button onClick={() => setShowAll(!showAll)} className="show-more-btn">
              {showAll ? 'Show less' : `Show all (${notifications.length})`}
            </button>
          </div>
        )}
      </div>

      <style>{`
        .notification-container {
          max-width: 600px;
          margin: 0 auto;
        }

        .notification-card {
          background: white;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
          border: 1px solid #e5e7eb;
        }

        .notification-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px;
          background: linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%);
          border-bottom: 1px solid #d1fae5;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .header-left h2 {
          margin: 0;
          font-size: 20px;
          font-weight: 600;
          color: #1f2937;
          font-family: 'Poppins', sans-serif;
        }

        .unread-badge {
          background: #10b981;
          color: white;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .connection-status {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 12px;
          font-weight: 500;
          padding: 6px 12px;
          border-radius: 20px;
          background: #f3f4f6;
        }

        .connection-status.connected {
          background: #d1fae5;
          color: #059669;
        }

        .connection-status.disconnected {
          background: #fee2e2;
          color: #dc2626;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: currentColor;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .header-actions {
          display: flex;
          gap: 8px;
        }

        .action-btn {
          padding: 6px 12px;
          font-size: 12px;
          border: 1px solid #d1fae5;
          border-radius: 8px;
          background: white;
          color: #059669;
          cursor: pointer;
          transition: all 0.2s;
        }

        .action-btn:hover {
          background: #f0fdf4;
        }

        .action-btn.clear {
          color: #dc2626;
          border-color: #fee2e2;
        }

        .action-btn.clear:hover {
          background: #fef2f2;
        }

        .notification-list {
          max-height: 500px;
          overflow-y: auto;
        }

        .empty-state {
          padding: 60px 24px;
          text-align: center;
          color: #9ca3af;
        }

        .empty-state svg {
          margin-bottom: 16px;
          color: #d1d5db;
        }

        .empty-state p {
          margin: 0 0 4px;
          font-size: 16px;
          color: #6b7280;
        }

        .empty-state span {
          font-size: 14px;
        }

        .notification-item {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          padding: 20px 24px;
          border-bottom: 1px solid #f3f4f6;
          cursor: pointer;
          transition: all 0.2s;
          position: relative;
        }

        .notification-item:hover {
          background: #f9fafb;
        }

        .notification-item.unread {
          background: #f0fdf4;
        }

        .notification-item.unread:hover {
          background: #dcfce7;
        }

        .notification-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .type-received .notification-icon {
          background: #d1fae5;
          color: #059669;
        }

        .type-sent .notification-icon {
          background: #dbeafe;
          color: #2563eb;
        }

        .type-alert .notification-icon {
          background: #fee2e2;
          color: #dc2626;
        }

        .type-balance .notification-icon {
          background: #fef3c7;
          color: #d97706;
        }

        .type-general .notification-icon {
          background: #f3f4f6;
          color: #6b7280;
        }

        .notification-content {
          flex: 1;
          min-width: 0;
        }

        .notification-title {
          font-weight: 600;
          color: #1f2937;
          font-size: 14px;
          margin-bottom: 4px;
        }

        .notification-message {
          color: #6b7280;
          font-size: 14px;
          line-height: 1.4;
          margin-bottom: 6px;
        }

        .notification-time {
          font-size: 12px;
          color: #9ca3af;
        }

        .unread-dot {
          width: 10px;
          height: 10px;
          background: #10b981;
          border-radius: 50%;
          flex-shrink: 0;
          margin-top: 6px;
        }

        .notification-footer {
          padding: 16px 24px;
          text-align: center;
          border-top: 1px solid #f3f4f6;
        }

        .show-more-btn {
          background: none;
          border: none;
          color: #059669;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          padding: 8px 16px;
          border-radius: 8px;
          transition: all 0.2s;
        }

        .show-more-btn:hover {
          background: #f0fdf4;
        }

        @media (max-width: 480px) {
          .notification-header {
            flex-direction: column;
            gap: 16px;
            align-items: flex-start;
          }

          .header-right {
            width: 100%;
            justify-content: space-between;
          }
        }
      `}</style>
    </div>
  )
}
