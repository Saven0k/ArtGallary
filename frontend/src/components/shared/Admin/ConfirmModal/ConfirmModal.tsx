// src/components/shared/Admin/ConfirmModal/ConfirmModal.tsx
import './ConfirmModal.scss';

interface ConfirmModalProps {
    title: string;
    text?: string;
    confirmLabel: string;
    cancelLabel: string;
    danger?: boolean;
    onConfirm: () => void;
    onClose: () => void;
}

const ConfirmModal = ({
    title,
    text,
    confirmLabel,
    cancelLabel,
    danger,
    onConfirm,
    onClose,
}: ConfirmModalProps) => (
    <div className="confirm-modal-overlay" onClick={onClose}>
        <div
            className="confirm-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
        >
            <h3 className="confirm-modal__title">{title}</h3>
            {text && <p className="confirm-modal__text">{text}</p>}

            <div className="confirm-modal__actions">
                <button
                    type="button"
                    className="confirm-modal__btn confirm-modal__btn--secondary"
                    onClick={onClose}
                >
                    {cancelLabel}
                </button>
                <button
                    type="button"
                    className={`confirm-modal__btn ${
                        danger
                            ? 'confirm-modal__btn--danger'
                            : 'confirm-modal__btn--primary'
                    }`}
                    onClick={onConfirm}
                >
                    {confirmLabel}
                </button>
            </div>
        </div>
    </div>
);

export default ConfirmModal;