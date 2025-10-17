import React, { useEffect, useState, useCallback, useRef } from 'react';
import io, { Socket } from 'socket.io-client';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';

import { useDebounce } from '../hooks/useDebounce';
import { useAuth } from '../context/AuthContext';
import { useEvents } from '../hooks/useEvents';
import { useEventActions } from '../hooks/useEventActions';
import { useParticipation } from '../hooks/useParticipation';

import '../index.css';
import '../styles/App.css';
import '../styles/common.css';
import '../styles/Header.css';
import '../styles/Modal.css';
import '../styles/EventList.css';
import '../styles/EventDetailModal.css';
import '../styles/EventFormModal.css';
import '../styles/ControlBar.css';
import '../styles/FilterModal.css';
import '../styles/ConfirmModal.css';
import '../styles/EventCalendar.css';
import '../styles/TopNotification.css';
import '../styles/BottomNavigationBar.css';
import '../styles/MoreMenuModal.css';

import Header from '../components/Header';
import EventFilterModal from '../components/EventFilter';
import ControlBar from '../components/ControlBar';
import EventList from '../components/EventList';
import EventCalendarView from '../components/EventCalendarView';
import EventDetailModal from '../components/EventDetailModal';
import EventFormModal from '../components/EventFormModal';
import ConfirmModal from '../components/ConfirmModal';
import TopNotification from '../components/TopNotification';
import BottomNavigationBar from '../components/BottomNavigationBar';
import MoreMenuModal from '../components/MoreMenuModal';
import { EventsIconBottomNav, CalendarIconBottomNav, ArchiveIconBottomNav } from '../components/icons';
import { EventFilters } from '../types';

const SOCKET_SERVER_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';
const NOTIFICATION_TIMEOUT = 5000;



type NotificationData = {
  title: string;
  message: string;
  eventId?: number;
  key: number;
} | null;

interface MainPageProps {
    status: 'active' | 'archive';
    activeViewMode: 'list' | 'calendar';
    onSwitchMainView: (view: 'list' | 'calendar') => void;
    onNavigate: (to: string, options?: { replace?: boolean; state?: any }) => void;
}

