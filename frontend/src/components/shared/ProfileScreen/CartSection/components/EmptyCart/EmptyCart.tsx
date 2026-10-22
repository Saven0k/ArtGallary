import { ShoppingBag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cartTranslations } from '../../lang';
import './EmptyCart.scss';
import type { Language } from '../../../../../../context/LanguageContext';

interface EmptyCartProps {
    language: Language;
}

const EmptyCart = ({ language }: EmptyCartProps) => {
    const t = cartTranslations[language];
    const navigate = useNavigate();

    return (
        <section className="profile-commerce empty-cart">
            <div className="empty-cart__icon">
                <ShoppingBag size={48} />
            </div>

            <h2 className="profile-commerce__title">{t.title}</h2>
            <p className="empty-cart__text">{t.empty}</p>

            <button type="button" className="empty-cart__btn" onClick={() => navigate('/arts')}>
                {t.emptyAction}
            </button>
        </section>
    );
};

export default EmptyCart;
