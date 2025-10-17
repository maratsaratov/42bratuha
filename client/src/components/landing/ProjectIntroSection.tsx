import React from 'react';
import '../../styles/landing/ProjectIntroSection.css';

const ProjectIntroSection: React.FC = () => {
  return (
    <section className="landing-project-intro-section landing-section-padding">
      <div className="landing-container">
        <div className="landing-intro-grid">
          <div className="landing-intro-name">
            <h2>КемГУ Пульс</h2>
          </div>
          <div className="landing-intro-explanation">
            <p>
              «КемГУ Пульс» — это ваш навигатор в мире университетских событий! Мы назвали проект так, потому что стремимся отражать 
              динамичный ритм жизни Кемеровского государственного университета. «Пульс» символизирует энергию, движение и постоянное обновление – 
              все то, чем насыщена студенческая и научная деятельность. Будьте в курсе каждого удара этого пульса!
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProjectIntroSection;