import { createContext } from 'react';
import type { MeResponse } from '../api/auth/main.api';
import type { useSettingsStorage } from '../hooks/useSettingsStorage';

export type Language = 'ru' | 'en' | 'zh';
export interface ConfirmOptions {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'info';
}
export const AuthContext = createContext<{
    user: MeResponse | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    logout: () => Promise<void>;
    refetch: () => Promise<void>;
    checkAuth: (force?: boolean) => Promise<void>;
} | null>(null);
export const LanguageContext = createContext<{
    language: Language;
    setLanguage: (language: Language) => void;
} | undefined>(undefined);
export const ConfirmContext = createContext<{
    confirm: (options: ConfirmOptions) => Promise<boolean>;
} | null>(null);
export type NotificationType = 'success' | 'error';
export const NotificationContext = createContext<{
    showNotification: (message: string, type?: NotificationType) => void;
} | null>(null);
export const SettingsContext = createContext<ReturnType<typeof useSettingsStorage> | undefined>(undefined);
