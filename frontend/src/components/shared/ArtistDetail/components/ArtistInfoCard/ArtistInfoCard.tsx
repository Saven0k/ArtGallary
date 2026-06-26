import './ArtistInfoCard.css';

interface ArtistInfoCardProps {
    icon: string;
    label: string;
    value: string;
    extra?: string | null;
}

export const ArtistInfoCard = ({ icon, label, value, extra }: ArtistInfoCardProps) => {
    return (
        <div className="artist-info-card">
            <span className="artist-info-card__icon">{icon}</span>
            <div>
                <div className="artist-info-card__label">{label}</div>
                <div className="artist-info-card__value">
                    {value}
                    {extra && <span className="artist-info-card__extra">{extra}</span>}
                </div>
            </div>
        </div>
    );
};