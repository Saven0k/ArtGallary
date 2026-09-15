// src/pages/Register/components/RegisterAuthor/RegisterAuthor.tsx
import { useState, useEffect } from "react";
import "./RegisterAuthor.scss";
import { useLanguage } from "../../../../hooks/useLanguage";
import { registerAuthorTranslations } from "../lang";
import { Link, useNavigate } from "react-router-dom";
import { createAuthor, type CreateAuthorData } from "../../../../api/authors/main.api";
import { useAuth } from "../../../../hooks/useAuth";
import { getAllProfessions, type Profession } from "../../../../api/professions/main.api";
import { getAllCountries, getCitiesByCountryCode, type CountrySuggestion, type CitySuggestion } from "../../../../api/location/main.api";

type Step = 1 | 2 | 3 | 4 | 5;

interface RegisterAuthorProps {
    onClose?: () => void;
}

interface FormData {
    surname: string;
    name: string;
    secondName: string;
    birthday: string;
    gender: 'M' | 'F' | '';
    email: string;
    password: string;
    confirmPassword: string;
    countryId: number | '';
    cityId: number | '';
    professionId: number | '';
    biography: string;
}

interface ValidationErrors {
    surname?: string;
    name?: string;
    birthday?: string;
    gender?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    professionId?: string;
}

