// src/components/shared/Admin/sections/Genres/GenreFormModal.tsx
import { useState } from 'react';
import { X } from 'lucide-react';
import { useLanguage } from '../../../../../hooks/useLanguage';
import { adminTranslations } from '../../../../../pages/admin/lang';
import type {
    Genre,
    CreateGenreData,
    UpdateGenreData,
} from '../../../../../api/genres/main.api';
import type { ArtType } from '../../../../../api/art-types/main.api';
import { genresTranslations } from './lang';

interface GenreFormBaseProps {
    artTypes: ArtType[];
    busy: boolean;
    onClose: () => void;
}

interface GenreFormCreateProps extends GenreFormBaseProps {
    mode: 'create';
    genre?: undefined;
    onSubmit: (data: CreateGenreData) => void;
}

interface GenreFormEditProps extends GenreFormBaseProps {
    mode: 'edit';
    genre: Genre;
    onSubmit: (data: UpdateGenreData) => void;
}

type GenreFormModalProps = GenreFormCreateProps | GenreFormEditProps;

const GenreFormModal = (props: GenreFormModalProps) => {
    const { artTypes, busy, onClose } = props;
    const { language } = useLanguage();
    const t = genresTranslations[language];
    const common = adminTranslations[language].common;

    const initial = props.mode === 'edit' ? props.genre : undefined;

    const [title, setTitle] = useState(initial?.title ?? '');
    const [artTypeId, setArtTypeId] = useState<number | ''>(
        initial?.art_type_id ?? '',
    );
    const [description, setDescription] = useState(initial?.description ?? '');
    const [errors, setErrors] = useState<{
        title?: string;
        artType?: string;
    }>({});

    const handleSubmit = () => {
        const e: typeof errors = {};
        if (!title.trim()) e.title = t.form.errors.titleRequired;
        if (!artTypeId) e.artType = t.form.errors.artTypeRequired;

        if (Object.keys(e).length) {
            setErrors(e);
            return;
        }
        setErrors({});

        if (props.mode === 'create') {
            props.onSubmit({
                title: title.trim(),
                art_type_id: Number(artTypeId),
                description: description.trim() || undefined,
            });
        } else {
            const data: UpdateGenreData = {};
            if (title.trim() !== props.genre.title) data.title = title.trim();
            if (Number(artTypeId) !== props.genre.art_type_id)
                data.art_type_id = Number(artTypeId);
            if (description.trim() !== (props.genre.description ?? ''))
                data.description = description.trim() || undefined;

            props.onSubmit(data);
        }
    };

    const isCreate = props.mode === 'create';

    return (
        <div className="genre-form-overlay" onClick={onClose}>
            <div
                className="genre-form"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
            >
                <header className="genre-form__header">
                    <h3>
                        {isCreate
                            ? t.form.titleCreate
                            : t.form.titleEdit}
                    </h3>
                    <button type="button" onClick={onClose}>
                        <X size={20} />
                    </button>
                </header>

                <div className="genre-form__body">
                    <label className="genre-form__field">
                        {t.form.fields.title}
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => {
                                setTitle(e.target.value);
                                setErrors((p) => ({ ...p, title: undefined }));
                            }}
                            placeholder={t.form.placeholders.title}
                            autoFocus
                        />
                        {errors.title && (
                            <span className="genre-form__err">{errors.title}</span>
                        )}
                    </label>

                    <label className="genre-form__field">
                        {t.form.fields.artType}
                        <select
                            value={artTypeId}
                            onChange={(e) => {
                                setArtTypeId(
                                    e.target.value ? Number(e.target.value) : '',
                                );
                                setErrors((p) => ({ ...p, artType: undefined }));
                            }}
                        >
                            <option value="">—</option>
                            {artTypes.map((a) => (
                                <option key={a.id} value={a.id}>
                                    {a.name}
                                </option>
                            ))}
                        </select>
                        {errors.artType && (
                            <span className="genre-form__err">{errors.artType}</span>
                        )}
                    </label>

                    <label className="genre-form__field">
                        {t.form.fields.description}
                        <textarea
                            rows={4}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder={t.form.placeholders.description}
                        />
                    </label>
                </div>

                <div className="genre-form__actions">
                    <button
                        type="button"
                        className="genre-form__btn genre-form__btn--secondary"
                        onClick={onClose}
                        disabled={busy}
                    >
                        {common.cancel}
                    </button>
                    <button
                        type="button"
                        className="genre-form__btn genre-form__btn--primary"
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

export default GenreFormModal;