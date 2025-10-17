import React from 'react';
import '../../styles/landing/HeroSection.css';

interface HeroSectionProps {
  onLogin: () => void;
  onRegister: () => void;
}

const HeroSection: React.FC<HeroSectionProps> = ({ onLogin, onRegister }) => {
  return (
    <section className="landing-hero-section">
      <div className="landing-hero-content">
        <h1>Мероприятия КемГУ</h1>
        <div className="landing-hero-buttons">
          <button onClick={onLogin} className="btn-landing btn-landing-primary">Войти</button>
          <button onClick={onRegister} className="btn-landing btn-landing-secondary">Зарегистрироваться</button>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;