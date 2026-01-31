import React from 'react'

export default function About() {
  return (
    <div className="about-container">
      <div className="about-card">
        <div className="module-header">
          <h1>SecureBank</h1>
          <p className="header-subtitle">Advanced Financial Security Platform</p>
        </div>
        
        <div className="module-content">
          <section className="about-section">
            <h2>Project Overview</h2>
            <p className="module-description">
              SecureBank is a comprehensive financial management solution designed to 
              provide users with a secure, intelligent, and user-friendly banking experience. 
              Our platform combines cutting-edge technologies including Machine Learning for 
              fraud detection, Blockchain for secure transactions, and Voice Recognition for 
              hands-free payments.
            </p>
          </section>

          <section className="features-section">
            <h2>Key Features</h2>
            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                </div>
                <h3>ML Fraud Detection</h3>
                <p>Advanced machine learning algorithms analyze transaction patterns in real-time to detect and prevent fraudulent activities.</p>
              </div>

              <div className="feature-card">
                <div className="feature-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="7" height="7"/>
                    <rect x="14" y="3" width="7" height="7"/>
                    <rect x="14" y="14" width="7" height="7"/>
                    <rect x="3" y="14" width="7" height="7"/>
                  </svg>
                </div>
                <h3>Blockchain QR Payments</h3>
                <p>Secure QR-based transactions powered by blockchain technology ensure tamper-proof and verifiable payments.</p>
              </div>

              <div className="feature-card">
                <div className="feature-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                    <line x1="12" y1="19" x2="12" y2="23"/>
                    <line x1="8" y1="23" x2="16" y2="23"/>
                  </svg>
                </div>
                <h3>Voice Payments</h3>
                <p>Natural language processing enables hands-free transactions through voice commands, similar to GPay and PhonePe.</p>
              </div>

              <div className="feature-card">
                <div className="feature-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                </div>
                <h3>Real-time Updates</h3>
                <p>Instant notifications and live balance updates keep you informed about every transaction as it happens.</p>
              </div>
            </div>
          </section>

          <section className="tech-section">
            <h2>Technology Stack</h2>
            <div className="tech-grid">
              <div className="tech-item">
                <span className="tech-label">Frontend</span>
                <span className="tech-value">React.js, Vite</span>
              </div>
              <div className="tech-item">
                <span className="tech-label">Backend</span>
                <span className="tech-value">Flask, Python</span>
              </div>
              <div className="tech-item">
                <span className="tech-label">ML Framework</span>
                <span className="tech-value">XGBoost, Scikit-learn</span>
              </div>
              <div className="tech-item">
                <span className="tech-label">Real-time</span>
                <span className="tech-value">WebSocket, Socket.IO</span>
              </div>
              <div className="tech-item">
                <span className="tech-label">Security</span>
                <span className="tech-value">JWT, AES-256, SHA-256</span>
              </div>
              <div className="tech-item">
                <span className="tech-label">Database</span>
                <span className="tech-value">SQLAlchemy, SQLite</span>
              </div>
            </div>
          </section>
        </div>
        
        <div className="team-credits">
          <h3>Project Team</h3>
          <p className="credits-text">
            Developed by Yash Shinde, Prasad Gavhane, and Atharva Ghule
          </p>
          <p className="credits-subtitle">Final Year Project • 2026</p>
        </div>
      </div>

      <style>{`
        .about-container {
          max-width: 900px;
          margin: 0 auto;
        }

        .about-card {
          background: white;
          border-radius: 24px;
          padding: 48px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
          border: 1px solid #e5e7eb;
        }

        .module-header {
          text-align: center;
          margin-bottom: 40px;
          padding-bottom: 24px;
          border-bottom: 2px solid #d1fae5;
        }

        .module-header h1 {
          color: #059669;
          font-size: 36px;
          font-weight: 700;
          margin: 0;
          font-family: 'Poppins', sans-serif;
        }

        .header-subtitle {
          color: #6b7280;
          font-size: 16px;
          margin: 8px 0 0;
        }

        .module-content {
          margin-bottom: 40px;
        }

        .about-section, .features-section, .tech-section {
          margin-bottom: 40px;
        }

        .about-section h2, .features-section h2, .tech-section h2 {
          color: #1f2937;
          font-size: 20px;
          font-weight: 600;
          margin: 0 0 16px;
          font-family: 'Poppins', sans-serif;
        }

        .module-description {
          font-size: 16px;
          line-height: 1.8;
          color: #4b5563;
          margin: 0;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
        }

        .feature-card {
          padding: 24px;
          background: linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%);
          border-radius: 16px;
          border: 1px solid #d1fae5;
          transition: all 0.3s ease;
        }

        .feature-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 24px rgba(16, 185, 129, 0.15);
        }

        .feature-icon {
          width: 56px;
          height: 56px;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          margin-bottom: 16px;
        }

        .feature-card h3 {
          color: #059669;
          font-size: 18px;
          margin: 0 0 8px;
          font-family: 'Poppins', sans-serif;
        }

        .feature-card p {
          color: #6b7280;
          font-size: 14px;
          line-height: 1.6;
          margin: 0;
        }

        .tech-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }

        .tech-item {
          padding: 16px;
          background: #f9fafb;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
        }

        .tech-label {
          display: block;
          font-size: 12px;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 4px;
        }

        .tech-value {
          font-size: 14px;
          font-weight: 600;
          color: #1f2937;
        }

        .team-credits {
          text-align: center;
          padding-top: 32px;
          border-top: 2px solid #e5e7eb;
        }

        .team-credits h3 {
          color: #374151;
          font-size: 16px;
          margin: 0 0 12px;
          font-weight: 600;
        }

        .credits-text {
          font-size: 18px;
          font-weight: 600;
          color: #059669;
          margin: 0;
        }

        .credits-subtitle {
          font-size: 14px;
          color: #9ca3af;
          margin: 8px 0 0;
        }

        @media (max-width: 768px) {
          .about-card {
            padding: 24px;
          }

          .features-grid {
            grid-template-columns: 1fr;
          }

          .tech-grid {
            grid-template-columns: repeat(2, 1fr);
          }

          .module-header h1 {
            font-size: 28px;
          }
        }
      `}</style>
    </div>
  )
}
