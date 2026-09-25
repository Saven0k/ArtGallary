// src/components/shared/Admin/sections/Authors/AuthorViewModal.tsx
import { X, User as UserIcon } from 'lucide-react';
import { useLanguage } from '../../../../../hooks/useLanguage';
import { adminTranslations } from '../../../../../pages/admin/lang';
import type { AuthorProfileResponse } from '../../../../../api/authors/main.api';
import { authorsTranslations } from './lang';
import './AuthorViewModal.scss';

interface AuthorViewModalProps {
    author: AuthorProfileResponse;
    onClose: () => void;
}

const AuthorViewModal = ({ author, onClose }: AuthorViewModalProps) => {
    const { language } = useLanguage();
    const t = authorsTranslations[language];
    const common = adminTranslations[language].common;
    const p = author.authorProfile;

    const notSpecified = t.viewModal.notSpecified;

    return (
        <div className="author-view-overlay" onClick={onClose}>
            <div
                className="author-view"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
            >
                <header className="author-view__header">
                    <h3>{t.viewModal.title}</h3>
                    <button type="button" onClick={onClose}>
                        <X size={20} />
                    </button>
                </header>

                <div className="author-view__profile">
                    <div className="author-view__avatar">
                        {p?.avatar_path ? (
                            <img src={p.avatar_path} alt={author.name} />
                        ) : (
                            <UserIcon size={32} />
                        )}
                    </div>

                    <div>
                        <h4>
                            {author.name} {author.surname}
                        </h4>
                        <p>{author.email}</p>
                    </div>
                </div>

                <dl className="author-view__list">
                    <div>
                        <dt>{t.viewModal.profession}</dt>
                        <dd>{p?.profession?.name ?? notSpecified}</dd>
                    </div>
                    <div>
                        <dt>{t.viewModal.country}</dt>
                        <dd>
                            {author.country?.name_ru ??
                                author.country?.name_en ??
                                notSpecified}
                        </dd>
                    </div>
                    <div>
                        <dt>{t.viewModal.city}</dt>
                        <dd>
                            {author.city?.name_ru ??
                                author.city?.name_en ??
                                notSpecified}
                        </dd>
                    </div>
                    <div>
                        <dt>{t.viewModal.birthday}</dt>
                        <dd>{author.date_birthday ?? notSpecified}</dd>
                    </div>
                    <div>
                        <dt>{t.viewModal.gender}</dt>
                        <dd>
                            {author.gender === 'M'
                                ? t.form.gender.male
                                : author.gender === 'F'
                                ? t.form.gender.female
                                : notSpecified}
                        </dd>
                    </div>
                    <div>
                        <dt>{t.viewModal.registeredAt}</dt>
                        <dd>
                            {p?.createdAt
                                ? new Date(p.createdAt).toLocaleDateString()
                                : notSpecified}
                        </dd>
                    </div>

                    <div>
                        <dt>{t.viewModal.plan}</dt>
                        <dd>
                            {p?.plan ?? 'free'}{' '}
                            {p?.isSubscriptionActive
                                ? `· ${t.viewModal.planActive}`
                                : ''}
                        </dd>
                    </div>
                    <div>
                        <dt>{t.viewModal.planExpires}</dt>
                        <dd>
                            {p?.planExpiresAt
                                ? new Date(p.planExpiresAt).toLocaleDateString()
                                : notSpecified}
                        </dd>
                    </div>

                    <div>
                        <dt>{t.viewModal.works}</dt>
                        <dd>{p?.artsCount ?? 0}</dd>
                    </div>
                    <div>
                        <dt>{t.viewModal.likes}</dt>
                        <dd>{p?.totalLikes ?? 0}</dd>
                    </div>
                    <div>
                        <dt>{t.viewModal.followers}</dt>
                        <dd>{p?.followers_count ?? 0}</dd>
                    </div>
                </dl>

                {p?.biography && (
                    <div className="author-view__bio">
                        <h4>{t.viewModal.biography}</h4>
                        <p>{p.biography}</p>
                    </div>
                )}

                <div className="author-view__actions">
                    <button
                        type="button"
                        className="author-view__btn author-view__btn--secondary"
                        onClick={onClose}
                    >
                        {common.cancel}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AuthorViewModal;