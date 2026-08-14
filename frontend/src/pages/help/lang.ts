// src/pages/Help/lang.ts
export type Language = 'ru' | 'en' | 'zh';
import PaintImage from  "./icons/PaintImage.svg";
import ScalesImage from "./icons/SclesImage.svg";
import HumanImage from "./icons/humanImage.svg";
import SettingsImage from "./icons/SettingsImage.svg";

import { BrushIcon, NotificationIcon, PictureIcon, ScalesIcon } from "./icons/Icons";

export const translations = {
  ru: {
    help: {
      title: 'Помощь',
      subtitle: 'Мы здесь, чтобы помочь вам. Найдите ответы на вопросы или свяжитесь с нами.',
      faq: {
        title: 'Часто задаваемые вопросы',
        tabs: {
          general: 'Общие',
          account: 'Аккаунт',
          payment: 'Оплата',
          technical: 'Технические'
        },
        items: [
          {
            question: 'Как создать аккаунт художника?',
            answer: 'Для регистрации художника перейдите в профиль, выберите соответствующий тип аккаунта и заполните информацию о себе.',
            tag: 'account'
          },
          {
            question: 'Как выставить картину на продажу?',
            answer: 'После прохождения модерации откройте личный кабинет и нажмите «Добавить работу».',
            tag: 'general'
          },
          {
            question: 'Сколько времени занимает модерация?',
            answer: 'Обычно модерация занимает от 24 до 48 часов после отправки работы.',
            tag: 'general'
          },
          {
            question: 'Как приобрести картину?',
            answer: 'Откройте страницу картины и нажмите кнопку «Купить». Далее следуйте инструкции оформления заказа.',
            tag: 'payment'
          },
          {
            question: 'Как изменить данные профиля?',
            answer: 'Перейдите в настройки профиля и внесите необходимые изменения.',
            tag: 'account'
          },
          {
            question: 'Что делать, если не приходит письмо с подтверждением?',
            answer: 'Проверьте папку «Спам». Если письма нет, воспользуйтесь повторной отправкой.',
            tag: 'technical'
          },
          {
            question: 'Как отменить покупку картины?',
            answer: 'Свяжитесь с поддержкой до момента отправки заказа.',
            tag: 'payment'
          },
          {
            question: 'Можно ли редактировать картину после публикации?',
            answer: 'Да. Вы можете изменить описание, стоимость и фотографии через личный кабинет.',
            tag: 'general'
          }
        ]
      },
      knowledge: {
        title: 'База знаний',
        subtitle: 'Инструкции и руководства',
        items: [
          {
            title: 'Как начать работать с платформой?',
            description: 'Пошаговая инструкция для новых пользователей',
            link: '/help/getting-started'
          },
          {
            title: 'Как добавить первую картину?',
            description: 'Подробное руководство по загрузке работ',
            link: '/help/add-art'
          },
          {
            title: 'Как проходит модерация?',
            description: 'Все этапы проверки контента на платформе',
            link: '/help/moderation'
          },
          {
            title: 'Как управлять профилем?',
            description: 'Настройки и редактирование личного кабинета',
            link: '/help/profile'
          }
        ]
      },
      support: {
        title: 'Чат с поддержкой',
        subtitle: 'Мы здесь, чтобы помочь вам',
        email: 'Email:',
        phone: 'Телефон:',
        hours: 'Часы работы:',
        hoursValue: 'Пн-Пт: 9:00 - 21:00 (МСК)',
        button: 'Написать в чат'
      },
      resources: {
        title: 'Полезные ресурсы',
        items: [
          {
            title: 'Руководство для художников',
            description: 'Как начать продавать свои работы?',
            content: "",
            icon: BrushIcon,
            img: "",
            list: [
              {
                icon: "1",
                title: "Создай профиль художника",
                description: "Заполните информацию о себе: добавьте фотографию, краткую биографию, расскажите о своем творческом пути, образовании, технике и вдохновении. Чем подробнее оформлен профиль, тем больше доверия он вызывает у покупателей."
              },
              {
                icon: "2",
                title: "Загрузи свои работы",
                description: "Используйте качественные фотографии при хорошем освещении. Изображение должно быть четким, без посторонних предметов и цветовых искажений."
              },
              {
                icon: "3",
                title: "Дождитесь модерации",
                description: "Каждая работа проходит проверку перед публикацией. Обычно модерация занимает до 24 часов. Если работа будет отклонена, вы получите уведомление с причиной и сможете внести изменения."
              },
              {
                icon: "4",
                title: "Продвигайте свои работы",
                description: "Регулярно публикуйте новые произведения, участвуйте в выставках платформы, делитесь ссылками на свои работы в социальных сетях и рассказывайте о своем творчестве."
              },
            ]
          },
          {
            title: 'Правовая информация для авторов',
            description: 'Оферта и политика конфиденциальности',
            icon: ScalesIcon,
            img: "",
            list: [
              {
                icon: HumanImage,
                title: "Пользовательское соглашение",
                description: "Используя платфому, вы соглашаетесь соблюдать правила сообщества и условия использования сервиса."
              },
              {
                icon: ScalesImage,
                title: "Политика конфиденциальности",
                description: "Мы собираем данные, которые необходимы для работы платформы: имя пользователя; адрес электронной почты; информацию профиля. Персональные данные не передаются третьим лицам без законных оснований."
              },
              {
                icon: PaintImage,
                title: "Авторские права",
                description: "Все авторские права на произведения принадлежат их создателям. Размещая работу на платформе, вы подтверждаете, что являетесь ее автором или обладаете необходимыми правами на публикацию."
              },
              {
                icon: SettingsImage,
                title: "Безопасность",
                description: "Мы используем современные методы защиты данных, однако рекомендуем использовать надежный пароль и не передавать данные своего аккаунта другим лицам."
              },
            ]
          },
          {
            title: 'Арт-консультация и помощь',
            description: 'Помощь при подборе картин для вас',
            icon: PictureIcon,
            img: "",
            list: [
              {
                icon: "1",
                title: "Создай профиль художника",
                description: "Заполните информацию о себе: добавьте фотографию, краткую биографию, расскажите о своем творческом пути, образовании, технике и вдохновении. Чем подробнее оформлен профиль, тем больше доверия он вызывает у покупателей."
              },
              {
                icon: "2",
                title: "Загрузи свои работы",
                description: "Используйте качественные фотографии при хорошем освещении. Изображение должно быть четким, без посторонних предметов и цветовых искажений."
              },
              {
                icon: "3",
                title: "Дождитесь модерации",
                description: "Каждая работа проходит проверку перед публикацией. Обычно модерация занимает до 24 часов. Если работа будет отклонена, вы получите уведомление с причиной и сможете внести изменения."
              },
              {
                icon: "4",
                title: "Продвигайте свои работы",
                description: "Регулярно публикуйте новые произведения, участвуйте в выставках платформы, делитесь ссылками на свои работы в социальных сетях и рассказывайте о своем творчестве."
              },
            ]
          },
          {
            title: 'Новости арт-рынка и полезные статьи',
            description: 'Обзоры картин и события в мире искусства',
            icon: NotificationIcon,
            img: "",
            list: [
              {
                icon: "1",
                title: "Создай профиль художника",
                description: "Заполните информацию о себе: добавьте фотографию, краткую биографию, расскажите о своем творческом пути, образовании, технике и вдохновении. Чем подробнее оформлен профиль, тем больше доверия он вызывает у покупателей."
              },
              {
                icon: "2",
                title: "Загрузи свои работы",
                description: "Используйте качественные фотографии при хорошем освещении. Изображение должно быть четким, без посторонних предметов и цветовых искажений."
              },
              {
                icon: "3",
                title: "Дождитесь модерации",
                description: "Каждая работа проходит проверку перед публикацией. Обычно модерация занимает до 24 часов. Если работа будет отклонена, вы получите уведомление с причиной и сможете внести изменения."
              },
              {
                icon: "4",
                title: "Продвигайте свои работы",
                description: "Регулярно публикуйте новые произведения, участвуйте в выставках платформы, делитесь ссылками на свои работы в социальных сетях и рассказывайте о своем творчестве."
              },
            ]
          }
        ]
      },
      sidebar: {
        questions: {
          title: 'Вопросы?',
          description: 'Быстрые ответы на частые вопросы'
        },
        knowledge: {
          title: 'База знаний',
          description: 'Инструкции и руководства'
        },
        support: {
          title: 'Чат с поддержкой',
          description: 'Email: support@artgallery.com'
        }
      }
    }
  },

  en: {
    help: {
      title: 'Help Center',
      subtitle: "We're here to help you. Find answers to your questions or contact us.",
      faq: {
        title: 'Frequently Asked Questions',
        tabs: {
          general: 'General',
          account: 'Account',
          payment: 'Payment',
          technical: 'Technical'
        },
        items: [
          {
            question: 'How to create an artist account?',
            answer: 'To register as an artist, go to your profile, select the appropriate account type and fill in your information.',
            tag: 'account'
          },
          {
            question: 'How to list a painting for sale?',
            answer: 'After moderation, open your dashboard and click "Add Work".',
            tag: 'general'
          },
          {
            question: 'How long does moderation take?',
            answer: 'Moderation usually takes 24 to 48 hours after submission.',
            tag: 'general'
          },
          {
            question: 'How to purchase a painting?',
            answer: 'Open the painting page and click "Buy". Then follow the order instructions.',
            tag: 'payment'
          },
          {
            question: 'How to change profile data?',
            answer: 'Go to profile settings and make the necessary changes.',
            tag: 'account'
          },
          {
            question: 'What to do if I don\'t receive a confirmation email?',
            answer: 'Check your spam folder. If still missing, request a resend.',
            tag: 'technical'
          },
          {
            question: 'How to cancel a painting purchase?',
            answer: 'Contact support before the order is shipped.',
            tag: 'payment'
          },
          {
            question: 'Can I edit a painting after publication?',
            answer: 'Yes. You can edit description, price and photos through your dashboard.',
            tag: 'general'
          }
        ]
      },
      knowledge: {
        title: 'Knowledge Base',
        subtitle: 'Instructions and guides',
        items: [
          {
            title: 'How to start working with the platform?',
            description: 'Step-by-step guide for new users',
            link: '/help/getting-started'
          },
          {
            title: 'How to add your first painting?',
            description: 'Detailed guide for uploading artworks',
            link: '/help/add-art'
          },
          {
            title: 'How does moderation work?',
            description: 'All stages of content moderation',
            link: '/help/moderation'
          },
          {
            title: 'How to manage your profile?',
            description: 'Settings and editing your account',
            link: '/help/profile'
          }
        ]
      },
      support: {
        title: 'Support Chat',
        subtitle: "We're here to help you",
        email: 'Email:',
        phone: 'Phone:',
        hours: 'Working hours:',
        hoursValue: 'Mon-Fri: 9:00 - 21:00 (MSK)',
        button: 'Write to chat'
      },
      resources: {
        title: 'Useful Resources',
        items: [
          {
            title: 'Artist Guide',
            description: 'How to start selling your work?',
            content: "",
            icon: BrushIcon,
            img: "",
            list: [
              {
                icon: "1",
                title: "Create an artist profile",
                description: "Fill in your information: add a photo, a short biography, tell about your creative journey, education, technique and inspiration. The more detailed your profile is, the more trust it inspires in buyers."
              },
              {
                icon: "2",
                title: "Upload your works",
                description: "Use high-quality photos with good lighting. The image should be clear, without foreign objects and color distortions."
              },
              {
                icon: "3",
                title: "Wait for moderation",
                description: "Each work is reviewed before publication. Moderation usually takes up to 24 hours. If your work is rejected, you will receive a notification with the reason and will be able to make changes."
              },
              {
                icon: "4",
                title: "Promote your works",
                description: "Regularly publish new works, participate in platform exhibitions, share links to your works on social networks and talk about your creativity."
              },
            ]
          },
          {
            title: 'Legal Information for Authors',
            description: 'Terms and Privacy Policy',
            icon: ScalesIcon,
            img: "",
            list: [
              {
                icon: HumanImage,
                title: "Terms of Service",
                description: "By using the platform, you agree to comply with the community rules and terms of service."
              },
              {
                icon: ScalesImage,
                title: "Privacy Policy",
                description: "We collect data necessary for the platform's operation: username; email address; profile information. Personal data is not transferred to third parties without legal grounds."
              },
              {
                icon: PaintImage,
                title: "Copyright",
                description: "All copyrights to works belong to their creators. By posting a work on the platform, you confirm that you are its author or have the necessary rights to publish it."
              },
              {
                icon: SettingsImage,
                title: "Security",
                description: "We use modern data protection methods, however we recommend using a strong password and not sharing your account data with other persons."
              },
            ]
          },
          {
            title: 'Art Consultation & Help',
            description: 'Help with selecting paintings for you',
            icon: PictureIcon,
            img: "",
            list: [
              {
                icon: "1",
                title: "Create an artist profile",
                description: "Fill in your information: add a photo, a short biography, tell about your creative journey, education, technique and inspiration. The more detailed your profile is, the more trust it inspires in buyers."
              },
              {
                icon: "2",
                title: "Upload your works",
                description: "Use high-quality photos with good lighting. The image should be clear, without foreign objects and color distortions."
              },
              {
                icon: "3",
                title: "Wait for moderation",
                description: "Each work is reviewed before publication. Moderation usually takes up to 24 hours. If your work is rejected, you will receive a notification with the reason and will be able to make changes."
              },
              {
                icon: "4",
                title: "Promote your works",
                description: "Regularly publish new works, participate in platform exhibitions, share links to your works on social networks and talk about your creativity."
              },
            ]
          },
          {
            title: 'Art Market News & Articles',
            description: 'Art reviews and events in the art world',
            icon: NotificationIcon,
            img: "",
            list: [
              {
                icon: "1",
                title: "Create an artist profile",
                description: "Fill in your information: add a photo, a short biography, tell about your creative journey, education, technique and inspiration. The more detailed your profile is, the more trust it inspires in buyers."
              },
              {
                icon: "2",
                title: "Upload your works",
                description: "Use high-quality photos with good lighting. The image should be clear, without foreign objects and color distortions."
              },
              {
                icon: "3",
                title: "Wait for moderation",
                description: "Each work is reviewed before publication. Moderation usually takes up to 24 hours. If your work is rejected, you will receive a notification with the reason and will be able to make changes."
              },
              {
                icon: "4",
                title: "Promote your works",
                description: "Regularly publish new works, participate in platform exhibitions, share links to your works on social networks and talk about your creativity."
              },
            ]
          }
        ]
      },
      sidebar: {
        questions: {
          title: 'Questions?',
          description: 'Quick answers to frequently asked questions'
        },
        knowledge: {
          title: 'Knowledge Base',
          description: 'Instructions and guides'
        },
        support: {
          title: 'Support Chat',
          description: 'Email: support@artgallery.com'
        }
      }
    }
  },

  zh: {
    help: {
      title: '帮助中心',
      subtitle: '我们在这里帮助您。查找问题答案或联系我们。',
      faq: {
        title: '常见问题解答',
        tabs: {
          general: '通用',
          account: '账户',
          payment: '支付',
          technical: '技术'
        },
        items: [
          {
            question: '如何创建艺术家账户？',
            answer: '要注册为艺术家，请转到您的个人资料，选择适当的账户类型并填写您的信息。',
            tag: 'account'
          },
          {
            question: '如何将画作上架出售？',
            answer: '通过审核后，打开您的控制面板并点击"添加作品"。',
            tag: 'general'
          },
          {
            question: '审核需要多长时间？',
            answer: '审核通常在提交后需要24到48小时。',
            tag: 'general'
          },
          {
            question: '如何购买画作？',
            answer: '打开画作页面并点击"购买"。然后按照订单说明操作。',
            tag: 'payment'
          },
          {
            question: '如何更改个人资料数据？',
            answer: '转到个人资料设置并进行必要的更改。',
            tag: 'account'
          },
          {
            question: '如果没有收到确认邮件怎么办？',
            answer: '检查您的垃圾邮件文件夹。如果仍然没有，请请求重新发送。',
            tag: 'technical'
          },
          {
            question: '如何取消画作购买？',
            answer: '在订单发货前联系客服支持。',
            tag: 'payment'
          },
          {
            question: '发布后可以编辑画作吗？',
            answer: '是的。您可以通过控制面板编辑描述、价格和照片。',
            tag: 'general'
          }
        ]
      },
      knowledge: {
        title: '知识库',
        subtitle: '说明和指南',
        items: [
          {
            title: '如何开始使用平台？',
            description: '新用户分步指南',
            link: '/help/getting-started'
          },
          {
            title: '如何添加第一幅画作？',
            description: '上传作品的详细指南',
            link: '/help/add-art'
          },
          {
            title: '审核如何进行？',
            description: '内容审核的所有阶段',
            link: '/help/moderation'
          },
          {
            title: '如何管理个人资料？',
            description: '账户设置和编辑',
            link: '/help/profile'
          }
        ]
      },
      support: {
        title: '客服聊天',
        subtitle: '我们在这里帮助您',
        email: '邮箱：',
        phone: '电话：',
        hours: '工作时间：',
        hoursValue: '周一至周五：9:00 - 21:00（莫斯科时间）',
        button: '发送消息'
      },
      resources: {
        title: '实用资源',
        items: [
          {
            title: '艺术家指南',
            description: '如何开始销售您的作品？',
            content: "",
            icon: BrushIcon,
            img: "",
            list: [
              {
                icon: "1",
                title: "创建艺术家简介",
                description: "填写您的信息：添加照片、简短传记，讲述您的创作历程、教育背景、技法和灵感。简介越详细，越能赢得买家的信任。"
              },
              {
                icon: "2",
                title: "上传您的作品",
                description: "使用光线良好的高质量照片。图像应清晰，无杂物和色彩失真。"
              },
              {
                icon: "3",
                title: "等待审核",
                description: "每件作品在发布前都会经过审核。审核通常需要24小时。如果作品被拒绝，您将收到通知并可以修改。"
              },
              {
                icon: "4",
                title: "推广您的作品",
                description: "定期发布新作品，参与平台展览，在社交网络上分享作品链接，并分享您的创作故事。"
              },
            ]
          },
          {
            title: '作者法律信息',
            description: '条款和隐私政策',
            icon: ScalesIcon,
            img: "a",
            list: [
              {
                icon: HumanImage,
                title: "服务条款",
                description: "使用平台即表示您同意遵守社区规则和服务条款。"
              },
              {
                icon: ScalesImage,
                title: "隐私政策",
                description: "我们收集平台运行所需的数据：用户名；电子邮件地址；个人资料信息。未经法律依据，个人数据不会传递给第三方。"
              },
              {
                icon: PaintImage,
                title: "版权",
                description: "作品的所有版权归其创作者所有。在平台上发布作品即表示您确认您是作者或拥有必要的发布权利。"
              },
              {
                icon: SettingsImage,
                title: "安全",
                description: "我们使用现代数据保护方法，但建议您使用强密码，不要将账户信息透露给他人。"
              },
            ]
          },
          {
            title: '艺术咨询与帮助',
            description: '帮助为您挑选画作',
            icon: PictureIcon,
            img: "",
            list: [
              {
                icon: "1",
                title: "创建艺术家简介",
                description: "填写您的信息：添加照片、简短传记，讲述您的创作历程、教育背景、技法和灵感。简介越详细，越能赢得买家的信任。"
              },
              {
                icon: "2",
                title: "上传您的作品",
                description: "使用光线良好的高质量照片。图像应清晰，无杂物和色彩失真。"
              },
              {
                icon: "3",
                title: "等待审核",
                description: "每件作品在发布前都会经过审核。审核通常需要24小时。如果作品被拒绝，您将收到通知并可以修改。"
              },
              {
                icon: "4",
                title: "推广您的作品",
                description: "定期发布新作品，参与平台展览，在社交网络上分享作品链接，并分享您的创作故事。"
              },
            ]
          },
          {
            title: '艺术市场新闻与文章',
            description: '艺术评论和艺术界事件',
            icon: NotificationIcon,
            img: "",
            list: [
              {
                icon: "1",
                title: "创建艺术家简介",
                description: "填写您的信息：添加照片、简短传记，讲述您的创作历程、教育背景、技法和灵感。简介越详细，越能赢得买家的信任。"
              },
              {
                icon: "2",
                title: "上传您的作品",
                description: "使用光线良好的高质量照片。图像应清晰，无杂物和色彩失真。"
              },
              {
                icon: "3",
                title: "等待审核",
                description: "每件作品在发布前都会经过审核。审核通常需要24小时。如果作品被拒绝，您将收到通知并可以修改。"
              },
              {
                icon: "4",
                title: "推广您的作品",
                description: "定期发布新作品，参与平台展览，在社交网络上分享作品链接，并分享您的创作故事。"
              },
            ]
          }
        ]
      },
      sidebar: {
        questions: {
          title: '有问题？',
          description: '快速回答常见问题'
        },
        knowledge: {
          title: '知识库',
          description: '说明和指南'
        },
        support: {
          title: '客服聊天',
          description: '邮箱：support@artgallery.com'
        }
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