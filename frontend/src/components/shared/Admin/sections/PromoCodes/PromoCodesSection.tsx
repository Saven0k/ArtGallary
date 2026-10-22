import { useEffect, useState, type FormEvent } from 'react';
import { useLanguage } from '../../../../../hooks/useLanguage';
import {
    createPromoCode,
    getPromoCodes,
    setPromoCodeActive,
    PromoCodeError,
    type PromoCodePage,
    type PromoCode,
} from '../../../../../api/promo-codes/main.api';
import DataTable, { type Column } from '../../DataTable/DataTable';
import SectionHeader from '../../SectionHeader/SectionHeader';
import { promoCodesTranslations } from './lang';
import './PromoCodesSection.scss';

const PromoCodesSection = () => {
    const { language } = useLanguage();
    const t = promoCodesTranslations[language];
    const [result, setResult] = useState<PromoCodePage | null>(null);
    const [page, setPage] = useState(1);
    const [attempt, setAttempt] = useState(0);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<'invalidExpiry' | 'duplicate' | 'invalid' | 'saveError' | null>(null);
    const [notice, setNotice] = useState<{ type: 'created' | 'updated'; code?: string } | null>(null);
    const [code, setCode] = useState('');
    const [percent, setPercent] = useState('10');
    const [expiresAt, setExpiresAt] = useState('');

    useEffect(() => {
        const controller = new AbortController();
        setLoading(true);
        setLoadError(false);
        void getPromoCodes(page, controller.signal)
            .then((data) => {
                if (!controller.signal.aborted) setResult(data);
            })
            .catch(() => {
                if (!controller.signal.aborted) setLoadError(true);
            })
            .finally(() => {
                if (!controller.signal.aborted) setLoading(false);
            });
        return () => controller.abort();
    }, [page, attempt, language]);

    const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (busy) return;
        const expiry = expiresAt ? new Date(expiresAt) : null;
        if (expiry && (!Number.isFinite(expiry.getTime()) || expiry.getTime() <= Date.now())) {
            setError('invalidExpiry');
            return;
        }
        setBusy(true);
        setError(null);
        setNotice(null);
        try {
            const created = await createPromoCode({
                code: code.trim().toUpperCase(),
                percent: Number(percent),
                expiresAt: expiry?.toISOString() ?? null,
            });
            setNotice({ type: 'created', code: created.code });
            setCode('');
            setPercent('10');
            setExpiresAt('');
            setPage(1);
            setAttempt((value) => value + 1);
        } catch (error) {
            setError(
                error instanceof PromoCodeError
                    ? error.message === 'PROMO_CODE_EXISTS'
                        ? 'duplicate'
                        : error.message === 'PROMO_EXPIRY_INVALID'
                          ? 'invalidExpiry'
                          : error.status === 400
                            ? 'invalid'
                            : 'saveError'
                    : 'saveError',
            );
        } finally {
            setBusy(false);
        }
    };

    const handleToggle = async (promo: PromoCode) => {
        if (busy) return;
        setBusy(true);
        setError(null);
        setNotice(null);
        try {
            const updated = await setPromoCodeActive(promo.id, !promo.active);
            setResult((previous) =>
                previous ? { ...previous, items: previous.items.map((item) => (item.id === updated.id ? updated : item)) } : previous,
            );
            setNotice({ type: 'updated' });
        } catch {
            setError('saveError');
        } finally {
            setBusy(false);
        }
    };

    const date = (value: string) => new Date(value).toLocaleString(language, { dateStyle: 'medium', timeStyle: 'short' });
    const columns: Column<PromoCode>[] = [
        { key: 'code', title: t.code, render: (promo) => <strong className="promo-codes__code">{promo.code}</strong> },
        { key: 'percent', title: t.percent, render: (promo) => `${promo.percent}%` },
        {
            key: 'status',
            title: t.status,
            render: (promo) => {
                const expired = !!promo.expiresAt && new Date(promo.expiresAt).getTime() <= Date.now();
                return (
                    <span className={`promo-codes__status ${promo.active && !expired ? 'is-active' : ''}`}>
                        {expired ? t.expired : promo.active ? t.active : t.inactive}
                    </span>
                );
            },
        },
        {
            key: 'expiresAt',
            title: t.expires,
            render: (promo) => (promo.expiresAt ? <time dateTime={promo.expiresAt}>{date(promo.expiresAt)}</time> : t.noExpiry),
        },
        { key: 'createdAt', title: t.createdAt, render: (promo) => <time dateTime={promo.createdAt}>{date(promo.createdAt)}</time> },
        {
            key: 'actions',
            title: t.actions,
            align: 'right',
            render: (promo) => (
                <button
                    type="button"
                    className="promo-codes__toggle"
                    disabled={busy || (!promo.active && !!promo.expiresAt && new Date(promo.expiresAt).getTime() <= Date.now())}
                    onClick={() => handleToggle(promo)}
                >
                    {promo.active ? t.disable : t.enable}
                </button>
            ),
        },
    ];

    return (
        <div className="admin-section promo-codes">
            <SectionHeader title={t.title} subtitle={t.subtitle} />
            <form className="promo-codes__form" onSubmit={handleCreate}>
                <h3>{t.createTitle}</h3>
                <label className="promo-codes__field promo-codes__field--code">
                    <span>{t.code}</span>
                    <input
                        name="code"
                        value={code}
                        onChange={(event) => setCode(event.target.value.toUpperCase())}
                        required
                        minLength={3}
                        maxLength={32}
                        pattern="[A-Za-z0-9_-]{3,32}"
                        autoComplete="off"
                        aria-describedby="promo-code-hint"
                        disabled={busy}
                    />
                    <small id="promo-code-hint">{t.codeHint}</small>
                </label>
                <label className="promo-codes__field">
                    <span>{t.percent}</span>
                    <input
                        name="percent"
                        type="number"
                        min={1}
                        max={100}
                        step={1}
                        required
                        value={percent}
                        onChange={(event) => setPercent(event.target.value)}
                        disabled={busy}
                    />
                </label>
                <label className="promo-codes__field">
                    <span>{t.expires}</span>
                    <input
                        name="expiresAt"
                        type="datetime-local"
                        value={expiresAt}
                        onChange={(event) => setExpiresAt(event.target.value)}
                        disabled={busy}
                    />
                    <small>{t.expiresHint}</small>
                </label>
                <button type="submit" className="promo-codes__create" disabled={busy}>
                    {busy ? t.saving : t.create}
                </button>
            </form>
            {error && (
                <p className="promo-codes__error" role="alert">
                    {t[error]}
                </p>
            )}
            {notice && (
                <p className="promo-codes__notice" role="status">
                    {notice.type === 'created' ? t.created.replace('{code}', notice.code ?? '') : t.updated}
                </p>
            )}
            {loading ? (
                <p className="promo-codes__state" role="status">
                    {t.loading}
                </p>
            ) : loadError ? (
                <div className="promo-codes__error" role="alert">
                    <p>{t.loadError}</p>
                    <button type="button" className="promo-codes__toggle" onClick={() => setAttempt((value) => value + 1)}>
                        {t.retry}
                    </button>
                </div>
            ) : (
                <DataTable columns={columns} rows={result?.items ?? []} rowKey={(promo) => promo.id} emptyText={t.empty} />
            )}
            {result && !loading && !loadError && result.total > result.limit && (
                <nav className="promo-codes__pagination" aria-label={t.pagination}>
                    <button
                        type="button"
                        className="promo-codes__toggle"
                        disabled={page <= 1 || busy}
                        onClick={() => setPage((value) => value - 1)}
                    >
                        {t.prev}
                    </button>
                    <span>
                        {t.pageOf.replace('{page}', String(page)).replace('{total}', String(Math.ceil(result.total / result.limit)))}
                    </span>
                    <button
                        type="button"
                        className="promo-codes__toggle"
                        disabled={page * result.limit >= result.total || busy}
                        onClick={() => setPage((value) => value + 1)}
                    >
                        {t.next}
                    </button>
                </nav>
            )}
        </div>
    );
};

export default PromoCodesSection;
