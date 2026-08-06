// ArtsList.tsx
import type { ArtsResponse } from "../../../../api/arts/main.api";
import ArtCard from "../ArtCard/ArtCard";
import "./ArtsList.scss";

export interface ArtsListProps {
    data: ArtsResponse | { arts: [] };
}

const ArtsList = ({ data }: ArtsListProps) => {
    const arts = data?.arts || [];

    if (!arts.length) {
        return (
            <div className="art-list__empty">
                У автора пока нет работ
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