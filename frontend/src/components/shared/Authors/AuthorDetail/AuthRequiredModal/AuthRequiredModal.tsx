// src/pages/Author/components/AuthRequiredModal/AuthRequiredModal.tsx
import { Link } from 'react-router-dom';
import './AuthRequiredModal.scss';

export interface AuthRequiredModalProps {
    title: string;
    text: string;
    loginLabel: string;
    cancelLabel: string;
    /** куда вернуть пользователя после логина */
    redirectTo?: string;
    onClose: () => void;
}

const AuthRequiredModal = ({
    title,
    text,
    loginLabel,
    cancelLabel,
    redirectTo,
    onClose,
}: AuthRequiredModalProps) => {
    const loginHref = redirectTo
        ? `/login?redirect=${encodeURIComponent(redirectTo)}`
        : '/login';

    return (
        <div
            className="auth-required-overlay"
            onClick={onClose}
            role="presentation"
        >
            <div
                className="auth-required"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="auth-required-title"
            >
                <h2 id="auth-required-title" className="auth-required__title">
                    {title}
                </h2>
                <p className="auth-required__text">{text}</p>

                <div className="auth-required__actions">
                    <button
                        type="button"
                        className="auth-required__btn auth-required__btn--secondary"
                        onClick={onClose}
                    >
                        {cancelLabel}
                    </button>

                    <Link
                        to={loginHref}
                        className="auth-required__btn auth-required__btn--primary"
                        onClick={onClose}
                    >
                        {loginLabel}
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default AuthRequiredModal;