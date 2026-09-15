// src/pages/Login/LoginPage.tsx
import { useState } from "react";
import LoginForm from "../../components/shared/auth/LoginForm/LoginForm";
import AuthImage from "./authImg.png";
import "./form.scss";
import { useLanguage } from "../../hooks/useLanguage";
import { loginPageTranslations } from "./lang";

const LoginPage = () => {
    const { language } = useLanguage();
    const t = loginPageTranslations[language].loginPage;

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