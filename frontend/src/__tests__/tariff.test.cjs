const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

const section = path.join(__dirname, '../components/shared/ProfileScreen/TariffPlanSection');
const load = (file, dependencies = {}) => {
    const code = ts.transpileModule(fs.readFileSync(path.join(section, file), 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
    }).outputText;
    const module = { exports: {} };
    new Function('require', 'module', 'exports', code)(
        (name) => name in dependencies ? dependencies[name] : name.endsWith('.scss') ? {} : require(name),
        module, module.exports,
    );
    return module.exports;
};
const translations = load('lang.ts');
const plans = {
    plans: ['free', 'pro', 'vip'].map((name, index) => ({
        name, price: index * 500,
        features: ['🔓 Базовый профиль', '🖼️ Добавление работ', '📊 Базовая статистика'],
        durationOptions: [30, 90, 365].map((value, period) => ({ value, price: index * [500, 1350, 5000][period] })),
    })),
    paymentMethods: [{ value: 'card', label: 'Банковская карта' }, { value: 'qr_code', label: 'QR-код' }],
};
const render = ({ language = 'ru', duration = 30, plan = 'free', isActive = true } = {}) => {
    const TariffPlan = load('TariffPlanSection.tsx', {
        react: { ...React, useState: (value) => [value === 30 ? duration : value, () => {}] },
        '../../../../hooks/useLanguage': { useLanguage: () => ({ language }) },
        '../../../../hooks/useSubscription': { useSubscription: () => ({
            subscription: { plan, isActive, expiresAt: plan === 'free' ? null : '2027-01-01T00:00:00Z' },
            plans, loading: false,
        }) },
        './lang': translations,
    }).default;
    return renderToStaticMarkup(React.createElement(TariffPlan));
};

test('payment choices and durations are translated and feature icons are removed', () => {
    for (const [language, card, qr, year, month] of [
        ['ru', 'Банковская карта', 'QR-код (СБП)', '1 год', '/мес'],
        ['en', 'Bank card', 'QR code (SBP)', '1 year', '/mo'],
        ['zh', '银行卡', '二维码（SBP）', '1 年', '/月'],
    ]) {
        const html = render({ language });
        for (const text of [card, qr, year, month]) assert.ok(html.includes(text), text);
        assert.doesNotMatch(html, /<svg|🔓|🖼|📊|\/ 30/);
        assert.ok(html.includes('Базовый профиль'));
    }
});

test('only the active author plan is highlighted and cannot be purchased again', () => {
    for (const [plan, name] of [['free', 'Обычный'], ['pro', 'Premium'], ['vip', 'VIP']]) {
        const html = render({ plan });
        assert.ok(html.includes(`Ваш тариф: <strong>${name}</strong>`));
        const cards = [...html.matchAll(/<article\b[^>]*>[\s\S]*?<\/article>/g)].map((match) => match[0]);
        const current = cards.filter((card) => card.includes('tariff-card--current'));
        assert.equal(current.length, 1);
        assert.ok(current[0].includes(`>${name}</h2>`));
        assert.match(current[0], /<button\b[^>]*disabled=""[^>]*>Текущий тариф<\/button>/);
    }
    assert.doesNotMatch(render({ plan: 'pro', isActive: false }), /tariff-plan__current|tariff-card--current/);
});

test('monthly prices retain the full discounted amount for longer periods', () => {
    const quarterly = render({ duration: 90 });
    assert.ok(quarterly.includes('tariff-card__price-value">450</span>'));
    assert.ok(quarterly.includes('За выбранный срок: 1 350 ₽'));
    const annual = render({ duration: 365, language: 'en' });
    assert.ok(annual.includes('tariff-card__price-value">416.67</span>'));
    assert.ok(annual.includes('Total for selected period: 5,000 ₽'));
});
