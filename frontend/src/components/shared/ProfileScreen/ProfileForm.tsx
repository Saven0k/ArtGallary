import { memo } from "react";
import { useLanguage } from "../../../context/LanguageContext";
import { profileScreenTranslations } from "./lang";

const ProfileForm = memo(({
    formData,
    isEditing,
    isArtist,
    onFormChange
}: any) => {
    const { language } = useLanguage();
    const lang = profileScreenTranslations[language];

    return (
        <>
            <div className="form-group">
                <label className="form-label">{lang.fields.name}</label>
                <input
                    type="text"
                    className={`form-input ${!isEditing ? 'input-disabled' : ''}`}
                    value={formData.name}
                    onChange={(e) => onFormChange('name', e.target.value)}
                    disabled={!isEditing}
                    placeholder={lang.fields.namePlaceholder}
                />
            </div>

            <div className="form-group">
                <label className="form-label">{lang.fields.surname}</label>
                <input
                    type="text"
                    className={`form-input ${!isEditing ? 'input-disabled' : ''}`}
                    value={formData.surname}
                    onChange={(e) => onFormChange('surname', e.target.value)}
                    disabled={!isEditing}
                    placeholder={lang.fields.surnamePlaceholder}
                />
            </div>

            <div className="form-group">
                <label className="form-label">{lang.fields.secondName}</label>
                <input
                    type="text"
                    className={`form-input ${!isEditing ? 'input-disabled' : ''}`}
                    value={formData.second_name}
                    onChange={(e) => onFormChange('second_name', e.target.value)}
                    disabled={!isEditing}
                    placeholder={lang.fields.secondNamePlaceholder}
                />
            </div>

            <div className="form-group">
                <label className="form-label">{lang.fields.email}</label>
                <input
                    type="email"
                    className="form-input input-disabled"
                    value={formData.email}
                    disabled={true}
                    placeholder={lang.fields.email}
                />
            </div>

            <div className="form-group">
                <label className="form-label">{lang.fields.phone}</label>
                <input
                    type="tel"
                    className={`form-input ${!isEditing ? 'input-disabled' : ''}`}
                    value={formData.phone_number}
                    onChange={(e) => onFormChange('phone_number', e.target.value)}
                    disabled={!isEditing}
                    placeholder={lang.fields.phonePlaceholder}
                />
            </div>

            {isArtist && (
                <>
                    <div className="form-group">
                        <label className="form-label">{lang.fields.birthday}</label>
                        <input
                            type="date"
                            className={`form-input ${!isEditing ? 'input-disabled' : ''}`}
                            value={formData.date_birthday}
                            onChange={(e) => onFormChange('date_birthday', e.target.value)}
                            disabled={!isEditing}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">{lang.fields.biography}</label>
                        <textarea
                            className={`form-textarea ${!isEditing ? 'input-disabled' : ''}`}
                            value={formData.biography}
                            onChange={(e) => onFormChange('biography', e.target.value)}
                            disabled={!isEditing}
                            placeholder={lang.fields.biographyPlaceholder}
                            rows={6}
                        />
                    </div>
                </>
            )}
        </>
    );
});

export default ProfileForm;