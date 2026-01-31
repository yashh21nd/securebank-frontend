"""
Fraud Detection Prediction Service
Use this module for real-time fraud prediction
"""

import numpy as np
import pandas as pd
import joblib
import os
from typing import Dict, Union, List, Optional

# Get the directory where this script is located
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))


class FraudDetector:
    """Real-time fraud detection using trained ML model"""
    
    def __init__(self, model_dir: Optional[str] = None):
        """
        Initialize the fraud detector by loading trained model and preprocessors
        
        Args:
            model_dir: Directory containing model files. Defaults to script directory.
        """
        self.model_dir = model_dir or SCRIPT_DIR
        self.model = None
        self.scaler = None
        self.label_encoder = None
        self.feature_columns = None
        self.is_loaded = False
        
        self._load_model()
    
    def _load_model(self):
        """Load the trained model and preprocessing objects"""
        try:
            model_path = os.path.join(self.model_dir, 'fraud_detection_model.joblib')
            scaler_path = os.path.join(self.model_dir, 'scaler.joblib')
            encoder_path = os.path.join(self.model_dir, 'label_encoder.joblib')
            features_path = os.path.join(self.model_dir, 'feature_columns.joblib')
            
            self.model = joblib.load(model_path)
            self.scaler = joblib.load(scaler_path)
            self.label_encoder = joblib.load(encoder_path)
            self.feature_columns = joblib.load(features_path)
            self.is_loaded = True
            
            print(f"✅ Fraud detection model loaded successfully")
            print(f"   Model type: {type(self.model).__name__}")
            print(f"   Features: {len(self.feature_columns)}")
            
        except FileNotFoundError as e:
            print(f"⚠️  Model files not found. Please run train_fraud_model.py first.")
            print(f"   Missing: {e.filename}")
            self.is_loaded = False
        except Exception as e:
            print(f"❌ Error loading model: {e}")
            self.is_loaded = False
    
    def _engineer_features(self, transaction: Dict) -> pd.DataFrame:
        """
        Apply the same feature engineering as training
        
        Args:
            transaction: Dictionary containing transaction details
            
        Returns:
            DataFrame with engineered features
        """
        # Extract basic fields with defaults
        step = transaction.get('step', 1)
        trans_type = transaction.get('type', 'TRANSFER')
        amount = float(transaction.get('amount', 0))
        name_orig = transaction.get('nameOrig', 'C0000000000')
        old_balance_org = float(transaction.get('oldbalanceOrg', 0))
        new_balance_orig = float(transaction.get('newbalanceOrig', 0))
        name_dest = transaction.get('nameDest', 'C0000000000')
        old_balance_dest = float(transaction.get('oldbalanceDest', 0))
        new_balance_dest = float(transaction.get('newbalanceDest', 0))
        
        # Encode transaction type
        try:
            type_encoded = self.label_encoder.transform([trans_type])[0]
        except ValueError:
            # Unknown type, use most common (PAYMENT = 0 typically)
            type_encoded = 0
        
        # Engineer features (same as training)
        orig_balance_diff = old_balance_org - new_balance_orig
        dest_balance_diff = new_balance_dest - old_balance_dest
        orig_balance_error = orig_balance_diff - amount
        dest_balance_error = dest_balance_diff - amount
        amount_to_orig_balance = amount / (old_balance_org + 1)
        amount_to_dest_balance = amount / (old_balance_dest + 1)
        orig_zero_balance = 1 if old_balance_org == 0 else 0
        dest_zero_balance = 1 if old_balance_dest == 0 else 0
        new_orig_zero_balance = 1 if new_balance_orig == 0 else 0
        complete_transfer = 1 if (old_balance_org > 0 and new_balance_orig == 0) else 0
        is_merchant = 1 if name_dest.startswith('M') else 0
        is_large_transaction = 1 if amount > 200000 else 0  # 95th percentile threshold
        hour_of_day = step % 24
        day_of_month = (step // 24) % 30
        
        # Create feature dictionary
        features = {
            'step': step,
            'amount': amount,
            'oldbalanceOrg': old_balance_org,
            'newbalanceOrig': new_balance_orig,
            'oldbalanceDest': old_balance_dest,
            'newbalanceDest': new_balance_dest,
            'typeEncoded': type_encoded,
            'origBalanceDiff': orig_balance_diff,
            'destBalanceDiff': dest_balance_diff,
            'origBalanceError': orig_balance_error,
            'destBalanceError': dest_balance_error,
            'amountToOrigBalance': amount_to_orig_balance,
            'amountToDestBalance': amount_to_dest_balance,
            'origZeroBalance': orig_zero_balance,
            'destZeroBalance': dest_zero_balance,
            'newOrigZeroBalance': new_orig_zero_balance,
            'completeTransfer': complete_transfer,
            'isMerchant': is_merchant,
            'isLargeTransaction': is_large_transaction,
            'hourOfDay': hour_of_day,
            'dayOfMonth': day_of_month
        }
        
        return pd.DataFrame([features])[self.feature_columns]
    
    def predict(self, transaction: Dict) -> Dict:
        """
        Predict if a transaction is fraudulent
        
        Args:
            transaction: Dictionary containing:
                - type: str ('TRANSFER', 'CASH_OUT', 'PAYMENT', 'DEBIT', 'CASH_IN')
                - amount: float
                - nameOrig: str (sender ID)
                - oldbalanceOrg: float (sender's balance before)
                - newbalanceOrig: float (sender's balance after)
                - nameDest: str (recipient ID)
                - oldbalanceDest: float (recipient's balance before)
                - newbalanceDest: float (recipient's balance after)
                - step: int (optional, time step)
                
        Returns:
            Dictionary with:
                - is_fraud: bool
                - fraud_probability: float (0-1)
                - risk_level: str ('low', 'medium', 'high', 'critical')
                - risk_factors: list of contributing factors
        """
        if not self.is_loaded:
            return {
                'is_fraud': False,
                'fraud_probability': 0.0,
                'risk_level': 'unknown',
                'risk_factors': ['Model not loaded'],
                'error': 'Model not loaded. Please train the model first.'
            }
        
        try:
            # Engineer features
            X = self._engineer_features(transaction)
            
            # Scale features
            X_scaled = self.scaler.transform(X)
            
            # Get prediction and probability
            prediction = self.model.predict(X_scaled)[0]
            probabilities = self.model.predict_proba(X_scaled)[0]
            fraud_probability = probabilities[1]
            
            # Determine risk level
            if fraud_probability < 0.3:
                risk_level = 'low'
            elif fraud_probability < 0.5:
                risk_level = 'medium'
            elif fraud_probability < 0.8:
                risk_level = 'high'
            else:
                risk_level = 'critical'
            
            # Identify risk factors
            risk_factors = self._identify_risk_factors(transaction, X)
            
            return {
                'is_fraud': bool(prediction),
                'fraud_probability': round(float(fraud_probability), 4),
                'risk_level': risk_level,
                'risk_factors': risk_factors,
                'recommendation': self._get_recommendation(risk_level, prediction)
            }
            
        except Exception as e:
            return {
                'is_fraud': False,
                'fraud_probability': 0.0,
                'risk_level': 'error',
                'risk_factors': [str(e)],
                'error': f'Prediction error: {e}'
            }
    
    def _identify_risk_factors(self, transaction: Dict, features: pd.DataFrame) -> List[str]:
        """Identify factors contributing to fraud risk"""
        risk_factors = []
        
        trans_type = transaction.get('type', '')
        amount = float(transaction.get('amount', 0))
        old_balance_org = float(transaction.get('oldbalanceOrg', 0))
        new_balance_orig = float(transaction.get('newbalanceOrig', 0))
        
        # High-risk transaction types
        if trans_type in ['TRANSFER', 'CASH_OUT']:
            risk_factors.append(f"High-risk transaction type: {trans_type}")
        
        # Complete account drain
        if old_balance_org > 0 and new_balance_orig == 0:
            risk_factors.append("Complete account drain detected")
        
        # Large transaction
        if amount > 200000:
            risk_factors.append(f"Large transaction amount: ${amount:,.2f}")
        
        # Amount exceeds balance
        if amount > old_balance_org and old_balance_org > 0:
            risk_factors.append("Transaction amount exceeds available balance")
        
        # Suspicious balance patterns
        if features['origBalanceError'].values[0] != 0:
            risk_factors.append("Balance calculation discrepancy detected")
        
        # Zero origin balance for large transfer
        if old_balance_org == 0 and amount > 0 and trans_type in ['TRANSFER', 'CASH_OUT']:
            risk_factors.append("Transfer from zero-balance account")
        
        return risk_factors if risk_factors else ["No specific risk factors identified"]
    
    def _get_recommendation(self, risk_level: str, is_fraud: bool) -> str:
        """Get action recommendation based on risk assessment"""
        if is_fraud or risk_level == 'critical':
            return "BLOCK: Transaction flagged as potential fraud. Require additional verification."
        elif risk_level == 'high':
            return "REVIEW: High risk detected. Recommend manual review before processing."
        elif risk_level == 'medium':
            return "MONITOR: Moderate risk. Process with enhanced monitoring."
        else:
            return "APPROVE: Low risk transaction. Safe to process."
    
    def predict_batch(self, transactions: List[Dict]) -> List[Dict]:
        """
        Predict fraud for multiple transactions
        
        Args:
            transactions: List of transaction dictionaries
            
        Returns:
            List of prediction results
        """
        return [self.predict(t) for t in transactions]
    
    def get_model_info(self) -> Dict:
        """Get information about the loaded model"""
        if not self.is_loaded:
            return {'status': 'not_loaded', 'error': 'Model not loaded'}
        
        return {
            'status': 'loaded',
            'model_type': type(self.model).__name__,
            'n_features': len(self.feature_columns),
            'feature_columns': self.feature_columns,
            'transaction_types': list(self.label_encoder.classes_) if self.label_encoder else []
        }


# Convenience function for quick predictions
def predict_fraud(transaction: Dict, model_dir: Optional[str] = None) -> Dict:
    """
    Quick function to predict fraud for a single transaction
    
    Args:
        transaction: Transaction details dictionary
        model_dir: Optional path to model directory
        
    Returns:
        Prediction result dictionary
    """
    detector = FraudDetector(model_dir)
    return detector.predict(transaction)


# Demo/Test function
def demo():
    """Demonstrate fraud detection capabilities"""
    print("\n" + "=" * 60)
    print("FRAUD DETECTION DEMO")
    print("=" * 60)
    
    detector = FraudDetector()
    
    if not detector.is_loaded:
        print("\n⚠️  Please run train_fraud_model.py first to train the model.")
        return
    
    # Test cases
    test_transactions = [
        {
            'name': 'Normal Payment',
            'type': 'PAYMENT',
            'amount': 100.00,
            'nameOrig': 'C1234567890',
            'oldbalanceOrg': 5000.00,
            'newbalanceOrig': 4900.00,
            'nameDest': 'M9876543210',
            'oldbalanceDest': 0.00,
            'newbalanceDest': 0.00
        },
        {
            'name': 'Suspicious Transfer (Complete Drain)',
            'type': 'TRANSFER',
            'amount': 50000.00,
            'nameOrig': 'C1234567890',
            'oldbalanceOrg': 50000.00,
            'newbalanceOrig': 0.00,
            'nameDest': 'C9876543210',
            'oldbalanceDest': 0.00,
            'newbalanceDest': 50000.00
        },
        {
            'name': 'Large Cash Out',
            'type': 'CASH_OUT',
            'amount': 300000.00,
            'nameOrig': 'C1111111111',
            'oldbalanceOrg': 300000.00,
            'newbalanceOrig': 0.00,
            'nameDest': 'C2222222222',
            'oldbalanceDest': 100000.00,
            'newbalanceDest': 0.00
        },
        {
            'name': 'Small Regular Payment',
            'type': 'PAYMENT',
            'amount': 25.50,
            'nameOrig': 'C3333333333',
            'oldbalanceOrg': 1500.00,
            'newbalanceOrig': 1474.50,
            'nameDest': 'M4444444444',
            'oldbalanceDest': 0.00,
            'newbalanceDest': 0.00
        }
    ]
    
    for txn in test_transactions:
        name = txn.pop('name')
        print(f"\n{'─' * 50}")
        print(f"Transaction: {name}")
        print(f"Type: {txn['type']}, Amount: ${txn['amount']:,.2f}")
        
        result = detector.predict(txn)
        
        print(f"\n📊 Prediction Results:")
        print(f"   Fraud Detected: {'🚨 YES' if result['is_fraud'] else '✅ NO'}")
        print(f"   Fraud Probability: {result['fraud_probability']*100:.2f}%")
        print(f"   Risk Level: {result['risk_level'].upper()}")
        print(f"   Recommendation: {result['recommendation']}")
        
        if result['risk_factors']:
            print(f"\n   Risk Factors:")
            for factor in result['risk_factors']:
                print(f"   • {factor}")


if __name__ == "__main__":
    demo()
