import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../../context/LanguageContext';
import { exhibitionsListTranslations } from './lang';
import './ExhibitionsList.css';
import { ExhibitionsFilter } from './components/ExhibitionsFilter/ExhibitionsFilter';
import { ExhibitionsGrid } from './components/ExhibitionsGrid/ExhibitionsGrid';
import { ExhibitionsEmpty } from './components/ExhibitionsEmpty/ExhibitionsEmpty';
import { useNotification } from '../../../context/NotificationContext';
import { getAllExhibitions, getModeratedExhibitions, type Exhibition } from '../../../api/exhibitions/main.api';
import { getAllCities, type City } from '../../../api/cities/main.api';
import { getAllCountries, type Country } from '../../../api/contries/main.api';
import { getAllStyles, type Style } from '../../../api/styles/main.api';
import { getAllGenres, type Genre } from '../../../api/genres/main.api';

export const ExhibitionsList = () => {
    const navigate = useNavigate();
    const { showNotification } = useNotification();
    const { language } = useLanguage();
    const lang = exhibitionsListTranslations[language];

    const [exhibitionsList, setExhibitionsList] = useState<Exhibition[]>([]);
    const [filteredExhibitions, setFilteredExhibitions] = useState<Exhibition[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [isFirstLoad, setIsFirstLoad] = useState(true);

    const [filters, setFilters] = useState({
        searchQuery: '',
        selectedCity: 'all',
        selectedCountry: 'all',
        selectedType: 'all',
        selectedGenre: 'all',
        sortBy: 'newest' as 'newest' | 'oldest' | 'visitors'
    });

    const [cities, setCities] = useState<City[]>([]);
    const [countries, setCountries] = useState<Country[]>([]);
    const [types, setTypes] = useState<Style[]>([]);
    const [genres, setGenres] = useState<Genre[]>([]);

    useEffect(() => {
        loadFilters();
        loadExhibitions();
    }, []);

    const loadFilters = async () => {
        try {
            const [citiesData, countriesData, typesData, genresData] = await Promise.all([
                getAllCities(),
                getAllCountries(),
                getAllStyles(),
                getAllGenres()
            ]);
            setCities(citiesData);
            setCountries(countriesData);
            setTypes(typesData);
            setGenres(genresData);
        } catch (error) {
            console.error('Error loading filters:', error);
        }
    };

    const loadExhibitions = async () => {
        setLoading(true);
        try {
            const data = await getModeratedExhibitions(1, 20);
            setExhibitionsList(data?.data || []);
            setFilteredExhibitions(data?.data || []);
            setTimeout(() => setIsFirstLoad(false), 100);
        } catch (error) {
            showNotification(lang.notifications.loadError, "error");
            setIsFirstLoad(false);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let filtered = [...exhibitionsList];

        if (filters.searchQuery) {
            const query = filters.searchQuery.toLowerCase();
            filtered = filtered.filter(exhibition =>
                exhibition.title.toLowerCase().includes(query) ||
                exhibition.description.toLowerCase().includes(query) ||
                exhibition.address.toLowerCase().includes(query)
            );
        }
        if (filters.selectedCity !== 'all') filtered = filtered.filter(exhibition => String(exhibition.city?.id) === filters.selectedCity);
        if (filters.selectedCountry !== 'all') filtered = filtered.filter(exhibition => String(exhibition.country?.id) === filters.selectedCountry);
        if (filters.selectedType !== 'all') filtered = filtered.filter(exhibition => String(exhibition.type?.id) === filters.selectedType);
        if (filters.selectedGenre !== 'all') filtered = filtered.filter(exhibition => String(exhibition.genre?.id) === filters.selectedGenre);
        
        const sortFunctions = {
            newest: (a: Exhibition, b: Exhibition) => new Date(b.date).getTime() - new Date(a.date).getTime(),
            oldest: (a: Exhibition, b: Exhibition) => new Date(a.date).getTime() - new Date(b.date).getTime(),
            visitors: (a: Exhibition, b: Exhibition) => (b.visitors_count || 0) - (a.visitors_count || 0)
        };
        const sortKey = filters.sortBy as keyof typeof sortFunctions;
        filtered.sort(sortFunctions[sortKey]);
        setFilteredExhibitions(filtered);
    }, [filters, exhibitionsList]);

    const handleFilterChange = (key: string, value: string | number) => setFilters(prev => ({ ...prev, [key]: value }));

    const resetFilters = () => {
        setFilters({
            searchQuery: '',
            selectedCity: 'all',
            selectedCountry: 'all',
            selectedType: 'all',
            selectedGenre: 'all',
            sortBy: 'newest'
        });
    };

    const handleExhibitionClick = (id: number) => navigate(`/exhibitions/${id}`);

    if (loading && isFirstLoad) {
        return (
            <div className="exhibitions-page__loading">
                <div className="exhibitions-page__spinner"></div>
                <p>{lang.loading}</p>
            </div>
        );
    }

    return (
        <div className="exhibitions-page">
            <div className="exhibitions-page__hero">
                <div className="exhibitions-page__hero-content">
                    <h1 className="exhibitions-page__hero-title">{lang.hero.title}</h1>
                    <p className="exhibitions-page__hero-subtitle">
                        {lang.hero.subtitle}
                    </p>
                </div>
            </div>

            <div className="exhibitions-page__container">
                <ExhibitionsFilter
                    filters={filters}
                    cities={cities}
                    countries={countries}
                    types={types}
                    genres={genres}
                    viewMode={viewMode}
                    onFilterChange={handleFilterChange}
                    onViewModeChange={setViewMode}
                    onResetFilters={resetFilters}
                />

                <div className="exhibitions-page__results">
                    <div className="exhibitions-page__results-header">
                        <h2 className="exhibitions-page__results-title">
                            {lang.results.found} {filteredExhibitions.length}
                        </h2>
                    </div>

                    {filteredExhibitions.length === 0 && !loading ? (
                        <ExhibitionsEmpty onReset={resetFilters} />
                    ) : (
                        <ExhibitionsGrid
                            exhibitions={filteredExhibitions}
                            viewMode={viewMode}
                            onExhibitionClick={handleExhibitionClick}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};