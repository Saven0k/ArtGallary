const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const load = (file, apiFetch, requestOverrides = {}) => {
    const source = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
    const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
    const module = { exports: {} };
    const requireMock = (name) => name.endsWith('/lang') ? load(path.join(path.dirname(file), name + '.ts'), apiFetch, requestOverrides) : name.endsWith('main.api') ? { BASE_URL_API: 'https://gallery.test', contentType: { 'Content-Type': 'application/json' } } : { apiFetch, apiRequest: apiFetch, refreshSession: () => Promise.resolve(null), ...requestOverrides };
    new Function('require', 'module', 'exports', code)(requireMock, module, module.exports);
    return module.exports;
};
const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });

test('promo code management and cart validation use protected JSON endpoints and preserve server errors', async () => {
    const calls = [];
    const api = load('api/promo-codes/main.api.ts', async (url, init) => { calls.push({ url, ...init }); return json({ code: 'WELCOME', percent: 10 }); });
    const signal = new AbortController().signal;
    await api.getPromoCodes(2, signal);
    await api.createPromoCode({ code: 'WELCOME', percent: 10, expiresAt: null });
    await api.setPromoCodeActive(7, false);
    await api.validatePromoCode('WELCOME');
    assert.deepEqual(calls.map(call => [call.url.replace('https://gallery.test/promo-codes', ''), call.method ?? 'GET', call.body ? JSON.parse(call.body) : null]), [
        ['?page=2&limit=20', 'GET', null], ['', 'POST', { code: 'WELCOME', percent: 10, expiresAt: null }], ['/7', 'PATCH', { active: false }], ['/validate', 'POST', { code: 'WELCOME' }],
    ]);
    assert.equal(calls[0].signal, signal);
    const denied = load('api/promo-codes/main.api.ts', async () => json({ code: 'PROMO_CODE_INVALID', message: '优惠码无效' }, 400));
    await assert.rejects(denied.validatePromoCode('MISSING'), error => error instanceof denied.PromoCodeError && error.status === 400 && error.message === 'PROMO_CODE_INVALID');
    const checkout = load('api/cart-history/main.api.ts', async () => json({ code: 'PROMO_CODE_INVALID', message: '优惠码无效' }, 400));
    await assert.rejects(checkout.checkoutCart({ items: [{ artId: 7, quantity: 1 }], promoCode: 'MISSING' }), /PROMO_CODE_INVALID/);
});

test('profile commerce reads can be cancelled and unfollow is an idempotent DELETE', async () => {
    const calls = [];
    const fetch = async (url, init) => { calls.push({ url, ...init }); return json({ success: true, is_following: false }); };
    const signal = new AbortController().signal;
    const authors = load('api/authors/main.api.ts', fetch);
    await authors.getUserFollowing(2, 20, signal);
    await authors.unfollowAuthor(8);
    await load('api/cart-history/main.api.ts', fetch).getCartHistory({ status: 'delivered' }, signal);
    assert.deepEqual(calls.map(call => [call.url, call.method ?? 'GET']), [
        ['https://gallery.test/authors/following?page=2&limit=20', 'GET'],
        ['https://gallery.test/authors/8/follow', 'DELETE'],
        ['https://gallery.test/cart-history?status=delivered', 'GET'],
    ]);
    assert.equal(calls[0].signal, signal);
    assert.equal(calls[2].signal, signal);
    assert.equal(calls[0].credentials, 'include');
    assert.equal(calls[2].credentials, 'include');
});

test('private statistics requests use the current author session, localized filters and cancellation', async () => {
    const calls = [];
    const api = load('api/stats/main.api.ts', async (url, init) => { calls.push({ url, ...init }); return json({ authorId: 7 }); });
    const controller = new AbortController();
    await api.getMyAuthorStats({ startDate: '2026-10-01', endDate: '2026-10-22' }, 'zh', controller.signal);
    await api.getArtStats(10, { ageFrom: 18, countryId: 1 }, 'en');
    assert.equal(calls[0].url, 'https://gallery.test/stats/me?startDate=2026-10-01&endDate=2026-10-22&lang=zh');
    assert.equal(calls[0].signal, controller.signal);
    assert.equal(calls[0].credentials, 'include');
    assert.equal(calls[1].url, 'https://gallery.test/stats/art/10?ageFrom=18&countryId=1&lang=en');
});

