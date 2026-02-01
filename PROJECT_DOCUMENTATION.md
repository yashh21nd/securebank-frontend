# SecureBank - Project Documentation for PPT

---

## 1. PROPOSED SOLUTION (150-200 words)

### Overview

SecureBank is an intelligent digital banking platform that addresses the critical challenge of financial fraud in real-time payment systems. The proposed solution integrates Machine Learning-based fraud detection with a modern web-based payment interface, providing users with a secure, intuitive, and feature-rich banking experience.

### Problem Statement

Traditional banking systems rely on rule-based fraud detection that fails to adapt to evolving fraud patterns. Manual verification processes introduce delays, and users lack real-time visibility into transaction security. The increasing sophistication of financial fraud demands an intelligent, automated approach.

### Solution Approach

Our solution employs a three-tier architecture combining a React-based frontend, Flask-powered backend API, and a RandomForest machine learning model trained on the PaySim dataset. The system analyzes transactions in real-time, assessing 21 distinct features including transaction amount, sender-receiver balance ratios, transaction timing patterns, and historical behavior metrics.

### Key Innovations

The platform introduces voice-controlled payments using the Web Speech API, enabling hands-free transaction initiation. Blockchain-inspired QR code generation ensures payment authenticity, while WebSocket connections deliver instant notifications. The ML model achieves 99.98% accuracy (ROC-AUC) in distinguishing fraudulent from legitimate transactions, providing users with risk assessments and actionable recommendations before transaction confirmation.

### Expected Outcomes

Users benefit from reduced fraud exposure, faster transaction processing, and enhanced security awareness through visual risk indicators and AI-generated recommendations.

---

## 2. DETAILED DESIGN (150-200 words)

### System Components

The SecureBank platform comprises four primary subsystems working in harmony to deliver a comprehensive banking experience.

### Frontend Application Layer

The user interface is built using React 18 with Vite as the build tool, ensuring fast hot-module replacement during development and optimized production builds. The component architecture follows a modular design pattern with distinct components for Dashboard analytics, Payment processing, Voice-controlled transactions, and real-time Notifications. Styling utilizes CSS-in-JS for component-scoped styling with responsive design principles supporting mobile and desktop viewports.

### Backend API Layer

The Flask framework serves as the API backbone, implementing RESTful endpoints organized by domain: authentication, payments, transactions, fraud detection, blockchain services, and speech processing. Flask-CORS handles cross-origin requests from the deployed frontend, while Flask-SocketIO manages bidirectional WebSocket connections for real-time event propagation.

### Machine Learning Pipeline

The fraud detection subsystem operates independently, loading pre-trained model artifacts (RandomForest classifier, StandardScaler, LabelEncoder) at server startup. Feature engineering transforms raw transaction data into 21 normalized features suitable for model inference. The pipeline returns probability scores, risk classifications, and human-readable recommendations.

### Data Persistence Layer

SQLAlchemy ORM abstracts database operations, supporting SQLite for development and PostgreSQL for production deployment. Database models define User, Transaction, and FraudTrainingData entities with appropriate relationships and constraints.

---

## 3. TECHNICAL DESIGN (150-200 words)

### Technology Stack Selection

The technology choices prioritize developer productivity, runtime performance, and deployment flexibility.

### Frontend Technologies

React was selected for its component-based architecture, virtual DOM efficiency, and extensive ecosystem. Vite provides significantly faster build times compared to traditional bundlers like Webpack. The Web Speech API enables native browser-based speech recognition without external dependencies, supporting voice commands in multiple languages including English (India locale).

### Backend Technologies

Python with Flask offers rapid API development with minimal boilerplate. The framework's extension ecosystem (Flask-CORS, Flask-SocketIO, Flask-SQLAlchemy) provides production-ready solutions for common requirements. Gunicorn with Eventlet workers handles concurrent connections efficiently, supporting WebSocket connections alongside standard HTTP requests.

### Machine Learning Stack

