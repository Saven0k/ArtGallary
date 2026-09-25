// src/pages/Profile/components/DeleteAccountModal/DeleteAccountModal.tsx
import { useEffect, useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import {
    requestAccountDeletionCode,
    verifyAccountDeletionCode,
} from '../../../../api/auth/main.api';
import { useLanguage } from '../../../../hooks/useLanguage';
import { deleteAccountTranslations } from './lang';
import './DeleteAccountModal.scss';

interface DeleteAccountModalProps {
    onConfirm: () => Promise<void> | void;
    onClose: () => void;
}

type Step = 'code' | 'confirm';

const DeleteAccountModal = ({ onConfirm, onClose }: DeleteAccountModalProps) => {
    const { language } = useLanguage();
    const t = deleteAccountTranslations[language];

    const [step, setStep] = useState<Step>('code');
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [info, setInfo] = useState<string | null>(null);

    // при открытии сразу шлём код на почту
    useEffect(() => {
        let alive = true;
        (async () => {
            setSending(true);
            setError(null);
            try {
                await requestAccountDeletionCode();
                if (alive) setInfo(t.codeSent);
            } catch (err: any) {
                if (alive) setError(err?.message || t.errors.generic);
            } finally {
                if (alive) setSending(false);
            }
        })();
        return () => {
            alive = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleResend = async () => {
        setError(null);
        setSending(true);
        try {
            await requestAccountDeletionCode();
            setInfo(t.codeSent);
        } catch (err: any) {
            setError(err?.message || t.errors.generic);
        } finally {
            setSending(false);
        }
    };

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            await verifyAccountDeletionCode(code);
            setStep('confirm');
        } catch (err: any) {
            setError(err?.message || t.errors.generic);
        } finally {
            setLoading(false);
        }
    };

    const handleConfirm = async () => {
        setError(null);
        setLoading(true);
        try {
            await onConfirm();
            onClose();
        } catch (err: any) {
            setError(err?.message || t.errors.generic);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="delete-account-overlay" onClick={onClose}>
            <div
                className="delete-account"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
            >
                <header className="delete-account__header">
                    <h2 className="delete-account__title">{t.title}</h2>
                    <button
                        type="button"
                        className="delete-account__close"
                        onClick={onClose}
                        aria-label={t.cancel}
                    >
                        <X size={20} />
                    </button>
                </header>

                {step === 'code' && (
                    <form className="delete-account__form" onSubmit={handleVerify}>
                        <p className="delete-account__hint">{t.codeHint}</p>
                        <input
                            type="text"
                            inputMode="numeric"
                            maxLength={6}
                            className="delete-account__input delete-account__input--code"
                            value={code}
                            onChange={(e) =>
                                setCode(e.target.value.replace(/\D/g, '').slice(0, 6))
                            }
                            placeholder="000000"
                            autoFocus
                            disabled={loading}
                        />

                        {error && (
                            <div className="delete-account__error">{error}</div>
                        )}
                        {info && !error && (
                            <div className="delete-account__info">{info}</div>
                        )}

                        <button
                            type="button"
                            className="delete-account__resend"
                            onClick={handleResend}
                            disabled={sending || loading}
                        >
                            {sending ? t.sending : t.resend}
                        </button>

                        <div className="delete-account__actions">
                            <button
                                type="button"
                                className="delete-account__btn delete-account__btn--secondary"
                                onClick={onClose}
                                disabled={loading}
                            >
                                {t.cancel}
                            </button>
                            <button
                                type="submit"
                                className="delete-account__btn delete-account__btn--danger"
                                disabled={loading || code.length !== 6}
                            >
                                {loading ? t.checking : t.verify}
                            </button>
                        </div>
                    </form>
                )}

                {step === 'confirm' && (
                    <div className="delete-account__confirm">
                        <div className="delete-account__warning">
                            <AlertTriangle size={24} />
                            <p>{t.warningText}</p>
                        </div>

                        {error && (
                            <div className="delete-account__error">{error}</div>
                        )}

                        <div className="delete-account__actions">
                            <button
                                type="button"
                                className="delete-account__btn delete-account__btn--secondary"
                                onClick={onClose}
                                disabled={loading}
                            >
                                {t.noKeep}
                            </button>
                            <button
                                type="button"
                                className="delete-account__btn delete-account__btn--danger"
                                onClick={handleConfirm}
                                disabled={loading}
                            >
                                {loading ? t.deleting : t.yesDelete}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DeleteAccountModal;