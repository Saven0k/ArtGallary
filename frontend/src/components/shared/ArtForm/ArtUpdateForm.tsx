import { useState, useEffect, useRef } from "react";
import { useNotification } from "../../../context/NotificationContext";
import { deleteArt, getArtById, updateArt, type UpdateArtDto } from "../../../api/arts/main.api";
import { DynamicMetadataInput } from "../DynamicMetadataInput/DynamicMetadataInput";
import CustomInput from "../CustomInput/CustomInput";
import { useConfirm } from "../../../hooks/useConfirm";
import { useParams, useNavigate } from "react-router-dom";
import { useLanguage } from "../../../context/LanguageContext";
import { artFormTranslations } from "./lang";
import "./ArtUpdateForm.css";

export const ArtUpdateForm = () => {
    const artId = useParams().id;
    const navigate = useNavigate();
    const { showNotification } = useNotification();
    const { confirm } = useConfirm();
    const { language } = useLanguage();
    const lang = artFormTranslations[language];

    const genresCacheRef = useRef<Map<string, any>>(new Map());
    const typesCacheRef = useRef<Map<string, any>>(new Map());
    const citiesCacheRef = useRef<Map<string, any>>(new Map());
    const countriesCacheRef = useRef<Map<string, any>>(new Map());

    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [originalData, setOriginalData] = useState<UpdateArtDto | null>(null);

    const [formData, setFormData] = useState<UpdateArtDto>({
        title: "",
        description: "",
        cost: 0,
        currency: "USD",
        metadata: "{}",
        date_published: "",
        city_id: "",
        country_id: "",
        genre_id: "",
        style_id: "",
        is_adult: false,
    });

    const [errors, setErrors] = useState<Partial<Record<keyof UpdateArtDto, string>>>({});
    const [metadataError, setMetadataError] = useState<string | null>(null);

    useEffect(() => {
        loadArtData();
    }, [artId]);

    const loadArtData = async () => {
        setLoading(true);
        try {
            const art = await getArtById(Number(artId));
            if (art) {
                const newFormData = {
                    title: art.title || "",
                    description: art.description || "",
                    cost: art.cost || 0,
                    currency: art.currency || "USD",
                    metadata: art.metadata || "{}",
                    date_published: art.date_published ? new Date(art.date_published).toISOString().split('T')[0] : "",
                    city_id: art.city_id?.toString() || "",
                    country_id: art.country_id?.toString() || "",
                    genre_id: art.genre_id?.toString() || "",
                    type_id: art.type_id?.toString() || "",
                    is_adult: art.is_adult || false,
                };
                setFormData(newFormData);
                setOriginalData(newFormData);
            }
        } catch (error) {
            console.error('Error loading art:', error);
            showNotification(lang.messages.loadError, "error");
        } finally {
            setLoading(false);
        }
    };

    const validate = (): boolean => {
        const newErrors: Partial<Record<keyof UpdateArtDto, string>> = {};

        if (!formData.title?.trim()) newErrors.title = lang.validation.titleRequired;
        if (!formData.description?.trim()) newErrors.description = lang.validation.descriptionRequired;
        if (!formData.date_published) newErrors.date_published = lang.validation.dateRequired;

        try {
            JSON.parse(formData.metadata || "{}");
        } catch {
            setMetadataError(lang.validation.invalidJson);
            newErrors.metadata = lang.validation.invalidJson;
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleInputChange = (field: string, value: string | number | boolean) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field as keyof UpdateArtDto]) setErrors(prev => ({ ...prev, [field]: "" }));
    };

    const handleMetadataChange = (jsonString: string) => {
        setFormData(prev => ({ ...prev, metadata: jsonString }));
        setMetadataError(null);
        if (errors.metadata) setErrors(prev => ({ ...prev, metadata: "" }));
    };

    const handleUpdate = async () => {
        if (!validate()) {
            showNotification(lang.messages.fillRequired, "error");
            return;
        }

        const hasChanges = JSON.stringify(formData) !== JSON.stringify(originalData);
        if (!hasChanges) {
            showNotification(lang.messages.noChanges, "error");
            return;
        }

        setIsSubmitting(true);

        try {
            const updateData: UpdateArtDto = {
                title: formData.title !== originalData?.title ? formData.title : undefined,
                description: formData.description !== originalData?.description ? formData.description : undefined,
                cost: formData.cost !== originalData?.cost ? Number(formData.cost) : undefined,
                currency: formData.currency !== originalData?.currency ? formData.currency : undefined,
                metadata: formData.metadata !== originalData?.metadata ? formData.metadata : undefined,
                date_published: formData.date_published !== originalData?.date_published ? formData.date_published : undefined,
                city_id: formData.city_id !== originalData?.city_id ? Number(formData.city_id) : undefined,
                country_id: formData.country_id !== originalData?.country_id ? Number(formData.country_id) : undefined,
                genre_id: formData.genre_id !== originalData?.genre_id ? Number(formData.genre_id) : undefined,
                style_id: formData.style_id !== originalData?.style_id ? Number(formData.style_id) : undefined,
                is_adult: formData.is_adult !== originalData?.is_adult ? formData.is_adult : undefined,
            };

            const result = await updateArt(Number(artId), updateData);

            if (result) {
                showNotification(lang.messages.updateSuccess, "success");
                await loadArtData();
                setIsEditing(false);
            } else {
                showNotification(lang.messages.updateError, "error");
            }
        } catch (error) {
            console.error('Error updating art:', error);
            showNotification(lang.messages.updateError, "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        const confirmed = await confirm({
            title: lang.messages.deleteConfirmTitle,
            message: lang.messages.deleteConfirmMessage,
            confirmText: lang.buttons.deleteConfirm,
            cancelText: lang.buttons.cancelDelete,
            type: "danger"
        });

        if (confirmed) {
            const deleteRes = await deleteArt(Number(artId));
            if (!deleteRes) {
                showNotification(lang.messages.deleteError, "error");
            } else {
                showNotification(lang.messages.deleteSuccess, "success");
                navigate("/arts/my");
            }
        }
    };

    const handleCancel = () => {
        if (originalData) setFormData({ ...originalData });
        setIsEditing(false);
    };

    if (loading) {
        return (
            <div className="update-form__loading">
                <div className="update-form__spinner"></div>
                <p>{lang.loading}</p>
            </div>
        );
    }

    return (
        <div className="update-form__wrapper">
            <form className="update-form" onSubmit={(e) => { e.preventDefault(); handleUpdate(); }}>
                <div className="update-form__header">
                    <h2 className="update-form__title">{lang.editTitle}</h2>
                    {!isEditing ? (
                        <button type="button" className="update-form__edit-btn" onClick={() => setIsEditing(true)}>
                            ✏️ {lang.buttons.edit}
                        </button>
                    ) : (
                        <div className="update-form__actions">
                            <button type="button" className="update-form__cancel-btn" onClick={handleCancel}>
                                {lang.buttons.cancel}
                            </button>
                            <button type="submit" className="update-form__save-btn" disabled={isSubmitting}>
                                {isSubmitting ? lang.buttons.updating : `💾 ${lang.buttons.update}`}
                            </button>
                        </div>
                    )}
                </div>

                <div className="update-form__grid">
                    <div className="update-form__left">
                        <div className="update-form__field">
                            <label className="update-form__label">{lang.fields.title}</label>
                            <input
                                type="text"
                                className={`update-form__input ${!isEditing ? 'input-disabled' : ''} ${errors.title ? "update-form__input--error" : ""}`}
                                value={formData.title}
                                onChange={(e) => handleInputChange('title', e.target.value)}
                                disabled={!isEditing}
                                placeholder={lang.fields.titlePlaceholder}
                            />
                            {errors.title && <span className="update-form__error">{errors.title}</span>}
                        </div>

                        <div className="update-form__field">
                            <label className="update-form__label">{lang.fields.description}</label>
                            <textarea
                                className={`update-form__textarea ${!isEditing ? 'input-disabled' : ''} ${errors.description ? "update-form__input--error" : ""}`}
                                value={formData.description}
                                onChange={(e) => handleInputChange('description', e.target.value)}
                                disabled={!isEditing}
                                rows={4}
                                placeholder={lang.fields.descriptionPlaceholder}
                            />
                            {errors.description && <span className="update-form__error">{errors.description}</span>}
                        </div>

                        <div className="update-form__row">
                            <div className="update-form__field">
                                <label className="update-form__label">{lang.fields.cost}</label>
                                <input
                                    type="number"
                                    className={`update-form__input ${!isEditing ? 'input-disabled' : ''}`}
                                    value={formData.cost}
                                    onChange={(e) => handleInputChange('cost', e.target.value)}
                                    disabled={!isEditing}
                                    placeholder={lang.fields.costPlaceholder}
                                />
                            </div>
                            <div className="update-form__field">
                                <label className="update-form__label">{lang.fields.currency}</label>
                                <select
                                    className={`update-form__select ${!isEditing ? 'input-disabled' : ''}`}
                                    value={formData.currency}
                                    onChange={(e) => handleInputChange('currency', e.target.value)}
                                    disabled={!isEditing}
                                >
                                    <option value="USD">{lang.currencies.USD}</option>
                                    <option value="EUR">{lang.currencies.EUR}</option>
                                    <option value="RUB">{lang.currencies.RUB}</option>
                                    <option value="UAH">{lang.currencies.UAH}</option>
                                </select>
                            </div>
                        </div>

                        <div className="update-form__field">
                            <label className="update-form__label">{lang.fields.date}</label>
                            <input
                                type="date"
                                className={`update-form__input ${!isEditing ? 'input-disabled' : ''} ${errors.date_published ? "update-form__input--error" : ""}`}
                                value={formData.date_published}
                                onChange={(e) => handleInputChange('date_published', e.target.value)}
                                disabled={!isEditing}
                            />
                            {errors.date_published && <span className="update-form__error">{errors.date_published}</span>}
                        </div>

                        <div className="update-form__checkbox">
                            <label className="update-form__checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={formData.is_adult}
                                    onChange={(e) => handleInputChange('is_adult', e.target.checked)}
                                    disabled={!isEditing}
                                />
                                <span>{lang.fields.adult}</span>
                            </label>
                        </div>
                    </div>

                    <div className="update-form__right">
                        <CustomInput
                            type="country"
                            value={formData.country_id?.toString() || ""}
                            onChange={(value) => handleInputChange('country_id', value)}
                            isEditing={isEditing}
                            cache={countriesCacheRef}
                        />

                        <CustomInput
                            type="city"
                            value={formData.city_id?.toString() || ""}
                            onChange={(value) => handleInputChange('city_id', value)}
                            isEditing={isEditing}
                            cache={citiesCacheRef}
                        />

                        <CustomInput
                            type="type"
                            value={formData.style_id?.toString() || ""}
                            onChange={(value) => handleInputChange('type_id', value)}
                            isEditing={isEditing}
                            cache={typesCacheRef}
                        />

                        <CustomInput
                            type="genre"
                            value={formData.genre_id?.toString() || ""}
                            onChange={(value) => handleInputChange('genre_id', value)}
                            isEditing={isEditing}
                            cache={genresCacheRef}
                        />
                    </div>
                </div>

                <div className="update-form__metadata">
                    <div className="update-form__field">
                        <label className="update-form__label">{lang.fields.metadata}</label>
                        <DynamicMetadataInput
                            value={formData.metadata || "{}"}
                            onChange={handleMetadataChange}
                            onError={setMetadataError}
                        />
                        {metadataError && <span className="update-form__error">{metadataError}</span>}
                    </div>
                </div>

                {!isEditing && (
                    <button type="button" className="update-form__delete-btn" onClick={handleDelete}>
                        🗑️ {lang.buttons.delete}
                    </button>
                )}
            </form>
        </div>
    );
};