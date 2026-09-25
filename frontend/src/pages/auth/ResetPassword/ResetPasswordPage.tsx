import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    requestResetCode,
    verifyResetCode,
    resetPassword,
} from '../../../api/auth/main.api';
import { useLanguage } from '../../../hooks/useLanguage';
import { resetPasswordTranslations } from './lang';
import './ResetPassword.scss';

type Step = 'email' | 'code' | 'password';

const ResetPasswordPage = () => {
    const navigate = useNavigate();
    const { language } = useLanguage();
    const t = resetPasswordTranslations[language];

    const [step, setStep] = useState<Step>('email');
    const [email, setEmail] = useState('');
    const [code, setCode] = useState('');
    const [resetToken, setResetToken] = useState<string | null>(null);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Шаг 1: запросить код
    const handleRequestCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            await requestResetCode({ email });
            setStep('code');
        } catch (err: any) {
            setError(err?.message || t.errors.generic);
        } finally {
            setLoading(false);
        }
    };

    // Шаг 2: проверить код
    const handleVerifyCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            const res = await verifyResetCode({ email, code });
            setResetToken(res.resetToken);
            setStep('password');
        } catch (err: any) {
            setError(err?.message || t.errors.generic);
        } finally {
            setLoading(false);
        }
    };

    // Шаг 3: сменить пароль
    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (newPassword !== confirmPassword) {
            setError(t.errors.mismatch);
            return;
        }
        if (!resetToken) {
            setError(t.errors.generic);
            return;
        }
        setLoading(true);
        try {
            await resetPassword({ resetToken, newPassword });
            navigate('/login', { replace: true });
        } catch (err: any) {
            setError(err?.message || t.errors.generic);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="reset-password">
            <div className="reset-password__card">
                <h1 className="reset-password__title">{t.title}</h1>
                <p className="reset-password__subtitle">{t.subtitle}</p>

                {step === 'email' && (
                    <form onSubmit={handleRequestCode} className="reset-password__form">
                        <label className="reset-password__label">{t.email}</label>
                        <input
                            type="email"
                            className="reset-password__input"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder={t.emailPlaceholder}
                            autoFocus
                            disabled={loading}
                        />
                        {error && <div className="reset-password__error">{error}</div>}
                        <button
                            type="submit"
                            className="reset-password__btn"
                            disabled={loading || !email}
                        >
                            {loading ? t.sending : t.sendCode}
                        </button>
                    </form>
                )}

                {step === 'code' && (
                    <form onSubmit={handleVerifyCode} className="reset-password__form">
                        <label className="reset-password__label">{t.code}</label>
                        <input
                            type="text"
                            inputMode="numeric"
                            maxLength={6}
                            className="reset-password__input reset-password__input--code"
                            value={code}
                            onChange={(e) =>
                                setCode(e.target.value.replace(/\D/g, '').slice(0, 6))
                            }
                            placeholder="000000"
                            autoFocus
                            disabled={loading}
                        />
                        {error && <div className="reset-password__error">{error}</div>}
                        <button
                            type="button"
                            className="reset-password__resend"
                            onClick={handleRequestCode}
                            disabled={loading}
                        >
                            {t.resend}
                        </button>
                        <button
                            type="submit"
                            className="reset-password__btn"
                            disabled={loading || code.length !== 6}
                        >
                            {loading ? t.checking : t.verify}
                        </button>
                    </form>
                )}

                {step === 'password' && (
                    <form onSubmit={handleResetPassword} className="reset-password__form">
                        <label className="reset-password__label">{t.newPassword}</label>
                        <input
                            type="password"
                            className="reset-password__input"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder={t.placeholders.new}
                            autoComplete="new-password"
                            disabled={loading}
                        />

                        <label className="reset-password__label">{t.confirmPassword}</label>
                        <input
                            type="password"
                            className="reset-password__input"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder={t.placeholders.confirm}
                            autoComplete="new-password"
                            disabled={loading}
                        />

                        {error && <div className="reset-password__error">{error}</div>}
                        <button
                            type="submit"
                            className="reset-password__btn"
                            disabled={loading}
                        >
                            {loading ? t.saving : t.submit}
                        </button>
                    </form>
                )}

                <Link to="/login" className="reset-password__back">
                    {t.backToLogin}
                </Link>
            </div>
        </div>
    );
};

export default ResetPasswordPage;