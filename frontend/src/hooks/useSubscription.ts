import { useState, useEffect, useCallback } from 'react';
import { getSubscriptionInfo, purchaseSubscription, cancelSubscription, getAvailablePlans, type SubscriptionInfo } from '../api/subscription/main.api';
import { useNotification } from './useNotification';

export const useSubscription = () => {
    const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
    const [loading, setLoading] = useState(false);
    const [plans, setPlans] = useState<any>(null);
    const { showNotification } = useNotification();

    const loadSubscription = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getSubscriptionInfo();
            setSubscription(data);
        } catch (error) {
            console.error('Error loading subscription:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    const loadPlans = useCallback(async () => {
        try {
            const data = await getAvailablePlans();
            setPlans(data);
        } catch (error) {
            console.error('Error loading plans:', error);
        }
    }, []);

    const handlePurchase = useCallback(async (plan: string, durationDays?: number) => {
        setLoading(true);
        try {
            const result = await purchaseSubscription({ plan: plan as any, durationDays });
            if (result) {
                setSubscription(result);
                showNotification(`✅ Подписка ${plan} успешно приобретена!`, 'success');
                return true;
            }
            showNotification('❌ Ошибка при покупке подписки', 'error');
            return false;
        } catch (error) {
            console.error('Error purchasing subscription:', error);
            showNotification('❌ Ошибка при покупке подписки', 'error');
            return false;
        } finally {
            setLoading(false);
        }
    }, [showNotification]);

    const handleCancel = useCallback(async () => {
        setLoading(true);
        try {
            const result = await cancelSubscription();
            if (result?.success) {
                await loadSubscription();
                showNotification(result.message, 'success');
                return true;
            }
            showNotification('❌ Ошибка при отмене подписки', 'error');
            return false;
        } catch (error) {
            console.error('Error canceling subscription:', error);
            showNotification('❌ Ошибка при отмене подписки', 'error');
            return false;
        } finally {
            setLoading(false);
        }
    }, [loadSubscription, showNotification]);

    useEffect(() => {
        loadSubscription();
        loadPlans();
    }, []);

    return {
        subscription,
        loading,
        plans,
        loadSubscription,
        purchase: handlePurchase,
        cancel: handleCancel,
    };
};