import { fetchGenres, fetchStyles } from './fecthFuncs';

export const getConfig = (lang: any) => ({
    genre: {
        label: lang.genre || 'Жанр',
        placeholder: lang.genrePlaceholder || 'Введите жанр...',
        emptyMessage: lang.genreEmpty || 'Жанр не найден',
        fetch: fetchGenres,
        cacheKey: 'genres',
    },
    style: {
        label: lang.style || 'Стиль',
        placeholder: lang.stylePlaceholder || 'Введите стиль...',
        emptyMessage: lang.styleEmpty || 'Стиль не найден',
        fetch: fetchStyles,
        cacheKey: 'styles',
    }
});