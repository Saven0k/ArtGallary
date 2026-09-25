// src/components/shared/Admin/sections/Users/UserFormModal.tsx
import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useLanguage } from '../../../../../hooks/useLanguage';
import { adminTranslations } from '../../../../../pages/admin/lang';
import {
    getAllCountries,
    getCitiesByCountryCode,
    type CountrySuggestion,
    type CitySuggestion,
} from '../../../../../api/location/main.api';
import type {
    User,
    CreateUserData,
    UpdateUserData,
    Gender,
} from '../../../../../api/users/main.api';
import { usersTranslations } from './lang';

interface UserFormModalProps {
    mode: 'create' | 'edit';
    user?: User;
    busy: boolean;
    onClose: () => void;
    onSubmit: (data: CreateUserData | UpdateUserData) => void;
}

interface FormState {
    name: string;
    surname: string;
    secondName: string;
    email: string;
    password: string;
    birthday: string;
    gender: Gender | '';
    countryId: number | '';
    cityId: number | '';
}

const UserFormModal = ({ mode, user, busy, onClose, onSubmit }: UserFormModalProps) => {
    const { language } = useLanguage();
    const t = usersTranslations[language];
    const common = adminTranslations[language].common;

    const [form, setForm] = useState<FormState>({
        name: user?.name ?? '',
        surname: user?.surname ?? '',
        secondName: user?.second_name ?? '',
        email: user?.email ?? '',
        password: '',
        birthday: user?.date_birthday?.split('T')[0] ?? '',
        gender: (user?.gender as Gender) ?? '',
        countryId: user?.country_id ?? '',
        cityId: user?.city_id ?? '',
    });

    const [countries, setCountries] = useState<CountrySuggestion[]>([]);
    const [cities, setCities] = useState<CitySuggestion[]>([]);
    const [loadingCountries, setLoadingCountries] = useState(false);
    const [loadingCities, setLoadingCities] = useState(false);

    const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

    // ---------- dictionaries ----------
    useEffect(() => {
        (async () => {
            setLoadingCountries(true);
            const data = await getAllCountries(language === 'ru' ? 'ru' : 'en');
            setCountries(data || []);
            setLoadingCountries(false);
        })();
    }, [language]);

    useEffect(() => {
        (async () => {
            if (!form.countryId) {
                setCities([]);
                return;
            }
            setLoadingCities(true);
            const country = countries.find((c) => c.id === form.countryId);
            if (country) {
                const data = await getCitiesByCountryCode(
                    country.iso2,
                    language === 'ru' ? 'ru' : 'en',
                );
                setCities(data || []);
            }
            setLoadingCities(false);
        })();
    }, [form.countryId, countries, language]);

    // ---------- handlers ----------
    const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
        setForm((prev) => ({ ...prev, [key]: value }));
        setErrors((prev) => ({ ...prev, [key]: undefined }));
    };

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    ) => {
        const { name, value } = e.target;
        if (name === 'countryId') {
            setField('countryId', value ? Number(value) : '');
            setField('cityId', '');
        } else if (name === 'cityId') {
            setField('cityId', value ? Number(value) : '');
        } else {
            setField(name as keyof FormState, value as any);
        }
    };

    // ---------- validation ----------
    const validate = (): boolean => {
        const e: Partial<Record<keyof FormState, string>> = {};

        if (!form.name.trim()) e.name = t.form.errors.required;
        if (!form.surname.trim()) e.surname = t.form.errors.required;
        if (!form.email.trim()) e.email = t.form.errors.required;
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
            e.email = t.form.errors.email;
        if (!form.birthday) e.birthday = t.form.errors.required;
        if (!form.gender) e.gender = t.form.errors.required;

        if (mode === 'create') {
            if (!form.password) e.password = t.form.errors.required;
            else if (form.password.length < 6) e.password = t.form.errors.passwordMin;
            else if (form.password.length > 25) e.password = t.form.errors.passwordMax;
        } else if (form.password) {
            if (form.password.length < 6) e.password = t.form.errors.passwordMin;
            else if (form.password.length > 25) e.password = t.form.errors.passwordMax;
        }

        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = () => {
        if (!validate()) return;

        const base: CreateUserData | UpdateUserData = {
            email: form.email,
            name: form.name,
            surname: form.surname,
            second_name: form.secondName || undefined,
            date_birthday: form.birthday,
            gender: form.gender as Gender,
            country_id: form.countryId ? Number(form.countryId) : null,
            city_id: form.cityId ? Number(form.cityId) : null,
        };

        if (form.password) {
            (base as CreateUserData).password = form.password;
        } else if (mode === 'create') {
            (base as CreateUserData).password = '';
        }

        onSubmit(base);
    };

    return (
        <div className="user-form-overlay" onClick={onClose}>
            <div
                className="user-form"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
            >
                <header className="user-form__header">
                    <h3>{mode === 'create' ? t.form.titleCreate : t.form.titleEdit}</h3>
                    <button type="button" onClick={onClose}>
                        <X size={20} />
                    </button>
                </header>

                <div className="user-form__body">
                    <div className="user-form__row">
                        <label className="user-form__field">
                            {t.form.fields.surname}
                            <input
                                name="surname"
                                value={form.surname}
                                onChange={handleChange}
                                placeholder={t.form.placeholders.surname}
                            />
                            {errors.surname && (
                                <span className="user-form__err">{errors.surname}</span>
                            )}
                        </label>

                        <label className="user-form__field">
                            {t.form.fields.name}
                            <input
                                name="name"
                                value={form.name}
                                onChange={handleChange}
                                placeholder={t.form.placeholders.name}
                            />
                            {errors.name && (
                                <span className="user-form__err">{errors.name}</span>
                            )}
                        </label>
                    </div>

                    <label className="user-form__field">
                        {t.form.fields.secondName}
                        <input
                            name="secondName"
                            value={form.secondName}
                            onChange={handleChange}
                            placeholder={t.form.placeholders.secondName}
                        />
                    </label>

                    <div className="user-form__row">
                        <label className="user-form__field">
                            {t.form.fields.email}
                            <input
                                type="email"
                                name="email"
                                value={form.email}
                                onChange={handleChange}
                                placeholder={t.form.placeholders.email}
                            />
                            {errors.email && (
                                <span className="user-form__err">{errors.email}</span>
                            )}
                        </label>

                        <label className="user-form__field">
                            {t.form.fields.password}
                            <input
                                type="password"
                                name="password"
                                value={form.password}
                                onChange={handleChange}
                                placeholder={
                                    mode === 'edit'
                                        ? t.form.placeholders.passwordEdit
                                        : t.form.placeholders.password
                                }
                                autoComplete="new-password"
                            />
                            {errors.password && (
                                <span className="user-form__err">{errors.password}</span>
                            )}
                        </label>
                    </div>

                    <div className="user-form__row">
                        <label className="user-form__field">
                            {t.form.fields.birthday}
                            <input
                                type="date"
                                name="birthday"
                                value={form.birthday}
                                onChange={handleChange}
                            />
                            {errors.birthday && (
                                <span className="user-form__err">{errors.birthday}</span>
                            )}
                        </label>

                        <div className="user-form__field">
                            {t.form.fields.gender}
                            <div className="user-form__gender">
                                <button
                                    type="button"
                                    className={form.gender === 'M' ? 'is-active' : ''}
                                    onClick={() => setField('gender', 'M')}
                                >
                                    {t.form.gender.male}
                                </button>
                                <button
                                    type="button"
                                    className={form.gender === 'F' ? 'is-active' : ''}
                                    onClick={() => setField('gender', 'F')}
                                >
                                    {t.form.gender.female}
                                </button>
                            </div>
                            {errors.gender && (
                                <span className="user-form__err">{errors.gender}</span>
                            )}
                        </div>
                    </div>

                    <div className="user-form__row">
                        <label className="user-form__field">
                            {t.form.fields.country}
                            <select
                                name="countryId"
                                value={form.countryId}
                                onChange={handleChange}
                                disabled={loadingCountries}
                            >
                                <option value="">—</option>
                                {countries.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.name}
                                    </option>
                                ))}
                            </select>
                        </label>

                        <label className="user-form__field">
                            {t.form.fields.city}
                            <select
                                name="cityId"
                                value={form.cityId}
                                onChange={handleChange}
                                disabled={!form.countryId || loadingCities}
                            >
                                <option value="">—</option>
                                {cities.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.name}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>
                </div>

                <div className="user-form__actions">
                    <button
                        type="button"
                        className="user-form__btn user-form__btn--secondary"
                        onClick={onClose}
                        disabled={busy}
                    >
                        {common.cancel}
                    </button>
                    <button
                        type="button"
                        className="user-form__btn user-form__btn--primary"
                        onClick={handleSubmit}
                        disabled={busy}
                    >
                        {busy
                            ? common.loading
                            : mode === 'create'
                            ? t.form.buttons.submit
                            : t.form.buttons.save}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UserFormModal;