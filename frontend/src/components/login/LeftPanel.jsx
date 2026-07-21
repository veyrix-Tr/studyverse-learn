import React from 'react';

const LeftPanel = () => {
  return (
    <div className="left-panel">
      <div className="brand-image">
        <img src="/assets/logo1.png" alt="Studyverse" />
      </div>

      {/* Stats Container */}
      <div className="stats-container">
        <div className="stat-box">
          <div className="stat-number">1000+</div>
          <div className="stat-label">STUDENTS</div>
        </div>
        <div className="stat-box">
          <div className="stat-number">90</div>
          <div className="stat-label">DAY<br />GUARANTEE</div>
        </div>
        <div className="stat-box">
          <div className="stat-number">100%</div>
          <div className="stat-label">PERSONALISED</div>
        </div>
      </div>

      {/* Tagline Section */}
      <div className="tagline-section">
        <h2>
          Study smarter.<br />
          <span className="highlight">Score higher.</span>
        </h2>
      </div>

      {/* Description */}
      <p className="description">
        JEE · NEET · Boards · Foundation — all programs, one personalised platform.
      </p>

      {/* Features List */}
      <div className="features-list">
        <div className="feature-item">
          <div className="feature-dot"></div>
          <div className="feature-content">
            <div className="feature-title-row">
              <div className="feature-title">Personalised diagnostic test</div>
              <div className="feature-badge">Free</div>
            </div>
            <div className="feature-desc">10 minutes. See your exact weak areas.</div>
          </div>
        </div>

        <div className="feature-item">
          <div className="feature-dot"></div>
          <div className="feature-content">
            <div className="feature-title-row">
              <div className="feature-title">Topic weakness map</div>
              <div className="feature-badge">Free</div>
            </div>
            <div className="feature-desc">Topics ranked by urgency and exam weight.</div>
          </div>
        </div>

        <div className="feature-item">
          <div className="feature-dot"></div>
          <div className="feature-content">
            <div className="feature-title-row">
              <div className="feature-title">Personalised study plan</div>
              <div className="feature-badge">Free</div>
            </div>
            <div className="feature-desc">Built around your gaps and exam date.</div>
          </div>
        </div>

        <div className="feature-item">
          <div className="feature-dot"></div>
          <div className="feature-content">
            <div className="feature-title-row">
              <div className="feature-title">1-to-1 sessions with faculty</div>
            </div>
            <div className="feature-desc">Matched to your subject and level.</div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="left-footer">© 2025 Studyverse. All rights reserved.</div>
    </div>
  );
};

export default LeftPanel;