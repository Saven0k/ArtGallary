import { useState } from "react";
import "./AuthorsPage.scss";
import { useLanguage } from "../../../hooks/useLanguage";
import type { Profession } from "../../../api/professions/main.api";
import { authorsTranslations } from "../../../components/shared/Authors/AuthorsList/lang";
import AuthorFilter from "../../../components/shared/Authors/AuthorsList/components/AuthorFilter/AuthorFilter";
import AuthorList from "../../../components/shared/Authors/AuthorsList/AuthorsList";
import Navigation from "../../../components/layout/Navigation/Navigation";

const AuthorsPage = () => {
    const { language } = useLanguage();
    const t = authorsTranslations[language].page;
    const [activeProfession, setActiveProfession] = useState<Profession | null>(null);

    return (
        <main className="authors-page">
            <Navigation />
            <div className="authors-page__container">
                <header className="authors-page__header">
                    <h2 className="authors-page__title">{t.title}</h2>
                </header>

                <div className="authors-page__content">
                    <aside className="authors-page__sidebar">
                        <AuthorFilter
                            activeProfession={activeProfession}
                            onChange={setActiveProfession}
                        />
                    </aside>

                    <section className="authors-page__list">
                        <AuthorList filter={activeProfession?.name || ""} />
                    </section>
                </div>
            </div>
        </main>
    );
};

export default AuthorsPage;