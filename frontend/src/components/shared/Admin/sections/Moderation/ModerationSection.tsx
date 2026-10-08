import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Check, X, Image as ImageIcon, User as UserIcon, ShieldCheck, Mail, Calendar,
} from 'lucide-react';
import { useLanguage } from '../../../../../hooks/useLanguage';
import { useAuth } from '../../../../../hooks/useAuth';
import { adminTranslations } from '../../../../../pages/admin/lang';
import { getUnmoderatedArts, moderateArt, type Art } from '../../../../../api/arts/main.api';
import {
    getUnmoderatedAuthors, moderateAuthor, type AuthorProfileResponse,
} from '../../../../../api/authors/main.api';
import { getModeratorById } from '../../../../../api/moderators/main.api';
import SectionHeader from '../../SectionHeader/SectionHeader';
import EmptyState from '../../EmptyState/EmptyState';
import { moderationTranslations } from './lang';
import './ModerationSection.scss';

type Tab = 'all' | 'arts' | 'authors';

type QueueItem =
    | { kind: 'art'; data: Art; date: string }
    | { kind: 'author'; data: AuthorProfileResponse; date: string };

type ModerateObject = {
    moderate?: boolean;
    moderator_id?: number | null;
    moderated_at?: string | null;
    comment?: string | null;
};

const fmtDateTime = (raw: string | null | undefined, language: string) => {
    if (!raw) return null;
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return null;
    const date = d.toLocaleDateString(
        language === 'ru' ? 'ru-RU' : language === 'zh' ? 'zh-CN' : 'en-US',
    );
    const time = d.toLocaleTimeString(
        language === 'ru' ? 'ru-RU' : language === 'zh' ? 'zh-CN' : 'en-US',
        { hour: '2-digit', minute: '2-digit' },
    );
    return `${date} ${time}`;
};

const fullName = (a: { surname?: string; name?: string } | null | undefined) =>
    [a?.surname, a?.name].filter(Boolean).join(' ').trim();

const readModerate = (raw: unknown): ModerateObject | null => {
    if (!raw) return null;
    if (typeof raw === 'string') {
        try {
            return JSON.parse(raw);
        } catch {
            return null;
        }
    }
    return raw as ModerateObject;
};

const ModeratorLine = ({
    moderatorId,
    label,
    prefix,
}: {
    moderatorId: number;
    language: string;
    label: string;
    prefix?: string;
}) => {
    const [name, setName] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let alive = true;
        setLoading(true);
        getModeratorById(moderatorId).then((res) => {
            if (!alive) return;
            const u = res?.user;
            setName(u ? fullName(u) || null : null);
            setLoading(false);
        });
        return () => { alive = false; };
    }, [moderatorId]);

    const display = loading ? '…' : name ? `${name} (#${moderatorId})` : `#${moderatorId}`;

    return (
        <span>
            {label}: {prefix ? `${prefix} ` : ''}{display}
        </span>
    );
};

