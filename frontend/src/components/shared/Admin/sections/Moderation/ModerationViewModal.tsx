// src/components/shared/Admin/sections/Moderation/ModerationViewModal.tsx
import { X, Image as ImageIcon, User as UserIcon } from 'lucide-react';
import { useLanguage } from '../../../../../hooks/useLanguage';
import { adminTranslations } from '../../../../../pages/admin/lang';
import type { Art } from '../../../../../api/arts/main.api';
import type { AuthorProfileResponse } from '../../../../../api/authors/main.api';
import { moderationTranslations } from './lang';
import './ModerationViewModal.scss';

export type QueueItem =
    | { kind: 'art'; data: Art; date: string }
    | { kind: 'author'; data: AuthorProfileResponse; date: string };

interface ModerationViewModalProps {
    item: QueueItem;
    onClose: () => void;
}

const ModerationViewModal = ({ item, onClose }: ModerationViewModalProps) => {
    const { language } = useLanguage();
    const t = moderationTranslations[language];
    const common = adminTranslations[language].common;
    const ns = t.viewModal.notSpecified;

    const isArt = item.kind === 'art';
    const art = isArt ? (item.data as Art) : null;
    const author = !isArt ? (item.data as AuthorProfileResponse) : null;

    const image = art?.image_path ?? author?.authorProfile?.avatar_path;

    const title = isArt
        ? art?.title ?? '—'
        : `${author?.name ?? ''} ${author?.surname ?? ''}`.trim() || '—';

    return (
        <div className="moderation-view-overlay" onClick={onClose}>
            <div
                className="moderation-view"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
            >
                <header className="moderation-view__header">
                    <h3>{t.viewModal.title}</h3>
                    <button type="button" onClick={onClose}>
                        <X size={20} />
                    </button>
                </header>

                <div className="moderation-view__hero">
                    <div className="moderation-view__image">
                        {image ? (
                            <img src={image} alt={title} />
                        ) : isArt ? (
                            <ImageIcon size={32} />
                        ) : (
                            <UserIcon size={32} />
                        )}
                    </div>
                    <h4 className="moderation-view__title">{title}</h4>
                </div>

                {isArt && art && (
                    <dl className="moderation-view__list">
                        <div>
                            <dt>{t.table.author}</dt>
                            <dd>
                                {art.author?.user
                                    ? `${art.author.user.name ?? ''} ${
                                          art.author.user.surname ?? ''
                                      }`.trim() || ns
                                    : ns}
                            </dd>
                        </div>
                        <div>
                            <dt>{t.viewModal.cost}</dt>
                            <dd>
                                {art.cost != null
                                    ? `${art.cost} ${art.currency ?? ''}`.trim()
                                    : ns}
                            </dd>
                        </div>
                        <div>
                            <dt>{t.viewModal.genre}</dt>
                            <dd>{art.genre?.title ?? ns}</dd>
                        </div>
                        <div>
                            <dt>{t.viewModal.style}</dt>
                            <dd>{art.style?.name ?? ns}</dd>
                        </div>
                    </dl>
                )}

                {!isArt && author && (
                    <dl className="moderation-view__list">
                        <div>
                            <dt>{t.viewModal.profession}</dt>
                            <dd>{author.authorProfile?.profession?.name ?? ns}</dd>
                        </div>
                    </dl>
                )}

                {(art?.description || author?.authorProfile?.biography) && (
                    <div className="moderation-view__bio">
                        <h4>{t.viewModal.description}</h4>
                        <p>
                            {art?.description ??
                                author?.authorProfile?.biography ??
                                ''}
                        </p>
                    </div>
                )}

                <div className="moderation-view__actions">
                    <button
                        type="button"
                        className="moderation-view__btn moderation-view__btn--secondary"
                        onClick={onClose}
                    >
                        {common.cancel}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ModerationViewModal;