import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useLanguage } from '../../../context/LanguageContext';
import { exhibitionUpdateFormTranslations } from './lang';
import './ExhibitionUpdateForm.css';
import { useNotification } from '../../../../../context/NotificationContext';
import { getExhibitionById, updateExhibition } from '../../../../../api/exhibitions/main.api';
import CustomInput from '../../../CustomInput/CustomInput';

export interface UpdateExhibitionDto {
    title?: string;
    description?: string;
    address?: string;
    date?: string;
    cost?: string;
    city_id?: number;
    country_id?: number;
    type_id?: number;
    genre_id?: number;
    image_path?: File | null;
}

export const ExhibitionUpdateForm = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { showNotification } = useNotification();
    const { language } = useLanguage();
    const lang = exhibitionUpdateFormTranslations[language];

    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);
    const [originalImage, setOriginalImage] = useState<string | null>(null);

    const citiesCacheRef = useRef<Map<string, any>>(new Map());
    const countriesCacheRef = useRef<Map<string, any>>(new Map());
    const typesCacheRef = useRef<Map<string, any>>(new Map());
    const genresCacheRef = useRef<Map<string, any>>(new Map());

    const [formData, setFormData] = useState<UpdateExhibitionDto>({
        title: '',
        description: '',
        address: '',
        date: '',
        cost: '',
        city_id: undefined,
        country_id: undefined,
        type_id: undefined,
        genre_id: undefined,
        image_path: null
    });

    const [errors, setErrors] = useState<Partial<Record<keyof UpdateExhibitionDto, string>>>({});

    useEffect(() => {
        loadExhibition();
    }, [id]);

    const loadExhibition = async () => {
        setLoading(true);
        try {
            const data = await getExhibitionById(Number(id));
            if (data) {
                setFormData({
                    title: data.title || '',
                    description: data.description || '',
                    address: data.address || '',
                    date: data.date ? new Date(data.date).toISOString().split('T')[0] : '',
                    cost: data.cost || '',
                    city_id: data.city?.id,
                    country_id: data.country?.id,
                    type_id: data.type?.id,
                    genre_id: data.genre?.id,
                    image_path: null
                });
                setOriginalImage(data.image_path || null);
                if (data.image_path) {
                    setImagePreview(data.image_path);
                }
            } else {
                showNotification(lang.notifications.notFound, "error");
                navigate('/exhibitions/my');
            }
        } catch (error) {
            showNotification(lang.notifications.loadError, "error");
        } finally {
            setLoading(false);
        }
    };

    const validate = (): boolean => {
        const newErrors: Partial<Record<keyof UpdateExhibitionDto, string>> = {};

        if (!formData.title?.trim()) {
            newErrors.title = lang.validation.titleRequired;
        }
        if (!formData.description?.trim()) {
            newErrors.description = lang.validation.descriptionRequired;
        }
        if (!formData.address?.trim()) {
            newErrors.address = lang.validation.addressRequired;
        }
        if (!formData.date) {
            newErrors.date = lang.validation.dateRequired;
        }
        if (!formData.cost?.trim()) {
            newErrors.cost = lang.validation.costRequired;
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleInputChange = (field: string, value: string | number) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field as keyof UpdateExhibitionDto]) {
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
        setUpdating(true);
        try {
            const updateData: UpdateExhibitionDto = {
                title: formData.title !== '' ? formData.title : undefined,
                description: formData.description !== '' ? formData.description : undefined,
                address: formData.address !== '' ? formData.address : undefined,
                date: formData.date ? new Date(formData.date).toISOString() : undefined,
                cost: formData.cost !== '' ? formData.cost : undefined,
                city_id: formData.city_id,
                country_id: formData.country_id,
                type_id: formData.type_id,
                genre_id: formData.genre_id,
                image_path: formData.image_path
            };
            const result = await updateExhibition(Number(id), updateData);
            if (result) {
                showNotification(lang.notifications.updateSuccess, 'success');
                navigate('/exhibitions/my');
            } else {
                showNotification(lang.notifications.updateError, 'error');
            }
        } catch (error) {
            showNotification(lang.notifications.updateError, 'error');
        } finally {
            setUpdating(false);
        }
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
        <>
            <form className="update-form" onSubmit={handleSubmit}>
                <h2 className="update-form__title">{lang.title}</h2>

                <div className="update-form__inputs">
                    <div className="update-form__input-box update-form__input-box--full">
                        <label className="update-form__label">{lang.fields.title}</label>
                        <input
                            type="text"
                            className={`update-form__input ${errors.title ? 'update-form__input--error' : ''}`}
                            value={formData.title}
                            onChange={(e) => handleInputChange('title', e.target.value)}
                            placeholder={lang.fields.titlePlaceholder}
                        />
                        {errors.title && <span className="update-form__error">{errors.title}</span>}
                    </div>

                    <div className="update-form__input-box update-form__input-box--full">
                        <label className="update-form__label">{lang.fields.description}</label>
                        <textarea
                            className={`update-form__input ${errors.description ? 'update-form__input--error' : ''}`}
                            value={formData.description}
                            onChange={(e) => handleInputChange('description', e.target.value)}
                            rows={5}
                            placeholder={lang.fields.descriptionPlaceholder}
                        />
                        {errors.description && <span className="update-form__error">{errors.description}</span>}
                    </div>

                    <div className="update-form__input-box update-form__input-box--full">
                        <label className="update-form__label">{lang.fields.address}</label>
                        <input
                            type="text"
                            className={`update-form__input ${errors.address ? 'update-form__input--error' : ''}`}
                            value={formData.address}
                            onChange={(e) => handleInputChange('address', e.target.value)}
                            placeholder={lang.fields.addressPlaceholder}
                        />
                        {errors.address && <span className="update-form__error">{errors.address}</span>}
                    </div>

                    <div className="update-form__input-box">
                        <label className="update-form__label">{lang.fields.date}</label>
                        <input
                            type="date"
                            className={`update-form__input ${errors.date ? 'update-form__input--error' : ''}`}
                            value={formData.date}
                            onChange={(e) => handleInputChange('date', e.target.value)}
                        />
                        {errors.date && <span className="update-form__error">{errors.date}</span>}
                    </div>

                    <div className="update-form__input-box">
                        <label className="update-form__label">{lang.fields.cost}</label>
                        <input
                            type="text"
                            className={`update-form__input ${errors.cost ? 'update-form__input--error' : ''}`}
                            value={formData.cost}
                            onChange={(e) => handleInputChange('cost', e.target.value)}
                            placeholder={lang.fields.costPlaceholder}
                        />
                        {errors.cost && <span className="update-form__error">{errors.cost}</span>}
                    </div>

                    <div className="update-form__input-box">
                        <CustomInput
                            type="country"
                            value={formData.country_id?.toString() || ''}
                            onChange={(value) => handleCustomInputChange('country_id', value)}
                            isEditing={true}
                            cache={countriesCacheRef}
                        />
                    </div>

                    <div className="update-form__input-box">
                        <CustomInput
                            type="city"
                            value={formData.city_id?.toString() || ''}
                            onChange={(value) => handleCustomInputChange('city_id', value)}
                            isEditing={true}
                            cache={citiesCacheRef}
                        />
                    </div>

                    <div className="update-form__input-box">
                        <CustomInput
                            type="type"
                            value={formData.type_id?.toString() || ''}
                            onChange={(value) => handleCustomInputChange('type_id', value)}
                            isEditing={true}
                            cache={typesCacheRef}
                        />
                    </div>

                    <div className="update-form__input-box">
                        <CustomInput
                            type="genre"
                            value={formData.genre_id?.toString() || ''}
                            onChange={(value) => handleCustomInputChange('genre_id', value)}
                            isEditing={true}
                            cache={genresCacheRef}
                        />
                    </div>

                    <div className="update-form__input-box update-form__input-box--full">
                        <label className="update-form__label">{lang.fields.image}</label>
                        <div className="update-form__art-container">
                            {imagePreview && (
                                <div className="update-form__art-preview">
                                    <img
                                        src={imagePreview}
                                        alt="Preview"
                                        className="update-form__art-image"
                                        onClick={() => setFullscreenImage(imagePreview)}
                                    />
                                    <button
                                        type="button"
                                        className="update-form__art-remove"
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
                                        className="update-form__art-expand"
                                        onClick={() => setFullscreenImage(imagePreview)}
                                    >
                                        🔍
                                    </button>
                                </div>
                            )}
                            <label className={`update-form__file-label ${imagePreview ? 'update-form__file-label--has-preview' : ''}`}>
                                <input
                                    type="file"
                                    id="image_file"
                                    accept="image/*"
                                    className="update-form__file-input"
                                    onChange={handleFileChange}
                                />
                                <span className="update-form__file-icon">🖼️</span>
                                <span className="update-form__file-text">
                                    {imagePreview ? lang.fields.changeImage : lang.fields.selectImage}
                                </span>
                            </label>
                        </div>
                        {formData.image_path && typeof formData.image_path === 'object' && !imagePreview && (
                            <div className="update-form__file-info">
                                <span className="update-form__file-info-icon">📄</span>
                                <span className="update-form__file-info-name">{(formData.image_path as File).name}</span>
                                <span className="update-form__file-info-size">
                                    ({((formData.image_path as File).size / 1024).toFixed(2)} KB)
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="update-form__buttons">
                    <button type="submit" className="update-form__btn" disabled={updating}>
                        {updating ? lang.buttons.submitting : lang.buttons.submit}
                    </button>
                    <button
                        type="button"
                        className="update-form__btn update-form__btn--secondary"
                        onClick={() => navigate('/exhibitions/my')}
                    >
                        {lang.buttons.cancel}
                    </button>
                </div>
            </form>

            {fullscreenImage && (
                <div className="update-form__fullscreen" onClick={() => setFullscreenImage(null)}>
                    <div className="update-form__fullscreen-content">
                        <img src={fullscreenImage} alt="Fullscreen" />
                        <button className="update-form__fullscreen-close" onClick={() => setFullscreenImage(null)}>
                            ✕
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};