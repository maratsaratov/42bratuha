import React, { useEffect } from 'react';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import { Event, EventFormData, EventLocation, EventType, ParticipantRole } from '../types';
import { toast } from 'react-toastify';

interface EventFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: EventFormData) => Promise<void>;
    eventToEdit: Event | null;
}

const formatDateTimeLocal = (isoString?: string | null): string => {
    if (!isoString) return '';
    try {
        const date = new Date(isoString);
        const timezoneOffset = date.getTimezoneOffset() * 60000;
        const localDate = new Date(date.getTime() - timezoneOffset);
        return localDate.toISOString().slice(0, 16);
    } catch (e) {
        console.error("Error formatting date:", e);
        return '';
    }
};

// Helper to convert datetime-local string back to ISO string (UTC)
const toISOStringUTC = (localDateTimeString?: string | null): string | undefined => {
    if (!localDateTimeString) return undefined;
    try {
        const date = new Date(localDateTimeString);
        if (isNaN(date.getTime())) return undefined;
        return date.toISOString();
    } catch (e) {
         console.error("Error converting to ISO:", e);
        return undefined;
    }
};


const EventFormModal: React.FC<EventFormModalProps> = ({ isOpen, onClose, onSubmit, eventToEdit }) => {
    const {
        register,
        handleSubmit,
        control,
        reset,
        watch,
        formState: { errors, isSubmitting },
    } = useForm<EventFormData>({
        mode: 'onBlur',
        defaultValues: {
            title: '',
            description: '',
            start_datetime: '',
            end_datetime: '',
            location: EventLocation.CENTRAL,
            location_details: '',
            event_type: EventType.SOCIAL,
            roles_available: [],
            registration_link_participant: '',
            registration_link_volunteer: '',
            registration_link_organizer: '',
        }
    });

    const startDateTimeValue = watch("start_datetime");

    useEffect(() => {
        if (isOpen) {
            if (eventToEdit) {
                reset({
                    title: eventToEdit.title,
                    description: eventToEdit.description,
                    start_datetime: formatDateTimeLocal(eventToEdit.start_datetime),
                    end_datetime: formatDateTimeLocal(eventToEdit.end_datetime),
                    location: eventToEdit.location,
                    location_details: eventToEdit.location_details || '',
                    event_type: eventToEdit.event_type,
                    roles_available: eventToEdit.roles_available || [],
                    registration_link_participant: eventToEdit.registration_link_participant || '',
                    registration_link_volunteer: eventToEdit.registration_link_volunteer || '',
                    registration_link_organizer: eventToEdit.registration_link_organizer || '',
                });
            } else {
                reset({
                    title: '',
                    description: '',
                    start_datetime: '',
                    end_datetime: '',
                    location: EventLocation.CENTRAL,
                    location_details: '',
                    event_type: EventType.SOCIAL,
                    roles_available: [],
                    registration_link_participant: '',
                    registration_link_volunteer: '',
                    registration_link_organizer: '',
                });
            }
        }
    }, [isOpen, eventToEdit, reset]);

    const handleFormSubmit: SubmitHandler<EventFormData> = async (data) => {
        const payload: EventFormData = {
            ...data,
            start_datetime: toISOStringUTC(data.start_datetime) || '',
            end_datetime: toISOStringUTC(data.end_datetime),
            registration_link_participant: data.registration_link_participant || undefined,
            registration_link_volunteer: data.registration_link_volunteer || undefined,
            registration_link_organizer: data.registration_link_organizer || undefined,
        };
         if (!payload.end_datetime) {
            delete payload.end_datetime;
        }


        try {
            await onSubmit(payload);
        } catch (err) {
            console.error("Form submission error:", err);
        }
    };


    if (!isOpen) {
        return null;
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content event-form-modal" onClick={(e) => e.stopPropagation()}>
                <button
                    onClick={onClose}
                    style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', fontSize: '1.8rem', cursor: 'pointer', lineHeight: '1', padding: '0' }}
                    disabled={isSubmitting}
                    aria-label="Закрыть"
                >
                    ×
                </button>
                <h2>{eventToEdit ? 'Редактировать мероприятие' : 'Добавить мероприятие'}</h2>

                <form onSubmit={handleSubmit(handleFormSubmit)} className="form" noValidate>
                    <div className="event-form-grid">
                        <div className="form-group full-width">
                            <label htmlFor="title">Название</label>
                            <input
                                type="text"
                                id="title"
                                className={`form-control ${errors.title ? 'input-error' : ''}`}
                                {...register("title", { required: "Название обязательно" })}
                                disabled={isSubmitting}
                            />
                            {errors.title && <span className="error-message">{errors.title.message}</span>}
                        </div>

                        <div className="form-group full-width">
                            <label htmlFor="description">Описание</label>
                            <textarea
                                id="description"
                                className={`form-control ${errors.description ? 'input-error' : ''}`}
                                {...register("description", { required: "Описание обязательно" })}
                                disabled={isSubmitting}
                            />
                            {errors.description && <span className="error-message">{errors.description.message}</span>}
                        </div>


                        <div className="form-group">
                            <label htmlFor="start_datetime">Дата и время начала</label>
                            <input
                                type="datetime-local"
                                id="start_datetime"
                                className={`form-control ${errors.start_datetime ? 'input-error' : ''}`}
                                {...register("start_datetime", { required: "Дата и время начала обязательны" })}
                                disabled={isSubmitting}
                            />
                             {errors.start_datetime && <span className="error-message">{errors.start_datetime.message}</span>}
                        </div>

                        <div className="form-group">
                            <label htmlFor="end_datetime">Дата и время окончания</label>
                            <input
                                type="datetime-local"
                                id="end_datetime"
                                className={`form-control ${errors.end_datetime ? 'input-error' : ''}`}
                                {...register("end_datetime", {
                                    validate: value => {
                                        if (!value || !startDateTimeValue) return true; // No end date or no start date yet is fine
                                        try {
                                             const start = new Date(startDateTimeValue);
                                             const end = new Date(value);
                                             if (isNaN(start.getTime()) || isNaN(end.getTime())) return true; // Invalid date format allows submission, handled by backend
                                             return end >= start || "Дата окончания не может быть раньше даты начала";
                                        } catch {
                                            return true; // Let backend handle invalid format? Or add regex pattern
                                        }
                                    }
                                })}
                                min={startDateTimeValue || ''} // Set min based on start time
                                disabled={isSubmitting}
                            />
                            {errors.end_datetime && <span className="error-message">{errors.end_datetime.message}</span>}
                        </div>


                         <div className="form-group">
                            <label htmlFor="location">Место проведения</label>
                            <select
                                id="location"
                                className={`form-control ${errors.location ? 'input-error' : ''}`}
                                {...register("location", { required: "Место проведения обязательно" })}
                                disabled={isSubmitting}
                            >
                                {Object.values(EventLocation).map(loc => (
                                    <option key={loc} value={loc}>{loc}</option>
                                ))}
                            </select>
                            {errors.location && <span className="error-message">{errors.location.message}</span>}
                        </div>

                        <div className="form-group">
                            <label htmlFor="location_details">Детали места (аудитория и т.п.)</label>
                            <input
                                type="text"
                                id="location_details"
                                className="form-control"
                                {...register("location_details")}
                                disabled={isSubmitting}
                            />
                        </div>

                         <div className="form-group">
                             <label htmlFor="event_type">Направление мероприятия</label>
                             <select
                                 id="event_type"
                                 className={`form-control ${errors.event_type ? 'input-error' : ''}`}
                                 {...register("event_type", { required: "Направление обязательно" })}
                                 disabled={isSubmitting}
                             >
                                 {Object.values(EventType).map(type => (
                                     <option key={type} value={type}>{type}</option>
                                 ))}
                             </select>
                             {errors.event_type && <span className="error-message">{errors.event_type.message}</span>}
                         </div>

                         <div className="form-group checkbox-group full-width">
                            <label>Доступные роли</label>
                             <Controller
                                name="roles_available"
                                control={control}
                                rules={{ validate: value => value.length > 0 || "Выберите хотя бы одну роль" }}
                                render={({ field }) => (
                                    <div className="checkbox-options">
                                        {Object.values(ParticipantRole).map(role => (
                                            <div key={role} className="checkbox-item">
                                                <input
                                                    type="checkbox"
                                                    id={`role-${role}`}
                                                    value={role}
                                                    checked={field.value.includes(role)}
                                                    onChange={(e) => {
                                                        const selectedRoles = field.value;
                                                        if (e.target.checked) {
                                                            field.onChange([...selectedRoles, role]);
                                                        } else {
                                                            field.onChange(selectedRoles.filter(r => r !== role));
                                                        }
                                                    }}
                                                     disabled={isSubmitting}
                                                />
                                                <label htmlFor={`role-${role}`}>{role}</label>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            />
                             {errors.roles_available && <span className="error-message">{errors.roles_available.message}</span>}
                         </div>


                         <div className="form-group full-width">
                            <label htmlFor="registration_link_participant">Ссылка для Участников</label>
                            <input
                                type="url"
                                id="registration_link_participant"
                                placeholder="https://example.com/register/participant"
                                className={`form-control ${errors.registration_link_participant ? 'input-error' : ''}`}
                                {...register("registration_link_participant", {
                                     pattern: { value: /^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w-./?%&=]*)?$/, message: "Неверный формат URL" }
                                })}
                                disabled={isSubmitting}
                            />
                             {errors.registration_link_participant && <span className="error-message">{errors.registration_link_participant.message}</span>}
                        </div>

                        <div className="form-group full-width">
                            <label htmlFor="registration_link_volunteer">Ссылка для Волонтёров</label>
                            <input
                                type="url"
                                id="registration_link_volunteer"
                                placeholder="https://example.com/register/volunteer"
                                className={`form-control ${errors.registration_link_volunteer ? 'input-error' : ''}`}
                                {...register("registration_link_volunteer", {
                                    pattern: { value: /^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w-./?%&=]*)?$/, message: "Неверный формат URL" }
                                })}
                                disabled={isSubmitting}
                            />
                             {errors.registration_link_volunteer && <span className="error-message">{errors.registration_link_volunteer.message}</span>}
                        </div>

                        <div className="form-group full-width">
                            <label htmlFor="registration_link_organizer">Ссылка для Организаторов</label>
                            <input
                                type="url"
                                id="registration_link_organizer"
                                placeholder="https://example.com/register/organizer"
                                className={`form-control ${errors.registration_link_organizer ? 'input-error' : ''}`}
                                {...register("registration_link_organizer", {
                                     pattern: { value: /^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[\w-./?%&=]*)?$/, message: "Неверный формат URL" }
                                })}
                                disabled={isSubmitting}
                            />
                            {errors.registration_link_organizer && <span className="error-message">{errors.registration_link_organizer.message}</span>}
                        </div>

                    </div>

                    <button type="submit" className="primary-btn" disabled={isSubmitting} style={{ marginTop: '1.5rem' }}>
                        {isSubmitting ? 'Сохранение...' : (eventToEdit ? 'Сохранить изменения' : 'Добавить мероприятие')}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default EventFormModal;