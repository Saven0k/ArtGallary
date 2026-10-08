// src/components/routes/PublicRoute/lang.ts

import type { Language } from "../../../context/LanguageContext";

export interface PublicRouteTranslations {
    loading: string;
}

export const publicRouteTranslations: Record<Language, PublicRouteTranslations> = {
    ru: {
        loading: "Загрузка...",
    },
    en: {
        loading: "Loading...",
    },
    zh: {
        loading: "加载中...",
    },
};