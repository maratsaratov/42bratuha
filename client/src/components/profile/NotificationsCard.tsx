import React from 'react';
import '../../styles/profile/NotificationsCard.css';
import { User } from '../../types';

interface NotificationsCardProps {
    currentUser: User;
    onToggleNotifications: (enabled: boolean) => Promise<void>;
}

const ToggleSwitch = ({ label, id, checked, onChange, disabled }: { label: string, id: string, checked: boolean, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, disabled: boolean }) => (
    <div className="toggle-switch-wrapper">
        <label htmlFor={id}>{label}</label>
        <label className="switch">
            <input type="checkbox" id={id} checked={checked} onChange={onChange} disabled={disabled} />
            <span className="slider round"></span>
        </label>
    </div>
);

const NotificationsCard: React.FC<NotificationsCardProps> = ({ currentUser, onToggleNotifications }) => {
    const [isUpdating, setIsUpdating] = React.useState(false);
    
    const handleToggle = async (e: React.ChangeEvent<HTMLInputElement>) => {
        setIsUpdating(true);
        try {
            await onToggleNotifications(e.target.checked);
        } catch (error) {
            console.error("Failed to update notification settings", error);
        } finally {
            setIsUpdating(false);
        }
    };

    return (
        <div className="card notifications-card">
            <h4>Уведомления</h4>
            <div className="notifications-list">
                <ToggleSwitch 
                    id="notif-reminder" 
                    label="Напоминания о предстоящих событиях"
                    checked={currentUser.notifications_enabled}
                    onChange={handleToggle}
                    disabled={isUpdating}
                />
            </div>
        </div>
    );
};

export default NotificationsCard;