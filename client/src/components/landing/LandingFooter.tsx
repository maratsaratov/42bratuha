import React from 'react';
import '../../styles/landing/LandingFooter.css';

const LandingFooter: React.FC = () => {
  return (
    <>
      <footer className="landing-footer-primary">
        <div className="landing-container landing-footer-primary-content">
          <div className="landing-footer-logo-container">
            <img src="/assets/landing/kemsu-logo.png" alt="Логотип Проекта в футере" />
          </div>
          <div className="landing-footer-join">
            <p>Присоединяйтесь к проекту!</p>
          </div>
          <div className="landing-footer-socials">
            <a href="https://t.me/kemsu_live" target="_blank" rel="noopener noreferrer" aria-label="Telegram" title="Наш Telegram канал">
              <img src="/assets/landing/telegram-icon.svg" alt="Telegram" className="social-icon"/>
            </a>
            <a href="https://vk.com/kemsu_ru" target="_blank" rel="noopener noreferrer" aria-label="VK" title="Наша группа ВКонтакте">
              <img src="/assets/landing/vk-icon.svg" alt="VK" className="social-icon"/>
            </a>
          </div>
        </div>
      </footer>
      <footer className="landing-footer-secondary">
        <div className="landing-container landing-footer-secondary-content">
          <p>© {new Date().getFullYear()} КемГУ Пульс. Все права защищены.</p>
          <p>
            <a href="mailto:webkemsu@mail.ru">webkemsu@mail.ru</a>
          </p>
        </div>
      </footer>
    </>
  );
};

export default LandingFooter;