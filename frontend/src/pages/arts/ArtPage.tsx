import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getArtById, incrementView, type Art } from '../../api/arts/main.api';
import SimilarArts from '../../components/shared/Arts/SimilarArts/SimilarArts';
import ArtCard from '../../components/shared/Arts/ArtCard/ArtCard';
import Navigation from '../../components/layout/Navigation/Navigation';
import NotFoundPage from '../NotFoundPage';
import { useAuth } from '../../hooks/useAuth';
import { useLanguage } from '../../hooks/useLanguage';

const ArtPage = () => {
    const { id } = useParams();
    const { user } = useAuth();
    const { language } = useLanguage();
    const [art, setArt] = useState<Art | null>(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        let active = true;
        setLoading(true);
        const artId = Number(id);
        if (!Number.isSafeInteger(artId) || artId <= 0) { setArt(null); setLoading(false); return; }
        getArtById(artId, language).then((result) => {
            if (active) { setArt(result); setLoading(false); }
        });
        return () => { active = false; };
    }, [id, language]);
    useEffect(() => {
        if (art) void incrementView(art.id);
    }, [art]);
    if (loading) return <main className="page">…</main>;
    if (!art) return <NotFoundPage />;
    const owner = user && (user.role === 'admin' || art.author_id === user.id || art.author?.user_id === user.id);
    return <main className="page"><Navigation /><h1>{art.title}</h1><ArtCard art={art} art_id={art.id} /><p>{art.description}</p>
        {art.author_id && <Link to={`/authors/${art.author_id}`}>{art.author?.user?.surname} {art.author?.user?.name}</Link>}
        {owner && <Link to={`/arts/my/edit/${art.id}`}>{language === 'ru' ? 'Редактировать' : language === 'zh' ? '编辑' : 'Edit'}</Link>}
        <SimilarArts artId={art.id} />
    </main>;
};
export default ArtPage;
