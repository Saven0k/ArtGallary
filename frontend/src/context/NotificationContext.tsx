import { useCallback, useRef, useEffect, useState } from "react";
import { NotificationComponent } from "../components/ui/NotificationComponent/NotificationComponent";


import { NotificationContext, type NotificationType } from './contexts';
import { useLanguage } from '../hooks/useLanguage';
type Notification = { message: string; type: NotificationType };

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
    const { language } = useLanguage();
    const lastTranslationNotice = useRef(0);
    const [notification, setNotification] = useState<Notification | null>(null);

    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
    useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
    const showNotification = useCallback((message: string, type: NotificationType = "success") => {
        if (timer.current) clearTimeout(timer.current);
        setNotification({ message, type });

        timer.current = setTimeout(() => {
            setNotification(null);
        }, 3000);
    }, []);

    useEffect(() => {
        const pending = () => {
            if (Date.now() - lastTranslationNotice.current < 60000) return;
            lastTranslationNotice.current = Date.now();
            showNotification(language === 'ru' ? 'Перевод ещё не готов. Часть текста показана в оригинале; обновите страницу позже.' : language === 'en' ? 'Some translations are not ready. Original text is shown; refresh the page later.' : '部分翻译尚未完成，当前显示原文。请稍后刷新页面。', 'error');
        };
        window.addEventListener('gallery:translation-pending', pending);
        return () => window.removeEventListener('gallery:translation-pending', pending);
    }, [language, showNotification]);

    return (
        <NotificationContext.Provider value={{ showNotification }}>
            {children}
            {notification && <NotificationComponent {...notification} />}
        </NotificationContext.Provider>
    );
};
