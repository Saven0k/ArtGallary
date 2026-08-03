import { useState, useEffect } from "react";
import type { ArtistProfileResponse } from '../../../../../api/artists/main.api';
import './ArtistInfoTab.css';

interface ArtistInfoTabProps {
    artist: ArtistProfileResponse;
}

const ArtistInfoTab: React.FC<ArtistInfoTabProps> = ({ artist }) => {
    const [fullName, setFullName] = useState('');

    useEffect(() => {
        if (artist && artist.name && artist.surname) {
            setFullName(`${artist.surname} ${artist.name}`);
        }
    }, [artist]);

    return (
        <div className="artist-info-tab">
            <h3>{artist?.name || 'Неизвестно'}</h3>
            {artist && Object.keys(artist).filter(k => k !== 'id' && k !== 'name' && k !== 'surname').map((key: string) => (
                <div key={key} className="artist-info-card__field">
                    <span className="artist-info-card__label">{key}:</span>
                    <span className="artist-info-card__value">{String(artist)}</span>
                </div>
            ))}
        </div>
    );
};

export default ArtistInfoTab;