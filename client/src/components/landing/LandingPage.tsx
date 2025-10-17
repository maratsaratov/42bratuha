import React, { useState, useEffect, useCallback } from 'react';
import LandingHeader from './LandingHeader';
import HeroSection from './HeroSection';
import ProjectIntroSection from './ProjectIntroSection';
import AboutGoalBannerSection from './AboutGoalBannerSection';
import FAQSection from './FAQSection';
import PartnersSection from './PartnersSection';
import LandingFooter from './LandingFooter';
import '../../styles/landing/LandingPage.css';

interface LandingPageProps {
  onLoginClick: () => void;
  onRegisterClick: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLoginClick, onRegisterClick }) => {
  const [isHeaderShrunk, setIsHeaderShrunk] = useState(false);

  const handleScroll = useCallback(() => {
    if (window.scrollY > window.innerHeight * 0.1) {
      setIsHeaderShrunk(true);
    } else {
      setIsHeaderShrunk(false);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll]);

  return (
    <div className="landing-page-wrapper">
      <LandingHeader isShrunk={isHeaderShrunk} />
      <HeroSection 
        onLogin={onLoginClick} 
        onRegister={onRegisterClick} 
      />
      
      <main className="landing-main-content">
        <ProjectIntroSection />
        <AboutGoalBannerSection />
        <FAQSection />
        <PartnersSection />
      </main>
      
      <LandingFooter />
    </div>
  );
};

export default LandingPage;