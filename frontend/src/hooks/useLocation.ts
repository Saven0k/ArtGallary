// src/hooks/useLocation.ts
import { useState, useEffect, useCallback } from 'react';
import { getAllCountries, getCitiesByCountryCode, searchCountries, type CountrySuggestion, type CitySuggestion } from '../api/location/main.api';

export const useLocation = (lang: 'ru' | 'en' = 'ru') => {
    const [countries, setCountries] = useState<CountrySuggestion[]>([]);
    const [cities, setCities] = useState<CitySuggestion[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedCountry, setSelectedCountry] = useState<CountrySuggestion | null>(null);
    const [selectedCity, setSelectedCity] = useState<CitySuggestion | null>(null);

    // Загрузка всех стран
    const loadCountries = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getAllCountries(lang);
            setCountries(data);
            return data;
        } catch (error) {
            console.error('Error loading countries:', error);
            return [];
        } finally {
            setLoading(false);
        }
    }, [lang]);

    // Загрузка городов по коду страны (ISO2)
    const loadCities = useCallback(async (countryCode: string) => {
        if (!countryCode) {
            setCities([]);
            return [];
        }
        
        setLoading(true);
        try {
            const data = await getCitiesByCountryCode(countryCode, lang);
            setCities(data);
            return data;
        } catch (error) {
            console.error('Error loading cities:', error);
            return [];
        } finally {
            setLoading(false);
        }
    }, [lang]);

    // Поиск стран
    const search = useCallback(async (query: string) => {
        if (!query || query.length < 2) {
            return countries;
        }
        
        setLoading(true);
        try {
            const data = await searchCountries(query, lang);
            setCountries(data);
            return data;
        } catch (error) {
            console.error('Error searching countries:', error);
            return [];
        } finally {
            setLoading(false);
        }
    }, [lang, countries]);

    // Выбор страны
    const selectCountry = useCallback((countryId: number) => {
        const country = countries.find(c => c.id === countryId) || null;
        setSelectedCountry(country);
        if (country) {
            loadCities(country.iso2);
        } else {
            setCities([]);
        }
        return country;
    }, [countries, loadCities]);

    // Первоначальная загрузка
    useEffect(() => {
        loadCountries();
    }, [loadCountries]);

    return {
        countries,
        cities,
        loading,
        selectedCountry,
        selectedCity,
        setSelectedCity,
        loadCountries,
        loadCities,
        search,
        selectCountry,
    };
};
