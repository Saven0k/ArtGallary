// src/components/shared/Admin/sections/Authors/utils.ts
import type { AuthorProfileResponse } from '../../../../../api/authors/main.api';

export type AuthorModerationStatus = 'moderated' | 'pending' | 'rejected' | 'deleted';

export const getAuthorStatus = (
    author: AuthorProfileResponse,
): AuthorModerationStatus => {
    if (author.authorProfile?.is_deleted) return 'deleted';

    const raw = author.authorProfile?.moderate;
    if (!raw) return 'pending';

    // moderate может быть строкой JSON или уже объектом
    let obj: any = raw;
    if (typeof raw === 'string') {
        try {
            obj = JSON.parse(raw);
        } catch {
            return 'pending';
        }
    }

    if (obj?.moderate === true) return 'moderated';
    if (obj?.moderate === false) return 'rejected';
    return 'pending';
};