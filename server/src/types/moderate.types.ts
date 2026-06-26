export interface ModerateObject {
    moderate: boolean;
    moderator_id: number | null;
    errors: Record<string, string>;
    moderated_at: Date | null;
    comment: string | null;
}
export interface ModerateResponse {
    success: boolean;
    message: string;
    data: ModerateObject;
}
export type ModerateField = string; 