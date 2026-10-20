const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const root = path.join(__dirname, '..');
const settings = 'components/shared/ProfileScreen/SettingsSection/';

function harness(file, props = {}, options = {}) {
    const states = [];
    let cursor = 0;
    let remaining = 0;
    const calls = [];
    const cache = new Map();
    const api = Object.fromEntries(['requestPasswordChangeCode', 'requestEmailChangeCode', 'requestAccountDeletionCode', 'verifyPasswordChangeCode', 'confirmEmailChange', 'verifyAccountDeletionCode', 'changePassword', 'deleteAuthor', 'deleteUser'].map(name => [name, async (...args) => {
        calls.push([name, ...args]);
        if (options.fail === name) throw new Error('Test request failed');
        if (options.pause === name) await new Promise(resolve => { options.resume = resolve; });
        return name === 'verifyAccountDeletionCode' ? { deletionToken: 'verified-deletion-proof' } : { resetToken: 'verified-password-proof', message: 'OK' };
    }]));
    function load(filename) {
        if (cache.has(filename)) return cache.get(filename).exports;
        const module = { exports: {} };
        cache.set(filename, module);
        const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
        new Function('require', 'module', 'exports', code)(name => {
            if (name === 'react') return { ...React, useEffect() {}, useState(initial) { const index = cursor++; if (!(index in states)) states[index] = initial; return [states[index], value => { states[index] = typeof value === 'function' ? value(states[index]) : value; }]; } };
            if (name.endsWith('/useCodeCooldown')) return { useCodeCooldown: () => [remaining, () => { remaining = 60; }] };
            if (name.endsWith('/useLanguage')) return { useLanguage: () => ({ language: options.language ?? 'ru' }) };
            if (name.endsWith('/useAuth')) return { useAuth: () => ({ user: { id: 7, email: 'owner@example.test' }, logout: async () => calls.push(['logout']), refetch: async () => calls.push(['refetch']) }) };
            if (name.endsWith('/useNotification')) return { useNotification: () => ({ showNotification: (...args) => calls.push(['notification', ...args]) }) };
            if (name.endsWith('.api')) return api;
            if (name.endsWith('.scss')) return {};
            if (name.startsWith('.')) {
                const target = path.resolve(path.dirname(filename), name);
                return load([target + '.ts', target + '.tsx'].find(candidate => fs.existsSync(candidate)));
            }
            return require(name);
        }, module, module.exports);
        return module.exports;
    }
    const Component = load(path.join(root, file)).default;
    return { calls, options, advanceCooldown() { remaining = 0; }, render() { cursor = 0; return Component(props); } };
}

function find(node, predicate) {
    if (!React.isValidElement(node)) return null;
    if (predicate(node)) return node;
    for (const child of React.Children.toArray(node.props.children)) { const result = find(child, predicate); if (result) return result; }
    return null;
}
const event = { preventDefault() {} };
const input = (node, id, value) => find(node, item => item.type === 'input' && item.props.id === id).props.onChange({ target: { value } });
const form = node => find(node, item => item.type === 'form');
const requestButton = node => find(node, item => item.type === 'button' && item.props.autoFocus);

