import { Link } from 'react-router-dom';
import { translations } from '../lang';
import './Consultation.scss';
import { useLanguage } from '../../../hooks/useLanguage';
import ArrowIcon from "../icons/arrowCirclce.svg"

const Consultation = () => {
    const { language } = useLanguage();
    const t = translations[language].home.consultation;

    return (
        <section className="consultation">
            <div className="consultation__content">
                <h2 className="consultation__title">{t.title}</h2>
                <p className="consultation__subtitle">{t.subtitle}</p>
            </div>
            <Link to="/consultation" className="consultation__button">
                {t.button}
                <img src={ArrowIcon} alt="SVG ICON" className="consultation__button-icon" />
            </Link>
        </section>
    );
};

export default Consultation;