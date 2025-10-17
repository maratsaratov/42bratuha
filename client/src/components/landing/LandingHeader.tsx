import React from 'react';
import '../../styles/landing/LandingHeader.css';

interface LandingHeaderProps {
  isShrunk: boolean;
}

const LandingHeader: React.FC<LandingHeaderProps> = ({ isShrunk }) => {
  return (
    <header className={`landing-header ${isShrunk ? 'shrunk' : ''}`}>
      <div className="landing-header-logo">
        <img src="/assets/landing/digital-logo.png" alt="Логотип Проекта" />
      </div>
      <nav className="landing-header-sponsors">
        <img src="/assets/landing/kemsu-logo.png" alt="Спонсор 1" className="landing-sponsor-logo" />
      </nav>
    </header>
  );
};

export default LandingHeader;