// src/pages/Register/RegisterPage.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import RegisterUser from "../../components/shared/auth/RegisterForm/RegisterUser";
import RegisterAuthor from "../../components/shared/auth/RegisterAuthor/RegisterAuthor";
import AuthImage from "./authImg.png";
import "./form.scss";
import { useLanguage } from "../../hooks/useLanguage";
import { registerPageTranslations } from "./lang";
import { useAuth } from "../../hooks/useAuth";

type RegisterType = 'user' | 'author';

const RegisterPage = () => {
    const { language } = useLanguage();
    const t = registerPageTranslations[language].registerPage;
    const [registerType, setRegisterType] = useState<RegisterType>('user');

    const { user, isLoading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!isLoading && user) {
            navigate('/profile', { replace: true });
        }
    }, [isLoading, user, navigate]);

    // Пока проверяем авторизацию — не мигаем формой
    if (isLoading) {
        return (
            <div className="register-page auth-page">
                <div className="register__box auth__box">
                    <div className="auth__loading">…</div>
                </div>
            </div>
        );
    }

    // Если уже авторизован — не рендерим ничего (уйдёт редирект)
    if (user) return null;

    return (
        <div className="register-page auth-page">
            <div className="register__box auth__box">
                <img src={AuthImage} alt="Картинка регистрации" className="register__img auth__img" />

                <div className="register__content auth__content">
                    <div className="register__tabs">
                        <button
                            className={`register__tab ${registerType === 'user' ? 'register__tab--active' : ''}`}
                            onClick={() => setRegisterType('user')}
                        >
                            {t.tabs.user}
                        </button>
                        <button
                            className={`register__tab ${registerType === 'author' ? 'register__tab--active' : ''}`}
                            onClick={() => setRegisterType('author')}
                        >
                            {t.tabs.author}
                        </button>
                    </div>

                    {registerType === 'user' ? (
                        <RegisterUser onClose={() => {}} />
                    ) : (
                        <RegisterAuthor onClose={() => {}} />
                    )}
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;