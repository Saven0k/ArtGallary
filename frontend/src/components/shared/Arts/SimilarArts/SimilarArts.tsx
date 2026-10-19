import { useEffect, useState } from "react";
import { getSimilarArts, type Art } from "../../../../api/arts/main.api";
import ArtCard from "../ArtCard/ArtCard";
import "./SimilarArts.scss";
import { useLanguage } from '../../../../hooks/useLanguage';
import { commonTranslations } from '../../../../lang';
import { artsListTranslations } from '../ArtsList/lang';

interface SimilarArtsProps {
    artId: number;
    limit?: number;
}

const SimilarArts = ({ artId, limit = 20 }: SimilarArtsProps) => {
    const { language } = useLanguage();
    const [arts, setArts] = useState<Art[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        getSimilarArts(artId, limit).then((data) => {
            if (!cancelled) {
                setArts(data || []);
                setLoading(false);
            }
        });
        return () => {
            cancelled = true;
        };
    }, [artId, limit, language]);

    if (loading) return <div className="similar-arts__loading">{commonTranslations[language].loading}</div>;
    if (!arts.length) return null;

    return (
        <section className="similar-arts">
            <h2 className="similar-arts__title">{artsListTranslations[language].similar}</h2>
            <ul className="similar-arts__list">
                {arts.map((art) => (
                    <li key={art.id} className="similar-arts__item">
                        <ArtCard art_id={art.id} art={art} />
                    </li>
                ))}
            </ul>
        </section>
    );
};

export default SimilarArts;
