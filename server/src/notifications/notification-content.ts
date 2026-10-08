import { Notification, NotificationType } from './notification.model';

export const notificationCopy = {
  ru: {
    title: 'Новости вашей галереи',
    open: 'Открыть в галерее',
    settings: 'Настроить уведомления',
    footer:
      'Вы получили это письмо, потому что включили email-уведомления в настройках аккаунта.',
    testTitle: 'Уведомления подключены',
    testBody: 'Теперь события вашей галереи всегда будут рядом.',
    codeHint:
      'Никому не сообщайте этот код. Если вы не запрашивали действие, просто проигнорируйте письмо.',
  },
  en: {
    title: 'Your gallery updates',
    open: 'Open in the gallery',
    settings: 'Notification settings',
    footer:
      'You received this email because you enabled email notifications in your account settings.',
    testTitle: 'Notifications are ready',
    testBody: 'Your gallery updates are now always within reach.',
    codeHint:
      'Do not share this code. If you did not request this action, simply ignore this email.',
  },
  zh: {
    title: '您的画廊动态',
    open: '打开画廊',
    settings: '通知设置',
    footer: '您在账户设置中启用了邮件通知，因此收到了这封邮件。',
    testTitle: '通知已启用',
    testBody: '从现在起，您可以随时了解画廊的最新动态。',
    codeHint: '请勿与他人分享此验证码。如果您没有发起此操作，请忽略本邮件。',
  },
};

export function notificationContent(
  notification: Pick<Notification, 'type' | 'message' | 'metadata'>,
  language: keyof typeof notificationCopy,
) {
  const copy = notificationCopy[language];
  const metadata = notification.metadata as Record<string, unknown> | null;
  const actor =
    typeof metadata?.actor_name === 'string' ? metadata.actor_name : '';
  const art = typeof metadata?.art_title === 'string' ? metadata.art_title : '';
  let body = notification.message;
  if (actor) {
    if (notification.type === NotificationType.NEW_FOLLOWER)
      body =
        language === 'ru'
          ? `${actor} подписался на вас`
          : language === 'en'
            ? `${actor} started following you`
            : `${actor} 关注了您`;
    if (art && notification.type === NotificationType.ART_LIKE)
      body =
        language === 'ru'
          ? `${actor} оценил вашу работу «${art}»`
          : language === 'en'
            ? `${actor} liked your artwork “${art}”`
            : `${actor} 点赞了您的作品《${art}》`;
    if (art && notification.type === NotificationType.NEW_ART)
      body =
        language === 'ru'
          ? `${actor} опубликовал работу «${art}»`
          : language === 'en'
            ? `${actor} published “${art}”`
            : `${actor} 发布了作品《${art}》`;
  }
  return { title: copy.title, body, open: copy.open };
}
