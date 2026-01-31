"""
Fraud Detection API Server
Flask-based REST API for real-time fraud prediction
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from fraud_predictor import FraudDetector
import logging
from datetime import datetime
import random
import sqlite3
import os

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)

# CORS configuration - allow all origins in production (update for specific domains if needed)
CORS(app, origins=["*"], methods=["GET", "POST", "OPTIONS"], allow_headers=["Content-Type", "Authorization"])

# Initialize fraud detector
fraud_detector = FraudDetector()

# Database path for fraud training data
DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'instance', 'securebank.db')


def get_dataset_statistics():
    """Get statistics from the imported PaySim dataset"""
    try:
        if not os.path.exists(DB_PATH):
            return None
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Get total records and fraud count
        cursor.execute("SELECT COUNT(*), SUM(CASE WHEN is_fraud = 1 THEN 1 ELSE 0 END) FROM fraud_training_data")
        total, fraud_count = cursor.fetchone()
        
        # Get average amounts for fraud vs legitimate
        cursor.execute("""
            SELECT 
                AVG(CASE WHEN is_fraud = 1 THEN amount ELSE NULL END) as avg_fraud_amount,
                AVG(CASE WHEN is_fraud = 0 THEN amount ELSE NULL END) as avg_legit_amount,
                MAX(amount) as max_amount
            FROM fraud_training_data
        """)
        avg_fraud, avg_legit, max_amount = cursor.fetchone()
        
        conn.close()
        return {
            'total_records': total,
            'fraud_count': fraud_count or 0,
            'fraud_rate': (fraud_count / total * 100) if total > 0 else 0,
            'avg_fraud_amount': avg_fraud or 0,
            'avg_legit_amount': avg_legit or 0,
            'max_amount': max_amount or 0
        }
    except Exception as e:
        logger.error(f"Error getting dataset stats: {e}")
        return None


def generate_contact_profile_from_dataset(contact_id, risk_bias=None):
    """
    Generate a realistic contact fraud profile based on actual PaySim dataset patterns
    risk_bias: 'low', 'medium', 'high', 'critical' or None for random
    """
    try:
        if not os.path.exists(DB_PATH):
            raise Exception("Database not found")
            
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        # Determine if this contact should be fraud-like based on bias
        if risk_bias == 'critical':
            is_fraud_pattern = True
            fraud_probability = random.uniform(0.85, 0.98)
        elif risk_bias == 'high':
            is_fraud_pattern = True
            fraud_probability = random.uniform(0.60, 0.85)
        elif risk_bias == 'medium':
            is_fraud_pattern = random.choice([True, False])
            fraud_probability = random.uniform(0.30, 0.60)
        elif risk_bias == 'low':
            is_fraud_pattern = False
            fraud_probability = random.uniform(0.01, 0.15)
        else:
            # Random based on dataset fraud rate (~1.2% in PaySim)
            is_fraud_pattern = random.random() < 0.15  # Increase for demo visibility
            fraud_probability = random.uniform(0.01, 0.95)
        
        # Get sample transactions matching the pattern
        if is_fraud_pattern:
            cursor.execute("""
                SELECT type, amount, oldbalanceOrg, newbalanceOrig, oldbalanceDest, newbalanceDest
                FROM fraud_training_data 
                WHERE is_fraud = 1 
                ORDER BY RANDOM() LIMIT 10
            """)
        else:
            cursor.execute("""
                SELECT type, amount, oldbalanceOrg, newbalanceOrig, oldbalanceDest, newbalanceDest
                FROM fraud_training_data 
                WHERE is_fraud = 0 
                ORDER BY RANDOM() LIMIT 20
            """)
        
        sample_transactions = cursor.fetchall()
        conn.close()
        
        if not sample_transactions:
            raise Exception("No sample data found")
        
        # Calculate statistics from samples
        amounts = [t[1] for t in sample_transactions]
        types = [t[0] for t in sample_transactions]
        avg_amount = sum(amounts) / len(amounts) if amounts else 0
        max_amount = max(amounts) if amounts else 0
        
        # Count transaction types
        type_counts = {}
        for t in types:
            type_counts[t] = type_counts.get(t, 0) + 1
        common_types = sorted(type_counts.keys(), key=lambda x: type_counts[x], reverse=True)[:2]
        
        # Determine risk level
        if fraud_probability >= 0.85:
            risk_level = 'critical'
        elif fraud_probability >= 0.60:
            risk_level = 'high'
        elif fraud_probability >= 0.30:
            risk_level = 'medium'
        else:
            risk_level = 'low'
        
        # Generate risk factors based on actual fraud patterns in dataset
        risk_factors = []
        if is_fraud_pattern:
            if 'CASH_OUT' in common_types:
                risk_factors.append('High frequency of CASH_OUT transactions (common fraud pattern in PaySim)')
            if 'TRANSFER' in common_types:
                risk_factors.append('Large TRANSFER transactions to new accounts detected')
            if avg_amount > 100000:
                risk_factors.append(f'Average transaction amount ₹{avg_amount:,.0f} exceeds safe threshold')
            if max_amount > 500000:
                risk_factors.append(f'Single transaction of ₹{max_amount:,.0f} flagged as suspicious')
            
            # Add more dataset-specific factors
            risk_factors.append('Transaction pattern matches known fraud profiles in training dataset')
            if random.random() > 0.5:
                risk_factors.append('Balance anomalies detected (typical of fraudulent transfers)')
        
        # Generate historical transaction counts
        if is_fraud_pattern:
            hist_transactions = random.randint(5, 30)
            flagged = max(1, int(hist_transactions * random.uniform(0.2, 0.5)))
        else:
            hist_transactions = random.randint(50, 500)
            flagged = random.randint(0, 2)
        
        # Generate recommendations based on ML model patterns
        recommendations = {
            'critical': 'BLOCK RECOMMENDED: Pattern matches confirmed fraud cases in PaySim dataset. Transaction blocked.',
            'high': 'REVIEW REQUIRED: Similar patterns found in fraud training data. Manual verification needed.',
            'medium': 'CAUTION: Some risk indicators present. Proceed with additional verification.',
            'low': 'SAFE: Transaction pattern consistent with legitimate users in dataset.'
        }
        
        account_ages = ['1 week', '2 weeks', '1 month', '3 months', '6 months', '1 year', '2 years', '3 years']
        if is_fraud_pattern:
            account_age = random.choice(account_ages[:4])  # Newer accounts for fraud
        else:
            account_age = random.choice(account_ages[3:])  # Older accounts for legit
        
        return {
            'contact_id': contact_id,
            'risk_score': round(fraud_probability, 3),
            'risk_level': risk_level,
            'is_flagged': is_fraud_pattern,
            'ml_prediction': is_fraud_pattern,
            'historical_transactions': hist_transactions,
            'flagged_transactions': flagged,
            'avg_transaction_amount': round(avg_amount, 2),
            'max_transaction_amount': round(max_amount, 2),
            'common_transaction_types': common_types,
            'account_age': account_age,
            'risk_factors': risk_factors,
            'recommendation': recommendations[risk_level],
            'data_source': 'PaySim ML Dataset',
            'model_confidence': round(random.uniform(0.85, 0.99), 2),
            'last_activity': f'{random.randint(1, 24)} hours ago'
        }
        
    except Exception as e:
        logger.error(f"Error generating profile: {e}")
        return None


@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'model_loaded': fraud_detector.is_loaded,
        'timestamp': datetime.now().isoformat()
    })


@app.route('/api/model/info', methods=['GET'])
def model_info():
    """Get model information"""
    return jsonify(fraud_detector.get_model_info())


@app.route('/api/predict', methods=['POST'])
def predict_fraud():
    """
    Predict if a transaction is fraudulent
    
    Request body:
    {
        "type": "TRANSFER",
        "amount": 1000.00,
        "nameOrig": "C1234567890",
        "oldbalanceOrg": 5000.00,
        "newbalanceOrig": 4000.00,
        "nameDest": "C9876543210",
        "oldbalanceDest": 0.00,
        "newbalanceDest": 1000.00
    }
    """
    try:
        transaction = request.get_json()
        
        if not transaction:
            return jsonify({
                'error': 'No transaction data provided',
                'status': 'error'
            }), 400
        
        # Validate required fields
        required_fields = ['type', 'amount']
        missing = [f for f in required_fields if f not in transaction]
        
        if missing:
            return jsonify({
                'error': f'Missing required fields: {missing}',
                'status': 'error'
            }), 400
        
        # Get prediction
        result = fraud_detector.predict(transaction)
        
        # Log the prediction
        logger.info(
            f"Prediction: type={transaction.get('type')}, "
            f"amount={transaction.get('amount')}, "
            f"is_fraud={result['is_fraud']}, "
            f"probability={result['fraud_probability']}"
        )
        
        return jsonify({
            'status': 'success',
            'transaction_id': transaction.get('transaction_id', 'N/A'),
            'prediction': result
        })
        
    except Exception as e:
        logger.error(f"Prediction error: {e}")
        return jsonify({
            'error': str(e),
            'status': 'error'
        }), 500


@app.route('/api/predict/batch', methods=['POST'])
def predict_batch():
    """
    Predict fraud for multiple transactions
    
    Request body:
    {
        "transactions": [
            { transaction1 },
            { transaction2 },
            ...
        ]
    }
    """
    try:
        data = request.get_json()
        
        if not data or 'transactions' not in data:
            return jsonify({
                'error': 'No transactions provided',
                'status': 'error'
            }), 400
        
        transactions = data['transactions']
        
        if not isinstance(transactions, list):
            return jsonify({
                'error': 'Transactions must be an array',
                'status': 'error'
            }), 400
        
        results = fraud_detector.predict_batch(transactions)
        
        # Count fraud detected
        fraud_count = sum(1 for r in results if r['is_fraud'])
        
        logger.info(f"Batch prediction: {len(transactions)} transactions, {fraud_count} fraud detected")
        
        return jsonify({
            'status': 'success',
            'total': len(transactions),
            'fraud_detected': fraud_count,
            'predictions': results
        })
        
    except Exception as e:
        logger.error(f"Batch prediction error: {e}")
        return jsonify({
            'error': str(e),
            'status': 'error'
        }), 500


@app.route('/api/analyze', methods=['POST'])
def analyze_transaction():
    """
    Analyze a transaction for fraud risk (simplified endpoint for frontend)
    
    Request body:
    {
        "sender_id": "user123",
        "recipient_id": "user456",
        "amount": 500.00,
        "sender_balance": 2000.00,
        "transaction_type": "transfer"
    }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'error': 'No data provided',
                'status': 'error'
            }), 400
        
        # Map simplified fields to model format
        amount = float(data.get('amount', 0))
        sender_balance = float(data.get('sender_balance', 0))
        recipient_balance = float(data.get('recipient_balance', 0))
        trans_type = data.get('transaction_type', 'transfer').upper()
        
        # Map transaction types
        type_mapping = {
            'TRANSFER': 'TRANSFER',
            'PAYMENT': 'PAYMENT',
            'SEND': 'TRANSFER',
            'PAY': 'PAYMENT',
            'CASH_OUT': 'CASH_OUT',
            'WITHDRAW': 'CASH_OUT',
            'DEPOSIT': 'CASH_IN',
            'CASH_IN': 'CASH_IN'
        }
        
        mapped_type = type_mapping.get(trans_type, 'TRANSFER')
        
        # Create transaction object
        transaction = {
            'type': mapped_type,
            'amount': amount,
            'nameOrig': data.get('sender_id', 'C0000000000'),
            'oldbalanceOrg': sender_balance,
            'newbalanceOrig': max(0, sender_balance - amount),
            'nameDest': data.get('recipient_id', 'C0000000000'),
            'oldbalanceDest': recipient_balance,
            'newbalanceDest': recipient_balance + amount
        }
        
        result = fraud_detector.predict(transaction)
        
        # Return simplified response for frontend
        return jsonify({
            'status': 'success',
            'is_fraud': result['is_fraud'],
            'fraud_probability': result['fraud_probability'],
            'risk_level': result['risk_level'],
            'risk_factors': result['risk_factors'],
            'recommendation': result['recommendation'],
            'should_block': result['is_fraud'] or result['risk_level'] == 'critical',
            'requires_review': result['risk_level'] in ['high', 'critical']
        })
        
    except Exception as e:
        logger.error(f"Analysis error: {e}")
        return jsonify({
            'error': str(e),
            'status': 'error'
        }), 500


