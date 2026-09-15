// src/pages/Register/RegisterPage.tsx
import { useState } from "react";
import RegisterUser from "../../components/shared/auth/RegisterForm/RegisterUser";
import RegisterAuthor from "../../components/shared/auth/RegisterAuthor/RegisterAuthor";
import AuthImage from "./authImg.png";
import "./form.scss";
import { useLanguage } from "../../hooks/useLanguage";
import { registerPageTranslations } from "./lang";

type RegisterType = 'user' | 'author';

const RegisterPage = () => {
    const { language } = useLanguage();
    const t = registerPageTranslations[language].registerPage;
    const [registerType, setRegisterType] = useState<RegisterType>('user');

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