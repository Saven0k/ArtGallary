import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ART_CURRENCIES, createArt, updateArt, type Art, type CreateArtData, type CurrencyType } from '../../../api/arts/main.api';
import { getAllGenres, type Genre } from '../../../api/genres/main.api';
import { getAllStyles, type Style } from '../../../api/styles/main.api';
import { getAuthors, type AuthorProfileResponse } from '../../../api/authors/main.api';
import { useAuth } from '../../../hooks/useAuth';
import { useLanguage } from '../../../hooks/useLanguage';
import { errorMessage } from '../../../utils/errors';
import { artFormTranslations } from './lang';
import '../ProfileScreen/PersonalInfoSection/PersonalInfoSection.scss';

const ArtForm = ({ art }: { art?: Art }) => {
    const { user } = useAuth();
    const { language } = useLanguage();
    const navigate = useNavigate();
    const [title, setTitle] = useState(art?.title ?? '');
    const [description, setDescription] = useState(art?.description ?? '');
    const [specifications, setSpecifications] = useState(art?.specifications ?? '');
    const [cost, setCost] = useState(art?.cost == null ? '' : String(art.cost));
    const initialCurrency = art ? art.currency ?? 'RUB' : { ru: 'RUB', en: 'USD', zh: 'CNY' }[language];
    const [currency, setCurrency] = useState<CurrencyType | ''>(ART_CURRENCIES.find((value) => value === initialCurrency) ?? '');
    const [datePublished, setDatePublished] = useState((art?.date_published ?? new Date().toISOString()).slice(0, 10));
    const [genreId, setGenreId] = useState(art?.genre_id ?? 0);
    const [styleId, setStyleId] = useState(art?.style_id ?? 0);
    const [tags, setTags] = useState(art?.tags?.map((tag) => tag.name).join(', ') ?? '');
    const [adult, setAdult] = useState(art?.is_adult ?? false);
    const [image, setImage] = useState<File | null>(null);
    const [genres, setGenres] = useState<Genre[]>([]);
    const [styles, setStyles] = useState<Style[]>([]);
    const [authors, setAuthors] = useState<AuthorProfileResponse[]>([]);
    const [authorId, setAuthorId] = useState(user?.role === 'author' ? user.id : art?.author_id ?? 0);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const t = artFormTranslations[language];
    const labels = t.labels;
    useEffect(() => {
        let active = true;
        Promise.all([getAllGenres(language), getAllStyles()]).then(([nextGenres, nextStyles]) => {
            if (active) { setGenres(nextGenres); setStyles(nextStyles); }
        }).catch((e: unknown) => { if (active) setError(errorMessage(e, t.loadError)); });
        return () => { active = false; };
    }, [language, t.loadError]);
    useEffect(() => {
        if (art || user?.role !== 'admin') return;
        let active = true;
        getAuthors(1, 100, language).then((result) => { if (active) setAuthors(result?.data ?? []); });
        return () => { active = false; };
    }, [art, user?.role, language]);
    const submit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!user || busy) return;
        if (cost !== '' && !currency) { setError(t.currencyRequired); return; }
        setBusy(true);
        setError('');
        const data: CreateArtData = { title: title.trim(), description: description.trim(), specifications: specifications.trim(), cost: cost === '' ? null : Number(cost), currency: cost === '' ? null : currency || null, date_published: datePublished, genre_id: genreId || null, style_id: styleId || null, is_adult: adult, tags: [...new Set(tags.split(',').map((tag) => tag.trim()).filter(Boolean))] };
        try {
            const result = art ? await updateArt(art.id, data) : await createArt({ ...data, image_path: image, author_id: authorId });
            if (!result) throw new Error(t.saveError);
            navigate(`/arts/${result.id}`);
        } catch (e) { setError(errorMessage(e, t.saveError)); }
        finally { setBusy(false); }
    };
    return <form className="personal-info__form" onSubmit={submit}>
        {error && <p role="alert" className="personal-info__error">{error}</p>}
        <div className="personal-info__grid">
            {!art && user?.role === 'admin' && <label className="personal-info__field">{t.author}<select required value={authorId || ''} onChange={(event) => setAuthorId(Number(event.target.value))}><option value="">—</option>{authors.map((author) => <option key={author.id} value={author.id}>{author.surname} {author.name}</option>)}</select></label>}
            <label className="personal-info__field">{labels[0]}<input required value={title} onChange={(e) => setTitle(e.target.value)} maxLength={255} /></label>
            <label className="personal-info__field">{labels[1]}<textarea required value={description} onChange={(e) => setDescription(e.target.value)} /></label>
            <label className="personal-info__field">{labels[2]}<input value={specifications} onChange={(e) => setSpecifications(e.target.value)} /></label>
            <label className="personal-info__field">{labels[3]}<input type="number" min="0" step="0.01" value={cost} onChange={(e) => setCost(e.target.value)} /></label>
            <label className="personal-info__field">{labels[4]}<select required={cost !== ''} value={currency} onChange={(e) => setCurrency(e.target.value as CurrencyType)}>{!currency && <option value="" disabled>{art?.currency}</option>}{ART_CURRENCIES.map((value) => <option key={value} value={value}>{t.currencies[value]}</option>)}</select></label>
            <label className="personal-info__field">{labels[5]}<input type="date" required value={datePublished} onChange={(e) => setDatePublished(e.target.value)} /></label>
            <label className="personal-info__field">{labels[6]}<select value={genreId} onChange={(e) => setGenreId(Number(e.target.value))}><option value={0}>—</option>{genres.map((genre) => <option key={genre.id} value={genre.id}>{genre.title}</option>)}</select></label>
            <label className="personal-info__field">{labels[7]}<select value={styleId} onChange={(e) => setStyleId(Number(e.target.value))}><option value={0}>—</option>{styles.map((style) => <option key={style.id} value={style.id}>{style.name}</option>)}</select></label>
            <label className="personal-info__field">{labels[8]}<input value={tags} onChange={(e) => setTags(e.target.value)} /></label>
            <label className="personal-info__field">{labels[9]}<input type="checkbox" checked={adult} onChange={(e) => setAdult(e.target.checked)} /></label>
            {!art && <label className="personal-info__field">{labels[10]}<input type="file" required accept="image/png,image/jpeg,image/webp" onChange={(e) => setImage(e.target.files?.[0] ?? null)} /></label>}
        </div>
        <button className="personal-info__button" disabled={busy} type="submit">{busy ? '…' : labels[11]}</button>
    </form>;
};
export default ArtForm;
