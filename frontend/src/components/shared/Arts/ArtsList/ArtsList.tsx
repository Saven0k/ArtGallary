import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../../../context/LanguageContext';
import { artsListTranslations } from './lang';
import './index.css';
import { useNotification } from '../../../../context/NotificationContext';
import { getModeratedArts, type Art } from '../../../../api/arts/main.api';
import { getArtsByArtist } from '../../../../api/artists/main.api';
import { getAllStyles, type Style } from '../../../../api/styles/main.api';
import { getAllGenres, type Genre } from '../../../../api/genres/main.api';
import { ArtsGrid } from '../ArtsGrid/ArtsGrid';
import { ArtsEmpty } from '../ArtsEmpty/ArtsEmpty';
import { ArtsFilter } from '../ArtsFilter/ArtsFilter';
import { useAuth } from '../../../../hooks/useAuth';

interface ArtistArtsListProps {
    type?: 'all' | 'my';
    artistId?: number;
    title?: string;
    subtitle?: string;
}

export const ArtsList = ({ 
    type = 'all', 
    artistId, 
    title: customTitle, 
    subtitle: customSubtitle 
}: ArtistArtsListProps) => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { showNotification } = useNotification();
    const { language } = useLanguage();
    const lang = artsListTranslations[language];

    const [artsList, setArtsList] = useState<Art[]>([]);
    const [filteredArts, setFilteredArts] = useState<Art[]>([]);
    const [loading, setLoading] = useState(true);
    const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    const [filters, setFilters] = useState({
        searchQuery: '',
        selectedGenre: 'all',
        selectedType: 'all',
        sortBy: 'newest' as 'newest' | 'oldest' | 'popular'
    });

    const [genres, setGenres] = useState<Genre[]>([]);
    const [types, setTypes] = useState<Style[]>([]);
    const [artistName, setArtistName] = useState('');

    const getArtistId = (): number | null => {
        if (type === 'my') {
            return user?.id || null;
        }
        return artistId || null;
    };

    useEffect(() => {
        loadFilters();
        loadArts();
    }, [type, artistId, user?.id]);

    const loadFilters = async () => {
        try {
            const [genresData, typesData] = await Promise.all([
                getAllGenres(),
                getAllStyles()
            ]);
            setGenres(genresData);
            setTypes(typesData);
        } catch (error) {
            console.error('Error loading filters:', error);
        }
    };

    const loadArts = async () => {
        setLoading(true);
        try {
            let data;
            const targetArtistId = getArtistId();

            if (type === 'my' && targetArtistId) {
                data = await getArtsByArtist(targetArtistId);
                setArtistName(lang.hero.myWorks);
            } else if (targetArtistId) {
                data = await getArtsByArtist(targetArtistId);
                if (data && data.length > 0 && data[0]?.artist?.user) {
                    setArtistName(`${data[0].artist.user.surname} ${data[0].artist.user.name}`);
                }
            } else {
                const allArts = await getModeratedArts();
                data = allArts?.arts || [];
                setArtistName('');
            }

            setArtsList(data || []);
            setFilteredArts(data || []);
        } catch (error) {
            showNotification(lang.notifications.loadError, "error");
            setArtsList([]);
            setFilteredArts([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let filtered = [...artsList];

        if (filters.searchQuery) {
            const query = filters.searchQuery.toLowerCase();
            filtered = filtered.filter(art =>
                art.title.toLowerCase().includes(query) ||
                art.description.toLowerCase().includes(query) ||
                `${art.artist?.user?.surname} ${art.artist?.user?.name}`.toLowerCase().includes(query)
            );
        }

        if (filters.selectedGenre !== 'all') {
            filtered = filtered.filter(art =>
                String(art.genre?.id) === filters.selectedGenre
            );
        }

        if (filters.selectedType !== 'all') {
            filtered = filtered.filter(art =>
                String(art.style?.id) === filters.selectedType
            );
        }

        const sortFunctions = {
            newest: (a: Art, b: Art) => new Date(b.date_published).getTime() - new Date(a.date_published).getTime(),
            oldest: (a: Art, b: Art) => new Date(a.date_published).getTime() - new Date(b.date_published).getTime(),
            popular: (a: Art, b: Art) => (b.likes || 0) - (a.likes || 0)
        };

        const sortKey = filters.sortBy as keyof typeof sortFunctions;
        filtered.sort(sortFunctions[sortKey]);

        setFilteredArts(filtered);
    }, [filters, artsList]);

    const handleFilterChange = (key: string, value: string | number) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const resetFilters = () => {
        setFilters({
            searchQuery: '',
            selectedGenre: 'all',
            selectedType: 'all',
            sortBy: 'newest'
        });
    };

    const handleArtClick = (id: number) => {
        navigate(`/arts/${id}`);
    };

    const getHeroTitle = () => {
        if (type === 'my') return lang.hero.myWorks;
        if (artistName) return `${lang.hero.worksOfArtist} ${artistName}`;
        if (customTitle) return customTitle;
        return lang.hero.defaultTitle;
    };

    const getHeroSubtitle = () => {
        if (type === 'my') return lang.hero.mySubtitle;
        if (artistName) return `${lang.hero.artistSubtitle} ${artistName}`;
        if (customSubtitle) return customSubtitle;
        return lang.hero.defaultSubtitle;
    };

    if (loading) {
        return (
            <div className="artist-arts__loading">
                <div className="artist-arts__spinner"></div>
                <p>{lang.loading}</p>
            </div>
        );
    }

    return (
        <div className="artist-arts">
            <div className="artist-arts__hero">
                <div className="artist-arts__hero-content">
                    <h1 className="artist-arts__hero-title">{getHeroTitle()}</h1>
                    <p className="artist-arts__hero-subtitle">{getHeroSubtitle()}</p>
                    {type === 'my' && (
                        <button 
                            className="artist-arts__create-btn"
                            onClick={() => navigate('/arts/my/new')}
                        >
                            {lang.buttons.create}
                        </button>
                    )}
                </div>
            </div>

            <div className="artist-arts__container">
                <ArtsFilter
                    filters={filters}
                    genres={genres}
                    types={types}
                    viewMode={viewMode}
                    onFilterChange={handleFilterChange}
                    onViewModeChange={setViewMode}
                    onResetFilters={resetFilters}
                    onOpenMobileFilters={() => setIsMobileFiltersOpen(true)}
                />

                <div className="artist-arts__results">
                    <div className="artist-arts__results-header">
                        <h2 className="artist-arts__results-title">
                            {filteredArts.length === 0 
                                ? lang.results.noWorks
                                : `${lang.results.foundWorks} ${filteredArts.length}`
                            }
                        </h2>
                    </div>

                    {filteredArts.length === 0 ? (
                        <ArtsEmpty onReset={resetFilters} />
                    ) : (
                        <ArtsGrid
                            arts={filteredArts}
                            viewMode={viewMode}
                            onArtClick={handleArtClick}
                        />
                    )}
                </div>
            </div>

            {isMobileFiltersOpen && (
                <div className="artist-arts__modal" onClick={() => setIsMobileFiltersOpen(false)}>
                    <div className="artist-arts__modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="artist-arts__modal-header">
                            <h3>{lang.mobileFilters.title}</h3>
                            <button className="artist-arts__modal-close" onClick={() => setIsMobileFiltersOpen(false)}>
                                ✕
                            </button>
                        </div>
                        <div className="artist-arts__modal-body">
                            <div className="artist-arts__filter-group">
                                <label className="artist-arts__filter-label">{lang.mobileFilters.genre}</label>
                                <select
                                    className="artist-arts__filter-select"
                                    value={filters.selectedGenre}
                                    onChange={(e) => handleFilterChange('selectedGenre', e.target.value)}
                                >
                                    <option value="all">{lang.mobileFilters.allGenres}</option>
                                    {genres.map(genre => (
                                        <option key={genre.id} value={genre.id}>
                                            {genre.title}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="artist-arts__filter-group">
                                <label className="artist-arts__filter-label">{lang.mobileFilters.type}</label>
                                <select
                                    className="artist-arts__filter-select"
                                    value={filters.selectedType}
                                    onChange={(e) => handleFilterChange('selectedType', e.target.value)}
                                >
                                    <option value="all">{lang.mobileFilters.allTypes}</option>
                                    {types.map(type => (
                                        <option key={type.id} value={type.id}>
                                            {type.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="artist-arts__filter-group">
                                <label className="artist-arts__filter-label">{lang.mobileFilters.sort}</label>
                                <select
                                    className="artist-arts__filter-select"
                                    value={filters.sortBy}
                                    onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                                >
                                    <option value="newest">{lang.mobileFilters.sortOptions.newest}</option>
                                    <option value="oldest">{lang.mobileFilters.sortOptions.oldest}</option>
                                    <option value="popular">{lang.mobileFilters.sortOptions.popular}</option>
                                </select>
                            </div>

                            {(filters.searchQuery || filters.selectedGenre !== 'all' || filters.selectedType !== 'all') && (
                                <button className="artist-arts__modal-reset" onClick={resetFilters}>
                                    {lang.mobileFilters.reset}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};