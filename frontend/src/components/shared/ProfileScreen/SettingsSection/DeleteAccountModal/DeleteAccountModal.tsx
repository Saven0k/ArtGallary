import { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import {
    requestAccountDeletionCode,
    verifyAccountDeletionCode,
} from '../../../../../api/auth/main.api';
import { useLanguage } from '../../../../../hooks/useLanguage';
import { useAuth } from '../../../../../hooks/useAuth';
import { useCodeCooldown } from '../../../../../hooks/useCodeCooldown';
import { errorMessage } from '../../../../../utils/errors';
import { deleteAccountTranslations } from './lang';
import './DeleteAccountModal.scss';

interface DeleteAccountModalProps {
    onConfirm: (deletionToken: string) => Promise<void> | void;
    onClose: () => void;
}

const DeleteAccountModal = ({ onConfirm, onClose }: DeleteAccountModalProps) => {
    const { language } = useLanguage();
    const { user } = useAuth();
    const t = deleteAccountTranslations[language];
    const [sent, setSent] = useState(false);
    const [code, setCode] = useState('');
    const [deletionToken, setDeletionToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [remaining, startCooldown] = useCodeCooldown();
    const [error, setError] = useState<string | null>(null);

    const sendCode = async () => {
        if (loading || remaining > 0) return;
        setError(null);
        setLoading(true);
        try {
            await requestAccountDeletionCode();
            setCode('');
            setDeletionToken(null);
            setSent(true);
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
            const token = deletionToken ?? (await verifyAccountDeletionCode(code)).deletionToken;
            setDeletionToken(token);
            await onConfirm(token);
            onClose();
        } catch (err) {
            setError(errorMessage(err, t.errors.generic));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="delete-account-overlay"
            onClick={() => {
                if (!loading) onClose();
            }}
        >
            <div
                className="delete-account"
                role="dialog"
                aria-modal="true"
                aria-labelledby="delete-account-title"
                onClick={(event) => event.stopPropagation()}
                onKeyDown={(event) => {
                    if (event.key === 'Escape' && !loading) onClose();
                }}
            >
                <header className="delete-account__header">
                    <h2 className="delete-account__title" id="delete-account-title">
                        {t.title}
                    </h2>
                    <button
                        type="button"
                        className="delete-account__close"
                        onClick={onClose}
                        disabled={loading}
                        aria-label={t.cancel}
                    >
                        <X size={20} />
                    </button>
                </header>
                <div className="delete-account__warning">
                    <AlertTriangle size={22} />
                    <p>{t.warningText}</p>
                </div>
                <p className="delete-account__hint">
                    {t.emailHint.replace('{email}', user?.email ?? '')}
                </p>
                {sent ? (
                    <form className="delete-account__form" onSubmit={confirm}>
                        <label className="delete-account__hint" htmlFor="delete-account-code">
                            {t.codeHint}
                        </label>
                        <input
                            id="delete-account-code"
                            className="delete-account__input delete-account__input--code"
                            value={code}
                            onChange={(event) => {
                                setCode(event.target.value.replace(/\D/g, '').slice(0, 6));
                                setDeletionToken(null);
                            }}
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
                            <div className="delete-account__error" role="alert">
                                {error}
                            </div>
                        )}
                        <button
                            className="delete-account__btn delete-account__btn--danger"
                            type="submit"
                            disabled={loading || code.length !== 6}
                        >
                            {loading ? t.deleting : t.yesDelete}
                        </button>
                        <button
                            className="delete-account__resend"
                            type="button"
                            onClick={sendCode}
                            disabled={loading || remaining > 0}
                        >
                            {t.resend}
                            {remaining > 0 ? ' (' + remaining + ')' : ''}
                        </button>
                        <p className="delete-account__hint">{t.cooldown}</p>
                    </form>
                ) : (
                    <>
                        {error && (
                            <div className="delete-account__error" role="alert">
                                {error}
                            </div>
                        )}
                        <button
                            className="delete-account__btn delete-account__btn--primary"
                            type="button"
                            onClick={sendCode}
                            disabled={loading || !user?.email}
                            autoFocus
                        >
                            {loading ? t.sending : t.sendCode}
                        </button>
                    </>
                )}
                <button
                    className="delete-account__btn delete-account__btn--secondary"
                    type="button"
                    onClick={onClose}
                    disabled={loading}
                >
                    {t.noKeep}
                </button>
            </div>
        </div>
    );
};
export default DeleteAccountModal;
