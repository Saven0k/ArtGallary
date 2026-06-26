import { useState, useEffect, useCallback } from 'react';
import { signUpToExhibition, cancelSignUp, checkUserRegistration } from '../api/exhibitions/main.api';
import { useNotification } from '../context/NotificationContext';
import { useAuth } from './useAuth';

export const useExhibitionRegistration = (exhibitionId: number) => {
    const [isRegistered, setIsRegistered] = useState(false);
    const [loading, setLoading] = useState(false);
    const { showNotification } = useNotification();
    const { isAuthenticated, user } = useAuth();

    useEffect(() => {
        if (isAuthenticated && user) {
            checkUserRegistration(exhibitionId).then(setIsRegistered);
        }
    }, [exhibitionId, isAuthenticated, user]);

    const register = useCallback(async () => {
        if (!isAuthenticated || !user) {
            showNotification("Для записи на выставку необходимо авторизоваться", "error");
            return false;
        }

        setLoading(true);
        const success = await signUpToExhibition(exhibitionId, user.id);
        if (success) {
            setIsRegistered(true);
            showNotification("✅ Вы успешно записаны на выставку!", "success");
        } else {
            showNotification("❌ Ошибка при записи на выставку", "error");
        }
        setLoading(false);
        return success;
    }, [exhibitionId, isAuthenticated, user, showNotification]);

    const unregister = useCallback(async () => {
        if (!user) return false;

        setLoading(true);
        const success = await cancelSignUp(exhibitionId, user.id);
        if (success) {
            setIsRegistered(false);
            showNotification("✅ Запись на выставку отменена", "success");
        } else {
            showNotification("❌ Ошибка при отмене записи", "error");
        }
        setLoading(false);
        return success;
    }, [exhibitionId, user, showNotification]);

    const toggleRegistration = useCallback(async () => {
        if (isRegistered) {
            return unregister();
        } else {
            return register();
        }
    }, [isRegistered, register, unregister]);

    return {
        isRegistered,
        loading,
        register,
        unregister,
        toggleRegistration
    };
};