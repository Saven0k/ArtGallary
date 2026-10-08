import { deletePushSubscription, savePushSubscription } from '../api/notification/settings.api';

const OWNER_KEY = 'gallery_push_owner';
export const supportsPush = () => typeof window !== 'undefined' && window.isSecureContext && 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;

export async function detachBrowserPush() {
    if (!supportsPush()) return;
    const registration = await navigator.serviceWorker.getRegistration('/');
    const subscription = await registration?.pushManager.getSubscription();
    if (subscription) {
        await subscription.unsubscribe();
        await deletePushSubscription(subscription.endpoint).catch(() => undefined);
    }
    localStorage.removeItem(OWNER_KEY);
}

export async function connectBrowserPush(userId: number, publicKey: string) {
    if (localStorage.getItem(OWNER_KEY) !== String(userId)) await detachBrowserPush();
    await navigator.serviceWorker.register('/notification-worker.js');
    const registration = await navigator.serviceWorker.ready;
    const key = Uint8Array.from(atob(publicKey.replace(/-/g, '+').replace(/_/g, '/')), character => character.charCodeAt(0));
    let subscription = await registration.pushManager.getSubscription();
    if (subscription && subscription.options.applicationServerKey &&
        Array.from(new Uint8Array(subscription.options.applicationServerKey)).join() !== Array.from(key).join()) {
        await detachBrowserPush();
        subscription = null;
    }
    subscription ??= await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: key });
    await savePushSubscription(subscription);
    localStorage.setItem(OWNER_KEY, String(userId));
}
