const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const { MemoryRouter } = require('react-router-dom');
const root = path.join(__dirname, '..');
const folder = 'components/shared/ProfileScreen/';

function load(file, dependencies = {}, cache = new Map()) {
    if (cache.has(file)) return cache.get(file).exports;
    const module = { exports: {} };
    cache.set(file, module);
    const code = ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
    }).outputText;
    new Function('require', 'module', 'exports', code)(name => {
        if (name in dependencies) return dependencies[name];
        if (name.endsWith('.scss')) return {};
        if (name.startsWith('.')) {
            const target = path.join(path.dirname(file), name);
            return load([target + '.ts', target + '.tsx'].find(candidate => fs.existsSync(path.join(root, candidate))), dependencies, cache);
        }
        return require(name);
    }, module, module.exports);
    return module.exports;
}

function find(node, predicate) {
    if (!React.isValidElement(node)) return null;
    if (predicate(node)) return node;
    for (const child of React.Children.toArray(node.props.children)) {
        const match = find(child, predicate);
        if (match) return match;
    }
    return null;
}
const html = tree => renderToStaticMarkup(React.createElement(MemoryRouter, null, tree));
const button = (tree, text) => find(tree, node => node.type === 'button' && node.props.children === text);

function screen(file, dependencies, props = {}) {
    const states = [], previousDeps = [], cleanups = [];
    let cursor = 0, scheduled = [];
    const Component = load(folder + file, {
        ...dependencies,
        react: { ...React,
            useCallback: callback => callback,
            useMemo: callback => callback(),
            useState(initial) { const index = cursor++; if (!(index in states)) states[index] = initial; return [states[index], value => { states[index] = typeof value === 'function' ? value(states[index]) : value; }]; },
            useEffect(callback, deps) { const index = cursor++; if (!previousDeps[index] || deps.some((dep, i) => !Object.is(dep, previousDeps[index][i]))) { previousDeps[index] = deps; scheduled.push(() => { cleanups[index]?.(); cleanups[index] = callback(); }); } },
        },
    }).default;
    const render = () => { cursor = 0; scheduled = []; return Component(props); };
    const flush = async () => { for (const effect of scheduled) effect(); await new Promise(setImmediate); return render(); };
    return { render, flush, async start() { render(); return flush(); } };
}

