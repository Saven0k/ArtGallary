import { useState } from "react"
import { Link, useNavigate } from "react-router-dom";
import { useLanguage } from "../../../../context/LanguageContext";
import { authFormTranslations } from './lang';
import './style.css';
import { validateEmail, validatePassword, validateAuthForm } from "../../../../validators/auth.validators";
import { login, type LoginData } from "../../../../api/auth/main.api";
import { useAuth } from "../../../../hooks/useAuth";

export const AuthForm = () => {
    const { language } = useLanguage();
    const lang = authFormTranslations[language];
    
    const [formData, setFormData] = useState<LoginData>({ email: "", password: "" });
    const [errors, setErrors] = useState({ email: "", password: "", global: "" });
    const navigate = useNavigate();
    const { checkAuth } = useAuth();

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;

        if (name === "email") {
            setErrors(prev => ({ ...prev, email: validateEmail(value) }));
        }

        if (name === "password") {
            setErrors(prev => ({ ...prev, password: validatePassword(value) }));
        }

        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmitForm = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        const formErrors = validateAuthForm(
            formData.email ?? "",
            formData.password ?? "",
        );

        setErrors({...formErrors, global: errors.global});

        if (!formErrors.email && !formErrors.password) {
            const res = await login(formData);            
            if (res.success === false) {
                setErrors({...formErrors, global: res.message});
            }
            checkAuth(true)
            navigate("/arts")
        } 
    };

    return (
        <form className="form" onSubmit={handleSubmitForm}>
            <h2 className="form__title">{lang.title}</h2>

            <div className="form__inputs">
                <div className="form__input-box">
                    <label className="form__label">{lang.email}</label>
                    <input
                        type="email"
                        name="email"
                        className={`form__input ${errors.email ? "form__input--error" : ""}`}
                        onChange={handleInputChange}
                    />
                    {errors.email && <span className="form__error">{errors.email}</span>}
                </div>

                <div className="form__input-box">
                    <label className="form__label">{lang.password}</label>
                    <input
                        type="password"
                        name="password"
                        className={`form__input ${errors.password ? "form__input--error" : ""}`}
                        onChange={handleInputChange}
                    />
                    {errors.password && <span className="form__error">{errors.password}</span>}
                </div>
            </div>
            {errors.global && <span className="form__error">{errors.global}</span>}

            <button className="form__btn">{lang.button}</button>

            <Link className="form__link" to={"/forgot-password"}>
                {lang.forgotPassword}
            </Link>
            <div className="form__register-link">
                <span className="form__register-text">{lang.noAccount}</span>
                <Link className="form__register-link-btn" to={"/register"}>
                    {lang.register}
                </Link>
            </div>
        </form>
    );
};