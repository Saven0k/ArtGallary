// src/pages/Author/components/AuthorHeader/AuthorHeader.tsx
import { useEffect, useState } from 'react';
import type { AuthorProfileResponse } from '../../../../../api/authors/main.api';
import {
    checkFollow,
    toggleFollow,
} from '../../../../../api/authors/main.api';
import { useLanguage } from '../../../../../hooks/useLanguage';
import { useAuth } from '../../../../../hooks/useAuth';
import { authorTranslations } from '../lang';
import AuthRequiredModal from '../AuthRequiredModal/AuthRequiredModal';
import arrow from './icons/Arrow.svg';
import './AuthorHeader.scss';

export interface AuthorHeaderProps {
    author: AuthorProfileResponse;
}

const AuthorHeader = ({ author }: AuthorHeaderProps) => {
    const { language } = useLanguage();
    const t = authorTranslations[language].header;
    const { user } = useAuth();

    const [isBioExpanded, setIsBioExpanded] = useState(false);
    const [isFollowing, setIsFollowing] = useState(false);
    const [followersCount, setFollowersCount] = useState(
        author.authorProfile?.followers_count || 0,
    );
    const [loadingFollow, setLoadingFollow] = useState(false);
    const [authModalOpen, setAuthModalOpen] = useState(false);

    // проверяем подписку только для авторизованных
    useEffect(() => {
        if (!user) {
            setIsFollowing(false);
            return;
        }

        let alive = true;
        (async () => {
            const res = await checkFollow(author.id);
            if (alive && res) setIsFollowing(res.is_following);
        })();

        return () => {
            alive = false;
        };
    }, [author.id, user]);

    const toggleBio = () => setIsBioExpanded((v) => !v);

    const handleSubscribe = async () => {
        // гость → модалка, без запросов
        if (!user) {
            setAuthModalOpen(true);
            return;
        }

        if (loadingFollow) return;

        setLoadingFollow(true);

        const prev = isFollowing;
        const prevCount = followersCount;

        // оптимистично
        setIsFollowing(!prev);
        setFollowersCount(prevCount + (prev ? -1 : 1));

        const res = await toggleFollow(author.id);

        if (!res) {
            setIsFollowing(prev);
            setFollowersCount(prevCount);
        } else {
            setIsFollowing(res.is_following);
            setFollowersCount(res.followers_count);
        }

        setLoadingFollow(false);
    };

    return (
        <div className="author-header">
            <div className="author-header__top">
                <div className="author-header__info">
                    <img
                        src={
                            author.authorProfile?.avatar_path ||
                            '/default-avatar.png'
                        }
                        alt={author.name}
                        className="author-header__avatar"
                    />

                    <div className="author-header__text">
                        <h1 className="author-header__name">
                            {author.surname} {author.name}
                        </h1>

                        <span className="author-header__location">
                            {author.city?.name_ru || author.city?.name_en},{' '}
                            {author.country?.name_ru || author.country?.name_en}
                        </span>

                        <button
                            type="button"
                            className="author-header__read-more"
                            onClick={toggleBio}
                            aria-expanded={isBioExpanded}
                        >
                            {isBioExpanded ? t.collapse : t.readMore}
                            <img
                                src={arrow}
                                alt=""
                                className={`author-header__read-more-icon ${
                                    isBioExpanded
                                        ? 'author-header__read-more-icon--rotated'
                                        : ''
                                }`}
                            />
                        </button>
                    </div>
                </div>

                <button
                    type="button"
                    className={`author-header__subscribe-btn ${
                        isFollowing
                            ? 'author-header__subscribe-btn--active'
                            : ''
                    }`}
                    onClick={handleSubscribe}
                    disabled={loadingFollow}
                >
                    {isFollowing ? t.subscribed : t.subscribe}
                </button>
            </div>

            {authModalOpen && (
                <AuthRequiredModal
                    title={t.authRequiredTitle}
                    text={t.authRequiredText}
                    loginLabel={t.authRequiredLogin}
                    cancelLabel={t.authRequiredCancel}
                    redirectTo={window.location.pathname}
                    onClose={() => setAuthModalOpen(false)}
                />
            )}
        </div>
    );
};

export default AuthorHeader;