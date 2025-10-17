import React from 'react';
import { Event } from '../types';
import { formatDate, formatDateTimeRange } from '../utils/dateUtils';
import { CalendarIcon, LocationIcon, TypeIcon, LinkIcon, InfoIcon } from './icons';
import { useAuth } from '../context/AuthContext';
import { useParticipation } from '../hooks/useParticipation';

interface EventDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    event: Event | null;
    onEventUpdate?: () => void; 
}

const EventDetailModal: React.FC<EventDetailModalProps> = ({ isOpen, onClose, event, onEventUpdate }) => {
    const { isAuthenticated, currentUser } = useAuth();
    const { registerForEvent, unregisterFromEvent, fetchUserParticipations } = useParticipation();

    if (!isOpen || !event) {
        return null;
    }

    const renderLink = (url: string | null | undefined, label: string) => {
        if (!url) return null;
        const validUrl = url.startsWith('http://') || url.startsWith('https://');
        const displayUrl = validUrl ? url : `http://${url}`;
        return (
            <div className="meta-item">
                <LinkIcon size={18} />
                <a href={displayUrl} target="_blank" rel="noopener noreferrer">{label}</a>
            </div>
        );
    }

    const handleParticipationToggle = async () => {
        if (!event.id) return;
        try {
            if (event.is_participating) {
                await unregisterFromEvent(event.id);
            } else {
                await registerForEvent(event.id);
            }
            if (onEventUpdate) onEventUpdate();
            fetchUserParticipations();
        } catch (error) {
            console.error("Participation toggle failed:", error);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content event-detail-modal" onClick={(e) => e.stopPropagation()}>
                <button
                    onClick={onClose}
                    className="event-detail-close-btn"
                    aria-label="Закрыть"
                >
                    ×
                </button>

                <h2>{event.title}</h2>

                {isAuthenticated && !currentUser?.is_admin && !event.is_archived && (
                    <div className="detail-action-bar">
                        <button 
                            onClick={handleParticipationToggle} 
                            className={`primary-btn participate-detail-btn ${event.is_participating ? 'participating' : ''}`}
                        >
                            {event.is_participating ? 'Я записан' : 'Пойду'}
                        </button>
                    </div>
                )}

                <div className="detail-section description-section">
                    <p style={{ whiteSpace: 'pre-wrap' }}>{event.description}</p>
                </div>

                <div className="detail-section meta-section">
                    <h4>Детали</h4>
                    <div className="meta-item">
                        <CalendarIcon size={18} />
                        <span>{formatDateTimeRange(event.start_datetime, event.end_datetime)}</span>
                    </div>
                    <div className="meta-item">
                        <LocationIcon size={18} />
                        <span>{event.location}{event.location_details ? ` - ${event.location_details}` : ''}</span>
                    </div>
                     <div className="meta-item">
                        <TypeIcon size={18} />
                        <span>{event.event_type}</span>
                    </div>
                </div>

                 <div className="detail-section roles-section">
                     <h4>Доступные роли</h4>
                     {event.roles_available && event.roles_available.length > 0 ? (
                         <div className="roles-list">
                             {event.roles_available.map(role => (
                                 <span key={role} className="role-tag">{role}</span>
                             ))}
                         </div>
                     ) : (
                         <p>Роли не указаны.</p>
                     )}
                </div>

                 {(event.registration_link_participant || event.registration_link_volunteer || event.registration_link_organizer) && (
                    <div className="detail-section registration-section">
                        <h4>Регистрация</h4>
                        {renderLink(event.registration_link_participant, 'Ссылка для Участников')}
                        {renderLink(event.registration_link_volunteer, 'Ссылка для Волонтёров')}
                        {renderLink(event.registration_link_organizer, 'Ссылка для Организаторов')}
                    </div>
                 )}

                <div className="detail-section info-section">
                     <h4>Информация</h4>
                     <div className="meta-item">
                        <InfoIcon size={18} />
                        <span>Добавлено: {formatDate(event.created_at, true)} {event.author_username ? `(${event.author_username})` : ''}</span>
                    </div>
                     <div className="meta-item">
                        <InfoIcon size={18} />
                        <span>Обновлено: {formatDate(event.updated_at, true)}</span>
                    </div>
                 </div>

            </div>
        </div>
    );
};

export default EventDetailModal;