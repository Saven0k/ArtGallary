import { useLanguage } from '../../../hooks/useLanguage';
import { translations } from '../lang';
import './Advantage.scss';


const Advantages = () => {
    const { language } = useLanguage();
    const t = translations[language].home.advantages;

    return (
        <section className="advantages">
            <h2 className="advantages__title">{t.title}</h2>
            <ul className="advantages__list">
                {t.items.map((item, index) => (
                    <li key={index} className="advantages__item">
                        <img src={item.icon} alt="SVG icon" className="advantages__item-icon" />
                        <h4 className="advantages__item-title">{item.title}</h4>
                        <p className="advantages__item-description">{item.description}</p>
                    </li>
                ))}
            </ul>
        </section>
    );
};

export default Advantages;