// src/pages/Authors/components/AuthorFilter/AuthorFilter.tsx
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
        const getProfessions = async () => {
            const data = await getAllProfessions();
            setProfessions(data || []);
        };
        getProfessions();
    }, []);

    return (
        <aside className="filter" aria-label={t.title}>
            <h3 className="filter__title">{t.title}</h3>
            <ul className="filter__list">
                <li key="all" className="filter__item">
                    <input
                        type="radio"
                        checked={activeProfession === null}
                        onChange={() => onChange(null)}
                        name="profession"
                        id="profession-all"
                        className="filter__radio"
                    />
                    <label htmlFor="profession-all" className="filter__label">
                        {t.all}
                    </label>
                </li>

                {professions.map((profession) => (
                    <li key={profession.id} className="filter__item">
                        <input
                            type="radio"
                            checked={activeProfession?.id === profession.id}
                            onChange={() => onChange(profession)}
                            name="profession"
                            id={`profession-${profession.id}`}
                            className="filter__radio"
                        />
                        <label
                            htmlFor={`profession-${profession.id}`}
                            className="filter__label"
                        >
                            {profession.name}
                        </label>
                    </li>
                ))}
            </ul>
        </aside>
    );
};

export default AuthorFilter;