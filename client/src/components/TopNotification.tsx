import React, { useEffect, useState } from 'react';

interface TopNotificationProps {
  notification: {
    title: string;
    message: string;
    eventId?: number;
    key: number;
  } | null;
  onClose: () => void;
  onClick: (eventId?: number) => void;
}

const NOTIFICATION_TIMEOUT = 5000;

const TopNotification: React.FC<TopNotificationProps> = ({ notification, onClose, onClick }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (notification) {
      setIsVisible(true);

      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 500);
      }, NOTIFICATION_TIMEOUT);

      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
    }
  }, [notification, onClose]);

  const handleNotificationClick = () => {
      onClick(notification?.eventId);
      setIsVisible(false);
      setTimeout(onClose, 500);
  };

  if (!notification) {
      return null;
  }

  const notificationClasses = `top-notification ${isVisible ? 'visible' : ''}`;

  return (
    <div className={notificationClasses} onClick={handleNotificationClick}>
      <div className="top-notification-content">
        <strong>{notification.title}</strong>
        <p>{notification.message}</p>
      </div>
        <button className="top-notification-close" onClick={(e) => { e.stopPropagation(); onClose(); }}>×</button>
    </div>
  );
};

export default TopNotification;