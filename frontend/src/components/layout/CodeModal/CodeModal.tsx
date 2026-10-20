import { useState } from 'react';
import { X } from 'lucide-react';
import { requestPasswordChangeCode, verifyPasswordChangeCode } from '../../../api/auth/main.api';
import { useLanguage } from '../../../hooks/useLanguage';
import { useAuth } from '../../../hooks/useAuth';
import { useCodeCooldown } from '../../../hooks/useCodeCooldown';
import { errorMessage } from '../../../utils/errors';
import { codeModalTranslations } from './lang';
import './CodeModal.scss';

interface CodeModalProps {
    onVerified: (payload: { resetToken: string }) => void;
    onClose: () => void;
}

const CodeModal = ({ onVerified, onClose }: CodeModalProps) => {
    const { language } = useLanguage();
    const { user } = useAuth();
    const t = codeModalTranslations[language];
    const [sent, setSent] = useState(false);
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [remaining, startCooldown] = useCodeCooldown();
    const [error, setError] = useState<string | null>(null);

    const sendCode = async () => {
        if (loading || remaining > 0) return;
        setError(null);
        setLoading(true);
        try {
            await requestPasswordChangeCode();
            setCode('');
            setSent(true);
            startCooldown();
        } catch (err) {
            setError(errorMessage(err, t.errors.generic));
        } finally {
            setLoading(false);
        }
    };

    const verify = async (event: React.FormEvent) => {
        event.preventDefault();
        if (loading || !sent || code.length !== 6) return;
        setError(null);
        setLoading(true);
        try {
            onVerified(await verifyPasswordChangeCode(code));
        } catch (err) {
            setError(errorMessage(err, t.errors.generic));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="code-modal-overlay"
            onClick={() => {
                if (!loading) onClose();
            }}
        >
            <div
                className="code-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="password-code-title"
                onClick={(event) => event.stopPropagation()}
                onKeyDown={(event) => {
                    if (event.key === 'Escape' && !loading) onClose();
                }}
            >
                <header className="code-modal__header">
                    <h2 className="code-modal__title" id="password-code-title">
                        {t.title}
                    </h2>
                    <button
                        type="button"
                        className="code-modal__close"
                        onClick={onClose}
                        disabled={loading}
                        aria-label={t.close}
                    >
                        <X size={20} />
                    </button>
                </header>
                <p className="code-modal__hint">
                    {t.emailHint.replace('{email}', user?.email ?? '')}
                </p>
                {sent ? (
                    <form className="code-modal__form" onSubmit={verify}>
                        <label className="code-modal__hint" htmlFor="password-email-code">
                            {t.codeHint}
                        </label>
                        <input
                            id="password-email-code"
                            className="code-modal__input code-modal__input--code"
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
                        {error && (
                            <div className="code-modal__error" role="alert">
                                {error}
                            </div>
                        )}
                        <button
                            className="code-modal__btn code-modal__btn--primary"
                            type="submit"
                            disabled={loading || code.length !== 6}
                        >
                            {loading ? t.checking : t.verify}
                        </button>
                        <button
                            className="code-modal__resend"
                            type="button"
                            onClick={sendCode}
                            disabled={loading || remaining > 0}
                        >
                            {t.resend}
                            {remaining > 0 ? ` (${remaining})` : ''}
                        </button>
                        <p className="code-modal__hint">{t.cooldown}</p>
                    </form>
                ) : (
                    <>
                        {error && (
                            <div className="code-modal__error" role="alert">
                                {error}
                            </div>
                        )}
                        <button
                            className="code-modal__btn code-modal__btn--primary"
                            type="button"
                            onClick={sendCode}
                            disabled={loading || !user?.email}
                            autoFocus
                        >
                            {loading ? t.sending : t.sendCode}
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};
export default CodeModal;
