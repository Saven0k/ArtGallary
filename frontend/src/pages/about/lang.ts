// src/pages/About/lang.ts

import tema from "./images/tema.png"
import margarita from "./images/margarita.png"
import roman from "./images/roma.jpg"
import any from "./images/any.png"

export type Language = 'ru' | 'en' | 'zh';

export const translations = {
    ru: {
        about: {
            title: 'О нас',
            subtitle: 'TILININ\'S GALLERY',
            paragraphs: [
                {
                    text: ' - это современная площадка для знакомства с произведениями искусства и творческими проектами. Наша цель заключается в популяризации художественной культуры и предоставлении удобного доступа к работам талантливых авторов.',
                    highlight: 'TILININ\'S GALLERY'
                },
                {
                    text: 'Проект был создан Артёмом Тилининым в 2026 году, как пространство, объединяющее художников и ценителей искусства.'
                },
                {
                    text: 'Галерея даёт возможность представить авторские работы широкой аудитории и способствует развитию творческого сообщества.'
                },
                {
                    text: 'В нашей галерее публикуются и признанные авторы и те, кому только предстоит стать известными. Нам важно, чтобы каждый нашёл что-то своё.'
                }
            ],
            banner: {
                text: 'Мы не останавливаемся на одном виде искусства. У нас можно найти как классическую живопись, так и современную фотографию или постеры.',
                button: 'ПЕРЕЙТИ В ГАЛЕРЕЮ',
                quote: 'Мы даём художникам возможность показать себя. А вам — выбрать работу, которая будет радовать каждый день.'
            },
            team: {
                title: 'Наша команда',
                members: [
                    {
                        name: 'Артём Тилинин',
                        role: 'Основатель',
                        image: tema
                    },
                    {
                        name: 'Маргарита Тилинина',
                        role: 'Мать основателя',
                        image: margarita
                    },
                    {
                        name: 'Роман Савёнок',
                        role: 'Разработчик сайта',
                        image: roman
                    },
                    {
                        name: 'Олейник Анна',
                        role: 'Художник сайта',
                        image: any
                    }
                ]
            }
        }
    },
    en: {
        about: {
            title: 'About Us',
            subtitle: 'TILININ\'S GALLERY',
            paragraphs: [
                {
                    text: ' is a modern platform for getting acquainted with works of art and creative projects. Our goal is to popularize artistic culture and provide convenient access to the works of talented authors.',
                    highlight: 'TILININ\'S GALLERY'
                },
                {
                    text: 'The project was created by Artem Tilinin in 2026 as a space that unites artists and art connoisseurs.'
                },
                {
                    text: 'The gallery provides an opportunity to present original works to a wide audience and contributes to the development of the creative community.'
                },
                {
                    text: 'Our gallery features both established authors and those who are just about to become famous. We want everyone to find something special for themselves.'
                }
            ],
            banner: {
                text: "We don't limit ourselves to one art form. You can find both classical painting and modern photography or posters here.",
                button: 'GO TO GALLERY',
                quote: 'We give artists the opportunity to show themselves. And you — to choose a work that will delight you every day.'
            },
            team: {
                title: 'Our Team',
                members: [
                    {
                        name: 'Artem Tilinin',
                        role: 'Founder',
                        image: tema
                    },
                    {
                        name: 'Margarita Tilinina',
                        role: "Founder's Mother",
                        image: margarita
                    },
                    {
                        name: 'Roman Savenok',
                        role: 'Site Developer',
                        image: roman
                    },
                    {
                        name: 'Anna Oleynik',
                        role: 'Site Artist',
                        image: any
                    }
                ]
            }
        }
    },
    zh: {
        about: {
            title: '关于我们',
            subtitle: 'TILININ\'S GALLERY',
            paragraphs: [
                {
                    text: ' 是一个现代化的平台，用于欣赏艺术作品和创意项目。我们的目标是推广艺术文化，并为才华横溢的作者作品提供便捷的访问渠道。',
                    highlight: 'TILININ\'S GALLERY'
                },
                {
                    text: '该项目由阿尔乔姆·蒂利宁于2026年创建，作为一个连接艺术家和艺术鉴赏家的空间。'
                },
                {
                    text: '画廊为展示原创作品提供了机会，并促进了创意社区的发展。'
                },
                {
                    text: '我们的画廊既有知名艺术家，也有即将成名的艺术家。我们希望每个人都能找到属于自己的特别之处。'
                }
            ],
            banner: {
                text: '我们不仅限于一种艺术形式。您可以在这里找到古典绘画、现代摄影或海报。',
                button: '前往画廊',
                quote: '我们给艺术家展示自己的机会。而您——选择一件让您每天都能感到愉悦的作品。'
            },
            team: {
                title: '我们的团队',
                members: [
                    {
                        name: '阿尔乔姆·蒂利宁',
                        role: '创始人',
                        image: tema
                    },
                    {
                        name: '玛格丽塔·蒂利尼娜',
                        role: '创始人之母',
                        image: margarita
                    },
                    {
                        name: '罗曼·萨维诺克',
                        role: '网站开发人员',
                        image: roman
                    },
                    {
                        name: '安娜·奥莱尼克',
                        role: '网站设计师',
                        image: any
                    }
                ]
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