Scikit-learn provides the RandomForestClassifier implementation with proven reliability and interpretability. Pandas handles data manipulation during feature engineering, while NumPy performs efficient numerical computations. The imbalanced-learn library addresses class imbalance in fraud datasets through SMOTE (Synthetic Minority Over-sampling Technique) during model training.

### Deployment Infrastructure

Vercel hosts the static frontend with global CDN distribution, automatic HTTPS, and serverless function support. Render provides managed Python hosting with automatic deployments from GitHub, SSL certificates, and environment variable management. This separation allows independent scaling of frontend and backend resources.

### Security Implementation

JWT (JSON Web Tokens) secure API authentication with configurable expiration. Bcrypt hashes passwords with salt rounds preventing rainbow table attacks. CORS configuration restricts API access to authorized origins.

---

## 4. DESIGN DEVIATION (150-200 words)

### Original Design Intent

The initial project specification envisioned a monolithic application with server-side rendering, traditional form-based payments, and rule-based fraud detection using threshold comparisons.

### Deviations and Rationale

**Architecture Shift**: The monolithic design evolved into a microservices-inspired architecture separating frontend, backend API, and ML services. This deviation enables independent deployment, technology flexibility, and horizontal scaling. The frontend can be updated without backend redeployment, and vice versa.

**Fraud Detection Approach**: Rule-based detection was replaced with machine learning classification. Static rules like "block transactions over ₹50,000" proved ineffective against sophisticated fraud patterns. The ML approach learns complex, non-linear relationships between transaction features, adapting to evolving fraud techniques through model retraining.

**User Interaction Model**: Traditional form submissions were supplemented with voice commands. User research indicated growing preference for voice interfaces, particularly for accessibility. The Web Speech API integration required additional error handling for browser compatibility but significantly improved user experience.

**Real-time Communication**: Polling-based notification checking was replaced with WebSocket connections. While increasing server complexity, WebSockets reduce latency from seconds to milliseconds and decrease unnecessary network traffic.

**Database Selection**: PostgreSQL was initially specified, but SQLite was adopted for development simplicity. The SQLAlchemy abstraction layer ensures seamless migration to PostgreSQL in production without code changes.

### Impact Assessment

These deviations improved system maintainability, user experience, and fraud detection accuracy while introducing additional deployment complexity managed through CI/CD automation.

---

## 5. DATABASE DESIGN (150-200 words)

### Entity-Relationship Model

The database schema implements a normalized relational design supporting user management, transaction processing, and fraud analysis workflows.

### User Entity

The User table serves as the central entity with attributes: id (primary key, UUID), username (unique, indexed), email (unique), password_hash (bcrypt), full_name, phone_number, balance (decimal with precision), upi_id (unique identifier for payments), created_at, and updated_at timestamps. Soft delete is supported through an is_active boolean flag.

### Transaction Entity

Transactions record all financial activities with attributes: id (primary key), sender_id (foreign key to User), receiver_id (foreign key to User), amount (decimal), transaction_type (enum: TRANSFER, PAYMENT, CASH_OUT, CASH_IN, DEBIT), description, status (enum: PENDING, COMPLETED, FAILED, BLOCKED), fraud_score (float 0-1), fraud_checked (boolean), created_at timestamp. Indexes on sender_id, receiver_id, and created_at optimize query performance for transaction history retrieval.

### FraudTrainingData Entity

This entity stores imported PaySim dataset records for profile generation: id, step (time unit), transaction_type, amount, name_orig (sender identifier), old_balance_orig, new_balance_orig, name_dest (receiver identifier), old_balance_dest, new_balance_dest, is_fraud (boolean label), is_flagged_fraud. This table enables contact risk profiling by querying historical patterns associated with account identifiers.

### Relationships

Users have one-to-many relationships with Transactions (as sender and receiver). Foreign key constraints with CASCADE delete options maintain referential integrity. Database migrations managed through Alembic track schema evolution.

### Indexing Strategy

Composite indexes on (sender_id, created_at) and (receiver_id, created_at) accelerate transaction history queries. Full-text search indexes on description enable transaction search functionality.

---

## 6. ALGORITHM DEVELOPMENT (150-200 words)

### Machine Learning Model Selection

