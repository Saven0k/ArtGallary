import { errorMessage } from '../../../../../utils/errors';

import { useState } from 'react';
import { Eye, EyeOff, X } from 'lucide-react';
import { changePassword } from '../../../../../api/auth/main.api';
import { useLanguage } from '../../../../../hooks/useLanguage';
import './ChangePasswordModal.scss';
import { changePasswordTranslations } from './lang';

interface ChangePasswordModalProps {
    resetToken: string;
    onClose: () => void;
    onSuccess?: () => void;
    onError?: () => void;
}

const ChangePasswordModal = ({ resetToken, onClose, onSuccess, onError }: ChangePasswordModalProps) => {
    const { language } = useLanguage();
    const t = changePasswordTranslations[language];

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPasswords, setShowPasswords] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const validate = (): string | null => {
        if (!newPassword) return t.errors.newRequired;
        if (newPassword.length < 8) return t.errors.newMin;
        if (newPassword.length > 25) return t.errors.newMax;
        if (!/[A-Za-z]/.test(newPassword) || !/\d/.test(newPassword)) return t.errors.pattern;
        if (newPassword !== confirmPassword) return t.errors.mismatch;
        return null;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (loading) return;
        setError(null);

        const validationError = validate();
        if (validationError) {
            setError(validationError);
            return;
        }

        setLoading(true);
        try {
            await changePassword({ resetToken, newPassword });
            onSuccess?.();
            onClose();
        } catch (err: unknown) {
            setError(errorMessage(err, t.errors.generic));
            onError?.();
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="change-password-overlay" onClick={() => { if (!loading) onClose(); }}>
            <div
                className="change-password"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-labelledby="change-password-title"
                onKeyDown={(event) => { if (event.key === 'Escape' && !loading) onClose(); }}
            >
                <header className="change-password__header">
                    <h2 id="change-password-title" className="change-password__title">{t.title}</h2>
                    <button
                        type="button"
                        className="change-password__close"
                        onClick={onClose}
                        aria-label={t.cancel}
                        disabled={loading}
                    >
                        <X size={20} />
                    </button>
                </header>

                <form className="change-password__form" onSubmit={handleSubmit}>
                    <div className="change-password__field">
                        <label className="change-password__label" htmlFor="new-account-password">{t.newPassword}</label>
                        <input
                            id="new-account-password"
                            required minLength={8} maxLength={25}
                            autoFocus
                            type={showPasswords ? 'text' : 'password'}
                            className="change-password__input"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder={t.placeholders.new}
                            autoComplete="new-password"
                            disabled={loading}
                        />
                    </div>

                    <div className="change-password__field">
                        <label className="change-password__label" htmlFor="confirm-account-password">{t.confirmPassword}</label>
                        <div className="change-password__input-wrap">
                            <input
                                id="confirm-account-password"
                                required minLength={8} maxLength={25}
                                type={showPasswords ? 'text' : 'password'}
                                className="change-password__input"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder={t.placeholders.confirm}
                                autoComplete="new-password"
                                disabled={loading}
                            />
                            <button
                                type="button"
                                className="change-password__eye"
                                onClick={() => setShowPasswords((v) => !v)}
                                aria-label={showPasswords ? t.hidePassword : t.showPassword}
                                tabIndex={-1}
                            >
                                {showPasswords ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    {error && <div className="change-password__error" role="alert">{error}</div>}

                    <div className="change-password__actions">
                        <button
                            type="button"
                            className="change-password__btn change-password__btn--secondary"
                            onClick={onClose}
                            disabled={loading}
                        >
                            {t.cancel}
                        </button>
                        <button
                            type="submit"
                            className="change-password__btn change-password__btn--primary"
                            disabled={loading}
                        >
                            {loading ? t.saving : t.submit}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ChangePasswordModal;
