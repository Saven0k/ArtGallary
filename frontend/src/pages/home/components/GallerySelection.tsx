import { Link } from 'react-router-dom';
import { translations } from '../lang';
import './GallerySelection.scss';
import { useLanguage } from '../../../hooks/useLanguage';

import Photo1 from "../images/photo1.png"
import LikeIcon from "../icons/like.svg"
import CartIcon from "../icons/cart.svg"
interface Artwork {
    id: number;
    image: string;
    artistName: string;
    title: string;
    materials: string;
}

const artworksData: Artwork[] = [
    {
        id: 1,
        image: Photo1,
        artistName: 'Тилинина Маргарита',
        title: 'Лилии',
        materials: 'Масло, 50х70'
    },
    {
        id: 2,
        image: Photo1,
        artistName: 'Тилинина Маргарита',
        title: 'Лилии',
        materials: 'Масло, 50х70'
    },
    {
        id: 3,
        image: Photo1,
        artistName: 'Тилинина Маргарита',
        title: 'Лилии',
        materials: 'Масло, 50х70'
    },
];

const GallerySelection = () => {
    const { language } = useLanguage();
    const t = translations[language].home.gallery;

    return (
        <section className="gallery-selection">
            <h2 className="gallery-selection__title">{t.title}</h2>
            <ul className="gallery-selection__list">
                {artworksData.map((item) => (
                    <li key={item.id} className="gallery-selection__item">
                        <div className="gallery-selection__item-image">
                            <img src={item.image} alt={item.title} className="gallery-selection__item-image__img" />
                        </div>
                        <div className="gallery-selection__item-info">
                            <div className="gallery-selection__item-details">
                                <span className="gallery-selection__item-artist">{item.artistName}</span>
                                <span className="gallery-selection__item-title">{item.title}</span>
                                <span className="gallery-selection__item-materials">{item.materials}</span>
                            </div>
                            <button className="gallery-selection__item-like" aria-label="Нравится">
                                <img src={LikeIcon} alt="Like" className="gallery-selection__item-like__img" />
                            </button>
                            <button className="gallery-selection__item-cart" aria-label="Купить">
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