The fraud detection system employs a RandomForest ensemble classifier, selected through comparative evaluation against Logistic Regression, Support Vector Machines, and Gradient Boosting algorithms.

### Feature Engineering Pipeline

Raw transaction data undergoes transformation into 21 engineered features:

**Amount-based Features**: transaction_amount, amount_to_balance_ratio (transaction amount divided by sender balance), amount_percentile (relative to historical distribution).

**Balance Features**: sender_old_balance, sender_new_balance, receiver_old_balance, receiver_new_balance, sender_balance_change, receiver_balance_change, balance_discrepancy (detecting accounting anomalies).

**Transaction Type Encoding**: One-hot encoded categorical features for CASH_IN, CASH_OUT, DEBIT, PAYMENT, TRANSFER transaction types.

**Temporal Features**: hour_of_day, day_of_week, is_weekend, is_night_transaction (transactions between 11 PM and 5 AM show elevated fraud rates).

**Behavioral Features**: sender_transaction_count, receiver_transaction_count, average_transaction_amount.

### Class Imbalance Handling

The PaySim dataset exhibits severe class imbalance (0.13% fraud rate). SMOTE generates synthetic minority class samples by interpolating between existing fraud examples, balancing training data without losing legitimate transaction patterns.

### Model Training Process

The RandomForest classifier trains with 100 decision trees, maximum depth of 15, and minimum samples per leaf of 5. These hyperparameters, determined through grid search with 5-fold cross-validation, prevent overfitting while maintaining generalization capability.

### Evaluation Metrics

Model performance measured through ROC-AUC (0.9998), precision (0.97), recall (0.95), and F1-score (0.96). The high recall ensures minimal false negatives (missed frauds), while precision prevents excessive false positives (legitimate transactions blocked).

### Inference Pipeline

Production inference normalizes input features using the trained StandardScaler, applies the RandomForest classifier, and returns both binary prediction and probability score. Probability thresholds (0.3 for warning, 0.7 for blocking) provide graduated response levels.

---

## 7. SYSTEM ARCHITECTURE (150-200 words)

### High-Level Architecture Overview

SecureBank implements a distributed three-tier architecture separating presentation, business logic, and data management concerns across independently deployable services.

### Presentation Tier

The React single-page application executes entirely in the user's browser, communicating with backend services through RESTful HTTP requests and WebSocket connections. Vercel's edge network serves static assets from geographically distributed points of presence, minimizing latency for global users. The presentation tier handles user input validation, local state management, and responsive rendering across device form factors.

### Application Tier

The Flask application server processes business logic including authentication workflows, payment processing, fraud analysis orchestration, and notification dispatch. Stateless request handling enables horizontal scaling through load-balanced server instances. The application tier interfaces with the ML subsystem for fraud predictions and the database for persistent storage. Gunicorn process manager spawns worker processes, each capable of handling multiple concurrent connections through Eventlet's cooperative multitasking.

### Data Tier

SQLite (development) or PostgreSQL (production) stores persistent application state including user accounts, transaction records, and fraud training data. The database tier enforces data integrity through constraints, relationships, and ACID transaction guarantees. Connection pooling through SQLAlchemy optimizes database resource utilization.

### Machine Learning Subsystem

The fraud detection model operates as an embedded service within the application tier, loading serialized model artifacts (joblib/pickle format) at startup. This co-location eliminates network latency for fraud predictions while allowing model updates through artifact replacement and server restart.

### Communication Patterns

Synchronous HTTP requests handle user-initiated actions requiring immediate response (login, payment submission). Asynchronous WebSocket channels push server-initiated events (payment received, fraud alerts) without client polling. The Socket.IO library provides automatic reconnection, heartbeat monitoring, and fallback to HTTP long-polling for restricted network environments.

### Security Architecture

TLS encryption protects all data in transit between client and server. JWT tokens authenticate API requests with configurable expiration and refresh mechanisms. Input sanitization prevents SQL injection and cross-site scripting attacks. Rate limiting protects against denial-of-service attempts.

---

## 8. ARCHITECTURE DIAGRAM (Text Description)

