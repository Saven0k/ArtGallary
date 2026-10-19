
import type { Art } from "../../../../api/arts/main.api";
import ArtCard from "../ArtCard/ArtCard";
import "./ArtsList.scss";
import { useLanguage } from '../../../../hooks/useLanguage';
import { artsListTranslations } from './lang';

export interface ArtsListProps {
    data: { arts: Art[] };
}

const ArtsList = ({ data }: ArtsListProps) => {
    const { language } = useLanguage();
    const arts = data?.arts || [];

    if (!arts.length) {
        return (
            <div className="art-list__empty">
                {artsListTranslations[language].empty}
            </div>
        );
    }

    return (
        <ul className="art-list">
            {arts.map((art) => (
                <li key={art.id} className="art-list__item">
                    <ArtCard art_id={art.id} art={art} />
                </li>
            ))}
        </ul>
    );
};

export default ArtsList;
