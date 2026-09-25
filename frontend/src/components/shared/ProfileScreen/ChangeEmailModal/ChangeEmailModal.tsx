import { useState } from 'react';
import { X } from 'lucide-react';
import {
    verifyCurrentEmail,
    requestEmailChangeCode,
    confirmEmailChange,
} from '../../../../api/auth/main.api';
import { useLanguage } from '../../../../hooks/useLanguage';
import { changeEmailTranslations } from './lang';
import './ChangeEmailModal.scss';

interface ChangeEmailModalProps {
    onClose: () => void;
    onSuccess?: () => void;
    onError?: () => void;
}

type Step = 'current' | 'newEmail' | 'code' | 'password';

const ChangeEmailModal = ({ onClose, onSuccess, onError }: ChangeEmailModalProps) => {
    const { language } = useLanguage();
    const t = changeEmailTranslations[language];

    const [step, setStep] = useState<Step>('current');
    const [currentEmail, setCurrentEmail] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [code, setCode] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Шаг 1: текущий email
    const handleVerifyCurrent = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            await verifyCurrentEmail({ email: currentEmail });
            setStep('newEmail');
        } catch (err: any) {
            setError(err?.message || t.errors.generic);
        } finally {
            setLoading(false);
        }
    };

    // Шаг 2: новый email → отправить код
    const handleRequestCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            await requestEmailChangeCode({ newEmail });
            setStep('code');
        } catch (err: any) {
            setError(err?.message || t.errors.generic);
        } finally {
            setLoading(false);
        }
    };

    // Шаг 3: код → дальше к паролю (локальная проверка длины)
    const handleCodeNext = (e: React.FormEvent) => {
        e.preventDefault();
        if (code.length !== 6) {
            setError(t.errors.codeLength);
            return;
        }
        setError(null);
        setStep('password');
    };

    // Шаг 4: пароль + подтверждение
    const handleConfirm = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            await confirmEmailChange({ newEmail, code, password });
            onSuccess?.();
            onClose();
        } catch (err: any) {
            setError(err?.message || t.errors.generic);
            onError?.();
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="change-email-overlay" onClick={onClose}>
            <div
                className="change-email"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
            >
                <header className="change-email__header">
                    <h2 className="change-email__title">{t.title}</h2>
                    <button
                        type="button"
                        className="change-email__close"
                        onClick={onClose}
                        aria-label={t.close}
                    >
                        <X size={20} />
                    </button>
                </header>

                {step === 'current' && (
                    <form className="change-email__form" onSubmit={handleVerifyCurrent}>
                        <p className="change-email__hint">{t.currentHint}</p>
                        <input
                            type="email"
                            className="change-email__input"
                            value={currentEmail}
                            onChange={(e) => setCurrentEmail(e.target.value)}
                            placeholder={t.currentPlaceholder}
                            autoFocus
                            disabled={loading}
                        />
                        {error && <div className="change-email__error">{error}</div>}
                        <button
                            type="submit"
                            className="change-email__btn change-email__btn--primary"
                            disabled={loading || !currentEmail}
                        >
                            {loading ? t.checking : t.next}
                        </button>
                    </form>
                )}

                {step === 'newEmail' && (
                    <form className="change-email__form" onSubmit={handleRequestCode}>
                        <p className="change-email__hint">{t.newHint}</p>
                        <input
                            type="email"
                            className="change-email__input"
                            value={newEmail}
                            onChange={(e) => setNewEmail(e.target.value)}
                            placeholder={t.newPlaceholder}
                            autoFocus
                            disabled={loading}
                        />
                        {error && <div className="change-email__error">{error}</div>}
                        <button
                            type="submit"
                            className="change-email__btn change-email__btn--primary"
                            disabled={loading || !newEmail}
                        >
                            {loading ? t.sending : t.sendCode}
                        </button>
                    </form>
                )}

                {step === 'code' && (
                    <form className="change-email__form" onSubmit={handleCodeNext}>
                        <p className="change-email__hint">
                            {t.codeHint.replace('{email}', newEmail)}
                        </p>
                        <input
                            type="text"
                            inputMode="numeric"
                            maxLength={6}
                            className="change-email__input change-email__input--code"
                            value={code}
                            onChange={(e) =>
                                setCode(e.target.value.replace(/\D/g, '').slice(0, 6))
                            }
                            placeholder="000000"
                            autoFocus
                        />
                        {error && <div className="change-email__error">{error}</div>}
                        <button
                            type="submit"
                            className="change-email__btn change-email__btn--primary"
                            disabled={code.length !== 6}
                        >
                            {t.next}
                        </button>
                    </form>
                )}

                {step === 'password' && (
                    <form className="change-email__form" onSubmit={handleConfirm}>
                        <p className="change-email__hint">{t.passwordHint}</p>
                        <input
                            type="password"
                            className="change-email__input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder={t.passwordPlaceholder}
                            autoComplete="current-password"
                            autoFocus
                            disabled={loading}
                        />
                        {error && <div className="change-email__error">{error}</div>}
                        <button
                            type="submit"
                            className="change-email__btn change-email__btn--primary"
                            disabled={loading || !password}
                        >
                            {loading ? t.saving : t.confirm}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ChangeEmailModal;