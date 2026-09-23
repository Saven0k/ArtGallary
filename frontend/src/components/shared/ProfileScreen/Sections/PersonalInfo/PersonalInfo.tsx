// src/pages/Profile/components/ProfileContent/PersonalInfo/PersonalInfo.tsx
import { useState, useEffect, useRef } from "react";
import { useLanguage } from "../../../../../hooks/useLanguage";
import { profileTranslations } from "../../lang";
import { useAuth } from "../../../../../hooks/useAuth";
import {
    getUserById,
    updateUser,
    type UpdateUserData,
} from "../../../../../api/users/main.api";
import {
    getAuthorById,
    updateAuthor,
    type UpdateAuthorData,
} from "../../../../../api/authors/main.api";
import {
    getAllCountries,
    getCitiesByCountryCode,
    type CountrySuggestion,
    type CitySuggestion,
} from "../../../../../api/location/main.api";
import {
    getAllProfessions,
    type Profession,
} from "../../../../../api/professions/main.api";
import AvatarCropModal from "../../../../layout/AvatarCropModal/AvatarCropModal";
import "./PersonalInfo.scss";

interface PersonalInfoProps {
    id: number;
    role: string;
}

interface FormData {
    name: string;
    surname: string;
    secondName: string;
    birthday: string;
    gender: "M" | "F" | "";
    countryId: number | "";
    cityId: number | "";
    professionId: number | "";
    email: string;
    about: string;
}

const MAX_AVATAR_SIZE_MB = 5;
const MAX_AVATAR_BYTES = MAX_AVATAR_SIZE_MB * 1024 * 1024;

