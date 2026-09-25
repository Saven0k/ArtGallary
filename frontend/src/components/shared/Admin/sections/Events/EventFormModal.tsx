// src/components/shared/Admin/sections/Events/EventFormModal.tsx
import { useRef, useState } from 'react';
import { X, Upload, Image as ImageIcon } from 'lucide-react';
import { useLanguage } from '../../../../../hooks/useLanguage';
import { adminTranslations } from '../../../../../pages/admin/lang';
import type {
    Event,
    CreateEventData,
    UpdateEventData,
} from '../../../../../api/events/main.api';
import { eventsTranslations } from './lang';

// ============================================================
// Props — discriminated union
// ============================================================

interface EventFormBaseProps {
    busy: boolean;
    onClose: () => void;
}

interface EventFormCreateProps extends EventFormBaseProps {
    mode: 'create';
    event?: undefined;
    onSubmit: (data: CreateEventData) => void;
}

interface EventFormEditProps extends EventFormBaseProps {
    mode: 'edit';
    event: Event;
    onSubmit: (data: UpdateEventData) => void;
}

type EventFormModalProps = EventFormCreateProps | EventFormEditProps;

// ============================================================
// Component
// ============================================================

const MAX_IMAGE_MB = 5;

const EventFormModal = (props: EventFormModalProps) => {
    const { busy, onClose } = props;

    const { language } = useLanguage();
    const t = eventsTranslations[language];
    const common = adminTranslations[language].common;

    // В edit-режиме event гарантирован типом
    const initialEvent = props.mode === 'edit' ? props.event : undefined;

    const [title, setTitle] = useState(initialEvent?.title ?? '');
    const [description, setDescription] = useState(
        initialEvent?.description ?? '',
    );
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(
        initialEvent?.image ?? null,
    );
    const [errors, setErrors] = useState<{
        title?: string;
        image?: string;
    }>({});

    const fileInputRef = useRef<HTMLInputElement>(null);

    // ---------- image ----------
    const handleImagePick = () => fileInputRef.current?.click();

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!/^image\/(png|jpe?g)$/.test(file.type)) {
            e.target.value = '';
            return;
        }
        if (file.size > MAX_IMAGE_MB * 1024 * 1024) {
            e.target.value = '';
            return;
        }

        if (imagePreview && imagePreview.startsWith('blob:')) {
            URL.revokeObjectURL(imagePreview);
        }
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
        setErrors((p) => ({ ...p, image: undefined }));
        e.target.value = '';
    };

    const handleImageRemove = () => {
        if (imagePreview && imagePreview.startsWith('blob:')) {
            URL.revokeObjectURL(imagePreview);
        }
        setImageFile(null);
        setImagePreview(null);
    };

    // ---------- submit ----------
    const handleSubmit = () => {
        const e: typeof errors = {};
        if (!title.trim()) e.title = t.form.errors.titleRequired;
        if (props.mode === 'create' && !imageFile)
            e.image = t.form.errors.imageRequired;

        if (Object.keys(e).length) {
            setErrors(e);
            return;
        }
        setErrors({});

        if (props.mode === 'create') {
            // здесь TS знает, что props.onSubmit: (data: CreateEventData) => void
            props.onSubmit({
                title: title.trim(),
                description: description.trim(),
                image: imageFile as File,
            });
        } else {
            // здесь TS знает, что props.onSubmit: (data: UpdateEventData) => void
            const data: UpdateEventData = {};

            if (title.trim() && title.trim() !== props.event.title) {
                data.title = title.trim();
            }
            if (description.trim() !== props.event.description) {
                data.description = description.trim();
            }
            if (imageFile) {
                data.image = imageFile;
            }

            props.onSubmit(data);
        }
    };

    // ---------- render ----------
    const isCreate = props.mode === 'create';

    return (
        <div className="event-form-overlay" onClick={onClose}>
            <div
                className="event-form"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
            >
                <header className="event-form__header">
                    <h3>
                        {isCreate ? t.form.titleCreate : t.form.titleEdit}
                    </h3>
                    <button type="button" onClick={onClose}>
                        <X size={20} />
                    </button>
                </header>

                <div className="event-form__body">
                    <label className="event-form__field">
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
                            <span className="event-form__err">
                                {errors.title}
                            </span>
                        )}
                    </label>

                    <label className="event-form__field">
                        {t.form.fields.description}
                        <textarea
                            rows={5}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder={t.form.placeholders.description}
                        />
                    </label>

                    {/* image */}
                    <div className="event-form__image-block">
                        <span className="event-form__field-label">
                            {t.form.fields.image}
                        </span>

                        <div className="event-form__image-row">
                            <div className="event-form__image-preview">
                                {imagePreview ? (
                                    <img src={imagePreview} alt="preview" />
                                ) : (
                                    <ImageIcon size={28} />
                                )}
                            </div>

                            <div className="event-form__image-actions">
                                <button
                                    type="button"
                                    className="event-form__image-btn"
                                    onClick={handleImagePick}
                                >
                                    <Upload size={14} />
                                    {imagePreview
                                        ? t.form.image.change
                                        : t.form.image.upload}
                                </button>

                                {imagePreview && (
                                    <button
                                        type="button"
                                        className="event-form__image-btn event-form__image-btn--danger"
                                        onClick={handleImageRemove}
                                    >
                                        {t.form.image.remove}
                                    </button>
                                )}

                                <span className="event-form__image-hint">
                                    {t.form.image.hint}
                                </span>
                            </div>
                        </div>

                        {errors.image && (
                            <span className="event-form__err">
                                {errors.image}
                            </span>
                        )}

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/png,image/jpeg"
                            hidden
                            onChange={handleImageChange}
                        />
                    </div>
                </div>

                <div className="event-form__actions">
                    <button
                        type="button"
                        className="event-form__btn event-form__btn--secondary"
                        onClick={onClose}
                        disabled={busy}
                    >
                        {common.cancel}
                    </button>
                    <button
                        type="button"
                        className="event-form__btn event-form__btn--primary"
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

export default EventFormModal;