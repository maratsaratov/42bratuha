import { Routes, Route, Navigate, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LandingPage from './components/landing/LandingPage';
import MainPage from './pages/MainPage';
import ProfilePage from './pages/ProfilePage';
import { useAuthModals } from './hooks/useAuthModals';
import AuthModal from './components/AuthModal';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const App = () => {
    const { isAuthenticated, isLoading: authLoading } = useAuth();
    const navigate = useNavigate();
    const {
        isLoginOpen,
        isRegisterOpen,
        openLoginModal,
        openRegisterModal,
        closeLoginModal,
        closeRegisterModal,
        handleLoginSubmit,
        handleRegisterSubmit,
        handleSwitchAuthForm
    } = useAuthModals();

    if (authLoading) {
        return <div style={{ textAlign: 'center', margin: '4rem 0', fontSize: '1.2em' }}>Загрузка...</div>;
    }

    const MainPageWrapper = ({ status }: { status: 'active' | 'archive' }) => {
        const { viewMode } = useParams<{ viewMode?: string }>();

        let currentActiveViewMode: 'list' | 'calendar' = 'list';
        if (status === 'active' && viewMode === 'calendar') {
            currentActiveViewMode = 'calendar';
        } else if (status === 'archive') {
            currentActiveViewMode = 'list';
        }

        const handleSwitchView = (newView: 'list' | 'calendar') => {
            navigate(newView === 'list' ? '/' : '/calendar');
        };
        
        const handleNavigate = (path: string) => {
            navigate(path);
        };

        return (
            <MainPage
                status={status}
                activeViewMode={currentActiveViewMode}
                onSwitchMainView={handleSwitchView}
                onNavigate={handleNavigate}
            />
        );
    };

    return (
        <>
            <Routes>
                {isAuthenticated ? (
                    <>
                        <Route path="/:viewMode?" element={<MainPageWrapper status="active" />} />
                        <Route path="/archive" element={<MainPageWrapper status="archive" />} />
                        <Route path="/events/:eventId" element={<MainPageWrapper status="active" />} />

                        <Route path="/profile" element={<ProfilePage />} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </>
                ) : (
                    <Route path="*" element={<LandingPage onLoginClick={openLoginModal} onRegisterClick={openRegisterModal} />} />
                )}
            </Routes>

            <AuthModal
                isOpen={isRegisterOpen}
                variant="register"
                onClose={closeRegisterModal}
                onSubmit={handleRegisterSubmit}
                title="Регистрация"
                submitButtonText="Зарегистрироваться"
                onSwitchForm={handleSwitchAuthForm}
            />
            <AuthModal
                isOpen={isLoginOpen}
                variant="login"
                onClose={closeLoginModal}
                onSubmit={handleLoginSubmit}
                title="Вход"
                submitButtonText="Войти"
                onSwitchForm={handleSwitchAuthForm}
                onForgotPassword={() => toast.info("Функция восстановления пароля в разработке.")}
            />
            <ToastContainer position="bottom-right" autoClose={5000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover theme="colored" />
        </>
    );
};

export default App;