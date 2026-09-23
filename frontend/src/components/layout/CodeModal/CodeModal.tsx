// src/components/layout/CodeModal/CodeModal.tsx
import { useState } from 'react';
import { X } from 'lucide-react';
import { requestResetCode, verifyResetCode } from '../../../api/auth/main.api';
import { useLanguage } from '../../../hooks/useLanguage';
import { codeModalTranslations } from './lang';
import './CodeModal.scss';

interface CodeModalProps {
    /** если email уже известен — можно передать и пропустить шаг ввода */
    initialEmail?: string;
    /** вызывается после успешной проверки кода */
    onVerified: (email: string, code: string) => void;
    onClose: () => void;
}

const CodeModal = ({ initialEmail = '', onVerified, onClose }: CodeModalProps) => {
    const { language } = useLanguage();
    const t = codeModalTranslations[language];

    const [step, setStep] = useState<'email' | 'code'>(initialEmail ? 'code' : 'email');
    const [email, setEmail] = useState(initialEmail);
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [info, setInfo] = useState<string | null>(null);

    const handleSendCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            await requestResetCode({ email });
            setStep('code');
            setInfo(t.codeSent);
        } catch (err: any) {
            setError(err?.message || t.errors.generic);
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            await verifyResetCode({ email, code });
            onVerified(email, code);
            onClose();
        } catch (err: any) {
            setError(err?.message || t.errors.generic);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="code-modal-overlay" onClick={onClose}>
            <div className="code-modal" onClick={(e) => e.stopPropagation()}>
                <header className="code-modal__header">
                    <h2 className="code-modal__title">{t.title}</h2>
                    <button type="button" className="code-modal__close" onClick={onClose}>
                        <X size={20} />
                    </button>
                </header>

                {step === 'email' && (
                    <form className="code-modal__form" onSubmit={handleSendCode}>
                        <p className="code-modal__hint">{t.emailHint}</p>
                        <input
                            type="email"
                            className="code-modal__input"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder={t.emailPlaceholder}
                            autoFocus
                            disabled={loading}
                        />
                        {error && <div className="code-modal__error">{error}</div>}
                        <button
                            type="submit"
                            className="code-modal__btn code-modal__btn--primary"
                            disabled={loading || !email}
                        >
                            {loading ? t.sending : t.sendCode}
                        </button>
                    </form>
                )}

                {step === 'code' && (
                    <form className="code-modal__form" onSubmit={handleVerify}>
                        <p className="code-modal__hint">{t.codeHint}</p>
                        <input
                            type="text"
                            inputMode="numeric"
                            maxLength={6}
                            className="code-modal__input code-modal__input--code"
                            value={code}
                            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            placeholder="000000"
                            autoFocus
                            disabled={loading}
                        />
                        {error && <div className="code-modal__error">{error}</div>}
                        {info && <div className="code-modal__info">{info}</div>}
                        <button
                            type="button"
                            className="code-modal__resend"
                            onClick={handleSendCode}
                            disabled={loading}
                        >
                            {t.resend}
                        </button>
                        <button
                            type="submit"
                            className="code-modal__btn code-modal__btn--primary"
                            disabled={loading || code.length !== 6}
                        >
                            {loading ? t.checking : t.verify}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default CodeModal;