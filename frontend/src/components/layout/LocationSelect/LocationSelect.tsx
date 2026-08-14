// src/components/LocationSelect/LocationSelect.tsx
// Поля CountrySuggestion/CitySuggestion теперь соответствуют серверным моделям (name_en, name_ru)

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  searchCountries,
  searchCities,
  getCountryByCode,
  getCityById,
  type CountrySuggestion,
  type CitySuggestion,
} from '../../../api/location/main.api';
import './LocationSelect.scss';

interface LocationSelectProps {
  countryValue?: string | number;
  cityValue?: number;
  onCountryChange: (iso2: string, name: string, iso2OrId: string | number) => void;
  onCityChange: (cityId: number | null, cityName: string) => void;
  isEditing?: boolean;
  lang?: 'ru' | 'en';
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export const LocationSelect: React.FC<LocationSelectProps> = ({
  countryValue = '',
  cityValue,
  onCountryChange,
  onCityChange,
  isEditing = true,
  lang = 'ru',
}) => {
  const [countryDisplay, setCountryDisplay] = useState('');
  const [cityDisplay, setCityDisplay] = useState('');
  const [countryQuery, setCountryQuery] = useState('');
  const [cityQuery, setCityQuery] = useState('');
  const debouncedCountryQuery = useDebounce(countryQuery, 350);
  const debouncedCityQuery = useDebounce(cityQuery, 350);
  const [selectedCountryCode, setSelectedCountryCode] = useState<string>(String(countryValue || ''));
  const [selectedCityId, setSelectedCityId] = useState<number | null>(cityValue ?? null);
  const [countrySuggestions, setCountrySuggestions] = useState<CountrySuggestion[]>([]);
  const [citySuggestions, setCitySuggestions] = useState<CitySuggestion[]>([]);
  const [countryOpen, setCountryOpen] = useState(false);
  const [cityOpen, setCityOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const countryRef = useRef<HTMLDivElement>(null);
  const cityRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);

  // Инициализация
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    const init = async () => {
      if (countryValue && typeof countryValue === 'string') {
        const country = await getCountryByCode(countryValue, lang);
        if (country) {
          setCountryDisplay(country.name_en || country.iso2);
          setSelectedCountryCode(country.iso2);
        } else {
          setCountryDisplay(countryValue);
          setSelectedCountryCode(countryValue);
        }
      }
      if (cityValue) {
        const city = await getCityById(cityValue, lang);
        if (city) {
          setCityDisplay(city.name_en || city.id.toString());
          setSelectedCityId(city.id);
        }
      }
    };
    init();
  }, []);

  // Обновление страны при изменении пропса
  useEffect(() => {
    if (!initialized.current) return;
    const currentCountryValueStr = String(countryValue || '');
    if (!currentCountryValueStr || currentCountryValueStr === selectedCountryCode) return;
    if (typeof countryValue === 'string') {
      getCountryByCode(countryValue, lang).then(country => {
        if (country) {
          setCountryDisplay(country.name_en || country.iso2);
          setSelectedCountryCode(country.iso2);
        }
      });
    }
  }, [countryValue, lang]);

  // Поиск стран
  useEffect(() => {
    if (debouncedCountryQuery.length < 2) {
      setCountrySuggestions([]);
      setCountryOpen(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    searchCountries(debouncedCountryQuery, lang).then(results => {
      if (!cancelled) {
        setCountrySuggestions(results);
        setCountryOpen(results.length > 0);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [debouncedCountryQuery, lang]);

  // Поиск городов
  useEffect(() => {
    if (debouncedCityQuery.length < 2) {
      setCitySuggestions([]);
      setCityOpen(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    searchCities(debouncedCityQuery, selectedCountryCode || undefined, lang).then(results => {
      if (!cancelled) {
        setCitySuggestions(results);
        setCityOpen(results.length > 0);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [debouncedCityQuery, selectedCountryCode, lang]);

  // Клик вне компонента
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (countryRef.current && !countryRef.current.contains(e.target as Node)) {
        setCountryOpen(false);
        setCountryQuery('');
      }
      if (cityRef.current && !cityRef.current.contains(e.target as Node)) {
        setCityOpen(false);
        setCityQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Обработчики выбора
  const handleCountrySelect = useCallback((country: CountrySuggestion) => {
    const name = country.name_en || country.iso2;
    setCountryDisplay(name);
    setSelectedCountryCode(country.iso2);
    setCountryQuery('');
    setCountryOpen(false);

    onCountryChange(country.iso2, name, country.iso2);

    setCityDisplay('');
    setSelectedCityId(null);
    setCityQuery('');
    onCityChange(null, '');
  }, [onCountryChange, onCityChange]);

  const handleCitySelect = useCallback((city: CitySuggestion) => {
    const name = city.name_en || city.id.toString();
    setCityDisplay(name);
    setSelectedCityId(city.id);
    setCityQuery('');
    setCityOpen(false);

    onCityChange(city.id, name);
  }, [onCityChange]);

  // View mode
  if (!isEditing) {
    return (
      <div className="location-select location-select--view">
        <div className="location-select__group">
          <label className="location-select__label">Страна</label>
          <div className="location-select__value">{countryDisplay || 'Не указано'}</div>
        </div>
        {selectedCountryCode && (
          <div className="location-select__group">
            <label className="location-select__label">Город</label>
            <div className="location-select__value">{cityDisplay || 'Не указано'}</div>
          </div>
        )}
      </div>
    );
  }

  // Edit mode
  return (
    <div className="location-select">
      <div className="location-select__group" ref={countryRef}>
        <label className="location-select__label">Страна</label>
        <div className="location-select__input-wrapper">
          <input
            type="text"
            className="location-select__input"
            value={countryQuery || countryDisplay}
            onChange={e => {
              const val = e.target.value;
              setCountryQuery(val);
              if (!val) {
                setCountryDisplay('');
                setSelectedCountryCode('');
                setCountryOpen(false);
              }
            }}
            onFocus={() => {
              setCountryQuery(countryDisplay);
              setCountryDisplay('');
            }}
            onBlur={() => {
              setTimeout(() => {
                if (!countryOpen) {
                  setCountryDisplay(selectedCountryCode ? countryDisplay : '');
                  setCountryQuery('');
                }
              }, 150);
            }}
            placeholder="Начните вводить страну..."
            autoComplete="off"
          />
          {loading && <span className="location-select__spinner" aria-hidden="true" />}
        </div>
        {countryOpen && countrySuggestions.length > 0 && (
          <ul className="location-select__dropdown" role="listbox">
            {countrySuggestions.map(item => (
              <li
                key={item.id}
                className="location-select__item"
                role="option"
                onMouseDown={e => {
                  e.preventDefault();
                  handleCountrySelect(item);
                }}
              >
                {item.name_en || item.iso2}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="location-select__group" ref={cityRef}>
        <label className="location-select__label">Город</label>
        <div className="location-select__input-wrapper">
          <input
            type="text"
            className={`location-select__input ${!selectedCountryCode ? 'location-select__input--disabled' : ''}`}
            value={cityQuery || cityDisplay}
            onChange={e => {
              const val = e.target.value;
              setCityQuery(val);
              if (!val) {
                setCityDisplay('');
                setSelectedCityId(null);
                setCityOpen(false);
              }
            }}
            onFocus={() => {
              if (!selectedCountryCode) return;
              setCityQuery(cityDisplay);
              setCityDisplay('');
            }}
            onBlur={() => {
              setTimeout(() => {
                if (!cityOpen) {
                  setCityDisplay(selectedCityId ? cityDisplay : '');
                  setCityQuery('');
                }
              }, 150);
            }}
            placeholder={selectedCountryCode ? 'Начните вводить город...' : 'Сначала выберите страну'}
            disabled={!selectedCountryCode}
            autoComplete="off"
          />
          {loading && <span className="location-select__spinner" aria-hidden="true" />}
        </div>
        {cityOpen && citySuggestions.length > 0 && (
          <ul className="location-select__dropdown" role="listbox">
            {citySuggestions.map(item => (
              <li
                key={item.id}
                className="location-select__item"
                role="option"
                onMouseDown={e => {
                  e.preventDefault();
                  handleCitySelect(item);
                }}
              >
                <span className="location-select__city-name">{item.name_en || item.id.toString()}</span>
                {item.region && (
                  <span className="location-select__city-region">{item.region}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
