// src/components/ControlBar.tsx
import React from 'react';

interface ControlBarProps {
    searchTerm: string;
    onSearchChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onFilterClick: () => void;
    onAddClick: () => void;
    isAdmin: boolean;
    isFiltered: boolean;
    viewMode: 'list' | 'calendar';
    onViewModeChange: (mode: 'list' | 'calendar') => void;
}

const FilterIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="18" height="18">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 01-.659 1.591l-5.432 5.432a2.25 2.25 0 00-.659 1.591v2.927a2.25 2.25 0 01-1.244 2.013L9.75 21v-6.572a2.25 2.25 0 00-.659-1.591L3.659 7.409A2.25 2.25 0 013 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0112 3z" />
    </svg>
);

const AddIcon = () => (
 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="18" height="18">
  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
</svg>
);

const ListIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="18" height="18">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
    </svg>
);
const CalendarIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" width="18" height="18">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V16.5zm2.25-2.25h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V16.5z" />
    </svg>
);


const ControlBar: React.FC<ControlBarProps> = ({
    searchTerm,
    onSearchChange,
    onFilterClick,
    onAddClick,
    isAdmin,
    isFiltered,
    viewMode,
    onViewModeChange,
}) => {
    return (
        <div className="control-bar card">
            <div className="search-input-wrapper">
                <input
                    type="search"
                    placeholder="Поиск по названию или описанию..."
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

                <div className="view-toggle-group">
                    <button
                        onClick={() => onViewModeChange('list')}
                        className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
                        title="Список"
                        aria-label="Показать списком"
                    >
                         <ListIcon/>
                    </button>
                    <button
                        onClick={() => onViewModeChange('calendar')}
                         className={`view-toggle-btn ${viewMode === 'calendar' ? 'active' : ''}`}
                        title="Календарь"
                         aria-label="Показать календарем"
                    >
                         <CalendarIcon/>
                    </button>
                </div>

                {isAdmin && (
                    <button onClick={onAddClick} className="primary-btn add-btn">
                         <AddIcon />
                        Добавить
                    </button>
                )}
            </div>
        </div>
    );
};

export default ControlBar;