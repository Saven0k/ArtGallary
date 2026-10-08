self.addEventListener('push', event => {
    if (!event.data) return;
    let message;
    try { message = event.data.json(); } catch { return; }
    if (!message || typeof message !== 'object') return;
    event.waitUntil(self.registration.showNotification(message.title || 'Art Gallery', {
        body: message.body, icon: '/notification-icon.png', badge: '/notification-icon.png',
        tag: message.tag, data: { url: message.url || '/settings' },
        actions: [{ action: 'open', title: message.open || 'Art Gallery' }],
    }));
});

self.addEventListener('notificationclick', event => {
    event.notification.close();
    const url = new URL(event.notification.data?.url || '/settings', self.location.origin);
    if (url.origin !== self.location.origin) return;
    event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(async clients => {
        const client = clients.find(item => new URL(item.url).origin === url.origin);
        if (client) { await client.navigate(url.href); await client.focus(); }
        else await self.clients.openWindow(url.href);
    }));
});
