const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const ts = require('typescript');

function worker() {
    const handlers = {};
    const shown = [];
    const opened = [];
    const self = {
        location: { origin: 'https://gallery.test' },
        addEventListener: (name, handler) => { handlers[name] = handler; },
        registration: { showNotification: async (...args) => shown.push(args) },
        clients: { matchAll: async () => [], openWindow: async url => opened.push(url) },
    };
    vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../../public/notification-worker.js'), 'utf8'), { self, URL });
    return { handlers, shown, opened, self };
}

test('background push uses localized content and gallery branding', async () => {
    const w = worker();
    let work;
    w.handlers.push({ data: { json: () => ({ title: 'New artwork', body: 'Anna published Morning', url: '/arts/4', tag: 'gallery-1', open: 'View' }) }, waitUntil: promise => { work = promise; } });
    await work;
    assert.equal(w.shown[0][0], 'New artwork');
    assert.equal(w.shown[0][1].icon, '/notification-icon.png');
    assert.equal(w.shown[0][1].actions[0].title, 'View');
    assert.equal(w.shown[0][1].data.url, '/arts/4');
    w.handlers.push({ data: { json: () => null } });
    w.handlers.push({ data: { json: () => { throw Error('bad JSON'); } } });
    assert.equal(w.shown.length, 1);
});

test('notification clicks only open gallery URLs and reuse an existing window', async () => {
    const w = worker();
    let work;
    const event = url => ({ notification: { data: { url }, close() {} }, waitUntil: promise => { work = promise; } });
    w.handlers.notificationclick(event('https://outside.test/private'));
    assert.equal(work, undefined);
    w.handlers.notificationclick(event('/arts/4'));
    await work;
    assert.deepEqual(w.opened, ['https://gallery.test/arts/4']);
    let focused = false;
    let navigated;
    w.self.clients.matchAll = async () => [{ url: 'https://gallery.test/settings', navigate: async url => { navigated = url; }, focus: async () => { focused = true; } }];
    w.handlers.notificationclick(event('/authors/7'));
    await work;
    assert.equal(navigated, 'https://gallery.test/authors/7');
    assert.equal(focused, true);
    assert.equal(w.opened.length, 1);
});

test('disconnecting a browser removes its native subscription even when the session has expired', async () => {
    const events = [];
    const subscription = { endpoint: 'https://fcm.googleapis.com/fcm/send/test', unsubscribe: async () => { events.push('unsubscribe'); } };
    const api = { deletePushSubscription: async endpoint => { assert.equal(endpoint, subscription.endpoint); events.push('delete'); throw Error('401'); } };
    const module = { exports: {} };
    const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, '../utils/browser-push.ts'), 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }).outputText;
    vm.runInNewContext(code, {
        module, exports: module.exports, require: () => api,
        window: { isSecureContext: true, Notification: {}, PushManager: {} },
        navigator: { serviceWorker: { getRegistration: async () => ({ pushManager: { getSubscription: async () => subscription } }) } },
        localStorage: { removeItem: key => { assert.equal(key, 'gallery_push_owner'); events.push('clearOwner'); } },
    });
    await module.exports.detachBrowserPush();
    assert.deepEqual(events, ['unsubscribe', 'delete', 'clearOwner']);
});
