import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useLanguage } from "../../../../hooks/useLanguage";
import { registerFormTranslations } from './lang';
import "./style.css";
import { register } from "../../../../api/auth/main.api";
import { useRegisterForm, type RegisterArtistData, type RegisterUserData, type FormDataType } from "./useRegisterForm";
import { createArtist } from "../../../../api/artists/main.api";
import { LocationSelect } from "../../../layout/LocationSelect/LocationSelect";

export const RegisterForm = () => {
    const navigate = useNavigate();
    const { language } = useLanguage();
    const lang = registerFormTranslations[language];
    
    const [isArtist, setIsArtist] = useState(false);
    const { formData, errors, handleInputChange, validateForm, setFormData, setErrors } = useRegisterForm(isArtist);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

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

    const handleGenderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value as "M" | "F";
        setFormData(prev => ({ ...prev, gender: value }));
        if (errors.gender) {
            setErrors(prev => ({ ...prev, gender: "" }));
        }
    };

    // Backend expects integer IDs for country_id and city_id
    const handleCountrySelect = (_iso2: string, _name: string, countryId: number | string) => {
        if (!isArtist) return;
        
        const artistData = formData as RegisterArtistData;
        const parsedId = typeof countryId === 'number' ? countryId : Number(countryId) || null;
        setFormData({
            ...artistData,
            country_id: parsedId,
            city_id: null,
        });
    };

    // cityId теперь может приходить как string (от LocationSelect) — конвертируем в number
    const handleCitySelect = (cityId: number | null, _cityName: string) => {
        if (!isArtist) return;
        
        const artistData = formData as RegisterArtistData;
        setFormData({
            ...artistData,
            city_id: cityId,
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        try {
            if (isArtist) {
                const artistData = formData as RegisterArtistData;
                const res = await createArtist({
                    email: artistData.email,
                    password: artistData.password,
                    name: artistData.name,
                    surname: artistData.surname,
                    second_name: artistData.second_name || '',
                    phone_number: artistData.phone_number,
                    avatar_path: artistData.avatar_path as any || null,
                    date_birthday: artistData.date_birthday as any || null,
                    biography: artistData.biography || null,
                    gender: artistData.gender || "M",
                    country_id: (artistData as any).country_id || null,
                    city_id: (artistData as any).city_id || null,
                });
                if (!res) {
                    console.log('error');
                    return;
                }
            } else {
                const userData = formData as RegisterUserData;
                const res = await register({
                    ...userData,
                    gender: userData.gender || "M",
                });
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

    const getArtistValue = (field: keyof RegisterArtistData): string | number | null => {
        if (!isArtist) return '';
        const data = formData as RegisterArtistData;
        const val = data[field];
        return val != null ? String(val) : null;
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
                            value={formData[field.name as keyof FormDataType] as string || ""}
                            className={`form__input ${errors[field.name as keyof typeof errors] ? "form__input--error" : ""}`}
                            onChange={handleInputChange}
                        />
                        {errors[field.name as keyof typeof errors] && (
                            <span className="form__error">{errors[field.name as keyof typeof errors]}</span>
                        )}
                    </div>
                ))}

                {/* ✅ Поле выбора пола */}
                <div className="form__input-box">
                    <label className="form__label">{lang.commonFields.gender}</label>
                    <div className="form__select-wrapper">
                        <select
                            name="gender"
                            value={formData.gender || "M"}
                            className={`form__select ${errors.gender ? "form__select--error" : ""}`}
                            onChange={handleGenderChange}
                        >
                            <option value="M">{lang.commonFields.male}</option>
                            <option value="F">{lang.commonFields.female}</option>
                        </select>
                        <span className="form__select-arrow">▼</span>
                    </div>
                    {errors.gender && (
                        <span className="form__error">{errors.gender}</span>
                    )}
                </div>

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
                                                setFormData(prev => ({ ...prev, avatar_path: null }));
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
                                value={getArtistValue("date_birthday") || ""}
                                className="form__input"
                                onChange={handleInputChange}
                            />
                            {errors.date_birthday && (
                                <span className="form__error">{errors.date_birthday}</span>
                            )}
                        </div>

                        <div className="form__input-box form__input-box--full">
                            <label className="form__label">{lang.artistFields.location}</label>
                            <LocationSelect
                                countryValue={getArtistValue("country_id") as string | number | undefined}
                                cityValue={getArtistValue("city_id") as number | undefined}
                                onCountryChange={handleCountrySelect}
                                onCityChange={handleCitySelect}
                                isEditing={true}
                                lang={language}
                            />
                        </div>

                        <div className="form__input-box form__input-box--full">
                            <label className="form__label">{lang.artistFields.biography}</label>
                            <textarea
                                name="biography"
                                value={getArtistValue("biography") || ""}
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
                    if (!isArtist) {
                        setFormData({
                            email: "",
                            password: "",
                            name: "",
                            surname: "",
                            second_name: "",
                            phone_number: "",
                            avatar_path: null,
                            gender: "M",
                            date_birthday: null,
                            biography: null,
                            city_id: null,
                            country_id: null,
                            moderate: false,
                            role: "artist",
                        } as RegisterArtistData);
                    } else {
                        setFormData({
                            email: "",
                            password: "",
                            name: "",
                            surname: "",
                            second_name: "",
                            phone_number: "",
                            avatar_path: null,
                            gender: "M",
                            role: "user",
                        } as RegisterUserData);
                    }
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
