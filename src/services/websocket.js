/**
 * WebSocket Service for Real-time Communication
 */

class WebSocketService {
  constructor() {
    this.socket = null;
    this.userId = null;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 3000;
  }

  connect(userId) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return;
    }

    this.userId = userId;

    // Connect to Socket.IO
    // For Socket.IO, we'll use the socket.io-client library
    // For now, we'll simulate with native WebSocket for demo
    try {
      // Using Socket.IO client
      if (typeof io !== 'undefined') {
        this.socket = io('http://localhost:5000', {
          transports: ['websocket', 'polling'],
        });

        this.socket.on('connect', () => {
          console.log('WebSocket connected');
          this.reconnectAttempts = 0;
          
          // Register user for notifications
          this.socket.emit('register_user', { user_id: userId });
          
          // Emit connected event to listeners
          this.emit('connected', { userId });
        });

        this.socket.on('disconnect', () => {
          console.log('WebSocket disconnected');
          this.emit('disconnected', {});
        });

        // Listen for notifications
        this.socket.on('notification', (data) => {
          console.log('Notification received:', data);
          this.emit('notification', data);
        });

        // Payment events
        this.socket.on('payment_received', (data) => {
          console.log('Payment received:', data);
          this.emit('payment_received', data);
        });

        this.socket.on('payment_sent', (data) => {
          console.log('Payment sent:', data);
          this.emit('payment_sent', data);
        });

        // Balance updates
        this.socket.on('balance_update', (data) => {
          console.log('Balance updated:', data);
          this.emit('balance_update', data);
        });

        // Fraud alerts
        this.socket.on('fraud_alert', (data) => {
          console.log('Fraud alert:', data);
          this.emit('fraud_alert', data);
        });

        // Money request
        this.socket.on('money_request', (data) => {
          console.log('Money request:', data);
          this.emit('money_request', data);
        });

        // Transaction updates
        this.socket.on('transaction_update', (data) => {
          console.log('Transaction update:', data);
          this.emit('transaction_update', data);
        });

      } else {
        console.log('Socket.IO not available, using simulation mode');
        this.simulateConnection();
      }
    } catch (error) {
      console.error('WebSocket connection error:', error);
      this.simulateConnection();
    }
  }

  simulateConnection() {
    // Simulation mode for development without backend
    console.log('Running WebSocket in simulation mode');
    this.emit('connected', { userId: this.userId, simulated: true });
  }

  disconnect() {
    if (this.socket) {
      if (this.userId) {
        this.socket.emit('unregister_user', { user_id: this.userId });
      }
      this.socket.disconnect();
      this.socket = null;
    }
    this.userId = null;
  }

  // Subscribe to balance updates
  subscribeToBalance(accountId) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('subscribe_balance', { account_id: accountId });
    }
  }

  // Subscribe to transaction updates
  subscribeToTransactions(userId) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('subscribe_transactions', { user_id: userId });
    }
  }

  // Event listener management
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);

    // Return unsubscribe function
    return () => {
      const listeners = this.listeners.get(event);
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      const listeners = this.listeners.get(event);
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in ${event} listener:`, error);
        }
      });
    }
  }

  // Simulate receiving a payment (for demo/testing)
  simulatePaymentReceived(data) {
    const notification = {
      type: 'payment_received',
      title: '💰 Payment Received!',
      message: `You received ₹${data.amount} from ${data.senderName}`,
      data: {
        transaction_id: data.transactionId || 'TXN' + Date.now(),
        amount: data.amount,
        sender_name: data.senderName,
        timestamp: new Date().toISOString()
      },
      show_popup: true,
      sound: 'payment_received'
    };

    this.emit('notification', notification);
    this.emit('payment_received', notification);
  }

  // Simulate balance update (for demo/testing)
  simulateBalanceUpdate(accountId, previousBalance, currentBalance) {
    const update = {
      type: 'balance_update',
      account_id: accountId,
      previous_balance: previousBalance,
      current_balance: currentBalance,
      change: currentBalance - previousBalance,
      change_type: currentBalance > previousBalance ? 'credit' : 'debit'
    };

    this.emit('balance_update', update);
  }
}

// Singleton instance
const wsService = new WebSocketService();

export default wsService;
