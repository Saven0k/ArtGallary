// src/components/TariffPlan/lang.ts

export const tariffPlanTranslations = {
    ru: {
        tariffPlan: {
            title: "Тарифный план",
            badge: "Выгодно",
            perMonth: "/мес",
            choosePlan: "Выбрать план",
            plans: {
                basic: {
                    name: "Обычный",
                    subtitle: "Базовые возможности для автора",
                    price: 150,
                    features: [
                        { text: "Загрузка до 7 работ", included: true },
                        { text: "Базовая статистика: просмотры и лайки", included: true },
                        { text: "Личная страница художника", included: true },
                        { text: "Расширенная статистика", included: false },
                        { text: "Приоритет в каталоге", included: false },
                        { text: "Участие в тематических подборках", included: false },
                        { text: "Отметка «Премиум-автор»", included: false }
                    ]
                },
                premium: {
                    name: "Premium",
                    subtitle: "Больше возможностей и инструментов",
                    price: 800,
                    features: [
                        { text: "Загрузка до 20 работ", included: true },
                        { text: "Расширенная статистика: просмотры, лайки, возраст и пол аудитории; страны и города; источники переходов; самые популярные работы", included: true },
                        { text: "Статистика по каждой картине", included: true },
                        { text: "Приоритетное отображение в каталоге", included: true },
                        { text: "Отметка «Премиум-автор»", included: true },
                        { text: "Попадание в рекомендации", included: false },
                        { text: "Добавление видео в процессе создания", included: false }
                    ]
                },
                vip: {
                    name: "VIP",
                    subtitle: "Максимум возможностей для продвижения",
                    price: 2000,
                    features: [
                        { text: "Неограниченное количество работ", included: true },
                        { text: "Расширенная статистика: просмотры, лайки, возраст и пол аудитории; страны и города; источники переходов; самые популярные работы", included: true },
                        { text: "Статистика по каждой картине", included: true },
                        { text: "Приоритетное отображение в каталоге", included: true },
                        { text: "Отметка «VIP-автор»", included: true },
                        { text: "Попадание в рекомендации", included: true },
                        { text: "Добавление видео в процессе создания", included: true }
                    ]
                }
            }
        }
    },
    en: {
        tariffPlan: {
            title: "Pricing Plan",
            badge: "Best value",
            perMonth: "/mo",
            choosePlan: "Choose plan",
            plans: {
                basic: {
                    name: "Basic",
                    subtitle: "Essential features for an author",
                    price: 150,
                    features: [
                        { text: "Upload up to 7 artworks", included: true },
                        { text: "Basic statistics: views and likes", included: true },
                        { text: "Personal artist page", included: true },
                        { text: "Advanced statistics", included: false },
                        { text: "Priority in the catalog", included: false },
                        { text: "Participation in themed collections", included: false },
                        { text: "\"Premium author\" badge", included: false }
                    ]
                },
                premium: {
                    name: "Premium",
                    subtitle: "More features and tools",
                    price: 800,
                    features: [
                        { text: "Upload up to 20 artworks", included: true },
                        { text: "Advanced statistics: views, likes, audience age and gender; countries and cities; traffic sources; most popular artworks", included: true },
                        { text: "Statistics for each artwork", included: true },
                        { text: "Priority display in the catalog", included: true },
                        { text: "\"Premium author\" badge", included: true },
                        { text: "Featured in recommendations", included: false },
                        { text: "Add video to the creation process", included: false }
                    ]
                },
                vip: {
                    name: "VIP",
                    subtitle: "Maximum promotion opportunities",
                    price: 2000,
                    features: [
                        { text: "Unlimited number of artworks", included: true },
                        { text: "Advanced statistics: views, likes, audience age and gender; countries and cities; traffic sources; most popular artworks", included: true },
                        { text: "Statistics for each artwork", included: true },
                        { text: "Priority display in the catalog", included: true },
                        { text: "\"VIP author\" badge", included: true },
                        { text: "Featured in recommendations", included: true },
                        { text: "Add video to the creation process", included: true }
                    ]
                }
            }
        }
    },
    zh: {
        tariffPlan: {
            title: "价格方案",
            badge: "最划算",
            perMonth: "/月",
            choosePlan: "选择方案",
            plans: {
                basic: {
                    name: "基础",
                    subtitle: "为作者提供基础功能",
                    price: 150,
                    features: [
                        { text: "最多上传 7 件作品", included: true },
                        { text: "基础统计：浏览量和点赞", included: true },
                        { text: "艺术家个人主页", included: true },
                        { text: "高级统计", included: false },
                        { text: "目录优先展示", included: false },
                        { text: "参与主题精选", included: false },
                        { text: "「高级作者」标识", included: false }
                    ]
                },
                premium: {
                    name: "Premium",
                    subtitle: "更多功能与工具",
                    price: 800,
                    features: [
                        { text: "最多上传 20 件作品", included: true },
                        { text: "高级统计：浏览量、点赞、受众年龄与性别；国家与城市；流量来源；最受欢迎作品", included: true },
                        { text: "每件作品的统计数据", included: true },
                        { text: "目录优先展示", included: true },
                        { text: "「高级作者」标识", included: true },
                        { text: "进入推荐", included: false },
                        { text: "在创作过程中添加视频", included: false }
                    ]
                },
                vip: {
                    name: "VIP",
                    subtitle: "最大推广机会",
                    price: 2000,
                    features: [
                        { text: "作品数量无限制", included: true },
                        { text: "高级统计：浏览量、点赞、受众年龄与性别；国家与城市；流量来源；最受欢迎作品", included: true },
                        { text: "每件作品的统计数据", included: true },
                        { text: "目录优先展示", included: true },
                        { text: "「VIP 作者」标识", included: true },
                        { text: "进入推荐", included: true },
                        { text: "在创作过程中添加视频", included: true }
                    ]
                }
            }
        }
    }
};