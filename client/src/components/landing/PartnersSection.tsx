import React from 'react';
import '../../styles/landing/PartnersSection.css';

const PartnersSection: React.FC = () => {
  return (
    <section className="landing-partners-section landing-section-padding">
      <div className="landing-container">
        <h2 className="landing-section-title">ПАРТНЕРЫ ПРОЕКТА</h2>
        <div className="landing-partners-grid">
          <div className="landing-partner-item">
            <a href="https://kemsu.ru/" target="_blank" rel="noopener noreferrer" className="partner-link">
              <img src="/assets/landing/kemsu-logo.png" alt="Логотип КемГУ" />
            </a>
            <p>Кемеровский государственный университет – сердце нашего проекта «КемГУ Пульс». Мы гордимся тем, что помогаем освещать насыщенную жизнь ведущего вуза Кузбасса!</p> {/* <--- ОБНОВЛЕНО */}
          </div>
          <div className="landing-partner-item">
            <a href="https://kemsu.ru/university/structure/institutes/Institute-of-digit/kafedra-tsifrovykh-tekhnologiy/" target="_blank" rel="noopener noreferrer" className="partner-link">
              <img src="/assets/landing/digital-logo.png" alt="Логотип Студенческого клуба КемГУ" />
            </a>
            <p>Студенческий клуб КемГУ – генератор самых ярких и креативных событий! Благодаря их поддержке «КемГУ Пульс» всегда наполнен интересными мероприятиями для студентов.</p> {/* <--- ОБНОВЛЕНО */}
          </div>
        </div>
      </div>
    </section>
  );
};

export default PartnersSection;