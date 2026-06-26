import { useState } from 'react';
import { useLanguage } from '../../../context/LanguageContext';
import { ageVerificationModalTranslations } from './lang';
import './AgeVerificationModal.css';

interface AgeVerificationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    onFail: () => void;
}

export const AgeVerificationModal = ({ isOpen, onClose, onSuccess, onFail }: AgeVerificationModalProps) => {
    const { language } = useLanguage();
    const lang = ageVerificationModalTranslations[language];
    
    const [birthDate, setBirthDate] = useState('');
    const [error, setError] = useState('');

    const checkAge = (dateString: string): boolean => {
        const birth = new Date(dateString);
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return age >= 18;
    };

    const handleSubmit = () => {
        if (!birthDate) {
            setError(lang.errors.emptyBirthDate);
            return;
        }

        const isAdult = checkAge(birthDate);
        if (isAdult) {
            setError('');
            onSuccess();
            onClose();
        } else {
            setError(lang.errors.underAge);
            onFail();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="age-modal__overlay" onClick={onClose}>
            <div className="age-modal__content" onClick={(e) => e.stopPropagation()}>
                <div className="age-modal__icon">🔞</div>
                <h2 className="age-modal__title">{lang.title}</h2>
                <p className="age-modal__description">
                    {lang.description}
                </p>
                <div className="age-modal__input-group">
                    <label className="age-modal__label">{lang.label}</label>
                    <input
                        type="date"
                        className={`age-modal__input ${error ? 'age-modal__input--error' : ''}`}
                        value={birthDate}
                        onChange={(e) => {
                            setBirthDate(e.target.value);
                            setError('');
                        }}
                        max={new Date().toISOString().split('T')[0]}
                    />
                    {error && <span className="age-modal__error">{error}</span>}
                </div>
                <div className="age-modal__buttons">
                    <button className="age-modal__btn age-modal__btn--cancel" onClick={onClose}>
                        {lang.buttons.cancel}
                    </button>
                    <button className="age-modal__btn age-modal__btn--confirm" onClick={handleSubmit}>
                        {lang.buttons.confirm}
                    </button>
                </div>
            </div>
        </div>
    );
};