test('resend cooldown expires and clears its timer', () => {
    let value = 0;
    let effect;
    let tick;
    let clears = 0;
    const originalTimeout = global.setTimeout;
    const originalClear = global.clearTimeout;
    const source = ts.transpileModule(fs.readFileSync(path.join(root, 'hooks/useCodeCooldown.ts'), 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
    const module = { exports: {} };
    new Function('require', 'module', 'exports', source)(() => ({ useState: () => [value, next => { value = typeof next === 'function' ? next(value) : next; }], useEffect: callback => { effect = callback; } }), module, module.exports);
    try {
        global.setTimeout = callback => { tick = callback; return 1; };
        global.clearTimeout = () => { clears++; };
        const [, start] = module.exports.useCodeCooldown();
        start();
        for (let remaining = 60; remaining > 0; remaining--) {
            assert.equal(module.exports.useCodeCooldown()[0], remaining);
            const cleanup = effect();
            tick();
            cleanup();
        }
        assert.equal(module.exports.useCodeCooldown()[0], 0);
        assert.equal(effect(), undefined);
        assert.equal(clears, 60);
    } finally { global.setTimeout = originalTimeout; global.clearTimeout = originalClear; }
});

test('password modal sends to the account email without asking for an address and verifies only the emailed code', async () => {
    const verified = [];
    const instance = harness('components/layout/CodeModal/CodeModal.tsx', { onVerified: value => verified.push(value), onClose() {} });
    assert.equal(find(instance.render(), item => item.type === 'input' && item.props.type === 'email'), null);
    assert.equal(instance.calls.length, 0);
    await requestButton(instance.render()).props.onClick();
    assert.deepEqual(instance.calls[0], ['requestPasswordChangeCode']);
    const resend = find(instance.render(), item => item.props.className === 'code-modal__resend');
    assert.equal(resend.props.disabled, true);
    assert.ok(renderToStaticMarkup(instance.render()).includes('owner@example.test'));
    input(instance.render(), 'password-email-code', '12x3456');
    await form(instance.render()).props.onSubmit(event);
    assert.deepEqual(instance.calls.at(-1), ['verifyPasswordChangeCode', '123456']);
    assert.deepEqual(verified, [{ resetToken: 'verified-password-proof', message: 'OK' }]);
});

test('email modal saves after the correct code without showing or submitting a password', async () => {
    let saved = 0;
    const instance = harness(settings + 'ChangeEmailModal/ChangeEmailModal.tsx', { onClose() {}, onSuccess() { saved++; } });
    input(instance.render(), 'new-account-email', ' New@Example.test ');
    await form(instance.render()).props.onSubmit(event);
    assert.deepEqual(instance.calls[0], ['requestEmailChangeCode', { newEmail: 'new@example.test' }]);
    assert.equal(find(instance.render(), item => item.type === 'input' && item.props.type === 'password'), null);
    assert.equal(find(instance.render(), item => item.props.id === 'new-account-email').props.disabled, true);
    input(instance.render(), 'change-email-code', '123456');
    await form(instance.render()).props.onSubmit(event);
    assert.deepEqual(instance.calls.at(-1), ['confirmEmailChange', { newEmail: 'new@example.test', code: '123456' }]);
    assert.equal(saved, 1);
});

test('email changes cannot send a code for the current email', async () => {
    const instance = harness(settings + 'ChangeEmailModal/ChangeEmailModal.tsx', { onClose() {} });
    input(instance.render(), 'new-account-email', 'OWNER@example.test');
    await form(instance.render()).props.onSubmit(event);
    assert.equal(instance.calls.length, 0);
    assert.ok(find(instance.render(), node => node.props.role === 'alert'));
});

test('delete modal warns first, sends only on request and deletes immediately after code verification', async () => {
    const deleted = [];
    const instance = harness(settings + 'DeleteAccountModal/DeleteAccountModal.tsx', { onClose() {}, onConfirm: value => deleted.push(value) });
    assert.equal(instance.calls.length, 0);
    assert.ok(find(instance.render(), item => item.props.className === 'delete-account__warning'));
    await requestButton(instance.render()).props.onClick();
    assert.deepEqual(instance.calls[0], ['requestAccountDeletionCode']);
    input(instance.render(), 'delete-account-code', '123456');
    await form(instance.render()).props.onSubmit(event);
    assert.deepEqual(deleted, ['verified-deletion-proof']);
    assert.equal(instance.calls.filter(call => call[0] === 'verifyAccountDeletionCode').length, 1);
});

for (const [file, operation, field, setup] of [
    ['components/layout/CodeModal/CodeModal.tsx', 'verifyPasswordChangeCode', 'password-email-code'],
    [settings + 'ChangeEmailModal/ChangeEmailModal.tsx', 'confirmEmailChange', 'change-email-code', true],
    [settings + 'DeleteAccountModal/DeleteAccountModal.tsx', 'verifyAccountDeletionCode', 'delete-account-code'],
]) {
    test(`${operation} failure preserves the modal and never completes the action`, async () => {
        let completed = 0;
        const instance = harness(file, { onClose() {}, onVerified() { completed++; }, onSuccess() { completed++; }, onConfirm() { completed++; } }, { fail: operation });
        if (setup) { input(instance.render(), 'new-account-email', 'new@example.test'); await form(instance.render()).props.onSubmit(event); }
        else await requestButton(instance.render()).props.onClick();
        input(instance.render(), field, '123456');
        await form(instance.render()).props.onSubmit(event);
        assert.equal(completed, 0);
        assert.ok(find(instance.render(), node => node.props.role === 'alert'));
        assert.ok(form(instance.render()));
    });
}

test('new password form validates letters and numbers then sends only the verified proof and new password', async () => {
    const instance = harness(settings + 'ChangePasswordModal/ChangePasswordModal.tsx', { resetToken: 'verified-password-proof', onClose() {} });
    input(instance.render(), 'new-account-password', '12345678');
    input(instance.render(), 'confirm-account-password', '12345678');
    await form(instance.render()).props.onSubmit(event);
    assert.equal(instance.calls.length, 0);
    assert.ok(find(instance.render(), node => node.props.role === 'alert'));
    input(instance.render(), 'new-account-password', 'NewPassword1');
    input(instance.render(), 'confirm-account-password', 'NewPassword1');
    await form(instance.render()).props.onSubmit(event);
    assert.deepEqual(instance.calls[0], ['changePassword', { resetToken: 'verified-password-proof', newPassword: 'NewPassword1' }]);
});

test('all account dialogs render translated text, accessible code inputs and errors', async () => {
    for (const language of ['ru', 'en', 'zh']) {
        for (const file of ['components/layout/CodeModal/CodeModal.tsx', settings + 'ChangeEmailModal/ChangeEmailModal.tsx', settings + 'DeleteAccountModal/DeleteAccountModal.tsx']) {
            const instance = harness(file, { onClose() {}, onConfirm() {}, onVerified() {} }, { language });
            if (file.includes('ChangeEmailModal')) { input(instance.render(), 'new-account-email', 'new@example.test'); await form(instance.render()).props.onSubmit(event); }
            else await requestButton(instance.render()).props.onClick();
            const html = renderToStaticMarkup(instance.render());
            assert.match(html, /role="dialog"/);
            assert.match(html, /aria-labelledby=/);
            assert.match(html, /autocomplete="one-time-code"/i);
            assert.match(html, /inputMode="numeric"/i);
            assert.ok(html.includes('owner@example.test'));
            if (language !== 'ru') assert.doesNotMatch(html, /[А-Яа-яЁё]/);
        }
    }
});

test('pending requests disable closing and duplicate submission', async () => {
    const options = { pause: 'requestPasswordChangeCode' };
    let closed = 0;
    const instance = harness('components/layout/CodeModal/CodeModal.tsx', { onClose() { closed++; }, onVerified() {} }, options);
    const sending = requestButton(instance.render()).props.onClick();
    const close = find(instance.render(), node => node.props.className === 'code-modal__close');
    assert.equal(close.props.disabled, true);
    await requestButton(instance.render()).props.onClick();
    instance.render().props.onClick();
    assert.equal(closed, 0);
    assert.equal(instance.calls.length, 1);
    options.resume();
    await sending;
});

test('profile settings keep the password proof and select the proper account deletion API', async () => {
    for (const role of ['user', 'author', 'moderator', 'admin']) {
        const instance = harness(settings + 'SettingsSection.tsx', { id: 7, role });
        find(instance.render(), node => node.type === 'button' && node.props.className.startsWith('profile-settings__item')).props.onClick();
        find(instance.render(), node => node.type?.name === 'CodeModal').props.onVerified({ resetToken: 'verified-password-proof' });
        const password = find(instance.render(), node => node.type?.name === 'ChangePasswordModal');
        assert.equal(password.props.resetToken, 'verified-password-proof');
        password.props.onSuccess();
        assert.ok(instance.calls.some(call => call[0] === 'logout'));
        const deleteButton = find(instance.render(), node => node.type === 'button' && node.props.className.includes('profile-settings__item--danger'));
        deleteButton.props.onClick();
        const deletion = find(instance.render(), node => node.type?.name === 'DeleteAccountModal');
        await deletion.props.onConfirm('verified-deletion-proof');
        assert.ok(instance.calls.some(call => call[0] === (role === 'author' ? 'deleteAuthor' : 'deleteUser') && call[1] === 7 && call[2] === 'verified-deletion-proof'));
    }
});
