import React from 'react';
import { Calendar, momentLocalizer, View, ToolbarProps } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Event } from '../types';

// Настройка русской локализации
moment.locale('ru', {
  week: {
    dow: 1, // Понедельник как первый день недели
    doy: 4  // Первая неделя года содержит 4 января
  }
});
const localizer = momentLocalizer(moment);

interface EventCalendarViewProps {
    events: Event[];
    isLoading: boolean;
    error: string | null;
    onViewDetails: (event: Event) => void;
}

interface CalendarEvent {
    title: string;
    start: Date;
    end: Date;
    resource: Event;
}

const CustomToolbar = (props: ToolbarProps<CalendarEvent, object>) => {
    const { label, onNavigate, onView, view } = props;
    
    // Доступные виды календаря с русскими названиями
    const availableViews = [
        { key: 'month', label: 'Месяц' },
        { key: 'week', label: 'Неделя' },
        { key: 'day', label: 'День' },
        { key: 'agenda', label: 'Повестка дня' }
    ];

    return (
        <div className="rbc-toolbar">
            {/* Левая группа кнопок - навигация */}
            <span className="rbc-btn-group">
                <button 
                    type="button" 
                    className="rbc-nav-button"
                    onClick={() => onNavigate('PREV')}
                >
                    ◄
                </button>
                <button 
                    type="button" 
                    className="rbc-today-button"
                    onClick={() => onNavigate('TODAY')}
                >
                    Сегодня
                </button>
                <button 
                    type="button" 
                    className="rbc-nav-button"
                    onClick={() => onNavigate('NEXT')}
                >
                    ►
                </button>
            </span>
            
            {/* Название текущего периода */}
            <span className="rbc-toolbar-label">{label}</span>
            
            {/* Правая группа кнопок - переключение видов */}
            <span className="rbc-btn-group">
                {availableViews.map(v => (
                    <button
                        type="button"
                        key={v.key}
                        className={`rbc-view-button ${view === v.key ? 'rbc-active' : ''}`}
                        onClick={() => onView(v.key as View)}
                    >
                        {v.label}
                    </button>
                ))}
            </span>
        </div>
    );
};

const EventCalendarView: React.FC<EventCalendarViewProps> = ({
    events,
    isLoading,
    error,
    onViewDetails,
}) => {
    const [currentView, setCurrentView] = React.useState<View>('month');
    const [currentDate, setCurrentDate] = React.useState<Date>(new Date());

    // Преобразование событий для календаря
    const calendarEvents: CalendarEvent[] = events.map((event) => {
        const startDate = new Date(event.start_datetime);
        const endDate = event.end_datetime 
            ? new Date(event.end_datetime) 
            : new Date(startDate.getTime() + 60 * 60 * 1000); // +1 час если нет end_datetime

        return {
            title: event.title,
            start: startDate,
            end: endDate,
            resource: event,
        };
    });

    // Обработчики событий
    const handleSelectEvent = (calendarEvent: CalendarEvent) => {
        onViewDetails(calendarEvent.resource);
    };

    const eventStyleGetter = () => ({
        style: {
            backgroundColor: '#007bff',
            borderRadius: '5px',
            opacity: 0.8,
            color: 'white',
            border: '0px',
            display: 'block',
            fontSize: '0.85em',
            padding: '2px 5px'
        }
    });

    const handleViewChange = (view: View) => setCurrentView(view);
    const handleNavigate = (newDate: Date) => setCurrentDate(newDate);

    // Состояния загрузки и ошибки
    if (isLoading) {
        return <div className="event-list-loading card">Загрузка календаря...</div>;
    }
    if (error) {
        return <div className="event-list-error card">Ошибка загрузки календаря: {error}</div>;
    }

    return (
        <div className="card event-calendar-card">
            <Calendar
                localizer={localizer}
                events={calendarEvents}
                startAccessor="start"
                endAccessor="end"
                style={{ height: 600 }}
                view={currentView}
                date={currentDate}
                onView={handleViewChange}
                onNavigate={handleNavigate}
                onSelectEvent={handleSelectEvent}
                eventPropGetter={eventStyleGetter}
                components={{
                    toolbar: CustomToolbar
                }}
                messages={{
                    today: 'Сегодня',
                    previous: '◄',
                    next: '►',
                    month: 'Месяц',
                    week: 'Неделя',
                    day: 'День',
                    agenda: 'Повестка дня',
                    noEventsInRange: 'Нет событий в этом диапазоне',
                    showMore: total => `+${total} ещё`
                }}
            />
        </div>
    );
};

export default EventCalendarView;