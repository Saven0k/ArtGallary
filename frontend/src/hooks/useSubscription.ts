import { useState, useEffect, useCallback } from 'react';
import { getSubscriptionInfo, purchaseSubscription, cancelSubscription, getAvailablePlans, confirmSubscriptionPayment, type SubscriptionInfo, type AvailablePlans, type PurchaseSubscriptionDto } from '../api/subscription/main.api';
import { useAuth } from './useAuth';
import { errorMessage } from '../utils/errors';

export const useSubscription = () => {
    const { user, refetch } = useAuth();
    const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
    const [plans, setPlans] = useState<AvailablePlans | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const pendingKey = `subscription_payment_${user?.id ?? 0}`;
    const [pendingPayment, setPendingPayment] = useState(() => sessionStorage.getItem(pendingKey));
    const loadSubscription = useCallback(async () => {
        const data = await getSubscriptionInfo();
        setSubscription(data);
        return data;
    }, []);
    const verifyPayment = useCallback(async (paymentId: string) => {
        const result = await confirmSubscriptionPayment(paymentId);
        setMessage(result.message);
        const info = await loadSubscription();
        const failed = info.history?.some((entry) => entry.paymentId === paymentId && entry.paymentStatus === 'failed');
        if (result.success || failed) {
            sessionStorage.removeItem(pendingKey);
            setPendingPayment(null);
            if (result.success) await refetch();
        }
        return result.success;
    }, [loadSubscription, pendingKey, refetch]);
    useEffect(() => {
        let active = true;
        setLoading(true);
        Promise.all([getSubscriptionInfo(), getAvailablePlans()]).then(async ([info, available]) => {
            if (!active) return;
            setSubscription(info);
            setPlans(available);
            const saved = sessionStorage.getItem(pendingKey);
            const pending = info.history?.find((entry) => entry.paymentStatus === 'pending' && entry.paymentId)?.paymentId;
            const paymentId = saved ?? pending ?? null;
            setPendingPayment(paymentId);
            if (paymentId) {
                sessionStorage.setItem(pendingKey, paymentId);
                await verifyPayment(paymentId);
            }
        }).catch((e: unknown) => { if (active) setError(errorMessage(e, 'Не удалось загрузить тарифы')); }).finally(() => { if (active) setLoading(false); });
        return () => { active = false; };
    }, [pendingKey, verifyPayment]);
    const purchase = async (data: PurchaseSubscriptionDto) => {
        setLoading(true);
        setError('');
        try {
            const payment = await purchaseSubscription(data);
            sessionStorage.setItem(pendingKey, payment.paymentId);
            setPendingPayment(payment.paymentId);
            if (payment.paymentUrl) {
                const url = new URL(payment.paymentUrl);
                if (url.protocol !== 'https:' || url.username || url.password) throw new Error('Некорректная ссылка на оплату');
                window.location.assign(url.href);
            } else await verifyPayment(payment.paymentId);
        } catch (e) { setError(errorMessage(e, 'Не удалось открыть оплату')); }
        finally { setLoading(false); }
    };
    const cancel = async () => {
        setLoading(true);
        setError('');
        try {
            const result = await cancelSubscription();
            setMessage(result.message);
            await loadSubscription();
            await refetch();
        } catch (e) { setError(errorMessage(e, 'Не удалось отменить подписку')); }
        finally { setLoading(false); }
    };
    const confirmPayment = async () => {
        if (!pendingPayment) return;
        setLoading(true);
        setError('');
        try { await verifyPayment(pendingPayment); }
        catch (e) { setError(errorMessage(e, 'Не удалось проверить оплату')); }
        finally { setLoading(false); }
    };
    return { subscription, loading, plans, error, message, pendingPayment, loadSubscription, purchase, cancel, confirmPayment };
};
