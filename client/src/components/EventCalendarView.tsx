import React, { useState, memo, useCallback } from 'react';
import { Calendar, momentLocalizer, ToolbarProps, NavigateAction, View, Messages } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Event, EventType } from '../types';
import { generateICS, downloadICS } from '../utils/icsUtils';

moment.locale('ru', {
  months : 'январь_февраль_март_апрель_май_июнь_июль_август_сентябрь_октябрь_ноябрь_декабрь'.split('_'),
  monthsShort : 'янв._фев._мар._апр._мая_июня_июля_авг._сен._окт._ноя._дек.'.split('_'),
  weekdays : 'воскресенье_понедельник_вторник_среда_четверг_пятница_суббота'.split('_'),
  weekdaysShort : 'вс_пн_вт_ср_чт_пт_сб'.split('_'),
  weekdaysMin : 'Вс_Пн_Вт_Ср_Чт_Пт_Сб'.split('_'),
  longDateFormat : {
      LT : 'HH:mm',
      LTS : 'HH:mm:ss',
      L : 'DD.MM.YYYY',
      LL : 'D MMMM YYYY г.',
      LLL : 'D MMMM YYYY г., HH:mm',
      LLLL : 'dddd, D MMMM YYYY г., HH:mm'
  },
  week: {
    dow: 1,
    doy: 4
  }
});
const localizer = momentLocalizer(moment);

interface EventCalendarViewProps {
    events: Event[];
    isLoading: boolean;
    error: string | null;
    onViewDetails: (event: Event) => void;
    onParticipationToggle?: (eventId: number, isParticipating: boolean) => Promise<void>;
}

interface CalendarEvent {
    title: string;
    start: Date;
    end: Date;
    resource: Event;
}

interface CustomToolbarProps extends ToolbarProps<CalendarEvent, object> {
    events: CalendarEvent[];
}

const CustomToolbar = (props: CustomToolbarProps) => {
    const { label, onNavigate, events } = props;
    
    const handleExport = useCallback(() => {
        const currentMonthEvents = events.filter(event => 
            moment(event.start).isSameOrBefore(moment(props.date).endOf('month')) &&
            moment(event.end).isSameOrAfter(moment(props.date).startOf('month'))
        ).map(event => event.resource);

        if (currentMonthEvents.length === 0) {
            alert('Нет мероприятий для экспорта в текущем месяце.');
            return;
        }
        
        const icsData = generateICS(currentMonthEvents);
        downloadICS(icsData, `Мероприятия_КемГУ_${moment(props.date).format('YYYY-MM')}.ics`);
    }, [events, props.date]);

    return (
        <div className="rbc-toolbar custom-toolbar">
            <span className="rbc-toolbar-label">{label}</span>
            <span className="rbc-btn-group">
                <button type="button" className="rbc-nav-btn" onClick={() => onNavigate('PREV')}>
                    {'<'}
                </button>
                <button type="button" className="rbc-today-btn" onClick={() => onNavigate('TODAY')}>
                    Сегодня
                </button>
                <button type="button" className="rbc-nav-btn" onClick={() => onNavigate('NEXT')}>
                    {'>'}
                </button>
                <button type="button" className="secondary-btn small-btn rbc-export-btn" onClick={handleExport}>
                    Экспорт
                </button>
            </span>
        </div>
    );
};

interface ShowMorePopupProps {
    events: CalendarEvent[];
    date: Date;
    onClose: () => void;
    onSelectEvent: (event: CalendarEvent) => void;
    onParticipationToggle?: (eventId: number, isParticipating: boolean) => Promise<void>;
}

const getEventColor = (eventType: EventType) => {
    switch (eventType) {
        case EventType.CULTURAL: return 'var(--color-cultural, #e67e22)';
        case EventType.SPORTS: return 'var(--color-sports, #e74c3c)';
        case EventType.EDUCATIONAL: return 'var(--color-educational, #3498db)';
        case EventType.SOCIAL: return 'var(--color-social, #27ae60)';
        default: return 'var(--color-other, #8e44ad)';
    }
}

const ShowMorePopup: React.FC<ShowMorePopupProps> = ({ events, date, onClose, onSelectEvent, onParticipationToggle }) => {
    return (
        <div className="show-more-popup-overlay" onClick={onClose}>
            <div className="show-more-popup" onClick={(e) => e.stopPropagation()}>
                <div className="show-more-popup-header">
                    <h4>{moment(date).format('D MMMM YYYY г.')}</h4>
                    <button onClick={onClose} className="close-btn">×</button>
                </div>
                <div className="show-more-popup-body">
                    {events.map(event => (
                        <div
                            key={event.resource.id}
                            className="popup-event-item"
                            style={{ backgroundColor: getEventColor(event.resource.event_type) }}
                        >
                            <span onClick={() => onSelectEvent(event)} className="popup-event-title-link">{event.title}</span>
                            {onParticipationToggle && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); onParticipationToggle(event.resource.id, event.resource.is_participating || false); }}
                                    className={`secondary-btn small-btn calendar-participate-btn ${event.resource.is_participating ? 'participating' : ''}`}
                                >
                                    {event.resource.is_participating ? 'Записан' : 'Пойду'}
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const EventCalendarView: React.FC<EventCalendarViewProps> = ({
    events,
    isLoading,
    error,
    onViewDetails,
    onParticipationToggle,
}) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [popupState, setPopupState] = useState<{ date: Date, events: CalendarEvent[] } | null>(null);

    const calendarEvents: CalendarEvent[] = events.map((event) => {
        const startDate = new Date(event.start_datetime);
        const endDate = event.end_datetime 
            ? new Date(event.end_datetime) 
            : new Date(startDate.getTime() + 60 * 60 * 1000);

        return {
            title: event.title,
            start: startDate,
            end: endDate,
            resource: event,
        };
    });

    const handleSelectEvent = (calendarEvent: CalendarEvent) => {
        onViewDetails(calendarEvent.resource);
        if (popupState) setPopupState(null);
    };

    const handleShowMore = useCallback((moreEvents: CalendarEvent[], date: Date) => {
        setPopupState({ events: moreEvents, date });
    }, []);
    
    const handleNavigate = useCallback((newDate: Date, view: View, action: NavigateAction) => {
        setCurrentDate(newDate);
    }, []);

    const eventStyleGetter = (event: CalendarEvent) => ({
        style: {
            backgroundColor: getEventColor(event.resource.event_type),
        }
    });

    const messages: Messages = {
        month: 'Месяц',
        week: 'Неделя',
        day: 'День',
        agenda: 'Повестка',
        date: 'Дата',
        time: 'Время',
        event: 'Событие',
        noEventsInRange: 'В этом диапазоне нет событий.',
        showMore: (total: number) => `+ ${total}`,
        today: 'Сегодня',
        previous: '<',
        next: '>',
    };

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
                style={{ height: '70vh', minHeight: '600px' }}
                views={['month']}
                defaultView="month"
                date={currentDate}
                onNavigate={handleNavigate}
                onSelectEvent={handleSelectEvent}
                onShowMore={handleShowMore}
                messages={messages}
                eventPropGetter={eventStyleGetter}
                components={{
                    toolbar: (toolbarProps) => <CustomToolbar {...toolbarProps} events={calendarEvents} />,
                }}
                popup={false}
            />
            {popupState && (
                <ShowMorePopup 
                    events={popupState.events} 
                    date={popupState.date}
                    onClose={() => setPopupState(null)}
                    onSelectEvent={handleSelectEvent}
                    onParticipationToggle={onParticipationToggle}
                />
            )}
        </div>
    );
};

export default memo(EventCalendarView);