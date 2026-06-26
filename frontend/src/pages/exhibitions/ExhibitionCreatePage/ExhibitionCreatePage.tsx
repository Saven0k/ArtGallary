import ExhibitionForm from "../../../components/shared/Exhibitions/components/ExhibitionForm/ExhibitionForm";
import { useAuth } from "../../../hooks/useAuth";
import { useState, useEffect } from "react";
import { getArtistById } from "../../../api/artists/main.api";

const ExhibitionCreatePage = () => {
    const { user } = useAuth();
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
                    <h3>Доступ ограничен</h3>
                    <p>Пока ваш аккаунт не пройдет модерацию, вы не сможете создавать выставки</p>
                </div>
            </div>
        );
    }

    return (
        <ExhibitionForm />
    );
};

export default ExhibitionCreatePage;