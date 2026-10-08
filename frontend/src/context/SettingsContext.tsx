import type { ReactNode } from 'react';
import { useSettingsStorage } from '../hooks/useSettingsStorage';
import { SettingsContext } from './contexts';

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
    const settings = useSettingsStorage();
    return <SettingsContext.Provider value={settings}>{children}</SettingsContext.Provider>;
};
