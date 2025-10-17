import React, { useState } from 'react';

interface FAQItemProps {
  question: string;
  answer: string;
}

const FAQItem: React.FC<FAQItemProps> = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);

  const questionId = `faq-question-${question.toLowerCase().replace(/\s+/g, '-')}`;
  const answerId = `faq-answer-${question.toLowerCase().replace(/\s+/g, '-')}`;


  return (
    <div className={`landing-faq-item ${isOpen ? 'open' : ''}`}>
      <button 
        className="landing-faq-question-btn" 
        onClick={() => setIsOpen(!isOpen)} 
        aria-expanded={isOpen}
        aria-controls={answerId}
        id={questionId}
      >
        {question}
        <span className="landing-faq-icon" aria-hidden="true">{isOpen ? '−' : '+'}</span>
      </button>
      <div 
        className="landing-faq-answer" 
        id={answerId}
        role="region"
        aria-labelledby={questionId}
        hidden={!isOpen}
      >
        {isOpen && <p>{answer}</p>} 
      </div>
    </div>
  );
};

export default FAQItem;