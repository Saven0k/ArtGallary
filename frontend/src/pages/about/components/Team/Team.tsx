// src/pages/About/components/Team/Team.tsx
import { useLanguage } from "../../../../hooks/useLanguage";
import { translations } from "../../lang";
import "./Team.scss";

const Team = () => {
    const { language } = useLanguage();
    const t = translations[language].about.team;

    return (
        <section className="team">
            <div className="team__container">
                <h4 className="team__title">{t.title}</h4>
                <div className="team__grid">
                    {t.members.map((member, index) => (
                        <div key={index} className="team__member">
                            <div className="team__member-avatar">
                                <img
                                    src={member.image}
                                    alt={member.name}
                                    className="team__member-image"
                                />

                            </div>
                            <h3 className="team__member-name">{member.name}</h3>
                            <p className="team__member-role">{member.role}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Team;