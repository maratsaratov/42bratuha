import React, { useEffect, useRef, memo, useCallback, useState } from 'react';
import { User, Notification } from '../types';
import '../styles/Header.css';
import '../styles/NotificationDropdown.css';
import { BellIcon, UserPlaceholderIcon } from './icons';
import NotificationDropdown from './NotificationDropdown';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  user: User | null;
  onLogoutClick: () => void;
  onNavigate: (path: string) => void;
  currentPath: string;
  activeViewMode: 'list' | 'calendar';
  onSwitchMainView: (view: 'list' | 'calendar') => void;
  onSetRefetchNotifications: (fetchFunc: (() => Promise<void>) | null) => void;
}

const Header: React.FC<HeaderProps> = ({
  user,
  onLogoutClick,
  onNavigate,
  currentPath,
  activeViewMode,
  onSwitchMainView,
  onSetRefetchNotifications,
}) => {
  const { fetchWithAuth, isAuthenticated } = useAuth();

  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const avatarButtonRef = useRef<HTMLButtonElement>(null);

  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notificationDropdownRef = useRef<HTMLDivElement>(null);
  const bellButtonRef = useRef<HTMLButtonElement>(null);

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    if (!user) return;

    try {
      const response = await fetchWithAuth('/api/notifications');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
        setUnreadCount(data.filter((n: Notification) => !n.is_read).length);
      } else {
          console.error("Failed to fetch notifications:", response.status, await response.text());
      }
    } catch (error) {
      console.error("Ошибка при загрузке уведомлений:", error);
    }
  }, [user, isAuthenticated, fetchWithAuth]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
      onSetRefetchNotifications(fetchNotifications);
      return () => onSetRefetchNotifications(null);
  }, [onSetRefetchNotifications, fetchNotifications]);


  const handleMarkAsRead = async () => {
    if (unreadCount === 0) return;
    try {
      await fetchWithAuth('/api/notifications/mark-as-read', { method: 'POST' });
      fetchNotifications();
    } catch (error) {
      console.error("Ошибка при пометке уведомлений как прочитанных:", error);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    setIsNotificationOpen(false);

    if (!notification.is_read) {
        try {
            await fetchWithAuth(`/api/notifications/${notification.id}/mark-as-read`, { method: 'POST' });
            fetchNotifications();
        } catch (error) {
            console.error("Ошибка при пометке уведомления как прочитанного:", error);
        }
    }

    if (notification.event_id) {
      onNavigate(`/events/${notification.event_id}`);
    }
  };

  const userAvatar = user?.avatarUrl || null;
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isUserDropdownOpen && userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node) && avatarButtonRef.current && !avatarButtonRef.current.contains(event.target as Node)) {
        setIsUserDropdownOpen(false);
      }
      if (isNotificationOpen && notificationDropdownRef.current && !notificationDropdownRef.current.contains(event.target as Node) && bellButtonRef.current && !bellButtonRef.current.contains(event.target as Node)) {
        setIsNotificationOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isUserDropdownOpen, isNotificationOpen]);

  const isMainActivePage = currentPath === '/' || currentPath.startsWith('/events/') || currentPath === '/calendar';
  const isArchivePage = currentPath === '/archive';

  return (
    <header className="app-header">
      <div className="app-header-left">
        <a href="/" className="app-header-logo-link">
          <img src="/assets/main/kemsu-logo-2.png" alt="Логотип КемГУ Пульс" className="app-header-logo-img" />
        </a>
      </div>

      <div className="app-header-center">
        <nav className="app-header-nav">
          <button
            className={`app-header-nav-link ${isMainActivePage && activeViewMode === 'list' ? 'active' : ''}`}
            onClick={() => onSwitchMainView('list')}>
              Мероприятия
          </button>
          <button
            className={`app-header-nav-link ${isMainActivePage && activeViewMode === 'calendar' ? 'active' : ''}`}
            onClick={() => onSwitchMainView('calendar')}>
              Расписание
          </button>
          <button
            className={`app-header-nav-link ${isArchivePage ? 'active' : ''}`}
            onClick={() => onNavigate('/archive')}>
              Архив
          </button>
        </nav>
      </div>

      <div className="app-header-right">
        <div className="app-header-user-menu">
          <button
            ref={bellButtonRef}
            onClick={() => setIsNotificationOpen(prev => !prev)}
            className="app-header-action-btn"
            title="Уведомления"
            aria-label="Уведомления"
          >
            <BellIcon />
            {unreadCount > 0 && (
              <span className="app-header-notification-badge">{unreadCount}</span>
            )}
          </button>
          <div ref={notificationDropdownRef}>
            <NotificationDropdown
              isOpen={isNotificationOpen}
              notifications={notifications}
              onMarkAsRead={handleMarkAsRead}
              onNotificationClick={handleNotificationClick}
              hasUnread={unreadCount > 0}
            />
          </div>
        </div>

        <div className="app-header-user-menu" ref={userDropdownRef}>
          <button
            ref={avatarButtonRef}
            className="app-header-user-avatar-button"
            aria-label="Личный кабинет"
            onClick={() => setIsUserDropdownOpen(prev => !prev)}
            aria-expanded={isUserDropdownOpen}
          >
            {userAvatar ? (
              <img src={userAvatar} alt={user?.username || 'Аватар пользователя'} className="header-user-avatar" />
            ) : (
              <UserPlaceholderIcon />
            )}
          </button>
          <div className={`app-header-dropdown ${isUserDropdownOpen ? 'open' : ''}`}>
            {user && <div className="dropdown-user-info">Привет, {user.username}!</div>}
            <a href="/profile" className="dropdown-link" onClick={() => { setIsUserDropdownOpen(false); onNavigate('/profile'); }}>Профиль</a>
            <button
              onClick={() => {
                onLogoutClick();
                setIsUserDropdownOpen(false);
              }}
              className="dropdown-link dropdown-logout-btn">
                Выход
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default memo(Header);