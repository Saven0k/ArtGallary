import { useState, useEffect, useCallback, useMemo, memo, useRef } from 'react';
import './index.css';
import { useAuth } from '../../../hooks/useAuth';
import { useLanguage } from '../../../context/LanguageContext';
import { profileScreenTranslations } from './lang';
import type { ArtistUser } from '../../../types/user.types';
import { deleteArtistById, getArtistById, updateArtist } from '../../../api/artists/main.api';
import { updateUser, deleteUserById, getUserById } from '../../../api/users/main.api';
import { useNotification } from '../../../context/NotificationContext';
import CustomInput from '../CustomInput/CustomInput';
import ProfileForm from './ProfileForm';
import { useConfirm } from '../../../hooks/useConfirm';

export const ProfileScreen = () => {
    const { user: currentUser, logout } = useAuth();
    const { language } = useLanguage();
    const lang = profileScreenTranslations[language];
    
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [artist, setArtist] = useState<ArtistUser | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    
    const initialDataRef = useRef<any>(null);
    const citiesCacheRef = useRef<Map<string, any>>(new Map());
    const countriesCacheRef = useRef<Map<string, any>>(new Map());
    
    const userRole = currentUser?.role || 'user';
    const isArtist = userRole === 'artist';
    
    const { confirm } = useConfirm();
    const { showNotification } = useNotification();

    const [formData, setFormData] = useState({
        name: '',
        surname: '',
        second_name: '',
        email: '',
        phone_number: '',
        biography: '',
        date_birthday: '',
        city_id: '',
        country_id: '',
    });

    const [avatarFile, setAvatarFile] = useState<File | null | any>(null);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [originalAvatar, setOriginalAvatar] = useState<string | null | any | File>(null);

    const loadProfileData = useCallback(async () => {
        if (!currentUser?.id) return;

        setLoading(true);
        try {
            if (isArtist) {
                const data = await getArtistById(currentUser.id);
                if (data) {
                    setArtist(data);
                    const newFormData = {
                        name: data.name || '',
                        surname: data.surname || '',
                        second_name: data.second_name || '',
                        email: data.email || '',
                        phone_number: data.phone_number || '',
                        biography: data.artistProfile?.biography || '',
                        date_birthday: data.artistProfile?.date_birthday
                            ? new Date(data.artistProfile.date_birthday).toISOString().split('T')[0]
                            : '',
                        city_id: data.artistProfile?.city?.id.toString() || '',
                        country_id: data.artistProfile?.country?.id.toString() || '',
                    };
                    setFormData(newFormData);
                    initialDataRef.current = { ...newFormData };
                    setOriginalAvatar(data.avatar_path || null);
                }
            } else {
                const data = await getUserById(currentUser.id);
                const newFormData = {
                    name: data.name || '',
                    surname: data.surname || '',
                    second_name: data.second_name || '',
                    email: data.email || '',
                    phone_number: data.phone_number || '',
                    biography: '',
                    date_birthday: '',
                    city_id: '',
                    country_id: '',
                };
                setFormData(newFormData);
                initialDataRef.current = { ...newFormData };
                setOriginalAvatar(data.avatar_path || null);
            }
        } catch (error) {
            console.error('Error loading profile:', error);
        } finally {
            setLoading(false);
        }
    }, [currentUser?.id, isArtist]);

    useEffect(() => {
        loadProfileData();
    }, [loadProfileData]);

    const moderationStatus = artist?.artistProfile?.moderate as any;
    const isModerated = moderationStatus?.moderate === true;
    const isPending = moderationStatus?.moderate === false;
    const moderationComment = moderationStatus?.comment;
    const moderationErrors = moderationStatus?.errors || {};

    const handleFormChange = useCallback((field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    }, []);

    const handleImageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setAvatarFile(file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    }, []);

    const updateLocalData = useCallback((updatedFields: any, newAvatarPath?: string) => {
        setFormData(prev => {
            const newFormData = { ...prev, ...updatedFields };
            initialDataRef.current = { ...initialDataRef.current, ...updatedFields };
            return newFormData;
        });

        if (newAvatarPath) {
            setOriginalAvatar(newAvatarPath);
        }

        if (isArtist && artist) {
            setArtist(prev => {
                if (!prev) return prev;
                return {
                    ...prev,
                    ...updatedFields,
                    artistProfile: {
                        ...prev.artistProfile,
                        biography: updatedFields.biography || prev.artistProfile?.biography,
                        date_birthday: updatedFields.date_birthday || prev.artistProfile?.date_birthday,
                        city_id: updatedFields.city_id ? parseInt(updatedFields.city_id) : prev.artistProfile?.city_id,
                        country_id: updatedFields.country_id ? parseInt(updatedFields.country_id) : prev.artistProfile?.country_id,
                    }
                };
            });
        }
    }, [isArtist, artist]);

    const handleUpdate = useCallback(async () => {
        if (!currentUser?.id) return;

        setUpdating(true);
        try {
            let updated = false;
            let responseData = null;

            if (isArtist) {
                const updateData: any = {};

                if (formData.name !== initialDataRef.current?.name) updateData.name = formData.name;
                if (formData.surname !== initialDataRef.current?.surname) updateData.surname = formData.surname;
                if (formData.second_name !== initialDataRef.current?.second_name) updateData.second_name = formData.second_name;
                if (formData.email !== initialDataRef.current?.email) updateData.email = formData.email;
                if (formData.phone_number !== initialDataRef.current?.phone_number) updateData.phone_number = formData.phone_number;
                if (formData.date_birthday !== initialDataRef.current?.date_birthday) {
                    updateData.date_birthday = formData.date_birthday;
                }
                if (formData.biography !== initialDataRef.current?.biography) {
                    updateData.biography = formData.biography;
                }
                if (formData.city_id && formData.city_id !== initialDataRef.current?.city_id) {
                    updateData.city_id = parseInt(formData.city_id);
                }
                if (formData.country_id && formData.country_id !== initialDataRef.current?.country_id) {
                    updateData.country_id = parseInt(formData.country_id);
                }

                let newAvatarPath = null;
                if (avatarFile) {
                    updateData.avatar_path = avatarFile;
                    newAvatarPath = URL.createObjectURL(avatarFile);
                }

                if (Object.keys(updateData).length === 0 && !avatarFile) {
                    setIsEditing(false);
                    showNotification(lang.notifications.noChanges, "error");
                    return;
                }

                responseData = await updateArtist(currentUser.id, updateData);
                updated = !!responseData;

                if (updated && responseData) {
                    const updatedFields: any = {};
                    if (updateData.name) updatedFields.name = updateData.name;
                    if (updateData.surname) updatedFields.surname = updateData.surname;
                    if (updateData.second_name) updatedFields.second_name = updateData.second_name;
                    if (updateData.email) updatedFields.email = updateData.email;
                    if (updateData.phone_number) updatedFields.phone_number = updateData.phone_number;
                    if (updateData.date_birthday) updatedFields.date_birthday = updateData.date_birthday;
                    if (updateData.biography) updatedFields.biography = updateData.biography;
                    if (updateData.city_id) updatedFields.city_id = updateData.city_id.toString();
                    if (updateData.country_id) updatedFields.country_id = updateData.country_id.toString();

                    const serverAvatarPath = responseData.avatar_path || initialDataRef.current.user?.avatar_path;

                    updateLocalData(updatedFields, serverAvatarPath);
                }
            } else {
                const updateData: any = {};

                if (formData.name !== initialDataRef.current?.name) updateData.name = formData.name;
                if (formData.surname !== initialDataRef.current?.surname) updateData.surname = formData.surname;
                if (formData.second_name !== initialDataRef.current?.second_name) updateData.second_name = formData.second_name;
                if (formData.email !== initialDataRef.current?.email) updateData.email = formData.email;
                if (formData.phone_number !== initialDataRef.current?.phone_number) updateData.phone_number = formData.phone_number;
                if (avatarFile) updateData.avatar = avatarFile;

                if (Object.keys(updateData).length === 0 && !avatarFile) {
                    setIsEditing(false);
                    return;
                }

                responseData = await updateUser(currentUser.id, updateData);
                updated = !!responseData;

                if (updated && responseData) {
                    const updatedFields: any = {};
                    if (updateData.name) updatedFields.name = updateData.name;
                    if (updateData.surname) updatedFields.surname = updateData.surname;
                    if (updateData.second_name) updatedFields.second_name = updateData.second_name;
                    if (updateData.email) updatedFields.email = updateData.email;
                    if (updateData.phone_number) updatedFields.phone_number = updateData.phone_number;

                    const serverAvatarPath = responseData.avatar_path || initialDataRef.current.user?.avatar_path;
                    updateLocalData(updatedFields, serverAvatarPath);
                }
            }

            if (updated) {
                showNotification(lang.notifications.updateSuccess, 'success');
                setIsEditing(false);
                setAvatarFile(null);
                setAvatarPreview(null);
            } else {
                showNotification(lang.notifications.updateError, "error");
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            showNotification(lang.notifications.updateErrorGeneric, "error");
        } finally {
            setUpdating(false);
        }
    }, [currentUser?.id, isArtist, formData, avatarFile, showNotification, updateLocalData, lang]);

    const handleCancel = useCallback(() => {
        setIsEditing(false);
        setAvatarFile(null);
        setAvatarPreview(null);
        if (initialDataRef.current) {
            setFormData({ ...initialDataRef.current });
        }
    }, []);

    const handleDeleteAccount = async () => {
        const confirmed = await confirm({
            title: lang.confirm.deleteTitle,
            message: lang.confirm.deleteMessage,
            confirmText: lang.confirm.confirmText,
            cancelText: lang.confirm.cancelText,
            type: "danger"
        });

        if (confirmed) {
            if (!currentUser?.id) return;

            let success = false;
            if (isArtist) {
                success = await deleteArtistById(currentUser.id);
            } else {
                success = await deleteUserById(currentUser.id);
            }

            if (success) {
                showNotification(lang.notifications.deleteSuccess, 'success');
                logout();
            } else {
                showNotification(lang.notifications.deleteError, 'error');
            }
        }
    };

    const renderAvatar = useMemo(() => {
        if (avatarFile) {
            return <img src={`${avatarPreview}`} alt={lang.avatar.alt} className="avatar" />;
        }
        if (originalAvatar) {
            return <img src={`${originalAvatar}`} alt={lang.avatar.alt} className="avatar" />;
        }
        return (
            <div className="avatar-placeholder">
                <span className="avatar-text">
                    {formData.name?.[0]}{formData.surname?.[0]}
                </span>
            </div>
        );
    }, [avatarFile, avatarPreview, originalAvatar, formData.name, formData.surname, lang]);

    const renderModerationBanner = () => {
        if (!isArtist || !isPending) return null;

        return (
            <div className="moderation-banner moderation-banner--pending">
                <div className="moderation-banner__icon">⏳</div>
                <div className="moderation-banner__content">
                    <h3 className="moderation-banner__title">{lang.moderation.pending.title}</h3>
                    <p className="moderation-banner__text">
                        {lang.moderation.pending.text}
                    </p>
                    {moderationComment && (
                        <div className="moderation-banner__comment">
                            <span className="moderation-banner__comment-icon">💬</span>
                            <span className="moderation-banner__comment-text">{moderationComment}</span>
                        </div>
                    )}
                    {Object.keys(moderationErrors).length > 0 && (
                        <div className="moderation-banner__errors">
                            <div className="moderation-banner__errors-title">{lang.moderation.pending.errors}</div>
                            <ul className="moderation-banner__errors-list">
                                {Object.entries(moderationErrors).map(([field, error]) => (
                                    <li key={field} className="moderation-banner__error-item">
                                        <span className="moderation-banner__error-field">{lang.moderation.pending.field}:</span>
                                        <span className="moderation-banner__error-message">{String(error)}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className="centered">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div className="profile-container">
            {renderModerationBanner()}
            
            <div className="profile-header">
                <div className="avatar-wrapper">
                    {renderAvatar}
                    {isEditing && (
                        <label className="edit-avatar-badge">
                            <span className="edit-avatar-text">📷</span>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageChange}
                                style={{ display: 'none' }}
                            />
                        </label>
                    )}
                </div>

                <h2 className="profile-name">
                    {formData.name} {formData.surname}
                </h2>
                <p className="profile-role">
                    {isArtist ? lang.profile.artist : lang.profile.user}
                </p>
            </div>

            <div className="profile-info">
                <div className="section-header">
                    <h3 className="section-title">{lang.sections.personalInfo}</h3>
                    {!isEditing ? (
                        <button className="edit-button" onClick={() => setIsEditing(true)}>
                            {lang.buttons.edit}
                        </button>
                    ) : (
                        <div className="action-buttons">
                            <button
                                className="cancel-button"
                                onClick={handleCancel}
                            >
                                {lang.buttons.cancel}
                            </button>
                            <button className="save-button" onClick={handleUpdate} disabled={updating}>
                                {updating ? lang.buttons.saving : lang.buttons.save}
                            </button>
                        </div>
                    )}
                </div>

                <ProfileForm
                    formData={formData}
                    isEditing={isEditing}
                    isArtist={isArtist}
                    onFormChange={handleFormChange}
                />

                {isArtist && (
                    <>
                        <CustomInput
                            type="city"
                            value={formData.city_id}
                            onChange={(value) => handleFormChange('city_id', value)}
                            isEditing={isEditing}
                            cache={citiesCacheRef} 
                        />

                        <CustomInput
                            type="country"
                            value={formData.country_id}
                            onChange={(value) => handleFormChange('country_id', value)}
                            isEditing={isEditing}
                            cache={countriesCacheRef} 
                        />
                    </>
                )}
            </div>

            {!isEditing && (
                <button className="delete-button" onClick={handleDeleteAccount}>
                    {lang.buttons.delete}
                </button>
            )}
        </div>
    );
};