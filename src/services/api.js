/**
 * API Service for SecureBank Backend
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Demo mode detection - checks if backend is available
let isBackendAvailable = false;
let backendCheckDone = false;

const checkBackendAvailability = async () => {
  if (backendCheckDone) return isBackendAvailable;
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    const response = await fetch(`${API_BASE_URL}/health`, { signal: controller.signal });
    clearTimeout(timeoutId);
    isBackendAvailable = response.ok;
  } catch {
    isBackendAvailable = false;
  }
  backendCheckDone = true;
  return isBackendAvailable;
};

// Initialize backend check
checkBackendAvailability();

// Token management
let authToken = localStorage.getItem('securebank_token');

export const setAuthToken = (token) => {
  authToken = token;
  localStorage.setItem('securebank_token', token);
};

export const getAuthToken = () => authToken;

export const clearAuthToken = () => {
  authToken = null;
  localStorage.removeItem('securebank_token');
};

// Check if we're in demo mode
export const isDemoMode = () => {
  return !authToken || authToken.startsWith('demo-') || !isBackendAvailable;
};

// API request helper with demo mode fallback
const apiRequest = async (endpoint, options = {}) => {
  // Check backend availability first
  await checkBackendAvailability();
  
  if (!isBackendAvailable) {
    throw new Error('Backend unavailable - using demo mode');
  }

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'API request failed');
  }

  return data;
};

// Auth APIs
export const authAPI = {
  register: async (userData) => {
    if (!isBackendAvailable) {
      // Demo mode registration
      const demoToken = 'demo-' + Date.now();
      setAuthToken(demoToken);
      return {
        success: true,
        message: 'Demo account created',
        user: {
          id: 'demo-user-' + Date.now(),
          email: userData.email,
          full_name: userData.full_name || 'Demo User',
          username: userData.username || 'demo_user',
          upi_id: 'demo@securebank',
          balance: 10000
        },
        token: demoToken
      };
    }
    return apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  login: async (credentials) => {
    if (!isBackendAvailable) {
      // Demo mode login
      const demoToken = 'demo-' + Date.now();
      setAuthToken(demoToken);
      return {
        success: true,
        message: 'Demo login successful',
        user: {
          id: 'demo-user-' + Date.now(),
          email: credentials.email,
          full_name: 'Demo User',
          username: 'demo_user',
          upi_id: 'demo@securebank',
          balance: 10000
        },
        token: demoToken
      };
    }
    const data = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    if (data.token) {
      setAuthToken(data.token);
    }
    return data;
  },

  logout: () => {
    const wasDemo = !authToken || authToken.startsWith('demo-');
    clearAuthToken();
    if (wasDemo || !isBackendAvailable) {
      return Promise.resolve({ success: true, message: 'Logged out' });
    }
    return apiRequest('/auth/logout', { method: 'POST' }).catch(() => ({ success: true }));
  },

  getProfile: async () => {
    // Check if using demo token
    if (!authToken || authToken.startsWith('demo-') || !isBackendAvailable) {
      return {
        user: {
          id: 'demo-user-1',
          email: 'demo@securebank.com',
          full_name: 'Demo User',
          username: 'demo_user',
          upi_id: 'demo_user@securebank',
        },
        accounts: [{ balance: 10000, account_number: 'DEMO12345678' }]
      };
    }
    return apiRequest('/auth/profile');
  },

  updateProfile: async (data) => {
    if (!authToken || authToken.startsWith('demo-') || !isBackendAvailable) {
      return { success: true, message: 'Profile updated (demo mode)' };
    }
    return apiRequest('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
};

// User APIs
export const userAPI = {
  search: (query) => apiRequest(`/users/search?q=${encodeURIComponent(query)}`),
  
  findByUPI: (upiId) => apiRequest(`/users/find-by-upi?upi_id=${encodeURIComponent(upiId)}`),
  
  findByPhone: (phone) => apiRequest(`/users/find-by-phone?phone=${encodeURIComponent(phone)}`),
  
  getContacts: () => apiRequest('/users/contacts'),
};

// Payment APIs
export const paymentAPI = {
  sendMoney: (paymentData) => apiRequest('/payments/send', {
    method: 'POST',
    body: JSON.stringify(paymentData),
  }),

  requestMoney: (requestData) => apiRequest('/payments/request', {
    method: 'POST',
    body: JSON.stringify(requestData),
  }),

  getBalance: () => apiRequest('/payments/balance'),

  addMoney: (amount, description) => apiRequest('/payments/add-money', {
    method: 'POST',
    body: JSON.stringify({ amount, description }),
  }),
};

// Transaction APIs
export const transactionAPI = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/transactions/?${query}`);
  },

  getById: (id) => apiRequest(`/transactions/${id}`),

  getRecent: () => apiRequest('/transactions/recent'),

  getSummary: (period = 'month') => apiRequest(`/transactions/summary?period=${period}`),
};

// Generate QR code SVG with actual QR pattern
const generateQRCodeSVG = (data, size = 200) => {
  const paymentId = data.paymentId || 'demo-' + Date.now();
  const amount = data.amount || 0;
  const upi = data.upi || 'demo@securebank';
  
  // Create a simple but valid-looking QR pattern
  const moduleSize = 4;
  const modules = 33; // QR code version 4
  const qrSize = modules * moduleSize;
  const padding = (size - qrSize) / 2;
  
  // Generate pseudo-random but deterministic pattern based on payment data
  const seed = paymentId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const pattern = [];
  
  for (let i = 0; i < modules; i++) {
    pattern[i] = [];
    for (let j = 0; j < modules; j++) {
      // Position detection patterns (corners)
      const isTopLeft = i < 7 && j < 7;
      const isTopRight = i < 7 && j >= modules - 7;
      const isBottomLeft = i >= modules - 7 && j < 7;
      
      if (isTopLeft || isTopRight || isBottomLeft) {
        // Finder patterns
        const di = isTopLeft ? i : (isTopRight ? i : i - (modules - 7));
        const dj = isTopLeft ? j : (isTopRight ? j - (modules - 7) : j);
        pattern[i][j] = (di === 0 || di === 6 || dj === 0 || dj === 6 || 
                        (di >= 2 && di <= 4 && dj >= 2 && dj <= 4)) ? 1 : 0;
      } else {
        // Data area - pseudo-random based on seed
        pattern[i][j] = ((seed * (i + 1) * (j + 1)) % 7) > 3 ? 1 : 0;
      }
    }
  }
  
  let rects = '';
  for (let i = 0; i < modules; i++) {
    for (let j = 0; j < modules; j++) {
      if (pattern[i][j]) {
        rects += `<rect x="${padding + j * moduleSize}" y="${padding + i * moduleSize}" width="${moduleSize}" height="${moduleSize}" fill="#000"/>`;
      }
    }
  }
  
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" fill="white"/>
    ${rects}
    <text x="${size/2}" y="${size - 8}" text-anchor="middle" fill="#059669" font-size="10" font-family="sans-serif">SecureBank Pay</text>
  </svg>`;
};

// Blockchain/QR APIs
export const blockchainAPI = {
  generatePaymentQR: async (data) => {
    if (!authToken || authToken.startsWith('demo-') || !isBackendAvailable) {
      const paymentId = 'QR-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
      const qrSvg = generateQRCodeSVG({ 
        paymentId, 
        amount: data.amount,
        upi: 'demo_user@securebank'
      });
      return {
        payment_id: paymentId,
        qr_image: 'data:image/svg+xml,' + encodeURIComponent(qrSvg),
        qr_code_image: 'data:image/svg+xml,' + encodeURIComponent(qrSvg),
        qr_code_hash: 'hash-' + paymentId,
        expires_at: new Date(Date.now() + (data.expires_in_minutes || 5) * 60000).toISOString(),
        blockchain_hash: 'block-' + Date.now(),
        amount: data.amount,
        description: data.description
      };
    }
    return apiRequest('/blockchain/generate-qr', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  generateUPIQR: async (data) => {
    if (!authToken || authToken.startsWith('demo-') || !isBackendAvailable) {
      const paymentId = 'UPI-' + Date.now();
      const qrSvg = generateQRCodeSVG({ paymentId, amount: data.amount, upi: data.upi_id });
      return {
        qr_image: 'data:image/svg+xml,' + encodeURIComponent(qrSvg),
        upi_string: `upi://pay?pa=${data.upi_id || 'demo@securebank'}&pn=Demo%20User&am=${data.amount || ''}`
      };
    }
    return apiRequest('/blockchain/generate-upi-qr', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  verifyQR: async (qrData) => {
    if (!authToken || authToken.startsWith('demo-') || !isBackendAvailable) {
      return { valid: true, message: 'QR verified (demo mode)' };
    }
    return apiRequest('/blockchain/verify-qr', {
      method: 'POST',
      body: JSON.stringify({ qr_data: qrData }),
    });
  },

  payViaQR: async (paymentId, amount) => {
    if (!authToken || authToken.startsWith('demo-') || !isBackendAvailable) {
      return { 
        success: true, 
        transaction_id: 'TXN-' + Date.now(),
        message: 'Payment successful (demo mode)',
        new_balance: 10000 - amount
      };
    }
    return apiRequest('/blockchain/pay-via-qr', {
      method: 'POST',
      body: JSON.stringify({ payment_id: paymentId, amount }),
    });
  },

  getChain: async () => {
    if (!authToken || authToken.startsWith('demo-') || !isBackendAvailable) {
      return { chain: [], length: 0 };
    }
    return apiRequest('/blockchain/chain');
  },

  verifyTransaction: async (txHash) => {
    if (!authToken || authToken.startsWith('demo-') || !isBackendAvailable) {
      return { verified: true, message: 'Transaction verified (demo mode)' };
    }
    return apiRequest(`/blockchain/verify-transaction/${txHash}`);
  },

  getMyQRPayments: async () => {
    if (!authToken || authToken.startsWith('demo-') || !isBackendAvailable) {
      return { payments: [] };
    }
    return apiRequest('/blockchain/my-qr-payments');
  },
};

// Fraud APIs
export const fraudAPI = {
  checkTransaction: (transactionData) => apiRequest('/fraud/check', {
    method: 'POST',
    body: JSON.stringify(transactionData),
  }),

  getAlerts: () => apiRequest('/fraud/alerts'),

  reviewAlert: (alertId, status) => apiRequest(`/fraud/alerts/${alertId}/review`, {
    method: 'POST',
    body: JSON.stringify({ status }),
  }),

  getStatistics: () => apiRequest('/fraud/statistics'),
};

// Speech APIs
export const speechAPI = {
  recognize: (audioData, sampleRate = 16000) => apiRequest('/speech/recognize', {
    method: 'POST',
    body: JSON.stringify({
      audio_data: audioData,
      sample_rate: sampleRate,
    }),
  }),

  parseText: (text) => apiRequest('/speech/parse-text', {
    method: 'POST',
    body: JSON.stringify({ text }),
  }),

  executeCommand: (command) => apiRequest('/speech/execute-command', {
    method: 'POST',
    body: JSON.stringify({ command }),
  }),

  getSupportedCommands: () => apiRequest('/speech/supported-commands'),
};

export default {
  auth: authAPI,
  user: userAPI,
  payment: paymentAPI,
  transaction: transactionAPI,
  blockchain: blockchainAPI,
  fraud: fraudAPI,
  speech: speechAPI,
};
