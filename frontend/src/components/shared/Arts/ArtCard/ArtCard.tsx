// ArtCard.tsx
import type { Art } from "../../../../api/arts/main.api";
import "./ArtCard.scss";
import LikeIcon from "./icons/like.svg";
import CartIcon from "./icons/cart.svg";
import { useState } from "react";
import { useLanguage } from "../../../../hooks/useLanguage";
import { artCardTranslations } from "./lang";
import { useAuth } from "../../../../hooks/useAuth";
import { useLikes } from "../../../../hooks/useLikes";
import { useCart } from "../../../../hooks/useCart";

export interface ArtCardProps {
    art_id: number;
    art: Art;
}

const ArtCard = ({ art_id, art }: ArtCardProps) => {
    const { language } = useLanguage();
    const t = artCardTranslations[language];

    const { isAuthenticated } = useAuth();
    const { isArtLiked, toggleLikeArt } = useLikes();
    const { isInCart, addToCart } = useCart();
    
    const isLiked = isArtLiked(art_id);
    const inCart = isInCart(art_id);
    const [likesCount, setLikesCount] = useState<number>(art.likes || 0);

    const handleLike = () => {
        if (!isAuthenticated) {
            // Если не авторизован - сохраняем в localStorage
            toggleLikeArt(art_id);
            setLikesCount(prev => isLiked ? prev - 1 : prev + 1);
            return;
        }

        // Авторизован - TODO: API запрос
        toggleLikeArt(art_id);
        setLikesCount(prev => isLiked ? prev - 1 : prev + 1);
        console.log("Authenticated - like API for art:", art_id);
    };

    const handleAddToCart = () => {
        if (!isAuthenticated) {
            // Если не авторизован - сохраняем в localStorage
            addToCart(art_id);
            return;
        }

        // Авторизован - TODO: API запрос
        addToCart(art_id);
        console.log("Authenticated - add to cart API for art:", art_id);
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
                        {likesCount > 0 && (
                            <span className="art-card__likes-count">{likesCount}</span>
                        )}
                    </button>

                    <button
                        className={`art-card__cart-btn ${inCart ? 'art-card__cart-btn--active' : ''}`}
                        onClick={handleAddToCart}
                        aria-label={t.addToCart}
                    >
                        <img src={CartIcon} alt={t.addToCart} className="art-card__icon" />
                        {inCart && <span className="art-card__cart-check">✓</span>}
                    </button>
                </div>
            </div>
        </article>
    );
};

export default ArtCard;