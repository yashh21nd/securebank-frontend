import React from 'react'

export default function About() {
  return (
    <div className="about-container">
      {/* Hero Section */}
      <div className="about-hero">
        <div className="hero-content">
          <div className="hero-badge">
            <span className="badge-icon">🌱</span>
            <span>Growing Your Financial Future</span>
          </div>
          <h1>SecureBank</h1>
          <p className="hero-tagline">Where security meets simplicity in modern banking</p>
          <div className="hero-stats">
            <div className="hero-stat">
              <span className="stat-number">99.9%</span>
              <span className="stat-text">Fraud Detection</span>
            </div>
            <div className="hero-stat">
              <span className="stat-number">0.3s</span>
              <span className="stat-text">Transaction Speed</span>
            </div>
            <div className="hero-stat">
              <span className="stat-number">24/7</span>
              <span className="stat-text">Availability</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mission Section */}
      <div className="mission-section">
        <div className="mission-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 6v6l4 2"/>
          </svg>
        </div>
        <h2>Our Mission</h2>
        <p>
          SecureBank is a comprehensive financial management solution designed to provide users 
          with a secure, intelligent, and user-friendly banking experience. We combine cutting-edge 
          technologies including Machine Learning for fraud detection, Blockchain for secure transactions, 
          and Voice Recognition for hands-free payments—all wrapped in a beautiful, intuitive interface.
        </p>
      </div>

      {/* Features Section */}
      <div className="features-section">
        <h2>Powerful Features</h2>
        <p className="section-subtitle">Everything you need for modern, secure banking</p>
        
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon-wrapper sage">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <h3>ML Fraud Detection</h3>
            <p>Advanced XGBoost algorithms trained on 6M+ transactions analyze patterns in real-time, achieving 99.9% accuracy in detecting fraudulent activities.</p>
            <div className="feature-tag">AI-Powered</div>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper copper">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7"/>
                <rect x="14" y="3" width="7" height="7"/>
                <rect x="14" y="14" width="7" height="7"/>
                <rect x="3" y="14" width="7" height="7"/>
              </svg>
            </div>
            <h3>Blockchain QR Payments</h3>
            <p>Every QR transaction is secured with SHA-256 hashing and immutable blockchain ledger, ensuring tamper-proof and verifiable payment records.</p>
            <div className="feature-tag">Blockchain</div>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper gold">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                <line x1="12" y1="19" x2="12" y2="23"/>
                <line x1="8" y1="23" x2="16" y2="23"/>
              </svg>
            </div>
            <h3>Voice Payments</h3>
            <p>Natural language processing enables hands-free transactions. Simply speak your payment commands and our AI understands context, amounts, and recipients.</p>
            <div className="feature-tag">Voice AI</div>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper brown">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
            </div>
            <h3>Real-time Alerts</h3>
            <p>WebSocket-powered instant notifications keep you informed about every transaction, balance change, and security alert as they happen.</p>
            <div className="feature-tag">Live</div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="how-it-works-section">
        <h2>How It Works</h2>
        <p className="section-subtitle">Simple, secure, and seamless</p>
        
        <div className="steps-container">
          <div className="step">
            <div className="step-number">1</div>
            <div className="step-content">
              <h4>Initiate Payment</h4>
              <p>Use voice, QR scan, or manual entry</p>
            </div>
          </div>
          <div className="step-connector"></div>
          <div className="step">
            <div className="step-number">2</div>
            <div className="step-content">
              <h4>AI Analysis</h4>
              <p>ML model analyzes for fraud</p>
            </div>
          </div>
          <div className="step-connector"></div>
          <div className="step">
            <div className="step-number">3</div>
            <div className="step-content">
              <h4>Secure Processing</h4>
              <p>Blockchain records transaction</p>
            </div>
          </div>
          <div className="step-connector"></div>
          <div className="step">
            <div className="step-number">4</div>
            <div className="step-content">
              <h4>Confirmation</h4>
              <p>Instant notification sent</p>
            </div>
          </div>
        </div>
      </div>

      {/* Technology Stack */}
      <div className="tech-section">
        <h2>Technology Stack</h2>
        <p className="section-subtitle">Built with modern, robust technologies</p>
        
        <div className="tech-categories">
          <div className="tech-category">
            <h4>Frontend</h4>
            <div className="tech-tags">
              <span className="tech-tag">React.js</span>
              <span className="tech-tag">Vite</span>
              <span className="tech-tag">WebSocket</span>
            </div>
          </div>
          <div className="tech-category">
            <h4>Backend</h4>
            <div className="tech-tags">
              <span className="tech-tag">Flask</span>
              <span className="tech-tag">Python</span>
              <span className="tech-tag">SQLAlchemy</span>
            </div>
          </div>
          <div className="tech-category">
            <h4>ML & AI</h4>
            <div className="tech-tags">
              <span className="tech-tag">XGBoost</span>
              <span className="tech-tag">Scikit-learn</span>
              <span className="tech-tag">PaySim Dataset</span>
            </div>
          </div>
          <div className="tech-category">
            <h4>Security</h4>
            <div className="tech-tags">
              <span className="tech-tag">JWT Auth</span>
              <span className="tech-tag">AES-256</span>
              <span className="tech-tag">Blockchain</span>
            </div>
          </div>
        </div>
      </div>

      {/* Team Section */}
      <div className="team-section">
        <div className="team-header">
          <h2>Meet Our Team</h2>
          <p>The minds behind SecureBank</p>
        </div>
        <div className="team-members">
          <div className="team-member">
            <div className="member-avatar">YS</div>
            <h4>Yash Shinde</h4>
            <p>Lead Developer</p>
          </div>
          <div className="team-member">
            <div className="member-avatar">PG</div>
            <h4>Prasad Gavhane</h4>
            <p>Backend Engineer</p>
          </div>
          <div className="team-member">
            <div className="member-avatar">AG</div>
            <h4>Atharva Ghule</h4>
            <p>ML Engineer</p>
          </div>
        </div>
        <div className="project-info">
          <span className="project-badge">Final Year Project • 2026</span>
        </div>
      </div>

      <style>{`
        .about-container {
          max-width: 960px;
          margin: 0 auto;
        }

        /* Hero Section */
        .about-hero {
          background: rgba(255, 255, 253, 0.9);
          backdrop-filter: blur(20px);
          border-radius: 28px;
          padding: 48px;
          text-align: center;
          border: 1px solid rgba(212, 218, 201, 0.5);
          margin-bottom: 32px;
          position: relative;
          overflow: hidden;
        }

        .about-hero::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 4px;
          background: linear-gradient(90deg, #5d7049, #94a37e, #d4a84b, #b87333);
        }

        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(220, 252, 231, 0.6);
          padding: 8px 20px;
          border-radius: 24px;
          font-size: 14px;
          color: #15803d;
          margin-bottom: 20px;
        }

        .badge-icon {
          font-size: 18px;
        }

        .about-hero h1 {
          font-family: 'Playfair Display', serif;
          font-size: 48px;
          font-weight: 600;
          color: #14532d;
          margin: 0 0 12px;
          letter-spacing: 1px;
        }

        .hero-tagline {
          font-size: 18px;
          color: #16a34a;
          margin: 0 0 32px;
        }

        .hero-stats {
          display: flex;
          justify-content: center;
          gap: 48px;
        }

        .hero-stat {
          text-align: center;
        }

        .stat-number {
          display: block;
          font-size: 32px;
          font-weight: 700;
          color: #15803d;
          font-family: 'Playfair Display', serif;
        }

        .stat-text {
          font-size: 13px;
          color: #22c55e;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        /* Mission Section */
        .mission-section {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(8px);
          border-radius: 24px;
          padding: 40px;
          text-align: center;
          border: 1px solid rgba(34, 197, 94, 0.2);
          margin-bottom: 32px;
        }

        .mission-icon {
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, rgba(220, 252, 231, 0.8), rgba(187, 247, 208, 0.8));
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
          color: #15803d;
        }

        .mission-section h2 {
          font-family: 'Playfair Display', serif;
          font-size: 28px;
          color: #14532d;
          margin: 0 0 16px;
        }

        .mission-section p {
          font-size: 16px;
          line-height: 1.9;
          color: #16a34a;
          max-width: 700px;
          margin: 0 auto;
        }

        /* Features Section */
        .features-section {
          margin-bottom: 32px;
        }

        .features-section > h2, .how-it-works-section h2, .tech-section > h2 {
          font-family: 'Playfair Display', serif;
          font-size: 28px;
          color: #14532d;
          text-align: center;
          margin: 0 0 8px;
        }

        .section-subtitle {
          text-align: center;
          color: #22c55e;
          font-size: 15px;
          margin: 0 0 32px;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 24px;
        }

        .feature-card {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(8px);
          border-radius: 20px;
          padding: 28px;
          border: 1px solid rgba(34, 197, 94, 0.2);
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .feature-card:hover {
          transform: translateY(-6px);
          box-shadow: 0 16px 48px rgba(22, 163, 74, 0.15);
        }

        .feature-icon-wrapper {
          width: 56px;
          height: 56px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 18px;
        }

        .feature-icon-wrapper.sage {
          background: linear-gradient(135deg, #22c55e, #16a34a);
          color: white;
        }

        .feature-icon-wrapper.copper {
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
        }

        .feature-icon-wrapper.gold {
          background: linear-gradient(135deg, #4ade80, #22c55e);
          color: white;
        }

        .feature-icon-wrapper.brown {
          background: linear-gradient(135deg, #15803d, #166534);
          color: white;
        }

        .feature-card h3 {
          font-family: 'Playfair Display', serif;
          font-size: 20px;
          color: #14532d;
          margin: 0 0 10px;
        }

        .feature-card p {
          font-size: 14px;
          line-height: 1.7;
          color: #16a34a;
          margin: 0 0 16px;
        }

        .feature-tag {
          display: inline-block;
          padding: 4px 12px;
          background: rgba(220, 252, 231, 0.6);
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
          color: #15803d;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        /* How It Works */
        .how-it-works-section {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(8px);
          border-radius: 24px;
          padding: 40px;
          border: 1px solid rgba(34, 197, 94, 0.2);
          margin-bottom: 32px;
        }

        .steps-container {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          flex-wrap: wrap;
        }

        .step {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 16px 20px;
          background: rgba(240, 253, 244, 0.8);
          border-radius: 14px;
          border: 1px solid rgba(34, 197, 94, 0.25);
        }

        .step-number {
          width: 36px;
          height: 36px;
          background: linear-gradient(135deg, #22c55e, #16a34a);
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 16px;
        }

        .step-content h4 {
          margin: 0;
          font-size: 14px;
          color: #14532d;
          font-weight: 600;
        }

        .step-content p {
          margin: 4px 0 0;
          font-size: 12px;
          color: #22c55e;
        }

        .step-connector {
          width: 24px;
          height: 2px;
          background: linear-gradient(90deg, #86efac, #bbf7d0);
        }

        /* Tech Section */
        .tech-section {
          margin-bottom: 32px;
        }

        .tech-categories {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
        }

        .tech-category {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(8px);
          border-radius: 18px;
          padding: 24px;
          border: 1px solid rgba(34, 197, 94, 0.2);
        }

        .tech-category h4 {
          margin: 0 0 14px;
          font-size: 14px;
          color: #16a34a;
          text-transform: uppercase;
          letter-spacing: 1px;
          font-weight: 600;
        }

        .tech-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .tech-tag {
          padding: 6px 14px;
          background: rgba(220, 252, 231, 0.5);
          border-radius: 20px;
          font-size: 13px;
          color: #15803d;
          font-weight: 500;
        }

        /* Team Section */
        .team-section {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(8px);
          border-radius: 24px;
          padding: 40px;
          text-align: center;
          border: 1px solid rgba(34, 197, 94, 0.2);
        }

        .team-header h2 {
          font-family: 'Playfair Display', serif;
          font-size: 28px;
          color: #14532d;
          margin: 0 0 8px;
        }

        .team-header p {
          color: #22c55e;
          margin: 0 0 32px;
        }

        .team-members {
          display: flex;
          justify-content: center;
          gap: 40px;
          margin-bottom: 32px;
        }

        .team-member {
          text-align: center;
        }

        .member-avatar {
          width: 72px;
          height: 72px;
          background: linear-gradient(135deg, #22c55e, #16a34a);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 22px;
          font-weight: 700;
          color: white;
          margin: 0 auto 12px;
          box-shadow: 0 8px 24px rgba(22, 163, 74, 0.25);
        }

        .team-member h4 {
          margin: 0 0 4px;
          font-size: 16px;
          color: #14532d;
        }

        .team-member p {
          margin: 0;
          font-size: 13px;
          color: #22c55e;
        }

        .project-info {
          padding-top: 24px;
          border-top: 1px solid rgba(34, 197, 94, 0.25);
        }

        .project-badge {
          display: inline-block;
          padding: 8px 20px;
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.2));
          border-radius: 20px;
          font-size: 13px;
          font-weight: 600;
          color: #059669;
        }

        @media (max-width: 768px) {
          .about-hero {
            padding: 32px 24px;
          }

          .about-hero h1 {
            font-size: 36px;
          }

          .hero-stats {
            flex-direction: column;
            gap: 20px;
          }

          .features-grid, .tech-categories {
            grid-template-columns: 1fr;
          }

          .steps-container {
            flex-direction: column;
          }

          .step-connector {
            width: 2px;
            height: 24px;
          }

          .team-members {
            flex-direction: column;
            gap: 24px;
          }
        }
      `}</style>
    </div>
  )
}
