import React, { useEffect, useState, useCallback } from 'react';
import 'react-toastify/dist/ReactToastify.css';
import { useDebounce } from './hooks/useDebounce';

import './styles/global.css';
import './styles/common.css';
import './styles/Header.css';
import './styles/Modal.css';
import './styles/EventList.css';
import './styles/EventDetailModal.css';
import './styles/EventFormModal.css';
import './styles/ControlBar.css';
import './styles/FilterModal.css';
import './styles/ConfirmModal.css';
import './styles/EventCalendar.css';

import Header from './components/Header';
import AuthModal from './components/AuthModal';
import EventFilterModal from './components/EventFilter';
import ControlBar from './components/ControlBar';
import EventList from './components/EventList';
import EventCalendarView from './components/EventCalendarView';
import EventDetailModal from './components/EventDetailModal';
import EventFormModal from './components/EventFormModal';
import ConfirmModal from './components/ConfirmModal';
import { ToastContainer, toast } from 'react-toastify';
import { fetchWithAuth as fetchWithAuthHelper } from './utils/fetchWithAuth';
import { User, Event, EventFilters, EventFormData } from './types';

const App = () => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [authToken, setAuthToken] = useState<string | null>(null);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [authLoading, setAuthLoading] = useState<boolean>(true);
    const [isRegisterOpen, setIsRegisterOpen] = useState(false);
    const [isLoginOpen, setIsLoginOpen] = useState(false);
    const [authError, setAuthError] = useState<string | null>(null);

    const [events, setEvents] = useState<Event[]>([]);
    const [isLoadingEvents, setIsLoadingEvents] = useState<boolean>(false);
    const [eventError, setEventError] = useState<string | null>(null);
    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [eventToEdit, setEventToEdit] = useState<Event | null>(null);

    const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
    const [filters, setFilters] = useState<EventFilters>({});
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearchTerm = useDebounce(searchTerm, 400);

    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [eventToDeleteId, setEventToDeleteId] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

    const handleLogout = useCallback(() => {
        localStorage.removeItem('authToken');
        setAuthToken(null);
        setCurrentUser(null);
        setIsAuthenticated(false);
        setAuthError(null);
        setEvents([]);
        setFilters({});
        setSearchTerm('');
        toast.info("Вы вышли из системы.");
    }, []);

    const fetchWithAuth = useCallback(async (url: string, options: RequestInit = {}) => {
        try {
            return await fetchWithAuthHelper(url, options, handleLogout);
        } catch (error) {
            if (error instanceof Error && error.message.includes('401')) {

            } else if (error instanceof Error) {
                 toast.error(`Сетевая ошибка: ${error.message}`);
            } else {
                 toast.error("Неизвестная сетевая ошибка.");
            }
            throw error;
        }
    }, [handleLogout]);

    useEffect(() => {
        const tokenFromStorage = localStorage.getItem('authToken');
        if (tokenFromStorage) {
            setAuthToken(tokenFromStorage);
        } else {
            setAuthLoading(false);
        }
    }, []);

    useEffect(() => {
        if (authToken) {
            setAuthLoading(true);
            fetchWithAuth('/api/me')
                .then(async response => {
                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({}));
                         if (response.status !== 401) {
                             throw new Error(errorData.error || `Ошибка проверки пользователя: ${response.status}`);
                         }
                         return null;
                    }
                    return response.json();
                })
                .then(data => {
                    if (data && data.user) {
                        setCurrentUser(data.user);
                        setIsAuthenticated(true);
                        setAuthError(null);
                    } else if (!localStorage.getItem('authToken')) {
                        setIsAuthenticated(false);
                        setCurrentUser(null);
                    }
                })
                .catch((err) => {
                     if (!(err instanceof Error && err.message.includes('401 Unauthorized'))) {
                        console.error("Error fetching /api/me:", err);
                     }
                })
                .finally(() => { setAuthLoading(false); });
        } else {
             setIsAuthenticated(false);
             setCurrentUser(null);
             setAuthLoading(false);
             setEvents([]);
        }
    }, [authToken, fetchWithAuth]);

    const fetchEvents = useCallback(async (currentFilters: EventFilters, currentSearchTerm: string) => {
        if (!isAuthenticated) {
            setEvents([]);
            return;
        };

        setIsLoadingEvents(true);
        setEventError(null);

        const queryParams = new URLSearchParams();
        Object.entries(currentFilters).forEach(([key, value]) => {
            if (value) {
                queryParams.append(key, value as string);
            }
        });
        if (currentSearchTerm) {
            queryParams.append('search', currentSearchTerm);
        }

        const queryString = queryParams.toString();
        const url = `/api/events${queryString ? `?${queryString}` : ''}`;

        console.log(`Fetching events with URL: ${url}`);

        try {
            const response = await fetchWithAuth(url);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || 'Не удалось загрузить мероприятия');
            }
            const data: Event[] = await response.json();
            setEvents(data);
        } catch (err) {
             if (!(err instanceof Error && err.message.includes('401'))) {
                 const message = err instanceof Error ? err.message : 'Ошибка при загрузке мероприятий';
                 console.error("Error in fetchEvents:", err);
                 setEventError(message);
                 setEvents([]);
             }
        } finally {
            setIsLoadingEvents(false);
        }
    }, [fetchWithAuth, isAuthenticated]);

    useEffect(() => {
        if (isAuthenticated) {
            fetchEvents(filters, debouncedSearchTerm);
        } else {
             setEvents([]);
        }
    }, [isAuthenticated, fetchEvents, filters, debouncedSearchTerm]);

    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(event.target.value);
    };

    const handleOpenFilterModal = () => setIsFilterModalOpen(true);
    const handleCloseFilterModal = () => setIsFilterModalOpen(false);

    const handleApplyFilters = useCallback((filtersToApply: EventFilters) => {
        setFilters(filtersToApply);
        handleCloseFilterModal();
    }, []);

    const handleResetFilters = useCallback(() => {
        setFilters({});
        setSearchTerm('');
        handleCloseFilterModal();
    }, []);

    const handleOpenAddForm = () => {
        setEventToEdit(null);
        setIsFormModalOpen(true);
    };
     const handleOpenEditForm = (event: Event) => {
        setEventToEdit(event);
        setIsFormModalOpen(true);
    };
    const handleCloseDetailModal = () => {
        setIsDetailModalOpen(false);
        setSelectedEvent(null);
    };
     const handleCloseFormModal = () => {
        setIsFormModalOpen(false);
        setEventToEdit(null);
    };
     const handleViewDetails = (event: Event) => {
        setSelectedEvent(event);
        setIsDetailModalOpen(true);
    };

    const handleDeleteEvent = (eventId: number) => {
        setEventToDeleteId(eventId);
        setIsConfirmModalOpen(true);
    };

    const confirmDeleteAction = async () => {
        if (eventToDeleteId === null) return;

        setIsDeleting(true);

        try {
            const response = await fetchWithAuth(`/api/events/${eventToDeleteId}`, { method: 'DELETE' });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || 'Ошибка удаления мероприятия');
            }
            fetchEvents(filters, searchTerm);
            toast.success("Мероприятие успешно удалено!");
            if (selectedEvent?.id === eventToDeleteId) {
                handleCloseDetailModal();
            }
        } catch (err) {
            if (!(err instanceof Error && err.message.includes('401'))) {
                 const message = err instanceof Error ? err.message : 'Произошла ошибка удаления';
                 toast.error(message);
            }
        } finally {
            setIsConfirmModalOpen(false);
            setEventToDeleteId(null);
            setIsDeleting(false);
        }
    };

    const cancelDeleteAction = () => {
        setIsConfirmModalOpen(false);
        setEventToDeleteId(null);
    };

    const handleSaveEvent = async (formData: EventFormData) => {
        const url = eventToEdit ? `/api/events/${eventToEdit.id}` : '/api/events';
        const method = eventToEdit ? 'PUT' : 'POST';
        try {
            const response = await fetchWithAuth(url, { method, body: JSON.stringify(formData) });
            if (!response.ok) {
                 const errorData = await response.json().catch(() => ({}));
                 throw new Error(errorData.error || `Ошибка ${eventToEdit ? 'обновления' : 'создания'} мероприятия`);
            }
            fetchEvents(filters, searchTerm);
            toast.success(eventToEdit ? "Мероприятие успешно обновлено!" : "Мероприятие успешно создано!");
            handleCloseFormModal();
        } catch (err) {
             if (!(err instanceof Error && err.message.includes('401'))) {
                 const message = err instanceof Error ? err.message : 'Произошла ошибка сохранения';
                 toast.error(message);
             }
             throw err;
        }
    };

    const handleRegister = async (formData: Record<string, string>) => {
         setAuthError(null);
        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Ошибка регистрации');
            }
            setIsRegisterOpen(false);
            toast.success(data.message || 'Регистрация успешна! Теперь вы можете войти.');
            setIsLoginOpen(true);
        } catch (err) {
             const message = err instanceof Error ? err.message : 'Произошла неизвестная ошибка';
             setAuthError(message);
             toast.error(message);
             throw err;
        }
    };

    const handleLogin = async (formData: Record<string, string>) => {
         setAuthError(null);
        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Ошибка входа');
            }
            if (!data.access_token || !data.user) {
                 throw new Error('Сервер не вернул токен или данные пользователя');
            }
            localStorage.setItem('authToken', data.access_token);
            setAuthToken(data.access_token);
            setIsLoginOpen(false);
            toast.success(`Добро пожаловать, ${data.user.username}!`);
        } catch (err) {
             const message = err instanceof Error ? err.message : 'Произошла неизвестная ошибка';
             setAuthError(message);
             toast.error(message);
             throw err;
        }
    };


    if (authLoading) {
        return <div style={{ textAlign: 'center', margin: '4rem 0', fontSize: '1.2em' }}>Загрузка...</div>;
    }

    const isFiltered = Object.values(filters).some(value => value !== '' && value !== undefined && value !== null);

    return (
      <div className="container">
          <Header
              isAuthenticated={isAuthenticated}
              user={currentUser}
              onLoginClick={() => setIsLoginOpen(true)}
              onRegisterClick={() => setIsRegisterOpen(true)}
              onLogoutClick={handleLogout}
          />

          {isAuthenticated && (
              <ControlBar
                  searchTerm={searchTerm}
                  onSearchChange={handleSearchChange}
                  onFilterClick={handleOpenFilterModal}
                  onAddClick={handleOpenAddForm}
                  isAdmin={currentUser?.is_admin ?? false}
                  isFiltered={isFiltered}
                  viewMode={viewMode}
                  onViewModeChange={setViewMode}
              />
          )}

          {isAuthenticated ? (
              <>
                {viewMode === 'list' && (
                    <EventList
                        events={events}
                        isLoading={isLoadingEvents}
                        error={eventError}
                        onViewDetails={handleViewDetails}
                        onEdit={currentUser?.is_admin ? handleOpenEditForm : undefined}
                        onDelete={currentUser?.is_admin ? handleDeleteEvent : undefined}
                        isAdmin={currentUser?.is_admin ?? false}
                    />
                )}
                 {viewMode === 'calendar' && (
                    <EventCalendarView
                        events={events}
                        isLoading={isLoadingEvents}
                        error={eventError}
                        onViewDetails={handleViewDetails}
                    />
                 )}
              </>
          ) : (
              <div className="card" style={{ textAlign: 'center', marginTop: '2rem' }}>
                  <h2>Агрегатор мероприятий КемГУ</h2>
                  <p>Войдите или зарегистрируйтесь, чтобы просматривать и управлять мероприятиями.</p>
              </div>
          )}

          <AuthModal isOpen={isRegisterOpen} onClose={() => setIsRegisterOpen(false)} onSubmit={handleRegister} title="Регистрация" submitButtonText="Зарегистрироваться" />
          <AuthModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} onSubmit={handleLogin} title="Вход" submitButtonText="Войти" />
          {selectedEvent && <EventDetailModal isOpen={isDetailModalOpen} onClose={handleCloseDetailModal} event={selectedEvent} />}
          {isFormModalOpen && <EventFormModal isOpen={isFormModalOpen} onClose={handleCloseFormModal} onSubmit={handleSaveEvent} eventToEdit={eventToEdit} />}
          <EventFilterModal
                isOpen={isFilterModalOpen}
                onClose={handleCloseFilterModal}
                initialFilters={filters}
                onApplyFilters={handleApplyFilters}
                onResetFilters={handleResetFilters}
          />
          <ConfirmModal
              isOpen={isConfirmModalOpen}
              onClose={cancelDeleteAction}
              onConfirm={confirmDeleteAction}
              title="Подтвердить удаление"
              message="Вы уверены, что хотите удалить это мероприятие? Это действие необратимо."
              confirmText="Удалить"
              cancelText="Отмена"
              isLoading={isDeleting}
          />

          <ToastContainer position="bottom-right" autoClose={5000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover theme="colored" />
        </div>
    );
};

export default App;