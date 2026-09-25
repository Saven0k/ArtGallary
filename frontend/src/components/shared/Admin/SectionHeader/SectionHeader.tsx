// src/components/shared/Admin/SectionHeader/SectionHeader.tsx
import type { ReactNode } from 'react';
import './SectionHeader.scss';

interface SectionHeaderProps {
    title: string;
    subtitle?: string;
    actions?: ReactNode;
}

const SectionHeader = ({ title, subtitle, actions }: SectionHeaderProps) => (
    <header className="section-header">
        <div className="section-header__text">
            <h2 className="section-header__title">{title}</h2>
            {subtitle && (
                <p className="section-header__subtitle">{subtitle}</p>
            )}
        </div>

        {actions && (
            <div className="section-header__actions">{actions}</div>
        )}
    </header>
);

export default SectionHeader;