// src/components/admin/AdminModal/AdminModal.tsx
import { useEffect, useRef } from 'react';
import './AdminModal.scss';

interface AdminModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    onSubmit?: () => void;
    submitLabel?: string;
    loading?: boolean;
}

const AdminModal = ({ 
    isOpen, 
    onClose, 
    title, 
    children, 
    onSubmit, 
    submitLabel = 'Сохранить',
    loading = false 
}: AdminModalProps) => {
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        const handleClickOutside = (e: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.addEventListener('mousedown', handleClickOutside);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.removeEventListener('mousedown', handleClickOutside);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="admin-modal">
            <div className="admin-modal__overlay">
                <div className="admin-modal__content" ref={modalRef}>
                    <div className="admin-modal__header">
                        <h3 className="admin-modal__title">{title}</h3>
                        <button className="admin-modal__close" onClick={onClose}>✕</button>
                    </div>
                    <div className="admin-modal__body">{children}</div>
                    {onSubmit && (
                        <div className="admin-modal__footer">
                            <button className="admin-modal__btn admin-modal__btn--secondary" onClick={onClose} disabled={loading}>
                                Отмена
                            </button>
                            <button className="admin-modal__btn admin-modal__btn--primary" onClick={onSubmit} disabled={loading}>
                                {loading ? '...' : submitLabel}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminModal;