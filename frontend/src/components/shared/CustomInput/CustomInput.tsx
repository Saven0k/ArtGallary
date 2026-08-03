// src/components/CustomInput/index.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLanguage } from '../../../context/LanguageContext';
import { getConfig } from './inputConfig';
import { customInputTranslations } from './lang';
import { type Option, setLang } from './fecthFuncs';
import "./index.css"

export interface CustomInputInterface {
    type: "genre" | "style",
    value: string,
    onChange: (value: string) => void,
    isEditing?: boolean
}

const cache = new Map<string, Option[]>();

const CustomInput = (props: CustomInputInterface) => {
    const { type, value, onChange, isEditing = false } = props;
    const { language } = useLanguage();
    const lang = customInputTranslations[language] || customInputTranslations['ru'];
    const config = getConfig(lang)[type];

    if (!config) {
        console.error(`Config not found for type: ${type}`);
        return <div className="form-group">Ошибка: неизвестный тип {type}</div>;
    }

    const [inputValue, setInputValue] = useState('');
    const [options, setOptions] = useState<Option[]>([]);
    const [filtered, setFiltered] = useState<Option[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [loading, setLoading] = useState(true);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const [focused, setFocused] = useState(false);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        setLang(language);
    }, [language]);

    const loadOptions = useCallback(async () => {
        const cacheKey = `${type}-${language}`;
        
        // ✅ Проверяем кэш
        if (cache.has(cacheKey)) {
            const cachedData = cache.get(cacheKey);
            if (cachedData && cachedData.length > 0) {
                setOptions(cachedData);
                setLoaded(true);
                setLoading(false);
                return;
            }
        }

        setLoading(true);
        try {
            let data: Option[] = [];
            const fn = config.fetch;
            if (fn) data = await fn();
            cache.set(cacheKey, data);
            setOptions(data);
        } catch (error) {
            console.error('Load error:', error);
        } finally {
            setLoaded(true);
            setLoading(false);
        }
    }, [type, language, config]);

    useEffect(() => {
        loadOptions();
    }, [loadOptions]);

    useEffect(() => {
        if (!loaded) return;
        if (!value) { setInputValue(''); return; }
        const found = options.find(o => String(o.id) === String(value));
        setInputValue(found ? found.name : (/^\d+$/.test(value) ? '' : value));
    }, [value, options, loaded]);

    useEffect(() => {
        if (!loaded || loading) return;
        const timer = setTimeout(() => {
            if (focused && inputValue.trim()) {
                setFiltered(options.filter(o => o.name.toLowerCase().includes(inputValue.toLowerCase())));
            } else {
                setFiltered(options.slice(0, 5));
            }
        }, 200);
        return () => clearTimeout(timer);
    }, [inputValue, options, focused, loaded, loading]);

    useEffect(() => {
        if (!loaded || loading || !focused) { setShowDropdown(false); return; }
        setShowDropdown(filtered.length > 0);
    }, [filtered, focused, loaded, loading, type]);

    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
                setShowDropdown(false);
                setFocused(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setInputValue(val);
        if (!val) onChange('');
    };

    const handleSelect = (option: Option) => {
        setInputValue(option.name);
        onChange(String(option.id));
        setShowDropdown(false);
        setFocused(false);
    };

    const handleBlur = () => {
        setTimeout(() => {
            if (inputValue) {
                const exact = options.find(o => o.name.toLowerCase() === inputValue.toLowerCase());
                if (exact) { setInputValue(exact.name); onChange(String(exact.id)); }
            }
            setShowDropdown(false);
            setFocused(false);
        }, 150);
    };

    if (!isEditing) {
        if (loading || !loaded) return (
            <div className="form-group">
                <label className="form-label">{config.label}</label>
                <div className="form-view">{lang.loading}</div>
            </div>
        );
        let display = lang.notSpecified;
        if (value) {
            const found = options.find(o => String(o.id) === String(value));
            display = found ? found.name : (/^\d+$/.test(value) ? lang.notSpecified : value);
        }
        return (
            <div className="form-group">
                <label className="form-label">{config.label}</label>
                <div className="form-view">{display}</div>
            </div>
        );
    }

    return (
        <div className="form-group" ref={wrapperRef}>
            <label className="form-label">{config.label}</label>
            <div className="form-autocomplete">
                <input
                    type="text"
                    className="form-input"
                    value={inputValue}
                    onChange={handleChange}
                    onFocus={() => setFocused(true)}
                    onBlur={handleBlur}
                    placeholder={config.placeholder}
                    disabled={loading}
                    autoComplete="off"
                />
                {loading && <div className="form-loading-spinner">{lang.loading}</div>}
                {showDropdown && (
                    <div className="form-dropdown">
                        {filtered.map(o => (
                            <div key={o.id} className="form-dropdown-item" onMouseDown={(e) => { e.preventDefault(); handleSelect(o); }}>
                                {o.name}
                            </div>
                        ))}
                        {filtered.length === 0 && <div className="form-dropdown-empty">{inputValue ? config.emptyMessage : lang.startTyping}</div>}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CustomInput;