test('account security requests use email codes without current passwords or a client-selected account', async () => {
    const calls = [];
    const api = load('api/auth/main.api.ts', async (url, init) => { calls.push({ url, ...init }); return json({ resetToken: 'proof', deletionToken: 'deletion-proof', message: 'OK' }); });
    await api.requestPasswordChangeCode();
    await api.verifyPasswordChangeCode('123456');
    await api.changePassword({ resetToken: 'proof', newPassword: 'NewPassword1' });
    await api.requestEmailChangeCode({ newEmail: 'new@example.test' });
    await api.confirmEmailChange({ newEmail: 'new@example.test', code: '123456' });
    await api.requestAccountDeletionCode();
    await api.verifyAccountDeletionCode('123456');
    assert.deepEqual(calls.map(call => [call.url.replace('https://gallery.test/auth/', ''), call.body ? JSON.parse(call.body) : null]), [
        ['password-change/request-code', null], ['password-change/verify-code', { code: '123456' }],
        ['change-password', { resetToken: 'proof', newPassword: 'NewPassword1' }],
        ['email-change/request-code', { newEmail: 'new@example.test' }], ['email-change/confirm', { newEmail: 'new@example.test', code: '123456' }],
        ['account/delete/request-code', null], ['account/delete/verify-code', { code: '123456' }],
    ]);
    const failed = load('api/auth/main.api.ts', async () => json({ message: 'Wait one minute' }, 429));
    await assert.rejects(failed.requestPasswordChangeCode(), /Wait one minute/);
});

test('art creation and editing send separate price and currency fields, including zero and clearing', async () => {
    const calls = [];
    const api = load('api/arts/main.api.ts', async (url, init) => { calls.push({ url, ...init }); return json({ id: 7 }); });
    for (const currency of ['RUB', 'USD', 'CNY']) {
        await api.createArt({ title: 'Art', description: '', date_published: '2026-10-20', author_id: 7, cost: 0, currency });
        const request = calls.at(-1);
        assert.equal(request.body.get('cost'), '0');
        assert.equal(request.body.get('currency'), currency);
        await api.updateArt(7, { cost: 1234.56, currency });
        assert.deepEqual(JSON.parse(calls.at(-1).body), { cost: 1234.56, currency });
    }
    await api.updateArt(7, { cost: null, currency: null });
    assert.equal(calls.at(-1).method, 'PATCH');
    assert.deepEqual(JSON.parse(calls.at(-1).body), { cost: null, currency: null });
    await api.getArtById(7, 'zh', true);
    assert.equal(calls.at(-1).url, 'https://gallery.test/arts/7?lang=zh&original=true');
});

test('notification preferences preserve opt-out and expose transport errors', async () => {
    let body;
    const api = load('api/notification/settings.api.ts', async (url, init) => { body = init.body; return json({ emailEnabled: false, pushEnabled: false }); });
    await api.updateNotificationSettings({ emailEnabled: false, pushEnabled: false, language: 'zh' });
    assert.deepEqual(JSON.parse(body), { emailEnabled: false, pushEnabled: false, language: 'zh' });
    const failed = load('api/notification/settings.api.ts', async () => json({}, 429));
    await assert.rejects(failed.sendTestNotification('email'), error => error.status === 429);
});