const RegisterAuthor = () => {
    const { language } = useLanguage();
    const t = registerAuthorTranslations[language].registerAuthor;
    const navigate = useNavigate();
    const { refetch } = useAuth();
    const [currentStep, setCurrentStep] = useState<Step>(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);

    // Данные для селектов
    const [countries, setCountries] = useState<CountrySuggestion[]>([]);
    const [cities, setCities] = useState<CitySuggestion[]>([]);
    const [professions, setProfessions] = useState<Profession[]>([]);
    const [loadingCountries, setLoadingCountries] = useState(false);
    const [loadingCities, setLoadingCities] = useState(false);
    const [loadingProfessions, setLoadingProfessions] = useState(false);

    const [formData, setFormData] = useState<FormData>({
        surname: '',
        name: '',
        secondName: '',
        birthday: '',
        gender: '',
        email: '',
        password: '',
        confirmPassword: '',
        countryId: '',
        cityId: '',
        professionId: '',
        biography: '',
    });

    const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
    const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});

    // Загрузка стран и профессий при монтировании
    useEffect(() => {
        const fetchInitialData = async () => {
            // Загружаем страны
            setLoadingCountries(true);
            try {
                const countriesData = await getAllCountries(language === 'ru' ? 'ru' : 'en');
                setCountries(countriesData || []);
            } catch (e) {
                console.error('Error loading countries:', e);
            } finally {
                setLoadingCountries(false);
            }

            // Загружаем профессии
            setLoadingProfessions(true);
            try {
                const professionsData = await getAllProfessions();
                setProfessions(professionsData || []);
            } catch (e) {
                console.error('Error loading professions:', e);
            } finally {
                setLoadingProfessions(false);
            }
        };

        fetchInitialData();
    }, [language]);

    // Загрузка городов при выборе страны
    useEffect(() => {
        const fetchCities = async () => {
            if (!formData.countryId) {
                setCities([]);
                return;
            }

            setLoadingCities(true);
            try {
                // Ищем страну по ID чтобы получить код
                const country = countries.find(c => c.id === formData.countryId);
                if (country) {
                    const citiesData = await getCitiesByCountryCode(
                        country.iso2,
                        language === 'ru' ? 'ru' : 'en'
                    );
                    console.log(citiesData);
                    setCities(citiesData || []);
                }
            } catch (e) {
                console.error('Error loading cities:', e);
                setCities([]);
            } finally {
                setLoadingCities(false);
            }
        };

        fetchCities();
    }, [formData.countryId, countries, language]);

    // Кастомная валидация для каждого поля
    const validateField = (name: string, value: string | number): string | undefined => {
        switch (name) {
            case 'surname':
                if (!value || !String(value).trim()) return t.errors.required;
                if (String(value).trim().length < 2) return t.errors.minLength?.replace('{min}', '2') || 'Минимум 2 символа';
                return undefined;
            case 'name':
                if (!value || !String(value).trim()) return t.errors.required;
                if (String(value).trim().length < 2) return t.errors.minLength?.replace('{min}', '2') || 'Минимум 2 символа';
                return undefined;
            case 'birthday':
                if (!value) return t.errors.required;
                return undefined;
            case 'gender':
                if (!value) return t.errors.required;
                return undefined;
            case 'email':
                if (!value || !String(value).trim()) return t.errors.required;
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value))) return t.errors.email;
                return undefined;
            case 'password':
                if (!value) return t.errors.required;
                if (String(value).length < 6) return t.errors.passwordMin;
                return undefined;
            case 'confirmPassword':
                if (!value) return t.errors.required;
                if (value !== formData.password) return t.errors.passwordMismatch;
                return undefined;
            case 'professionId':
                if (!value || value === '') return t.errors.required;
                return undefined;
            default:
                return undefined;
        }
    };

    const validateStep = (step: Step): boolean => {
        const errors: ValidationErrors = {};
        const fieldsToValidate: Record<Step, string[]> = {
            1: ['surname', 'name', 'birthday', 'gender'],
            2: ['email', 'password', 'confirmPassword'],
            3: [],
            4: ['professionId'],
            5: [],
        };

        fieldsToValidate[step].forEach((field) => {
            const value = formData[field as keyof FormData] as string | number;
            const error = validateField(field, value);
            if (error) {
                errors[field as keyof ValidationErrors] = error;
            }
        });

        setValidationErrors(errors);

        const touched: Record<string, boolean> = {};
        fieldsToValidate[step].forEach((field) => {
            touched[field] = true;
        });
        setTouchedFields((prev) => ({ ...prev, ...touched }));

        return Object.keys(errors).length === 0;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;

        console.log(`🔄 Изменение поля ${name}:`, value, 'тип:', typeof value);

        // Если это countryId - преобразуем в число
        if (name === 'countryId') {
            const newValue = value === '' ? '' : Number(value);
            console.log(`🔄 countryId преобразован:`, newValue, 'тип:', typeof newValue);
            setFormData((prev) => ({
                ...prev,
                countryId: newValue,
                cityId: '' // сбрасываем город
            }));
        } else {
            setFormData((prev) => ({ ...prev, [name]: value }));
        }

        if (touchedFields[name]) {
            const error = validateField(name, value);
            setValidationErrors((prev) => ({
                ...prev,
                [name]: error,
            }));
        }
    };
    const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setTouchedFields((prev) => ({ ...prev, [name]: true }));

        const error = validateField(name, value);
        setValidationErrors((prev) => ({
            ...prev,
            [name]: error,
        }));
    };

    const handleGenderChange = (value: 'M' | 'F') => {
        setFormData((prev) => ({ ...prev, gender: value }));
        setTouchedFields((prev) => ({ ...prev, gender: true }));

        const error = validateField('gender', value);
        setValidationErrors((prev) => ({
            ...prev,
            gender: error,
        }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setAvatarFile(file);
        }
    };

    const handleNext = () => {
        if (validateStep(currentStep)) {
            if (currentStep < 5) {
                setCurrentStep((prev) => (prev + 1) as Step);
                setValidationErrors({});
                setTouchedFields({});
            }
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep((prev) => (prev - 1) as Step);
            setValidationErrors({});
            setTouchedFields({});
        }
    };

    const handleSubmit = async () => {
        if (!validateStep(currentStep)) return;

        setLoading(true);
        setError(null);

        try {
            const data: CreateAuthorData = {
                email: formData.email,
                password: formData.password,
                name: formData.name,
                surname: formData.surname,
                gender: formData.gender as 'M' | 'F',
                date_birthday: formData.birthday,
                second_name: formData.secondName || undefined,
                biography: formData.biography || undefined,
                profession_id: Number(formData.professionId),
                country_id: formData.countryId ? Number(formData.countryId) : undefined,
                city_id: formData.cityId ? Number(formData.cityId) : undefined,
                avatar_path: avatarFile || null,
            };

            const result = await createAuthor(data);
            if (result) {
                await refetch();
                navigate('/profile');
            } else {
                setError('Ошибка при регистрации');
            }
        } catch (err) {
            setError('Произошла ошибка');
        } finally {
            setLoading(false);
        }
    };

    const renderStep = () => {
        switch (currentStep) {
            case 1:
                return (
                    <div className="register-author__step">
                        <h3 className="register-author__step-title">{t.step1.title}</h3>
                        <div className="register-author__form-group">
                            <label className="register-author__label">{t.step1.fields.surname}</label>
                            <input
                                type="text"
                                name="surname"
                                className={`register-author__input ${validationErrors.surname && touchedFields.surname ? 'register-author__input--error' : ''}`}
                                placeholder={t.step1.fields.surname}
                                value={formData.surname}
                                onChange={handleChange}
                                onBlur={handleBlur}
                            />
                            {validationErrors.surname && touchedFields.surname && (
                                <span className="register-author__error-text">{validationErrors.surname}</span>
                            )}
                        </div>
                        <div className="register-author__form-group">
                            <label className="register-author__label">{t.step1.fields.name}</label>
                            <input
                                type="text"
                                name="name"
                                className={`register-author__input ${validationErrors.name && touchedFields.name ? 'register-author__input--error' : ''}`}
                                placeholder={t.step1.fields.name}
                                value={formData.name}
                                onChange={handleChange}
                                onBlur={handleBlur}
                            />
                            {validationErrors.name && touchedFields.name && (
                                <span className="register-author__error-text">{validationErrors.name}</span>
                            )}
                        </div>
                        <div className="register-author__form-group">
                            <label className="register-author__label">{t.step1.fields.secondName}</label>
                            <input
                                type="text"
                                name="secondName"
                                className="register-author__input"
                                placeholder={t.step1.fields.secondName}
                                value={formData.secondName}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="register-author__form-group">
                            <label className="register-author__label">{t.step1.fields.birthday}</label>
                            <input
                                type="date"
                                name="birthday"
                                className={`register-author__input ${validationErrors.birthday && touchedFields.birthday ? 'register-author__input--error' : ''}`}
                                value={formData.birthday}
                                onChange={handleChange}
                                onBlur={handleBlur}
                            />
                            {validationErrors.birthday && touchedFields.birthday && (
                                <span className="register-author__error-text">{validationErrors.birthday}</span>
                            )}
                        </div>
                        <div className="register-author__form-group">
                            <label className="register-author__label">{t.step2.fields.gender}</label>
                            <div className="register-author__gender-group">
                                <button
                                    type="button"
                                    className={`register-author__gender-btn ${formData.gender === 'M' ? 'register-author__gender-btn--active' : ''}`}
                                    onClick={() => handleGenderChange('M')}
                                >
                                    {t.step2.options.male}
                                </button>
                                <button
                                    type="button"
                                    className={`register-author__gender-btn ${formData.gender === 'F' ? 'register-author__gender-btn--active' : ''}`}
                                    onClick={() => handleGenderChange('F')}
                                >
                                    {t.step2.options.female}
                                </button>
                            </div>
                            {validationErrors.gender && touchedFields.gender && (
                                <span className="register-author__error-text">{validationErrors.gender}</span>
                            )}
                        </div>
                    </div>
                );
            case 2:
                return (
                    <div className="register-author__step">
                        <h3 className="register-author__step-title">{t.step2.title}</h3>
                        <div className="register-author__form-group">
                            <label className="register-author__label">{t.step2.fields.email}</label>
                            <input
                                type="email"
                                name="email"
                                className={`register-author__input ${validationErrors.email && touchedFields.email ? 'register-author__input--error' : ''}`}
                                placeholder={t.step2.fields.email}
                                value={formData.email}
                                onChange={handleChange}
                                onBlur={handleBlur}
                            />
                            {validationErrors.email && touchedFields.email && (
                                <span className="register-author__error-text">{validationErrors.email}</span>
                            )}
                        </div>
                        <div className="register-author__form-group">
                            <label className="register-author__label">{t.step2.fields.password}</label>
                            <input
                                type="password"
                                name="password"
                                className={`register-author__input ${validationErrors.password && touchedFields.password ? 'register-author__input--error' : ''}`}
                                placeholder={t.step2.fields.password}
                                value={formData.password}
                                onChange={handleChange}
                                onBlur={handleBlur}
                            />
                            {validationErrors.password && touchedFields.password && (
                                <span className="register-author__error-text">{validationErrors.password}</span>
                            )}
                        </div>
                        <div className="register-author__form-group">
                            <label className="register-author__label">{t.step2.fields.confirmPassword}</label>
                            <input
                                type="password"
                                name="confirmPassword"
                                className={`register-author__input ${validationErrors.confirmPassword && touchedFields.confirmPassword ? 'register-author__input--error' : ''}`}
                                placeholder={t.step2.fields.confirmPassword}
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                onBlur={handleBlur}
                            />
                            {validationErrors.confirmPassword && touchedFields.confirmPassword && (
                                <span className="register-author__error-text">{validationErrors.confirmPassword}</span>
                            )}
                        </div>
                    </div>
                );
            case 3:
                return (
                    <div className="register-author__step">
                        <h3 className="register-author__step-title">{t.step3.title}</h3>
                        <div className="register-author__upload">
                            <div className="register-author__upload-area">
                                <div className="register-author__upload-icon">📷</div>
                                <p className="register-author__upload-text">{t.step3.uploadText}</p>
                                <p className="register-author__upload-hint">{t.step3.uploadHint}</p>

                                {avatarFile ? (
                                    <div className="register-author__upload-preview">
                                        <img
                                            src={URL.createObjectURL(avatarFile)}
                                            alt="Preview"
                                            className="register-author__upload-preview-img"
                                        />
                                        <span className="register-author__upload-filename">{avatarFile.name}</span>
                                        <button
                                            className="register-author__upload-remove"
                                            onClick={() => setAvatarFile(null)}
                                            type="button"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ) : (
                                    <div className="register-author__upload-placeholder">
                                        <span className="register-author__upload-placeholder-icon">🖼️</span>
                                        <span className="register-author__upload-placeholder-text">Файл не выбран</span>
                                    </div>
                                )}

                                <div className="register-author__upload-actions">
                                    <input
                                        type="file"
                                        id="avatar"
                                        accept="image/png,image/jpeg"
                                        className="register-author__file-input"
                                        onChange={handleFileChange}
                                    />
                                    <label htmlFor="avatar" className="register-author__upload-btn">
                                        {avatarFile ? t.step3.changeBtn : t.step3.uploadBtn}
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 4:
                return (
                    <div className="register-author__step">
                        <h3 className="register-author__step-title">{t.step4.title}</h3>
                        <div className="register-author__form-group">
                            <label className="register-author__label">{t.step4.fields.country}</label>
                            <select
                                name="countryId"
                                className="register-author__input register-author__select"
                                value={formData.countryId}
                                onChange={handleChange}
                                disabled={loadingCountries}
                            >
                                <option value="">
                                    {loadingCountries ? 'Загрузка...' : t.step4.fields.country}
                                </option>
                                {countries.map((country) => (
                                    <option key={country.id} value={country.id}>
                                        {country.name}  {/* ← теперь просто name */}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="register-author__form-group">
                            <label className="register-author__label">{t.step4.fields.city}</label>
                            <select
                                name="cityId"
                                className="register-author__input register-author__select"
                                value={formData.cityId}
                                onChange={handleChange}
                                disabled={!formData.countryId || loadingCities}
                            >
                                <option value="">
                                    {!formData.countryId
                                        ? 'Сначала выберите страну'
                                        : loadingCities
                                            ? 'Загрузка...'
                                            : t.step4.fields.city}
                                </option>
                                {cities.map((city) => (
                                    <option key={city.id} value={city.id}>
                                        {city.name}  {/* ← теперь просто name */}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div style={{ padding: '8px', background: '#f0f0f0', marginBottom: '8px', fontSize: '12px' }}>
                            Страны: {countries.length} | Города: {cities.length} | Выбрана страна: {formData.countryId || 'нет'}
                        </div>
                        <div className="register-author__form-group">
                            <label className="register-author__label">{t.step4.fields.profession}</label>
                            <select
                                name="professionId"
                                className={`register-author__input register-author__select ${validationErrors.professionId && touchedFields.professionId ? 'register-author__input--error' : ''}`}
                                value={formData.professionId}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                disabled={loadingProfessions}
                            >
                                <option value="">{loadingProfessions ? 'Загрузка...' : t.step4.fields.profession}</option>
                                {professions.map((profession) => (
                                    <option key={profession.id} value={profession.id}>
                                        {profession.name}
                                    </option>
                                ))}
                            </select>
                            {validationErrors.professionId && touchedFields.professionId && (
                                <span className="register-author__error-text">{validationErrors.professionId}</span>
                            )}
                        </div>
                        <div className="register-author__step">
                            <h3 className="register-author__step-title">{t.step5.title}</h3>
                            <div className="register-author__form-group">
                                <label className="register-author__label">{t.step5.fields.biography}</label>
                                <textarea
                                    name="biography"
                                    className="register-author__textarea"
                                    placeholder={t.step5.fields.biography}
                                    rows={6}
                                    value={formData.biography}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="register-author">
            <div className="register-author__header">
                <h2 className="register-author__title">{t.title}</h2>
            </div>

            <div className="register-author__progress">
                <div className="register-author__step-indicators">
                    {[1, 2, 3, 4].map((step) => (
                        <div
                            key={step}
                            className={`register-author__step-dot ${step <= currentStep ? "register-author__step-dot--active" : ""}`}
                        />
                    ))}
                </div>
                <span className="register-author__step-counter">
                    {currentStep} / 4
                </span>
            </div>

            <div className="register-author__content">
                {error && <div className="register-author__error">{error}</div>}
                {renderStep()}
            </div>

            <div className="register-author__actions">
                {currentStep > 1 && (
                    <button
                        className="register-author__btn register-author__btn--secondary"
                        onClick={handleBack}
                        disabled={loading}
                    >
                        {t.buttons.back}
                    </button>
                )}
                {currentStep === 4 ? (
                    <button
                        className="register-author__btn register-author__btn--primary"
                        onClick={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? "..." : t.buttons.submit}
                    </button>
                ) : (
                    <button
                        className="register-author__btn register-author__btn--primary"
                        onClick={handleNext}
                        disabled={loading}
                    >
                        {t.buttons.next}
                    </button>
                )}
            </div>

            <div className="register-author__footer">
                <span className="register-author__footer-text">
                    {t.footer.text}
                </span>
                <Link to="/login" className="register-author__footer-link">
                    {t.footer.link}
                </Link>
            </div>
        </div>
    );
};

export default RegisterAuthor;