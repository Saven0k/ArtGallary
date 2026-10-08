import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getArtById, type Art } from '../../api/arts/main.api';
import ArtForm from '../../components/shared/ArtForm/ArtForm';
import Navigation from '../../components/layout/Navigation/Navigation';
import NotFoundPage from '../NotFoundPage';
import { useAuth } from '../../hooks/useAuth';

const ArtEditPage = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const [art, setArt] = useState<Art | null>(null);
    const [loading, setLoading] = useState(!!id);
    useEffect(() => {
        if (!id) return;
        let active = true;
        getArtById(Number(id)).then((result) => { if (active) { setArt(result); setLoading(false); } });
        return () => { active = false; };
    }, [id]);
    if (loading) return <main className="page">…</main>;
    if (id && (!art || (user?.role !== 'admin' && art.author_id !== user?.id && art.author?.user_id !== user?.id))) return <NotFoundPage />;
    return <main className="page"><Navigation /><ArtForm key={id ?? 'create'} art={art ?? undefined} /></main>;
};
export default ArtEditPage;
