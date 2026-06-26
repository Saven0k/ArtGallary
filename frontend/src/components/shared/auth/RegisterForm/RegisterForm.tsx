// components/forms/RegisterForm.tsx
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLanguage } from "../../../../context/LanguageContext";
import { registerFormTranslations } from './lang';
import "./style.css";
import { register } from "../../../../api/auth/main.api";
import { useRegisterForm, type RegisterArtistData } from "./useRegisterForm";
import { getAllCities, type City } from "../../../../api/cities/main.api";
import { getAllCountries, type Country } from "../../../../api/contries/main.api";
import { createArtist } from "../../../../api/artists/main.api";

export const RegisterForm = () => {
    const navigate = useNavigate();
    const { language } = useLanguage();
    const lang = registerFormTranslations[language];
    
    const [isArtist, setIsArtist] = useState(false);
    const { formData, errors, handleInputChange, validateForm, setFormData } = useRegisterForm(isArtist);
    const [cities, setCities] = useState<City[] | null>(null);
    const [countries, setCountries] = useState<null | Country[]>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

    useEffect(() => {
        const loadData = async () => {
            try {
                const citiesRes = await getAllCities();
                const countriesRes = await getAllCountries();
                setCities(citiesRes);
                setCountries(countriesRes);
            } catch (error) {
                console.error("Failed to load cities/countries:", error);
            }
        }

        loadData();
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0] || null;

        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        } else {
            setAvatarPreview(null);
        }

        setFormData(prev => ({ ...prev, avatar_path: file }));
    };

    const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => {
            if (isArtist) {
                return { ...prev, [name]: value || null } as RegisterArtistData;
            }
            return prev;
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        try {
            if (isArtist) {
                const res = await createArtist(formData);
                if (!res) {
                    console.log('error');
                    return;
                }
            } else {
                const res = await register(formData);
                if (!res) {
                    console.log('e');
                    return;
                }
            }
            navigate("/login");
        } catch (error) {
            console.error("Registration failed:", error);
        }
    };

    const commonFields = [
        { name: "email", label: lang.commonFields.email, type: "email" },
        { name: "password", label: lang.commonFields.password, type: "password" },
        { name: "surname", label: lang.commonFields.surname, type: "text" },
        { name: "name", label: lang.commonFields.name, type: "text" },
        { name: "second_name", label: lang.commonFields.second_name, type: "text" },
        { name: "phone_number", label: lang.commonFields.phone_number, type: "tel" },
    ];

    const getArtistFieldValue = (fieldName: keyof RegisterArtistData): string => {
        if (!isArtist) return "";
        const artistData = formData as RegisterArtistData;
        const value = artistData[fieldName];
        return value?.toString() || "";
    };

    return (
        <form className="form" onSubmit={handleSubmit}>
            <h2 className="form__title">
                {isArtist ? lang.title.artist : lang.title.user}
            </h2>

            <div className="form__inputs">
                {commonFields.map(field => (
                    <div key={field.name} className="form__input-box">
                        <label className="form__label">{field.label}</label>
                        <input
                            type={field.type}
                            name={field.name}
                            value={formData[field.name as keyof typeof formData] as string || ""}
                            className={`form__input ${errors[field.name as keyof typeof errors] ? "form__input--error" : ""}`}
                            onChange={handleInputChange}
                        />
                        {errors[field.name as keyof typeof errors] && (
                            <span className="form__error">{errors[field.name as keyof typeof errors]}</span>
                        )}
                    </div>
                ))}

                {isArtist && (
                    <>
                        <div className="form__input-box form__input-box--full">
                            <label className="form__label">{lang.artistFields.avatar}</label>
                            <div className="form__avatar-container">
                                {avatarPreview && (
                                    <div className="form__avatar-preview">
                                        <img src={avatarPreview} alt="Avatar preview" />
                                        <button
                                            type="button"
                                            className="form__avatar-remove"
                                            onClick={() => {
                                                setAvatarPreview(null);
                                                setFormData(prev => ({ ...prev, avatar_path: null }) as RegisterArtistData);
                                            }}
                                        >
                                            ×
                                        </button>
                                    </div>
                                )}
                                <label className={`form__file-label ${avatarPreview ? 'form__file-label--has-preview' : ''}`}>
                                    <input
                                        type="file"
                                        name="avatar_path"
                                        accept="image/*"
                                        className="form__file-input"
                                        onChange={handleFileChange}
                                    />
                                    <span className="form__file-icon">📷</span>
                                    <span className="form__file-text">
                                        {avatarPreview ? lang.artistFields.changePhoto : lang.artistFields.selectPhoto}
                                    </span>
                                </label>
                            </div>
                        </div>

                        <div className="form__input-box">
                            <label className="form__label">{lang.artistFields.birthday}</label>
                            <input
                                type="date"
                                name="date_birthday"
                                value={getArtistFieldValue("date_birthday")}
                                className="form__input"
                                onChange={handleInputChange}
                            />
                        </div>

                        <div className="form__input-box">
                            <label className="form__label">{lang.artistFields.country}</label>
                            <div className="form__select-wrapper">
                                <select
                                    name="country_id"
                                    value={getArtistFieldValue("country_id")}
                                    className="form__select"
                                    onChange={handleSelectChange}
                                >
                                    <option value="">{lang.artistFields.selectCountry}</option>
                                    {countries?.map(country => (
                                        <option key={country.id} value={country.id}>
                                            {country.name}
                                        </option>
                                    ))}
                                </select>
                                <span className="form__select-arrow">▼</span>
                            </div>
                        </div>

                        <div className="form__input-box">
                            <label className="form__label">{lang.artistFields.city}</label>
                            <div className="form__select-wrapper">
                                <select
                                    name="city_id"
                                    value={getArtistFieldValue("city_id")}
                                    className="form__select"
                                    onChange={handleSelectChange}
                                >
                                    <option value="">{lang.artistFields.selectCity}</option>
                                    {cities?.map(city => (
                                        <option key={city.id} value={city.id}>
                                            {city.name}
                                        </option>
                                    ))}
                                </select>
                                <span className="form__select-arrow">▼</span>
                            </div>
                        </div>

                        <div className="form__input-box form__input-box--full">
                            <label className="form__label">{lang.artistFields.biography}</label>
                            <textarea
                                name="biography"
                                value={getArtistFieldValue("biography")}
                                className="form__input"
                                onChange={handleInputChange}
                                rows={4}
                                placeholder={lang.artistFields.biographyPlaceholder}
                            />
                        </div>
                    </>
                )}
            </div>

            <button type="submit" className="form__btn">
                {lang.buttons.register}
            </button>

            <button
                type="button"
                className="form__btn form__btn--secondary"
                onClick={() => {
                    setIsArtist(!isArtist);
                    setAvatarPreview(null);
                }}
            >
                {isArtist ? lang.buttons.registerAsUser : lang.buttons.registerAsArtist}
            </button>

            <Link className="form__link" to="/login">
                {lang.links.login}
            </Link>
        </form>
    );
};