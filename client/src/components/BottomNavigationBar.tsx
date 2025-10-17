import React, { JSX, memo } from 'react';
import '../styles/BottomNavigationBar.css';
import { MoreIcon } from './icons';

interface NavItemProps {
  icon: JSX.Element;
  text: string;
  isActive?: boolean;
  onClick?: (event: React.MouseEvent<HTMLElement>) => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon, text, isActive, onClick }) => {
  const commonProps = {
    className: `bottom-nav-item ${isActive ? 'active' : ''}`,
    onClick: onClick,
  };

  return (
    <button {...commonProps} type="button" aria-label={text}>
      <span className="bottom-nav-icon-wrapper">{icon}</span>
      <span className="bottom-nav-text">{text}</span>
    </button>
  );
};

interface BottomNavigationBarProps {
  activeViewMode: 'list' | 'calendar';
  currentPath: string;
  onMoreClick: (event: React.MouseEvent<HTMLElement>) => void;
  EventsIconComp: React.FC;
  CalendarIconComp: React.FC;
  ArchiveIconComp: React.FC;
  onNavigate: (path: string) => void;
  onSwitchMainView: (view: 'list' | 'calendar') => void;
}

const BottomNavigationBar: React.FC<BottomNavigationBarProps> = ({
    activeViewMode,
    currentPath,
    onMoreClick,
    EventsIconComp,
    CalendarIconComp,
    ArchiveIconComp,
    onNavigate,
    onSwitchMainView
}) => {
  const isMainActivePage = currentPath === '/' || currentPath.startsWith('/events/') || currentPath === '/calendar';
  const isArchivePage = currentPath === '/archive';

  return (
    <nav className="bottom-navigation-bar">
      <NavItem
        icon={<EventsIconComp />}
        text="Мероприятия"
        isActive={isMainActivePage && activeViewMode === 'list'}
        onClick={() => onSwitchMainView('list')}
      />
      <NavItem
        icon={<CalendarIconComp />}
        text="Расписание"
        isActive={isMainActivePage && activeViewMode === 'calendar'}
        onClick={() => onSwitchMainView('calendar')}
      />
      <NavItem
        icon={<ArchiveIconComp />}
        text="Архив"
        isActive={isArchivePage}
        onClick={() => onNavigate('/archive')}
      />
      <NavItem
        icon={<MoreIcon />}
        text="Еще"
        onClick={onMoreClick}
      />
    </nav>
  );
};

export default memo(BottomNavigationBar);