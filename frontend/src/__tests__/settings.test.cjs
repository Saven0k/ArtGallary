const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

const load = (file, dependencies = {}) => {
    const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
    }).outputText;
    const module = { exports: {} };
    new Function('require', 'module', 'exports', code)(
        name => name in dependencies ? dependencies[name] : name.endsWith('.scss') ? {} : require(name), module, module.exports,
    );
    return module.exports;
};
const translations = load('pages/settings/lang.ts', { '../../utils/translations': load('utils/translations.ts') });

function render(language = 'ru', user = { id: 7 }, preferences = {}) {
    const settings = {
        emailEnabled: false, pushEnabled: false, browserConnected: false, supported: true,
        mailConfigured: false, pushConfigured: true, loading: false, busy: false, permission: 'default', feedback: '',
        setEmailEnabled() {}, setPushEnabled() {}, resetSettings() {}, testNotification() {}, ...preferences,
    };
    const Page = load('pages/settings/SettingsPage.tsx', {
        '../../hooks/useLanguage': { useLanguage: () => ({ language }) },
        '../../hooks/useAuth': { useAuth: () => ({ user }) },
        '../../hooks/useSettings': { useSettings: () => settings },
        './lang': translations,
        './components/SettingsCard': load('pages/settings/components/SettingsCard.tsx'),
        './components/SettingsRow': load('pages/settings/components/SettingsRow.tsx'),
        './components/Toggle': load('pages/settings/components/Toggle.tsx'),
        './components/LanguageSwitcher': { default: () => null },
        'react-router-dom': { Link: ({ to, children }) => React.createElement('a', { href: to }, children) },
    }).default;
    return renderToStaticMarkup(React.createElement(Page));
}

test('notification settings translate previews and expose missing email configuration', () => {
    for (const [language, title, unavailable] of [['ru', 'Уведомления по email', 'Отправка писем пока не подключена'], ['en', 'Email notifications', 'Email delivery is not connected yet'], ['zh', '邮件通知', '邮件服务尚未连接']]) {
        const html = render(language);
        assert.ok(html.includes(title));
        assert.ok(html.includes(unavailable));
        assert.match(html, /notification-settings__preview--mail/);
        assert.match(html, /notification-settings__preview--push/);
    }
    const guest = render('ru', null);
    assert.ok(guest.includes('href="/login"'));
    assert.equal((guest.match(/role="switch"/g) || []).length, 2);
    for (const toggle of guest.matchAll(/<button[^>]*role="switch"[^>]*>/g)) assert.ok(toggle[0].includes('disabled=""'));
});

test('an account with denied browser permission can still disable its push preference', () => {
    const html = render('ru', { id: 7 }, { pushEnabled: true, permission: 'denied' });
    const toggle = [...html.matchAll(/<button[^>]*role="switch"[^>]*>/g)][1][0];
    assert.ok(toggle.includes('aria-checked="true"'));
    assert.ok(!toggle.includes('disabled=""'));
    assert.ok(html.includes('Разрешите уведомления'));
    assert.ok(html.includes('Этот браузер ещё не подключён'));
});
