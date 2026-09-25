// src/components/shared/Admin/sections/Events/EventsSection.tsx
import { useCallback, useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Image as ImageIcon } from 'lucide-react';
import { useLanguage } from '../../../../../hooks/useLanguage';
import { adminTranslations } from '../../../../../pages/admin/lang';
import {
    getEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    type Event,
    type CreateEventData,
    type UpdateEventData,
} from '../../../../../api/events/main.api';
import SectionHeader from '../../SectionHeader/SectionHeader';
import DataTable, { type Column } from '../../DataTable/DataTable';
import ConfirmModal from '../../ConfirmModal/ConfirmModal';
import EmptyState from '../../EmptyState/EmptyState';
import EventFormModal from './EventFormModal';
import { eventsTranslations } from './lang';
import './EventsSection.scss';

const PAGE_SIZE = 10;

const EventsSection = () => {
    const { language } = useLanguage();
    const t = eventsTranslations[language];
    const common = adminTranslations[language].common;

    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);

    const [createOpen, setCreateOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<Event | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Event | null>(null);

    // ---------- load ----------
    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await getEvents(page, PAGE_SIZE);
            if (!res) throw new Error();
            setEvents(res.data);
            setTotalPages(res.pagination.totalPages);
            setTotal(res.pagination.total);
        } catch (e) {
            console.error('load events error:', e);
            setError(t.errors.loadFailed);
        } finally {
            setLoading(false);
        }
    }, [page, t.errors.loadFailed]);

    useEffect(() => {
        load();
    }, [load]);

    // ---------- actions ----------
    const handleCreate = async (data: CreateEventData) => {
        setBusy(true);
        try {
            const res = await createEvent(data);
            if (!res) throw new Error();
            setCreateOpen(false);
            await load();
        } catch (e) {
            console.error(e);
            setError(t.errors.createFailed);
        } finally {
            setBusy(false);
        }
    };

    const handleUpdate = async (id: number, data: UpdateEventData) => {
        setBusy(true);
        try {
            const res = await updateEvent(id, data);
            if (!res) throw new Error();
            setEditTarget(null);
            await load();
        } catch (e) {
            console.error(e);
            setError(t.errors.updateFailed);
        } finally {
            setBusy(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteTarget) return;
        setBusy(true);
        try {
            const res = await deleteEvent(deleteTarget.id);
            if (!res) throw new Error();
            setDeleteTarget(null);
            await load();
        } catch (e) {
            console.error(e);
            setError(t.errors.deleteFailed);
        } finally {
            setBusy(false);
        }
    };

    // ---------- columns ----------
    const columns: Column<Event>[] = [
        {
            key: 'image',
            title: t.table.image,
            width: '88px',
            render: (ev) =>
                ev.image ? (
                    <img
                        src={ev.image}
                        alt={ev.title}
                        className="events-section__thumb"
                    />
                ) : (
                    <div className="events-section__thumb events-section__thumb--empty">
                        <ImageIcon size={18} />
                    </div>
                ),
        },
        {
            key: 'title',
            title: t.table.title,
            render: (ev) => (
                <span className="events-section__title">{ev.title}</span>
            ),
        },
        {
            key: 'description',
            title: t.table.description,
            render: (ev) => (
                <span className="events-section__desc">
                    {ev.description?.length > 80
                        ? `${ev.description.slice(0, 80)}…`
                        : ev.description}
                </span>
            ),
        },
        {
            key: 'createdAt',
            title: t.table.createdAt,
            width: '140px',
            render: (ev) =>
                ev.created_at
                    ? new Date(ev.created_at).toLocaleDateString(
                          language === 'ru'
                              ? 'ru-RU'
                              : language === 'zh'
                              ? 'zh-CN'
                              : 'en-US',
                      )
                    : '—',
        },
        {
            key: 'actions',
            title: t.table.actions,
            align: 'right',
            width: '120px',
            render: (ev) => (
                <div className="events-section__actions">
                    <button
                        type="button"
                        className="events-section__action events-section__action--edit"
                        title={t.actions.edit}
                        onClick={() => setEditTarget(ev)}
                    >
                        <Pencil size={16} />
                    </button>
                    <button
                        type="button"
                        className="events-section__action events-section__action--delete"
                        title={t.actions.delete}
                        onClick={() => setDeleteTarget(ev)}
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            ),
        },
    ];

    return (
        <div className="admin-section events-section">
            <SectionHeader
                title={t.title}
                subtitle={t.subtitle}
                actions={
                    <button
                        type="button"
                        className="events-section__create-btn"
                        onClick={() => setCreateOpen(true)}
                    >
                        <Plus size={16} />
                        {t.actions.create}
                    </button>
                }
            />

            {error && <div className="events-section__error">{error}</div>}

            {!loading && events.length === 0 ? (
                <EmptyState text={t.empty} icon={<ImageIcon size={24} />} />
            ) : (
                <DataTable
                    columns={columns}
                    rows={events}
                    loading={loading}
                    emptyText={common.empty}
                    rowKey={(e) => e.id}
                />
            )}

            {!loading && totalPages > 1 && (
                <div className="events-section__pagination">
                    <button
                        type="button"
                        disabled={page <= 1}
                        onClick={() => setPage((p) => p - 1)}
                    >
                        ←
                    </button>
                    <span>
                        {page} / {totalPages}
                        <span className="events-section__total"> ({total})</span>
                    </span>
                    <button
                        type="button"
                        disabled={page >= totalPages}
                        onClick={() => setPage((p) => p + 1)}
                    >
                        →
                    </button>
                </div>
            )}

            {/* Create */}
            {createOpen && (
                <EventFormModal
                    mode="create"
                    busy={busy}
                    onClose={() => setCreateOpen(false)}
                    onSubmit={handleCreate}
                />
            )}

            {/* Edit */}
            {editTarget && (
                <EventFormModal
                    mode="edit"
                    event={editTarget}
                    busy={busy}
                    onClose={() => setEditTarget(null)}
                    onSubmit={(data) => handleUpdate(editTarget.id, data)}
                />
            )}

            {/* Delete */}
            {deleteTarget && (
                <ConfirmModal
                    title={t.deleteModal.title}
                    text={t.deleteModal.text}
                    confirmLabel={t.deleteModal.confirm}
                    cancelLabel={common.cancel}
                    danger
                    onConfirm={handleDelete}
                    onClose={() => setDeleteTarget(null)}
                />
            )}
        </div>
    );
};

export default EventsSection;