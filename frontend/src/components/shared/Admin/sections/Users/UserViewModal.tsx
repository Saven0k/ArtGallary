// src/components/shared/Admin/sections/Users/UserViewModal.tsx
import { X, User as UserIcon } from 'lucide-react';
import { useLanguage } from '../../../../../hooks/useLanguage';
import { adminTranslations } from '../../../../../pages/admin/lang';
import type { User } from '../../../../../api/users/main.api';
import { usersTranslations } from './lang';
import './UserViewModal.scss';

interface UserViewModalProps {
    user: User;
    onClose: () => void;
}

const UserViewModal = ({ user, onClose }: UserViewModalProps) => {
    const { language } = useLanguage();
    const t = usersTranslations[language];
    const common = adminTranslations[language].common;
    const notSpecified = t.viewModal.notSpecified;

    return (
        <div className="user-view-overlay" onClick={onClose}>
            <div
                className="user-view"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
            >
                <header className="user-view__header">
                    <h3>{t.viewModal.title}</h3>
                    <button type="button" onClick={onClose}>
                        <X size={20} />
                    </button>
                </header>

                <div className="user-view__profile">
                    <div className="user-view__avatar">
                        {user.authorProfile?.avatar_path ? (
                            <img
                                src={user.authorProfile.avatar_path}
                                alt={user.name}
                            />
                        ) : (
                            <UserIcon size={32} />
                        )}
                    </div>

                    <div>
                        <h4>
                            {user.name} {user.surname}
                        </h4>
                        <p>{user.email}</p>
                    </div>
                </div>

                <dl className="user-view__list">
                    <div>
                        <dt>{t.viewModal.role}</dt>
                        <dd>
                            <span className={`users-section__role users-section__role--${user.role}`}>
                                {t.roles[user.role] ?? user.role}
                            </span>
                        </dd>
                    </div>
                    <div>
                        <dt>{t.viewModal.country}</dt>
                        <dd>
                            {user.country?.name_ru ??
                                user.country?.name_en ??
                                notSpecified}
                        </dd>
                    </div>
                    <div>
                        <dt>{t.viewModal.city}</dt>
                        <dd>
                            {user.city?.name_ru ??
                                user.city?.name_en ??
                                notSpecified}
                        </dd>
                    </div>
                    <div>
                        <dt>{t.viewModal.birthday}</dt>
                        <dd>{user.date_birthday ?? notSpecified}</dd>
                    </div>
                    <div>
                        <dt>{t.viewModal.gender}</dt>
                        <dd>
                            {user.gender === 'M'
                                ? t.form.gender.male
                                : user.gender === 'F'
                                ? t.form.gender.female
                                : notSpecified}
                        </dd>
                    </div>
                    <div>
                        <dt>{t.viewModal.registeredAt}</dt>
                        <dd>
                            {user.createdAt
                                ? new Date(user.createdAt).toLocaleString()
                                : notSpecified}
                        </dd>
                    </div>
                    <div>
                        <dt>{t.viewModal.updatedAt}</dt>
                        <dd>
                            {user.updatedAt
                                ? new Date(user.updatedAt).toLocaleString()
                                : notSpecified}
                        </dd>
                    </div>
                </dl>

                <div className="user-view__actions">
                    <button
                        type="button"
                        className="user-view__btn user-view__btn--secondary"
                        onClick={onClose}
                    >
                        {common.cancel}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UserViewModal;