test('purchase history renders snapshot amounts, missing prices and all three languages', async () => {
    for (const lang of ['ru', 'en', 'zh']) {
        const page = screen('PurchaseHistorySection/PurchaseHistorySection.tsx', {
            '../../../../api/cart-history/main.api': { getCartHistory: async () => ({ items: [{ id: 1, artIds: [7, 8], status: 'delivered', createdAt: '2026-10-22T09:00:00Z', items: [{ artId: 7, title: 'Purchased artwork', authorName: 'Anna', specifications: 'Oil', quantity: 2, total: 200, currency: 'USD' }, { artId: 8, title: '', total: null }] }] }) },
        }, { lang });
        const markup = html(await page.start());
        assert.ok(markup.includes('Purchased artwork'));
        assert.ok(markup.includes('Anna'));
        assert.ok(markup.includes(new Intl.NumberFormat(lang, { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(200)));
        const { usePurchaseHistoryTranslation } = load(folder + 'PurchaseHistorySection/lang.ts', { react: { useCallback: callback => callback } });
        assert.ok(markup.includes(usePurchaseHistoryTranslation(lang).t('unknownPrice')));
    }
});

test('history filters request the selected status and cancel stale responses', async () => {
    const calls = [];
    let finish;
    const page = screen('PurchaseHistorySection/PurchaseHistorySection.tsx', {
        '../../../../api/cart-history/main.api': { getCartHistory: (filter, signal) => { calls.push({ filter, signal }); return calls.length === 1 ? new Promise(resolve => { finish = resolve; }) : Promise.resolve({ items: [] }); } },
    });
    let tree = await page.start();
    button(tree, 'Доставленные').props.onClick();
    page.render();
    tree = await page.flush();
    assert.equal(calls[0].signal.aborted, true);
    assert.deepEqual(calls[1].filter, { status: 'delivered' });
    finish({ items: [{ id: 1, artIds: [7], items: [{ artId: 7, title: 'Stale artwork' }], createdAt: '2026-10-22', status: 'cancelled' }] });
    await new Promise(setImmediate);
    assert.ok(!html(page.render()).includes('Stale artwork'));
});

test('unfollow preserves the list on errors and reloads after successful deletion', async () => {
    let failed = true, deleted = false, reads = 0;
    const calls = [];
    const page = screen('FollowsSection/FollowsSection.tsx', {
        '../../../../hooks/useLanguage': { useLanguage: () => ({ language: 'ru' }) },
        '../../../../api/authors/main.api': {
            getUserFollowing: async () => { reads++; return { data: deleted ? [] : [{ author_id: 8, author_name: 'Anna', author_surname: 'Ivanova', profession: { name: 'Painter' } }], pagination: { total: deleted ? 0 : 1, totalPages: 1, page: 1 } }; },
            unfollowAuthor: async id => { calls.push(id); if (failed) return null; deleted = true; return { success: true, is_following: false }; },
        },
    });
    let tree = await page.start();
    assert.ok(html(tree).includes('Painter'));
    await button(tree, 'Отписаться').props.onClick();
    tree = page.render();
    assert.ok(html(tree).includes('Anna'));
    assert.ok(find(tree, node => node.props.role === 'alert'));
    failed = false;
    await button(tree, 'Отписаться').props.onClick();
    page.render();
    tree = await page.flush();
    assert.ok(!html(tree).includes('Anna'));
    assert.equal(reads, 2);
    assert.deepEqual(calls, [8, 8]);
});

test('unfollowing the last item of the last page returns to the previous page', async () => {
    let removed = false;
    const pages = [];
    const page = screen('FollowsSection/FollowsSection.tsx', {
        '../../../../hooks/useLanguage': { useLanguage: () => ({ language: 'en' }) },
        '../../../../api/authors/main.api': {
            getUserFollowing: async number => { pages.push(number); return { data: [{ author_id: number === 2 ? 21 : 8, author_name: 'Anna' }], pagination: { total: removed ? 20 : 21, totalPages: removed ? 1 : 2, page: number, hasNextPage: number === 1 && !removed, hasPreviousPage: number > 1 } }; },
            unfollowAuthor: async () => { removed = true; return { success: true, is_following: false }; },
        },
    });
    let tree = await page.start();
    button(tree, 'Next →').props.onClick();
    page.render(); tree = await page.flush();
    await button(tree, 'Unfollow').props.onClick();
    page.render(); tree = await page.flush();
    assert.deepEqual(pages, [1, 2, 1]);
    assert.equal(button(tree, 'Next →'), null);
});

test('history load failures expose a working retry instead of an empty history', async () => {
    let failed = true;
    const page = screen('PurchaseHistorySection/PurchaseHistorySection.tsx', {
        '../../../../api/cart-history/main.api': { getCartHistory: async () => failed ? null : { items: [] } },
    }, { lang: 'en' });
    let tree = await page.start();
    assert.ok(html(tree).includes('Failed to load history'));
    assert.ok(!html(tree).includes('No purchases yet'));
    failed = false;
    button(tree, 'Retry').props.onClick();
    page.render(); tree = await page.flush();
    assert.ok(html(tree).includes('No purchases yet'));
    assert.equal(find(tree, node => node.props.role === 'alert'), null);
});

test('cart keeps originals single and poster quantity bounded with independent removal', () => {
    const Row = load(folder + 'CartSection/components/CartItemRow/CartItemRow.tsx').default;
    const changes = [], removals = [];
    const props = { line: { id: 7, title: 'Art', authorName: 'Anna', price: 100, total: 99900, currency: 'RUB', quantity: 999, isOriginal: false }, busy: false, language: 'ru', onChangeQuantity: (...args) => changes.push(args), onRemove: id => removals.push(id) };
    let tree = Row(props);
    assert.equal(button(tree, '+').props.disabled, true);
    button(tree, '−').props.onClick();
    find(tree, node => node.props.className === 'cart-item__remove').props.onClick();
    assert.deepEqual(changes, [[7, 998]]);
    assert.deepEqual(removals, [7]);
    tree = Row({ ...props, line: { ...props.line, isOriginal: true } });
    assert.equal(button(tree, '+'), null);
});

test('cart uses the server-validated custom promo percentage and sends only code and quantities at checkout', async () => {
    const validated = [], checkouts = [], navigations = [];
    const page = screen('CartSection/CartSection.tsx', {
        '../../../../hooks/useLanguage': { useLanguage: () => ({ language: 'en' }) },
        '../../../../hooks/useCart': { useCart: () => ({ cartItems: [7], loading: false, reload: async () => {}, removeFromCart: async () => true, clearCart: async () => true }) },
        '../../../../api/arts/main.api': { getArtById: async () => ({ id: 7, title: 'Artwork', image_path: '/art.png', cost: 100.55, currency: 'USD' }) },
        '../../../../api/promo-codes/main.api': { validatePromoCode: async code => { validated.push(code); return { code: 'CUSTOM2026', percent: 12, expiresAt: null }; } },
        '../../../../api/cart-history/main.api': { checkoutCart: async payload => checkouts.push(payload) },
        'react-router-dom': { useNavigate: () => url => navigations.push(url) },
    });
    let tree = await page.start();
    const promo = () => find(tree, node => node.type.name === 'PromoBlock');
    await promo().props.onApply('custom2026');
    tree = page.render();
    assert.deepEqual(validated, ['custom2026']);
    assert.equal(promo().props.appliedPromo.code, 'CUSTOM2026');
    assert.deepEqual(find(tree, node => node.type.name === 'TotalsBlock').props.totals, { subtotal: 100.55, discount: 12.07, total: 88.48, currency: 'USD', displayPrice: undefined });
    find(tree, node => node.type.name === 'CartItemRow').props.onChangeQuantity(7, 2);
    tree = page.render();
    assert.equal(find(tree, node => node.type.name === 'TotalsBlock').props.totals.total, 176.97);
    await button(tree, 'Checkout').props.onClick();
    assert.deepEqual(checkouts, [{ items: [{ artId: 7, quantity: 2 }], promoCode: 'CUSTOM2026' }]);
    assert.deepEqual(navigations, ['/profile?section=history']);
});

test('checkout invalidates a promo disabled after application without reporting a completed order', async () => {
    const navigations = [];
    const page = screen('CartSection/CartSection.tsx', {
        '../../../../hooks/useLanguage': { useLanguage: () => ({ language: 'en' }) },
        '../../../../hooks/useCart': { useCart: () => ({ cartItems: [7], loading: false }) },
        '../../../../api/arts/main.api': { getArtById: async () => ({ id: 7, title: 'Artwork', cost: 100, currency: 'RUB' }) },
        '../../../../api/promo-codes/main.api': { validatePromoCode: async () => ({ code: 'CUSTOM2026', percent: 10, expiresAt: null }) },
        '../../../../api/cart-history/main.api': { checkoutCart: async () => { throw new Error('PROMO_CODE_INVALID'); } },
        'react-router-dom': { useNavigate: () => url => navigations.push(url) },
    });
    let tree = await page.start();
    await find(tree, node => node.type.name === 'PromoBlock').props.onApply('CUSTOM2026');
    tree = page.render(); await button(tree, 'Checkout').props.onClick(); tree = page.render();
    assert.equal(find(tree, node => node.type.name === 'PromoBlock').props.appliedPromo, null);
    assert.equal(find(tree, node => node.props.role === 'alert').props.children[0], 'Invalid promo code');
    assert.equal(find(tree, node => node.type.name === 'TotalsBlock').props.totals.discount, 0);
    assert.deepEqual(navigations, []);
});

test('promo code administration remains restricted to admins and creates then disables real API records', async () => {
    const config = load('pages/admin/lang.ts');
    assert.deepEqual(config.ADMIN_SECTIONS.find(section => section.id === 'promoCodes').roles, ['admin']);
    const rows = [], calls = [];
    let language = 'en';
    class PromoCodeError extends Error {}
    const page = screen('../Admin/sections/PromoCodes/PromoCodesSection.tsx', {
        '../../../../../hooks/useLanguage': { useLanguage: () => ({ language }) },
        '../../../../../api/promo-codes/main.api': {
            PromoCodeError,
            getPromoCodes: async () => ({ items: [...rows], page: 1, limit: 20, total: rows.length }),
            createPromoCode: async data => { calls.push(['create', data]); const row = { ...data, id: 7, active: true, createdAt: '2026-10-22T10:00:00Z' }; rows.push(row); return row; },
            setPromoCodeActive: async (id, active) => { calls.push(['active', id, active]); return { ...rows[0], active }; },
        },
    });
    let tree = await page.start();
    find(tree, node => node.type === 'input' && node.props.name === 'code').props.onChange({ target: { value: 'welcome26' } });
    tree = page.render();
    await find(tree, node => node.type === 'form').props.onSubmit({ preventDefault() {} });
    page.render(); tree = await page.flush();
    assert.deepEqual(calls[0], ['create', { code: 'WELCOME26', percent: 10, expiresAt: null }]);
    const table = () => find(tree, node => node.type.name === 'DataTable');
    assert.equal(table().props.rows[0].active, true);
    const actions = table().props.columns.find(column => column.key === 'actions');
    await actions.render(table().props.rows[0]).props.onClick();
    tree = page.render();
    assert.equal(table().props.rows[0].active, false);
    assert.deepEqual(calls[1], ['active', 7, false]);
    language = 'zh'; tree = page.render();
    assert.equal(find(tree, node => node.props.role === 'status').props.children, '优惠码状态已更新');
});

test('promo form validates asynchronously and translates existing errors when language changes', async () => {
    const props = { language: 'ru', busy: false, appliedPromo: null, onApply: async () => 'invalid', onRemove() {} };
    const page = screen('CartSection/components/PromoBlock/PromoBlock.tsx', {}, props);
    let tree = await page.start();
    find(tree, node => node.type === 'input').props.onChange({ target: { value: 'unknown' } });
    tree = page.render();
    tree.props.onSubmit({ preventDefault() {} });
    await new Promise(setImmediate); tree = page.render();
    assert.equal(find(tree, node => node.props.role === 'alert').props.children, 'Промокод недействителен');
    props.language = 'en'; tree = page.render();
    assert.equal(find(tree, node => node.props.role === 'alert').props.children, 'Invalid promo code');
    assert.equal(find(tree, node => node.type === 'input').props.value, 'unknown');
});
