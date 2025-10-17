import React, { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { User } from '../../types';
import { PencilIcon, UserPlaceholderIcon } from '../icons';
import '../../styles/profile/UserProfileCard.css';

interface UserProfileCardProps {
    user: User;
    stats: { events_visited: number; main_role: string };
    onAvatarChange: (file: File) => Promise<void>;
    onProfileUpdate: (data: { username: string, email: string }) => Promise<void>;
}

type FormInputs = {
    username: string;
    email: string;
};

const UserProfileCard: React.FC<UserProfileCardProps> = ({ user, stats, onAvatarChange, onProfileUpdate }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [isAvatarUploading, setIsAvatarUploading] = useState(false);
    const avatarInputRef = useRef<HTMLInputElement>(null);

    const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<FormInputs>({
        defaultValues: {
            username: user.username,
            email: user.email
        }
    });

    useEffect(() => {
        reset({
            username: user.username,
            email: user.email
        });
    }, [user, reset]);

    const handleAvatarClick = () => {
        if (isAvatarUploading) return;
        avatarInputRef.current?.click();
    };

    const onFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setIsAvatarUploading(true);
            await onAvatarChange(file);
            setIsAvatarUploading(false);
        }
    };

    const onSubmit = async (data: FormInputs) => {
        await onProfileUpdate(data);
        setIsEditing(false);
    };

    return (
        <div className="card profile-user-card">
            <div className="profile-user-main">
                <div className={`profile-avatar-wrapper ${isAvatarUploading ? 'uploading' : ''}`} onClick={handleAvatarClick}>
                    {user.avatarUrl ? (
                         <img
                            src={user.avatarUrl}
                            alt="Аватар"
                            className="profile-avatar"
                        />
                    ) : (
                        <UserPlaceholderIcon />
                    )}
                    <div className="profile-avatar-overlay">
                        <span>{isAvatarUploading ? 'Загрузка...' : 'Обновить'}</span>
                    </div>
                    <input
                        type="file"
                        ref={avatarInputRef}
                        onChange={onFileSelect}
                        accept="image/png, image/jpeg, image/webp"
                        style={{ display: 'none' }}
                        disabled={isAvatarUploading}
                    />
                </div>
                <div className="profile-user-info">
                    {isEditing ? (
                        <form onSubmit={handleSubmit(onSubmit)} className="profile-edit-form">
                            <input
                                {...register("username", { required: "Имя обязательно" })}
                                className="form-control"
                                disabled={isSubmitting}
                            />
                             {errors.username && <span className="error-message">{errors.username.message}</span>}
                            <input
                                {...register("email", { required: "Email обязателен", pattern: { value: /^\S+@\S+\.\S+$/i, message: "Неверный формат email" }})}
                                className="form-control"
                                disabled={isSubmitting}
                            />
                             {errors.email && <span className="error-message">{errors.email.message}</span>}
                             <div className="profile-edit-actions">
                                <button type="submit" className="primary-btn small-btn" disabled={isSubmitting}>
                                    {isSubmitting ? 'Сохранение...' : 'Сохранить'}
                                </button>
                                <button type="button" className="secondary-btn small-btn" onClick={() => setIsEditing(false)} disabled={isSubmitting}>
                                    Отмена
                                </button>
                             </div>
                        </form>
                    ) : (
                        <>
                            <h2 className="profile-username">{user.username}</h2>
                            <p className="profile-email">{user.email}</p>
                            <button className="edit-profile-btn" onClick={() => setIsEditing(true)}>
                                <PencilIcon /> Редактировать
                            </button>
                        </>
                    )}
                </div>
            </div>
            <div className="profile-user-stats">
                <div className="stat-item">
                    <span className="stat-value">{stats.events_visited}</span>
                    <span className="stat-label">Мероприятий посещено</span>
                </div>
                <div className="stat-item">
                    <span className="stat-value">{stats.main_role}</span>
                    <span className="stat-label">Основная роль</span>
                </div>
            </div>
        </div>
    );
};

export default UserProfileCard;