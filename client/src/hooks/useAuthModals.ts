import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

export const useAuthModals = () => {
    const { login, register } = useAuth();
    const [isLoginOpen, setIsLoginOpen] = useState(false);
    const [isRegisterOpen, setIsRegisterOpen] = useState(false);

    const handleLoginSubmit = async (formData: Record<string, string>) => {
        try {
            await login(formData);
            setIsLoginOpen(false);
        } catch (error) {
            const message = error instanceof Error ? error.message : "Неизвестная ошибка входа";
            toast.error(message);
            throw error;
        }
    };
    
    const handleRegisterSubmit = async (formData: Record<string, string>) => {
        try {
            await register(formData);
            setIsRegisterOpen(false);
            setIsLoginOpen(true);
        } catch (error) {
            const message = error instanceof Error ? error.message : "Неизвестная ошибка регистрации";
            toast.error(message);
            throw error;
        }
    };

    const handleSwitchAuthForm = (target: 'login' | 'register') => {
        setIsLoginOpen(target === 'login');
        setIsRegisterOpen(target === 'register');
    };

    return {
        isLoginOpen,
        isRegisterOpen,
        openLoginModal: () => setIsLoginOpen(true),
        openRegisterModal: () => setIsRegisterOpen(true),
        closeLoginModal: () => setIsLoginOpen(false),
        closeRegisterModal: () => setIsRegisterOpen(false),
        handleLoginSubmit,
        handleRegisterSubmit,
        handleSwitchAuthForm,
    };
};