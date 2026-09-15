// src/components/shared/auth/LoginForm/LoginForm.tsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./LoginForm.scss";
import { useLanguage } from "../../../../hooks/useLanguage";
import { loginFormTranslations } from "./lang";
import { useAuth } from "../../../../hooks/useAuth";
import { login, type LoginData } from "../../../../api/auth/main.api";

interface LoginFormProps {
    onClose?: () => void;
}

type FormMode = 'login' | 'forgotPassword' | 'resetPassword';

interface ResetFormData {
    email: string;
    code: string;
    newPassword: string;
    confirmPassword: string;
}

const LoginForm = ({ onClose }: LoginFormProps) => {
    const { language } = useLanguage();
    const t = loginFormTranslations[language].loginForm;
    const navigate = useNavigate();
    const { refetch } = useAuth();
    
    const [mode, setMode] = useState<FormMode>('login');
    const [formData, setFormData] = useState<LoginData>({
        email: "",
        password: "",
    });
    const [resetData, setResetData] = useState<ResetFormData>({
        email: "",
        code: "",
        newPassword: "",
        confirmPassword: "",
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [codeSent, setCodeSent] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        setError(null);
    };

    const handleResetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setResetData((prev) => ({ ...prev, [name]: value }));
        setError(null);
        setSuccess(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const result = await login(formData);
            if (result) {
                await refetch();
                navigate("/");
                if (onClose) onClose();
            } else {
                setError(t.errors.invalidCredentials);
            }
        } catch (err) {
            setError(t.errors.serverError);
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!resetData.email.trim()) {
            setError(t.errors.emailRequired);
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            // TODO: Заменить на реальный API вызов
            // await requestPasswordReset(resetData.email);
            
            // Имитация успешного запроса
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            setCodeSent(true);
            setSuccess(t.reset.success);
            setError(null);
        } catch (err) {
            setError(t.reset.error);
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();

        // Валидация полей
        if (!resetData.code.trim()) {
            setError(t.errors.codeRequired);
            return;
        }

        if (!resetData.newPassword) {
            setError(t.errors.passwordRequired);
            return;
        }

        if (resetData.newPassword.length < 6) {
            setError(t.errors.passwordMin);
            return;
        }

        if (resetData.newPassword !== resetData.confirmPassword) {
            setError(t.errors.passwordMismatch);
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            // TODO: Заменить на реальный API вызов
            // await confirmPasswordReset(resetData.email, resetData.code, resetData.newPassword);
            
            // Имитация успешного сброса
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            setSuccess(t.reset.passwordChanged);
            
            // Возвращаемся к логину через 2 секунды
            setTimeout(() => {
                setMode('login');
                setSuccess(null);
                setError(null);
                setCodeSent(false);
                setResetData({
                    email: "",
                    code: "",
                    newPassword: "",
                    confirmPassword: "",
                });
                // Очищаем форму логина
                setFormData({
                    email: "",
                    password: "",
                });
            }, 2000);
        } catch (err) {
            setError(t.reset.invalidCode);
        } finally {
            setLoading(false);
        }
    };

    const handleBackToLogin = () => {
        setMode('login');
        setError(null);
        setSuccess(null);
        setCodeSent(false);
        setResetData({
            email: "",
            code: "",
            newPassword: "",
            confirmPassword: "",
        });
    };

    const renderForgotPassword = () => (
        <form className="login-form__form" onSubmit={handleForgotPassword}>
            <p className="login-form__reset-text">{t.reset.instruction}</p>
            
            <div className="login-form__group">
                <label className="login-form__label">{t.fields.email}</label>
                <input
                    type="email"
                    name="email"
                    className={`login-form__input ${error && !resetData.email ? 'login-form__input--error' : ''}`}
                    placeholder={t.fields.email}
                    value={resetData.email}
                    onChange={handleResetChange}
                    disabled={codeSent}
                    required
                />
            </div>

            {error && <div className="login-form__error">{error}</div>}
            {success && <div className="login-form__success">{success}</div>}

            {!codeSent ? (
                <button
                    type="submit"
                    className="login-form__btn"
                    disabled={loading || !resetData.email.trim()}
                >
                    {loading ? t.buttons.loading : t.reset.sendCode}
                </button>
            ) : (
                <button
                    type="button"
                    className="login-form__btn login-form__btn--secondary"
                    onClick={() => {
                        setCodeSent(false);
                        setSuccess(null);
                        setError(null);
                    }}
                >
                    {t.reset.editEmail}
                </button>
            )}

            <button
                type="button"
                className="login-form__back-btn"
                onClick={handleBackToLogin}
            >
                {t.reset.backToLogin}
            </button>

            {codeSent && (
                <div className="login-form__next-step">
                    <button
                        type="button"
                        className="login-form__next-btn"
                        onClick={() => setMode('resetPassword')}
                    >
                        {t.reset.enterCode} →
                    </button>
                </div>
            )}
        </form>
    );

    const renderResetPassword = () => (
        <form className="login-form__form" onSubmit={handleResetPassword}>
            <p className="login-form__reset-text">{t.reset.enterCodeInstruction}</p>
            
            <div className="login-form__group">
                <label className="login-form__label">{t.reset.codeLabel}</label>
                <input
                    type="text"
                    name="code"
                    className={`login-form__input login-form__input--code ${error && !resetData.code ? 'login-form__input--error' : ''}`}
                    placeholder={t.reset.codePlaceholder}
                    value={resetData.code}
                    onChange={handleResetChange}
                    maxLength={6}
                    required
                />
            </div>

            <div className="login-form__divider">
                <span>{t.reset.newPasswordTitle}</span>
            </div>

            <div className="login-form__group">
                <label className="login-form__label">{t.fields.password}</label>
                <input
                    type="password"
                    name="newPassword"
                    className={`login-form__input ${error && !resetData.newPassword ? 'login-form__input--error' : ''}`}
                    placeholder={t.fields.password}
                    value={resetData.newPassword}
                    onChange={handleResetChange}
                    required
                />
            </div>

            <div className="login-form__group">
                <label className="login-form__label">{t.reset.confirmPassword}</label>
                <input
                    type="password"
                    name="confirmPassword"
                    className={`login-form__input ${error && resetData.confirmPassword && resetData.newPassword !== resetData.confirmPassword ? 'login-form__input--error' : ''}`}
                    placeholder={t.reset.confirmPassword}
                    value={resetData.confirmPassword}
                    onChange={handleResetChange}
                    required
                />
            </div>

            {error && <div className="login-form__error">{error}</div>}
            {success && <div className="login-form__success">{success}</div>}

            <button
                type="submit"
                className="login-form__btn"
                disabled={loading || !resetData.code.trim() || !resetData.newPassword || !resetData.confirmPassword}
            >
                {loading ? t.buttons.loading : t.reset.changePassword}
            </button>

            <button
                type="button"
                className="login-form__back-btn"
                onClick={() => {
                    setMode('forgotPassword');
                    setError(null);
                    setSuccess(null);
                }}
            >
                {t.reset.backToCode}
            </button>
        </form>
    );

    const renderLogin = () => (
        <form className="login-form__form" onSubmit={handleSubmit}>
            <div className="login-form__group">
                <label className="login-form__label">{t.fields.email}</label>
                <input
                    type="email"
                    name="email"
                    className={`login-form__input ${error ? 'login-form__input--error' : ''}`}
                    placeholder={t.fields.email}
                    value={formData.email}
                    onChange={handleChange}
                    required
                />
            </div>

            <div className="login-form__group">
                <label className="login-form__label">{t.fields.password}</label>
                <input
                    type="password"
                    name="password"
                    className={`login-form__input ${error ? 'login-form__input--error' : ''}`}
                    placeholder={t.fields.password}
                    value={formData.password}
                    onChange={handleChange}
                    required
                />
            </div>

            <div className="login-form__forgot">
                <button
                    type="button"
                    className="login-form__forgot-link"
                    onClick={() => {
                        setMode('forgotPassword');
                        setError(null);
                        setSuccess(null);
                        setCodeSent(false);
                        setResetData({
                            email: "",
                            code: "",
                            newPassword: "",
                            confirmPassword: "",
                        });
                    }}
                >
                    {t.reset.forgotPassword}
                </button>
            </div>

            {error && <div className="login-form__error">{error}</div>}

            <button
                type="submit"
                className="login-form__btn"
                disabled={loading}
            >
                {loading ? t.buttons.loading : t.buttons.login}
            </button>
        </form>
    );

    return (
        <div className="login-form">
            <h2 className="login-form__title">
                {mode === 'login' ? t.title : 
                 mode === 'forgotPassword' ? t.reset.title : t.reset.newPasswordTitle}
            </h2>
            <p className="login-form__subtitle">
                {mode === 'login' ? t.subtitle : 
                 mode === 'forgotPassword' ? t.reset.subtitle : t.reset.enterNewPassword}
            </p>

            {mode === 'login' && renderLogin()}
            {mode === 'forgotPassword' && renderForgotPassword()}
            {mode === 'resetPassword' && renderResetPassword()}

            {mode === 'login' && (
                <div className="login-form__footer">
                    <span className="login-form__footer-text">{t.footer.text}</span>
                    <Link to="/register" className="login-form__footer-link">
                        {t.footer.link}
                    </Link>
                </div>
            )}
        </div>
    );
};

export default LoginForm;