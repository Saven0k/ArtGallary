// src/components/Likes/lang.ts

export const likesTranslations = {
    ru: {
        likes: {
            title: "Понравившееся",
            empty: "Вы ещё не лайкнули ни одной картины",
            error: "Не удалось загрузить понравившиеся картины",
            priceNotSpecified: "Цена не указана",
            unknownAuthor: "Неизвестный автор",
            unlikeTooltip: "Убрать из понравившегося",
            currencySymbol: "₽",
            locale: "ru-RU",
            pagination: {
                prev: "← Назад",
                next: "Вперёд →",
                pageOf: "{page} / {total}"
            }
        }
    },
    en: {
        likes: {
            title: "Liked",
            empty: "You have not liked any artworks yet",
            error: "Failed to load liked artworks",
            priceNotSpecified: "Price not specified",
            unknownAuthor: "Unknown author",
            unlikeTooltip: "Remove from liked",
            currencySymbol: "$",
            locale: "en-US",
            pagination: {
                prev: "← Back",
                next: "Next →",
                pageOf: "{page} / {total}"
            }
        }
    },
    zh: {
        likes: {
            title: "喜欢",
            empty: "你还没有喜欢的作品",
            error: "加载喜欢的作品失败",
            priceNotSpecified: "未标明价格",
            unknownAuthor: "未知作者",
            unlikeTooltip: "取消喜欢",
            currencySymbol: "¥",
            locale: "zh-CN",
            pagination: {
                prev: "← 上一页",
                next: "下一页 →",
                pageOf: "{page} / {total}"
            }
        }
    }
};