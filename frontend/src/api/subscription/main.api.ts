import { BASE_URL_API } from "../main.api";

const BASE_URL = `${BASE_URL_API}/artists/subscription`;

export interface SubscriptionPlan {
    name: string;
    price: number;
    features: string[];
}

export interface SubscriptionInfo {
    plan: 'free' | 'pro' | 'vip';
    expiresAt: string | null;
    isActive: boolean;
    planWeight: number;
    daysLeft: number | null;
    features: string[];
}

export interface PurchaseSubscriptionDto {
    plan: 'free' | 'pro' | 'vip';
    durationDays?: number;
}

// Получение информации о подписке
export const getSubscriptionInfo = async (): Promise<SubscriptionInfo | null> => {
    try {
        const res = await fetch(`${BASE_URL}/info`, {
            credentials: "include",
        });
        if (!res.ok) throw new Error();
        return await res.json();
    } catch (e) {
        console.error('Error fetching subscription info:', e);
        return null;
    }
};

// Покупка подписки
export const purchaseSubscription = async (data: PurchaseSubscriptionDto): Promise<SubscriptionInfo | null> => {
    try {
        const res = await fetch(`${BASE_URL}/purchase`, {
            method: "POST",
            credentials: "include",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        });
        if (!res.ok) throw new Error();
        return await res.json();
    } catch (e) {
        console.error('Error purchasing subscription:', e);
        return null;
    }
};

// Отмена подписки
export const cancelSubscription = async (): Promise<{ success: boolean; message: string } | null> => {
    try {
        const res = await fetch(`${BASE_URL}/cancel`, {
            method: "DELETE",
            credentials: "include",
        });
        if (!res.ok) throw new Error();
        return await res.json();
    } catch (e) {
        console.error('Error canceling subscription:', e);
        return null;
    }
};

// Получение доступных планов
export const getAvailablePlans = async (): Promise<{ plans: SubscriptionPlan[]; durations: any[] } | null> => {
    try {
        const res = await fetch(`${BASE_URL}/plans`, {
            credentials: "include",
        });
        if (!res.ok) throw new Error();
        return await res.json();
    } catch (e) {
        console.error('Error fetching plans:', e);
        return null;
    }
};