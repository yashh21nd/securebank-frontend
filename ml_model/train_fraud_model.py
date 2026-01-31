"""
Fraud Detection Model Training Script
Dataset: PaySim Synthetic Financial Dataset
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    classification_report, 
    confusion_matrix, 
    roc_auc_score,
    precision_recall_curve,
    f1_score
)
from imblearn.over_sampling import SMOTE
from imblearn.under_sampling import RandomUnderSampler
from imblearn.pipeline import Pipeline as ImbPipeline
import joblib
import warnings
import os

warnings.filterwarnings('ignore')

# Get the directory where this script is located
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(SCRIPT_DIR, 'PS_20174392719_1491204439457_log.csv')
MODEL_PATH = os.path.join(SCRIPT_DIR, 'fraud_detection_model.joblib')
SCALER_PATH = os.path.join(SCRIPT_DIR, 'scaler.joblib')
ENCODER_PATH = os.path.join(SCRIPT_DIR, 'label_encoder.joblib')

def load_and_explore_data():
    """Load dataset and perform initial exploration"""
    print("=" * 60)
    print("FRAUD DETECTION MODEL TRAINING")
    print("=" * 60)
    print(f"\nLoading dataset from: {DATA_PATH}")
    
    # Read dataset in chunks for memory efficiency
    df = pd.read_csv(DATA_PATH)
    
    print(f"\nDataset Shape: {df.shape}")
    print(f"Total Transactions: {len(df):,}")
    print(f"\nColumn Names: {df.columns.tolist()}")
    print(f"\nData Types:\n{df.dtypes}")
    print(f"\nFraud Distribution:")
    print(df['isFraud'].value_counts())
    print(f"\nFraud Percentage: {(df['isFraud'].sum() / len(df)) * 100:.4f}%")
    print(f"\nTransaction Types:\n{df['type'].value_counts()}")
    
    return df


def feature_engineering(df):
    """Create meaningful features for fraud detection"""
    print("\n" + "=" * 60)
    print("FEATURE ENGINEERING")
    print("=" * 60)
    
    # Create a copy to avoid modifying original
    df = df.copy()
    
    # 1. Balance difference features
    df['origBalanceDiff'] = df['oldbalanceOrg'] - df['newbalanceOrig']
    df['destBalanceDiff'] = df['newbalanceDest'] - df['oldbalanceDest']
    
    # 2. Error in balance (actual vs expected)
    df['origBalanceError'] = df['origBalanceDiff'] - df['amount']
    df['destBalanceError'] = df['destBalanceDiff'] - df['amount']
    
    # 3. Ratio features
    df['amountToOrigBalance'] = df['amount'] / (df['oldbalanceOrg'] + 1)  # +1 to avoid division by zero
    df['amountToDestBalance'] = df['amount'] / (df['oldbalanceDest'] + 1)
    
    # 4. Zero balance indicators
    df['origZeroBalance'] = (df['oldbalanceOrg'] == 0).astype(int)
    df['destZeroBalance'] = (df['oldbalanceDest'] == 0).astype(int)
    df['newOrigZeroBalance'] = (df['newbalanceOrig'] == 0).astype(int)
    
    # 5. Complete transfer indicator (all money moved)
    df['completeTransfer'] = ((df['oldbalanceOrg'] > 0) & (df['newbalanceOrig'] == 0)).astype(int)
    
    # 6. Merchant indicator (names starting with 'M')
    df['isMerchant'] = df['nameDest'].str.startswith('M').astype(int)
    
    # 7. Large transaction indicator
    amount_threshold = df['amount'].quantile(0.95)
    df['isLargeTransaction'] = (df['amount'] > amount_threshold).astype(int)
    
    # 8. Hour of day (simulated from step - each step represents 1 hour)
    df['hourOfDay'] = df['step'] % 24
    df['dayOfMonth'] = (df['step'] // 24) % 30
    
    # 9. Transaction type encoding
    le = LabelEncoder()
    df['typeEncoded'] = le.fit_transform(df['type'])
    
    print(f"Created {len(df.columns) - 11} new features")
    print(f"Total features: {len(df.columns)}")
    
    return df, le


def prepare_features(df):
    """Prepare feature matrix and target variable"""
    print("\n" + "=" * 60)
    print("PREPARING FEATURES")
    print("=" * 60)
    
    # Select features for modeling
    feature_columns = [
        'step', 'amount', 'oldbalanceOrg', 'newbalanceOrig',
        'oldbalanceDest', 'newbalanceDest', 'typeEncoded',
        'origBalanceDiff', 'destBalanceDiff', 'origBalanceError',
        'destBalanceError', 'amountToOrigBalance', 'amountToDestBalance',
        'origZeroBalance', 'destZeroBalance', 'newOrigZeroBalance',
        'completeTransfer', 'isMerchant', 'isLargeTransaction',
        'hourOfDay', 'dayOfMonth'
    ]
    
    X = df[feature_columns]
    y = df['isFraud']
    
    print(f"Feature matrix shape: {X.shape}")
    print(f"Target distribution:")
    print(f"  Non-Fraud: {(y == 0).sum():,}")
    print(f"  Fraud: {(y == 1).sum():,}")
    
    return X, y, feature_columns


def handle_class_imbalance(X_train, y_train):
    """Handle class imbalance using combined sampling strategy"""
    print("\n" + "=" * 60)
    print("HANDLING CLASS IMBALANCE")
    print("=" * 60)
    
    print(f"Original training set size: {len(y_train):,}")
    print(f"Original fraud cases: {y_train.sum():,}")
    
    # Use combination of undersampling majority and SMOTE for minority
    # First undersample majority class, then apply SMOTE
    under_sampler = RandomUnderSampler(sampling_strategy=0.1, random_state=42)
    smote = SMOTE(sampling_strategy=0.5, random_state=42)
    
    # Apply undersampling first
    X_under, y_under = under_sampler.fit_resample(X_train, y_train)
    print(f"After undersampling: {len(y_under):,} samples")
    
    # Apply SMOTE
    X_resampled, y_resampled = smote.fit_resample(X_under, y_under)
    print(f"After SMOTE: {len(y_resampled):,} samples")
    print(f"Final fraud cases: {y_resampled.sum():,}")
    print(f"Final non-fraud cases: {(y_resampled == 0).sum():,}")
    
    return X_resampled, y_resampled


def train_model(X_train, y_train, X_test, y_test):
    """Train and evaluate fraud detection model"""
    print("\n" + "=" * 60)
    print("MODEL TRAINING")
    print("=" * 60)
    
    # Scale features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    # Train Random Forest (best for fraud detection)
    print("\nTraining Random Forest Classifier...")
    rf_model = RandomForestClassifier(
        n_estimators=100,
        max_depth=20,
        min_samples_split=10,
        min_samples_leaf=5,
        class_weight='balanced',
        random_state=42,
        n_jobs=-1,
        verbose=1
    )
    
    rf_model.fit(X_train_scaled, y_train)
    
    # Predictions
    y_pred = rf_model.predict(X_test_scaled)
    y_pred_proba = rf_model.predict_proba(X_test_scaled)[:, 1]
    
    # Evaluation
    print("\n" + "=" * 60)
    print("MODEL EVALUATION")
    print("=" * 60)
    
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, target_names=['Non-Fraud', 'Fraud']))
    
    print("\nConfusion Matrix:")
    cm = confusion_matrix(y_test, y_pred)
    print(f"True Negatives: {cm[0][0]:,}")
    print(f"False Positives: {cm[0][1]:,}")
    print(f"False Negatives: {cm[1][0]:,}")
    print(f"True Positives: {cm[1][1]:,}")
    
    roc_auc = roc_auc_score(y_test, y_pred_proba)
    print(f"\nROC-AUC Score: {roc_auc:.4f}")
    
    f1 = f1_score(y_test, y_pred)
    print(f"F1 Score: {f1:.4f}")
    
    # Feature importance
    print("\n" + "=" * 60)
    print("FEATURE IMPORTANCE")
    print("=" * 60)
    
    return rf_model, scaler


def save_model(model, scaler, label_encoder, feature_columns):
    """Save trained model and preprocessing objects"""
    print("\n" + "=" * 60)
    print("SAVING MODEL")
    print("=" * 60)
    
    # Save model
    joblib.dump(model, MODEL_PATH)
    print(f"Model saved to: {MODEL_PATH}")
    
    # Save scaler
    joblib.dump(scaler, SCALER_PATH)
    print(f"Scaler saved to: {SCALER_PATH}")
    
    # Save label encoder
    joblib.dump(label_encoder, ENCODER_PATH)
    print(f"Label encoder saved to: {ENCODER_PATH}")
    
    # Save feature columns
    feature_path = os.path.join(SCRIPT_DIR, 'feature_columns.joblib')
    joblib.dump(feature_columns, feature_path)
    print(f"Feature columns saved to: {feature_path}")
    
    # Save model metadata
    metadata = {
        'model_type': 'RandomForestClassifier',
        'n_features': len(feature_columns),
        'feature_columns': feature_columns,
        'training_samples': 'PaySim Dataset',
        'version': '1.0.0'
    }
    metadata_path = os.path.join(SCRIPT_DIR, 'model_metadata.joblib')
    joblib.dump(metadata, metadata_path)
    print(f"Metadata saved to: {metadata_path}")


def main():
    """Main training pipeline"""
    # Load data
    df = load_and_explore_data()
    
    # Feature engineering
    df, label_encoder = feature_engineering(df)
    
    # Prepare features
    X, y, feature_columns = prepare_features(df)
    
    # Split data
    print("\n" + "=" * 60)
    print("SPLITTING DATA")
    print("=" * 60)
    
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    print(f"Training set: {len(X_train):,} samples")
    print(f"Test set: {len(X_test):,} samples")
    
    # Handle class imbalance
    X_train_balanced, y_train_balanced = handle_class_imbalance(X_train, y_train)
    
    # Train model
    model, scaler = train_model(X_train_balanced, y_train_balanced, X_test, y_test)
    
    # Show feature importance
    feature_importance = pd.DataFrame({
        'feature': feature_columns,
        'importance': model.feature_importances_
    }).sort_values('importance', ascending=False)
    
    print("\nTop 10 Most Important Features:")
    print(feature_importance.head(10).to_string(index=False))
    
    # Save model
    save_model(model, scaler, label_encoder, feature_columns)
    
    print("\n" + "=" * 60)
    print("TRAINING COMPLETE!")
    print("=" * 60)
    print("\nModel files created:")
    print(f"  - {MODEL_PATH}")
    print(f"  - {SCALER_PATH}")
    print(f"  - {ENCODER_PATH}")
    print("\nYou can now use the fraud_predictor.py for real-time predictions.")


if __name__ == "__main__":
    main()
