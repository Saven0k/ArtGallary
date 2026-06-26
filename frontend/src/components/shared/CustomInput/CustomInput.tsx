import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLanguage } from '../../../context/LanguageContext';
import { getConfig } from './inputConfig';
import { customInputTranslations } from './lang';
import type { Option } from './fecthFuncs';
import "./index.css"

export interface CustomInputInterface {
    type: "city" | "country" | "genre" | "style",
    value: string,
    onChange: (value: string) => void,
    isEditing?: boolean,
    externalOptions?: Option[] | null,
    fetchFunction?: () => Promise<Option[]>,
    cache?: any
}

const globalCache = new Map<string, Option[]>();

const CustomInput = (props: CustomInputInterface) => {
    const {
        type,
        value,
        onChange,
        isEditing = false,
        externalOptions = null,
        fetchFunction,
        cache
    } = props;

    const { language } = useLanguage();
    const lang = customInputTranslations[language];
    const currentConfig = getConfig(lang)[type];
    
    const cacheRef = useRef(cache?.current || globalCache);
    const [inputValue, setInputValue] = useState('');
    const [filteredOptions, setFilteredOptions] = useState<Option[]>([]);
    const [options, setOptions] = useState<Option[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const [isInputFocused, setIsInputFocused] = useState(false);
    const [isOptionsLoaded, setIsOptionsLoaded] = useState(false);
    const [hasTriggeredLoad, setHasTriggeredLoad] = useState(false);

    const hasOptions = currentConfig.fetch !== null || externalOptions !== null;

    const loadOptionsWithCache = useCallback(async () => {
        if (hasTriggeredLoad) return;
        setHasTriggeredLoad(true);
        
        const cacheKey = currentConfig.cacheKey;
        setIsLoading(true);

        if (cacheRef.current.has(cacheKey)) {
            const cachedOptions = cacheRef.current.get(cacheKey);
            if (cachedOptions && cachedOptions.length > 0) {
                setOptions(cachedOptions);
                setIsOptionsLoaded(true);
                setIsLoading(false);
                return;
            }
        }

        if (externalOptions !== null) {
            setOptions(externalOptions);
            setIsOptionsLoaded(true);
            setIsLoading(false);
            if (cacheKey && externalOptions.length > 0) {
                cacheRef.current.set(cacheKey, externalOptions);
            }
            return;
        }

        if (fetchFunction) {
            try {
                const data = await fetchFunction();
                setOptions(data || []);
                setIsOptionsLoaded(true);
                if (cacheKey && data && data.length > 0) {
                    cacheRef.current.set(cacheKey, data);
                }
            } catch (error) {
                console.error(`Failed to load ${type}:`, error);
                setOptions([]);
                setIsOptionsLoaded(true);
            } finally {
                setIsLoading(false);
            }
            return;
        }

        if (currentConfig.fetch) {
            try {
                const data = await currentConfig.fetch();
                setOptions(data || []);
                setIsOptionsLoaded(true);
                if (cacheKey && data && data.length > 0) {
                    cacheRef.current.set(cacheKey, data);
                }
            } catch (error) {
                console.error(`Failed to load ${type}:`, error);
                setOptions([]);
                setIsOptionsLoaded(true);
            } finally {
                setIsLoading(false);
            }
        }
    }, [type, externalOptions, fetchFunction, currentConfig, hasTriggeredLoad]);

    useEffect(() => {
        loadOptionsWithCache();
    }, []);

    useEffect(() => {
        if (!isOptionsLoaded) return;

        if (!value) {
            setInputValue('');
            return;
        }

        if (hasOptions && options.length > 0) {
            const foundOption = options.find(opt => opt.id.toString() === value.toString());
            if (foundOption) {
                setInputValue(foundOption.name);
            } else {
                const isNumeric = /^\d+$/.test(value);
                if (!isNumeric) {
                    setInputValue(value);
                } else {
                    setInputValue('');
                }
            }
        } else if (!hasOptions) {
            setInputValue(value);
        }
    }, [value, options, hasOptions, isOptionsLoaded]);

    useEffect(() => {
        if (!hasOptions || !isOptionsLoaded || isLoading) return;

        const timer = setTimeout(() => {
            if (inputValue && inputValue.trim() && isEditing && isInputFocused) {
                const filtered = options.filter(option =>
                    option.name.toLowerCase().includes(inputValue.toLowerCase())
                );
                setFilteredOptions(filtered);
            } else if (!inputValue || !inputValue.trim()) {
                const topFive = options.slice(0, 5);
                setFilteredOptions(topFive);
            }
        }, 200);

        return () => clearTimeout(timer);
    }, [inputValue, options, hasOptions, isEditing, isInputFocused, isOptionsLoaded, isLoading]);

    useEffect(() => {
        if (!hasOptions || !isOptionsLoaded || isLoading) {
            setShowDropdown(false);
            return;
        }

        if (!isInputFocused) {
            setShowDropdown(false);
            return;
        }

        if (inputValue && inputValue.trim()) {
            setShowDropdown(filteredOptions.length > 0);
        } else {
            const topFive = options.slice(0, 5);
            if (topFive.length !== filteredOptions.length) {
                setFilteredOptions(topFive);
            }
            setShowDropdown(topFive.length > 0);
        }
    }, [inputValue, filteredOptions, options, hasOptions, isInputFocused, isOptionsLoaded, isLoading]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
                setIsInputFocused(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setInputValue(newValue);
        if (!newValue) {
            onChange('');
        } else if (!hasOptions) {
            onChange(newValue);
        }
    }, [onChange, hasOptions]);

    const handleSelectOption = useCallback((option: Option) => {
        setInputValue(option.name);
        onChange(option.id.toString());
        setShowDropdown(false);
        setIsInputFocused(false);
    }, [onChange]);

    const handleBlur = useCallback(() => {
        setTimeout(() => {
            if (inputValue && hasOptions && options.length > 0 && isOptionsLoaded) {
                const exactMatch = options.find(opt => opt.name.toLowerCase() === inputValue.toLowerCase());
                if (exactMatch) {
                    setInputValue(exactMatch.name);
                    onChange(exactMatch.id.toString());
                } else if (inputValue && !exactMatch) {
                    onChange(inputValue);
                }
            }
            setShowDropdown(false);
            setIsInputFocused(false);
        }, 200);
    }, [inputValue, options, hasOptions, onChange, isOptionsLoaded]);

    const handleFocus = useCallback(() => {
        setIsInputFocused(true);
    }, []);

    if (!isEditing) {
        if (isLoading || !isOptionsLoaded) {
            return (
                <div className="form-group">
                    <label className="form-label">{currentConfig.label}</label>
                    <div className="form-view">
                        {lang.loading}
                    </div>
                </div>
            );
        }
        
        let displayValue = lang.notSpecified;
        
        if (hasOptions && value && options.length > 0) {
            const selected = options.find(opt => opt.id.toString() === value.toString());
            if (selected) {
                displayValue = selected.name;
            } else if (!/^\d+$/.test(value)) {
                displayValue = value;
            }
        } else if (!hasOptions && value) {
            displayValue = value;
        }
        
        return (
            <div className="form-group">
                <label className="form-label">{currentConfig.label}</label>
                <div className="form-view">
                    {displayValue}
                </div>
            </div>
        );
    }

    return (
        <div className="form-group" ref={wrapperRef}>
            <label className="form-label">
                {currentConfig.label}
            </label>

            <div className="form-autocomplete">
                <input
                    type="text"
                    className="form-input"
                    value={inputValue}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    onFocus={handleFocus}
                    placeholder={currentConfig.placeholder}
                    disabled={isLoading}
                    autoComplete="off"
                />

                {isLoading && (
                    <div className="form-loading-spinner">
                        {lang.loading}
                    </div>
                )}

                {hasOptions && showDropdown && !isLoading && isOptionsLoaded && (
                    <div className="form-dropdown">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map(option => (
                                <div
                                    key={option.id}
                                    className="form-dropdown-item"
                                    onMouseDown={(e) => {
                                        e.preventDefault();
                                        handleSelectOption(option);
                                    }}
                                >
                                    {option.name}
                                </div>
                            ))
                        ) : (
                            <div className="form-dropdown-empty">
                                {inputValue ? currentConfig.emptyMessage : lang.startTyping}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CustomInput;