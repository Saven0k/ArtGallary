// src/components/shared/Admin/sections/Genres/GenresSection.tsx
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, Sparkles, BookOpen } from 'lucide-react';
import { useLanguage } from '../../../../../hooks/useLanguage';
import { adminTranslations } from '../../../../../pages/admin/lang';
import {
    getAllGenres,
    createGenre,
    updateGenre,
    deleteGenre,
    seedGenres,
    type Genre,
    type CreateGenreData,
    type UpdateGenreData,
} from '../../../../../api/genres/main.api';
import {
    getAllArtTypes,
    type ArtType,
} from '../../../../../api/art-types/main.api';
import SectionHeader from '../../SectionHeader/SectionHeader';
import DataTable, { type Column } from '../../DataTable/DataTable';
import ConfirmModal from '../../ConfirmModal/ConfirmModal';
import EmptyState from '../../EmptyState/EmptyState';
import GenreFormModal from './GenreFormModal';
import { genresTranslations } from './lang';
import './GenresSection.scss';

const GenresSection = () => {
    const { language } = useLanguage();
    const t = genresTranslations[language];
    const common = adminTranslations[language].common;

    const [genres, setGenres] = useState<Genre[]>([]);
    const [artTypes, setArtTypes] = useState<ArtType[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    const [filterArtType, setFilterArtType] = useState<number | ''>('');

    const [createOpen, setCreateOpen] = useState(false);
    const [editTarget, setEditTarget] = useState<Genre | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<Genre | null>(null);
    const [seedOpen, setSeedOpen] = useState(false);

    // ---------- load ----------
    const loadArtTypes = useCallback(async () => {
        try {
            const data = await getAllArtTypes();
            setArtTypes(data);
        } catch (e) {
            console.error(e);
            setError(t.errors.artTypesLoadFailed);
        }
    }, [t.errors.artTypesLoadFailed]);

    const loadGenres = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getAllGenres(
                language === 'ru' ? 'ru' : 'en',
                filterArtType || undefined,
            );
            setGenres(data);
        } catch (e) {
            console.error(e);
            setError(t.errors.loadFailed);
        } finally {
            setLoading(false);
        }
    }, [language, filterArtType, t.errors.loadFailed]);

    useEffect(() => {
        loadArtTypes();
    }, [loadArtTypes]);

    useEffect(() => {
        loadGenres();
    }, [loadGenres]);

    // ---------- actions ----------
    const handleCreate = async (data: CreateGenreData) => {
        setBusy(true);
        try {
            await createGenre(data);
            setCreateOpen(false);
            await loadGenres();
        } catch (e) {
            console.error(e);
            setError(t.errors.createFailed);
        } finally {
            setBusy(false);
        }
    };

    const handleUpdate = async (id: number, data: UpdateGenreData) => {
        setBusy(true);
        try {
            await updateGenre(id, data);
            setEditTarget(null);
            await loadGenres();
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
            await deleteGenre(deleteTarget.id);
            setDeleteTarget(null);
            await loadGenres();
        } catch (e) {
            console.error(e);
            setError(t.errors.deleteFailed);
        } finally {
            setBusy(false);
        }
    };

    const handleSeed = async () => {
        setBusy(true);
        try {
            await seedGenres();
            setSeedOpen(false);
            await loadGenres();
        } catch (e) {
            console.error(e);
            setError(t.errors.seedFailed);
        } finally {
            setBusy(false);
        }
    };

    // ---------- columns ----------
    const columns: Column<Genre>[] = [
        { key: 'id', title: t.table.id, width: '60px', render: (g) => g.id },
        {
            key: 'title',
            title: t.table.title,
            render: (g) => (
                <span className="genres-section__title">{g.title}</span>
            ),
        },
        {
            key: 'artType',
            title: t.table.artType,
            render: (g) =>
                g.artType?.name ??
                artTypes.find((a) => a.id === g.art_type_id)?.name ??
                '—',
        },
        {
            key: 'description',
            title: t.table.description,
            render: (g) => g.description || '—',
        },
        {
            key: 'actions',
            title: t.table.actions,
            align: 'right',
            width: '120px',
            render: (g) => (
                <div className="genres-section__actions">
                    <button
                        type="button"
                        className="genres-section__action genres-section__action--edit"
                        title={t.actions.edit}
                        onClick={() => setEditTarget(g)}
                    >
                        <Pencil size={16} />
                    </button>
                    <button
                        type="button"
                        className="genres-section__action genres-section__action--delete"
                        title={t.actions.delete}
                        onClick={() => setDeleteTarget(g)}
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
            ),
        },
    ];

    return (
        <div className="admin-section genres-section">
            <SectionHeader
                title={t.title}
                subtitle={t.subtitle}
                actions={
                    <>
                        <button
                            type="button"
                            className="genres-section__seed-btn"
                            onClick={() => setSeedOpen(true)}
                            disabled={busy}
                        >
                            <Sparkles size={16} />
                            {t.actions.seed}
                        </button>
                        <button
                            type="button"
                            className="genres-section__create-btn"
                            onClick={() => setCreateOpen(true)}
                        >
                            <Plus size={16} />
                            {t.actions.create}
                        </button>
                    </>
                }
            />

            <div className="genres-section__filter">
                <label className="genres-section__filter-label">
                    {t.filters.artType}
                </label>
                <select
                    className="genres-section__filter-select"
                    value={filterArtType}
                    onChange={(e) =>
                        setFilterArtType(e.target.value ? Number(e.target.value) : '')
                    }
                >
                    <option value="">{t.filters.all}</option>
                    {artTypes.map((a) => (
                        <option key={a.id} value={a.id}>
                            {a.name}
                        </option>
                    ))}
                </select>
            </div>

            {error && <div className="genres-section__error">{error}</div>}

            {!loading && genres.length === 0 ? (
                <EmptyState text={t.empty} icon={<BookOpen size={24} />} />
            ) : (
                <DataTable
                    columns={columns}
                    rows={genres}
                    loading={loading}
                    emptyText={common.empty}
                    rowKey={(g) => g.id}
                />
            )}

            {createOpen && (
                <GenreFormModal
                    mode="create"
                    artTypes={artTypes}
                    busy={busy}
                    onClose={() => setCreateOpen(false)}
                    onSubmit={handleCreate}
                />
            )}

            {editTarget && (
                <GenreFormModal
                    mode="edit"
                    genre={editTarget}
                    artTypes={artTypes}
                    busy={busy}
                    onClose={() => setEditTarget(null)}
                    onSubmit={(data) => handleUpdate(editTarget.id, data)}
                />
            )}

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

            {seedOpen && (
                <ConfirmModal
                    title={t.seedModal.title}
                    text={t.seedModal.text}
                    confirmLabel={t.seedModal.confirm}
                    cancelLabel={common.cancel}
                    onConfirm={handleSeed}
                    onClose={() => setSeedOpen(false)}
                />
            )}
        </div>
    );
};

export default GenresSection;