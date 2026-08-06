import React, { useState, useRef, useEffect } from 'react';
import './TagInput.scss';

interface TagInputProps {
    value: string[];
    onChange: (tags: string[]) => void;
    maxTags?: number;
    placeholder?: string;
}

export const TagInput: React.FC<TagInputProps> = ({
    value = [],
    onChange,
    maxTags = 20,
    placeholder = 'Введите ключевое слово и нажмите Enter...',
}) => {
    const [inputValue, setInputValue] = useState('');
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleAddTag = (tagName: string) => {
        const trimmed = tagName.trim().toLowerCase();
        if (!trimmed) return;
        if (value.length >= maxTags) {
            alert(`Максимальное количество тегов: ${maxTags}`);
            return;
        }
        if (value.includes(trimmed)) {
            alert('Этот тег уже добавлен');
            return;
        }
        onChange([...value, trimmed]);
        setInputValue('');
        setSuggestions([]);
    };

    const handleRemoveTag = (tagToRemove: string) => {
        onChange(value.filter(tag => tag !== tagToRemove));
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (suggestions.length > 0) {
                handleAddTag(suggestions[0]);
            } else if (inputValue) {
                handleAddTag(inputValue);
            }
        } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
            handleRemoveTag(value[value.length - 1]);
        }
    };

    // Симуляция подсказок (в реальном приложении - запрос к API)
    useEffect(() => {
        if (inputValue.length < 2) {
            setSuggestions([]);
            return;
        }
        // Здесь можно сделать запрос к API для поиска существующих тегов
        const mockSuggestions = ['пейзаж', 'природа', 'город', 'море', 'горы', 'лето', 'зима']
            .filter(tag => tag.includes(inputValue.toLowerCase()))
            .slice(0, 5);
        setSuggestions(mockSuggestions);
    }, [inputValue]);

    return (
        <div className="tag-input">
            <div className="tag-input__container">
                {value.map(tag => (
                    <span key={tag} className="tag-input__tag">
                        {tag}
                        <button
                            type="button"
                            className="tag-input__remove"
                            onClick={() => handleRemoveTag(tag)}
                        >
                            ×
                        </button>
                    </span>
                ))}
                <input
                    ref={inputRef}
                    type="text"
                    className="tag-input__field"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={value.length === 0 ? placeholder : ''}
                    disabled={value.length >= maxTags}
                />
            </div>
            <div className="tag-input__info">
                <span>{value.length} / {maxTags}</span>
            </div>
            {suggestions.length > 0 && (
                <div className="tag-input__suggestions">
                    {suggestions.map(suggestion => (
                        <button
                            key={suggestion}
                            className="tag-input__suggestion"
                            onClick={() => handleAddTag(suggestion)}
                        >
                            {suggestion}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};