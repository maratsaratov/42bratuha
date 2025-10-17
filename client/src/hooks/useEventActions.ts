import { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { Event, EventFormData } from '../types';
import { toast } from 'react-toastify';

type ConfirmActionType = 'archive' | 'delete' | 'restore';

export const useEventActions = (refetchEvents: () => void) => {
    const { fetchWithAuth } = useAuth();

    const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    
    const [eventToEdit, setEventToEdit] = useState<Event | null>(null);
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    
    const [eventToConfirmId, setEventToConfirmId] = useState<number | null>(null);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [confirmActionType, setConfirmActionType] = useState<ConfirmActionType | null>(null);

    const handleViewDetails = useCallback((event: Event | null) => {
        setSelectedEvent(event);
        setIsDetailModalOpen(!!event);
    }, []);

    const handleCloseDetailModal = () => {
        setIsDetailModalOpen(false);
        setSelectedEvent(null);
    };

    const handleOpenAddForm = () => {
        setEventToEdit(null);
        setIsFormModalOpen(true);
    };

    const handleOpenEditForm = (event: Event) => {
        setEventToEdit(event);
        setIsFormModalOpen(true);
    };
    
    const handleCloseFormModal = () => {
        setIsFormModalOpen(false);
        setEventToEdit(null);
    };

    const handleInitiateArchive = (eventId: number) => {
        setEventToConfirmId(eventId);
        setConfirmActionType('archive');
        setIsConfirmModalOpen(true);
    };

    const handleInitiateRestore = (eventId: number) => {
        setEventToConfirmId(eventId);
        setConfirmActionType('restore');
        setIsConfirmModalOpen(true);
    };

    const handleInitiateHardDelete = (eventId: number) => {
        setEventToConfirmId(eventId);
        setConfirmActionType('delete');
        setIsConfirmModalOpen(true);
    };

    const handleCloseConfirmModal = () => {
        setIsConfirmModalOpen(false);
        setEventToConfirmId(null);
        setConfirmActionType(null);
    };

    const confirmAction = async () => {
        if (eventToConfirmId === null || confirmActionType === null) return;
        
        setIsDeleting(true); 
        try {
            let successMessage = '';
            let endpoint = '';
            let method = 'POST'; 
            
            if (confirmActionType === 'archive') {
                endpoint = `/api/events/${eventToConfirmId}/archive`;
                successMessage = "Мероприятие успешно архивировано!";
            } else if (confirmActionType === 'restore') {
                endpoint = `/api/events/${eventToConfirmId}/restore`;
                successMessage = "Мероприятие успешно восстановлено!";
            } else if (confirmActionType === 'delete') {
                endpoint = `/api/events/${eventToConfirmId}`;
                method = 'DELETE'; 
                successMessage = "Мероприятие успешно удалено навсегда!";
            }

            await fetchWithAuth(endpoint, { method: method });
            toast.success(successMessage);
            refetchEvents();
            if (selectedEvent?.id === eventToConfirmId) handleCloseDetailModal();
        } catch (err) {
            if (!(err instanceof Error && err.message.includes('401'))) {
                toast.error(err instanceof Error ? err.message : `Ошибка ${confirmActionType === 'archive' ? 'архивирования' : confirmActionType === 'restore' ? 'восстановления' : 'удаления'}`);
            }
        } finally {
            setIsDeleting(false);
            handleCloseConfirmModal();
        }
    };

    const confirmArchiveAction = confirmAction; 
    const confirmDeleteAction = confirmAction; 

    const handleSaveEvent = async (formData: EventFormData, imageFile: File | null) => {
        const isEditing = !!eventToEdit;
        try {
            let savedEvent: Event;
            if (isEditing) {
                const response = await fetchWithAuth(`/api/events/${eventToEdit!.id}`, { method: 'PUT', body: JSON.stringify(formData) });
                savedEvent = await response.json();
                toast.success("Данные мероприятия успешно обновлены!");
            } else {
                const response = await fetchWithAuth('/api/events', { method: 'POST', body: JSON.stringify(formData) });
                savedEvent = await response.json();
                toast.success("Мероприятие успешно создано!");
            }

            if (imageFile && savedEvent.id) {
                const imageFormData = new FormData();
                imageFormData.append('image', imageFile);
                const imageResponse = await fetchWithAuth(`/api/events/${savedEvent.id}/upload_image`, { method: 'POST', body: imageFormData });
                if (!imageResponse.ok) {
                    toast.warn(`Мероприятие сохранено, но не удалось загрузить изображение: ${(await imageResponse.json()).error}`);
                }
            }
            refetchEvents();
            handleCloseFormModal();
        } catch (err) {
            if (!(err instanceof Error && err.message.includes('401'))) {
                toast.error(err instanceof Error ? err.message : 'Ошибка сохранения');
                throw err;
            }
        }
    };

    const handleImageDelete = async (eventId: number) => {
        try {
            await fetchWithAuth(`/api/events/${eventId}/image`, { method: 'DELETE' });
            refetchEvents();
            toast.success("Изображение успешно удалено!");
        } catch (err) {
            if (!(err instanceof Error && err.message.includes('401'))) {
                toast.error(err instanceof Error ? err.message : 'Ошибка удаления изображения');
                throw err;
            }
        }
    };

    return {
        selectedEvent,
        isDetailModalOpen,
        eventToEdit,
        isFormModalOpen,
        isConfirmModalOpen,
        isDeleting,
        handleViewDetails,
        handleCloseDetailModal,
        handleOpenAddForm,
        handleOpenEditForm,
        handleCloseFormModal,
        handleInitiateArchive, 
        handleInitiateHardDelete, 
        handleInitiateRestore, 
        handleCloseConfirmModal,
        confirmArchiveAction, 
        confirmDeleteAction, 
        confirmActionType, 
        handleSaveEvent,
        handleImageDelete,
    };
};