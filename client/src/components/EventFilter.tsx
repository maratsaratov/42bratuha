import React, { useState, useEffect } from 'react';
import { EventFilters, ParticipantRole, EventLocation, EventType } from '../types';

interface EventFilterModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialFilters: EventFilters;
    onApplyFilters: (filtersToApply: EventFilters) => void;
    onResetFilters: () => void;
}

const EventFilterModal: React.FC<EventFilterModalProps> = ({
    isOpen,
    onClose,
    initialFilters,
    onApplyFilters,
    onResetFilters
}) => {
    const [localFilters, setLocalFilters] = useState<EventFilters>({});

    useEffect(() => {
        if (isOpen) {
            setLocalFilters(initialFilters);
        }

    }, [isOpen, initialFilters]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setLocalFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleApplyClick = () => {
        onApplyFilters(localFilters);
        onClose();
    };

    const handleResetClick = () => {
        setLocalFilters({});
        onResetFilters();
    };

    if (!isOpen) {
        return null;
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content filter-modal-content" onClick={(e) => e.stopPropagation()}>
                <button
                    onClick={onClose}
                    style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', fontSize: '1.8rem', cursor: 'pointer', lineHeight: '1', padding: '0' }}
                    aria-label="Закрыть"
                >
                    ×
                </button>
                <h2>Фильтры мероприятий</h2>

                <div className="filter-grid modal-filter-grid">
                    <div className="form-group">
                        <label htmlFor="modal_startDate">Дата начала</label>
                        <input
                            type="date"
                            id="modal_startDate"
                            name="startDate"
                            value={localFilters.startDate || ''}
                            onChange={handleInputChange}
                            className="form-control"
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="modal_endDate">Дата окончания</label>
                        <input
                            type="date"
                            id="modal_endDate"
                            name="endDate"
                            value={localFilters.endDate || ''}
                            onChange={handleInputChange}
                            min={localFilters.startDate || ''}
                            className="form-control"
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="modal_role">Роль</label>
                        <select
                            id="modal_role"
                            name="role"
                            value={localFilters.role || ''}
                            onChange={handleInputChange}
                            className="form-control"
                        >
                            <option value="">Любая</option>
                            {Object.values(ParticipantRole).map(role => (
                                <option key={role} value={role}>{role}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label htmlFor="modal_location">Место</label>
                        <select
                            id="modal_location"
                            name="location"
                            value={localFilters.location || ''}
                            onChange={handleInputChange}
                            className="form-control"
                        >
                            <option value="">Любое</option>
                            {Object.values(EventLocation).map(loc => (
                                <option key={loc} value={loc}>{loc}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label htmlFor="modal_type">Направление</label>
                        <select
                            id="modal_type"
                            name="type"
                            value={localFilters.type || ''}
                            onChange={handleInputChange}
                            className="form-control"
                        >
                            <option value="">Любое</option>
                            {Object.values(EventType).map(type => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="modal-footer">
                    <button onClick={handleResetClick} className="secondary-btn small-btn">Сбросить</button>
                    <button onClick={handleApplyClick} className="primary-btn small-btn">Применить</button>
                </div>
            </div>
        </div>
    );
};

export default EventFilterModal;