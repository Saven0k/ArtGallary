import { createHash } from 'node:crypto';

export type ModerationKind = 'author' | 'art';

export function moderationRevision(
  kind: ModerationKind,
  item: {
    moderate: string;
    biography?: string;
    avatar_path?: string;
    is_deleted?: boolean;
    title?: string;
    description?: string;
    specifications?: string;
    image_path?: string;
    status?: string;
  },
): string {
  return createHash('sha256')
    .update(
      JSON.stringify(
        kind === 'author'
          ? [item.moderate, item.biography, item.avatar_path, item.is_deleted]
          : [
              item.moderate,
              item.title,
              item.description,
              item.specifications,
              item.image_path,
              item.status,
            ],
      ),
    )
    .digest('hex');
}

export function pendingModeration(value: string): boolean {
  try {
    const data = JSON.parse(value || '{}') as {
      moderate?: boolean;
      moderator_id?: number;
      moderated_at?: string;
      comment?: string;
      errors?: Record<string, unknown>;
    };
    return (
      data.moderate !== true &&
      !data.moderator_id &&
      !data.moderated_at &&
      !data.comment &&
      Object.keys(data.errors || {}).length === 0
    );
  } catch {
    return false;
  }
}
