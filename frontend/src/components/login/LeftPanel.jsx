import React from 'react';

const LeftPanel = () => {
  return (
    <div className="left-panel">
      <div className="brand-image">
        <img src="/assets/logo1.png" alt="Studyverse" />
      </div>

      <div className="left-content">
        <div className="left-illustration">
          <div className="illus-label">Platform at a glance</div>
          <div className="stats-row">
            <div className="stat-box">
              <div className="stat-num">10K+</div>
              <div className="stat-lbl">Students</div>
            </div>
            <div className="stat-box">
              <div className="stat-num">2,400</div>
              <div className="stat-lbl">Practice Tests</div>
            </div>
            <div className="stat-box">
              <div className="stat-num">98%</div>
              <div className="stat-lbl">Satisfaction</div>
            </div>
          </div>
        </div>

        <div className="left-tagline">
          Crack JEE with <em>confidence</em> and clarity.
        </div>
        <div className="left-desc">
          Studyverse brings together smart practice, expert faculty, and real-time analytics — everything you need for your JEE journey.
        </div>

        <div className="features">
          <div className="feat">
            <div className="feat-dot"></div>
            <div className="feat-text"><strong>Adaptive mock tests</strong> — personalized to your weak areas</div>
          </div>
          <div className="feat">
            <div className="feat-dot"></div>
            <div className="feat-text"><strong>Live doubt sessions</strong> — expert faculty, real-time</div>
          </div>
          <div className="feat">
            <div className="feat-dot"></div>
            <div className="feat-text"><strong>Detailed analytics</strong> — track progress, fix gaps fast</div>
          </div>
          <div className="feat">
            <div className="feat-dot"></div>
            <div className="feat-text"><strong>PYQ archives</strong> — 15+ years of solved papers</div>
          </div>
        </div>
      </div>

      <div className="left-footer">© 2025 Studyverse. All rights reserved.</div>
    </div>
  );
};

export default LeftPanel;
