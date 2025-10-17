import { Event } from '../types';
import { formatDateToICS } from './dateUtils';
import { v4 as uuidv4 } from 'uuid';

export const generateICS = (events: Event[]): string => {
    const calendarName = "Мероприятия КемГУ";
    const timeZone = "Asia/Krasnoyarsk";

    let icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//KemSU Pulse Events//NONSGML v1.0//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:${calendarName}
X-WR-TIMEZONE:${timeZone}
`;

    events.forEach(event => {
        const dtstamp = formatDateToICS(new Date().toISOString()) + 'Z';
        const dtstart = formatDateToICS(event.start_datetime);
        const dtend = event.end_datetime ? formatDateToICS(event.end_datetime) : dtstart;

        const summary = event.title;
        const description = event.description.replace(/\n/g, '\\n').replace(/,/g, '\\,');
        const location = `${event.location}${event.location_details ? ' - ' + event.location_details : ''}`.replace(/\n/g, '\\n').replace(/,/g, '\\,');
        
        const uid = uuidv4(); 

        icsContent += `BEGIN:VEVENT
UID:${uid}
DTSTAMP:${dtstamp}
DTSTART;TZID=${timeZone}:${dtstart}
DTEND;TZID=${timeZone}:${dtend}
SUMMARY:${summary}
DESCRIPTION:${description}
LOCATION:${location}
END:VEVENT
`;
    });

    icsContent += `END:VCALENDAR`;

    return icsContent;
};

export const downloadICS = (icsData: string, filename: string = 'events.ics') => {
    const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};