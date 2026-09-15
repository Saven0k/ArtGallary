// PersonalInfo.tsx
import { useState, useEffect } from "react";
import { useLanguage } from "../../../../../hooks/useLanguage";
import { profileTranslations } from "../../lang";
import { useAuth } from "../../../../../hooks/useAuth";
import { getUserById, updateUser, type UpdateUserData } from "../../../../../api/users/main.api";
import { getAuthorById, updateAuthor, type UpdateAuthorData } from "../../../../../api/authors/main.api";
import { getAllCountries, getCitiesByCountryCode, type CountrySuggestion, type CitySuggestion } from "../../../../../api/location/main.api";
import { getAllProfessions, type Profession } from "../../../../../api/professions/main.api";
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
    gender: 'M' | 'F' | '';
    countryId: number | '';
    cityId: number | '';
    professionId: number | '';
    email: string;
    about: string;
}

const PersonalInfo = ({ id, role }: PersonalInfoProps) => {
    const { language } = useLanguage();
    const t = profileTranslations[language].personalInfo;
    const f = t.fields;
    const p = t.placeholders;
    const { refetch } = useAuth();
    const isAuthor = role === 'author';

    const [formData, setFormData] = useState<FormData>({
        name: '',
        surname: '',
        secondName: '',
        birthday: '',
        gender: '',
        countryId: '',
        cityId: '',
        professionId: '',
        email: '',
        about: '',
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Данные для селектов
    const [countries, setCountries] = useState<CountrySuggestion[]>([]);
    const [cities, setCities] = useState<CitySuggestion[]>([]);
    const [professions, setProfessions] = useState<Profession[]>([]);
    const [loadingCountries, setLoadingCountries] = useState(false);
    const [loadingCities, setLoadingCities] = useState(false);
    const [loadingProfessions, setLoadingProfessions] = useState(false);

    // Загрузка данных профиля
    useEffect(() => {
        const fetchProfile = async () => {
            if (!id) return;
            setLoading(true);
            setError(null);

            try {
                if (isAuthor) {
                    // Загружаем данные автора
                    const author = await getAuthorById(id, language);
                    console.log('Author data:', author);

                    if (author) {
                        setFormData({
                            name: author.name || '',
                            surname: author.surname || '',
                            secondName: author.second_name || '',
                            birthday: author.date_birthday ? author.date_birthday.split('T')[0] : '',
                            gender: author.gender || '',
                            countryId: author.country?.id || '',
                            cityId: author.city?.id || '',
                            professionId: author.authorProfile?.profession_id || '',
                            email: author.email || '',
                            about: author.authorProfile?.biography || '',
                        });
                    }
                } else {
                    // Загружаем данные обычного пользователя
                    const user = await getUserById(id);
                    console.log('User data:', user);

                    if (user) {
                        setFormData({
                            name: user.name || '',
                            surname: user.surname || '',
                            secondName: user.second_name || '',
                            birthday: user.date_birthday ? user.date_birthday.split('T')[0] : '',
                            gender: user.gender || '',
                            countryId: user.country_id || '',
                            cityId: user.city_id || '',
                            professionId: '',
                            email: user.email || '',
                            about: '', // у обычного пользователя нет биографии
                        });
                    }
                }
            } catch (e) {
                console.error('Error loading profile:', e);
                setError('Ошибка при загрузке профиля');
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [id, role, language, isAuthor]);

    // Загрузка стран
    useEffect(() => {
        const fetchCountries = async () => {
            setLoadingCountries(true);
            try {
                const data = await getAllCountries(language === 'ru' ? 'ru' : 'en');
                setCountries(data || []);
            } catch (e) {
                console.error('Error loading countries:', e);
            } finally {
                setLoadingCountries(false);
            }
        };

        fetchCountries();
    }, [language]);

    // Загрузка профессий (только для авторов)
    useEffect(() => {
        if (!isAuthor) return;

        const fetchProfessions = async () => {
            setLoadingProfessions(true);
            try {
                const data = await getAllProfessions();
                setProfessions(data || []);
            } catch (e) {
                console.error('Error loading professions:', e);
            } finally {
                setLoadingProfessions(false);
            }
        };

        fetchProfessions();
    }, [isAuthor]);

    // Загрузка городов при выборе страны
    useEffect(() => {
        const fetchCities = async () => {
            if (!formData.countryId) {
                setCities([]);
                return;
            }

            setLoadingCities(true);
            try {
                const country = countries.find(c => c.id === formData.countryId);
                if (country) {
                    const data = await getCitiesByCountryCode(
                        country.iso2,
                        language === 'ru' ? 'ru' : 'en'
                    );
                    setCities(data || []);
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

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;

        if (name === 'countryId') {
            const newValue = value === '' ? '' : Number(value);
            setFormData((prev) => ({
                ...prev,
                countryId: newValue,
                cityId: ''
            }));
        } else if (name === 'cityId' || name === 'professionId') {
            const newValue = value === '' ? '' : Number(value);
            setFormData((prev) => ({ ...prev, [name]: newValue }));
        } else {
            setFormData((prev) => ({ ...prev, [name]: value }));
        }

        setError(null);
        setSuccess(null);
    };

    const handleGenderChange = (value: 'M' | 'F') => {
        setFormData((prev) => ({ ...prev, gender: value }));
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
                    gender: formData.gender as 'M' | 'F',
                    biography: formData.about || undefined, // только для авторов
                    profession_id: formData.professionId ? Number(formData.professionId) : undefined,
                    country_id: formData.countryId ? Number(formData.countryId) : null,
                    city_id: formData.cityId ? Number(formData.cityId) : null,
                };

                const result = await updateAuthor(id, data);
                if (result) {
                    setSuccess('Данные успешно сохранены');
                    await refetch();
                } else {
                    setError('Ошибка при сохранении');
                }
            } else {
                const data: UpdateUserData = {
                    name: formData.name,
                    surname: formData.surname,
                    second_name: formData.secondName || undefined,
                    date_birthday: formData.birthday,
                    gender: formData.gender as 'M' | 'F',
                    country_id: formData.countryId ? Number(formData.countryId) : null,
                    city_id: formData.cityId ? Number(formData.cityId) : null,
                };

                const result = await updateUser(id, data);
                if (result) {
                    setSuccess('Данные успешно сохранены');
                    await refetch();
                } else {
                    setError('Ошибка при сохранении');
                }
            }
        } catch (e) {
            console.error('Error saving profile:', e);
            setError('Произошла ошибка при сохранении');
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
                {success && <div className="personal-info__success">{success}</div>}

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

                    {/* Пол */}
                    <div className="personal-info__field">
                        <label>{f.gender || 'Пол'}</label>
                        <div className="personal-info__gender-group">
                            <button
                                type="button"
                                className={`personal-info__gender-btn ${formData.gender === 'M' ? 'personal-info__gender-btn--active' : ''}`}
                                onClick={() => handleGenderChange('M')}
                            >
                                Мужской
                            </button>
                            <button
                                type="button"
                                className={`personal-info__gender-btn ${formData.gender === 'F' ? 'personal-info__gender-btn--active' : ''}`}
                                onClick={() => handleGenderChange('F')}
                            >
                                Женский
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
                                {loadingCountries ? 'Загрузка...' : f.country}
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
                                    ? 'Сначала выберите страну'
                                    : loadingCities
                                        ? 'Загрузка...'
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

                    {/* Профессия — только для авторов */}
                    {isAuthor && (
                        <div className="personal-info__field">
                            <label>{f.profession || 'Профессия'}</label>
                            <select
                                name="professionId"
                                value={formData.professionId}
                                onChange={handleChange}
                                disabled={loadingProfessions}
                            >
                                <option value="">
                                    {loadingProfessions ? 'Загрузка...' : (f.profession || 'Профессия')}
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

                {/* Биография — только для авторов */}
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

                <button
                    className="personal-info__button"
                    type="submit"
                    disabled={saving}
                >
                    {saving ? 'Сохранение...' : t.button}
                </button>
            </form>
        </section>
    );
};

export default PersonalInfo;