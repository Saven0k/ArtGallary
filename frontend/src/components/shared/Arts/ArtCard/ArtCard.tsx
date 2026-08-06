// ArtCard.tsx
import type { Art } from "../../../../api/arts/main.api";
import "./ArtCard.scss";
import LikeIcon from "./icons/like.svg";
import CartIcon from "./icons/cart.svg";
import { useState } from "react";
import { useLanguage } from "../../../../hooks/useLanguage";
import { artCardTranslations } from "./lang";

export interface ArtCardProps {
    art_id: number;
    art: Art;
}

const ArtCard = ({ art_id, art }: ArtCardProps) => {
    const { language } = useLanguage();
    const t = artCardTranslations[language];
    const [isLiked, setIsLiked] = useState<boolean>(false);

    const handleLike = () => {
        // TODO: логика лайка
        setIsLiked(!isLiked);
        console.log("Like toggled for art:", art_id);
    };

    const handleAddToCart = () => {
        // TODO: логика добавления в корзину
        console.log("Added to cart:", art_id);
    };

    return (
        <article className="art-card">
            <div className="art-card__image-wrapper">
                <img
                    src={art.image_path}
                    alt={art.title}
                    className="art-card__image"
                />
            </div>

            <div className="art-card__content">
                <div className="art-card__top">
                    <span className="art-card__price">
                        {art.cost ? `${art.cost} ${art.currency || ''}` : t.priceOnRequest}
                    </span>
                    <span className="art-card__title">{art.title}</span>
                    <span className="art-card__author">
                        {art.artist?.user?.surname} {art.artist?.user?.name}
                    </span>
                    <span className="art-card__materials">{art.specifications || t.noSpecs}</span>
                </div>

                <div className="art-card__actions">
                    <button
                        className={`art-card__like-btn ${isLiked ? 'art-card__like-btn--active' : ''}`}
                        onClick={handleLike}
                        aria-label={t.like}
                    >
                        <img src={LikeIcon} alt={t.like} className="art-card__icon" />
                    </button>

                    <button
                        className="art-card__cart-btn"
                        onClick={handleAddToCart}
                        aria-label={t.addToCart}
                    >
                        <img src={CartIcon} alt={t.addToCart} className="art-card__icon" />
                    </button>
                </div>
            </div>
        </article>
    );
};

export default ArtCard;