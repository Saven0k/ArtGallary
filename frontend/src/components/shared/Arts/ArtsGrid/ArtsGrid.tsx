import Masonry from 'react-masonry-css';
import type { Art } from '../../../../api/arts/main.api';
import { ArtCard } from '../ArtCard/ArtCard';
import './ArtsGrid.css';

interface ArtsGridProps {
    arts: Art[];
    viewMode: 'grid' | 'list';
    onArtClick: (id: number) => void;
}

const breakpointColumns = {
    default: 3,      // 3 колонки на ПК
    1200: 3,
    992: 2,          // 2 колонки на планшете
    576: 2,          // 2 колонки на телефоне
    320: 2
};

export const ArtsGrid = ({ arts, viewMode, onArtClick }: ArtsGridProps) => {
    if (viewMode === 'list') {
        return (
            <div className="arts-grid--list">
                {arts.map(art => (
                    <ArtCard 
                        key={art.id}
                        art={art}
                        viewMode={viewMode}
                        onClick={() => onArtClick(art.id)}
                    />
                ))}
            </div>
        );
    }

    return (
        <Masonry
            breakpointCols={breakpointColumns}
            className="arts-grid--masonry"
            columnClassName="arts-grid--masonry-column"
        >
            {arts.map(art => (
                <ArtCard 
                    key={art.id}
                    art={art}
                    viewMode={viewMode}
                    onClick={() => onArtClick(art.id)}
                />
            ))}
        </Masonry>
    );
};