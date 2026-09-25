// src/components/shared/Admin/sections/Authors/AuthorFormModal.tsx
import { useEffect, useRef, useState } from 'react';
import { X, Upload, User as UserIcon } from 'lucide-react';
import { useLanguage } from '../../../../../hooks/useLanguage';
import { adminTranslations } from '../../../../../pages/admin/lang';
import {
    getAllCountries,
    getCitiesByCountryCode,
    type CountrySuggestion,
    type CitySuggestion,
} from '../../../../../api/location/main.api';
import {
    getAllProfessions,
    type Profession,
} from '../../../../../api/professions/main.api';
import type { CreateAuthorData } from '../../../../../api/authors/main.api';
import { authorsTranslations } from './lang';

interface AuthorFormModalProps {
    busy: boolean;
    onClose: () => void;
    onSubmit: (data: CreateAuthorData, avatarFile: File | null) => void;
}

type Step = 'personal' | 'account' | 'profile';
type Gender = 'M' | 'F' | '';

interface FormState {
    name: string;
    surname: string;
    secondName: string;
    birthday: string;
    gender: Gender;
    email: string;
    password: string;
    countryId: number | '';
    cityId: number | '';
    professionId: number | '';
    biography: string;
}

const MAX_AVATAR_MB = 5;

const AuthorFormModal = ({ busy, onClose, onSubmit }: AuthorFormModalProps) => {
    const { language } = useLanguage();
    const t = authorsTranslations[language];
    const common = adminTranslations[language].common;

    const [step, setStep] = useState<Step>('personal');
    const [form, setForm] = useState<FormState>({
        name: '',
        surname: '',
        secondName: '',
        birthday: '',
        gender: '',
        email: '',
        password: '',
        countryId: '',
        cityId: '',
        professionId: '',
        biography: '',
    });

    const [countries, setCountries] = useState<CountrySuggestion[]>([]);
    const [cities, setCities] = useState<CitySuggestion[]>([]);
    const [professions, setProfessions] = useState<Profession[]>([]);
    const [loadingCountries, setLoadingCountries] = useState(false);
    const [loadingCities, setLoadingCities] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

    const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

    // ---------- load dictionaries ----------
    useEffect(() => {
        (async () => {
            setLoadingCountries(true);
            const data = await getAllCountries(language === 'ru' ? 'ru' : 'en');
            setCountries(data || []);
            setLoadingCountries(false);

            const profs = await getAllProfessions();
            setProfessions(profs || []);
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

    // ---------- field handlers ----------
    const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
        setForm((prev) => ({ ...prev, [key]: value }));
        setErrors((prev) => ({ ...prev, [key]: undefined }));
    };

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
    ) => {
        const { name, value } = e.target;
        if (name === 'countryId') {
            setField('countryId', value ? Number(value) : '');
            setField('cityId', '');
        } else if (name === 'cityId' || name === 'professionId') {
            setField(name, value ? Number(value) : '');
        } else {
            setField(name as keyof FormState, value as any);
        }
    };

    // ---------- avatar ----------
    const handleAvatarPick = () => fileInputRef.current?.click();

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > MAX_AVATAR_MB * 1024 * 1024) return;
        setAvatarFile(file);
        setAvatarPreview(URL.createObjectURL(file));
        e.target.value = '';
    };

    const handleAvatarRemove = () => {
        if (avatarPreview) URL.revokeObjectURL(avatarPreview);
        setAvatarFile(null);
        setAvatarPreview(null);
    };

    // ---------- validation ----------
    const validateStep = (): boolean => {
        const e: Partial<Record<keyof FormState, string>> = {};

        if (step === 'personal') {
            if (!form.name.trim()) e.name = t.form.errors.required;
            if (!form.surname.trim()) e.surname = t.form.errors.required;
            if (!form.birthday) e.birthday = t.form.errors.required;
            if (!form.gender) e.gender = t.form.errors.required;
        }

        if (step === 'account') {
            if (!form.email.trim()) e.email = t.form.errors.required;
            else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
                e.email = t.form.errors.email;
            if (!form.password) e.password = t.form.errors.required;
            else if (form.password.length < 6) e.password = t.form.errors.passwordMin;
            else if (form.password.length > 25) e.password = t.form.errors.passwordMax;
        }

        if (step === 'profile') {
            if (!form.professionId) e.professionId = t.form.errors.required;
        }

        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleNext = () => {
        if (!validateStep()) return;
        if (step === 'personal') setStep('account');
        else if (step === 'account') setStep('profile');
    };

    const handleBack = () => {
        if (step === 'profile') setStep('account');
        else if (step === 'account') setStep('personal');
    };

    const handleSubmit = () => {
        if (!validateStep()) return;

        const data: CreateAuthorData = {
            email: form.email,
            password: form.password,
            name: form.name,
            surname: form.surname,
            second_name: form.secondName || undefined,
            date_birthday: form.birthday,
            gender: form.gender as 'M' | 'F',
            biography: form.biography || undefined,
            profession_id: form.professionId ? Number(form.professionId) : 1,
            country_id: form.countryId ? Number(form.countryId) : undefined,
            city_id: form.cityId ? Number(form.cityId) : undefined,
            avatar_path: avatarFile,
        };

        onSubmit(data, avatarFile);
    };

    // ---------- steps render ----------
    const renderPersonal = () => (
        <>
            <div className="author-form__row">
                <label className="author-form__field">
                    {t.form.fields.surname}
                    <input
                        name="surname"
                        value={form.surname}
                        onChange={handleChange}
                        placeholder={t.form.placeholders.surname}
                    />
                    {errors.surname && <span className="author-form__err">{errors.surname}</span>}
                </label>

                <label className="author-form__field">
                    {t.form.fields.name}
                    <input
                        name="name"
                        value={form.name}
                        onChange={handleChange}
                        placeholder={t.form.placeholders.name}
                    />
                    {errors.name && <span className="author-form__err">{errors.name}</span>}
                </label>
            </div>

            <label className="author-form__field">
                {t.form.fields.secondName}
                <input
                    name="secondName"
                    value={form.secondName}
                    onChange={handleChange}
                    placeholder={t.form.placeholders.secondName}
                />
            </label>

            <div className="author-form__row">
                <label className="author-form__field">
                    {t.form.fields.birthday}
                    <input
                        type="date"
                        name="birthday"
                        value={form.birthday}
                        onChange={handleChange}
                    />
                    {errors.birthday && <span className="author-form__err">{errors.birthday}</span>}
                </label>

                <div className="author-form__field">
                    {t.form.fields.gender}
                    <div className="author-form__gender">
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
                    {errors.gender && <span className="author-form__err">{errors.gender}</span>}
                </div>
            </div>
        </>
    );

    const renderAccount = () => (
        <>
            <label className="author-form__field">
                {t.form.fields.email}
                <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder={t.form.placeholders.email}
                />
                {errors.email && <span className="author-form__err">{errors.email}</span>}
            </label>

            <label className="author-form__field">
                {t.form.fields.password}
                <input
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder={t.form.placeholders.password}
                    autoComplete="new-password"
                />
                {errors.password && <span className="author-form__err">{errors.password}</span>}
            </label>
        </>
    );

    const renderProfile = () => (
        <>
            <div className="author-form__row">
                <label className="author-form__field">
                    {t.form.fields.country}
                    <select
                        name="countryId"
                        value={form.countryId}
                        onChange={handleChange}
                        disabled={loadingCountries}
                    >
                        <option value="">—</option>
                        {countries.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                </label>

                <label className="author-form__field">
                    {t.form.fields.city}
                    <select
                        name="cityId"
                        value={form.cityId}
                        onChange={handleChange}
                        disabled={!form.countryId || loadingCities}
                    >
                        <option value="">—</option>
                        {cities.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                </label>
            </div>

            <label className="author-form__field">
                {t.form.fields.profession}
                <select
                    name="professionId"
                    value={form.professionId}
                    onChange={handleChange}
                >
                    <option value="">—</option>
                    {professions.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                </select>
                {errors.professionId && (
                    <span className="author-form__err">{errors.professionId}</span>
                )}
            </label>

            <label className="author-form__field">
                {t.form.fields.biography}
                <textarea
                    name="biography"
                    rows={5}
                    value={form.biography}
                    onChange={handleChange}
                    placeholder={t.form.placeholders.biography}
                />
            </label>

            {/* avatar */}
            <div className="author-form__avatar-block">
                <span className="author-form__field-label">
                    {t.form.fields.avatar}
                </span>

                <div className="author-form__avatar-row">
                    <div className="author-form__avatar-preview">
                        {avatarPreview ? (
                            <img src={avatarPreview} alt="avatar" />
                        ) : (
                            <UserIcon size={32} />
                        )}
                    </div>

                    <div className="author-form__avatar-actions">
                        <button
                            type="button"
                            className="author-form__avatar-btn"
                            onClick={handleAvatarPick}
                        >
                            <Upload size={14} />
                            {avatarPreview ? t.form.avatar.change : t.form.avatar.upload}
                        </button>

                        {avatarPreview && (
                            <button
                                type="button"
                                className="author-form__avatar-btn author-form__avatar-btn--danger"
                                onClick={handleAvatarRemove}
                            >
                                {t.form.avatar.remove}
                            </button>
                        )}

                        <span className="author-form__avatar-hint">
                            {t.form.avatar.hint}
                        </span>
                    </div>
                </div>

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg"
                    hidden
                    onChange={handleAvatarChange}
                />
            </div>
        </>
    );

    return (
        <div className="author-form-overlay" onClick={onClose}>
            <div
                className="author-form"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
            >
                <header className="author-form__header">
                    <h3>{t.form.titleCreate}</h3>
                    <button type="button" onClick={onClose}>
                        <X size={20} />
                    </button>
                </header>

                <div className="author-form__steps">
                    <span className={step === 'personal' ? 'is-active' : ''}>
                        {t.form.stepPersonal}
                    </span>
                    <span className={step === 'account' ? 'is-active' : ''}>
                        {t.form.stepAccount}
                    </span>
                    <span className={step === 'profile' ? 'is-active' : ''}>
                        {t.form.stepProfile}
                    </span>
                </div>

                <div className="author-form__body">
                    {step === 'personal' && renderPersonal()}
                    {step === 'account' && renderAccount()}
                    {step === 'profile' && renderProfile()}
                </div>

                <div className="author-form__actions">
                    {step !== 'personal' && (
                        <button
                            type="button"
                            className="author-form__btn author-form__btn--secondary"
                            onClick={handleBack}
                            disabled={busy}
                        >
                            {t.form.buttons.back}
                        </button>
                    )}

                    {step !== 'profile' ? (
                        <button
                            type="button"
                            className="author-form__btn author-form__btn--primary"
                            onClick={handleNext}
                            disabled={busy}
                        >
                            {t.form.buttons.next}
                        </button>
                    ) : (
                        <button
                            type="button"
                            className="author-form__btn author-form__btn--primary"
                            onClick={handleSubmit}
                            disabled={busy}
                        >
                            {busy ? common.loading : t.form.buttons.submit}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AuthorFormModal;