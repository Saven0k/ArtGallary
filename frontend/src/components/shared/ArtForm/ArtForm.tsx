import { useState, useContext, useRef, useEffect } from "react";
import { useNotification } from "../../../context/NotificationContext";
import { AuthContext } from "../../../context/AuthContext";
import { createArt, type CreateArtDto } from "../../../api/arts/main.api";
import { DynamicMetadataInput } from "../DynamicMetadataInput/DynamicMetadataInput";
import CustomInput from "../CustomInput/CustomInput";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../../../context/LanguageContext";
import { artFormTranslations } from "./lang";
import "./ArtForm.css";

export const ArtForm = () => {
    const { user } = useContext(AuthContext)!;
    const { showNotification } = useNotification();
    const { language } = useLanguage();
    const lang = artFormTranslations[language];
    const navigate = useNavigate();

    const genresCacheRef = useRef<Map<string, any>>(new Map());
    const typesCacheRef = useRef<Map<string, any>>(new Map());
    const citiesCacheRef = useRef<Map<string, any>>(new Map());
    const countriesCacheRef = useRef<Map<string, any>>(new Map());

    const [formData, setFormData] = useState<CreateArtDto>({
        title: "",
        description: "",
        cost: 0,
        currency: "USD",
        image_path: null,
        metadata: "{}",
        date_published: "",
        artist_id: "",
        city_id: "",
        country_id: "",
        genre_id: "",
        style_id: "",
        is_adult: false,
    });

    const [errors, setErrors] = useState<Partial<Record<keyof CreateArtDto, string>>>({});
    const [metadataError, setMetadataError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

    const isEditing = true;

    const validate = (): boolean => {
        const newErrors: Partial<Record<keyof CreateArtDto, string>> = {};

        if (!formData.title?.trim()) newErrors.title = lang.validation.titleRequired;
        if (!formData.description?.trim()) newErrors.description = lang.validation.descriptionRequired;
        if (!formData.image_path) newErrors.image_path = lang.validation.imageRequired;
        if (!formData.date_published) newErrors.date_published = lang.validation.dateRequired;
        if (!formData.genre_id) newErrors.genre_id = lang.validation.genreRequired;
        if (!formData.style_id) newErrors.style_id = lang.validation.styleRequired;

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
        if (errors[field as keyof CreateArtDto]) setErrors(prev => ({ ...prev, [field]: "" }))
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFormData(prev => ({ ...prev, image_path: file }));
            setImagePreview(URL.createObjectURL(file));
            if (errors.image_path) setErrors(prev => ({ ...prev, image_path: "" }))
        }
    }

    const handleMetadataChange = (jsonString: string) => {
        setFormData(prev => ({ ...prev, metadata: jsonString }));
        setMetadataError(null);
        if (errors.metadata) setErrors(prev => ({ ...prev, metadata: "" }))
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) {
            showNotification(lang.messages.fillRequired, "error");
            return;
        }

        setIsSubmitting(true);

        try {
            const submitData: CreateArtDto = {
                title: formData.title,
                description: formData.description,
                cost: formData.cost ? Number(formData.cost) : undefined,
                currency: formData.currency,
                image_path: formData.image_path,
                metadata: formData.metadata,
                date_published: new Date(formData.date_published).toISOString(),
                artist_id: user?.id,
                city_id: formData.city_id ? Number(formData.city_id) : undefined,
                country_id: formData.country_id ? Number(formData.country_id) : undefined,
                genre_id: formData.genre_id ? Number(formData.genre_id) : undefined,
                style_id: formData.style_id ? Number(formData.style_id) : undefined,
                is_adult: formData.is_adult,
            };
            const result = await createArt(submitData);

            if (result) {
                showNotification(lang.messages.createSuccess, "success");

                setFormData({
                    title: "",
                    description: "",
                    cost: 0,
                    currency: "USD",
                    image_path: null,
                    metadata: "{}",
                    date_published: "",
                    artist_id: "",
                    city_id: "",
                    country_id: "",
                    genre_id: "",
                    style_id: "",
                    is_adult: false,
                });
                setImagePreview(null);

                const fileInput = document.getElementById("image_file") as HTMLInputElement;
                if (fileInput) fileInput.value = "";
                navigate("/arts/my");
            } else {
                showNotification(lang.messages.createError, "error");
            }
        } catch (error) {
            console.error('Error creating art:', error);
            showNotification(lang.messages.createError, "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const openFullscreen = (imageUrl: string) => {
        setFullscreenImage(imageUrl);
    };

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setFullscreenImage(null);
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, []);

    return (
        <div className="art-form-wrapper">
            <form className="art-form" onSubmit={handleSubmit}>
                <h2 className="art-form__title">{lang.createTitle}</h2>

                <div className="art-form__grid">
                    {/* Левая колонка */}
                    <div className="art-form__left">
                        <div className="art-form__field">
                            <label className="art-form__label">{lang.fields.title}</label>
                            <input
                                type="text"
                                className={`art-form__input ${errors.title ? "art-form__input--error" : ""}`}
                                value={formData.title}
                                onChange={(e) => handleInputChange('title', e.target.value)}
                                placeholder={lang.fields.titlePlaceholder}
                            />
                            {errors.title && <span className="art-form__error">{errors.title}</span>}
                        </div>

                        <div className="art-form__field">
                            <label className="art-form__label">{lang.fields.description}</label>
                            <textarea
                                className={`art-form__textarea ${errors.description ? "art-form__textarea--error" : ""}`}
                                value={formData.description}
                                onChange={(e) => handleInputChange('description', e.target.value)}
                                rows={4}
                                placeholder={lang.fields.descriptionPlaceholder}
                            />
                            {errors.description && <span className="art-form__error">{errors.description}</span>}
                        </div>

                        <div className="art-form__row">
                            <div className="art-form__field">
                                <label className="art-form__label">{lang.fields.cost}</label>
                                <input
                                    type="number"
                                    className="art-form__input"
                                    value={formData.cost}
                                    onChange={(e) => handleInputChange('cost', e.target.value)}
                                    placeholder={lang.fields.costPlaceholder}
                                />
                            </div>
                            <div className="art-form__field">
                                <label className="art-form__label">{lang.fields.currency}</label>
                                <select
                                    className="art-form__select"
                                    value={formData.currency}
                                    onChange={(e) => handleInputChange('currency', e.target.value)}
                                >
                                    <option value="USD">{lang.currencies.USD}</option>
                                    <option value="EUR">{lang.currencies.EUR}</option>
                                    <option value="RUB">{lang.currencies.RUB}</option>
                                    <option value="UAH">{lang.currencies.UAH}</option>
                                </select>
                            </div>
                        </div>

                        <div className="art-form__field">
                            <label className="art-form__label">{lang.fields.date}</label>
                            <input
                                type="date"
                                className={`art-form__input ${errors.date_published ? "art-form__input--error" : ""}`}
                                value={formData.date_published}
                                onChange={(e) => handleInputChange('date_published', e.target.value)}
                            />
                            {errors.date_published && <span className="art-form__error">{errors.date_published}</span>}
                        </div>

                        <div className="art-form__checkbox">
                            <label className="art-form__checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={formData.is_adult}
                                    onChange={(e) => handleInputChange('is_adult', e.target.checked)}
                                />
                                <span>{lang.fields.adult}</span>
                            </label>
                        </div>
                    </div>

                    {/* Правая колонка */}
                    <div className="art-form__right">
                        <CustomInput
                            type="style"
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
                    </div>
                </div>

                {/* Фото и метаданные - во всю ширину */}
                <div className="art-form__fullwidth">
                    <div className="art-form__field art-form__field--full">
                        <label className="art-form__label">{lang.fields.image}</label>
                        <div className="art-form__image-container">
                            {imagePreview && (
                                <div className="art-form__image-preview">
                                    <img
                                        src={imagePreview}
                                        alt="Art preview"
                                        className="art-form__preview-img"
                                        onClick={() => openFullscreen(imagePreview)}
                                    />
                                    <button
                                        type="button"
                                        className="art-form__image-remove"
                                        onClick={() => {
                                            setImagePreview(null);
                                            setFormData(prev => ({ ...prev, image_path: null }));
                                            const fileInput = document.getElementById("image_file") as HTMLInputElement;
                                            if (fileInput) fileInput.value = "";
                                        }}
                                    >
                                        ×
                                    </button>
                                </div>
                            )}
                            <label className={`art-form__file-btn ${imagePreview ? 'has-preview' : ''}`}>
                                <input
                                    type="file"
                                    id="image_file"
                                    accept="image/*"
                                    className="art-form__file-input"
                                    onChange={handleFileChange}
                                />
                                <span className="art-form__file-icon">🖼️</span>
                                <span className="art-form__file-text">
                                    {imagePreview ? lang.fields.changeImage : lang.fields.selectImage}
                                </span>
                            </label>
                        </div>
                        {errors.image_path && <span className="art-form__error">{errors.image_path}</span>}
                    </div>

                    <div className="art-form__field art-form__field--full">
                        <label className="art-form__label">{lang.fields.metadata}</label>
                        <DynamicMetadataInput
                            value={formData.metadata || "{}"}
                            onChange={handleMetadataChange}
                            onError={setMetadataError}
                        />
                        {metadataError && <span className="art-form__error">{metadataError}</span>}
                    </div>
                </div>

                <button type="submit" className="art-form__submit" disabled={isSubmitting}>
                    {isSubmitting ? lang.buttons.creating : lang.buttons.create}
                </button>
            </form>

            {fullscreenImage && (
                <div className="art-form__fullscreen" onClick={() => setFullscreenImage(null)}>
                    <div className="art-form__fullscreen-content">
                        <img src={fullscreenImage} alt="Fullscreen art" />
                        <button className="art-form__fullscreen-close" onClick={() => setFullscreenImage(null)}>×</button>
                    </div>
                </div>
            )}
        </div>
    );
};