// src/components/shared/Events/EventDetails/lang.ts

export type EventsLang = "ru" | "en" | "zh";

export const eventDetailsTranslations: Record<
    EventsLang,
    {
        eventDetails: {
            loading: string;
            notFound: string;
            backToEvents: string;
        };
    }
> = {
    ru: {
        eventDetails: {
            loading: "Загрузка...",
            notFound: "Событие не найдено",
            backToEvents: "К списку событий",
        },
    },
    en: {
        eventDetails: {
            loading: "Loading...",
            notFound: "Event not found",
            backToEvents: "Back to events",
        },
    },
    zh: {
        eventDetails: {
            loading: "加载中...",
            notFound: "未找到活动",
            backToEvents: "返回活动列表",
        },
    },
};