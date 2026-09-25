// src/components/shared/Admin/sections/Moderators/ModeratorFormModal.tsx
import { useState } from 'react';
import { X } from 'lucide-react';
import { useLanguage } from '../../../../../hooks/useLanguage';
import { adminTranslations } from '../../../../../pages/admin/lang';
import type {
    Moderator,
    CreateModeratorData,
    UpdateModeratorData,
} from '../../../../../api/moderators/main.api';
import { moderatorsTranslations } from './lang';
import './ModeratorFormModal.scss';

// ============================================================
// Props — discriminated union
// ============================================================

interface ModeratorFormBaseProps {
    busy: boolean;
    onClose: () => void;
}

interface ModeratorFormCreateProps extends ModeratorFormBaseProps {
    mode: 'create';
    moderator?: undefined;
    onSubmit: (data: CreateModeratorData) => void;
}

interface ModeratorFormEditProps extends ModeratorFormBaseProps {
    mode: 'edit';
    moderator: Moderator;
    onSubmit: (data: UpdateModeratorData) => void;
}

type ModeratorFormModalProps =
    | ModeratorFormCreateProps
    | ModeratorFormEditProps;

// ============================================================

const ModeratorFormModal = (props: ModeratorFormModalProps) => {
    const { busy, onClose } = props;

    const { language } = useLanguage();
    const t = moderatorsTranslations[language];
    const common = adminTranslations[language].common;

    const initialUser =
        props.mode === 'edit' ? props.moderator.user : undefined;

    const [email, setEmail] = useState(initialUser?.email ?? '');
    const [password, setPassword] = useState('');
    const [name, setName] = useState(initialUser?.name ?? '');
    const [surname, setSurname] = useState(initialUser?.surname ?? '');
    const [secondName, setSecondName] = useState(
        initialUser?.second_name ?? '',
    );

    const [errors, setErrors] = useState<Record<string, string | undefined>>({});

    // ---------- submit ----------
    const handleSubmit = () => {
        const e: typeof errors = {};

        if (!email.trim()) e.email = t.form.errors.required;
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
            e.email = t.form.errors.email;

        if (!name.trim()) e.name = t.form.errors.required;
        if (!surname.trim()) e.surname = t.form.errors.required;

        if (props.mode === 'create') {
            if (!password) e.password = t.form.errors.required;
            else if (password.length < 6) e.password = t.form.errors.passwordMin;
            else if (password.length > 25) e.password = t.form.errors.passwordMax;
        } else if (password) {
            if (password.length < 6) e.password = t.form.errors.passwordMin;
            else if (password.length > 25) e.password = t.form.errors.passwordMax;
        }

        if (Object.keys(e).length) {
            setErrors(e);
            return;
        }
        setErrors({});

        if (props.mode === 'create') {
            props.onSubmit({
                email: email.trim(),
                password,
                name: name.trim(),
                surname: surname.trim(),
                second_name: secondName.trim() || undefined,
            });
        } else {
            const data: UpdateModeratorData = {};

            if (email.trim() !== (initialUser?.email ?? ''))
                data.email = email.trim();
            if (password) data.password = password;
            if (name.trim() !== (initialUser?.name ?? ''))
                data.name = name.trim();
            if (surname.trim() !== (initialUser?.surname ?? ''))
                data.surname = surname.trim();
            if (secondName.trim() !== (initialUser?.second_name ?? ''))
                data.second_name = secondName.trim();

            props.onSubmit(data);
        }
    };

    const isCreate = props.mode === 'create';

    return (
        <div className="moderator-form-overlay" onClick={onClose}>
            <div
                className="moderator-form"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
            >
                <header className="moderator-form__header">
                    <h3>
                        {isCreate ? t.form.titleCreate : t.form.titleEdit}
                    </h3>
                    <button type="button" onClick={onClose}>
                        <X size={20} />
                    </button>
                </header>

                <div className="moderator-form__body">
                    <div className="moderator-form__row">
                        <label className="moderator-form__field">
                            {t.form.fields.email}
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                    setErrors((p) => ({
                                        ...p,
                                        email: undefined,
                                    }));
                                }}
                                placeholder={t.form.placeholders.email}
                            />
                            {errors.email && (
                                <span className="moderator-form__err">
                                    {errors.email}
                                </span>
                            )}
                        </label>

                        <label className="moderator-form__field">
                            {t.form.fields.password}
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    setErrors((p) => ({
                                        ...p,
                                        password: undefined,
                                    }));
                                }}
                                placeholder={
                                    isCreate
                                        ? t.form.placeholders.password
                                        : t.form.placeholders.passwordEdit
                                }
                                autoComplete="new-password"
                            />
                            {errors.password && (
                                <span className="moderator-form__err">
                                    {errors.password}
                                </span>
                            )}
                        </label>
                    </div>

                    <div className="moderator-form__row">
                        <label className="moderator-form__field">
                            {t.form.fields.surname}
                            <input
                                type="text"
                                value={surname}
                                onChange={(e) => {
                                    setSurname(e.target.value);
                                    setErrors((p) => ({
                                        ...p,
                                        surname: undefined,
                                    }));
                                }}
                                placeholder={t.form.placeholders.surname}
                            />
                            {errors.surname && (
                                <span className="moderator-form__err">
                                    {errors.surname}
                                </span>
                            )}
                        </label>

                        <label className="moderator-form__field">
                            {t.form.fields.name}
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => {
                                    setName(e.target.value);
                                    setErrors((p) => ({
                                        ...p,
                                        name: undefined,
                                    }));
                                }}
                                placeholder={t.form.placeholders.name}
                            />
                            {errors.name && (
                                <span className="moderator-form__err">
                                    {errors.name}
                                </span>
                            )}
                        </label>
                    </div>

                    <label className="moderator-form__field">
                        {t.form.fields.secondName}
                        <input
                            type="text"
                            value={secondName}
                            onChange={(e) => setSecondName(e.target.value)}
                            placeholder={t.form.placeholders.secondName}
                        />
                    </label>
                </div>

                <div className="moderator-form__actions">
                    <button
                        type="button"
                        className="moderator-form__btn moderator-form__btn--secondary"
                        onClick={onClose}
                        disabled={busy}
                    >
                        {common.cancel}
                    </button>
                    <button
                        type="button"
                        className="moderator-form__btn moderator-form__btn--primary"
                        onClick={handleSubmit}
                        disabled={busy}
                    >
                        {busy
                            ? common.loading
                            : isCreate
                            ? t.form.buttons.create
                            : t.form.buttons.save}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ModeratorFormModal;