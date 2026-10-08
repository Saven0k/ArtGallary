import { useState, useEffect, useRef, useContext } from 'react';
import { AuthContext, LanguageContext } from '../context/contexts';
import { getNotificationSettings, updateNotificationSettings, sendTestNotification, NotificationRequestError, type NotificationPreferences } from '../api/notification/settings.api';
import { supportsPush, connectBrowserPush, detachBrowserPush } from '../utils/browser-push';

const empty: NotificationPreferences = { emailEnabled: false, pushEnabled: false, language: 'ru', mailConfigured: false, pushConfigured: false, vapidPublicKey: null };
type Feedback = '' | 'failed' | 'rateLimit' | 'denied' | 'unsupported' | 'saved' | 'testSent';

export const useSettingsStorage = () => {
    const auth = useContext(AuthContext);
    const { language } = useContext(LanguageContext)!;
    const userId = auth?.user?.id;
    const currentUser = useRef(userId);
    currentUser.current = userId;
    const [preferences, setPreferences] = useState(empty);
    const [connected, setConnected] = useState(false);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [feedback, setFeedback] = useState<Feedback>('');
    const [permission, setPermission] = useState<NotificationPermission>(() => supportsPush() ? Notification.permission : 'default');

    useEffect(() => {
        let active = true;
        setPreferences(empty);
        setConnected(false);
        setFeedback('');
        setLoading(!!userId || !!auth?.isLoading);
        if (userId && !auth?.isLoading) {
            getNotificationSettings().then(async settings => {
                if (!active) return;
                setPreferences(settings);
                if (supportsPush() && settings.pushEnabled && Notification.permission === 'granted' && settings.vapidPublicKey) {
                    await connectBrowserPush(userId, settings.vapidPublicKey);
                    if (active) setConnected(true);
                } else if (supportsPush()) await detachBrowserPush();
            }).catch(() => { if (active) setFeedback('failed'); })
                .finally(() => { if (active) setLoading(false); });
        } else if (!auth?.isLoading) void detachBrowserPush().catch(() => undefined);
        return () => { active = false; };
    }, [userId, auth?.isLoading]);

    useEffect(() => {
        let active = true;
        if (userId && !loading) updateNotificationSettings({ language })
            .catch(() => { if (active) setFeedback('failed'); });
        return () => { active = false; };
    }, [userId, language, loading]);

    const run = async (action: () => Promise<void>, success: Feedback = 'saved') => {
        if (!userId || busy || loading) return;
        setBusy(true);
        setFeedback('');
        try {
            await action();
            if (currentUser.current === userId) setFeedback(success);
        } catch (error) {
            if (currentUser.current === userId) setFeedback(error instanceof NotificationRequestError && error.status === 429 ? 'rateLimit' : error instanceof Error && (error.message === 'denied' || error.message === 'unsupported') ? error.message : 'failed');
        } finally { setBusy(false); }
    };

    const setEmailEnabled = (value: boolean) => run(async () => {
        const settings = await updateNotificationSettings({ emailEnabled: value, language });
        if (currentUser.current === userId) setPreferences(settings);
    });

    const setPushEnabled = (value: boolean) => run(async () => {
        if (value) {
            if (!supportsPush()) throw new Error('unsupported');
            const result = await Notification.requestPermission();
            setPermission(result);
            if (result !== 'granted') throw new Error('denied');
            if (currentUser.current !== userId) return;
            try {
                await connectBrowserPush(userId!, preferences.vapidPublicKey!);
                const settings = await updateNotificationSettings({ pushEnabled: true, language });
                if (currentUser.current === userId) { setPreferences(settings); setConnected(true); }
            } catch (error) { await detachBrowserPush(); throw error; }
        } else {
            const settings = await updateNotificationSettings({ pushEnabled: false });
            await detachBrowserPush();
            if (currentUser.current === userId) { setPreferences(settings); setConnected(false); }
        }
    });

    const resetSettings = () => run(async () => {
        const settings = await updateNotificationSettings({ emailEnabled: false, pushEnabled: false });
        await detachBrowserPush();
        if (currentUser.current === userId) { setPreferences(settings); setConnected(false); }
    });

    return {
        emailEnabled: preferences.emailEnabled, pushEnabled: preferences.pushEnabled, browserConnected: connected,
        mailConfigured: preferences.mailConfigured, pushConfigured: preferences.pushConfigured,
        supported: supportsPush(), permission, loading, busy, feedback,
        setEmailEnabled, setPushEnabled, resetSettings,
        testNotification: (channel: 'email' | 'push') => run(async () => { await sendTestNotification(channel); }, 'testSent'),
    };
};
