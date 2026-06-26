export const BASE_URL_API = "http://localhost:5000";

export const contentType = {
    "Content-Type": "application/json",
};

export interface ModerateData {
    moderate: boolean;
    moderator_id: number | null;
    errors: Record<string, string>;
    moderated_at?: string | null;
    comment?: string | null;
}