// src/components/shared/Admin/EmptyState/EmptyState.tsx
import type { ReactNode } from 'react';
import './EmptyState.scss';

interface EmptyStateProps {
    text: string;
    icon?: ReactNode;
}

const EmptyState = ({ text, icon }: EmptyStateProps) => (
    <div className="empty-state">
        {icon && <div className="empty-state__icon">{icon}</div>}
        <p className="empty-state__text">{text}</p>
    </div>
);

export default EmptyState;