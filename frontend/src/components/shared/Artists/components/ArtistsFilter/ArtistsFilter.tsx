import { artistsFilterTranslations } from './lang';
import './ArtistsFilter.css';
import { useLanguage } from '../../../../../context/LanguageContext';

interface ArtistsFilterProps {
    filters: {
        searchQuery: string;
        selectedCity: string;
        selectedCountry: string;
        sortBy: 'newest' | 'oldest' | 'popular';
    };
    cities: any[];
    countries: any[];
    viewMode: 'grid' | 'list';
    onFilterChange: (key: string, value: any) => void;
    onViewModeChange: (mode: 'grid' | 'list') => void;
    onResetFilters: () => void;
}

export const ArtistsFilter = ({
    filters,
    cities,
    countries,
    viewMode,
    onFilterChange,
    onViewModeChange,
    onResetFilters
}: ArtistsFilterProps) => {
    const { language } = useLanguage();
    const lang = artistsFilterTranslations[language];

    const hasActiveFilters = 
        filters.searchQuery || 
        filters.selectedCity !== 'all' || 
        filters.selectedCountry !== 'all';

    return (
        <div className="artists-filter">
            <div className="artists-filter__search">
                <span className="artists-filter__search-icon">🔍</span>
                <input
                    type="text"
                    className="artists-filter__search-input"
                    placeholder={lang.searchPlaceholder}
                    value={filters.searchQuery}
                    onChange={(e) => onFilterChange('searchQuery', e.target.value)}
                />
                {filters.searchQuery && (
                    <button 
                        className="artists-filter__search-clear" 
                        onClick={() => onFilterChange('searchQuery', '')}
                    >
                        ✕
                    </button>
                )}
            </div>

            <div className="artists-filter__row">
                <div className="artists-filter__group">
                    <label className="artists-filter__label">{lang.city}</label>
                    <select
                        className="artists-filter__select"
                        value={filters.selectedCity}
                        onChange={(e) => onFilterChange('selectedCity', e.target.value)}
                    >
                        <option value="all">{lang.allCities}</option>
                        {cities.map(city => (
                            <option key={city.id} value={city.id}>
                                {city.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="artists-filter__group">
                    <label className="artists-filter__label">{lang.country}</label>
                    <select
                        className="artists-filter__select"
                        value={filters.selectedCountry}
                        onChange={(e) => onFilterChange('selectedCountry', e.target.value)}
                    >
                        <option value="all">{lang.allCountries}</option>
                        {countries.map(country => (
                            <option key={country.id} value={country.id}>
                                {country.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="artists-filter__group">
                    <label className="artists-filter__label">{lang.sort}</label>
                    <select
                        className="artists-filter__select"
                        value={filters.sortBy}
                        onChange={(e) => onFilterChange('sortBy', e.target.value)}
                    >
                        <option value="newest">{lang.sortOptions.newest}</option>
                        <option value="oldest">{lang.sortOptions.oldest}</option>
                        <option value="popular">{lang.sortOptions.popular}</option>
                    </select>
                </div>

                <div className="artists-filter__view-modes">
                    <button
                        className={`artists-filter__view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                        onClick={() => onViewModeChange('grid')}
                        title={lang.viewModes.grid}
                    >
                        ⊞
                    </button>
                    <button
                        className={`artists-filter__view-btn ${viewMode === 'list' ? 'active' : ''}`}
                        onClick={() => onViewModeChange('list')}
                        title={lang.viewModes.list}
                    >
                        ☰
                    </button>
                </div>
            </div>

            {hasActiveFilters && (
                <div className="artists-filter__active">
                    <span className="artists-filter__active-label">{lang.activeFilters}</span>
                    
                    {filters.searchQuery && (
                        <span className="artists-filter__active-tag">
                            {lang.search}: {filters.searchQuery}
                            <button onClick={() => onFilterChange('searchQuery', '')}>✕</button>
                        </span>
                    )}
                    
                    {filters.selectedCity !== 'all' && (
                        <span className="artists-filter__active-tag">
                            {lang.cityLabel}: {cities.find(c => String(c.id) === filters.selectedCity)?.name}
                            <button onClick={() => onFilterChange('selectedCity', 'all')}>✕</button>
                        </span>
                    )}
                    
                    {filters.selectedCountry !== 'all' && (
                        <span className="artists-filter__active-tag">
                            {lang.countryLabel}: {countries.find(c => String(c.id) === filters.selectedCountry)?.name}
                            <button onClick={() => onFilterChange('selectedCountry', 'all')}>✕</button>
                        </span>
                    )}
                    
                    <button className="artists-filter__reset" onClick={onResetFilters}>
                        {lang.resetAll}
                    </button>
                </div>
            )}
        </div>
    );
};