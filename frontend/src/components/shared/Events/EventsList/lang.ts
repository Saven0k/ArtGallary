// src/components/shared/Events/EventsList/lang.ts

export type EventsLang = "ru" | "en" | "zh";

export const eventsListTranslations: Record<
    EventsLang,
    {
        eventsList: {
            loading: string;
            error: string;
            empty: string;
            prev: string;
            next: string;
        };
    }
> = {
    ru: {
        eventsList: {
            loading: "Загрузка событий...",
            error: "Не удалось загрузить события",
            empty: "Событий пока нет",
            prev: "Назад",
            next: "Вперёд",
        },
    },
    en: {
        eventsList: {
            loading: "Loading events...",
            error: "Failed to load events",
            empty: "No events yet",
            prev: "Prev",
            next: "Next",
        },
    },
    zh: {
        eventsList: {
            loading: "加载中...",
            error: "加载活动失败",
            empty: "暂无活动",
            prev: "上一页",
            next: "下一页",
        },
    },
};