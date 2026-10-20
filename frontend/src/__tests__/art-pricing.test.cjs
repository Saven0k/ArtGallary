const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

function load(file, dependencies = {}) {
    const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
    }).outputText;
    const module = { exports: {} };
    new Function('require', 'module', 'exports', code)(name => name in dependencies ? dependencies[name] : name.endsWith('.scss') ? {} : require(name), module, module.exports);
    return module.exports;
}

const arts = load('api/arts/main.api.ts', { '../request': {}, '../main.api': { BASE_URL_API: 'https://gallery.test' } });
const { formatArtPrice } = load('utils/art-price.ts');
const translations = load('components/shared/ArtForm/lang.ts');

test('art prices use the server conversion and never relabel an unconverted amount', () => {
    assert.deepEqual(arts.ART_CURRENCIES, ['RUB', 'USD', 'CNY']);
    const art = { cost: 8000, currency: 'RUB', display_price: { amount: 100, currency: 'USD', rate: 0.0125, rate_date: '2026-10-20' } };
    assert.equal(formatArtPrice(art, 'en'), '≈ ' + new Intl.NumberFormat('en', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(100));
    for (const language of ['ru', 'en', 'zh']) {
        assert.equal(formatArtPrice({ cost: 8000, currency: 'RUB' }, language), new Intl.NumberFormat(language, { style: 'currency', currency: 'RUB', maximumFractionDigits: 2 }).format(8000));
        assert.equal(formatArtPrice({ cost: 0 }, language), new Intl.NumberFormat(language, { style: 'currency', currency: 'RUB', maximumFractionDigits: 2 }).format(0));
        assert.equal(formatArtPrice({ cost: null }, language), null);
    }
    assert.equal(art.cost, 8000);
    assert.equal(art.currency, 'RUB');
    assert.equal(formatArtPrice({ cost: 100, currency: '$' }, 'en'), '100 $');
});

function form(art, initialLanguage = 'ru') {
    let language = initialLanguage;
    let cursor = 0;
    const states = [];
    const calls = [];
    const { default: Component } = load('components/shared/ArtForm/ArtForm.tsx', {
        react: { ...React, useEffect() {}, useState(initial) {
            const index = cursor++;
            if (!(index in states)) states[index] = initial;
            return [states[index], value => { states[index] = value; }];
        } },
        'react-router-dom': { useNavigate: () => () => {} },
        '../../../api/arts/main.api': { ...arts, createArt: async data => { calls.push(data); return { id: 1 }; }, updateArt: async (id, data) => { calls.push({ id, ...data }); return { id }; } },
        '../../../api/genres/main.api': {}, '../../../api/styles/main.api': {}, '../../../api/authors/main.api': {},
        '../../../hooks/useAuth': { useAuth: () => ({ user: { id: 7, role: 'author' } }) },
        '../../../hooks/useLanguage': { useLanguage: () => ({ language }) },
        '../../../utils/errors': { errorMessage: (_, fallback) => fallback },
        './lang': translations,
    });
    const render = () => { cursor = 0; return Component({ art }); };
    return { render, calls, setLanguage(next) { language = next; } };
}

function find(node, predicate) {
    if (!React.isValidElement(node)) return null;
    if (predicate(node)) return node;
    for (const child of React.Children.toArray(node.props.children)) {
        const result = find(child, predicate);
        if (result) return result;
    }
    return null;
}

test('create and edit forms offer exactly three localized currencies', () => {
    for (const language of ['ru', 'en', 'zh']) {
        for (const art of [undefined, { id: 1, cost: 55.5, currency: 'CNY' }]) {
            const instance = form(art, language);
            const select = find(instance.render(), node => node.type === 'select' && typeof node.props.value === 'string');
            assert.deepEqual(React.Children.toArray(select.props.children).map(option => option.props.value), ['RUB', 'USD', 'CNY']);
            assert.equal(select.props.value, art?.currency ?? { ru: 'RUB', en: 'USD', zh: 'CNY' }[language]);
            const html = renderToStaticMarkup(select);
            for (const label of Object.values(translations.artFormTranslations[language].currencies)) assert.ok(html.includes(label));
        }
    }
});

test('editing and changing language keeps the original amount, saves currency changes and clears both fields', async () => {
    const instance = form({ id: 1, cost: 8000, currency: 'RUB', display_price: { amount: 100, currency: 'USD' } }, 'en');
    instance.setLanguage('zh');
    let node = instance.render();
    assert.equal(find(node, element => element.type === 'input' && element.props.type === 'number').props.value, '8000');
    assert.equal(find(node, element => element.type === 'select' && typeof element.props.value === 'string').props.value, 'RUB');
    await node.props.onSubmit({ preventDefault() {} });
    assert.equal(instance.calls[0].cost, 8000);
    assert.equal(instance.calls[0].currency, 'RUB');
    assert.ok(!('display_price' in instance.calls[0]));
    find(instance.render(), element => element.type === 'select' && typeof element.props.value === 'string').props.onChange({ target: { value: 'CNY' } });
    find(instance.render(), element => element.type === 'input' && element.props.type === 'number').props.onChange({ target: { value: '0' } });
    await instance.render().props.onSubmit({ preventDefault() {} });
    assert.equal(instance.calls[1].cost, 0);
    assert.equal(instance.calls[1].currency, 'CNY');
    find(instance.render(), element => element.type === 'input' && element.props.type === 'number').props.onChange({ target: { value: '' } });
    await instance.render().props.onSubmit({ preventDefault() {} });
    assert.equal(instance.calls[2].cost, null);
    assert.equal(instance.calls[2].currency, null);
});

test('legacy currency cannot silently become rubles on edit', async () => {
    const instance = form({ id: 1, cost: 100, currency: 'EUR' });
    await instance.render().props.onSubmit({ preventDefault() {} });
    assert.equal(instance.calls.length, 0);
    assert.ok(find(instance.render(), node => node.props.role === 'alert'));
});

test('cart converts quantity totals while retaining the original checkout amount', () => {
    const utils = load('components/shared/ProfileScreen/CartSection/utils.ts', { '../../../../utils/art-price': { formatArtPrice } });
    const price = { amount: 1, currency: 'USD', rate: 0.0125, rate_date: '2026-10-20' };
    const Component = load('components/shared/ProfileScreen/CartSection/components/TotalsBlock/TotalsBlock.tsx', {
        '../../utils': utils,
        '../../lang': load('components/shared/ProfileScreen/CartSection/lang.ts', { '../../../../utils/translations': {} }),
    }).default;
    const totals = { subtotal: 240, discount: 24, total: 216, currency: 'RUB', displayPrice: price };
    const html = renderToStaticMarkup(React.createElement(Component, { totals, language: 'en' }));
    assert.match(html, /≈ \$2.70/);
    assert.match(html, /artist’s currency: 216 ₽/);
    assert.equal(utils.formatDisplayPrice(240, 'RUB', price, 'en'), '≈ $3.00');
    assert.equal(totals.total, 216);
});
