import { Link } from 'react-router-dom';
import { translations } from '../lang';
import './GallerySelection.scss';
import { useLanguage } from '../../../hooks/useLanguage';
import { useEffect, useState } from 'react';
import { getTopArts, type Art } from '../../../api/arts/main.api';
import { useLikes } from '../../../hooks/useLikes';
import { useCart } from '../../../hooks/useCart';
import { useNotification } from '../../../hooks/useNotification';

import LikeIcon from "../icons/like.svg"
import CartIcon from "../icons/cart.svg"

const GallerySelection = () => {
    const { language } = useLanguage();
    const t = translations[language].home.gallery;
    const [artworks, setArtworks] = useState<Art[]>([]);
    const [busy, setBusy] = useState<number | null>(null);
    const { loading, isArtLiked, toggleLikeArt } = useLikes();
    const { isInCart, addToCart } = useCart();
    const { showNotification } = useNotification();
    useEffect(() => {
        let active = true;
        getTopArts(3, language).then((data) => { if (active) setArtworks(data ?? []); });
        return () => { active = false; };
    }, [language]);
    const mutate = async (id: number, operation: 'like' | 'cart') => {
        if (busy !== null || loading) return;
        setBusy(id);
        const success = operation === 'like' ? await toggleLikeArt(id) : await addToCart(id);
        if (!success) showNotification(language === 'ru' ? 'Не удалось сохранить изменение' : language === 'zh' ? '保存失败' : 'Could not save the change', 'error');
        setBusy(null);
    };

    return (
        <section className="gallery-selection">
            <h2 className="gallery-selection__title">{t.title}</h2>
            <ul className="gallery-selection__list">
                {artworks.map((item) => (
                    <li key={item.id} className="gallery-selection__item">
                        <Link to={`/arts/${item.id}`} className="gallery-selection__item-image">
                            <img src={item.image_path} alt={item.title} className="gallery-selection__item-image__img" />
                        </Link>
                        <div className="gallery-selection__item-info">
                            <div className="gallery-selection__item-details">
                                <span className="gallery-selection__item-author">{item.author?.user?.surname} {item.author?.user?.name}</span>
                                <span className="gallery-selection__item-title">{item.title}</span>
                                <span className="gallery-selection__item-materials">{item.specifications}</span>
                            </div>
                            <button className="gallery-selection__item-like" aria-label="Нравится" aria-pressed={isArtLiked(item.id)} disabled={loading || busy !== null} onClick={() => void mutate(item.id, 'like')}>
                                <img src={LikeIcon} alt="Like" className="gallery-selection__item-like__img" />
                            </button>
                            <button className="gallery-selection__item-cart" aria-label="Купить" disabled={loading || busy !== null || isInCart(item.id)} onClick={() => void mutate(item.id, 'cart')}>
                                <img src={CartIcon} alt="Go to cart" className="gallery-selection__item-like__img" />
                            </button>
                        </div>
                    </li>
                ))}
            </ul>
            <Link to="/arts" className="gallery-selection__link">{t.link}</Link>
        </section>
    );
};

export default GallerySelection;
