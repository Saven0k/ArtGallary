// Базовый URL API задаётся через VITE_API_URL (см. frontend/.env.*):
//   dev : http://localhost:5000  (прямо на Nest)
//   prod: /api                   (тот же origin, reverse proxy снимает префикс)
// Пустая строка = запросы на тот же origin без префикса.
export const BASE_URL_API = (import.meta.env.VITE_API_URL ?? "http://localhost:5000").replace(/\/+$/, "");

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