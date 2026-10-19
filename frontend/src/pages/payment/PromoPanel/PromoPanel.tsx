import "./PromoPanel.scss";
import { useLanguage } from "../../../hooks/useLanguage";
import { cartTranslations } from "../../../components/shared/ProfileScreen/CartSection/lang";


const PromoPanel = () => {
    const { language } = useLanguage();
    const t = cartTranslations[language].promo;
    return (
        <div className="promo">
            <input type="text" placeholder={t.placeholder} className="promo__input" />
            <button className="promo__button">{t.apply}</button>
        </div>
     );
}

export default PromoPanel;