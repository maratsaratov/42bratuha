import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Event, EventFilters } from '../types';
import { toast } from 'react-toastify';

export const useEvents = (filters: EventFilters, debouncedSearchTerm: string, status: 'active' | 'archive') => {
    const { isAuthenticated, fetchWithAuth } = useAuth();
    const [events, setEvents] = useState<Event[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchEvents = useCallback(async () => {
        if (!isAuthenticated) return;
        setIsLoading(true);
        setError(null);
        
        const queryParams = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => value && queryParams.append(key, value as string));
        if (debouncedSearchTerm) queryParams.append('search', debouncedSearchTerm);
        queryParams.append('status', status);

        try {
            const response = await fetchWithAuth(`/api/events?${queryParams.toString()}`);
            if (!response.ok) throw new Error((await response.json()).error || 'Не удалось загрузить мероприятия');
            const data: Event[] = await response.json();
            setEvents(data);
        } catch (err) {
            if (!(err instanceof Error && err.message.includes('401'))) {
                const message = err instanceof Error ? err.message : 'Ошибка при загрузке';
                setError(message);
                toast.error(message);
            }
        } finally {
            setIsLoading(false);
        }
    }, [isAuthenticated, fetchWithAuth, filters, debouncedSearchTerm, status]);

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);
    
    useEffect(() => {
        if (!isAuthenticated) {
            setEvents([]);
        }
    }, [isAuthenticated]);

    return { events, isLoading, error, refetch: fetchEvents };
};