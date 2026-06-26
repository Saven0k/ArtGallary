import type { ArtistUser } from '../../../../../types/user.types';
import { ArtistCard } from '../ArtistCard/ArtistCard';
import './ArtistsGrid.css';

interface ArtistsGridProps {
    artists: ArtistUser[];
    viewMode: 'grid' | 'list';
    onArtistClick: (id: number) => void;
}

export const ArtistsGrid = ({ artists, viewMode, onArtistClick }: ArtistsGridProps) => {
    return (
        <div className={`artists-grid artists-grid--${viewMode}`}>
            {artists.map(artist => (
                <ArtistCard
                    key={artist.id}
                    artist={artist}
                    viewMode={viewMode}
                    onClick={() => onArtistClick(artist.id)}
                />
            ))}
        </div>
    );
};