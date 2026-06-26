import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { exhibitionFormTranslations } from './lang';
import { useNotification } from '../../../../../context/NotificationContext';
import { createExhibition } from '../../../../../api/exhibitions/main.api';
import CustomInput from '../../../CustomInput/CustomInput';
import { useAuth } from '../../../../../hooks/useAuth';
import { useLanguage } from '../../../../../context/LanguageContext';

export interface CreateExhibitionDto {
    title: string;
    description: string;
    address: string;
    date: string;
    cost: string;
    currency?: string;
    image_path?: File | null;
    city_id?: number;
    country_id?: number;
    type_id?: number;
    genre_id?: number;
    owner_id?: number;
}

export const ExhibitionForm = () => {
    const navigate = useNavigate();
    const { showNotification } = useNotification();
    const { user } = useAuth();
    const { language } = useLanguage();
    const lang = exhibitionFormTranslations[language];

    const [loading, setLoading] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

    const citiesCacheRef = useRef<Map<string, any>>(new Map());
    const countriesCacheRef = useRef<Map<string, any>>(new Map());
    const typesCacheRef = useRef<Map<string, any>>(new Map());
    const genresCacheRef = useRef<Map<string, any>>(new Map());

    const [formData, setFormData] = useState<CreateExhibitionDto>({
        title: '',
        description: '',
        address: '',
        date: '',
        cost: '',
        currency: 'RUB',
        image_path: null,
        city_id: undefined,
        country_id: undefined,
        type_id: undefined,
        genre_id: undefined,
        owner_id: user?.id,
    });

    const [errors, setErrors] = useState<Partial<Record<keyof CreateExhibitionDto, string>>>({});

    const validate = (): boolean => {
        const newErrors: Partial<Record<keyof CreateExhibitionDto, string>> = {};

        if (!formData.title.trim()) {
            newErrors.title = lang.validation.titleRequired;
        }
        if (!formData.description.trim()) {
            newErrors.description = lang.validation.descriptionRequired;
        }
        if (!formData.address.trim()) {
            newErrors.address = lang.validation.addressRequired;
        }
        if (!formData.date) {
            newErrors.date = lang.validation.dateRequired;
        }
        if (!formData.cost.trim()) {
            newErrors.cost = lang.validation.costRequired;
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleInputChange = (field: string, value: string | number) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field as keyof CreateExhibitionDto]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const handleCustomInputChange = (field: 'city_id' | 'country_id' | 'type_id' | 'genre_id', value: string) => {
        const numValue = value ? Number(value) : undefined;
        setFormData(prev => ({ ...prev, [field]: numValue }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                showNotification(lang.notifications.imageInvalid, 'error');
                return;
            }

            if (file.size > 10 * 1024 * 1024) {
                showNotification(lang.notifications.imageTooLarge, 'error');
                return;
            }

            const previewUrl = URL.createObjectURL(file);
            setImagePreview(previewUrl);
            setFormData(prev => ({ ...prev, image_path: file }));

            if (errors.image_path) {
                setErrors(prev => ({ ...prev, image_path: '' }));
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validate()) {
            showNotification(lang.notifications.fillRequired, 'error');
            return;
        }

        setLoading(true);

        try {
            const submitData: CreateExhibitionDto = {
                title: formData.title,
                description: formData.description,
                address: formData.address,
                date: new Date(formData.date).toISOString(),
                cost: formData.cost,
                currency: formData.currency,
                image_path: formData.image_path,
                city_id: formData.city_id,
                country_id: formData.country_id,
                type_id: formData.type_id,
                genre_id: formData.genre_id,
                owner_id: user?.id,
            };

            const result = await createExhibition(submitData);

            if (result) {
                showNotification(lang.notifications.createSuccess, 'success');
                navigate('/exhibitions');
            } else {
                showNotification(lang.notifications.createError, 'error');
            }
        } catch (error) {
            console.error('Error creating exhibition:', error);
            showNotification(lang.notifications.createError, 'error');
        } finally {
            setLoading(false);
        }
    };

    const minDate = () => {
        const today = new Date();
        return today.toISOString().split('T')[0];
    };

    return (
        <>
            <form className="form" onSubmit={handleSubmit}>
                <h2 className="form__title">{lang.title}</h2>

                <div className="form__inputs">
                    <div className="form__input-box form__input-box--full">
                        <label className="form__label">{lang.fields.title}</label>
                        <input
                            type="text"
                            className={`form__input ${errors.title ? 'form__input--error' : ''}`}
                            value={formData.title}
                            onChange={(e) => handleInputChange('title', e.target.value)}
                            placeholder={lang.fields.titlePlaceholder}
                        />
                        {errors.title && <span className="form__error">{errors.title}</span>}
                    </div>

                    <div className="form__input-box form__input-box--full">
                        <label className="form__label">{lang.fields.description}</label>
                        <textarea
                            className={`form__input ${errors.description ? 'form__input--error' : ''}`}
                            value={formData.description}
                            onChange={(e) => handleInputChange('description', e.target.value)}
                            rows={5}
                            placeholder={lang.fields.descriptionPlaceholder}
                        />
                        {errors.description && <span className="form__error">{errors.description}</span>}
                    </div>

                    <div className="form__input-box form__input-box--full">
                        <label className="form__label">{lang.fields.address}</label>
                        <input
                            type="text"
                            className={`form__input ${errors.address ? 'form__input--error' : ''}`}
                            value={formData.address}
                            onChange={(e) => handleInputChange('address', e.target.value)}
                            placeholder={lang.fields.addressPlaceholder}
                        />
                        {errors.address && <span className="form__error">{errors.address}</span>}
                    </div>

                    <div className="form__row">
                        <div className="form__input-box">
                            <label className="form__label">{lang.fields.date}</label>
                            <input
                                type="date"
                                className={`form__input ${errors.date ? 'form__input--error' : ''}`}
                                value={formData.date}
                                onChange={(e) => handleInputChange('date', e.target.value)}
                                min={minDate()}
                            />
                            {errors.date && <span className="form__error">{errors.date}</span>}
                        </div>

                        <div className="form__input-box">
                            <label className="form__label">{lang.fields.cost}</label>
                            <input
                                type="text"
                                className={`form__input ${errors.cost ? 'form__input--error' : ''}`}
                                value={formData.cost}
                                onChange={(e) => handleInputChange('cost', e.target.value)}
                                placeholder={lang.fields.costPlaceholder}
                            />
                            {errors.cost && <span className="form__error">{errors.cost}</span>}
                        </div>
                    </div>

                    {/* Валюта */}
                    <div className="form__input-box">
                        <label className="form__label">{lang.fields.currency}</label>
                        <select
                            className={`form__input ${errors.currency ? 'form__input--error' : ''}`}
                            value={formData.currency}
                            onChange={(e) => handleInputChange('currency', e.target.value)}
                        >
                            <option value="RUB">₽ RUB</option>
                            <option value="USD">$ USD</option>
                            <option value="EUR">€ EUR</option>
                            <option value="UAH">₴ UAH</option>
                        </select>
                        {errors.currency && <span className="form__error">{errors.currency}</span>}
                    </div>

                    <div className="form__input-box">
                        <CustomInput
                            type="country"
                            value={formData.country_id?.toString() || ''}
                            onChange={(value) => handleCustomInputChange('country_id', value)}
                            isEditing={true}
                            cache={countriesCacheRef}
                        />
                    </div>

                    <div className="form__input-box">
                        <CustomInput
                            type="city"
                            value={formData.city_id?.toString() || ''}
                            onChange={(value) => handleCustomInputChange('city_id', value)}
                            isEditing={true}
                            cache={citiesCacheRef}
                        />
                    </div>

                    <div className="form__input-box">
                        <CustomInput
                            type="type"
                            value={formData.type_id?.toString() || ''}
                            onChange={(value) => handleCustomInputChange('type_id', value)}
                            isEditing={true}
                            cache={typesCacheRef}
                        />
                    </div>

                    <div className="form__input-box">
                        <CustomInput
                            type="genre"
                            value={formData.genre_id?.toString() || ''}
                            onChange={(value) => handleCustomInputChange('genre_id', value)}
                            isEditing={true}
                            cache={genresCacheRef}
                        />
                    </div>

                    <div className="form__input-box form__input-box--full">
                        <label className="form__label">{lang.fields.image}</label>
                        <div className="form__art-container">
                            {imagePreview && (
                                <div className="form__art-preview">
                                    <img
                                        src={imagePreview}
                                        alt="Exhibition preview"
                                        className="form__art-image"
                                        onClick={() => setFullscreenImage(imagePreview)}
                                    />
                                    <button
                                        type="button"
                                        className="form__art-remove"
                                        onClick={() => {
                                            setImagePreview(null);
                                            setFormData(prev => ({ ...prev, image_path: null }));
                                            const fileInput = document.getElementById('image_file') as HTMLInputElement;
                                            if (fileInput) fileInput.value = '';
                                        }}
                                    >
                                        ×
                                    </button>
                                    <button
                                        type="button"
                                        className="form__art-expand"
                                        onClick={() => setFullscreenImage(imagePreview)}
                                    >
                                        🔍
                                    </button>
                                </div>
                            )}
                            <label className={`form__file-label ${imagePreview ? 'form__file-label--has-preview' : ''}`}>
                                <input
                                    type="file"
                                    id="image_file"
                                    accept="image/*"
                                    className="form__file-input"
                                    onChange={handleFileChange}
                                />
                                <span className="form__file-icon">🖼️</span>
                                <span className="form__file-text">
                                    {imagePreview ? lang.fields.changeImage : lang.fields.selectImage}
                                </span>
                            </label>
                        </div>
                        {formData.image_path && typeof formData.image_path === 'object' && !imagePreview && (
                            <div className="form__file-info">
                                <span className="form__file-info-icon">📄</span>
                                <span className="form__file-info-name">{(formData.image_path as File).name}</span>
                                <span className="form__file-info-size">
                                    ({((formData.image_path as File).size / 1024).toFixed(2)} KB)
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                <button type="submit" className="form__btn" disabled={loading}>
                    {loading ? lang.buttons.submitting : lang.buttons.submit}
                </button>

                <button
                    type="button"
                    className="form__btn form__btn--secondary"
                    onClick={() => navigate('/exhibitions')}
                >
                    {lang.buttons.back}
                </button>
            </form>

            {fullscreenImage && (
                <div className="fullscreen-modal" onClick={() => setFullscreenImage(null)}>
                    <div className="fullscreen-modal__content">
                        <img src={fullscreenImage} alt="Fullscreen" className="fullscreen-modal__image" />
                        <button className="fullscreen-modal__close" onClick={() => setFullscreenImage(null)}>
                            ✕
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default ExhibitionForm;