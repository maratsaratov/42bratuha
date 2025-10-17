import React, { createContext, useState, useEffect, useCallback, useContext, ReactNode } from 'react';
import { toast } from 'react-toastify';
import { User } from '../types';
import { fetchWithAuth as fetchWithAuthHelper } from '../utils/fetchWithAuth';

interface AuthContextType {
    isAuthenticated: boolean;
    currentUser: User | null;
    token: string | null;
    isLoading: boolean;
    login: (formData: Record<string, string>) => Promise<void>;
    register: (formData: Record<string, string>) => Promise<void>;
    logout: () => void;
    updateUser: (data: Partial<User> | FormData) => Promise<void>;
    updateUserSettings: (settings: { notifications_enabled: boolean }) => Promise<void>;
    changePassword: (passwordData: Record<string, string>) => Promise<void>;
    fetchWithAuth: (url: string, options?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [token, setToken] = useState<string | null>(() => localStorage.getItem('authToken'));
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const handleLogout = useCallback(() => {
        localStorage.removeItem('authToken');
        setToken(null);
        setCurrentUser(null);
        setIsAuthenticated(false);
        toast.info("Вы вышли из системы.");
    }, []);

    const fetchWithAuth = useCallback(async (url: string, options: RequestInit = {}) => {
        return fetchWithAuthHelper(url, options, handleLogout);
    }, [handleLogout]);

    useEffect(() => {
        const verifyUser = async () => {
            if (token) {
                try {
                    const response = await fetchWithAuth('/api/me');
                    if (response.ok) {
                        const data = await response.json();
                        setCurrentUser(data.user);
                        setIsAuthenticated(true);
                    } else {
                        handleLogout();
                    }
                } catch (error) {
                    console.error("Ошибка проверки сессии:", error);
                    handleLogout();
                }
            }
            setIsLoading(false);
        };
        verifyUser();
    }, [token, fetchWithAuth, handleLogout]);

    const login = async (formData: Record<string, string>) => {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Ошибка входа');
        }
        localStorage.setItem('authToken', data.access_token);
        setToken(data.access_token);
        setCurrentUser(data.user);
        setIsAuthenticated(true);
        toast.success(`Добро пожаловать, ${data.user.username}!`);
    };

    const register = async (formData: Record<string, string>) => {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Ошибка регистрации');
        }
        toast.success(data.message || 'Регистрация успешна! Теперь вы можете войти.');
    };

    const updateUser = async (data: Partial<User> | FormData) => {
        let response;
        if (data instanceof FormData) {
            response = await fetchWithAuth('/api/me/avatar', {
                method: 'POST',
                body: data,
            });
        } else {
            response = await fetchWithAuth('/api/me', {
                method: 'PUT',
                body: JSON.stringify(data),
            });
        }

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Не удалось обновить профиль');
        }

        const updatedUserData = await response.json();
        setCurrentUser(updatedUserData.user);
    };

    const updateUserSettings = async (settings: { notifications_enabled: boolean }) => {
        const response = await fetchWithAuth('/api/me/settings', {
            method: 'PUT',
            body: JSON.stringify(settings),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Не удалось обновить настройки');
        }

        const updatedUserData = await response.json();
        setCurrentUser(updatedUserData.user);
    };

    const changePassword = async (passwordData: Record<string, string>) => {
        const response = await fetchWithAuth('/api/me/change-password', {
            method: 'POST',
            body: JSON.stringify(passwordData),
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Не удалось сменить пароль');
        }
    };
    
    const value = {
        isAuthenticated,
        currentUser,
        token,
        isLoading,
        login,
        register,
        logout: handleLogout,
        updateUser,
        updateUserSettings,
        changePassword,
        fetchWithAuth
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};