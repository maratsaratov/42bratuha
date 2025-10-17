import React from 'react';
import '../../styles/landing/AboutGoalBannerSection.css';

const AboutGoalBannerSection: React.FC = () => {
  return (
    <section className="landing-agb-section landing-section-padding">
      <div className="landing-container">
        <div className="landing-agb-grid">
          <div className="landing-agb-item">
            <h3>О проекте</h3>
            <p>«КемГУ Пульс» – это централизованная платформа, объединяющая информацию обо всех мероприятиях Кемеровского государственного университета: от научных конференций и лекций до спортивных соревнований, культурных фестивалей и студенческих инициатив. </p>
          </div>
          <div className="landing-agb-item">
            <h3>Наша цель</h3>
            <p>Сделать жизнь студентов, преподавателей и сотрудников КемГУ более насыщенной и интересной, предоставив удобный инструмент для поиска событий. Мы хотим, чтобы вы всегда были в курсе самого важного и не пропускали уникальные возможности для развития, общения и отдыха.</p>
          </div>
          <div className="landing-agb-item landing-agb-banner">
            <img src="/assets/landing/banner-promo.png" alt="Яркие моменты жизни КемГУ" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutGoalBannerSection;