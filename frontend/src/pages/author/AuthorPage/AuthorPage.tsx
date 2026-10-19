
import { useParams } from "react-router-dom";
import ArtsList from "../../../components/shared/Arts/ArtsList/ArtsList";
import AuthorHeader from "../../../components/shared/Authors/AuthorDetail/AuthorHeader/AuthorHeader";
import { useEffect, useState } from "react";
import { getArtsByAuthor, getAuthorById, type AuthorProfileResponse } from "../../../api/authors/main.api";
import { type Art } from "../../../api/arts/main.api";
import Navigation from "../../../components/layout/Navigation/Navigation";
import AuthorProfile from "../../../components/shared/Authors/AuthorDetail/AuthorProfile/AuthorProfile";
import { useLanguage } from '../../../hooks/useLanguage';
import './AuthorPage.scss';
import { authorTranslations } from '../../../components/shared/Authors/AuthorDetail/lang';
import { commonTranslations } from '../../../lang';

const AuthorPage = () => {
    const { id } = useParams<{ id: string }>();
    const { language } = useLanguage();
    const t = authorTranslations[language];

    const [author, setAuthor] = useState<AuthorProfileResponse | null>(null);
    const [arts, setArts] = useState<Art[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let active = true;
        const getData = async () => {
            if (!id) {
                setError(t.missingId);
                setLoading(false);
                return;
            }

            setLoading(true);
            setError(null);

            try {
                const [authorData, artsData] = await Promise.all([
                    getAuthorById(Number(id)),
                    getArtsByAuthor(Number(id)),
                ]);
                if (!active) return;

                if (authorData) {
                    setAuthor(authorData);
                } else {
                    setError(t.notFound);
                }

                if (artsData) {
                    setArts(artsData);
                }
            } catch (err) {
                console.error("Error fetching author data:", err);
                setError(t.loadError);
            } finally {
                if (active) setLoading(false);
            }
        };

        getData();
        return () => { active = false; };
    }, [id, language, t]);

    if (loading) {
        return (
            <main className="author-page">
                <div className="author-page__loading">{commonTranslations[language].loading}</div>
            </main>
        );
    }

    if (error || !author) {
        return (
            <main className="author-page">
                <div className="author-page__error">{error || t.notFound}</div>
            </main>
        );
    }

    return (
        <main className="author-page">
            <Navigation />
            <div className="author-page__container">
                <AuthorHeader author={author} />
                <ArtsList data={{ arts }} />
            </div>
            <AuthorProfile author={author} />
        </main>
    );
};

export default AuthorPage;
