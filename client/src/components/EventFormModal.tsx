import React, { useEffect, useState } from 'react';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { Event, EventFormData, EventLocation, EventType, ParticipantRole } from '../types';
import { toLocalDateTimeString, toUTCISOString } from '../utils/dateUtils';

interface EventFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: EventFormData, imageFile: File | null) => Promise<void>;
    eventToEdit: Event | null;
    onDeleteImage: (eventId: number) => Promise<void>;
}

const EventFormModal: React.FC<EventFormModalProps> = ({ isOpen, onClose, onSubmit, eventToEdit, onDeleteImage }) => {
    const { register, handleSubmit, control, reset, watch, formState: { errors, isSubmitting } } = useForm<EventFormData>({
        mode: 'onBlur',
        defaultValues: {
            title: '', description: '', start_datetime: '', end_datetime: '',
            location: EventLocation.CENTRAL, location_details: '', event_type: EventType.SOCIAL, roles_available: [],
            registration_link_participant: '', registration_link_volunteer: '', registration_link_organizer: '',
        }
    });
    
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [isDeletingImage, setIsDeletingImage] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        } else {
            setSelectedFile(null);
            setPreview(null);
        }
    };
    
    const startDateTimeValue = watch("start_datetime");
    
    useEffect(() => {
        if (isOpen) {
            if (eventToEdit) {
                reset({
                    title: eventToEdit.title,
                    description: eventToEdit.description,
                    start_datetime: toLocalDateTimeString(eventToEdit.start_datetime),
                    end_datetime: toLocalDateTimeString(eventToEdit.end_datetime),
                    location: eventToEdit.location,
                    location_details: eventToEdit.location_details || '',
                    event_type: eventToEdit.event_type,
                    roles_available: eventToEdit.roles_available || [],
                    registration_link_participant: eventToEdit.registration_link_participant || '',
                    registration_link_volunteer: eventToEdit.registration_link_volunteer || '',
                    registration_link_organizer: eventToEdit.registration_link_organizer || '',
                });
                setPreview(eventToEdit.image_url || null);
            } else {
                reset({
                    title: '', description: '', start_datetime: '', end_datetime: '',
                    location: EventLocation.CENTRAL, location_details: '', event_type: EventType.SOCIAL, roles_available: [],
                    registration_link_participant: '', registration_link_volunteer: '', registration_link_organizer: '',
                });
                setPreview(null);
            }
            setSelectedFile(null);
            setIsDeletingImage(false);
        }
    }, [isOpen, eventToEdit, reset]);

    const handleFormSubmit: SubmitHandler<EventFormData> = async (data) => {
        const payload: EventFormData = {
            ...data,
            start_datetime: toUTCISOString(data.start_datetime) || '',
            end_datetime: toUTCISOString(data.end_datetime),
        };
        if (!payload.end_datetime) {
            delete (payload as Partial<EventFormData>).end_datetime;
        }
        
        try {
            await onSubmit(payload, selectedFile);
        } catch (err) {
            console.error("Form submission error:", err);
        }
    };

    const handleDeleteImage = async () => {
        if (!eventToEdit?.id) return;

        if (!window.confirm("Вы уверены, что хотите удалить текущее изображение? Это действие нельзя будет отменить.")) {
            return;
        }

        setIsDeletingImage(true);
        try {
            await onDeleteImage(eventToEdit.id);
            setPreview(null);
            setSelectedFile(null);
        } catch (error) {
            console.error("Failed to delete image:", error);
        } finally {
            setIsDeletingImage(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content event-form-modal" onClick={(e) => e.stopPropagation()}>
                <button onClick={onClose} className="auth-modal-close-btn" disabled={isSubmitting || isDeletingImage}>×</button>
                <h2>{eventToEdit ? 'Редактировать мероприятие' : 'Добавить мероприятие'}</h2>

                <form onSubmit={handleSubmit(handleFormSubmit)} className="form" noValidate>
                    <div className="form-group full-width">
                        <label htmlFor="image">Изображение мероприятия</label>
                        <input type="file" id="image" accept="image/png, image/jpeg, image/gif, image/webp" className="form-control" onChange={handleFileChange} disabled={isSubmitting || isDeletingImage} />
                        <small className="image-upload-helper">
                            Рекомендуемое соотношение сторон 16:9.
                        </small>
                        {preview && (
                             <div className="preview-wrapper">
                                <img src={preview} alt="Предпросмотр" className="preview-image"/>
                                {eventToEdit && (
                                     <button
                                        type="button"
                                        onClick={handleDeleteImage}
                                        className="secondary-btn small-btn delete-image-btn"
                                        disabled={isDeletingImage || isSubmitting}
                                     >
                                        {isDeletingImage ? 'Удаление...' : 'Удалить изображение'}
                                     </button>
                                )}
                            </div>
                        )}
                    </div>
                    
                    <div className="event-form-grid">
                        <div className="form-group full-width">
                            <label htmlFor="title">Название</label>
                            <input type="text" id="title" className={`form-control ${errors.title ? 'input-error' : ''}`} {...register("title", { required: "Название обязательно" })} disabled={isSubmitting} />
                            {errors.title && <span className="error-message">{errors.title.message}</span>}
                        </div>
                        <div className="form-group full-width">
                            <label htmlFor="description">Описание</label>
                            <textarea id="description" className={`form-control ${errors.description ? 'input-error' : ''}`} {...register("description", { required: "Описание обязательно" })} disabled={isSubmitting} />
                            {errors.description && <span className="error-message">{errors.description.message}</span>}
                        </div>
                        <div className="form-group">
                            <label htmlFor="start_datetime">Дата и время начала</label>
                            <input type="datetime-local" id="start_datetime" className={`form-control ${errors.start_datetime ? 'input-error' : ''}`} {...register("start_datetime", { required: "Дата и время начала обязательны" })} disabled={isSubmitting} />
                            {errors.start_datetime && <span className="error-message">{errors.start_datetime.message}</span>}
                        </div>
                        <div className="form-group">
                            <label htmlFor="end_datetime">Дата и время окончания</label>
                            <input type="datetime-local" id="end_datetime" className={`form-control ${errors.end_datetime ? 'input-error' : ''}`} {...register("end_datetime", { validate: value => { if (!value || !startDateTimeValue) return true; try { const start = new Date(startDateTimeValue); const end = new Date(value); if (isNaN(start.getTime()) || isNaN(end.getTime())) return true; return end >= start || "Дата окончания не может быть раньше даты начала"; } catch { return true; } } })} min={startDateTimeValue || ''} disabled={isSubmitting} />
                            {errors.end_datetime && <span className="error-message">{errors.end_datetime.message}</span>}
                        </div>
                        <div className="form-group">
                            <label htmlFor="location">Место проведения</label>
                            <select id="location" className={`form-control ${errors.location ? 'input-error' : ''}`} {...register("location", { required: "Место проведения обязательно" })} disabled={isSubmitting}>
                                {Object.values(EventLocation).map(loc => (<option key={loc} value={loc}>{loc}</option>))}
                            </select>
                            {errors.location && <span className="error-message">{errors.location.message}</span>}
                        </div>
                        <div className="form-group">
                            <label htmlFor="location_details">Детали места (аудитория и т.п.)</label>
                            <input type="text" id="location_details" className="form-control" {...register("location_details")} disabled={isSubmitting} />
                        </div>
                        <div className="form-group">
                            <label htmlFor="event_type">Направление мероприятия</label>
                            <select id="event_type" className={`form-control ${errors.event_type ? 'input-error' : ''}`} {...register("event_type", { required: "Направление обязательно" })} disabled={isSubmitting}>
                                {Object.values(EventType).map(type => (<option key={type} value={type}>{type}</option>))}
                            </select>
                            {errors.event_type && <span className="error-message">{errors.event_type.message}</span>}
                        </div>
                        <div className="form-group checkbox-group full-width">
                            <label>Доступные роли</label>
                            <Controller name="roles_available" control={control} rules={{ validate: value => value.length > 0 || "Выберите хотя бы одну роль" }} render={({ field }) => (
                                <div className="checkbox-options">
                                    {Object.values(ParticipantRole).map(role => (
                                        <div key={role} className="checkbox-item">
                                            <input type="checkbox" id={`role-${role}`} value={role} checked={field.value.includes(role)} onChange={(e) => { const selectedRoles = field.value; if (e.target.checked) { field.onChange([...selectedRoles, role]); } else { field.onChange(selectedRoles.filter(r => r !== role)); } }} disabled={isSubmitting} />
                                            <label htmlFor={`role-${role}`}>{role}</label>
                                        </div>
                                    ))}
                                </div>
                            )} />
                            {errors.roles_available && <span className="error-message">{errors.roles_available.message}</span>}
                        </div>
                        <div className="form-group full-width">
                            <label htmlFor="registration_link_participant">Ссылка для Участников</label>
                            <input type="url" id="registration_link_participant" placeholder="https://example.com/register/participant" className={`form-control ${errors.registration_link_participant ? 'input-error' : ''}`} {...register("registration_link_participant", { pattern: { value: /^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w-./?%&=]*)?$/, message: "Неверный формат URL" } })} disabled={isSubmitting} />
                            {errors.registration_link_participant && <span className="error-message">{errors.registration_link_participant.message}</span>}
                        </div>
                        <div className="form-group full-width">
                            <label htmlFor="registration_link_volunteer">Ссылка для Волонтёров</label>
                            <input type="url" id="registration_link_volunteer" placeholder="https://example.com/register/volunteer" className={`form-control ${errors.registration_link_volunteer ? 'input-error' : ''}`} {...register("registration_link_volunteer", { pattern: { value: /^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w-./?%&=]*)?$/, message: "Неверный формат URL" } })} disabled={isSubmitting} />
                            {errors.registration_link_volunteer && <span className="error-message">{errors.registration_link_volunteer.message}</span>}
                        </div>
                        <div className="form-group full-width">
                            <label htmlFor="registration_link_organizer">Ссылка для Организаторов</label>
                            <input type="url" id="registration_link_organizer" placeholder="https://example.com/register/organizer" className={`form-control ${errors.registration_link_organizer ? 'input-error' : ''}`} {...register("registration_link_organizer", { pattern: { value: /^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w-./?%&=]*)?$/, message: "Неверный формат URL" } })} disabled={isSubmitting} />
                            {errors.registration_link_organizer && <span className="error-message">{errors.registration_link_organizer.message}</span>}
                        </div>
                    </div>
                    <div className="form-submit-wrapper">
                        <button type="submit" className="form-submit-btn primary-btn" disabled={isSubmitting || isDeletingImage}>
                            {isSubmitting ? 'Сохранение...' : (eventToEdit ? 'Сохранить изменения' : 'Добавить мероприятие')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EventFormModal;