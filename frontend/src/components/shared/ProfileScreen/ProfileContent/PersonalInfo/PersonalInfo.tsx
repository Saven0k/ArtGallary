import { useLanguage } from "../../../../../hooks/useLanguage";
import { profileTranslations } from "../../lang";
import "./PersonalInfo.css";

const PersonalInfo = () => {
    const { language } = useLanguage();
    const t = profileTranslations[language].personalInfo;
    const f = t.fields;
    const p = t.placeholders;

    return (
        <section className="personal-info">
            <header className="personal-info__header">
                <h2 className="personal-info__title">{t.title}</h2>
                <p className="personal-info__subtitle">{t.subtitle}</p>
            </header>

            <form className="personal-info__form">
                <div className="personal-info__grid">
                    <div className="personal-info__field">
                        <label>{f.name}</label>
                        <input type="text" placeholder={p.name} />
                    </div>

                    <div className="personal-info__field">
                        <label>{f.surname}</label>
                        <input type="text" placeholder={p.surname} />
                    </div>

                    <div className="personal-info__field">
                        <label>{f.secondName}</label>
                        <input type="text" placeholder={p.secondName} />
                    </div>

                    <div className="personal-info__field">
                        <label>{f.birthday}</label>
                        <input type="date" />
                    </div>

                    <div className="personal-info__field">
                        <label>{f.country}</label>
                        <select>
                            <option>Россия</option>
                        </select>
                    </div>

                    <div className="personal-info__field">
                        <label>{f.city}</label>
                        <select>
                            <option>Москва</option>
                        </select>
                    </div>

                    <div className="personal-info__field">
                        <label>{f.phone}</label>
                        <input type="tel" placeholder={p.phone} />
                    </div>

                    <div className="personal-info__field">
                        <label>{f.email}</label>
                        <input type="email" placeholder={p.email} />
                    </div>
                </div>

                <div className="personal-info__field">
                    <label>{f.about}</label>
                    <textarea rows={6} placeholder={p.about} />
                </div>

                <button className="personal-info__button" type="submit">
                    {t.button}
                </button>
            </form>
        </section>
    );
};

export default PersonalInfo;