test('Telegram binding uses authenticated API methods and handles configuration errors', async () => {
    const calls = [];
    const api = load('api/telegram/main.api.ts', async (url, init) => { calls.push({ url, ...init }); return json({ configured: true, linked: false }); });
    await api.getTelegramStatus();
    await api.createTelegramLink();
    await api.unlinkTelegram();
    assert.deepEqual(calls.map(call => [call.url, call.method]), [
        ['https://gallery.test/telegram/status', 'GET'],
        ['https://gallery.test/telegram/link', 'POST'],
        ['https://gallery.test/telegram/link', 'DELETE'],
    ]);
    await assert.rejects(load('api/telegram/main.api.ts', async () => json({}, 503)).createTelegramLink(), /HTTP 503/);
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

test('API fallback errors follow the selected language while preserving server validation messages', async () => {
    const storage = global.localStorage;
    try {
        for (const language of ['ru', 'en', 'zh']) {
            global.localStorage = { getItem: () => language };
            const copy = load('api/lang.ts').apiTranslations[language];
            await assert.rejects(load('api/auth/main.api.ts', async () => json({}, 400)).requestResetCode({ email: 'me@example.test' }), { message: copy.sendCode });
            await assert.rejects(load('api/subscription/main.api.ts', async () => json({}, 503)).getSubscriptionInfo(), { message: copy.requestFailed });
            await assert.rejects(load('api/cart-history/main.api.ts', async () => json({}, 400)).checkoutCart({ items: [] }), { message: copy.checkout });
            await assert.rejects(load('api/auth/main.api.ts', async () => json({ message: 'Validation detail' }, 400)).verifyResetCode({ email: 'me@example.test', code: '000000' }), /Validation detail/);
        }
        global.localStorage = { getItem: () => 'unsupported' };
        assert.equal(load('api/lang.ts').apiErrorText('invalidCode'), 'Неверный код');
    } finally { global.localStorage = storage; }
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

test('all API requests use the selected language and preserve original reads, bodies and fragments', async () => {
    const storage = global.localStorage;
    const fetch = global.fetch;
    const calls = [];
    global.localStorage = { getItem: () => 'zh' };
    global.fetch = async (url, init) => { calls.push({ url, ...init }); return json({}); };
    try {
        const api = load('api/request.ts');
        assert.equal(api.languageUrl('https://gallery.test/arts?page=2&lang=ru#details'), 'https://gallery.test/arts?page=2&lang=zh#details');
        assert.equal(api.languageUrl('https://other.test/a?lang=ru'), 'https://other.test/a?lang=ru');
        await api.apiRequest('https://gallery.test/auth/login', { method: 'POST', body: '{"email":"me@example.test"}' });
        await api.getOriginal('events', 5);
        assert.equal(calls[0].url, 'https://gallery.test/auth/login?lang=zh');
        assert.equal(calls[0].body, '{"email":"me@example.test"}');
        assert.equal(calls[1].url, 'https://gallery.test/events/5?original=true&lang=zh');
        assert.equal(calls[1].credentials, 'include');
    } finally { global.localStorage = storage; global.fetch = fetch; }
});

test('a cold translation can retry one read but never repeats a write', async () => {
    const fetch = global.fetch;
    let count = 0;
    global.fetch = async () => { count++; return new Response('{}', { headers: { 'X-Translation-Status': count === 1 ? 'pending' : 'complete' } }); };
    try {
        const api = load('api/request.ts');
        assert.equal((await api.apiFetch('https://gallery.test/events')).headers.get('X-Translation-Status'), 'complete');
        assert.equal(count, 2);
        count = 0;
        await api.apiFetch('https://gallery.test/events', { method: 'POST', body: '{}' });
        assert.equal(count, 1);
    } finally { global.fetch = fetch; }
});

test('country cache follows the selected request language after switching', async () => {
    const storage = global.localStorage;
    let language = 'en';
    let calls = 0;
    global.localStorage = { getItem: () => language };
    try {
        const request = load('api/request.ts');
        const api = load('api/location/main.api.ts', async (url) => {
            calls++;
            return json([{ id: 1, name: new URL(request.languageUrl(url)).searchParams.get('lang') }]);
        }, { languageUrl: request.languageUrl });
        assert.equal((await api.getAllCountriesCached('en'))[0].name, 'en');
        await api.getAllCountriesCached('en');
        language = 'zh';
        assert.equal((await api.getAllCountriesCached('en'))[0].name, 'zh');
        assert.equal(calls, 2);
    } finally { global.localStorage = storage; }
});

test('a failed translation retry preserves the successful original response', async () => {
    const fetch = global.fetch;
    let calls = 0;
    global.fetch = async () => {
        if (++calls > 1) throw new TypeError('Connection lost');
        return new Response('{"title":"Пейзаж"}', { headers: { 'X-Translation-Status': 'pending' } });
    };
    try {
        const response = await load('api/request.ts').apiFetch('https://gallery.test/events');
        assert.deepEqual(await response.json(), { title: 'Пейзаж' });
        assert.equal(calls, 2);
    } finally { global.fetch = fetch; }
});
