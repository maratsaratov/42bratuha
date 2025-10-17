import React from 'react';
import { Event } from '../types';
import { formatSingleDateTime } from '../utils/dateUtils';
import { CalendarIcon, LocationIcon, PencilIcon, TrashIcon, RestoreIcon } from './icons';

interface EventListProps {
    events: Event[];
    isLoading: boolean;
    error: string | null;
    isAdmin: boolean;
    onViewDetails: (event: Event) => void;
    onEdit?: (event: Event) => void;
    onDelete?: (eventId: number) => void;
    onRestore?: (eventId: number) => void;
    onHardDelete?: (eventId: number) => void;
    onParticipationToggle?: (eventId: number, isParticipating: boolean) => Promise<void>;
    isArchiveMode: boolean;
}

const EventList: React.FC<EventListProps> = ({
    events,
    isLoading,
    error,
    isAdmin,
    onViewDetails,
    onEdit,
    onDelete,
    onRestore,
    onHardDelete,
    onParticipationToggle,
    isArchiveMode,
}) => {

    const renderContent = () => {
        if (isLoading) {
            return <div className="event-list-loading">Загрузка мероприятий...</div>;
        }
        if (error) {
            return <div className="event-list-error">Ошибка: {error}</div>;
        }
        if (events.length === 0) {
            return <div className="event-list-empty">Мероприятия не найдены. Попробуйте изменить фильтры.</div>;
        }
        return (
            <div className="event-grid">
                {events.map(event => (
                    <article key={event.id} className="event-card">
                        <div className="event-card-image-wrapper" onClick={() => onViewDetails(event)}>
                            <img
                                src={event.image_url || '/assets/main/card-background.png'}
                                alt={event.title}
                                className="event-card-image"
                                loading="lazy"
                            />
                            <div className="event-card-type-badge">{event.event_type}</div>
                        </div>
                        <div className="event-card-content">
                            <header>
                                <div className="event-card-meta">
                                    <span><CalendarIcon size={16} /> {formatSingleDateTime(event.start_datetime)}</span>
                                    <span><LocationIcon size={16} /> {event.location}</span>
                                </div>
                                <h3 className="event-card-title" onClick={() => onViewDetails(event)} title={event.title}>
                                    {event.title}
                                </h3>
                            </header>
                            <p className="event-card-description">{event.description}</p>
                            <footer className="event-card-footer">
                                <div className="event-card-actions-wrapper">
                                    <div className="user-actions-group">
                                        {!isAdmin && !isArchiveMode && onParticipationToggle && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onParticipationToggle(event.id, event.is_participating || false); }}
                                                className={`primary-btn small-btn participate-btn ${event.is_participating ? 'participating' : ''}`}
                                            >
                                                {event.is_participating ? 'Я записан' : 'Пойду'}
                                            </button>
                                        )}
                                        <button onClick={() => onViewDetails(event)} className="secondary-btn">Подробнее</button>
                                    </div>

                                    {isAdmin && (
                                        <div className="admin-actions">
                                            {onEdit && (
                                                <button onClick={() => onEdit(event)} className="admin-action-btn edit-btn" title="Редактировать" aria-label="Редактировать мероприятие"><PencilIcon /></button>
                                            )}
                                            {isArchiveMode ? (
                                                <>
                                                    {onRestore && <button onClick={() => onRestore(event.id)} className="admin-action-btn restore-btn" title="Восстановить" aria-label="Восстановить мероприятие"><RestoreIcon /></button>}
                                                    {onHardDelete && <button onClick={() => onHardDelete(event.id)} className="admin-action-btn delete-btn" title="Удалить навсегда" aria-label="Удалить мероприятие навсегда"><TrashIcon /></button>}
                                                </>
                                            ) : (
                                                onDelete && <button onClick={() => onDelete(event.id)} className="admin-action-btn delete-btn" title="Отправить в архив" aria-label="Отправить мероприятие в архив"><TrashIcon /></button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </footer>
                        </div>
                    </article>
                ))}
            </div>
        );
    };

    return (
         <div className="card event-list-card">
            <div className="event-list-header">
                <h2>{isArchiveMode ? 'Архив мероприятий' : 'Список мероприятий'}</h2>
                 {isLoading && <span className="event-list-loader-text">Обновление...</span>}
            </div>
            {renderContent()}
        </div>
    );
};

export default EventList;