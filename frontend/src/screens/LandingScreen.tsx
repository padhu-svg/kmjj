import { Link } from 'react-router-dom';

export function LandingScreen() {
  return (
    <div className="landing-layout">
      <div className="landing-grid">
        <Link to="/register?counter=R1" className="choice-card choice-card--primary">
          <div className="choice-card__title">New registration (on spot)</div>
          <p>Register new members on the spot</p>
          <span>Open counter</span>
        </Link>

        <Link to="/search?counter=V1" className="choice-card choice-card--secondary">
          <div className="choice-card__title">Pre registered</div>
          <p>Verify attendance for pre-registered members</p>
          <span>Open counter</span>
        </Link>
      </div>
    </div>
  );
}
