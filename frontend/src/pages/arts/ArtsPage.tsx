import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getModeratedArts, searchArts, type ArtsResponse } from '../../api/arts/main.api';
import ArtsList from '../../components/shared/Arts/ArtsList/ArtsList';
import Navigation from '../../components/layout/Navigation/Navigation';
import { useLanguage } from '../../hooks/useLanguage';
import { useAuth } from '../../hooks/useAuth';

const ArtsPage = () => {
    const { language } = useLanguage();
    const { user } = useAuth();
    const [page, setPage] = useState(1);
    const [query, setQuery] = useState('');
    const [search, setSearch] = useState('');
    const [data, setData] = useState<ArtsResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    useEffect(() => {
        let active = true;
        setLoading(true);
        setError(false);
        (search ? searchArts(search, page, 12, language) : getModeratedArts(page, 12, language)).then((result) => {
            if (active) { setData(result); setError(!result); setLoading(false); }
        });
        return () => { active = false; };
    }, [page, language, search]);
    return <main className="page"><Navigation />
        <h1>{language === 'ru' ? 'Галерея' : language === 'zh' ? '画廊' : 'Gallery'}</h1>
        {(user?.role === 'author' || user?.role === 'admin') && <Link to="/arts/my/create">{language === 'ru' ? 'Добавить работу' : language === 'zh' ? '添加作品' : 'Add artwork'}</Link>}
        <form onSubmit={(event) => { event.preventDefault(); setSearch(query.trim()); setPage(1); }}><input aria-label="Search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} /><button type="submit">{language === 'ru' ? 'Найти' : language === 'zh' ? '搜索' : 'Search'}</button></form>
        {loading ? <p>…</p> : error ? <p role="alert">{language === 'ru' ? 'Не удалось загрузить работы' : language === 'zh' ? '无法加载作品' : 'Failed to load artworks'}</p> : <ArtsList data={data ?? { arts: [] }} />}
        {data?.pagination && data.pagination.totalPages > 1 && <nav aria-label="Pagination"><button disabled={loading || !data.pagination.hasPreviousPage} onClick={() => setPage((value) => value - 1)}>←</button><span>{page} / {data.pagination.totalPages}</span><button disabled={loading || !data.pagination.hasNextPage} onClick={() => setPage((value) => value + 1)}>→</button></nav>}
    </main>;
};
export default ArtsPage;
