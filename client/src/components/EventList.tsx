import React from 'react';
import { Event } from '../types';

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

const formatDateRange = (start: string, end?: string | null): string => {
    const startDate = new Date(start);
    const endDate = end ? new Date(end) : null;

    const options: Intl.DateTimeFormatOptions = {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };

    const startFormatted = startDate.toLocaleDateString('ru-RU', options);

    if (endDate && startDate.toDateString() !== endDate.toDateString()) {
        const endFormatted = endDate.toLocaleDateString('ru-RU', options);
        return `${startFormatted} - ${endFormatted}`;
    }
    return startFormatted;
};


interface EventListProps {
    events: Event[];
    isLoading: boolean;
    error: string | null;
    isAdmin: boolean;
    onViewDetails: (event: Event) => void;
    onEdit?: (event: Event) => void;
    onDelete?: (eventId: number) => void;
}

const EventList: React.FC<EventListProps> = ({
    events,
    isLoading,
    error,
    isAdmin,
    onViewDetails,
    onEdit,
    onDelete
}) => {

    const renderContent = () => {
        if (isLoading) {
            return <div className="event-list-loading">Загрузка мероприятий...</div>;
        }
        if (error) {
            return <div className="event-list-error">Ошибка: {error}</div>;
        }
        if (events.length === 0) {
            return <div className="event-list-empty">Мероприятия не найдены.</div>;
        }
        return (
            <div className="event-grid">
                {events.map(event => (
                    <div key={event.id} className="event-card">
                        <div>
                            <h3 onClick={() => onViewDetails(event)} title={event.title}>
                                {event.title}
                            </h3>
                            <div className="event-card-meta">
                                <span><CalendarIcon /> {formatDateRange(event.start_datetime, event.end_datetime)}</span>
                                <span><LocationIcon /> {event.location}{event.location_details ? ` (${event.location_details})` : ''}</span>
                                <span><TypeIcon /> {event.event_type}</span>
                            </div>
                            <p className="event-card-description">{event.description}</p>
                        </div>
                        <div className="event-card-actions">
                            <button
                                onClick={() => onViewDetails(event)}
                                className="secondary-btn"
                            >
                                Подробнее
                            </button>
                            {isAdmin && onEdit && (
                                <button
                                    onClick={() => onEdit(event)}
                                    className="primary-btn"
                                >
                                    Редакт.
                                </button>
                            )}
                             {isAdmin && onDelete && (
                                <button
                                    onClick={() => onDelete(event.id)}
                                    className="secondary-btn delete-btn"
                                >
                                    Удалить
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        );
    };


    return (
         <div className="card event-list-card">
            <div className="event-list-header">
                <h2>Список мероприятий</h2>
                 {isLoading && <span style={{ fontSize: '0.9em', color: '#777' }}>Обновление...</span>}
            </div>
            {renderContent()}
        </div>
    );
};

export default EventList;