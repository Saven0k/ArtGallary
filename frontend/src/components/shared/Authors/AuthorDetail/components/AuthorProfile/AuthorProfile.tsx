// AuthorInfo.tsx
import type { AuthorProfileResponse } from "../../../../../../api/authors/main.api";
import "./AuthorInfo.scss";
import Human from "./icons/human.svg";
import { useState } from "react";
import { useLanguage } from "../../../../../../hooks/useLanguage";
import { authorTranslations } from "../../lang";

export interface AuthorProfileProps {
    author: AuthorProfileResponse;
}

const AuthorProfile = ({ author }: AuthorProfileProps) => {
    const { language } = useLanguage();
    const t = authorTranslations[language].profile;
    const [isExpanded, setIsExpanded] = useState<boolean>(false);
    const [activeTab, setActiveTab] = useState<'about' | 'system'>('about');

    const toggleReadMore = () => {
        setIsExpanded(!isExpanded);
    };

    const formatDate = (dateString: string | undefined) => {
        if (!dateString) return '—';
        const date = new Date(dateString);
        return date.toLocaleDateString(language === 'ru' ? 'ru-RU' : language === 'en' ? 'en-US' : 'zh-CN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    };

    return (
        <div className="author-profile">
            <div className="author-profile__container">
                <img
                    src={author.avatar_path || "/default-avatar.png"}
                    alt={author.name}
                    className="author-profile__avatar"
                />
                <div className="author-profile__body">
                    <div className="author-profile__top">
                        <div className="author-profile__text">
                            <h2 className="author-profile__name">
                                {author.surname} {author.name}
                            </h2>
                            <span className="author-profile__location">
                                {author.city?.name_ru || author.city?.name_en}, {author.country?.name_ru || author.country?.name_en}
                            </span>
                        </div>
                        <p className="author-profile__followers">
                            <img src={Human} alt="Human" className="author-profile__followers-icon" />
                            {author.authorProfile?.followers_count || 0}
                            {t.followers}
                        </p>
                    </div>

                    <div className="author-profile__bottom">
                        <div className="author-profile__sections">
                            <button
                                className={`author-profile__sections-item ${
                                    activeTab === 'about' ? 'author-profile__sections-item--active' : ''
                                }`}
                                onClick={() => setActiveTab('about')}
                            >
                                {t.about}
                            </button>
                            <button
                                className={`author-profile__sections-item ${
                                    activeTab === 'system' ? 'author-profile__sections-item--active' : ''
                                }`}
                                onClick={() => setActiveTab('system')}
                            >
                                {t.system}
                            </button>
                        </div>

                        {activeTab === 'about' ? (
                            <div className="author-profile__bio">
                                <p className={`author-profile__bio-text ${isExpanded ? "author-profile__bio-text--expanded" : ""}`}>
                                    {author.authorProfile?.biography || t.noBio}
                                </p>
                                {author.authorProfile?.biography && (
                                    <button
                                        className="author-profile__read-more"
                                        onClick={toggleReadMore}
                                        aria-expanded={isExpanded}
                                    >
                                        {isExpanded ? t.collapse : t.readMore}
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="author-profile__system-info">
                                <div className="author-profile__system-item">
                                    <span className="author-profile__system-label">{t.moderationStatus}</span>
                                    <span className={`author-profile__system-value author-profile__system-value--${author.authorProfile?.moderate?.moderate ? 'approved' : 'pending'}`}>
                                        {author.authorProfile?.moderate?.moderate ? t.moderationApproved : t.moderationPending}
                                    </span>
                                </div>
                                <div className="author-profile__system-item">
                                    <span className="author-profile__system-label">{t.memberSince}</span>
                                    <span className="author-profile__system-value">
                                        {formatDate(author.authorProfile.createdAt || author.authorProfile?.createdAt)}
                                    </span>
                                </div>
                                {author.authorProfile?.moderate?.moderated_at && (
                                    <div className="author-profile__system-item">
                                        <span className="author-profile__system-label">{t.moderationDate}</span>
                                        <span className="author-profile__system-value">
                                            {formatDate(author.authorProfile.moderate.moderated_at)}
                                        </span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthorProfile;