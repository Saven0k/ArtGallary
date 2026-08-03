import "./HelpSidebar.css";
import { translations } from "../lang";
import BookIcon from "../icons/book.svg"
import ChatIcon from "../icons/chat.svg"
import { useLanguage } from "../../../hooks/useLanguage";

const HelpSidebar = () => {
    const { language } = useLanguage();
    const t = translations[language].help.sidebar;

    return (
        <div className="help-sidebar">
            <article className="help-sidebar__card">
                <div className="help-sidebar__icon">
                    <img src={BookIcon} alt="Svg icon" className="help-sidebar__svg" />
                </div>
                <div className="help-sidebar__content">
                    <h4 className="help-sidebar__title">{t.knowledge.title}</h4>
                    <p className="help-sidebar__description">{t.knowledge.description}</p>
                </div>
            </article>

            <article className="help-sidebar__card">
                <div className="help-sidebar__icon">
                    <img src={ChatIcon} alt="Svg icon" className="help-sidebar__svg" />
                </div>
                <div className="help-sidebar__content">
                    <h4 className="help-sidebar__title">{t.support.title}</h4>
                    <p className="help-sidebar__description">{t.support.description}</p>
                </div>
            </article>
        </div>
    );
};

export default HelpSidebar;