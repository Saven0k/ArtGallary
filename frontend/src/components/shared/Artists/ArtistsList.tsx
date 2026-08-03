import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../../context/LanguageContext';
import { artistsListTranslations } from './lang';
import './ArtistsList.css';
import { ArtistsFilter } from './components/ArtistsFilter/ArtistsFilter';
import { ArtistsGrid } from './components/ArtistsGrid/ArtistsGrid';
import { ArtistsEmpty } from './components/ArtistsEmpty/ArtistsEmpty';
import { useNotification } from '../../../context/NotificationContext';
import { getModeratedArtists, type ArtistProfileResponse } from '../../../api/artists/main.api';
import type { ArtistUser } from '../../../types/user.types';

// ✅ Правильные импорты из location API
import { getAllCountries, getCitiesByCountryCode, type CountrySuggestion, type CitySuggestion } from '../../../api/location/main.api';

export const ArtistsList = () => {
    const navigate = useNavigate();
    const { showNotification } = useNotification();
    const { language } = useLanguage();
    const lang = artistsListTranslations[language];

    const [artistsList, setArtistsList] = useState<any[]>([]);
    const [filteredArtists, setFilteredArtists] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    const [filters, setFilters] = useState({
        searchQuery: '',
        selectedCity: 'all',
        selectedCountry: 'all',
        sortBy: 'newest' as 'newest' | 'oldest' | 'popular'
    });

    const [cities, setCities] = useState<CitySuggestion[]>([]);
    const [countries, setCountries] = useState<CountrySuggestion[]>([]);
    // Для фильтра по стране (используем ISO2 код страны)
    const [selectedCountryIso, setSelectedCountryIso] = useState<string | null>(null);

    useEffect(() => {
        loadFilters();
        loadArtists();
    }, []);

    const loadFilters = async () => {
        try {
            const countriesData = await getAllCountries();
            setCountries(countriesData);
            
            if (selectedCountryIso) {
                const citiesData = await getCitiesByCountryCode(selectedCountryIso);
                setCities(citiesData);
            } else {
                setCities([]);
            }
        } catch (error) {
            console.error('Error loading filters:', error);
        }
    };

    useEffect(() => {
        if (selectedCountryIso) {
            const loadCitiesForCountry = async () => {
                try {
                    const citiesData = await getCitiesByCountryCode(selectedCountryIso);
                    setCities(citiesData);
                } catch (error) {
                    console.error('Error loading cities:', error);
                }
            };
            loadCitiesForCountry();
        } else {
            setCities([]);
        }
    }, [selectedCountryIso]);

    const loadArtists = async () => {
        setLoading(true);
        try {
            const data = await getModeratedArtists();
            const listData = (data?.data as unknown as ArtistUser[]) || [];
            setArtistsList(listData);
            setFilteredArtists(listData);
        } catch (error) {
            showNotification(lang.notifications.loadError, "error");
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (key: string, value: string | number) => {
        setFilters(prev => ({ ...prev, [key]: value }));
        
        if (key === 'selectedCountry') {
            const iso2 = value === 'all' ? null : String(value);
            setSelectedCountryIso(iso2);
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
                (artist.artistProfile?.country?.iso2 || artist.artistProfile?.country?.code || artist.artistProfile?.country_id?.toString()) === filters.selectedCountry
            );
        }

        const sortFunctions = {
            newest: (a: ArtistProfileResponse, b: ArtistProfileResponse) => {
                const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                return dateB - dateA;
            },
            oldest: (a: ArtistProfileResponse, b: ArtistProfileResponse) => {
                const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                return dateA - dateB;
            }
        };

        const sortKey = filters.sortBy as keyof typeof sortFunctions;
        filtered.sort(sortFunctions[sortKey]);

        setFilteredArtists(filtered);
    }, [filters, artistsList]);

    const resetFilters = () => {
        setFilters({
            searchQuery: '',
            selectedCity: 'all',
            selectedCountry: 'all',
            sortBy: 'newest'
        });
        setSelectedCountryIso(null);
        setCities([]);
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
