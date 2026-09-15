import  { useState, useRef, useEffect } from 'react';
import Global from './global.svg';
import Arrow from './arrow.svg';
import './LanguageSwitcher.scss';
import { useLanguage } from '../../../hooks/useLanguage';

const LanguageSwitcher = () => {
    const [isOpen, setIsOpen] = useState(false);
    const { language, setLanguage } = useLanguage();
    const dropdownRef = useRef<HTMLDivElement>(null);

    const languages = [
        { code: 'ru' },
        { code: 'en' },
        { code: 'zh' },
    ];

    const handleToggle = () => {
        setIsOpen(!isOpen);
    };

    const handleSelect = (langCode: 'ru' | 'en' | 'zh') => {
        setLanguage(langCode);
        setIsOpen(false);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const displayCode = language.toUpperCase();

    return (
        <div className="lang-switcher" ref={dropdownRef}>
            <button
                className={`lang-switcher__btn ${isOpen ? 'lang-switcher__btn--open' : ''}`}
                onClick={handleToggle}
                aria-label="Сменить язык"
                aria-expanded={isOpen}
            >
                <img src={Global} alt="global icon" className="lang-switcher__icon" />
                <span className="lang-switcher__text">{displayCode}</span>
                <img 
                    src={Arrow} 
                    alt="arrow icon" 
                    className={`lang-switcher__arrow ${isOpen ? 'lang-switcher__arrow--rotated' : ''}`} 
                />
            </button>

            {isOpen && (
                <ul className="lang-switcher__dropdown">
                    {languages.map((lang) => (
                        <li key={lang.code}>
                            <button
                                className={`lang-switcher__option ${language === lang.code ? 'lang-switcher__option--active' : ''}`}
                                onClick={() => handleSelect(lang.code as 'ru' | 'en' | 'zh')}
                            >
                                <span className="lang-switcher__option-code">{lang.code.toUpperCase()}</span>
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default LanguageSwitcher;