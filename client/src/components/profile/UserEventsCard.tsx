import React, { useState } from 'react';
import { Participation } from '../../types';
import { formatSingleDateTime } from '../../utils/dateUtils';
import '../../styles/profile/UserEventsCard.css';
import { useNavigate } from 'react-router-dom';

interface UserEventsCardProps {
    upcomingEvents: Participation[];
    pastEvents: Participation[];
    isLoading: boolean;
}

const EventItem: React.FC<{event: Participation}> = ({ event }) => {
    const navigate = useNavigate();

    const handleEventClick = () => {
        navigate(`/events/${event.event_id}`, { state: { openEventId: event.event_id } });
    };

    return (
        <div className="profile-event-item" onClick={handleEventClick}>
            <div className="profile-event-date">
                <span>{new Date(event.event_start_datetime).getDate()}</span>
                <span>{new Date(event.event_start_datetime).toLocaleString('ru-RU', { month: 'short' })}</span>
            </div>
            <div className="profile-event-info">
                <h4 className="profile-event-title">{event.event_title}</h4>
                <p className="profile-event-datetime">{formatSingleDateTime(event.event_start_datetime)}</p>
                <p className="profile-event-role">{event.role_name}</p>
            </div>
            <button className="profile-event-link" aria-label="Подробнее о мероприятии">→</button>
        </div>
    );
};


const UserEventsCard: React.FC<UserEventsCardProps> = ({ upcomingEvents, pastEvents, isLoading }) => {
    const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

    const eventsToShow = activeTab === 'upcoming' ? upcomingEvents : pastEvents;

    return (
        <div className="card profile-events-card">
            <h3>Мои мероприятия</h3>
            <div className="profile-tabs">
                <button 
                    className={`tab-btn ${activeTab === 'upcoming' ? 'active' : ''}`}
                    onClick={() => setActiveTab('upcoming')}
                >
                    Предстоящие
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'past' ? 'active' : ''}`}
                    onClick={() => setActiveTab('past')}
                >
                    Прошедшие
                </button>
            </div>
            <div className="profile-events-list">
                {isLoading ? (
                    <p className="no-events-placeholder">Загрузка ваших мероприятий...</p>
                ) : eventsToShow.length > 0 ? (
                    eventsToShow.map(event => <EventItem key={event.id} event={event} />)
                ) : (
                    <p className="no-events-placeholder">
                        {activeTab === 'upcoming' ? 'Вы пока не записаны на предстоящие мероприятия.' : 'Вы не участвовали в прошедших мероприятиях.'}
                    </p>
                )}
            </div>
        </div>
    );
};

export default UserEventsCard;