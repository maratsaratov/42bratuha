import React, { memo } from 'react';
import { FilterIcon, AddIcon } from './icons';

interface ControlBarProps {
    searchTerm: string;
    onSearchChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onFilterClick: () => void;
    onAddClick: () => void;
    isAdmin: boolean;
    isFiltered: boolean;
    isArchiveMode: boolean; 
}

const ControlBar: React.FC<ControlBarProps> = ({
    searchTerm,
    onSearchChange,
    onFilterClick,
    onAddClick,
    isAdmin,
    isFiltered,
    isArchiveMode,
}) => {
    return (
        <div className="control-bar card">
            <div className="search-input-wrapper">
                <input
                    type="search"
                    placeholder="Поиск мероприятия"
                    value={searchTerm}
                    onChange={onSearchChange}
                    className="form-control search-input"
                />
                 {searchTerm && (
                     <button
                         onClick={() => onSearchChange({ target: { value: '' } } as React.ChangeEvent<HTMLInputElement>)}
                         className="clear-search-btn"
                         aria-label="Очистить поиск"
                     >
                         ×
                     </button>
                 )}
            </div>
            <div className="control-buttons">
                
                <button onClick={onFilterClick} className={`secondary-btn filter-btn ${isFiltered ? 'filter-active' : ''}`}>
                    <FilterIcon />
                    Фильтры {isFiltered && <span className="filter-indicator" title="Фильтры применены">•</span>}
                </button>
                {isAdmin && !isArchiveMode && (
                    <button onClick={onAddClick} className="primary-btn add-btn">
                         <AddIcon />
                        Добавить
                    </button>
                )}
            </div>
        </div>
    );
};

export default memo(ControlBar);