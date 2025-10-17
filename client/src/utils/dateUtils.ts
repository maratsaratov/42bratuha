import { format as formatTz } from 'date-fns-tz';
import { parseISO } from 'date-fns';
import { ru } from 'date-fns/locale';

export const toLocalDateTimeString = (utcString?: string | null): string => {
    if (!utcString) return '';
    try {
        let correctedDateString = utcString;
        if (correctedDateString.includes('T') && !correctedDateString.endsWith('Z') && !correctedDateString.includes('+')) {
            correctedDateString += 'Z';
        }

        const date = parseISO(correctedDateString);
        return formatTz(date, "yyyy-MM-dd'T'HH:mm", { timeZone: 'Asia/Krasnoyarsk' });
    } catch (e) {
        return '';
    }
};

export const toUTCISOString = (localDateTimeString?: string | null): string | undefined => {
    if (!localDateTimeString) return undefined;
    try {
        const date = new Date(localDateTimeString);
        if (isNaN(date.getTime())) return undefined;
        return date.toISOString();
    } catch (e) {
        return undefined;
    }
};

export const formatDate = (dateString: string | null | undefined, includeTime = false): string => {
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

export const formatDateTimeRange = (start: string, end?: string | null): string => {
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

export const formatSingleDateTime = (dateString: string | null | undefined): string => {
    if (!dateString) return '';
    try {
        let correctedDateString = dateString;
        if (correctedDateString.includes('T') && !correctedDateString.endsWith('Z') && !correctedDateString.includes('+')) {
            correctedDateString += 'Z';
        }
        
        const date = parseISO(correctedDateString);
        if (isNaN(date.getTime())) return 'Неверная дата';

        return formatTz(date, 'd MMMM yyyy, HH:mm', {
            timeZone: 'Asia/Krasnoyarsk',
            locale: ru,
        });
    } catch (e) {
        console.error("Date formatting error:", e);
        return 'Ошибка даты';
    }
};

export const formatDateToICS = (isoString: string): string => {
    try {
        const date = parseISO(isoString);
        if (isNaN(date.getTime())) return '';
        return formatTz(date, 'yyyyMMdd\'T\'HHmmss', { timeZone: 'Asia/Krasnoyarsk' });
    } catch (e) {
        console.error("Error formatting date for ICS:", e);
        return '';
    }
};