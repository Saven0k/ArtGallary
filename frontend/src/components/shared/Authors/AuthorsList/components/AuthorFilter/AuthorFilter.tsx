
import { useEffect, useState } from "react";
import "./AuthorFilter.scss";
import { authorsTranslations } from "../../lang";
import { useLanguage } from "../../../../../../hooks/useLanguage";
import { getAllProfessions, type Profession } from "../../../../../../api/professions/main.api";

export interface AuthorFilterProps {
    activeProfession: Profession | null;
    onChange: (profession: Profession | null) => void;
}

const AuthorFilter = ({ activeProfession, onChange }: AuthorFilterProps) => {
    const { language } = useLanguage();
    const t = authorsTranslations[language].filter;
    const [professions, setProfessions] = useState<Profession[]>([]);

    useEffect(() => {
        let active = true;
        const getProfessions = async () => {
            const data = await getAllProfessions();
            if (active) setProfessions(data || []);
        };
        getProfessions();
        return () => { active = false; };
    }, [language]);

    return (
        <aside className="filter" aria-label={t.title}>
            <h3 className="filter__title">{t.title}</h3>
            <ul className="filter__list">
                <li key="all" className="filter__option">
                    <label className="filter__item" htmlFor="profession-all">
                        <input
                            type="radio"
                            checked={activeProfession === null}
                            onChange={() => onChange(null)}
                            name="profession"
                            id="profession-all"
                            className="filter__radio"
                        />
                        <span className="filter__label">
                            {t.all}
                        </span>
                    </label>
                </li>

                {professions.map((profession) => (
                    <li key={profession.id} className="filter__option">
                        <label className="filter__item" htmlFor={`profession-${profession.id}`}>
                            <input
                                type="checkbox"
                                checked={activeProfession?.id === profession.id}
                                onChange={() => onChange(profession)}
                                name="profession"
                                id={`profession-${profession.id}`}
                                className="filter__radio"
                            />
                            <span className="filter__label">
                                {profession.name}
                            </span>
                        </label>
                    </li>
                ))}
            </ul>
        </aside>
    );
};

export default AuthorFilter;
