// src/pages/Settings/lang.ts

export type Language = 'ru' | 'en' | 'zh';

export const settingsTranslations = {
    ru: {
        title: 'Настройки',
        subtitle: 'Настройте сайт под себя',
        cards: {
            language: {
                title: 'Язык'
            },
            notifications: {
                title: 'Уведомления',
                rows: {
                    email: {
                        title: 'Email-рассылка',
                        subtitle: 'Получать новости и уведомления'
                    },
                    push: {
                        title: 'Push-уведомления',
                        subtitle: 'Получать уведомления в браузере'
                    }
                }
            },
            management: {
                title: 'Управление',
                reset: 'Сбросить настройки'
            }
        },
        settings: {
            cards: {
                language: {
                    title: "Язык",
                },
            },

            language: {
                title: "Язык интерфейса",
                description: "Выберите предпочтительный язык",

                languages: {
                    ru: "Русский",
                    en: "English",
                },
            },
        }
    },
    en: {
        title: 'Settings',
        subtitle: 'Customize your experience',
        cards: {
            language: {
                title: 'Language'
            },
            notifications: {
                title: 'Notifications',
                rows: {
                    email: {
                        title: 'Email newsletter',
                        subtitle: 'Receive news and updates'
                    },
                    push: {
                        title: 'Push notifications',
                        subtitle: 'Receive browser notifications'
                    }
                }
            },
            management: {
                title: 'Management',
                reset: 'Reset settings'
            }
        },
        settings: {
            cards: {
                language: {
                    title: "Language",
                },
            },

            language: {
                title: "Interface language",
                description: "Choose your preferred language",

                languages: {
                    ru: "Russian",
                    en: "English",
                },
            },
        }
    },
    zh: {
        title: '设置',
        subtitle: '自定义您的体验',
        cards: {
            language: {
                title: '语言'
            },
            notifications: {
                title: '通知',
                rows: {
                    email: {
                        title: '邮件订阅',
                        subtitle: '接收新闻和更新'
                    },
                    push: {
                        title: '推送通知',
                        subtitle: '接收浏览器通知'
                    }
                }
            },
            management: {
                title: '管理',
                reset: '重置设置'
            }
        },
        settings: {
            language: {
                title: "界面语言",
                description: "请选择您偏好的语言",

                languages: {
                    ru: "俄语",
                    en: "英语",
                    zh: "中文",
                },
            },
        },
    }
};

export const languageSwitcherTranslations = {
    ru: {
        ru: 'Русский',
        en: 'English',
        zh: '中文'
    },
    en: {
        ru: 'Russian',
        en: 'English',
        zh: 'Chinese'
    },
    zh: {
        ru: '俄语',
        en: '英语',
        zh: '中文'
    }
};

export const getTranslation = (lang: Language, path: string): string => {
    const keys = path.split('.');
    let result: any = settingsTranslations[lang];

    for (const key of keys) {
        if (result && result[key] !== undefined) {
            result = result[key];
        } else {
            return path;
        }
    }

    return typeof result === 'string' ? result : path;
};

export const useSettingsTranslation = (lang: Language) => {
    return {
        t: (path: string) => getTranslation(lang, path),
        translations: settingsTranslations[lang]
    };
};