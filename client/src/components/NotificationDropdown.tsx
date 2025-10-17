import React from 'react';
import { Notification } from '../types';
import { formatSingleDateTime } from '../utils/dateUtils';
import '../styles/NotificationDropdown.css';

interface NotificationDropdownProps {
  isOpen: boolean;
  notifications: Notification[];
  onMarkAsRead: () => void;
  onNotificationClick: (notification: Notification) => void;
  hasUnread: boolean;
}

const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  isOpen,
  notifications,
  onMarkAsRead,
  onNotificationClick,
  hasUnread,
}) => {
  if (!isOpen) return null;

  return (
    <div className={`notification-dropdown ${isOpen ? 'open' : ''}`}>
      <div className="notification-dropdown-header">
        <h4>Уведомления</h4>
        <button
          onClick={onMarkAsRead}
          className="mark-as-read-btn"
          disabled={!hasUnread}
        >
          Отметить все как прочитанные
        </button>
      </div>
      {notifications.length > 0 ? (
        <ul className="notification-list">
          {notifications.map((notif) => (
            <li
              key={notif.id}
              className={`notification-item ${!notif.is_read ? 'unread' : ''}`}
              onClick={() => onNotificationClick(notif)}
            >
              <p>{notif.message}</p>
              <span className="notification-item-time">
                {formatSingleDateTime(notif.created_at)}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="no-notifications">
          <p>Новых уведомлений нет</p>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;