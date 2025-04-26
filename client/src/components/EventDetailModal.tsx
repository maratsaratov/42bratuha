import React from 'react';
import { Event, ParticipantRole } from '../types';

const CalendarIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
    </svg>
);

const LocationIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
    </svg>
);

const TypeIcon = () => (
     <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
         <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2.586l.293.293a1 1 0 001.414 0l.293-.293V17a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
     </svg>
);

const RoleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
      <path d="M10 9a3 3 0 100-6 3 3 0 000 6zM6 8a2 2 0 11-4 0 2 2 0 014 0zM1.49 15.326a.78.78 0 01-.358-.447 3 3 0 014.308-3.516 6.484 6.484 0 00-1.905 3.959c-.023.222-.014.442.025.654a4.97 4.97 0 01-2.07-.65m12.02 0a4.97 4.97 0 01-2.07.65c.04-.212.048-.432.025-.654a6.484 6.484 0 00-1.905-3.959 3 3 0 014.308 3.516.78.78 0 01-.358.447zM14 8a2 2 0 11-4 0 2 2 0 014 0zm-8.29 6.99a4.992 4.992 0 012.582-2.995 5.485 5.485 0 011.414 1.079 5.485 5.485 0 011.414-1.079 4.992 4.992 0 012.582 2.995M14 13H6v2h8v-2z" />
    </svg>
);

const LinkIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
    </svg>
);

const InfoIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
    </svg>
);


const formatDate = (dateString: string | null | undefined, includeTime = false): string => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        ...(includeTime && { hour: '2-digit', minute: '2-digit' })
    };
    return date.toLocaleDateString('ru-RU', options);
};

const formatDateTimeRange = (start: string, end?: string | null): string => {
     const startDate = new Date(start);
    const endDate = end ? new Date(end) : null;

    const startOptions: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' };
    const endOptions: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' };
    const dateOnlyOptions: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };

    const startFormatted = startDate.toLocaleTimeString('ru-RU', startOptions);

    if (!endDate) {
        return startFormatted;
    }

    const startDayStr = startDate.toLocaleDateString('ru-RU', dateOnlyOptions);
    const endDayStr = endDate.toLocaleDateString('ru-RU', dateOnlyOptions);

    if (startDayStr === endDayStr) {
        const endTimeFormatted = endDate.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
        return `${startDayStr}, ${startDate.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })} - ${endTimeFormatted}`;
    } else {
         const endFormatted = endDate.toLocaleTimeString('ru-RU', endOptions);
        return `${startFormatted} - ${endFormatted}`;
    }
};

interface EventDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    event: Event | null;
}

const EventDetailModal: React.FC<EventDetailModalProps> = ({ isOpen, onClose, event }) => {
    if (!isOpen || !event) {
        return null;
    }

    const renderLink = (url: string | null | undefined, label: string) => {
        if (!url) return null;
        const validUrl = url.startsWith('http://') || url.startsWith('https://');
        const displayUrl = validUrl ? url : `http://${url}`;
        return (
            <div className="meta-item">
                <LinkIcon />
                <a href={displayUrl} target="_blank" rel="noopener noreferrer">{label}</a>
            </div>
        );
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content event-detail-modal" onClick={(e) => e.stopPropagation()}>
                <button
                    onClick={onClose}
                    style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', fontSize: '1.8rem', cursor: 'pointer', lineHeight: '1', padding: '0' }}
                    aria-label="Закрыть"
                >
                    ×
                </button>

                <h2>{event.title}</h2>

                <div className="detail-section description-section">
                    <p style={{ whiteSpace: 'pre-wrap' }}>{event.description}</p>
                </div>

                <div className="detail-section meta-section">
                    <h4>Детали</h4>
                    <div className="meta-item">
                        <CalendarIcon />
                        <span>{formatDateTimeRange(event.start_datetime, event.end_datetime)}</span>
                    </div>
                    <div className="meta-item">
                        <LocationIcon />
                        <span>{event.location}{event.location_details ? ` - ${event.location_details}` : ''}</span>
                    </div>
                     <div className="meta-item">
                        <TypeIcon />
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
                        <InfoIcon />
                        <span>Добавлено: {formatDate(event.created_at, true)} {event.author_username ? `(${event.author_username})` : ''}</span>
                    </div>
                     <div className="meta-item">
                        <InfoIcon />
                        <span>Обновлено: {formatDate(event.updated_at, true)}</span>
                    </div>
                 </div>

            </div>
        </div>
    );
};

export default EventDetailModal;