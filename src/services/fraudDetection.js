/**
 * Fraud Detection Service
 * Connects to the ML-powered fraud detection API
 */

// Use the same API base as the main backend, with /fraud suffix
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const FRAUD_API_URL = import.meta.env.VITE_FRAUD_API_URL || `${API_BASE_URL}/fraud`;

/**
 * Analyze a transaction for potential fraud
 * @param {Object} transaction - Transaction details
 * @returns {Promise<Object>} Fraud analysis result
 */
export const analyzeTransaction = async (transaction) => {
  try {
    const response = await fetch(`${FRAUD_API_URL}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sender_id: transaction.senderId || 'C0000000000',
        recipient_id: transaction.recipientId || 'C0000000000',
        amount: parseFloat(transaction.amount) || 0,
        sender_balance: parseFloat(transaction.senderBalance) || 0,
        recipient_balance: parseFloat(transaction.recipientBalance) || 0,
        transaction_type: transaction.type || 'transfer',
      }),
    });

    if (!response.ok) {
      throw new Error('Fraud detection service unavailable');
    }

    const result = await response.json();
    return {
      isFraud: result.is_fraud,
      fraudProbability: result.fraud_probability,
      riskLevel: result.risk_level,
      riskFactors: result.risk_factors || [],
      recommendation: result.recommendation,
      shouldBlock: result.should_block,
      requiresReview: result.requires_review,
    };
  } catch (error) {
    console.error('Fraud detection error:', error);
    // Return safe default if service is unavailable
    return {
      isFraud: false,
      fraudProbability: 0,
      riskLevel: 'unknown',
      riskFactors: ['Fraud detection service unavailable'],
      recommendation: 'APPROVE: Service unavailable, proceed with caution',
      shouldBlock: false,
      requiresReview: false,
      error: error.message,
    };
  }
};

/**
 * Check if the fraud detection service is available
 * @returns {Promise<boolean>}
 */
export const checkFraudServiceHealth = async () => {
  try {
    const response = await fetch(`${FRAUD_API_URL}/health`);
    const data = await response.json();
    return data.status === 'healthy' && data.model_loaded;
  } catch (error) {
    console.error('Fraud service health check failed:', error);
    return false;
  }
};

/**
 * Get fraud detection model information
 * @returns {Promise<Object>}
 */
export const getModelInfo = async () => {
  try {
    const response = await fetch(`${FRAUD_API_URL}/model/info`);
    return await response.json();
  } catch (error) {
    console.error('Failed to get model info:', error);
    return { status: 'unavailable', error: error.message };
  }
};

/**
 * Get dataset statistics from the PaySim training data
 * @returns {Promise<Object>} Dataset statistics
 */
export const getDatasetStats = async () => {
  try {
    const response = await fetch(`${FRAUD_API_URL}/dataset/stats`);
    if (!response.ok) {
      throw new Error('Failed to get dataset stats');
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to get dataset stats:', error);
    return { status: 'error', error: error.message };
  }
};

/**
 * Get fraud profile for a contact based on PaySim dataset patterns
 * @param {string} contactId - Contact identifier
 * @param {string} riskBias - Optional risk bias: 'low', 'medium', 'high', 'critical'
 * @returns {Promise<Object>} Contact fraud profile
 */
export const getContactFraudProfile = async (contactId, riskBias = null) => {
  try {
    const response = await fetch(`${FRAUD_API_URL}/contact/profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contact_id: contactId,
        risk_bias: riskBias,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to get contact profile');
    }

    const result = await response.json();
    if (result.status === 'success') {
      return result.profile;
    }
    throw new Error(result.error || 'Unknown error');
  } catch (error) {
    console.error('Failed to get contact fraud profile:', error);
    return null;
  }
};

/**
 * Get fraud profiles for multiple contacts from PaySim dataset
 * @param {Array<Object>} contacts - Array of {id, risk_bias} objects
 * @returns {Promise<Array>} Array of contact fraud profiles
 */
export const getMultipleContactProfiles = async (contacts) => {
  try {
    const response = await fetch(`${FRAUD_API_URL}/contacts/profiles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ contacts }),
    });

    if (!response.ok) {
      throw new Error('Failed to get contact profiles');
    }

    const result = await response.json();
    if (result.status === 'success') {
      return result.profiles;
    }
    throw new Error(result.error || 'Unknown error');
  } catch (error) {
    console.error('Failed to get multiple contact profiles:', error);
    return [];
  }
};

/**
 * Analyze multiple transactions in batch
 * @param {Array<Object>} transactions - Array of transaction details
 * @returns {Promise<Object>} Batch analysis result
 */
export const analyzeTransactionBatch = async (transactions) => {
  try {
    const formattedTransactions = transactions.map((t) => ({
      type: (t.type || 'TRANSFER').toUpperCase(),
      amount: parseFloat(t.amount) || 0,
      nameOrig: t.senderId || 'C0000000000',
      oldbalanceOrg: parseFloat(t.senderBalance) || 0,
      newbalanceOrig: Math.max(0, (parseFloat(t.senderBalance) || 0) - (parseFloat(t.amount) || 0)),
      nameDest: t.recipientId || 'C0000000000',
      oldbalanceDest: parseFloat(t.recipientBalance) || 0,
      newbalanceDest: (parseFloat(t.recipientBalance) || 0) + (parseFloat(t.amount) || 0),
    }));

    const response = await fetch(`${FRAUD_API_URL}/predict/batch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ transactions: formattedTransactions }),
    });

    if (!response.ok) {
      throw new Error('Batch analysis failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Batch fraud analysis error:', error);
    return {
      status: 'error',
      error: error.message,
      predictions: [],
    };
  }
};

export default {
  analyzeTransaction,
  checkFraudServiceHealth,
  getModelInfo,
  analyzeTransactionBatch,
  getDatasetStats,
  getContactFraudProfile,
  getMultipleContactProfiles,
};
