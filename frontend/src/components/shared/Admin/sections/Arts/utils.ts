// src/components/shared/Admin/sections/Arts/utils.ts
import type { Art } from '../../../../../api/arts/main.api';

export type ModerationStatus = 'moderated' | 'pending' | 'rejected';

interface ModerateObject {
    moderate?: boolean;
    moderator_id?: number | null;
    errors?: Record<string, string>;
    comment?: string | null;
}

export const parseModerate = (raw?: string): ModerateObject | null => {
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch {
        return null;
    }
};

export const getModerationStatus = (art: Art): ModerationStatus => {
    const obj = parseModerate(art.moderate);
    if (!obj) return 'pending';                 // пусто → ждёт модерации
    if (obj.moderate === true) return 'moderated';
    if (obj.moderate === false) return 'rejected';
    return 'pending';
};