const PersonalInfo = ({ id, role }: PersonalInfoProps) => {
    const { language } = useLanguage();
    const t = profileTranslations[language].personalInfo;
    const f = t.fields;
    const p = t.placeholders;
    const av = t.avatar;
    const { refetch } = useAuth();
    const isAuthor = role === "author";

    const [formData, setFormData] = useState<FormData>({
        name: "",
        surname: "",
        secondName: "",
        birthday: "",
        gender: "",
        countryId: "",
        cityId: "",
        professionId: "",
        email: "",
        about: "",
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Селекты
    const [countries, setCountries] = useState<CountrySuggestion[]>([]);
    const [cities, setCities] = useState<CitySuggestion[]>([]);
    const [professions, setProfessions] = useState<Profession[]>([]);
    const [loadingCountries, setLoadingCountries] = useState(false);
    const [loadingCities, setLoadingCities] = useState(false);
    const [loadingProfessions, setLoadingProfessions] = useState(false);

    // Аватар
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [cropSrc, setCropSrc] = useState<string | null>(null);
    const [avatarError, setAvatarError] = useState<string | null>(null);

    // ============================ ЗАГРУЗКА ПРОФИЛЯ ============================
    useEffect(() => {
        const fetchProfile = async () => {
            if (!id) return;
            setLoading(true);
            setError(null);

            try {
                if (isAuthor) {
                    const author = await getAuthorById(id, language);
                    if (author) {
                        setFormData({
                            name: author.name || "",
                            surname: author.surname || "",
                            secondName: author.second_name || "",
                            birthday: author.date_birthday
                                ? author.date_birthday.split("T")[0]
                                : "",
                            gender: author.gender || "",
                            countryId: author.country?.id || "",
                            cityId: author.city?.id || "",
                            professionId:
                                author.authorProfile?.profession_id || "",
                            email: author.email || "",
                            about: author.authorProfile?.biography || "",
                        });
                        setAvatarPreview(
                            author.authorProfile?.avatar_path || null,
                        );
                    }
                } else {
                    const user = await getUserById(id);
                    if (user) {
                        setFormData({
                            name: user.name || "",
                            surname: user.surname || "",
                            secondName: user.second_name || "",
                            birthday: user.date_birthday
                                ? user.date_birthday.split("T")[0]
                                : "",
                            gender: user.gender || "",
                            countryId: user.country_id || "",
                            cityId: user.city_id || "",
                            professionId: "",
                            email: user.email || "",
                            about: "",
                        });
                    }
                }
            } catch (e) {
                console.error("Error loading profile:", e);
                setError("Ошибка при загрузке профиля");
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [id, role, language, isAuthor]);

    // ============================ СТРАНЫ ============================
    useEffect(() => {
        const fetchCountries = async () => {
            setLoadingCountries(true);
            try {
                const data = await getAllCountries(
                    language === "ru" ? "ru" : "en",
                );
                setCountries(data || []);
            } catch (e) {
                console.error("Error loading countries:", e);
            } finally {
                setLoadingCountries(false);
            }
        };

        fetchCountries();
    }, [language]);

    // ============================ ПРОФЕССИИ ============================
    useEffect(() => {
        if (!isAuthor) return;

        const fetchProfessions = async () => {
            setLoadingProfessions(true);
            try {
                const data = await getAllProfessions();
                setProfessions(data || []);
            } catch (e) {
                console.error("Error loading professions:", e);
            } finally {
                setLoadingProfessions(false);
            }
        };

        fetchProfessions();
    }, [isAuthor]);

    // ============================ ГОРОДА ============================
    useEffect(() => {
        const fetchCities = async () => {
            if (!formData.countryId) {
                setCities([]);
                return;
            }

            setLoadingCities(true);
            try {
                const country = countries.find(
                    (c) => c.id === formData.countryId,
                );
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

    // ============================ ОБРАБОТЧИКИ ФОРМЫ ============================
    const handleChange = (
        e: React.ChangeEvent<
            HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
        >,
    ) => {
        const { name, value } = e.target;

        if (name === "countryId") {
            const newValue = value === "" ? "" : Number(value);
            setFormData((prev) => ({
                ...prev,
                countryId: newValue,
                cityId: "",
            }));
        } else if (name === "cityId" || name === "professionId") {
            const newValue = value === "" ? "" : Number(value);
            setFormData((prev) => ({ ...prev, [name]: newValue }));
        } else {
            setFormData((prev) => ({ ...prev, [name]: value }));
        }

        setError(null);
        setSuccess(null);
    };

    const handleGenderChange = (value: "M" | "F") => {
        setFormData((prev) => ({ ...prev, gender: value }));
    };

    // ============================ АВАТАР ============================
    const handleAvatarPick = () => fileInputRef.current?.click();

    const handleAvatarInputChange = (
        e: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setAvatarError(null);

        if (!/^image\/(png|jpe?g)$/.test(file.type)) {
            setAvatarError(av.errors?.format ?? "Только PNG или JPG");
            e.target.value = "";
            return;
        }
        if (file.size > MAX_AVATAR_BYTES) {
            setAvatarError(
                av.errors?.size?.replace("{max}", String(MAX_AVATAR_SIZE_MB)) ??
                    `Файл больше ${MAX_AVATAR_SIZE_MB} МБ`,
            );
            e.target.value = "";
            return;
        }

        const reader = new FileReader();
        reader.onload = () => setCropSrc(reader.result as string);
        reader.onerror = () => setAvatarError(av.errors?.read ?? "Ошибка чтения файла");
        reader.readAsDataURL(file);

        e.target.value = "";
    };

    const handleCropConfirm = (file: File) => {
        if (avatarPreview && avatarPreview.startsWith("blob:")) {
            URL.revokeObjectURL(avatarPreview);
        }
        setAvatarFile(file);
        setAvatarPreview(URL.createObjectURL(file));
        setCropSrc(null);
    };

    const handleCropCancel = () => setCropSrc(null);

    const handleAvatarRemove = () => {
        if (avatarPreview && avatarPreview.startsWith("blob:")) {
            URL.revokeObjectURL(avatarPreview);
        }
        setAvatarFile(null);
        setAvatarPreview(null);
        setAvatarError(null);
    };

    // ============================ SUBMIT ============================
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        setSuccess(null);

        try {
            if (isAuthor) {
                const data: UpdateAuthorData = {
                    name: formData.name,
                    surname: formData.surname,
                    second_name: formData.secondName || undefined,
                    date_birthday: formData.birthday,
                    gender: formData.gender as "M" | "F",
                    biography: formData.about || undefined,
                    profession_id: formData.professionId
                        ? Number(formData.professionId)
                        : undefined,
                    country_id: formData.countryId
                        ? Number(formData.countryId)
                        : null,
                    city_id: formData.cityId
                        ? Number(formData.cityId)
                        : null,
                    avatar_path: avatarFile ?? undefined,
                };

                const result = await updateAuthor(id, data);
                if (result) {
                    setSuccess(av.saved ?? "Данные успешно сохранены");
                    setAvatarFile(null);
                    if (result.authorProfile?.avatar_path) {
                        setAvatarPreview(result.authorProfile.avatar_path);
                    }
                    await refetch();
                } else {
                    setError(av.saveError ?? "Ошибка при сохранении");
                }
            } else {
                const data: UpdateUserData = {
                    name: formData.name,
                    surname: formData.surname,
                    second_name: formData.secondName || undefined,
                    date_birthday: formData.birthday,
                    gender: formData.gender as "M" | "F",
                    country_id: formData.countryId
                        ? Number(formData.countryId)
                        : null,
                    city_id: formData.cityId
                        ? Number(formData.cityId)
                        : null,
                };

                const result = await updateUser(id, data);
                if (result) {
                    setSuccess(av.saved ?? "Данные успешно сохранены");
                    await refetch();
                } else {
                    setError(av.saveError ?? "Ошибка при сохранении");
                }
            }
        } catch (e) {
            console.error("Error saving profile:", e);
            setError("Произошла ошибка при сохранении");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <section className="personal-info">
                <div className="personal-info__loading">Загрузка...</div>
            </section>
        );
    }

    return (
        <section className="personal-info">
            <header className="personal-info__header">
                <h2 className="personal-info__title">{t.title}</h2>
                <p className="personal-info__subtitle">{t.subtitle}</p>
            </header>

            <form className="personal-info__form" onSubmit={handleSubmit}>
                {error && <div className="personal-info__error">{error}</div>}
                {success && (
                    <div className="personal-info__success">{success}</div>
                )}

                <div className="personal-info__grid">
                    <div className="personal-info__field">
                        <label>{f.name}</label>
                        <input
                            type="text"
                            name="name"
                            placeholder={p.name}
                            value={formData.name}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="personal-info__field">
                        <label>{f.surname}</label>
                        <input
                            type="text"
                            name="surname"
                            placeholder={p.surname}
                            value={formData.surname}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="personal-info__field">
                        <label>{f.secondName}</label>
                        <input
                            type="text"
                            name="secondName"
                            placeholder={p.secondName}
                            value={formData.secondName}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="personal-info__field">
                        <label>{f.birthday}</label>
                        <input
                            type="date"
                            name="birthday"
                            value={formData.birthday}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="personal-info__field">
                        <label>{f.gender || "Пол"}</label>
                        <div className="personal-info__gender-group">
                            <button
                                type="button"
                                className={`personal-info__gender-btn ${
                                    formData.gender === "M"
                                        ? "personal-info__gender-btn--active"
                                        : ""
                                }`}
                                onClick={() => handleGenderChange("M")}
                            >
                                {t.gender?.male ?? "Мужской"}
                            </button>
                            <button
                                type="button"
                                className={`personal-info__gender-btn ${
                                    formData.gender === "F"
                                        ? "personal-info__gender-btn--active"
                                        : ""
                                }`}
                                onClick={() => handleGenderChange("F")}
                            >
                                {t.gender?.female ?? "Женский"}
                            </button>
                        </div>
                    </div>

                    <div className="personal-info__field">
                        <label>{f.country}</label>
                        <select
                            name="countryId"
                            value={formData.countryId}
                            onChange={handleChange}
                            disabled={loadingCountries}
                        >
                            <option value="">
                                {loadingCountries
                                    ? t.common?.loading ?? "Загрузка..."
                                    : f.country}
                            </option>
                            {countries.map((country) => (
                                <option key={country.id} value={country.id}>
                                    {country.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="personal-info__field">
                        <label>{f.city}</label>
                        <select
                            name="cityId"
                            value={formData.cityId}
                            onChange={handleChange}
                            disabled={!formData.countryId || loadingCities}
                        >
                            <option value="">
                                {!formData.countryId
                                    ? t.common?.selectCountryFirst ??
                                      "Сначала выберите страну"
                                    : loadingCities
                                      ? t.common?.loading ?? "Загрузка..."
                                      : f.city}
                            </option>
                            {cities.map((city) => (
                                <option key={city.id} value={city.id}>
                                    {city.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="personal-info__field">
                        <label>{f.email}</label>
                        <input
                            type="email"
                            name="email"
                            placeholder={p.email}
                            value={formData.email}
                            disabled
                        />
                    </div>

                    {isAuthor && (
                        <div className="personal-info__field">
                            <label>{f.profession || "Профессия"}</label>
                            <select
                                name="professionId"
                                value={formData.professionId}
                                onChange={handleChange}
                                disabled={loadingProfessions}
                            >
                                <option value="">
                                    {loadingProfessions
                                        ? t.common?.loading ?? "Загрузка..."
                                        : f.profession || "Профессия"}
                                </option>
                                {professions.map((profession) => (
                                    <option
                                        key={profession.id}
                                        value={profession.id}
                                    >
                                        {profession.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                {isAuthor && (
                    <div className="personal-info__field">
                        <label>{f.about}</label>
                        <textarea
                            name="about"
                            rows={6}
                            placeholder={p.about}
                            value={formData.about}
                            onChange={handleChange}
                        />
                    </div>
                )}

                {/* ===================== AVATAR ===================== */}
                {isAuthor && (
                    <div className="personal-info__avatar-block">
                        <label className="personal-info__avatar-label">
                            {av.label ?? "Фото профиля"}
                        </label>

                        <div className="personal-info__avatar-row">
                            <div className="personal-info__avatar-preview">
                                {avatarPreview ? (
                                    <img src={avatarPreview} alt="avatar" />
                                ) : (
                                    <div className="personal-info__avatar-placeholder">
                                        {(formData.name?.[0] ||
                                            formData.surname?.[0] ||
                                            "?")?.toUpperCase()}
                                    </div>
                                )}
                            </div>

                            <div className="personal-info__avatar-actions">
                                <button
                                    type="button"
                                    className="personal-info__avatar-btn"
                                    onClick={handleAvatarPick}
                                >
                                    {avatarPreview
                                        ? av.change ?? "Изменить фото"
                                        : av.upload ?? "Загрузить фото"}
                                </button>

                                {avatarPreview && (
                                    <button
                                        type="button"
                                        className="personal-info__avatar-btn personal-info__avatar-btn--danger"
                                        onClick={handleAvatarRemove}
                                    >
                                        {av.remove ?? "Удалить"}
                                    </button>
                                )}

                                <span className="personal-info__avatar-hint">
                                    {av.hint ??
                                        "JPG, PNG, до 5 МБ. Можно обрезать перед загрузкой."}
                                </span>
                            </div>
                        </div>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/png,image/jpeg"
                            hidden
                            onChange={handleAvatarInputChange}
                        />

                        {avatarError && (
                            <div className="personal-info__avatar-error">
                                {avatarError}
                            </div>
                        )}

                        {cropSrc && (
                            <AvatarCropModal
                                src={cropSrc}
                                title={av.cropTitle ?? "Обрезать фото"}
                                confirmLabel={av.cropConfirm ?? "Сохранить"}
                                cancelLabel={av.cropCancel ?? "Отмена"}
                                onCancel={handleCropCancel}
                                onConfirm={handleCropConfirm}
                            />
                        )}
                    </div>
                )}

                <button
                    className="personal-info__button"
                    type="submit"
                    disabled={saving}
                >
                    {saving
                        ? t.common?.saving ?? "Сохранение..."
                        : t.button}
                </button>
            </form>
        </section>
    );
};

export default PersonalInfo;