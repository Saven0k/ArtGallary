import { useState, useEffect, useRef } from "react";
import { useLanguage } from "../../../../hooks/useLanguage";
import { useAuth } from "../../../../hooks/useAuth";
import {
    getUserById,
    updateUser,
    type UpdateUserData,
} from "../../../../api/users/main.api";
import {
    getAuthorById,
    updateAuthor,
    type UpdateAuthorData,
} from "../../../../api/authors/main.api";
import {
    getAllCountries,
    getCitiesByCountryCode,
    type CountrySuggestion,
    type CitySuggestion,
} from "../../../../api/location/main.api";
import {
    getAllProfessions,
    type Profession,
} from "../../../../api/professions/main.api";
import AvatarCropModal from "../../../layout/AvatarCropModal/AvatarCropModal";
import { usePersonalInfoTranslation } from "./lang";
import { useNavigate } from "react-router-dom";
import "./PersonalInfoSection.scss";

interface PersonalInfoProps {
    id: number;
    role: string;
}

interface FormData {
    name: string;
    surname: string;
    secondName: string;
    birthday: string;
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
    const navigate = useNavigate();
    const t = usePersonalInfoTranslation(language);
    const { refetch } = useAuth();
    const isAuthor = role === "author";

    const [formData, setFormData] = useState<FormData>({
        name: "",
        surname: "",
        secondName: "",
        birthday: "",
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

    const [countries, setCountries] = useState<CountrySuggestion[]>([]);
    const [cities, setCities] = useState<CitySuggestion[]>([]);
    const [professions, setProfessions] = useState<Profession[]>([]);
    const [loadingCountries, setLoadingCountries] = useState(false);
    const [loadingCities, setLoadingCities] = useState(false);
    const [loadingProfessions, setLoadingProfessions] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [cropSrc, setCropSrc] = useState<string | null>(null);
    const [avatarError, setAvatarError] = useState<string | null>(null);

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
                            countryId: author.country?.id || "",
                            cityId: author.city?.id || "",
                            professionId: author.authorProfile?.profession_id || "",
                            email: author.email || "",
                            about: author.authorProfile?.biography || "",
                        });
                        setAvatarPreview(author.authorProfile?.avatar_path || null);
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
                setError(t.common.errorLoading);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [id, role, language, isAuthor, t.common.errorLoading]);

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

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
    ) => {
        const { name, value } = e.target;

        if (name === "countryId") {
            setFormData((prev) => ({
                ...prev,
                countryId: value === "" ? "" : Number(value),
                cityId: "",
            }));
        } else if (name === "cityId" || name === "professionId") {
            setFormData((prev) => ({
                ...prev,
                [name]: value === "" ? "" : Number(value),
            }));
        } else {
            setFormData((prev) => ({ ...prev, [name]: value }));
        }

        setError(null);
        setSuccess(null);
    };

    const handleAvatarPick = () => fileInputRef.current?.click();

    const handleAvatarInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setAvatarError(null);

        if (!/^image\/(png|jpe?g)$/.test(file.type)) {
            setAvatarError(t.avatar.errors.format);
            e.target.value = "";
            return;
        }
        if (file.size > MAX_AVATAR_BYTES) {
            setAvatarError(
                t.avatar.errors.size.replace("{max}", String(MAX_AVATAR_SIZE_MB)),
            );
            e.target.value = "";
            return;
        }

        const reader = new FileReader();
        reader.onload = () => setCropSrc(reader.result as string);
        reader.onerror = () => setAvatarError(t.avatar.errors.read);
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
                    biography: formData.about || undefined,
                    profession_id: formData.professionId
                        ? Number(formData.professionId)
                        : undefined,
                    country_id: formData.countryId ? Number(formData.countryId) : null,
                    city_id: formData.cityId ? Number(formData.cityId) : null,
                    avatar_path: avatarFile ?? undefined,
                };

                const result = await updateAuthor(id, data);
                if (result) {
                    setSuccess(t.avatar.saved);
                    setAvatarFile(null);
                    if (result.authorProfile?.avatar_path) {
                        setAvatarPreview(result.authorProfile.avatar_path);
                    }
                    await refetch();
                } else {
                    setError(t.avatar.saveError);
                }
            } else {
                const data: UpdateUserData = {
                    name: formData.name,
                    surname: formData.surname,
                    second_name: formData.secondName || undefined,
                    date_birthday: formData.birthday,
                    country_id: formData.countryId ? Number(formData.countryId) : null,
                    city_id: formData.cityId ? Number(formData.cityId) : null,
                };

                const result = await updateUser(id, data);
                if (result) {
                    setSuccess(t.avatar.saved);
                    await refetch();
                } else {
                    setError(t.avatar.saveError);
                }
            }
        } catch (e) {
            console.error("Error saving profile:", e);
            setError(t.common.errorSaving);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <section className="personal-info">
                <div className="personal-info__loading">{t.common.loading}</div>
            </section>
        );
    }

    return (
        <section className="personal-info">
            <header className="personal-info__header">
                <h2 className="personal-info__title">{t.title}</h2>
                <p className="personal-info__subtitle">{t.subtitle}</p>
            </header>

            {isAuthor && (
                <div className="personal-info__avatar-block">
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
                            <span className="personal-info__avatar-label">
                                {t.avatar.label}
                            </span>
                            <div className="personal-info__avatar-buttons">
                                <button
                                    type="button"
                                    className="personal-info__avatar-btn"
                                    onClick={handleAvatarPick}
                                >
                                    {avatarPreview ? t.avatar.change : t.avatar.upload}
                                </button>
                                {avatarPreview && (
                                    <button
                                        type="button"
                                        className="personal-info__avatar-btn personal-info__avatar-btn--danger"
                                        onClick={handleAvatarRemove}
                                    >
                                        {t.avatar.remove}
                                    </button>
                                )}
                            </div>
                            <span className="personal-info__avatar-hint">
                                {t.avatar.hint}
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
                        <div className="personal-info__avatar-error">{avatarError}</div>
                    )}

                    {cropSrc && (
                        <AvatarCropModal
                            src={cropSrc}
                            title={t.avatar.cropTitle}
                            confirmLabel={t.avatar.cropConfirm}
                            cancelLabel={t.avatar.cropCancel}
                            onCancel={handleCropCancel}
                            onConfirm={handleCropConfirm}
                        />
                    )}
                </div>
            )}

            <form className="personal-info__form" onSubmit={handleSubmit}>
                {error && <div className="personal-info__error">{error}</div>}
                {success && <div className="personal-info__success">{success}</div>}

                <div className="personal-info__grid">
                    <div className="personal-info__field">
                        <label>{t.fields.surname}</label>
                        <input
                            type="text"
                            name="surname"
                            placeholder={t.placeholders.surname}
                            value={formData.surname}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="personal-info__field">
                        <label>{t.fields.name}</label>
                        <input
                            type="text"
                            name="name"
                            placeholder={t.placeholders.name}
                            value={formData.name}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="personal-info__field">
                        <label>{t.fields.secondName}</label>
                        <input
                            type="text"
                            name="secondName"
                            placeholder={t.placeholders.secondName}
                            value={formData.secondName}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="personal-info__field">
                        <label>{t.fields.birthday}</label>
                        <input
                            type="date"
                            name="birthday"
                            value={formData.birthday}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="personal-info__field">
                        <label>{t.fields.country}</label>
                        <select
                            name="countryId"
                            value={formData.countryId}
                            onChange={handleChange}
                            disabled={loadingCountries}
                        >
                            <option value="">
                                {loadingCountries ? t.common.loading : t.fields.country}
                            </option>
                            {countries.map((country) => (
                                <option key={country.id} value={country.id}>
                                    {country.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="personal-info__field">
                        <label>{t.fields.city}</label>
                        <select
                            name="cityId"
                            value={formData.cityId}
                            onChange={handleChange}
                            disabled={!formData.countryId || loadingCities}
                        >
                            <option value="">
                                {!formData.countryId
                                    ? t.common.selectCountryFirst
                                    : loadingCities
                                        ? t.common.loading
                                        : t.fields.city}
                            </option>
                            {cities.map((city) => (
                                <option key={city.id} value={city.id}>
                                    {city.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="personal-info__field">
                        <label>{t.fields.email}</label>
                        <button
                            type="button"
                            className="personal-info__readonly-btn"
                            onClick={() =>
                                navigate("/profile?section=settings", { replace: true })
                            }
                            title={t.emailHint}
                            aria-label={t.emailHint}
                        >
                            <span className="personal-info__readonly-value">
                                {formData.email || t.placeholders.email}
                            </span>
                        </button>
                    </div>

                    {isAuthor && (
                        <div className="personal-info__field">
                            <label>{t.fields.profession}</label>
                            <select
                                name="professionId"
                                value={formData.professionId}
                                onChange={handleChange}
                                disabled={loadingProfessions}
                            >
                                <option value="">
                                    {loadingProfessions
                                        ? t.common.loading
                                        : t.fields.profession}
                                </option>
                                {professions.map((profession) => (
                                    <option key={profession.id} value={profession.id}>
                                        {profession.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                {isAuthor && (
                    <div className="personal-info__field personal-info__field--wide">
                        <label>{t.fields.about}</label>
                        <textarea
                            name="about"
                            rows={6}
                            placeholder={t.placeholders.about}
                            value={formData.about}
                            onChange={handleChange}
                        />
                    </div>
                )}

                <button
                    className="personal-info__button"
                    type="submit"
                    disabled={saving}
                >
                    {saving ? t.common.saving : t.button}
                </button>
            </form>
        </section>
    );
};

export default PersonalInfo;