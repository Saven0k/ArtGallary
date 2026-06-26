import { ArtForm } from "../../../components/shared/ArtForm/ArtForm";
import { useAuth } from "../../../hooks/useAuth";
import { useLanguage } from "../../../context/LanguageContext";
import { artCreatePageTranslations } from "./lang";
import { useState, useEffect } from "react";
import { getArtistById } from "../../../api/artists/main.api";
import "./index.css"

const ArtCreatePage = () => {
    const { user } = useAuth();
    const { language } = useLanguage();
    const lang = artCreatePageTranslations[language];
    const [canCreate, setCanCreate] = useState<boolean | null>(null);

    useEffect(() => {
        checkModerationStatus();
    }, [user?.id]);

    const checkModerationStatus = async () => {
        if (!user?.id || user.role !== 'artist') {
            setCanCreate(false);
            return;
        }

        try {
            const artistData = await getArtistById(user.id);
            const moderate = artistData?.artistProfile?.moderate as any;
            setCanCreate(moderate?.moderate === true);
        } catch (error) {
            setCanCreate(false);
        }
    };

    if (canCreate === null) {
        return (
            <div className="centered">
                <div className="spinner"></div>
            </div>
        );
    }

    if (!canCreate) {
        return (
            <div className="centered">
                <div className="art-create__blocked">
                    <div className="art-create__blocked-icon">⏳</div>
                    <h3>{lang.blocked.title}</h3>
                    <p>{lang.blocked.description}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="page">
            <ArtForm />
        </div>
    );
};

export default ArtCreatePage;