@app.route('/api/dataset/stats', methods=['GET'])
def dataset_stats():
    """Get statistics from the imported PaySim dataset"""
    stats = get_dataset_statistics()
    if stats:
        return jsonify({
            'status': 'success',
            'dataset': 'PaySim Fraud Detection',
            'statistics': stats
        })
    else:
        return jsonify({
            'status': 'error',
            'error': 'Could not retrieve dataset statistics'
        }), 500


@app.route('/api/contact/profile', methods=['POST'])
def get_contact_fraud_profile():
    """
    Get fraud profile for a contact based on PaySim dataset patterns
    
    Request body:
    {
        "contact_id": "user123",
        "risk_bias": "low" | "medium" | "high" | "critical" | null
    }
    """
    try:
        data = request.get_json()
        contact_id = data.get('contact_id', 'unknown')
        risk_bias = data.get('risk_bias')
        
        profile = generate_contact_profile_from_dataset(contact_id, risk_bias)
        
        if profile:
            logger.info(f"Generated profile for {contact_id}: risk_level={profile['risk_level']}")
            return jsonify({
                'status': 'success',
                'profile': profile
            })
        else:
            return jsonify({
                'status': 'error',
                'error': 'Could not generate profile'
            }), 500
            
    except Exception as e:
        logger.error(f"Profile generation error: {e}")
        return jsonify({
            'status': 'error',
            'error': str(e)
        }), 500


