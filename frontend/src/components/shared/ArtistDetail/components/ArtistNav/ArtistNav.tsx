import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../../../hooks/useAuth';
import { useLanguage } from '../../../../../context/LanguageContext';
import { artistNavTranslations } from './lang';
import './ArtistNav.css';

interface ArtistNavProps {
    activeTab: 'arts' | 'exhibitions' | 'info';
    onTabChange: (tab: 'arts' | 'exhibitions' | 'info') => void;
    artsCount: number;
    exhibitionsCount: number;
    onBack: () => void;
    artistUserId?: number;
}

export const ArtistNav = ({ 
    activeTab, 
    onTabChange, 
    artsCount, 
    exhibitionsCount, 
    onBack,
    artistUserId 
}: ArtistNavProps) => {
    const { user } = useAuth();
    const { language } = useLanguage();
    const navigate = useNavigate();
    const lang = artistNavTranslations[language];
    const isOwner = user?.id === artistUserId;

    const handleEditProfile = () => {
        navigate('/profile');
    };

    return (
        <div className="artist-nav">
            <div className="artist-nav__left">
                <button className="artist-nav__back-btn" onClick={onBack}>
                    {lang.back}
                </button>
            </div>
            
            <div className="artist-nav__center">
                <div className="artist-nav__tabs">
                    <button
                        className={`artist-nav__tab ${activeTab === 'arts' ? 'active' : ''}`}
                        onClick={() => onTabChange('arts')}
                    >
                        {lang.tabs.arts} ({artsCount})
                    </button>
                    <button
                        className={`artist-nav__tab ${activeTab === 'exhibitions' ? 'active' : ''}`}
                        onClick={() => onTabChange('exhibitions')}
                    >
                        {lang.tabs.exhibitions} ({exhibitionsCount})
                    </button>
                    <button
                        className={`artist-nav__tab ${activeTab === 'info' ? 'active' : ''}`}
                        onClick={() => onTabChange('info')}
                    >
                        {lang.tabs.info}
                    </button>
                </div>
            </div>

            <div className="artist-nav__right">
                {isOwner && (
                    <button className="artist-nav__edit-btn" onClick={handleEditProfile}>
                        {lang.editProfile}
                    </button>
                )}
            </div>
        </div>
    );
};