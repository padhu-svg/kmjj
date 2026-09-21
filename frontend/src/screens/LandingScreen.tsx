import { Link } from 'react-router-dom';

export function LandingScreen() {
  return (
    <div className="landing-layout">
      <div className="landing-grid">
        <Link to="/register?counter=R1" className="choice-card choice-card--primary">
          <div className="choice-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
          </div>
          <div className="choice-content">
            <div className="choice-card__title">New Registration</div>
            <p>Register new members on the spot</p>
            <span>Proceed &rarr;</span>
          </div>
        </Link>

        <Link to="/search?counter=V1" className="choice-card choice-card--secondary">
          <div className="choice-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M9 15L11 17L15 13"/></svg>
          </div>
          <div className="choice-content">
            <div className="choice-card__title">Pre-Registered</div>
            <p>Verify attendance for pre-registered members</p>
            <span>Proceed &rarr;</span>
          </div>
        </Link>
      </div>
    </div>
  );
}
