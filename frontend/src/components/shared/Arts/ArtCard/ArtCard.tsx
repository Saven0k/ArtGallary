
import type { Art } from "../../../../api/arts/main.api";
import "./ArtCard.scss";
import LikeIcon from "./icons/like.svg";
import CartIcon from "./icons/cart.svg";
import { useEffect, useRef, useState } from "react";
import { useLanguage } from "../../../../hooks/useLanguage";
import { artCardTranslations } from "./lang";
import { Link } from "react-router-dom";
import { useNotification } from "../../../../hooks/useNotification";
import { useLikes } from "../../../../hooks/useLikes";
import { useCart } from "../../../../hooks/useCart";

export interface ArtCardProps {
    art_id: number;
    art: Art;
}

const ArtCard = ({ art_id, art }: ArtCardProps) => {
    const { language } = useLanguage();
    const t = artCardTranslations[language];

    const { isArtLiked, toggleLikeArt, loading } = useLikes();
    const { isInCart, addToCart } = useCart();
    const { showNotification } = useNotification();
    const isLiked = isArtLiked(art_id);
    const inCart = isInCart(art_id);
    const [busy, setBusy] = useState(false);
    const [likesCount, setLikesCount] = useState(art.likes ?? 0);
    const previousLiked = useRef(isLiked);
    const wasLoading = useRef(loading);
    useEffect(() => {
        if (!loading && !wasLoading.current && previousLiked.current !== isLiked) {
            setLikesCount((count) => Math.max(0, count + (isLiked ? 1 : -1)));
        }
        previousLiked.current = isLiked;
        wasLoading.current = loading;
    }, [isLiked, loading]);
    const handleLike = async () => {
        if (busy || loading) return;
        setBusy(true);
        if (!await toggleLikeArt(art_id)) showNotification('Не удалось изменить избранное', 'error');
        setBusy(false);
    };
    const handleAddToCart = async () => {
        if (busy || loading || inCart) return;
        setBusy(true);
        if (!await addToCart(art_id)) showNotification('Не удалось добавить работу в корзину', 'error');
        setBusy(false);
    };

    return (
        <article className="art-card">
            <Link to={`/arts/${art_id}`} className="art-card__image-wrapper">
                <img
                    src={art.image_path}
                    alt={art.title}
                    className="art-card__image"
                />
            </Link>

            <div className="art-card__content">
                <div className="art-card__top">
                    <span className="art-card__price">
                        {art.cost ? `${art.cost} ${art.currency || ''}` : t.priceOnRequest}
                    </span>
                    <span className="art-card__title">{art.title}</span>
                    <span className="art-card__author">
                        {art.author?.user?.surname} {art.author?.user?.name}
                    </span>
                    <span className="art-card__materials">{art.specifications || t.noSpecs}</span>
                </div>

                <div className="art-card__actions">
                    <button
                        className={`art-card__like-btn ${isLiked ? 'art-card__like-btn--active' : ''}`}
                        onClick={handleLike}
                        disabled={busy || loading}
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
                        disabled={busy || loading || inCart}
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