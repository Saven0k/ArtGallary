// src/components/shared/Admin/sections/Styles/StyleFormModal.tsx
import { useState } from 'react';
import { X } from 'lucide-react';
import { useLanguage } from '../../../../../hooks/useLanguage';
import { adminTranslations } from '../../../../../pages/admin/lang';
import type { Style } from '../../../../../api/styles/main.api';
import { stylesTranslations } from './lang';

interface StyleFormModalProps {
    mode: 'create' | 'edit';
    style?: Style;
    busy: boolean;
    onClose: () => void;
    onSubmit: (data: { name: string; description?: string }) => void;
}

const StyleFormModal = ({
    mode,
    style,
    busy,
    onClose,
    onSubmit,
}: StyleFormModalProps) => {
    const { language } = useLanguage();
    const t = stylesTranslations[language];
    const common = adminTranslations[language].common;

    const [name, setName] = useState(style?.name ?? '');
    const [description, setDescription] = useState(style?.description ?? '');
    const [err, setErr] = useState<string | null>(null);

    const handleSubmit = () => {
        if (!name.trim()) {
            setErr(t.form.errors.nameRequired);
            return;
        }
        setErr(null);
        onSubmit({
            name: name.trim(),
            description: description.trim() || undefined,
        });
    };

    return (
        <div className="style-form-overlay" onClick={onClose}>
            <div
                className="style-form"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
            >
                <header className="style-form__header">
                    <h3>
                        {mode === 'create'
                            ? t.form.titleCreate
                            : t.form.titleEdit}
                    </h3>
                    <button type="button" onClick={onClose}>
                        <X size={20} />
                    </button>
                </header>

                <div className="style-form__body">
                    <label className="style-form__field">
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
                        {err && <span className="style-form__err">{err}</span>}
                    </label>

                    <label className="style-form__field">
                        {t.form.fields.description}
                        <textarea
                            rows={4}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder={t.form.placeholders.description}
                        />
                    </label>
                </div>

                <div className="style-form__actions">
                    <button
                        type="button"
                        className="style-form__btn style-form__btn--secondary"
                        onClick={onClose}
                        disabled={busy}
                    >
                        {common.cancel}
                    </button>
                    <button
                        type="button"
                        className="style-form__btn style-form__btn--primary"
                        onClick={handleSubmit}
                        disabled={busy}
                    >
                        {busy
                            ? common.loading
                            : mode === 'create'
                            ? t.form.buttons.create
                            : t.form.buttons.save}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StyleFormModal;