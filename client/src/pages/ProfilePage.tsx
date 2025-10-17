import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import UserProfileCard from '../components/profile/UserProfileCard';
import UserEventsCard from '../components/profile/UserEventsCard';
import SecurityCard from '../components/profile/SecurityCard';
import NotificationsCard from '../components/profile/NotificationsCard';
import Header from '../components/Header';
import BottomNavigationBar from '../components/BottomNavigationBar';
import MoreMenuModal from '../components/MoreMenuModal';
import { EventsIconBottomNav, CalendarIconBottomNav, ArchiveIconBottomNav } from '../components/icons';
import '../styles/profile/ProfilePage.css';
import { useParticipation } from '../hooks/useParticipation';

const ProfilePage = () => {
    const { currentUser, logout, updateUser, changePassword, updateUserSettings } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [isMoreMenuOpen, setIsMoreMenuOpen] = React.useState(false);

    const {
        participations,
        isLoadingParticipations,
        fetchUserParticipations,
        fetchParticipationCounts,
        eventsVisitedCount,
    } = useParticipation();

    const now = new Date();
    const upcomingParticipations = participations.filter(p => new Date(p.event_start_datetime) >= now);
    const pastParticipations = participations.filter(p => new Date(p.event_start_datetime) < now);

    useEffect(() => {
        fetchUserParticipations('all');
        fetchParticipationCounts();
    }, [fetchUserParticipations, fetchParticipationCounts]);

    const handleAvatarChange = async (file: File) => {
        const formData = new FormData();
        formData.append('avatar', file);
        try {
            await updateUser(formData);
            toast.success("Аватар успешно обновлен!");
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Ошибка загрузки аватара");
        }
    };

    const handleProfileUpdate = async (data: { username: string; email: string }) => {
        try {
            await updateUser(data);
            toast.success("Профиль успешно обновлен!");
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Ошибка обновления профиля");
        }
    };

    const handleChangePassword = async (data: any) => {
        try {
            await changePassword(data);
            toast.success("Пароль успешно изменен!");
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Ошибка смены пароля");
            throw error;
        }
    };
    
    const handleToggleNotifications = async (enabled: boolean) => {
        try {
            await updateUserSettings({ notifications_enabled: enabled });
            toast.success(`Уведомления ${enabled ? 'включены' : 'выключены'}`);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Ошибка обновления настроек");
            throw error;
        }
    };

    const handleNavigate = (path: string) => {
        navigate(path);
    };
    
    const dummySwitchMainView = (view: 'list' | 'calendar') => {
        handleNavigate(view === 'list' ? '/' : '/calendar');
    };


    if (!currentUser) {
        return <div>Загрузка...</div>;
    }

    const mainRole = currentUser.is_admin ? "Администратор" : "Участник";

    return (
        <div className="profile-page-container">
            <Header
                user={currentUser}
                onLogoutClick={logout}
                onNavigate={handleNavigate}
                currentPath={location.pathname}
                activeViewMode={'list'}
                onSwitchMainView={dummySwitchMainView}
                onSetRefetchNotifications={() => {}}
            />

            <main className={`profile-page-main ${ (typeof window !== 'undefined' && window.innerWidth <= 768) ? 'has-bottom-nav' : ''}`}>
                <div className="profile-page-header">
                    <h1>Личный кабинет</h1>
                </div>
                <div className="profile-grid">
                    <div className="profile-grid-main">
                        <UserProfileCard
                            user={currentUser}
                            onAvatarChange={handleAvatarChange}
                            onProfileUpdate={handleProfileUpdate}
                            stats={{
                                events_visited: eventsVisitedCount,
                                main_role: mainRole
                            }}
                        />
                        <UserEventsCard
                            upcomingEvents={upcomingParticipations}
                            pastEvents={pastParticipations}
                            isLoading={isLoadingParticipations}
                        />
                    </div>
                    <div className="profile-grid-sidebar">
                        <SecurityCard onSubmit={handleChangePassword} />
                        <NotificationsCard
                            currentUser={currentUser}
                            onToggleNotifications={handleToggleNotifications}
                        />
                    </div>
                </div>
            </main>

            <BottomNavigationBar
                activeViewMode={'list'}
                currentPath={location.pathname}
                onMoreClick={() => setIsMoreMenuOpen(true)}
                EventsIconComp={EventsIconBottomNav}
                CalendarIconComp={CalendarIconBottomNav}
                ArchiveIconComp={ArchiveIconBottomNav}
                onNavigate={handleNavigate}
                onSwitchMainView={dummySwitchMainView}
            />
             <MoreMenuModal
                isOpen={isMoreMenuOpen}
                onClose={() => setIsMoreMenuOpen(false)}
                onLogoutClick={logout}
                onProfileClick={() => handleNavigate('/profile')}
            />

            <ToastContainer position="bottom-right" autoClose={4000} theme="colored" />
        </div>
    );
};

export default ProfilePage;