const MainPage: React.FC<MainPageProps> = ({ status, activeViewMode, onSwitchMainView, onNavigate }) => {
    const { currentUser, logout, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const { eventId: eventIdParam } = useParams<{ eventId?: string }>();

    const [filters, setFilters] = useState<EventFilters>({});
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 400);

    const { events, isLoading: isLoadingEvents, error: eventError, refetch: fetchEvents } = useEvents(filters, debouncedSearchTerm, status);

    const {
        selectedEvent, isDetailModalOpen, eventToEdit, isFormModalOpen, isConfirmModalOpen, isDeleting,
        handleViewDetails,
        handleCloseDetailModal, handleOpenAddForm, handleOpenEditForm,
        handleCloseFormModal, confirmArchiveAction, confirmDeleteAction, handleCloseConfirmModal,
        handleSaveEvent, handleImageDelete, handleInitiateArchive, handleInitiateRestore, handleInitiateHardDelete,
        confirmActionType,
    } = useEventActions(fetchEvents);

    const { registerForEvent, unregisterFromEvent, fetchUserParticipations } = useParticipation();

    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

    const [topNotification, setTopNotification] = useState<NotificationData>(null);
    const socketRef = useRef<Socket | null>(null);

    const showTopNotification = useCallback((title: string, message: string, eventId?: number) => {
        if (!currentUser?.notifications_enabled) {
            console.log("Уведомления отключены пользователем, пропуск push-уведомления.");
            return;
        }
        setTopNotification({ title, message, eventId, key: Date.now() });
    }, [currentUser?.notifications_enabled]);

    const handleCloseTopNotification = useCallback(() => {
        setTopNotification(null);
    }, []);

    const handleTopNotificationClick = useCallback((eventId?: number) => {
        if (eventId) {
            const isOnActiveEventsList = location.pathname === '/' || location.pathname.startsWith('/events/');
            const isOnCalendarView = location.pathname === '/calendar';
            const isOnArchive = location.pathname === '/archive';

            if (isOnArchive || isOnCalendarView || !isOnActiveEventsList) {
                onNavigate('/', { state: { openEventId: eventId } });
            } else {
                navigate(location.pathname, { replace: true, state: { openEventId: eventId } });
            }
        }
        handleCloseTopNotification();
        window.focus();
    }, [handleCloseTopNotification, navigate, location.pathname, onNavigate]);

    useEffect(() => {
        const eventIdToOpen = location.state?.openEventId || (eventIdParam ? parseInt(eventIdParam) : undefined);

        if (eventIdToOpen) {
            if (events.length > 0 || !isLoadingEvents) {
                const eventToShow = events.find(e => e.id === eventIdToOpen);
                if (eventToShow) {
                    handleViewDetails(eventToShow);
                    navigate(location.pathname, { replace: true, state: { ...location.state, openEventId: undefined } });
                } else if (!isLoadingEvents && !eventError) {
                    console.warn(`Event with ID ${eventIdToOpen} not found in current view. It might be in another section (e.g., archive) or doesn't exist.`);
                    navigate(location.pathname, { replace: true, state: { ...location.state, openEventId: undefined } });
                }
            }
        }
    }, [location.state, eventIdParam, events, handleViewDetails, navigate, location.pathname, isLoadingEvents, eventError]);

    useEffect(() => {
        let timer: NodeJS.Timeout | null = null;
        if (topNotification) {
            timer = setTimeout(() => {
                handleCloseTopNotification();
            }, NOTIFICATION_TIMEOUT);
        }
        return () => {
            if(timer) clearTimeout(timer);
        };
    }, [topNotification, handleCloseTopNotification]);

    const fetchNotificationsInHeaderRef = useRef<(() => Promise<void>) | null>(null);
    const setFetchNotificationsInHeader = useCallback((fetchFunc: (() => Promise<void>) | null) => {
        fetchNotificationsInHeaderRef.current = fetchFunc;
    }, []);

    useEffect(() => {
        if (isAuthenticated) {
            if (!socketRef.current) {
                const newSocket = io(SOCKET_SERVER_URL, { transports: ['websocket'] });

                newSocket.on('connect_error', (error) => {
                    console.error('Ошибка подключения WebSocket:', error);
                    toast.error("Не удалось подключиться к серверу уведомлений.");
                });

                newSocket.on('new_event_added', (data) => {
                    console.log("Socket: New event added received", data);
                    showTopNotification("Новое мероприятие!", `Добавлено: "${data.eventTitle}".`, data.eventId);
                    if (fetchNotificationsInHeaderRef.current) {
                        fetchNotificationsInHeaderRef.current();
                    }
                });

                newSocket.on('upcoming_event', (data) => {
                    console.log("Socket: Upcoming event general received", data);
                    showTopNotification(data.title, data.message, data.eventId);
                    if (fetchNotificationsInHeaderRef.current) {
                        fetchNotificationsInHeaderRef.current();
                    }
                });

                newSocket.on('upcoming_event_for_user', (data) => {
                    console.log("Socket: Upcoming event for user received", data);
                    showTopNotification(data.title, data.message, data.eventId);
                    if (fetchNotificationsInHeaderRef.current) {
                        fetchNotificationsInHeaderRef.current();
                    }
                });

                newSocket.on('connect', () => {
                    console.log("Socket connected, attempting authentication...");
                    const token = localStorage.getItem('authToken');
                    if (token) {
                        newSocket.emit('authenticate_user', { token });
                    } else {
                        console.log("No auth token found for socket authentication.");
                    }
                });

                newSocket.on('auth_success', (data) => {
                    console.log("Socket authentication successful:", data);
                });
                newSocket.on('auth_failure', (data) => {
                    console.error("Socket authentication failed:", data);
                    toast.error("Ошибка аутентификации WebSocket.");
                });

                socketRef.current = newSocket;
            }
        } else if (!isAuthenticated && socketRef.current) {
            console.log("User logged out or not authenticated, disconnecting socket.");
            socketRef.current.disconnect();
            socketRef.current = null;
        }
        return () => {
            if (socketRef.current) {
                console.log("Cleaning up socket connection.");
                socketRef.current.disconnect();
                socketRef.current = null;
            }
        };
    }, [isAuthenticated, showTopNotification, setFetchNotificationsInHeader]);


    const handleApplyFilters = useCallback((filtersToApply: EventFilters) => {
        setFilters(filtersToApply);
        setIsFilterModalOpen(false);
    }, []);

    const handleResetFilters = useCallback(() => {
        setFilters({});
        setSearchTerm('');
        setIsFilterModalOpen(false);
    }, []);

    const handleParticipationToggle = async (eventId: number, isParticipating: boolean) => {
        try {
            if (isParticipating) {
                await unregisterFromEvent(eventId);
            } else {
                await registerForEvent(eventId);
            }
            fetchEvents();
            fetchUserParticipations();
        } catch (error) {
            console.error("Participation toggle failed:", error);
        }
    };

    return (
      <div className="app-container">
            <Header
                user={currentUser}
                onLogoutClick={logout}
                onNavigate={onNavigate}
                currentPath={location.pathname}
                activeViewMode={activeViewMode}
                onSwitchMainView={onSwitchMainView}
                onSetRefetchNotifications={setFetchNotificationsInHeader}
            />
            <div className="app-main-layout">
            <main className={`app-content-area ${ (typeof window !== 'undefined' && window.innerWidth <= 768) ? 'has-bottom-nav' : ''}`}>
                <TopNotification notification={topNotification} onClose={handleCloseTopNotification} onClick={handleTopNotificationClick} />
                <ControlBar
                    searchTerm={searchTerm}
                    onSearchChange={(e) => setSearchTerm(e.target.value)}
                    onFilterClick={() => setIsFilterModalOpen(true)}
                    onAddClick={handleOpenAddForm}
                    isAdmin={currentUser?.is_admin ?? false}
                    isFiltered={Object.values(filters).some(Boolean)}
                    isArchiveMode={status === 'archive'}
                />
                {activeViewMode === 'list' ? (
                    <EventList
                        events={events}
                        isLoading={isLoadingEvents}
                        error={eventError}
                        onViewDetails={handleViewDetails}
                        onEdit={currentUser?.is_admin ? handleOpenEditForm : undefined}
                        onDelete={currentUser?.is_admin ? handleInitiateArchive : undefined}
                        onRestore={currentUser?.is_admin && status === 'archive' ? handleInitiateRestore : undefined}
                        onHardDelete={currentUser?.is_admin && status === 'archive' ? handleInitiateHardDelete : undefined}
                        onParticipationToggle={isAuthenticated && !currentUser?.is_admin ? handleParticipationToggle : undefined}
                        isAdmin={currentUser?.is_admin ?? false}
                        isArchiveMode={status === 'archive'}
                    />
                ) : (
                    <EventCalendarView
                        events={events}
                        isLoading={isLoadingEvents}
                        error={eventError}
                        onViewDetails={handleViewDetails}
                        onParticipationToggle={isAuthenticated && !currentUser?.is_admin ? handleParticipationToggle : undefined}
                    />
                )}
            </main>
            </div>
            <BottomNavigationBar
                activeViewMode={activeViewMode}
                currentPath={location.pathname}
                onMoreClick={() => setIsMoreMenuOpen(true)}
                EventsIconComp={EventsIconBottomNav}
                CalendarIconComp={CalendarIconBottomNav}
                ArchiveIconComp={ArchiveIconBottomNav}
                onNavigate={onNavigate}
                onSwitchMainView={onSwitchMainView}
            />

            <MoreMenuModal
                isOpen={isMoreMenuOpen}
                onClose={() => setIsMoreMenuOpen(false)}
                onLogoutClick={logout}
                onProfileClick={() => navigate('/profile')}
            />
            <EventDetailModal
                isOpen={isDetailModalOpen}
                onClose={handleCloseDetailModal}
                event={selectedEvent}
                onEventUpdate={fetchEvents}
            />
            <EventFormModal isOpen={isFormModalOpen} onClose={handleCloseFormModal} onSubmit={handleSaveEvent} eventToEdit={eventToEdit} onDeleteImage={handleImageDelete} />
            <EventFilterModal isOpen={isFilterModalOpen} onClose={() => setIsFilterModalOpen(false)} initialFilters={filters} onApplyFilters={handleApplyFilters} onResetFilters={handleResetFilters} />
            <ConfirmModal
                isOpen={isConfirmModalOpen}
                onClose={handleCloseConfirmModal}
                onConfirm={confirmActionType === 'archive' ? confirmArchiveAction : (confirmActionType === 'restore' ? confirmArchiveAction : confirmDeleteAction)}
                title={
                    confirmActionType === 'archive' ? "Подтвердить архивирование" :
                    confirmActionType === 'restore' ? "Подтвердить восстановление" :
                    "Подтвердить удаление навсегда"
                }
                message={
                    confirmActionType === 'archive' ? "Вы уверены, что хотите отправить это мероприятие в архив? Оно будет доступно в разделе «Архив»." :
                    confirmActionType === 'restore' ? "Вы уверены, что хотите восстановить это мероприятие из архива? Оно снова будет отображаться в списке активных." :
                    "Вы уверены, что хотите удалить это мероприятие навсегда? Это действие необратимо."
                }
                confirmText={
            confirmActionType === 'archive' ? "Архивировать" :
            confirmActionType === 'restore' ? "Восстановить" :
            "Удалить навсегда"
                }
                cancelText="Отмена"
                isLoading={isDeleting}
            />
      </div>
    );
};

export default MainPage;