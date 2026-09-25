// src/pages/Login/LoginPage.tsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import LoginForm from "../../components/shared/auth/LoginForm/LoginForm";
import AuthImage from "./authImg.png";
import "./form.scss";
import { useLanguage } from "../../hooks/useLanguage";
import { loginPageTranslations } from "./lang";
import { useAuth } from "../../hooks/useAuth";

const LoginPage = () => {
    const { language } = useLanguage();
    const t = loginPageTranslations[language].loginPage;

    const { user, isLoading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!isLoading && user) {
            navigate('/profile', { replace: true });
        }
    }, [isLoading, user, navigate]);

    if (isLoading) {
        return (
            <div className="login-page auth-page">
                <div className="login__box auth__box">
                    <div className="auth__loading">…</div>
                </div>
            </div>
        );
    }

    if (user) return null;

    return (
        <div className="login-page auth-page">
            <div className="login__box auth__box">
                <img src={AuthImage} alt="Картинка входа" className="login__img auth__img" />
                <div className="login__content auth__content">
                    <LoginForm />
                </div>
            </div>
        </div>
    );
};

export default LoginPage;