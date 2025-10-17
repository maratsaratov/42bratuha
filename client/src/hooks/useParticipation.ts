import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Participation } from '../types';
import { toast } from 'react-toastify';

export const useParticipation = () => {
    const { fetchWithAuth, isAuthenticated, currentUser } = useAuth();
    const [participations, setParticipations] = useState<Participation[]>([]);
    const [isLoadingParticipations, setIsLoadingParticipations] = useState(false);
    const [participationError, setParticipationError] = useState<string | null>(null);
    const [eventsVisitedCount, setEventsVisitedCount] = useState<number>(0);
    const [totalParticipatedCount, setTotalParticipatedCount] = useState<number>(0);

    const fetchUserParticipations = useCallback(async (status: 'upcoming' | 'past' | 'all' = 'all') => {
        if (!isAuthenticated || !currentUser) return;
        setIsLoadingParticipations(true);
        setParticipationError(null);
        try {
            const response = await fetchWithAuth(`/api/me/participations?status=${status}`);
            if (!response.ok) throw new Error((await response.json()).error || 'Не удалось загрузить ваши участия');
            const data: Participation[] = await response.json();
            setParticipations(data);
        } catch (err) {
            if (!(err instanceof Error && err.message.includes('401'))) {
                setParticipationError(err instanceof Error ? err.message : 'Ошибка при загрузке ваших участий');
                toast.error(err instanceof Error ? err.message : 'Ошибка при загрузке ваших участий');
            }
        } finally {
            setIsLoadingParticipations(false);
        }
    }, [isAuthenticated, currentUser, fetchWithAuth]);

    const fetchParticipationCounts = useCallback(async () => {
        if (!isAuthenticated || !currentUser) return;
        try {
            const response = await fetchWithAuth('/api/me/participations/count');
            if (!response.ok) throw new Error((await response.json()).error || 'Не удалось загрузить счетчики участия');
            const data = await response.json();
            setTotalParticipatedCount(data.total_participated);
            setEventsVisitedCount(data.attended_events);
        } catch (err) {
            if (!(err instanceof Error && err.message.includes('401'))) {
                toast.error(err instanceof Error ? err.message : 'Ошибка при загрузке счетчиков участия');
            }
        }
    }, [isAuthenticated, currentUser, fetchWithAuth]);

    const registerForEvent = useCallback(async (eventId: number) => {
        try {
            const response = await fetchWithAuth(`/api/events/${eventId}/participate`, { method: 'POST' });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Ошибка записи на мероприятие');
            }
            toast.success("Вы успешно записались на мероприятие!");
            return true;
        } catch (err) {
            if (!(err instanceof Error && err.message.includes('401'))) {
                toast.error(err instanceof Error ? err.message : 'Ошибка записи на мероприятие');
            }
            throw err;
        }
    }, [fetchWithAuth]);

    const unregisterFromEvent = useCallback(async (eventId: number) => {
        try {
            const response = await fetchWithAuth(`/api/events/${eventId}/participate`, { method: 'DELETE' });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Ошибка отмены записи');
            }
            toast.info("Вы отменили запись на мероприятие.");
            return true;
        } catch (err) {
            if (!(err instanceof Error && err.message.includes('401'))) {
                toast.error(err instanceof Error ? err.message : 'Ошибка отмены записи');
            }
            throw err;
        }
    }, [fetchWithAuth]);

    useEffect(() => {
        if (isAuthenticated && currentUser) {
            fetchUserParticipations();
            fetchParticipationCounts();
        } else {
            setParticipations([]);
            setEventsVisitedCount(0);
            setTotalParticipatedCount(0);
        }
    }, [isAuthenticated, currentUser, fetchUserParticipations, fetchParticipationCounts]);

    return {
        participations,
        isLoadingParticipations,
        participationError,
        eventsVisitedCount,
        totalParticipatedCount,
        fetchUserParticipations,
        fetchParticipationCounts,
        registerForEvent,
        unregisterFromEvent,
    };
};