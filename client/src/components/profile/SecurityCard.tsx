import React from 'react';
import { useForm } from 'react-hook-form';
import '../../styles/profile/SecurityCard.css';

interface SecurityCardProps {
    onSubmit: (data: any) => Promise<void>;
}

const SecurityCard: React.FC<SecurityCardProps> = ({ onSubmit }) => {
    const { register, handleSubmit, formState: { errors, isSubmitting }, watch, reset } = useForm();
    const newPassword = watch("new_password");

    const handleFormSubmit = async (data: any) => {
        try {
            await onSubmit(data);
            reset();
        } catch (error) {
            console.error("Password change failed:", error)
        }
    };

    return (
        <div className="card security-card">
            <h4>Безопасность</h4>
            <form onSubmit={handleSubmit(handleFormSubmit)}>
                <div className="form-group">
                    <label>Текущий пароль</label>
                    <input 
                        type="password" 
                        className="form-control"
                        autoComplete="current-password"
                        {...register("current_password", { required: "Текущий пароль обязателен" })}
                    />
                     {errors.current_password && <span className="error-message">{String(errors.current_password.message)}</span>}
                </div>
                <div className="form-group">
                    <label>Новый пароль</label>
                    <input 
                        type="password" 
                        className="form-control"
                        autoComplete="new-password"
                        {...register("new_password", { 
                            required: "Новый пароль обязателен", 
                            minLength: { value: 6, message: "Минимум 6 символов" } 
                        })}
                    />
                     {errors.new_password && <span className="error-message">{String(errors.new_password.message)}</span>}
                </div>
                <div className="form-group">
                    <label>Подтвердите новый пароль</label>
                    <input 
                        type="password" 
                        className="form-control"
                        autoComplete="new-password"
                        {...register("confirm_password", { 
                            required: "Подтверждение пароля обязательно", 
                            validate: value => value === newPassword || "Пароли не совпадают"
                        })}
                    />
                    {errors.confirm_password && <span className="error-message">{String(errors.confirm_password.message)}</span>}
                </div>
                <button type="submit" className="primary-btn full-width" disabled={isSubmitting}>
                    {isSubmitting ? 'Сохранение...' : 'Сменить пароль'}
                </button>
            </form>
        </div>
    );
};

export default SecurityCard;