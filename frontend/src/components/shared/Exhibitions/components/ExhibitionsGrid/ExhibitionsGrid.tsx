import type { Exhibition } from '../../../../../api/exhibitions/main.api';
import { ExhibitionCard } from '../ExhibitionCard/ExhibitionCard';
import './ExhibitionsGrid.css';

interface ExhibitionsGridProps {
    exhibitions: Exhibition[];
    viewMode: 'grid' | 'list';
    onExhibitionClick: (id: number) => void;
}

export const ExhibitionsGrid = ({ exhibitions, viewMode, onExhibitionClick }: ExhibitionsGridProps) => {
    return (
        <div className={`exhibitions-grid exhibitions-grid--${viewMode}`}>
            {exhibitions.map(exhibition => (
                <ExhibitionCard
                    key={exhibition.id}
                    exhibition={exhibition}
                    viewMode={viewMode}
                    onClick={() => onExhibitionClick(exhibition.id)}
                />
            ))}
        </div>
    );
};