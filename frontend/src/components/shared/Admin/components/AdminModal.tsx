import { useEffect } from 'react';
import './AdminModal.css';

interface AdminModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    onSave?: () => void;
    onDelete?: () => void;
    saveText?: string;
    deleteText?: string;
    isEditing?: boolean;
}

export const AdminModal = ({
    isOpen,
    onClose,
    title,
    children,
    onSave,
    onDelete,
    saveText = "Сохранить",
    deleteText = "Удалить",
    isEditing = false
}: AdminModalProps) => {
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            document.addEventListener('keydown', handleEsc);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.removeEventListener('keydown', handleEsc);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="admin-modal" onClick={onClose}>
            <div className="admin-modal__content" onClick={(e) => e.stopPropagation()}>
                <div className="admin-modal__header">
                    <h3>{title}</h3>
                    <button className="admin-modal__close" onClick={onClose}>✕</button>
                </div>
                <div className="admin-modal__body">
                    {children}
                </div>
                <div className="admin-modal__footer">
                    <button className="admin-modal__cancel" onClick={onClose}>Отмена</button>
                    {onDelete && isEditing && (
                        <button className="admin-modal__delete" onClick={onDelete}>{deleteText}</button>
                    )}
                    {onSave && (
                        <button className="admin-modal__save" onClick={onSave}>{saveText}</button>
                    )}
                </div>
            </div>
        </div>
    );
};