const ModerationSection = () => {
    const { language } = useLanguage();
    const { user } = useAuth();
    const t = moderationTranslations[language];
    const common = adminTranslations[language].common;

    const [tab, setTab] = useState<Tab>('all');
    const [arts, setArts] = useState<Art[]>([]);
    const [authors, setAuthors] = useState<AuthorProfileResponse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    const [moderateTarget, setModerateTarget] = useState<{ item: QueueItem; approve: boolean } | null>(null);
    const [moderateComment, setModerateComment] = useState('');

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [artsRes, authorsRes] = await Promise.all([
                getUnmoderatedArts(1, 100, language),
                getUnmoderatedAuthors(1, 100, language),
            ]);
            setArts(artsRes?.arts ?? []);
            setAuthors(authorsRes?.data ?? []);
        } catch (e) {
            console.error('load moderation error:', e);
            setError(t.errors.loadFailed);
        } finally {
            setLoading(false);
        }
    }, [language, t.errors.loadFailed]);

    useEffect(() => { load(); }, [load]);

    const queue: QueueItem[] = useMemo(() => {
        const artItems: QueueItem[] = arts.map((a) => ({ kind: 'art', data: a, date: a.date_published ?? '' }));
        const authorItems: QueueItem[] = authors.map((a) => ({
            kind: 'author',
            data: a,
            date: a.authorProfile?.created_at ?? a.authorProfile?.createdAt ?? '',
        }));
        if (tab === 'arts') return artItems;
        if (tab === 'authors') return authorItems;
        return [...artItems, ...authorItems].sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
        );
    }, [arts, authors, tab]);

    const handleModerate = async () => {
        if (!moderateTarget || !user) return;
        setBusy(true);
        try {
            const { item, approve } = moderateTarget;
            const payload = { moderate: approve, moderator_id: user.id, comment: moderateComment.trim() || null, errors: {} };
            if (item.kind === 'art') await moderateArt(item.data.id, payload);
            else await moderateAuthor(item.data.id, payload);
            setModerateTarget(null);
            setModerateComment('');
            await load();
        } catch (e) {
            console.error(e);
            setError(t.errors.moderateFailed);
        } finally {
            setBusy(false);
        }
    };

    const tabs: { value: Tab; label: string; count: number }[] = [
        { value: 'all', label: t.tabs.all, count: arts.length + authors.length },
        { value: 'arts', label: t.tabs.arts, count: arts.length },
        { value: 'authors', label: t.tabs.authors, count: authors.length },
    ];

    const emptyText = tab === 'arts' ? t.empty.arts : tab === 'authors' ? t.empty.authors : t.empty.all;

    const renderAuthorCard = (a: AuthorProfileResponse) => {
        const p = a.authorProfile;

        const name = fullName(a) || '—';
        const location = [a.city?.name_ru ?? a.city?.name_en, a.country?.name_ru ?? a.country?.name_en].filter(Boolean).join(', ');
        const profession = p.profession?.name;
        const email = a.email;
        const created = fmtDateTime(p.created_at ?? p.createdAt, language);
        const bio = p.biography;

        const moderate = readModerate(p.moderate);
        const moderatedAt = moderate?.moderated_at ? fmtDateTime(moderate.moderated_at, language) : null;
        const moderatorId = moderate?.moderator_id;
        const moderateStatusText =
            moderate?.moderate === true
                ? t.moderateModal.confirmApprove
                : moderate?.moderate === false
                ? t.moderateModal.confirmReject
                : null;

        return (
            <article className="moderation-author-card">
                <div className="moderation-author-card__avatar">
                    {p.avatar_path ? (
                        <img src={p.avatar_path} alt={name} />
                    ) : (
                        <UserIcon size={48} />
                    )}
                </div>

                <div className="moderation-author-card__body">
                    <h4 className="moderation-author-card__name">{name}</h4>

                    {location && <div className="moderation-author-card__line">{location}</div>}
                    {profession && <div className="moderation-author-card__line">{profession}</div>}
                    {bio && <p className="moderation-author-card__bio">{bio}</p>}

                    {email && (
                        <span className="moderation-author-card__email">
                            <Mail size={14} /> {email}
                        </span>
                    )}

                    <div className="moderation-author-card__footer">
                        {created && (
                            <span className="moderation-author-card__footer-item">
                                <Calendar size={13} /> {t.viewModal.dateCreated || 'Добавление'}: {created}
                            </span>
                        )}
                        {moderatorId != null && moderatedAt && (
                            <span className="moderation-author-card__footer-item moderation-author-card__moderator">
                                <ModeratorLine
                                    moderatorId={moderatorId}
                                    language={language}
                                    label={t.viewModal.moderatedBy}
                                    prefix={`${moderateStatusText ?? ''} —`}
                                />
                                <span> · {moderatedAt}</span>
                            </span>
                        )}
                    </div>

                    <div className="moderation-author-card__actions">
                        <button
                            type="button"
                            className="moderation-author-card__btn moderation-author-card__btn--approve"
                            onClick={() => setModerateTarget({ item: { kind: 'author', data: a, date: '' }, approve: true })}
                        >
                            <Check size={14} /> {t.actions.approve}
                        </button>
                        <button
                            type="button"
                            className="moderation-author-card__btn moderation-author-card__btn--reject"
                            onClick={() => setModerateTarget({ item: { kind: 'author', data: a, date: '' }, approve: false })}
                        >
                            <X size={14} /> {t.actions.reject}
                        </button>
                    </div>
                </div>
            </article>
        );
    };

    const renderArtCard = (a: Art) => {
        const author = a.author?.user ? fullName(a.author.user) : null;
        const created = fmtDateTime(a.date_published, language);
        const moderate = readModerate(a.moderate);
        const moderatedAt = moderate?.moderated_at ? fmtDateTime(moderate.moderated_at, language) : null;
        const moderatorId = moderate?.moderator_id;
        const moderateStatusText =
            moderate?.moderate === true
                ? t.moderateModal.confirmApprove
                : moderate?.moderate === false
                ? t.moderateModal.confirmReject
                : null;

        return (
            <article className="moderation-art-card">
                <div className="moderation-art-card__image">
                    {a.image_path ? (
                        <img src={a.image_path} alt={a.title} />
                    ) : (
                        <ImageIcon size={48} />
                    )}
                </div>

                <div className="moderation-art-card__body">
                    <h4 className="moderation-art-card__title">{a.title}</h4>

                    {author && <div className="moderation-art-card__line">{author}</div>}
                    {a.description && <p className="moderation-art-card__bio">{a.description}</p>}

                    <div className="moderation-art-card__footer">
                        {created && (
                            <span className="moderation-art-card__footer-item">
                                <Calendar size={13} /> {t.viewModal.dateCreated || 'Добавление'}: {created}
                            </span>
                        )}
                        {moderatorId != null && moderatedAt && (
                            <span className="moderation-art-card__footer-item">
                                <ModeratorLine
                                    moderatorId={moderatorId}
                                    language={language}
                                    label={t.viewModal.moderatedBy}
                                    prefix={`${moderateStatusText ?? ''} —`}
                                />
                                <span> · {moderatedAt}</span>
                            </span>
                        )}
                    </div>

                    <div className="moderation-art-card__actions">
                        <button
                            type="button"
                            className="moderation-art-card__btn moderation-art-card__btn--approve"
                            onClick={() => setModerateTarget({ item: { kind: 'art', data: a, date: '' }, approve: true })}
                        >
                            <Check size={14} /> {t.actions.approve}
                        </button>
                        <button
                            type="button"
                            className="moderation-art-card__btn moderation-art-card__btn--reject"
                            onClick={() => setModerateTarget({ item: { kind: 'art', data: a, date: '' }, approve: false })}
                        >
                            <X size={14} /> {t.actions.reject}
                        </button>
                    </div>
                </div>
            </article>
        );
    };

    return (
        <div className="admin-section moderation-section">
            <SectionHeader title={t.title} subtitle={t.subtitle} />

            <div className="moderation-section__summary">
                <div className="moderation-section__summary-card">
                    <div className="moderation-section__summary-icon"><ImageIcon size={20} /></div>
                    <div>
                        <span className="moderation-section__summary-label">{t.summary.arts}</span>
                        <span className="moderation-section__summary-value">{arts.length}</span>
                    </div>
                </div>
                <div className="moderation-section__summary-card">
                    <div className="moderation-section__summary-icon"><UserIcon size={20} /></div>
                    <div>
                        <span className="moderation-section__summary-label">{t.summary.authors}</span>
                        <span className="moderation-section__summary-value">{authors.length}</span>
                    </div>
                </div>
                <div className="moderation-section__summary-card">
                    <div className="moderation-section__summary-icon"><ShieldCheck size={20} /></div>
                    <div>
                        <span className="moderation-section__summary-label">{t.summary.total}</span>
                        <span className="moderation-section__summary-value">{arts.length + authors.length}</span>
                    </div>
                </div>
            </div>

            <div className="moderation-section__tabs">
                {tabs.map((x) => (
                    <button key={x.value} type="button" className={`moderation-section__tab ${tab === x.value ? 'is-active' : ''}`} onClick={() => setTab(x.value)}>
                        {x.label}
                        {x.count > 0 && <span className="moderation-section__tab-count">{x.count}</span>}
                    </button>
                ))}
            </div>

            {error && <div className="moderation-section__error">{error}</div>}

            {!loading && queue.length === 0 ? (
                <EmptyState text={emptyText} icon={<ShieldCheck size={24} />} />
            ) : (
                <div className="moderation-section__list">
                    {loading
                        ? Array.from({ length: 4 }).map((_, i) => (
                              <div key={i} className="moderation-section__skeleton" />
                          ))
                        : queue.map((item) =>
                              item.kind === 'author'
                                  ? <div key={`author-${item.data.id}`}>{renderAuthorCard(item.data as AuthorProfileResponse)}</div>
                                  : <div key={`art-${item.data.id}`}>{renderArtCard(item.data as Art)}</div>,
                          )}
                </div>
            )}

            {moderateTarget && (
                <div className="moderation-section__modal-overlay" onClick={() => !busy && setModerateTarget(null)}>
                    <div className="moderation-section__modal" onClick={(e) => e.stopPropagation()}>
                        <h3>{moderateTarget.approve ? t.moderateModal.approveTitle : t.moderateModal.rejectTitle}</h3>

                        <label className="moderation-section__label">
                            {t.moderateModal.commentLabel}
                            <textarea
                                rows={3}
                                value={moderateComment}
                                onChange={(e) => setModerateComment(e.target.value)}
                                placeholder={t.moderateModal.commentPlaceholder}
                                disabled={busy}
                            />
                        </label>

                        <div className="moderation-section__modal-actions">
                            <button type="button" className="moderation-section__btn moderation-section__btn--secondary" onClick={() => setModerateTarget(null)} disabled={busy}>
                                {common.cancel}
                            </button>
                            <button
                                type="button"
                                className={`moderation-section__btn ${moderateTarget.approve ? 'moderation-section__btn--primary' : 'moderation-section__btn--danger'}`}
                                onClick={handleModerate}
                                disabled={busy}
                            >
                                {moderateTarget.approve ? t.moderateModal.confirmApprove : t.moderateModal.confirmReject}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ModerationSection;