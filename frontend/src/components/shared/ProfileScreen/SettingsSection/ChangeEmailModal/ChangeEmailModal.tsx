import { useState } from 'react';
import { X } from 'lucide-react';
import { requestEmailChangeCode, confirmEmailChange } from '../../../../../api/auth/main.api';
import { useLanguage } from '../../../../../hooks/useLanguage';
import { useAuth } from '../../../../../hooks/useAuth';
import { useCodeCooldown } from '../../../../../hooks/useCodeCooldown';
import { errorMessage } from '../../../../../utils/errors';
import { changeEmailTranslations } from './lang';
import './ChangeEmailModal.scss';

interface ChangeEmailModalProps {
    onClose: () => void;
    onSuccess?: () => void;
    onError?: () => void;
}

const ChangeEmailModal = ({ onClose, onSuccess, onError }: ChangeEmailModalProps) => {
    const { language } = useLanguage();
    const { user } = useAuth();
    const t = changeEmailTranslations[language];
    const currentEmail = user?.email ?? '';
    const [sent, setSent] = useState(false);
    const [newEmail, setNewEmail] = useState('');
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [remaining, startCooldown] = useCodeCooldown();
    const [error, setError] = useState<string | null>(null);

    const sendCode = async (event?: React.FormEvent) => {
        event?.preventDefault();
        if (loading || remaining > 0 || !newEmail.trim() || !currentEmail) return;
        setError(null);
        if (newEmail.trim().toLowerCase() === currentEmail.toLowerCase()) {
            setError(t.errors.sameAsCurrent);
            return;
        }
        setLoading(true);
        try {
            await requestEmailChangeCode({ newEmail: newEmail.trim().toLowerCase() });
            setSent(true);
            setCode('');
            startCooldown();
        } catch (err) {
            setError(errorMessage(err, t.errors.generic));
        } finally {
            setLoading(false);
        }
    };

    const confirm = async (event: React.FormEvent) => {
        event.preventDefault();
        if (loading || !sent || code.length !== 6) return;
        setError(null);
        setLoading(true);
        try {
            await confirmEmailChange({ newEmail: newEmail.trim().toLowerCase(), code });
            onSuccess?.();
            onClose();
        } catch (err) {
            setError(errorMessage(err, t.errors.generic));
            onError?.();
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="change-email-overlay"
            onClick={() => {
                if (!loading) onClose();
            }}
        >
            <div
                className="change-email"
                role="dialog"
                aria-modal="true"
                aria-labelledby="change-email-title"
                onClick={(event) => event.stopPropagation()}
                onKeyDown={(event) => {
                    if (event.key === 'Escape' && !loading) onClose();
                }}
            >
                <header className="change-email__header">
                    <h2 className="change-email__title" id="change-email-title">
                        {t.title}
                    </h2>
                    <button
                        className="change-email__close"
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        aria-label={t.close}
                    >
                        <X size={20} />
                    </button>
                </header>
                <div className="change-email__current">
                    {t.currentLabel}: <strong>{currentEmail}</strong>
                </div>
                <form className="change-email__form" onSubmit={sent ? confirm : sendCode}>
                    <label className="change-email__hint" htmlFor="new-account-email">
                        {t.newHint}
                    </label>
                    <input
                        id="new-account-email"
                        type="email"
                        className="change-email__input"
                        value={newEmail}
                        onChange={(event) => setNewEmail(event.target.value)}
                        placeholder={t.newPlaceholder}
                        autoComplete="email"
                        autoFocus
                        required
                        disabled={loading || sent}
                    />
                    {sent && (
                        <>
                            <label className="change-email__hint" htmlFor="change-email-code">
                                {t.codeHint.replace('{email}', currentEmail)}
                            </label>
                            <input
                                id="change-email-code"
                                className="change-email__input change-email__input--code"
                                value={code}
                                onChange={(event) =>
                                    setCode(event.target.value.replace(/\D/g, '').slice(0, 6))
                                }
                                inputMode="numeric"
                                autoComplete="one-time-code"
                                pattern="[0-9]{6}"
                                maxLength={6}
                                placeholder="000000"
                                autoFocus
                                required
                                disabled={loading}
                            />
                        </>
                    )}
                    {error && (
                        <div className="change-email__error" role="alert">
                            {error}
                        </div>
                    )}
                    <button
                        className="change-email__btn change-email__btn--primary"
                        type="submit"
                        disabled={
                            loading ||
                            !currentEmail ||
                            (sent ? code.length !== 6 : !newEmail.trim() || remaining > 0)
                        }
                    >
                        {loading ? (sent ? t.saving : t.sending) : sent ? t.confirm : t.sendCode}
                    </button>
                    {sent && (
                        <>
                            <div className="change-email__actions">
                                <button
                                    className="change-email__btn change-email__btn--secondary"
                                    type="button"
                                    onClick={() => {
                                        setSent(false);
                                        setCode('');
                                        setError(null);
                                    }}
                                    disabled={loading}
                                >
                                    {t.editEmail}
                                </button>
                                <button
                                    className="change-email__btn change-email__btn--secondary"
                                    type="button"
                                    onClick={() => {
                                        void sendCode();
                                    }}
                                    disabled={loading || remaining > 0}
                                >
                                    {t.resend}
                                    {remaining > 0 ? ' (' + remaining + ')' : ''}
                                </button>
                            </div>
                            <p className="change-email__hint">{t.cooldown}</p>
                        </>
                    )}
                </form>
            </div>
        </div>
    );
};
export default ChangeEmailModal;
