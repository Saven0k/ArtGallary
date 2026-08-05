// AuthorHeader.tsx
import type { AuthorProfileResponse } from "../../../../../../api/authors/main.api";
import "./AuthorHeader.scss";
import arrow from "./icons/Arrow.svg";
import { useState } from "react";
import { useLanguage } from "../../../../../../hooks/useLanguage";
import { authorTranslations } from "../../lang";

export interface AuthorHeaderProps {
    author: AuthorProfileResponse;
}

const AuthorHeader = ({ author }: AuthorHeaderProps) => {
    const { language } = useLanguage();
    const t = authorTranslations[language].header;
    const [isBioExpanded, setIsBioExpanded] = useState<boolean>(false);

    const toggleBio = () => {
        setIsBioExpanded(!isBioExpanded);
    };

    const handleSubscribe = () => {
        // TODO: логика подписки
        console.log("Subscribe to author:", author.id);
    };

    const followersCount = author.authorProfile?.followers_count || 0;
    const worksCount = author.authorProfile?.arts?.length || 0;

    return (
        <div className="author-header">
            <div className="author-header__top">
                <div className="author-header__info">
                    <img
                        src={author.avatar_path || "/default-avatar.png"}
                        alt={author.name}
                        className="author-header__avatar"
                    />
                    <div className="author-header__text">
                        <h1 className="author-header__name">
                            {author.surname} {author.name}
                        </h1>
                        <span className="author-header__location">
                            {author.city?.name_ru || author.city?.name_en}, {author.country?.name_ru || author.country?.name_en}
                        </span>
                        <p
                            className={`author-header__bio ${
                                isBioExpanded ? "author-header__bio--expanded" : ""
                            }`}
                        >
                            {author.authorProfile?.biography}
                        </p>
                        <button
                            className="author-header__read-more"
                            onClick={toggleBio}
                            aria-expanded={isBioExpanded}
                        >
                            {isBioExpanded ? t.collapse : t.readMore}
                            <img
                                src={arrow}
                                alt={isBioExpanded ? t.collapse : t.readMore}
                                className={`author-header__read-more-icon ${
                                    isBioExpanded ? "author-header__read-more-icon--rotated" : ""
                                }`}
                            />
                        </button>
                    </div>
                </div>

                <button
                    className="author-header__subscribe-btn"
                    onClick={handleSubscribe}
                >
                    {t.subscribe}
                </button>
            </div>

            <div className="author-header__actions">
                <button className="author-header__action-btn author-header__action-btn--profile">
                    {t.profile}
                </button>
                <button className="author-header__action-btn">
                    {t.allWorks} ({worksCount})
                </button>
            </div>
        </div>
    );
};

export default AuthorHeader;