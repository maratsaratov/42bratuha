import React, { useEffect, useState } from 'react';
import { useForm, SubmitHandler, FieldErrors } from 'react-hook-form';
import { UserIcon, EmailIcon, LockIcon, EyeOpenIcon, EyeClosedIcon } from './icons';

type LoginFormInputs = {
  email: string;
  password: string;
};

type RegisterFormInputs = {
  email: string;
  username: string;
  password: string;
  confirm_password: string;
};

type AuthFormData = LoginFormInputs & Partial<RegisterFormInputs>;

type RegisterFieldErrors = FieldErrors<RegisterFormInputs>;

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: AuthFormData) => Promise<void>;
  variant: 'login' | 'register';
  title: string;
  submitButtonText: string;
  onSwitchForm?: (targetForm: 'login' | 'register') => void; 
  onForgotPassword?: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  variant,
  title,
  submitButtonText,
  onSwitchForm,
  onForgotPassword,
}) => {
  const isRegister = variant === 'register';
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
  } = useForm<AuthFormData>({
    mode: 'onBlur',
    defaultValues: {
        email: "",
        password: "",
        username: "",
        confirm_password: ""
    }
  });

  const passwordValue = watch('password');

  useEffect(() => {
    if (isOpen) {
      reset({
        email: "",
        password: "",
        username: "",
        confirm_password: ""
      });
      setShowPassword(false);
      setShowConfirmPassword(false);
    }
  }, [isOpen, reset]);


  const handleFormSubmit: SubmitHandler<AuthFormData> = async (data) => {
    try {
       const cleanData = {...data};
       if (!isRegister) {
           delete cleanData.username;
           delete cleanData.confirm_password;
       }
       await onSubmit(cleanData);
    } catch (err) {
        console.error("AuthModal submission error:", err);
    }
  };

  const registerErrors = errors as RegisterFieldErrors;

  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-overlay auth-modal-overlay" onClick={onClose}>
      <div className="modal-content auth-modal-content" onClick={(e) => e.stopPropagation()}>
        <button
            onClick={onClose}
            className="auth-modal-close-btn"
            disabled={isSubmitting}
            aria-label="Закрыть"
        >
            ×
        </button>
        <h2 className="auth-modal-title">{title}</h2>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="auth-form" noValidate>

          {isRegister && (
            <div className={`form-group auth-form-group ${errors.username ? 'has-error' : ''}`}>
              <label htmlFor="username_auth" className="auth-label">Имя пользователя</label>
              <div className="input-wrapper auth-input-wrapper">
                  <UserIcon />
                  <input
                    type="text"
                    id="username_auth"
                    placeholder="Введите ваше имя пользователя"
                    className={`auth-input ${errors.username ? 'input-error' : ''}`}
                    {...register("username", { 
                        required: "Имя пользователя обязательно",
                        minLength: { value: 3, message: "Минимум 3 символа" }
                    })}
                    disabled={isSubmitting}
                    autoComplete="username"
                  />
               </div>
              {errors.username && <span className="error-message auth-error-message">{errors.username.message}</span>}
            </div>
          )}

          <div className={`form-group auth-form-group ${errors.email ? 'has-error' : ''}`}>
            <label htmlFor="email_auth" className="auth-label">Email</label>
            <div className="input-wrapper auth-input-wrapper">
                <EmailIcon />
                <input
                    type="email"
                    id="email_auth"
                    placeholder="example@mail.com"
                    className={`auth-input ${errors.email ? 'input-error' : ''}`}
                    {...register("email", {
                        required: "Email обязателен",
                        pattern: { value: /^\S+@\S+\.\S+$/i, message: "Неверный формат email" }
                    })}
                    disabled={isSubmitting}
                    autoComplete="email"
                />
            </div>
             {errors.email && <span className="error-message auth-error-message">{errors.email.message}</span>}
          </div>

          <div className={`form-group auth-form-group ${errors.password ? 'has-error' : ''}`}>
            <label htmlFor="password_auth" className="auth-label">Пароль</label>
             <div className="input-wrapper auth-input-wrapper">
                <LockIcon />
                <input
                    type={showPassword ? "text" : "password"}
                    id="password_auth"
                    placeholder={isRegister ? "Создайте надежный пароль" : "Введите ваш пароль"}
                    className={`auth-input ${errors.password ? 'input-error' : ''}`}
                    {...register("password", { 
                        required: "Пароль обязателен",
                        minLength: isRegister ? { value: 6, message: "Пароль должен быть не менее 6 символов" } : undefined
                    })}
                    disabled={isSubmitting}
                    autoComplete={isRegister ? "new-password" : "current-password"}
                />
                <button 
                  type="button" 
                  className="password-toggle-btn" 
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
                  aria-pressed={showPassword}
                >
                  {showPassword ? <EyeClosedIcon /> : <EyeOpenIcon />}
                </button>
            </div>
            {errors.password && <span className="error-message auth-error-message">{errors.password.message}</span>}
          </div>

          {isRegister && (
            <div className={`form-group auth-form-group ${registerErrors.confirm_password ? 'has-error' : ''}`}>
              <label htmlFor="confirm_password_auth" className="auth-label">Подтвердите пароль</label>
              <div className="input-wrapper auth-input-wrapper">
                  <LockIcon />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirm_password_auth"
                    placeholder="Повторите пароль"
                    className={`auth-input ${registerErrors.confirm_password ? 'input-error' : ''}`}
                    {...register("confirm_password", {
                        required: "Подтверждение пароля обязательно",
                        validate: value => value === passwordValue || "Пароли не совпадают"
                    })}
                    disabled={isSubmitting}
                    autoComplete="new-password"
                   />
                   <button 
                    type="button" 
                    className="password-toggle-btn" 
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? "Скрыть подтверждение пароля" : "Показать подтверждение пароля"}
                    aria-pressed={showConfirmPassword}
                   >
                    {showConfirmPassword ? <EyeClosedIcon /> : <EyeOpenIcon />}
                  </button>
               </div>
               {registerErrors.confirm_password && <span className="error-message auth-error-message">{registerErrors.confirm_password.message}</span>}
            </div>
          )}

          {!isRegister && onForgotPassword && (
            <div className="auth-form-extra-links">
              <button type="button" onClick={onForgotPassword} className="forgot-password-link">
                Забыли пароль?
              </button>
            </div>
          )}

          <button type="submit" className="primary-btn auth-submit-btn" disabled={isSubmitting}>
            {isSubmitting ? 'Обработка...' : submitButtonText}
          </button>

          {onSwitchForm && (
            <div className="auth-switch-form">
              {isRegister ? (
                <>
                  Уже есть аккаунт?{' '}
                  <button type="button" onClick={() => onSwitchForm('login')} className="switch-form-link">
                    Войти
                  </button>
                </>
              ) : (
                <>
                  Нет аккаунта?{' '}
                  <button type="button" onClick={() => onSwitchForm('register')} className="switch-form-link">
                    Зарегистрироваться
                  </button>
                </>
              )}
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default AuthModal;