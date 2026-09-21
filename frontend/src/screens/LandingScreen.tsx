import { Link } from 'react-router-dom';

export function LandingScreen() {
  return (
    <div className="landing-layout">
      <div className="landing-grid">
        <Link to="/register?counter=R1" className="choice-card choice-card--primary">
          <div className="choice-card__eyebrow">Registration</div>
          <div className="choice-card__title">On-Spot Registration</div>
          <p>New registrations only</p>
          <span>Open counter</span>
        </Link>

        <Link to="/search?counter=V1" className="choice-card choice-card--secondary">
          <div className="choice-card__eyebrow">Verification</div>
          <div className="choice-card__title">Attendance Check</div>
          <p>Search members and confirm presence</p>
          <span>Open counter</span>
        </Link>
      </div>
    </div>
  );
}
