// src/pages/Register/components/RegisterUser/RegisterUser.tsx
import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./RegisterUser.scss";
import { useLanguage } from "../../../../hooks/useLanguage";
import { registerUserTranslations } from "../lang";
import { register, type RegisterData } from "../../../../api/auth/main.api";
import { useAuth } from "../../../../hooks/useAuth";
import {
    getAllCountries,
    getCitiesByCountryCode,
    type CountrySuggestion,
    type CitySuggestion,
} from "../../../../api/location/main.api";

type Step = 1 | 2 | 3;

/** TODO: подставьте сюда URL файла с правилами магазина и офертой на сервере */
const TERMS_URL = "/files/terms-and-offer.pdf";

interface FormData {
    surname: string;
    name: string;
    secondName: string;
    birthday: string;
    gender: "M" | "F" | "";
    email: string;
    password: string;
    confirmPassword: string;
    countryId: number | "";
    cityId: number | "";
    agreement: boolean;
}

interface ValidationErrors {
    surname?: string;
    name?: string;
    birthday?: string;
    gender?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    agreement?: string;
    api?: string;
}

interface RegisterUserProps {
    onClose?: () => void;
}

const RegisterUser = (_props: RegisterUserProps) => {
    const { language } = useLanguage();
    const t = registerUserTranslations[language].registerUser;
    const navigate = useNavigate();
    const { refetch } = useAuth();

    const [currentStep, setCurrentStep] = useState<Step>(1);
    const [loading, setLoading] = useState(false);
    const [apiError, setApiError] = useState<string | null>(null);

    const [formData, setFormData] = useState<FormData>({
        surname: "",
        name: "",
        secondName: "",
        birthday: "",
        gender: "",
        email: "",
        password: "",
        confirmPassword: "",
        countryId: "",
        cityId: "",
        agreement: false,
    });

    const [countries, setCountries] = useState<CountrySuggestion[]>([]);
    const [cities, setCities] = useState<CitySuggestion[]>([]);
    const [loadingCountries, setLoadingCountries] = useState(false);
    const [loadingCities, setLoadingCities] = useState(false);

    const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
    const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});

    // ---------- загрузка стран ----------
    useEffect(() => {
        const fetchCountries = async () => {
            setLoadingCountries(true);
            try {
                const data = await getAllCountries(language === "ru" ? "ru" : "en");
                setCountries(data || []);
            } catch (e) {
                console.error("Error loading countries:", e);
            } finally {
                setLoadingCountries(false);
            }
        };
        fetchCountries();
    }, [language]);

    // ---------- загрузка городов ----------
    useEffect(() => {
        const fetchCities = async () => {
            if (!formData.countryId) {
                setCities([]);
                return;
            }
            setLoadingCities(true);
            try {
                const country = countries.find((c) => c.id === formData.countryId);
                if (country) {
                    const data = await getCitiesByCountryCode(
                        country.iso2,
                        language === "ru" ? "ru" : "en",
                    );
                    setCities(data || []);
                }
            } catch (e) {
                console.error("Error loading cities:", e);
                setCities([]);
            } finally {
                setLoadingCities(false);
            }
        };
        fetchCities();
    }, [formData.countryId, countries, language]);

    // ---------- валидация ----------
    const validateField = (
        name: string,
        value: string | boolean,
    ): string | undefined => {
        switch (name) {
            case "surname":
                if (!String(value).trim()) return t.errors.required;
                if (String(value).trim().length < 2)
                    return t.errors.minLength?.replace("{min}", "2") || "Минимум 2 символа";
                return undefined;
            case "name":
                if (!String(value).trim()) return t.errors.required;
                if (String(value).trim().length < 2)
                    return t.errors.minLength?.replace("{min}", "2") || "Минимум 2 символа";
                return undefined;
            case "birthday":
                if (!value) return t.errors.required;
                return undefined;
            case "gender":
                if (!value) return t.errors.required;
                return undefined;
            case "email":
                if (!String(value).trim()) return t.errors.required;
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value)))
                    return t.errors.email;
                return undefined;
            case "password":
                if (!value) return t.errors.required;
                if (String(value).length < 8) return t.errors.passwordMin;
                if (String(value).length > 25) return t.errors.passwordMax;
                return undefined;
            case "confirmPassword":
                if (!value) return t.errors.required;
                if (value !== formData.password) return t.errors.passwordMismatch;
                return undefined;
            case "agreement":
                if (!value) return t.agreement.error;
                return undefined;
            default:
                return undefined;
        }
    };

    const validateStep = (step: Step): boolean => {
        const errors: ValidationErrors = {};
        const fieldsToValidate: Record<Step, string[]> = {
            1: ["surname", "name", "birthday", "gender"],
            2: ["email", "password", "confirmPassword"],
            3: ["agreement"],
        };

        fieldsToValidate[step].forEach((field) => {
            const value = formData[field as keyof FormData] as string | boolean;
            const error = validateField(field, value);
            if (error) errors[field as keyof ValidationErrors] = error;
        });

        setValidationErrors(errors);

        const touched: Record<string, boolean> = {};
        fieldsToValidate[step].forEach((field) => {
            touched[field] = true;
        });
        setTouchedFields((prev) => ({ ...prev, ...touched }));

        return Object.keys(errors).length === 0;
    };

    // ---------- обработчики ----------
    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    ) => {
        const target = e.target as HTMLInputElement;
        const { name } = target;
        const value = target.type === "checkbox" ? target.checked : target.value;

        if (name === "countryId") {
            const newValue = value === "" ? "" : Number(value);
            setFormData((prev) => ({ ...prev, countryId: newValue, cityId: "" }));
        } else if (name === "agreement") {
            setFormData((prev) => ({ ...prev, agreement: Boolean(value) }));
        } else {
            setFormData((prev) => ({ ...prev, [name]: value }));
        }

        setApiError(null);

        if (touchedFields[name]) {
            const error = validateField(name, value);
            setValidationErrors((prev) => ({ ...prev, [name]: error }));
        }
    };

    const handleBlur = (
        e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>,
    ) => {
        const target = e.target as HTMLInputElement;
        const { name } = target;
        const value = target.type === "checkbox" ? target.checked : target.value;

        setTouchedFields((prev) => ({ ...prev, [name]: true }));
        const error = validateField(name, value);
        setValidationErrors((prev) => ({ ...prev, [name]: error }));
    };

    const handleGenderChange = (value: "M" | "F") => {
        setFormData((prev) => ({ ...prev, gender: value }));
        setTouchedFields((prev) => ({ ...prev, gender: true }));
        const error = validateField("gender", value);
        setValidationErrors((prev) => ({ ...prev, gender: error }));
    };

    const handleNext = () => {
        if (validateStep(currentStep) && currentStep < 3) {
            setCurrentStep((prev) => (prev + 1) as Step);
            setValidationErrors({});
            setTouchedFields({});
            setApiError(null);
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep((prev) => (prev - 1) as Step);
            setValidationErrors({});
            setTouchedFields({});
            setApiError(null);
        }
    };

    const handleSubmit = async () => {
        if (!validateStep(currentStep)) return;

        setLoading(true);
        setApiError(null);

        try {
            const registerData: RegisterData = {
                email: formData.email,
                password: formData.password,
                name: formData.name,
                surname: formData.surname,
                second_name: formData.secondName || undefined,
                date_birthday: formData.birthday,
                gender: formData.gender as "M" | "F",
                country_id: formData.countryId ? Number(formData.countryId) : undefined,
                city_id: formData.cityId ? Number(formData.cityId) : undefined,
            };

            const result = await register(registerData);

            if (result) {
                await refetch();
                navigate("/");
            } else {
                setApiError(t.errors.registerFailed || "Ошибка при регистрации");
            }
        } catch (error: any) {
            console.error("Registration error:", error);
            if (error.message?.includes("существует")) {
                setApiError(
                    t.errors.emailExists || "Пользователь с таким email уже существует",
                );
            } else {
                setApiError(
                    error.message || t.errors.registerFailed || "Ошибка при регистрации",
                );
            }
        } finally {
            setLoading(false);
        }
    };

    // ---------- шаги ----------
    const renderStep = () => {
        switch (currentStep) {
            case 1:
                return (
                    <div className="register-user__step">
                        <h3 className="register-user__step-title">{t.step1.title}</h3>

                        <div className="register-user__form-group">
                            <label className="register-user__label">
                                {t.step1.fields.surname}
                            </label>
                            <input
                                type="text"
                                name="surname"
                                className={`register-user__input ${
                                    validationErrors.surname && touchedFields.surname
                                        ? "register-user__input--error"
                                        : ""
                                }`}
                                placeholder={t.step1.fields.surname}
                                value={formData.surname}
                                onChange={handleChange}
                                onBlur={handleBlur}
                            />
                            {validationErrors.surname && touchedFields.surname && (
                                <span className="register-user__error-text">
                                    {validationErrors.surname}
                                </span>
                            )}
                        </div>

                        <div className="register-user__form-group">
                            <label className="register-user__label">
                                {t.step1.fields.name}
                            </label>
                            <input
                                type="text"
                                name="name"
                                className={`register-user__input ${
                                    validationErrors.name && touchedFields.name
                                        ? "register-user__input--error"
                                        : ""
                                }`}
                                placeholder={t.step1.fields.name}
                                value={formData.name}
                                onChange={handleChange}
                                onBlur={handleBlur}
                            />
                            {validationErrors.name && touchedFields.name && (
                                <span className="register-user__error-text">
                                    {validationErrors.name}
                                </span>
                            )}
                        </div>

                        <div className="register-user__form-group">
                            <label className="register-user__label">
                                {t.step1.fields.secondName}
                            </label>
                            <input
                                type="text"
                                name="secondName"
                                className="register-user__input"
                                placeholder={t.step1.fields.secondName}
                                value={formData.secondName}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="register-user__form-group">
                            <label className="register-user__label">
                                {t.step1.fields.birthday}
                            </label>
                            <input
                                type="date"
                                name="birthday"
                                className={`register-user__input ${
                                    validationErrors.birthday && touchedFields.birthday
                                        ? "register-user__input--error"
                                        : ""
                                }`}
                                value={formData.birthday}
                                onChange={handleChange}
                                onBlur={handleBlur}
                            />
                            {validationErrors.birthday && touchedFields.birthday && (
                                <span className="register-user__error-text">
                                    {validationErrors.birthday}
                                </span>
                            )}
                        </div>

                        <div className="register-user__form-group">
                            <label className="register-user__label">
                                {t.step2.fields.gender}
                            </label>
                            <div className="register-user__gender-group">
                                <button
                                    type="button"
                                    className={`register-user__gender-btn ${
                                        formData.gender === "M"
                                            ? "register-user__gender-btn--active"
                                            : ""
                                    }`}
                                    onClick={() => handleGenderChange("M")}
                                >
                                    {t.step2.options.male}
                                </button>
                                <button
                                    type="button"
                                    className={`register-user__gender-btn ${
                                        formData.gender === "F"
                                            ? "register-user__gender-btn--active"
                                            : ""
                                    }`}
                                    onClick={() => handleGenderChange("F")}
                                >
                                    {t.step2.options.female}
                                </button>
                            </div>
                            {validationErrors.gender && touchedFields.gender && (
                                <span className="register-user__error-text">
                                    {validationErrors.gender}
                                </span>
                            )}
                        </div>
                    </div>
                );

            case 2:
                return (
                    <div className="register-user__step">
                        <h3 className="register-user__step-title">{t.step2.title}</h3>

                        <div className="register-user__form-group">
                            <label className="register-user__label">
                                {t.step2.fields.email}
                            </label>
                            <input
                                type="email"
                                name="email"
                                className={`register-user__input ${
                                    validationErrors.email && touchedFields.email
                                        ? "register-user__input--error"
                                        : ""
                                }`}
                                placeholder={t.step2.fields.email}
                                value={formData.email}
                                onChange={handleChange}
                                onBlur={handleBlur}
                            />
                            {validationErrors.email && touchedFields.email && (
                                <span className="register-user__error-text">
                                    {validationErrors.email}
                                </span>
                            )}
                        </div>

                        <div className="register-user__form-group">
                            <label className="register-user__label">
                                {t.step2.fields.password}
                            </label>
                            <input
                                type="password"
                                name="password"
                                className={`register-user__input ${
                                    validationErrors.password && touchedFields.password
                                        ? "register-user__input--error"
                                        : ""
                                }`}
                                placeholder={t.step2.fields.password}
                                value={formData.password}
                                onChange={handleChange}
                                onBlur={handleBlur}
                            />
                            {validationErrors.password && touchedFields.password && (
                                <span className="register-user__error-text">
                                    {validationErrors.password}
                                </span>
                            )}
                        </div>

                        <div className="register-user__form-group">
                            <label className="register-user__label">
                                {t.step2.fields.confirmPassword}
                            </label>
                            <input
                                type="password"
                                name="confirmPassword"
                                className={`register-user__input ${
                                    validationErrors.confirmPassword &&
                                    touchedFields.confirmPassword
                                        ? "register-user__input--error"
                                        : ""
                                }`}
                                placeholder={t.step2.fields.confirmPassword}
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                onBlur={handleBlur}
                            />
                            {validationErrors.confirmPassword &&
                                touchedFields.confirmPassword && (
                                    <span className="register-user__error-text">
                                        {validationErrors.confirmPassword}
                                    </span>
                                )}
                        </div>
                    </div>
                );

            case 3:
                return (
                    <div className="register-user__step">
                        <h3 className="register-user__step-title">{t.step3.title}</h3>

                        <div className="register-user__form-group">
                            <label className="register-user__label">
                                {t.step3.fields.country}
                            </label>
                            <select
                                name="countryId"
                                className="register-user__input register-user__select"
                                value={formData.countryId}
                                onChange={handleChange}
                                disabled={loadingCountries}
                            >
                                <option value="">
                                    {loadingCountries
                                        ? "Загрузка..."
                                        : t.step3.fields.country}
                                </option>
                                {countries.map((country) => (
                                    <option key={country.id} value={country.id}>
                                        {country.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="register-user__form-group">
                            <label className="register-user__label">
                                {t.step3.fields.city}
                            </label>
                            <select
                                name="cityId"
                                className="register-user__input register-user__select"
                                value={formData.cityId}
                                onChange={handleChange}
                                disabled={!formData.countryId || loadingCities}
                            >
                                <option value="">
                                    {!formData.countryId
                                        ? "Сначала выберите страну"
                                        : loadingCities
                                          ? "Загрузка..."
                                          : t.step3.fields.city}
                                </option>
                                {cities.map((city) => (
                                    <option key={city.id} value={city.id}>
                                        {city.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* --- Согласие с правилами и офертой --- */}
                        <div className="register-user__form-group register-user__form-group--checkbox">
                            <label className="register-user__checkbox-label">
                                <input
                                    type="checkbox"
                                    name="agreement"
                                    className="register-user__checkbox"
                                    checked={formData.agreement}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                />
                                <span className="register-user__checkbox-text">
                                    {t.agreement.text}{" "}
                                    <a
                                        href={TERMS_URL}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="register-user__checkbox-link"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        {t.agreement.rulesLink}
                                    </a>
                                </span>
                            </label>
                            {validationErrors.agreement && touchedFields.agreement && (
                                <span className="register-user__error-text">
                                    {validationErrors.agreement}
                                </span>
                            )}
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="register-user">
            <div className="register-user__header">
                <h2 className="register-user__title">{t.title}</h2>
            </div>

            <div className="register-user__progress">
                <div className="register-user__step-indicators">
                    {[1, 2, 3].map((step) => (
                        <div
                            key={step}
                            className={`register-user__step-dot ${
                                step <= currentStep ? "register-user__step-dot--active" : ""
                            }`}
                        />
                    ))}
                </div>
                <span className="register-user__step-counter">
                    {currentStep} / 3
                </span>
            </div>

            <div className="register-user__content">
                {apiError && (
                    <div className="register-user__error register-user__error--api">
                        {apiError}
                    </div>
                )}
                {renderStep()}
            </div>

            <div className="register-user__actions">
                {currentStep > 1 && (
                    <button
                        className="register-user__btn register-user__btn--secondary"
                        onClick={handleBack}
                        disabled={loading}
                        type="button"
                    >
                        {t.buttons.back}
                    </button>
                )}

                {currentStep === 3 ? (
                    <button
                        className="register-user__btn register-user__btn--primary"
                        onClick={handleSubmit}
                        disabled={loading || !formData.agreement}
                        type="button"
                    >
                        {loading ? t.buttons.loading || "..." : t.buttons.submit}
                    </button>
                ) : (
                    <button
                        className="register-user__btn register-user__btn--primary"
                        onClick={handleNext}
                        disabled={loading}
                        type="button"
                    >
                        {t.buttons.next}
                    </button>
                )}
            </div>

            <div className="register-user__footer">
                <span className="register-user__footer-text">{t.footer.text}</span>
                <Link to="/login" className="register-user__footer-link">
                    {t.footer.link}
                </Link>
            </div>
        </div>
    );
};

export default RegisterUser;