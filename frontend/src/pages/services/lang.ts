import artConsulationPhoto from "./images/art-c.png"
import deliveryPhoto from "./images/delivery.png"
import orderPhoto from "./images/order.png"
import rentPhoto from "./images/rent.png"
export type Language = 'ru' | 'en' | 'zh';

export const servicesTranslations = {
    ru: {
        services: {
            title: 'Услуги',
            subtitle: 'Мы создаём не просто картины, а особый опыт. Наши услуги помогут вам глубже погрузиться в искусство и сделать его частью вашей жизни',
            more: 'Подробнее',
            priceLabel: 'Стоимость и сроки - индивидуально',
            cards: [
                {
                    id: 1,
                    icon: artConsulationPhoto,
                    title: 'Арт-консультация',
                    description: 'Профессиональная консультация художника по подбору и размещению произведений искусства в вашем интерьере',
                    features: [
                        'Подбор работ',
                        'Рекомендации по размеру и размещению',
                        'Полное сопровождение сделки'
                    ]
                },
                {
                    id: 2,
                    icon: deliveryPhoto,
                    title: 'Доставка "White Glove"',
                    description: 'Особый способ доставки для произведений, который включает бережное отношение на каждом этапе пути',
                    features: [
                        'Безопасная перевозка',
                        'Доставка до двери',
                        'Контроль сохранности работы'
                    ]
                },
                {
                    id: 3,
                    icon: orderPhoto,
                    title: 'Индивидуальный заказ',
                    description: 'Произведение, созданное специально для вас - от первой идеи до финального исполнения',
                    features: [
                        'Портрет',
                        'Декоративное панно',
                        'Индивидуальный сюжет'
                    ]
                },
                {
                    id: 4,
                    icon: rentPhoto,
                    title: 'Прокат',
                    description: 'Выберите произведение из коллекции галереи для дома, офиса, съёмки или особого события',
                    features: [
                        'Подбор произведения',
                        'Согласование срока проката',
                        'Бережная доставка'
                    ]
                }
            ]
        }
    },
    en: {
        services: {
            title: 'Services',
            subtitle: 'We create not just paintings, but a special experience. Our services will help you dive deeper into art and make it a part of your life',
            more: 'Learn more',
            priceLabel: 'Cost and terms - individually',
            cards: [
                {
                    id: 1,
                    icon: artConsulationPhoto,
                    title: 'Art Consultation',
                    description: 'Professional consultation with an author on the selection and placement of artworks in your interior',
                    features: [
                        'Selection of works',
                        'Recommendations on size and placement',
                        'Full transaction support'
                    ]
                },
                {
                    id: 2,
                    icon: deliveryPhoto,
                    title: '"White Glove" Delivery',
                    description: 'A special delivery method for artworks that includes careful handling at every stage of the journey',
                    features: [
                        'Safe transportation',
                        'Door-to-door delivery',
                        'Work integrity control'
                    ]
                },
                {
                    id: 3,
                    icon: orderPhoto,
                    title: 'Custom Order',
                    description: 'A piece created specifically for you - from the first idea to the final execution',
                    features: [
                        'Portrait',
                        'Decorative panel',
                        'Individual subject'
                    ]
                },
                {
                    id: 4,
                    icon: rentPhoto,
                    title: 'Rental',
                    description: 'Choose a piece from the gallery collection for your home, office, shoot or special event',
                    features: [
                        'Selection of artwork',
                        'Rental term agreement',
                        'Careful delivery'
                    ]
                }
            ]
        }
    },
    zh: {
        services: {
            title: '服务',
            subtitle: '我们创造的不仅仅是画作，而是一种特殊的体验。我们的服务将帮助您更深入地了解艺术，并使其成为您生活的一部分',
            more: '了解更多',
            priceLabel: '价格和时间 - 单独商议',
            cards: [
                {
                    id: 1,
                    icon: artConsulationPhoto,
                    title: '艺术咨询',
                    description: '专业艺术家咨询服务，帮您挑选和布置室内艺术作品',
                    features: [
                        '作品挑选',
                        '尺寸和摆放建议',
                        '全程交易陪同'
                    ]
                },
                {
                    id: 2,
                    icon: deliveryPhoto,
                    title: '"白手套"配送',
                    description: '专为艺术作品设计的特殊配送方式，在运输的每个环节都细心呵护',
                    features: [
                        '安全运输',
                        '送货上门',
                        '作品完整性监控'
                    ]
                },
                {
                    id: 3,
                    icon: orderPhoto,
                    title: '定制订单',
                    description: '专为您创作的作品 —— 从最初的创意到最终的呈现',
                    features: [
                        '肖像画',
                        '装饰画板',
                        '个性化主题'
                    ]
                },
                {
                    id: 4,
                    icon: rentPhoto,
                    title: '租赁',
                    description: '从画廊收藏中挑选作品，用于家居、办公室、拍摄或特别活动',
                    features: [
                        '作品挑选',
                        '租赁期限协商',
                        '细心配送'
                    ]
                }
            ]
        }
    }
};

export const getTranslation = (lang: Language, path: string): string => {
    const keys = path.split('.');
    let result: any = servicesTranslations[lang];

    for (const key of keys) {
        if (result && result[key] !== undefined) {
            result = result[key];
        } else {
            return path;
        }
    }

    return typeof result === 'string' ? result : path;
};