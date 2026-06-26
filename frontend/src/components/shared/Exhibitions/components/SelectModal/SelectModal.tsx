import { useState } from 'react';
import { useLanguage } from '../../../../../context/LanguageContext';
import { selectModalTranslations } from './lang';
import './SelectModal.css';

interface SelectModalProps {
    title: string;
    items: any[];
    onSelect: (id: number) => void;
    onClose: () => void;
    getItemName: (item: any) => string;
}

export const SelectModal = ({
    title,
    items,
    onSelect,
    onClose,
    getItemName
}: SelectModalProps) => {
    const { language } = useLanguage();
    const lang = selectModalTranslations[language];
    const [search, setSearch] = useState('');

    const filteredItems = items.filter(item =>
        getItemName(item).toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="select-modal" onClick={onClose}>
            <div className="select-modal__content" onClick={e => e.stopPropagation()}>
                <div className="select-modal__header">
                    <h3>{title}</h3>
                    <button className="select-modal__close" onClick={onClose}>✕</button>
                </div>
                <div className="select-modal__search">
                    <input
                        type="text"
                        placeholder={lang.searchPlaceholder}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        autoFocus
                    />
                </div>
                <div className="select-modal__list">
                    {filteredItems.length > 0 ? (
                        filteredItems.map(item => (
                            <div
                                key={item.id}
                                className="select-modal__item"
                                onClick={() => onSelect(item.id)}
                            >
                                {getItemName(item)}
                            </div>
                        ))
                    ) : (
                        <div className="select-modal__empty">{lang.empty}</div>
                    )}
                </div>
            </div>
        </div>
    );
};