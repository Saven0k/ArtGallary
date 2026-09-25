// src/components/shared/Admin/sections/Professions/ProfessionFormModal.tsx
import { useState } from 'react';
import { X } from 'lucide-react';
import { useLanguage } from '../../../../../hooks/useLanguage';
import { adminTranslations } from '../../../../../pages/admin/lang';
import type {
    Profession,
    CreateProfessionData,
    UpdateProfessionData,
} from '../../../../../api/professions/main.api';
import { professionsTranslations } from './lang';

// ============================================================
// Props — discriminated union
// ============================================================

interface ProfessionFormBaseProps {
    busy: boolean;
    onClose: () => void;
}

interface ProfessionFormCreateProps extends ProfessionFormBaseProps {
    mode: 'create';
    profession?: undefined;
    onSubmit: (data: CreateProfessionData) => void;
}

interface ProfessionFormEditProps extends ProfessionFormBaseProps {
    mode: 'edit';
    profession: Profession;
    onSubmit: (data: UpdateProfessionData) => void;
}

type ProfessionFormModalProps =
    | ProfessionFormCreateProps
    | ProfessionFormEditProps;

// ============================================================
// Component
// ============================================================

const ProfessionFormModal = (props: ProfessionFormModalProps) => {
    const { busy, onClose } = props;

    const { language } = useLanguage();
    const t = professionsTranslations[language];
    const common = adminTranslations[language].common;

    const initial = props.mode === 'edit' ? props.profession : undefined;

    const [name, setName] = useState(initial?.name ?? '');
    const [description, setDescription] = useState(initial?.description ?? '');
    const [err, setErr] = useState<string | null>(null);

    const handleSubmit = () => {
        if (!name.trim()) {
            setErr(t.form.errors.nameRequired);
            return;
        }
        setErr(null);

        if (props.mode === 'create') {
            props.onSubmit({
                name: name.trim(),
                description: description.trim() || undefined,
            });
        } else {
            const data: UpdateProfessionData = {};

            if (name.trim() !== props.profession.name) {
                data.name = name.trim();
            }
            if (description.trim() !== (props.profession.description ?? '')) {
                data.description = description.trim() || undefined;
            }

            props.onSubmit(data);
        }
    };

    const isCreate = props.mode === 'create';

    return (
        <div className="profession-form-overlay" onClick={onClose}>
            <div
                className="profession-form"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
            >
                <header className="profession-form__header">
                    <h3>
                        {isCreate
                            ? t.form.titleCreate
                            : t.form.titleEdit}
                    </h3>
                    <button type="button" onClick={onClose}>
                        <X size={20} />
                    </button>
                </header>

                <div className="profession-form__body">
                    <label className="profession-form__field">
                        {t.form.fields.name}
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => {
                                setName(e.target.value);
                                setErr(null);
                            }}
                            placeholder={t.form.placeholders.name}
                            autoFocus
                        />
                        {err && (
                            <span className="profession-form__err">{err}</span>
                        )}
                    </label>

                    <label className="profession-form__field">
                        {t.form.fields.description}
                        <textarea
                            rows={4}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder={t.form.placeholders.description}
                        />
                    </label>
                </div>

                <div className="profession-form__actions">
                    <button
                        type="button"
                        className="profession-form__btn profession-form__btn--secondary"
                        onClick={onClose}
                        disabled={busy}
                    >
                        {common.cancel}
                    </button>
                    <button
                        type="button"
                        className="profession-form__btn profession-form__btn--primary"
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

export default ProfessionFormModal;