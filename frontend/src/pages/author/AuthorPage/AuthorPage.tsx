// AuthorPage.tsx
import { useParams } from "react-router-dom";
import ArtsList from "../../../components/shared/Arts/ArtsList/ArtsList";
import AuthorHeader from "../../../components/shared/Authors/AuthorDetail/AuthorHeader/AuthorHeader";
import AuthorProfile from "../../../components/shared/Authors/AuthorDetail/AuthorProfile/AuthorProfile";
import { useEffect, useState } from "react";
import { getAuthorById, type AuthorProfileResponse } from "../../../api/authors/main.api";
import { getArtsByAuthor, type ArtsResponse } from "../../../api/arts/main.api";
import "./AuthorPage.scss";

const AuthorPage = () => {
    const { id } = useParams<{ id: string }>();
    
    const [author, setAuthor] = useState<AuthorProfileResponse | null>(null);
    const [arts, setArts] = useState<ArtsResponse | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const getData = async () => {
            if (!id) {
                setError("ID автора не указан");
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

                if (authorData) {
                    setAuthor(authorData);
                } else {
                    setError("Автор не найден");
                }

                if (artsData) {
                    setArts(artsData);
                }
            } catch (err) {
                console.error("Error fetching author data:", err);
                setError("Ошибка при загрузке данных");
            } finally {
                setLoading(false);
            }
        };

        getData();
    }, [id]);

    if (loading) {
        return (
            <main className="author-page">
                <div className="author-page__loading">Загрузка...</div>
            </main>
        );
    }

    if (error || !author) {
        return (
            <main className="author-page">
                <div className="author-page__error">{error || "Автор не найден"}</div>
            </main>
        );
    }

    return (
        <main className="author-page">
            <AuthorHeader author={author} />
            <ArtsList data={arts || { arts: [] }} />
            <AuthorProfile author={author} />
        </main>
    );
};

export default AuthorPage;