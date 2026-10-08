import type { ModerateData } from '../api/main.api';

export const parseModeration = (raw: unknown): Partial<ModerateData> | null => {
    try {
        const value: unknown = typeof raw === 'string' ? JSON.parse(raw) : raw;
        if (!value || typeof value !== 'object') return null;
        const record = value as Record<string, unknown>;
        return {
            moderate: record.moderate === true,
            moderator_id: typeof record.moderator_id === 'number' ? record.moderator_id : null,
            moderated_at: typeof record.moderated_at === 'string' ? record.moderated_at : null,
            comment: typeof record.comment === 'string' ? record.comment : null,
        };
    } catch { return null; }
};
