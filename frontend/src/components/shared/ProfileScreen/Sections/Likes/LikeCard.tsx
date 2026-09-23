// src/components/LikeCard/LikeCard.tsx
import { useState } from 'react';
import type { Art } from '../../../../../api/arts/main.api';
import { BASE_URL_API } from '../../../../../api/main.api';
import { HeartIcon } from './HeartIcon';
import { likesTranslations } from '../Likes/lang';

interface LikeCardProps {
    art: Art;
    onUnlike: () => void;
    t: typeof likesTranslations['ru']['likes'];
}

const LikeCard = ({ art, onUnlike, t }: LikeCardProps) => {
    const [isUnliking, setIsUnliking] = useState(false);

    const handleUnlike = async () => {
        if (isUnliking) return;
        setIsUnliking(true);
        await onUnlike();
        setIsUnliking(false);
    };

    const priceText =
        art.cost == null
            ? t.priceNotSpecified
            : `${new Intl.NumberFormat(t.locale).format(art.cost)} ${art.currency ?? t.currencySymbol}`;

    const authorName = art.author?.user
        ? `${art.author.user.name ?? ''} ${art.author.user.surname ?? ''}`.trim() || t.unknownAuthor
        : t.unknownAuthor;

    return (
        <article className="like-card">
            <div className="like-card__image-wrapper">
                <img
                    src={art.image_path}
                    alt={art.title}
                    className="like-card__image"
                    loading="lazy"
                />
            </div>

            <div className="like-card__body">
                <div className="like-card__info">
                    <span className="like-card__price">{priceText}</span>
                    <h3 className="like-card__title" title={art.title}>
                        {art.title}
                    </h3>
                    <p className="like-card__author">{authorName}</p>
                </div>

                <button
                    type="button"
                    className={`like-card__heart ${isUnliking ? 'is-loading' : ''}`}
                    onClick={handleUnlike}
                    aria-label={t.unlikeTooltip}
                    title={t.unlikeTooltip}
                >
                    <HeartIcon filled />
                </button>
            </div>
        </article>
    );
};

export default LikeCard;