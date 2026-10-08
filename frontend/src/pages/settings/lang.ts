import { translatedValue } from '../../utils/translations';


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
                        title: 'Уведомления по email',
                        subtitle: 'Лайки, новые подписчики и работы любимых авторов'
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
                        title: 'Email notifications',
                        subtitle: 'Likes, new followers and artwork from your favorite artists'
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
                        title: '邮件通知',
                        subtitle: '接收点赞、新关注者和喜爱艺术家的新作品通知'
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

export const notificationSettingsCopy = {
    ru: {
        intro: 'Только то, что важно вам: новые подписчики, лайки и публикации авторов, на которых вы подписаны.',
        login: 'Войдите, чтобы настроить уведомления для своего аккаунта.', signIn: 'Войти',
        active: 'Включено', inactive: 'Выключено', mailUnavailable: 'Отправка писем пока не подключена', pushUnavailable: 'Push пока не подключены',
        deviceInactive: 'Этот браузер ещё не подключён', connect: 'Подключить браузер',
        unsupported: 'Этот браузер не поддерживает push. Попробуйте другой браузер или включите email.',
        denied: 'Разрешите уведомления в настройках сайта в браузере и попробуйте снова.',
        failed: 'Не удалось сохранить или отправить. Проверьте подключение и попробуйте снова.',
        rateLimit: 'Повторную проверку можно отправить через минуту.', saved: 'Настройки сохранены', testSent: 'Проверка отправлена. Посмотрите уведомления.',
        loading: 'Загружаем настройки…', busy: 'Сохраняем…', test: 'Проверить', preview: 'Пример уведомления',
        previewTitle: 'У вашей работы новый поклонник', previewBody: 'Анна оценила вашу картину «Тихое утро».',
        mailHint: 'Письма будут приходить на адрес вашего аккаунта.', pushHint: 'Уведомления приходят даже когда вкладка закрыта. Браузер попросит ваше разрешение.',
        open: 'Посмотреть работу', email: 'EMAIL', browser: 'БРАУЗЕР',
    },
    en: {
        intro: 'Stay connected: new followers, likes and new artwork from artists you follow.',
        login: 'Sign in to manage notifications for your account.', signIn: 'Sign in',
        active: 'Enabled', inactive: 'Disabled', mailUnavailable: 'Email delivery is not connected yet', pushUnavailable: 'Push is not connected yet',
        deviceInactive: 'This browser is not connected yet', connect: 'Connect browser',
        unsupported: 'This browser does not support push. Try another browser or enable email.',
        denied: 'Allow notifications in this site’s browser settings and try again.',
        failed: 'Could not save or send. Check your connection and try again.',
        rateLimit: 'Please wait one minute before sending another test.', saved: 'Settings saved', testSent: 'Test sent. Check your notifications.',
        loading: 'Loading settings…', busy: 'Saving…', test: 'Send test', preview: 'Notification preview',
        previewTitle: 'Your artwork has a new admirer', previewBody: 'Anna liked your artwork “Quiet Morning”.',
        mailHint: 'Messages will arrive at your account’s email address.', pushHint: 'Notifications arrive even when the tab is closed. Your browser will ask for permission.',
        open: 'View artwork', email: 'EMAIL', browser: 'BROWSER',
    },
    zh: {
        intro: '关注重要动态：新关注者、点赞以及您关注的艺术家的新作品。',
        login: '登录后即可设置您账户的通知。', signIn: '登录',
        active: '已开启', inactive: '已关闭', mailUnavailable: '邮件服务尚未连接', pushUnavailable: '推送服务尚未连接',
        deviceInactive: '此浏览器尚未连接', connect: '连接浏览器',
        unsupported: '此浏览器不支持推送。请尝试其他浏览器或开启邮件通知。',
        denied: '请在浏览器的网站设置中允许通知，然后重试。',
        failed: '保存或发送失败。请检查网络连接后重试。',
        rateLimit: '请等待一分钟后再发送测试通知。', saved: '设置已保存', testSent: '测试已发送，请查看通知。',
        loading: '正在加载设置…', busy: '正在保存…', test: '发送测试', preview: '通知预览',
        previewTitle: '您的作品有了一位新欣赏者', previewBody: '安娜赞了您的作品《宁静的早晨》。',
        mailHint: '邮件将发送到您的账户邮箱。', pushHint: '即使关闭标签页也能收到通知。浏览器会请求您的授权。',
        open: '查看作品', email: '邮件', browser: '浏览器',
    },
};

export const getTranslation = (lang: Language, path: string): string => {
    return translatedValue(settingsTranslations[lang], path);
};

export const useSettingsTranslation = (lang: Language) => {
    return {
        t: (path: string) => getTranslation(lang, path),
        translations: settingsTranslations[lang]
    };
};
