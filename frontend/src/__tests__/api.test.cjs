const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const load = (file, apiFetch) => {
    const source = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
    const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
    const module = { exports: {} };
    const requireMock = (name) => name.endsWith('main.api') ? { BASE_URL_API: 'https://gallery.test', contentType: { 'Content-Type': 'application/json' } } : { apiFetch, refreshSession: () => Promise.resolve(null) };
    new Function('require', 'module', 'exports', code)(requireMock, module, module.exports);
    return module.exports;
};
const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

test('notification preferences preserve opt-out and expose transport errors', async () => {
    let body;
    const api = load('api/notification/settings.api.ts', async (url, init) => { body = init.body; return json({ emailEnabled: false, pushEnabled: false }); });
    await api.updateNotificationSettings({ emailEnabled: false, pushEnabled: false, language: 'zh' });
    assert.deepEqual(JSON.parse(body), { emailEnabled: false, pushEnabled: false, language: 'zh' });
    const failed = load('api/notification/settings.api.ts', async () => json({}, 429));
    await assert.rejects(failed.sendTestNotification('email'), error => error.status === 429);
});

test('author updates preserve explicit empty values and nullable fields', async () => {
    let body;
    const api = load('api/authors/main.api.ts', async (url, init) => { body = init.body; return json({ id: 7 }); });
    assert.deepEqual(await api.updateAuthor(7, { second_name: '', biography: '', profession_id: null, country_id: null, city_id: null, avatar_path: null }), { id: 7 });
    assert.deepEqual(Object.fromEntries(body), { second_name: '', biography: '', profession_id: 'null', country_id: 'null', city_id: 'null', avatar_path: 'null' });
});

test('author works preserve the server array response', async () => {
    const arts = [{ id: 4, title: 'Work' }];
    const api = load('api/authors/main.api.ts', async () => json(arts));
    assert.deepEqual(await api.getArtsByAuthor(7), arts);
});

test('moderator create and update send JSON including required identity fields', async () => {
    const requests = [];
    const api = load('api/moderators/main.api.ts', async (url, init) => { requests.push({ url, ...init }); return json({ id: 7 }); });
    const data = { email: 'moderator@example.test', password: 'secret123', name: 'Name', surname: 'Surname', gender: 'F', date_birthday: '1990-04-10' };
    await api.createModerator(data);
    await api.updateModerator(7, { second_name: '', gender: 'M', date_birthday: '1991-04-10' });
    assert.equal(requests[0].headers['Content-Type'], 'application/json');
    assert.deepEqual(JSON.parse(requests[0].body), data);
    assert.equal(requests[1].method, 'PUT');
    assert.equal(requests[1].headers['Content-Type'], 'application/json');
    assert.deepEqual(JSON.parse(requests[1].body), { second_name: '', gender: 'M', date_birthday: '1991-04-10' });
});

test('subscription confirmation sends only the provider payment id', async () => {
    let request;
    const api = load('api/subscription/main.api.ts', async (url, init) => { request = { url, ...init }; return json({ success: false, message: 'Pending' }); });
    assert.deepEqual(await api.confirmSubscriptionPayment('payment-id'), { success: false, message: 'Pending' });
    assert.equal(request.url, 'https://gallery.test/subscriptions/confirm');
    assert.deepEqual(JSON.parse(request.body), { paymentId: 'payment-id' });
});

test('checkout sends quantities and promotion and exposes server validation failures', async () => {
    let request;
    const api = load('api/cart-history/main.api.ts', async (url, init) => { request = { url, ...init }; return json({ message: 'Mixed currencies' }, 400); });
    const payload = { items: [{ artId: 4, quantity: 3 }], promoCode: 'SALE10' };
    await assert.rejects(api.checkoutCart(payload), /Mixed currencies/);
    assert.equal(request.url, 'https://gallery.test/cart-history/checkout');
    assert.deepEqual(JSON.parse(request.body), payload);
});

test('self account deletion forwards the one-use server proof', async () => {
    const requests = [];
    const fetch = async (url, init) => { requests.push({ url, ...init }); return json({ success: true }); };
    await load('api/users/main.api.ts', fetch).deleteUser(7, 'proof');
    await load('api/authors/main.api.ts', fetch).deleteAuthor(7, 'proof');
    await load('api/users/main.api.ts', fetch).deleteUser(8);
    assert.equal(requests[0].headers['X-Account-Deletion-Token'], 'proof');
    assert.equal(requests[1].headers['X-Account-Deletion-Token'], 'proof');
    assert.equal(requests[2].headers, undefined);
});

test('authenticated logout uses the shared refresh-capable request', async () => {
    let request;
    const api = load('api/auth/main.api.ts', async (url, init) => { request = { url, ...init }; return json({ message: 'Logged out' }); });
    assert.deepEqual(await api.logout(), { message: 'Logged out' });
    assert.equal(request.url, 'https://gallery.test/auth/logout');
    assert.equal(request.method, 'POST');
});

test('simultaneous expired requests share one refresh and retry once', async () => {
    const originalFetch = global.fetch;
    let refreshCalls = 0;
    const requests = new Map();
    let finishRefresh;
    const refreshed = new Promise((resolve) => { finishRefresh = resolve; });
    global.fetch = async (url) => {
        if (url.endsWith('/auth/refresh')) { refreshCalls++; return refreshed; }
        const count = (requests.get(url) ?? 0) + 1;
        requests.set(url, count);
        return json({}, count === 1 ? 401 : 200);
    };
    try {
        const api = load('api/request.ts');
        const pending = Promise.all([api.apiFetch('https://gallery.test/cart'), api.apiFetch('https://gallery.test/arts/liked')]);
        await new Promise(setImmediate);
        assert.equal(refreshCalls, 1);
        finishRefresh(json({}));
        assert.deepEqual((await pending).map((response) => response.status), [200, 200]);
        assert.deepEqual([...requests.values()], [2, 2]);
    } finally { global.fetch = originalFetch; }
});

test('failed session refresh preserves the unauthorized response without retry', async () => {
    const originalFetch = global.fetch;
    const calls = [];
    global.fetch = async (url) => { calls.push(url); return json({}, 401); };
    try {
        assert.equal((await load('api/request.ts').apiFetch('https://gallery.test/cart')).status, 401);
        assert.deepEqual(calls, ['https://gallery.test/cart', 'https://gallery.test/auth/refresh']);
    } finally { global.fetch = originalFetch; }
});