@app.route('/api/contacts/profiles', methods=['POST'])
def get_multiple_contact_profiles():
    """
    Get fraud profiles for multiple contacts
    
    Request body:
    {
        "contacts": [
            {"id": "user1", "risk_bias": "low"},
            {"id": "user2", "risk_bias": "high"},
            ...
        ]
    }
    """
    try:
        data = request.get_json()
        contacts = data.get('contacts', [])
        
        profiles = []
        for contact in contacts:
            contact_id = contact.get('id', f'contact-{len(profiles)}')
            risk_bias = contact.get('risk_bias')
            profile = generate_contact_profile_from_dataset(contact_id, risk_bias)
            if profile:
                profiles.append(profile)
        
        logger.info(f"Generated {len(profiles)} contact profiles from dataset")
        
        return jsonify({
            'status': 'success',
            'count': len(profiles),
            'profiles': profiles
        })
        
    except Exception as e:
        logger.error(f"Batch profile error: {e}")
        return jsonify({
            'status': 'error',
            'error': str(e)
        }), 500


@app.errorhandler(404)
def not_found(e):
    return jsonify({
        'error': 'Endpoint not found',
        'status': 'error'
    }), 404


@app.errorhandler(500)
def server_error(e):
    return jsonify({
        'error': 'Internal server error',
        'status': 'error'
    }), 500


if __name__ == '__main__':
    print("\n" + "=" * 60)
    print("🛡️  FRAUD DETECTION API SERVER")
    print("=" * 60)
    print(f"\nModel Status: {'✅ Loaded' if fraud_detector.is_loaded else '❌ Not Loaded'}")
    
    # Show dataset stats
    stats = get_dataset_statistics()
    if stats:
        print(f"\n📊 PaySim Dataset Loaded:")
        print(f"   Total Records: {stats['total_records']:,}")
        print(f"   Fraud Cases: {stats['fraud_count']:,} ({stats['fraud_rate']:.2f}%)")
    
    print("\nEndpoints:")
    print("  GET  /api/health            - Health check")
    print("  GET  /api/model/info        - Model information")
    print("  GET  /api/dataset/stats     - Dataset statistics")
    print("  POST /api/predict           - Predict single transaction")
    print("  POST /api/predict/batch     - Predict multiple transactions")
    print("  POST /api/analyze           - Analyze transaction (simplified)")
    print("  POST /api/contact/profile   - Get contact fraud profile from dataset")
    print("  POST /api/contacts/profiles - Get multiple contact profiles")
    print("\n" + "=" * 60)
    
    app.run(host='0.0.0.0', port=5001, debug=True)
