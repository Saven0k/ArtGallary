import { fetchCities, fetchCountries, fetchGenres, fetchStyles } from "./fecthFuncs";

export const getConfig = (lang: any) => ({
    city: {
        label: lang.labels.city,
        placeholder: lang.placeholders.city,
        emptyMessage: lang.emptyMessage.city,
        fetch: fetchCities,
        cacheKey: "cities"
    },
    country: {
        label: lang.labels.country,
        placeholder: lang.placeholders.country,
        emptyMessage: lang.emptyMessage.country,
        fetch: fetchCountries,
        cacheKey: "countries"
    },
    genre: {
        label: lang.labels.genre,
        placeholder: lang.placeholders.genre,
        emptyMessage: lang.emptyMessage.genre,
        fetch: fetchGenres,
        cacheKey: "genres"
    },
    style: {
        label: lang.labels.style,
        placeholder: lang.placeholders.style,
        emptyMessage: lang.emptyMessage.style,
        fetch: fetchStyles,
        cacheKey: "styles"
    }
});