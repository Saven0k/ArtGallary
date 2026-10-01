// src/components/shared/Events/EventCard/lang.ts

export type EventsLang = "ru" | "en" | "zh";

export const eventCardTranslations: Record<
    EventsLang,
    {
        eventCard: {
            more: string;
        };
    }
> = {
    ru: {
        eventCard: {
            more: "Подробнее",
        },
    },
    en: {
        eventCard: {
            more: "Read more",
        },
    },
    zh: {
        eventCard: {
            more: "查看更多",
        },
    },
};