### Layer 1: Client Layer
```
[User's Browser]
    │
    ├── React Application (SPA)
    │   ├── Dashboard Component (Charts, Analytics)
    │   ├── Payment Component (Send, QR, Request)
    │   ├── VoicePayment Component (Speech Recognition)
    │   └── NotificationCenter Component (Real-time Alerts)
    │
    ├── HTTP/HTTPS Requests ──────────────────────┐
    └── WebSocket Connection ─────────────────────┤
                                                  │
```

### Layer 2: CDN/Edge Layer
```
                                                  │
    [Vercel Edge Network]                         │
    ├── Global CDN Distribution                   │
    ├── SSL/TLS Termination                       │
    └── Static Asset Caching                      │
                                                  │
```

### Layer 3: Application Layer
```
                                                  ▼
    [Render Cloud Platform] ◄─────────────────────┘
        │
        └── [Flask Application Server]
            ├── Gunicorn + Eventlet Workers
            │
            ├── API Routes
            │   ├── /api/auth/* (Authentication)
            │   ├── /api/payments/* (Transactions)
            │   ├── /api/fraud/* (ML Analysis)
            │   ├── /api/blockchain/* (QR Generation)
            │   └── /api/speech/* (Voice Processing)
            │
            ├── Services Layer
            │   ├── FraudDetectionService
            │   │   └── [ML Model: RandomForest]
            │   │       ├── fraud_detection_model.pkl
            │   │       ├── scaler.pkl
            │   │       └── feature_columns.pkl
            │   ├── BlockchainService (QR + Hashing)
            │   └── SpeechRecognitionService
            │
            └── WebSocket Handler (Socket.IO)
                └── Real-time Notifications
```

### Layer 4: Data Layer
```
            │
            ▼
    [SQLite/PostgreSQL Database]
        ├── Users Table
        │   └── id, username, email, password_hash, balance
        ├── Transactions Table
        │   └── id, sender_id, receiver_id, amount, status, fraud_score
        └── FraudTrainingData Table
            └── PaySim dataset records (5000+ entries)
```

### Data Flow Description

1. **User Authentication Flow**: User submits credentials → React sends POST to /api/auth/login → Flask validates against database → JWT token returned → Token stored in localStorage → Subsequent requests include Authorization header.

2. **Payment Flow**: User initiates payment → React collects recipient and amount → POST to /api/fraud/analyze → ML model evaluates risk → If approved, POST to /api/payments/send → Database updated → WebSocket notifies recipient → Success animation displayed.

3. **Voice Payment Flow**: User taps microphone → Web Speech API captures audio → Speech-to-text conversion → React parses command → POST to /api/speech/process → NLP extracts intent, amount, recipient → Standard payment flow continues.

4. **Real-time Notification Flow**: Server event occurs (payment received) → WebSocket handler emits event → Socket.IO broadcasts to connected clients → NotificationCenter component updates → Toast notification displayed.

---

## 9. SUMMARY TABLE

| Component | Technology | Purpose |
|-----------|------------|---------|
| Frontend Framework | React 18 | Component-based UI |
| Build Tool | Vite 5 | Fast bundling |
| Backend Framework | Flask 3 | REST API |
| ML Library | Scikit-learn | Fraud detection |
| Database ORM | SQLAlchemy | Data persistence |
| WebSocket | Socket.IO | Real-time updates |
| Frontend Hosting | Vercel | CDN deployment |
| Backend Hosting | Render | Python hosting |
| Authentication | JWT + Bcrypt | Secure auth |
| Voice Interface | Web Speech API | Voice commands |

---

## 10. KEY METRICS

- **ML Model Accuracy**: 99.98% ROC-AUC
- **Features Analyzed**: 21 per transaction
- **Response Time**: <200ms for fraud analysis
- **Dataset Size**: 6.3M transactions (PaySim)
- **Training Records**: 5000 imported records
- **Fraud Detection**: Real-time, pre-transaction
- **Supported Browsers**: Chrome, Edge, Safari

---

*Document prepared for academic presentation purposes.*
*SecureBank - Intelligent Banking with ML Fraud Detection*
