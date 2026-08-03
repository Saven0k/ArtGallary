// src/hooks/useSettingsStorage.ts
import { useState, useEffect } from 'react';

const SETTINGS_STORAGE_KEY = 'app_settings';

interface Settings {
    notifications: {
        email: boolean;
        push: boolean;
    };
}

const defaultSettings: Settings = {
    notifications: {
        email: true,
        push: false,
    },
};

const loadSettings = (): Settings => {
    try {
        const stored = localStorage.getItem(SETTINGS_STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            // Проверяем структуру и подставляем дефолты для отсутствующих полей
            return {
                notifications: {
                    email: parsed.notifications?.email ?? defaultSettings.notifications.email,
                    push: parsed.notifications?.push ?? defaultSettings.notifications.push,
                },
            };
        }
        return defaultSettings;
    } catch {
        return defaultSettings;
    }
};

const saveSettings = (settings: Settings): void => {
    try {
        localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
        console.error('Failed to save settings:', error);
    }
};

export const useSettingsStorage = () => {
    const [emailEnabled, setEmailEnabled] = useState<boolean>(loadSettings().notifications.email);
    const [pushEnabled, setPushEnabled] = useState<boolean>(loadSettings().notifications.push);

    useEffect(() => {
        saveSettings({
            notifications: {
                email: emailEnabled,
                push: pushEnabled,
            },
        });
    }, [emailEnabled, pushEnabled]);

    const toggleEmail = () => {
        setEmailEnabled((prev) => !prev);
    };

    const togglePush = () => {
        setPushEnabled((prev) => !prev);
    };

    const resetSettings = () => {
        setEmailEnabled(defaultSettings.notifications.email);
        setPushEnabled(defaultSettings.notifications.push);
    };

    return {
        emailEnabled,
        pushEnabled,
        setEmailEnabled,
        setPushEnabled,
        toggleEmail,
        togglePush,
        resetSettings,
    };
};