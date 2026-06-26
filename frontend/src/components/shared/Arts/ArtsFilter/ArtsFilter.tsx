import { useLanguage } from '../../../../context/LanguageContext';
import { artsFilterTranslations } from './lang';
import './index.css';

interface ArtsFilterProps {
    filters: {
        searchQuery: string;
        selectedGenre: string;
        selectedType: string;
        sortBy: 'newest' | 'oldest' | 'popular';
    };
    genres: any[];
    types: any[];
    viewMode: 'grid' | 'list';
    onFilterChange: (key: string, value: any) => void;
    onViewModeChange: (mode: 'grid' | 'list') => void;
    onResetFilters: () => void;
    onOpenMobileFilters: () => void;
}

export const ArtsFilter = ({
    filters,
    genres,
    types,
    viewMode,
    onFilterChange,
    onViewModeChange,
    onResetFilters,
    onOpenMobileFilters
}: ArtsFilterProps) => {
    const { language } = useLanguage();
    const lang = artsFilterTranslations[language];

    const hasActiveFilters = 
        filters.searchQuery || 
        filters.selectedGenre !== 'all' || 
        filters.selectedType !== 'all';

    const DesktopFilters = () => (
        <>
            <div className="arts-filter__search">
                <span className="arts-filter__search-icon">🔍</span>
                <input
                    type="text"
                    className="arts-filter__search-input"
                    placeholder={lang.searchPlaceholder}
                    value={filters.searchQuery}
                    onChange={(e) => onFilterChange('searchQuery', e.target.value)}
                />
                {filters.searchQuery && (
                    <button 
                        className="arts-filter__search-clear" 
                        onClick={() => onFilterChange('searchQuery', '')}
                    >
                        ✕
                    </button>
                )}
            </div>

            <div className="arts-filter__row">
                <div className="arts-filter__group">
                    <label className="arts-filter__label">{lang.genre}</label>
                    <select
                        className="arts-filter__select"
                        value={filters.selectedGenre}
                        onChange={(e) => onFilterChange('selectedGenre', e.target.value)}
                    >
                        <option value="all">{lang.all}</option>
                        {genres.map(genre => (
                            <option key={genre.id} value={genre.id}>
                                {genre.title}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="arts-filter__group">
                    <label className="arts-filter__label">{lang.type}</label>
                    <select
                        className="arts-filter__select"
                        value={filters.selectedType}
                        onChange={(e) => onFilterChange('selectedType', e.target.value)}
                    >
                        <option value="all">{lang.all}</option>
                        {types.map(type => (
                            <option key={type.id} value={type.id}>
                                {type.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="arts-filter__group">
                    <label className="arts-filter__label">{lang.sort}</label>
                    <select
                        className="arts-filter__select"
                        value={filters.sortBy}
                        onChange={(e) => onFilterChange('sortBy', e.target.value)}
                    >
                        <option value="newest">{lang.sortOptions.newest}</option>
                        <option value="oldest">{lang.sortOptions.oldest}</option>
                        <option value="popular">{lang.sortOptions.popular}</option>
                    </select>
                </div>

                <div className="arts-filter__view-modes">
                    <button
                        className={`arts-filter__view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                        onClick={() => onViewModeChange('grid')}
                        title={lang.viewModes.grid}
                    >
                        ⊞
                    </button>
                    <button
                        className={`arts-filter__view-btn ${viewMode === 'list' ? 'active' : ''}`}
                        onClick={() => onViewModeChange('list')}
                        title={lang.viewModes.list}
                    >
                        ☰
                    </button>
                </div>
            </div>

            {hasActiveFilters && (
                <div className="arts-filter__active">
                    <span className="arts-filter__active-label">{lang.filters}:</span>
                    {filters.searchQuery && (
                        <span className="arts-filter__active-tag">
                            {lang.search}: {filters.searchQuery}
                            <button onClick={() => onFilterChange('searchQuery', '')}>✕</button>
                        </span>
                    )}
                    {filters.selectedGenre !== 'all' && (
                        <span className="arts-filter__active-tag">
                            {genres.find(g => String(g.id) === filters.selectedGenre)?.title}
                            <button onClick={() => onFilterChange('selectedGenre', 'all')}>✕</button>
                        </span>
                    )}
                    {filters.selectedType !== 'all' && (
                        <span className="arts-filter__active-tag">
                            {types.find(t => String(t.id) === filters.selectedType)?.name}
                            <button onClick={() => onFilterChange('selectedType', 'all')}>✕</button>
                        </span>
                    )}
                    <button className="arts-filter__reset" onClick={onResetFilters}>
                        {lang.reset}
                    </button>
                </div>
            )}
        </>
    );

    const MobileFilters = () => (
        <div className="arts-filter__mobile-bar">
            <div className="arts-filter__mobile-search">
                <span className="arts-filter__search-icon">🔍</span>
                <input
                    type="text"
                    className="arts-filter__mobile-search-input"
                    placeholder={lang.searchPlaceholder}
                    value={filters.searchQuery}
                    onChange={(e) => onFilterChange('searchQuery', e.target.value)}
                />
                {filters.searchQuery && (
                    <button 
                        className="arts-filter__search-clear" 
                        onClick={() => onFilterChange('searchQuery', '')}
                    >
                        ✕
                    </button>
                )}
            </div>
            <button 
                className="arts-filter__mobile-btn"
                onClick={onOpenMobileFilters}
            >
                {lang.mobileFilters}
                {hasActiveFilters && <span className="arts-filter__mobile-badge" />}
            </button>
            <div className="arts-filter__view-modes">
                <button
                    className={`arts-filter__view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                    onClick={() => onViewModeChange('grid')}
                >
                    ⊞
                </button>
                <button
                    className={`arts-filter__view-btn ${viewMode === 'list' ? 'active' : ''}`}
                    onClick={() => onViewModeChange('list')}
                >
                    ☰
                </button>
            </div>
        </div>
    );

    return (
        <div className="arts-filter">
            <div className="arts-filter__desktop">
                <DesktopFilters />
            </div>
            <div className="arts-filter__mobile">
                <MobileFilters />
            </div>
        </div>
    );
};