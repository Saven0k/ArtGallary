import { useCallback, useEffect, useState } from 'react';
import { useLanguage } from '../../../../hooks/useLanguage';
import { useNotification } from '../../../../hooks/useNotification';
import { createTelegramLink, getTelegramStatus, unlinkTelegram, type TelegramStatus } from '../../../../api/telegram/main.api';

const translations = {
    ru: { title: 'Модерация в Telegram', description: 'Новые авторы и работы, решения и комментарии прямо в боте.', connected: 'Telegram подключён', disconnected: 'Telegram не привязан', unavailable: 'Бот пока не настроен на сервере', connect: 'Подключить Telegram', unlink: 'Отключить', open: 'Открыть бота и нажать Start', hint: 'Ссылка действует 10 минут. После Start проверь привязку.', check: 'Проверить привязку', error: 'Не удалось связаться с Telegram. Проверь настройки бота и прокси.' },
    en: { title: 'Telegram moderation', description: 'New authors and artworks, decisions and comments in the bot.', connected: 'Telegram connected', disconnected: 'Telegram is not linked', unavailable: 'The bot is not configured on the server yet', connect: 'Connect Telegram', unlink: 'Disconnect', open: 'Open the bot and press Start', hint: 'The link expires in 10 minutes. Check the connection after pressing Start.', check: 'Check connection', error: 'Could not connect to Telegram. Check the bot and proxy settings.' },
    zh: { title: 'Telegram 内容审核', description: '在机器人中接收新作者和作品，作出审核决定并留下评论。', connected: 'Telegram 已连接', disconnected: 'Telegram 尚未绑定', unavailable: '服务器尚未配置机器人', connect: '连接 Telegram', unlink: '断开连接', open: '打开机器人并点击 Start', hint: '链接有效期为 10 分钟。点击 Start 后请检查绑定状态。', check: '检查绑定状态', error: '无法连接 Telegram，请检查机器人和代理设置。' },
};

export default function TelegramSettings() {
    const { language } = useLanguage();
    const t = translations[language];
    const { showNotification } = useNotification();
    const [status, setStatus] = useState<TelegramStatus | null>(null);
    const [busy, setBusy] = useState(false);
    const [url, setUrl] = useState('');
    const [error, setError] = useState(false);
    const refresh = useCallback(async () => {
        setBusy(true);
        try {
            const data = await getTelegramStatus();
            setStatus(data);
            setError(false);
            if (data.linked) setUrl('');
        } catch { setError(true); }
        finally { setBusy(false); }
    }, []);
    useEffect(() => { void refresh(); }, [refresh]);

    const connect = async () => {
        setBusy(true);
        try { setUrl((await createTelegramLink()).url); setError(false); }
        catch { showNotification(t.error, 'error'); }
        finally { setBusy(false); }
    };
    const disconnect = async () => {
        setBusy(true);
        try { await unlinkTelegram(); setStatus({ configured: true, linked: false }); setUrl(''); }
        catch { showNotification(t.error, 'error'); }
        finally { setBusy(false); }
    };

    return <div className="telegram-settings">
        <h3>{t.title}</h3>
        <p>{t.description}</p>
        <p role="status">{error ? t.error : status ? !status.configured ? t.unavailable : status.linked ? t.connected : t.disconnected : '…'}</p>
        <div className="telegram-settings__actions">
            {status?.configured && <button type="button" disabled={busy} onClick={status.linked ? disconnect : connect}>{status.linked ? t.unlink : t.connect}</button>}
            <button type="button" disabled={busy} onClick={() => void refresh()}>{t.check}</button>
        </div>
        {url && <><a href={url} target="_blank" rel="noopener noreferrer">{t.open}</a><p>{t.hint}</p></>}
    </div>;
}
