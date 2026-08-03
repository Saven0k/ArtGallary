export type Language = 'ru' | 'en' | 'zh';
import CarIcon from "./icons/car.svg";
import LockIcon from "./icons/lock.svg";
import PaintingIcon from "./icons/painting.svg";
import SearchIcon from "./icons/search.svg";
import CanvasIcon from "./icons/canvas.svg"

export const translations = {
    ru: {
        home: {
            hero: {
                title: 'TILININ\'S GALLERY',
                subtitle: 'Открой для себя уникальные произведения талантливых художников',
                button: 'Стать участником галереи'
            },
            about: {
                title: 'Работаем с 2026 года',
                text: ' - это современная площадка для знакомства с произведениями искусства и творческими проектами. Наша цель заключается в популяризации художественной культуры и предоставлении удобного доступа к работам талантливых авторов.',
                highlight: 'TILININ\'S GALLERY',
                stats: {
                    works: 'Работ в каталоге',
                    artists: 'Художников',
                    clients: 'Довольных клиентов'
                },
                link: 'Узнать больше'
            },
            advantages: {
                title: 'Преимущества',
                items: [
                    {
                        title: 'Уникальная коллекция произведения искусств',
                        description: 'Тщательно отобранные работы современных и классических художников',
                        icon: CanvasIcon
                    },
                    {
                        title: 'Надёжная доставка',
                        description: 'Бережная упаковка и доставка произведения искусства',
                        icon: CarIcon
                    },
                    {
                        title: 'Развивай своё имя в искусстве',
                        description: 'Повышайте узнаваемость и привлекайте новых ценителей вашего искусства',
                        icon: PaintingIcon
                    },
                    {
                        title: 'Защита авторских прав',
                        description: 'Ваше авторство всегда указано рядом с работами',
                        icon: LockIcon
                    },
                    {
                        title: 'Детальный просмотр работ',
                        description: 'Возможность рассмотреть картины в высоком разрешении',
                        icon: SearchIcon
                    }
                ]
            },
            gallery: {
                title: 'Подборка галереи',
                link: 'Перейти в галерею'
            },
            events: {
                title: 'События галереи',
                button: 'ЧИТАТЬ ПОЛНОСТЬЮ',
                link: 'УЗНАТЬ БОЛЬШЕ'
            },
            consultation: {
                title: 'Арт-консультация',
                subtitle: 'Поможем вам с подбором предмета искусства для ваших целей.',
                button: 'ЗАПРОСИТЬ АРТ-КОНСУЛЬТАЦИЮ'
            }
        }
    },

    en: {
        home: {
            hero: {
                title: 'TILININ\'S GALLERY',
                subtitle: 'Discover unique works of talented artists',
                button: 'Become a gallery member'
            },
            about: {
                title: 'Working since 2026',
                text: ' is a modern platform for getting acquainted with works of art and creative projects. Our goal is to popularize artistic culture and provide convenient access to the works of talented authors.',
                highlight: 'TILININ\'S GALLERY',
                stats: {
                    works: 'Works in catalog',
                    artists: 'Artists',
                    clients: 'Happy clients'
                },
                link: 'Learn more'
            },
            advantages: {
                title: 'Advantages',
                items: [
                    {
                        title: 'Unique collection of artworks',
                        description: 'Carefully selected works by contemporary and classical artists',
                        icon: CanvasIcon
                    },
                    {
                        title: 'Reliable delivery',
                        description: 'Careful packaging and delivery of artwork',
                        icon: CarIcon
                    },
                    {
                        title: 'Develop your name in art',
                        description: 'Increase recognition and attract new connoisseurs of your art',
                        icon: PaintingIcon
                    },
                    {
                        title: 'Copyright protection',
                        description: 'Your authorship is always indicated next to the works',
                        icon: LockIcon
                    },
                    {
                        title: 'Detailed viewing of works',
                        description: 'Ability to view paintings in high resolution',
                        icon: SearchIcon
                    }
                ]
            },
            gallery: {
                title: 'Gallery selection',
                link: 'Go to gallery'
            },
            events: {
                title: 'Gallery events',
                button: 'READ FULL',
                link: 'LEARN MORE'
            },
            consultation: {
                title: 'Art consultation',
                subtitle: 'We will help you choose a piece of art for your purposes.',
                button: 'REQUEST ART CONSULTATION'
            }
        }
    },

    zh: {
        home: {
            hero: {
                title: 'TILININ\'S GALLERY',
                subtitle: '发现才华横溢艺术家的独特作品',
                button: '成为画廊会员'
            },
            about: {
                title: '自2026年开始运营',
                text: ' 是一个现代化的平台，用于欣赏艺术作品和创意项目。我们的目标是推广艺术文化，并为才华横溢的作者作品提供便捷的访问渠道。',
                highlight: 'TILININ\'S GALLERY',
                stats: {
                    works: '目录中的作品',
                    artists: '艺术家',
                    clients: '满意的客户'
                },
                link: '了解更多'
            },
            advantages: {
                title: '优势',
                items: [
                    {
                        title: '独特的艺术品收藏',
                        description: '精心挑选的现当代和古典艺术家作品',
                        icon: CanvasIcon
                    },
                    {
                        title: '可靠的配送',
                        description: '小心包装和配送艺术品',
                        icon: CarIcon
                    },
                    {
                        title: '发展您在艺术界的名声',
                        description: '提高知名度，吸引更多艺术鉴赏家',
                        icon: PaintingIcon
                    },
                    {
                        title: '版权保护',
                        description: '您的署名始终标注在作品旁边',
                        icon: LockIcon
                    },
                    {
                        title: '详细查看作品',
                        description: '能够以高分辨率查看画作',
                        icon: SearchIcon
                    }
                ]
            },
            gallery: {
                title: '画廊精选',
                link: '进入画廊'
            },
            events: {
                title: '画廊活动',
                button: '阅读全文',
                link: '了解更多'
            },
            consultation: {
                title: '艺术咨询',
                subtitle: '我们将帮助您选择适合您需求的艺术品。',
                button: '请求艺术咨询'
            }
        }
    }
};

export const getTranslation = (lang: Language, path: string): string => {
    const keys = path.split('.');
    let result: any = translations[lang];

    for (const key of keys) {
        if (result && result[key] !== undefined) {
            result = result[key];
        } else {
            return path;
        }
    }

    return typeof result === 'string' ? result : path;
};

export const useTranslation = (lang: Language) => {
    return {
        t: (path: string) => getTranslation(lang, path),
        translations: translations[lang]
    };
};