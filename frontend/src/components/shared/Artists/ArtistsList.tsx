import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../../context/LanguageContext';
import { artistsListTranslations } from './lang';
import './ArtistsList.css';
import { ArtistsFilter } from './components/ArtistsFilter/ArtistsFilter';
import { ArtistsGrid } from './components/ArtistsGrid/ArtistsGrid';
import { ArtistsEmpty } from './components/ArtistsEmpty/ArtistsEmpty';
import { useNotification } from '../../../context/NotificationContext';
import type { ArtistUser } from '../../../types/user.types';
import { getAllCities, type City } from '../../../api/cities/main.api';
import { getAllCountries, type Country } from '../../../api/contries/main.api';
import { getModeratedArtists } from '../../../api/artists/main.api';

export const ArtistsList = () => {
    const navigate = useNavigate();
    const { showNotification } = useNotification();
    const { language } = useLanguage();
    const lang = artistsListTranslations[language];

    const [artistsList, setArtistsList] = useState<ArtistUser[]>([]);
    const [filteredArtists, setFilteredArtists] = useState<ArtistUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    const [filters, setFilters] = useState({
        searchQuery: '',
        selectedCity: 'all',
        selectedCountry: 'all',
        sortBy: 'newest' as 'newest' | 'oldest' | 'popular'
    });

    const [cities, setCities] = useState<City[]>([]);
    const [countries, setCountries] = useState<Country[]>([]);

    useEffect(() => {
        loadFilters();
        loadArtists();
    }, []);

    const loadFilters = async () => {
        try {
            const [citiesData, countriesData] = await Promise.all([
                getAllCities(),
                getAllCountries()
            ]);
            setCities(citiesData);
            setCountries(countriesData);
        } catch (error) {
            console.error('Error loading filters:', error);
        }
    };

    const loadArtists = async () => {
        setLoading(true);
        try {
            const data = await getModeratedArtists();
            setArtistsList(data?.data || []);
            setFilteredArtists(data?.data || []);
        } catch (error) {
            showNotification(lang.notifications.loadError, "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let filtered = [...artistsList];

        if (filters.searchQuery) {
            const query = filters.searchQuery.toLowerCase();
            filtered = filtered.filter(artist =>
                artist.name.toLowerCase().includes(query) ||
                artist.surname.toLowerCase().includes(query) ||
                `${artist.surname} ${artist.name}`.toLowerCase().includes(query) ||
                (artist.second_name && artist.second_name.toLowerCase().includes(query))
            );
        }

        if (filters.selectedCity !== 'all') {
            filtered = filtered.filter(artist =>
                String(artist.artistProfile?.city?.id) === filters.selectedCity
            );
        }

        if (filters.selectedCountry !== 'all') {
            filtered = filtered.filter(artist =>
                String(artist.artistProfile?.country?.id) === filters.selectedCountry
            );
        }

        const sortFunctions = {
            newest: (a: ArtistUser, b: ArtistUser) => {
                const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                return dateB - dateA;
            },
            oldest: (a: ArtistUser, b: ArtistUser) => {
                const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                return dateA - dateB;
            },
            popular: (a: ArtistUser, b: ArtistUser) =>
                (b.artistProfile?.arts?.length || 0) - (a.artistProfile?.arts?.length || 0)
        };

        const sortKey = filters.sortBy as keyof typeof sortFunctions;
        filtered.sort(sortFunctions[sortKey]);

        setFilteredArtists(filtered);
    }, [filters, artistsList]);

    const handleFilterChange = (key: string, value: string | number) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const resetFilters = () => {
        setFilters({
            searchQuery: '',
            selectedCity: 'all',
            selectedCountry: 'all',
            sortBy: 'newest'
        });
    };

    const handleArtistClick = (id: number) => {
        navigate(`/artists/${id}`);
    };

    if (loading) {
        return (
            <div className="artists-page__loading">
                <div className="artists-page__spinner"></div>
                <p>{lang.loading}</p>
            </div>
        );
    }

    return (
        <div className="artists-page">
            <div className="artists-page__hero">
                <div className="artists-page__hero-content">
                    <h1 className="artists-page__hero-title">{lang.hero.title}</h1>
                    <p className="artists-page__hero-subtitle">
                        {lang.hero.subtitle}
                    </p>
                </div>
            </div>

            <div className="artists-page__container">
                <ArtistsFilter
                    filters={filters}
                    cities={cities}
                    countries={countries}
                    viewMode={viewMode}
                    onFilterChange={handleFilterChange}
                    onViewModeChange={setViewMode}
                    onResetFilters={resetFilters}
                />

                <div className="artists-page__results">
                    <div className="artists-page__results-header">
                        <h2 className="artists-page__results-title">
                            {lang.results.found} {filteredArtists.length}
                        </h2>
                    </div>

                    {filteredArtists.length === 0 ? (
                        <ArtistsEmpty onReset={resetFilters} />
                    ) : (
                        <ArtistsGrid
                            artists={filteredArtists}
                            viewMode={viewMode}
                            onArtistClick={handleArtistClick}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};