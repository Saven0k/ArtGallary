import { errorMessage } from '../../../../../utils/errors';
// src/pages/Profile/components/ChangeEmailModal/ChangeEmailModal.tsx
import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import {
    requestEmailChangeCode,
    confirmEmailChange,
} from '../../../../../api/auth/main.api';
import { useLanguage } from '../../../../../hooks/useLanguage';
import { useAuth } from '../../../../../hooks/useAuth';
import { changeEmailTranslations } from './lang';
import './ChangeEmailModal.scss';

interface ChangeEmailModalProps {
    onClose: () => void;
    onSuccess?: () => void;
    onError?: () => void;
}

type Step = 'newEmail' | 'code' | 'password';

const ChangeEmailModal = ({ onClose, onSuccess, onError }: ChangeEmailModalProps) => {
    const { language } = useLanguage();
    const { user } = useAuth();
    const t = changeEmailTranslations[language];

    // Текущий email — из контекста, ничего вводить не надо
    const currentEmail = user?.email ?? '';

    const [step, setStep] = useState<Step>('newEmail');
    const [newEmail, setNewEmail] = useState('');
    const [code, setCode] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Если пользователь не авторизован — закрываем модалку сразу
    useEffect(() => {
        if (!currentEmail) {
            onClose();
        }
    }, [currentEmail, onClose]);

    // ---------- шаг 1: новый email → отправляем код ----------
    const handleRequestCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!newEmail.trim()) return;
        if (newEmail.trim().toLowerCase() === currentEmail.toLowerCase()) {
            setError(t.errors.sameAsCurrent);
            return;
        }

        setLoading(true);
        try {
            await requestEmailChangeCode({ newEmail: newEmail.trim() });
            setStep('code');
        } catch (err: unknown) {
            setError(errorMessage(err, t.errors.generic));
        } finally {
            setLoading(false);
        }
    };

    // ---------- шаг 2: код → переходим к паролю ----------
    const handleCodeNext = (e: React.FormEvent) => {
        e.preventDefault();
        if (code.length !== 6) {
            setError(t.errors.codeLength);
            return;
        }
        setError(null);
        setStep('password');
    };

    // ---------- шаг 3: пароль + подтверждение ----------
    const handleConfirm = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            await confirmEmailChange({
                newEmail: newEmail.trim(),
                code,
                password,
            });
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

                {/* подсказка: текущий email */}
                <div className="change-email__current">
                    {t.currentLabel}: <strong>{currentEmail}</strong>
                </div>

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
                            disabled={loading || !newEmail.trim()}
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