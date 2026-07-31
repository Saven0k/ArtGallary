// src/pages/Help/lang.ts
export type Language = 'ru' | 'en' | 'zh';

import ArtIcon from "./icons/art.svg"
import BalanceIcon from "./icons/balance.svg"
import PaintingIcon from "./icons/painting.svg"

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
      resources: {
        title: 'Полезные ресурсы',
        items: [
          {
            title: 'Руководство для художников',
            description: 'Как начать продавать свои работы?',
            icon: PaintingIcon
          },
          {
            title: 'Правовая информация',
            description: 'Оферта и политика конфиденциальности',
            icon: BalanceIcon
          },
          {
            title: 'Арт-консультация',
            description: 'Помощь при подборе картин',
            icon: ArtIcon
          },
          {
            title: 'Новости арт-рынка',
            description: 'Обзоры выставок и картин',
            icon: BalanceIcon
          }
        ]
      },
      sidebar: {
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
      resources: {
        title: 'Useful Resources',
        items: [
          {
            title: 'Artist Guide',
            description: 'How to start selling your work?',
            icon: PaintingIcon
          },
          {
            title: 'Legal Information',
            description: 'Terms and Privacy Policy',
            icon: BalanceIcon
          },
          {
            title: 'Art Consultation',
            description: 'Help with selecting paintings',
            icon: ArtIcon
          },
          {
            title: 'Art Market News',
            description: 'Exhibition and art reviews',
            icon: BalanceIcon
          }
        ]
      },
      sidebar: {
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
      resources: {
        title: '实用资源',
        items: [
          {
            title: '艺术家指南',
            description: '如何开始销售您的作品？',
            icon: PaintingIcon
          },
          {
            title: '法律信息',
            description: '条款和隐私政策',
            icon: BalanceIcon
          },
          {
            title: '艺术咨询',
            description: '帮助挑选画作',
            icon: ArtIcon
          },
          {
            title: '艺术市场新闻',
            description: '展览和艺术评论',
            icon: BalanceIcon
          }
        ]
      },
      sidebar: {
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