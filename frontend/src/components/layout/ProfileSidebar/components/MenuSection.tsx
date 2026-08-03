// src/components/ProfileSideBar/components/MenuSection.tsx
import React from 'react';
import type { MenuItem, MenuSection as MenuSectionType } from '../sections';

interface MenuSectionProps {
    section: MenuSectionType;
    onItemClick: (path: string) => void;
    getLabel: (labelKey: string) => string;
    onClose: () => void;
}

export const MenuSection: React.FC<MenuSectionProps> = ({ 
    section, 
    onItemClick, 
    getLabel,
    onClose 
}) => {
    const hasBadge = (item: MenuItem): item is MenuItem & { badge: number } => {
        return item.badge !== null && item.badge !== undefined && item.badge > 0;
    };

    const handleClick = (path: string) => {
        onItemClick(path);
        onClose();
    };

    return (
        <div className="sidebarProfile__section">
            <h3 className="sidebarProfile__section-title">{getLabel(section.titleKey)}</h3>
            <ul className="sidebarProfile__menu">
                {section.items.map((item, index) => {
                    const label = getLabel(item.labelKey);
                    return (
                        <li key={index} className="sidebarProfile__menu-item">
                            <button
                                className="sidebarProfile__link"
                                aria-label={label}
                                onClick={() => handleClick(item.path)}
                            >
                                <span className="sidebarProfile__icon" aria-hidden="true">
                                    {item.icon}
                                </span>
                                <span className="sidebarProfile__label">{label}</span>
                                {hasBadge(item) && (
                                    <span className="sidebarProfile__badge">{item.badge}</span>
                                )}
                            </button>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
};