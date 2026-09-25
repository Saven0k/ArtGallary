// src/components/shared/Admin/sections/ArtTypes/ArtTypeFormModal.tsx
import { useState } from 'react';
import { X } from 'lucide-react';
import { useLanguage } from '../../../../../hooks/useLanguage';
import { adminTranslations } from '../../../../../pages/admin/lang';
import type {
    ArtType,
    CreateArtTypeData,
    UpdateArtTypeData,
} from '../../../../../api/art-types/main.api';
import { artTypesTranslations } from './lang';

interface ArtTypeFormBaseProps {
    busy: boolean;
    onClose: () => void;
}

interface ArtTypeFormCreateProps extends ArtTypeFormBaseProps {
    mode: 'create';
    artType?: undefined;
    onSubmit: (data: CreateArtTypeData) => void;
}

interface ArtTypeFormEditProps extends ArtTypeFormBaseProps {
    mode: 'edit';
    artType: ArtType;
    onSubmit: (data: UpdateArtTypeData) => void;
}

type ArtTypeFormModalProps = ArtTypeFormCreateProps | ArtTypeFormEditProps;

const ArtTypeFormModal = (props: ArtTypeFormModalProps) => {
    const { busy, onClose } = props;
    const { language } = useLanguage();
    const t = artTypesTranslations[language];
    const common = adminTranslations[language].common;

    const initial = props.mode === 'edit' ? props.artType : undefined;

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
            const data: UpdateArtTypeData = {};
            if (name.trim() !== props.artType.name) {
                data.name = name.trim();
            }
            if (description.trim() !== (props.artType.description ?? '')) {
                data.description = description.trim() || undefined;
            }
            props.onSubmit(data);
        }
    };

    const isCreate = props.mode === 'create';

    return (
        <div className="art-type-form-overlay" onClick={onClose}>
            <div
                className="art-type-form"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
            >
                <header className="art-type-form__header">
                    <h3>
                        {isCreate
                            ? t.form.titleCreate
                            : t.form.titleEdit}
                    </h3>
                    <button type="button" onClick={onClose}>
                        <X size={20} />
                    </button>
                </header>

                <div className="art-type-form__body">
                    <label className="art-type-form__field">
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
                            <span className="art-type-form__err">{err}</span>
                        )}
                    </label>

                    <label className="art-type-form__field">
                        {t.form.fields.description}
                        <textarea
                            rows={4}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder={t.form.placeholders.description}
                        />
                    </label>
                </div>

                <div className="art-type-form__actions">
                    <button
                        type="button"
                        className="art-type-form__btn art-type-form__btn--secondary"
                        onClick={onClose}
                        disabled={busy}
                    >
                        {common.cancel}
                    </button>
                    <button
                        type="button"
                        className="art-type-form__btn art-type-form__btn--primary"
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

export default ArtTypeFormModal;