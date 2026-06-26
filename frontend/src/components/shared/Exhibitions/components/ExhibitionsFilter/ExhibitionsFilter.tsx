import { useState } from 'react';
import { useLanguage } from '../../../../../context/LanguageContext';
import { exhibitionsFilterTranslations } from './lang';
import './ExhibitionsFilter.css';

interface ExhibitionsFilterProps {
    filters: {
        searchQuery: string;
        selectedCity: string;
        selectedCountry: string;
        selectedType: string;
        selectedGenre: string;
        sortBy: 'newest' | 'oldest' | 'visitors';
    };
    cities: any[];
    countries: any[];
    types: any[];
    genres: any[];
    viewMode: 'grid' | 'list';
    onFilterChange: (key: string, value: any) => void;
    onViewModeChange: (mode: 'grid' | 'list') => void;
    onResetFilters: () => void;
}

export const ExhibitionsFilter = ({
    filters,
    cities,
    countries,
    types,
    genres,
    viewMode,
    onFilterChange,
    onViewModeChange,
    onResetFilters
}: ExhibitionsFilterProps) => {
    const { language } = useLanguage();
    const lang = exhibitionsFilterTranslations[language];
    const [isFiltersVisible, setIsFiltersVisible] = useState(false);

    const hasActiveFilters = 
        filters.searchQuery || 
        filters.selectedCity !== 'all' || 
        filters.selectedCountry !== 'all' ||
        filters.selectedType !== 'all' ||
        filters.selectedGenre !== 'all';

    const toggleFilters = () => {
        setIsFiltersVisible(!isFiltersVisible);
    };

    return (
        <div className="exhibitions-filter">
            <div className="exhibitions-filter__mobile-toggle">
                <button 
                    className="exhibitions-filter__toggle-btn"
                    onClick={toggleFilters}
                >
                    {isFiltersVisible ? lang.mobile.hideFilters : lang.mobile.showFilters}
                    {hasActiveFilters && <span className="exhibitions-filter__toggle-badge" />}
                </button>
                <div className="exhibitions-filter__view-modes">
                    <button
                        className={`exhibitions-filter__view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                        onClick={() => onViewModeChange('grid')}
                        title={lang.viewModes.grid}
                    >
                        ⊞
                    </button>
                    <button
                        className={`exhibitions-filter__view-btn ${viewMode === 'list' ? 'active' : ''}`}
                        onClick={() => onViewModeChange('list')}
                        title={lang.viewModes.list}
                    >
                        ☰
                    </button>
                </div>
            </div>

            <div className={`exhibitions-filter__content ${isFiltersVisible ? 'exhibitions-filter__content--visible' : ''}`}>
                <div className="exhibitions-filter__search">
                    <span className="exhibitions-filter__search-icon">🔍</span>
                    <input
                        type="text"
                        className="exhibitions-filter__search-input"
                        placeholder={lang.searchPlaceholder}
                        value={filters.searchQuery}
                        onChange={(e) => onFilterChange('searchQuery', e.target.value)}
                    />
                    {filters.searchQuery && (
                        <button 
                            className="exhibitions-filter__search-clear" 
                            onClick={() => onFilterChange('searchQuery', '')}
                        >
                            ✕
                        </button>
                    )}
                </div>

                <div className="exhibitions-filter__row">
                    <div className="exhibitions-filter__group">
                        <label className="exhibitions-filter__label">{lang.labels.city}</label>
                        <select
                            className="exhibitions-filter__select"
                            value={filters.selectedCity}
                            onChange={(e) => onFilterChange('selectedCity', e.target.value)}
                        >
                            <option value="all">{lang.options.allCities}</option>
                            {cities.map(city => (
                                <option key={city.id} value={city.id}>
                                    {city.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="exhibitions-filter__group">
                        <label className="exhibitions-filter__label">{lang.labels.country}</label>
                        <select
                            className="exhibitions-filter__select"
                            value={filters.selectedCountry}
                            onChange={(e) => onFilterChange('selectedCountry', e.target.value)}
                        >
                            <option value="all">{lang.options.allCountries}</option>
                            {countries.map(country => (
                                <option key={country.id} value={country.id}>
                                    {country.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="exhibitions-filter__group">
                        <label className="exhibitions-filter__label">{lang.labels.type}</label>
                        <select
                            className="exhibitions-filter__select"
                            value={filters.selectedType}
                            onChange={(e) => onFilterChange('selectedType', e.target.value)}
                        >
                            <option value="all">{lang.options.allTypes}</option>
                            {types.map(type => (
                                <option key={type.id} value={type.id}>
                                    {type.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="exhibitions-filter__group">
                        <label className="exhibitions-filter__label">{lang.labels.genre}</label>
                        <select
                            className="exhibitions-filter__select"
                            value={filters.selectedGenre}
                            onChange={(e) => onFilterChange('selectedGenre', e.target.value)}
                        >
                            <option value="all">{lang.options.allGenres}</option>
                            {genres.map(genre => (
                                <option key={genre.id} value={genre.id}>
                                    {genre.title}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="exhibitions-filter__group">
                        <label className="exhibitions-filter__label">{lang.labels.sort}</label>
                        <select
                            className="exhibitions-filter__select"
                            value={filters.sortBy}
                            onChange={(e) => onFilterChange('sortBy', e.target.value)}
                        >
                            <option value="newest">{lang.options.sortNewest}</option>
                            <option value="oldest">{lang.options.sortOldest}</option>
                            <option value="visitors">{lang.options.sortVisitors}</option>
                        </select>
                    </div>

                    <button className="exhibitions-filter__reset-btn" onClick={onResetFilters}>
                        {lang.reset}
                    </button>
                </div>

                {hasActiveFilters && (
                    <div className="exhibitions-filter__active">
                        <span className="exhibitions-filter__active-label">{lang.active.label}</span>
                        {filters.searchQuery && (
                            <span className="exhibitions-filter__active-tag">
                                {lang.active.search}: {filters.searchQuery}
                                <button onClick={() => onFilterChange('searchQuery', '')}>✕</button>
                            </span>
                        )}
                        {filters.selectedCity !== 'all' && (
                            <span className="exhibitions-filter__active-tag">
                                {lang.active.city}: {cities.find(c => String(c.id) === filters.selectedCity)?.name}
                                <button onClick={() => onFilterChange('selectedCity', 'all')}>✕</button>
                            </span>
                        )}
                        {filters.selectedCountry !== 'all' && (
                            <span className="exhibitions-filter__active-tag">
                                {lang.active.country}: {countries.find(c => String(c.id) === filters.selectedCountry)?.name}
                                <button onClick={() => onFilterChange('selectedCountry', 'all')}>✕</button>
                            </span>
                        )}
                        {filters.selectedType !== 'all' && (
                            <span className="exhibitions-filter__active-tag">
                                {lang.active.type}: {types.find(t => String(t.id) === filters.selectedType)?.name}
                                <button onClick={() => onFilterChange('selectedType', 'all')}>✕</button>
                            </span>
                        )}
                        {filters.selectedGenre !== 'all' && (
                            <span className="exhibitions-filter__active-tag">
                                {lang.active.genre}: {genres.find(g => String(g.id) === filters.selectedGenre)?.title}
                                <button onClick={() => onFilterChange('selectedGenre', 'all')}>✕</button>
                            </span>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};