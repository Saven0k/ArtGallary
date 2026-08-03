// src/context/SettingsContext.tsx
import React, { createContext, useContext } from 'react';
import { useSettingsStorage } from '../hooks/useSettingsStorage';

interface SettingsContextType {
    emailEnabled: boolean;
    pushEnabled: boolean;
    setEmailEnabled: (value: boolean) => void;
    setPushEnabled: (value: boolean) => void;
    toggleEmail: () => void;
    togglePush: () => void;
    resetSettings: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const settings = useSettingsStorage();

    return (
        <SettingsContext.Provider value={settings}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error('useSettings must be used within SettingsProvider');
    }
    return context;
};