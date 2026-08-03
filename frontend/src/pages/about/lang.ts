// src/pages/About/lang.ts

export type Language = 'ru' | 'en' | 'zh';

export const translations = {
    ru: {
        about: {
            title: 'TILININ\'S GALLERY',
            paragraphs: [
                {
                    text: ' - это современная площадка для знакомства с произведениями искусства и творческими проектами. Наша цель заключается в популяризации художественной культуры и предоставлении удобного доступа к работам талантливых авторов.',
                    highlight: 'TILININ\'S GALLERY'
                },
                {
                    text: 'Проект был создан Артёмом Тилиным в 2026 году, как пространство, объединяющее художников и ценителей искусства'
                },
                {
                    text: 'Галерея предоставляет возможность представить авторские работы широкой аудитории и способствует развитию творческого сообщества.'
                },
                {
                    text: 'Мы создаём пространство, где художники могут быть услышаны, а зрители - почувствовать настоящую связь с искусством.'
                }
            ]
        }
    },

    en: {
        about: {
            title: 'TILININ\'S GALLERY',
            paragraphs: [
                {
                    text: ' is a modern platform for getting acquainted with works of art and creative projects. Our goal is to popularize artistic culture and provide convenient access to the works of talented authors.',
                    highlight: 'TILININ\'S GALLERY'
                },
                {
                    text: 'The project was founded by Artyom Tilin in 2026 as a space that unites artists and art lovers.'
                },
                {
                    text: 'The gallery provides an opportunity to present original works to a wide audience and contributes to the development of the creative community.'
                },
                {
                    text: 'We create a space where artists can be heard and viewers can feel a real connection with art.'
                }
            ]
        }
    },

    zh: {
        about: {
            title: 'TILININ\'S GALLERY',
            paragraphs: [
                {
                    text: ' 是一个现代化的平台，用于欣赏艺术作品和创意项目。我们的目标是推广艺术文化，并为才华横溢的作者作品提供便捷的访问渠道。',
                    highlight: 'TILININ\'S GALLERY'
                },
                {
                    text: '该项目由阿尔乔姆·蒂林于2026年创立，是一个连接艺术家和艺术爱好者的空间。'
                },
                {
                    text: '画廊为向广大观众展示原创作品提供了机会，并促进了创意社区的发展。'
                },
                {
                    text: '我们创造了一个空间，让艺术家被听到，让观众感受到与艺术的真实联系。'
                }
            ]
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