import './StatusBadge.css';

interface StatusBadgeProps {
    status: 'pending' | 'approved' | 'rejected' | 'active' | 'inactive';
    label?: string;
}

const statusConfig = {
    pending: { label: 'На модерации', className: 'status-badge--pending' },
    approved: { label: 'Одобрено', className: 'status-badge--approved' },
    rejected: { label: 'Отклонено', className: 'status-badge--rejected' },
    active: { label: 'Активен', className: 'status-badge--active' },
    inactive: { label: 'Неактивен', className: 'status-badge--inactive' }
};

export const StatusBadge = ({ status, label }: StatusBadgeProps) => {
    const config = statusConfig[status];
    return (
        <span className={`status-badge ${config.className}`}>
            {label || config.label}
        </span>
    );
};