const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

const root = path.join(__dirname, '..');
const folder = 'components/shared/ProfileScreen/NotificationSection/';

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

const notification = (id, status = 'unread') => ({ id, type: 'art_like', message: `Artwork ${id}`, created_at: '2026-10-22T09:00:00Z', status, link: null });

function screen({ language = 'ru', failedLoad = false, failedAction = false, hasNextPage = false, secondPage, linked = false } = {}) {
    const states = [], effects = [], previousDeps = [], cleanups = [];
    let cursor = 0, scheduled = [], languageValue = language;
    const calls = [], navigations = [];
    let loadFails = failedLoad, actionFails = failedAction;
    const initialItems = [notification(1), notification(2, 'read')];
    if (linked) initialItems[0].link = '/arts/7';
    const result = data => ({ data, unread_count: data.filter(item => item.status === 'unread').length, pagination: { hasNextPage } });
    const Component = load(folder + 'NotificationSection.tsx', {
        react: { ...React,
            useState(initial) { const index = cursor++; if (!(index in states)) states[index] = initial; return [states[index], value => { states[index] = typeof value === 'function' ? value(states[index]) : value; }]; },
            useRef(initial) { const index = cursor++; return states[index] ??= { current: initial }; },
            useEffect(callback, deps) { const index = cursor++; if (!previousDeps[index] || deps.some((dep, i) => !Object.is(dep, previousDeps[index][i]))) { previousDeps[index] = deps; scheduled.push(() => { cleanups[index]?.(); cleanups[index] = callback(); }); } },
        },
        'react-router-dom': { useNavigate: () => value => navigations.push(value) },
        '../../../../hooks/useLanguage': { useLanguage: () => ({ language: languageValue }) },
        '../../../../../hooks/useLanguage': { useLanguage: () => ({ language: languageValue }) },
        '../../../../api/notification/main.api': {
            getNotifications: async (page, limit) => { calls.push(['get', page, limit]); return loadFails ? null : page === 1 ? result(initialItems) : secondPage ? secondPage() : result([notification(3)]); },
            markNotificationAsRead: async id => { calls.push(['read', id]); return actionFails ? null : { success: true }; },
            deleteNotification: async id => { calls.push(['delete', id]); return actionFails ? null : { success: true }; },
            markAllNotificationsAsRead: async () => { calls.push(['read-all']); return actionFails ? null : { success: true }; },
            deleteAllNotifications: async () => { calls.push(['delete-all']); return actionFails ? null : { success: true }; },
        },
    }).default;
    const render = () => { cursor = 0; scheduled = []; return Component(); };
    const flush = async () => { for (const effect of scheduled) effect(); await new Promise(setImmediate); return render(); };
    const copy = load(folder + 'lang.ts').notificationsTranslations;
    return { render, flush, calls, navigations, copy,
        async start() { render(); return flush(); },
        async setLanguage(value) { languageValue = value; render(); return flush(); },
        allowLoad() { loadFails = false; },
        allowAction() { actionFails = false; },
    };
}

const card = (tree, id) => find(tree, node => typeof node.type === 'function' && node.props.description === `Artwork ${id}`);
const button = (tree, name) => find(tree, node => node.type === 'button' && node.props.children === name);

test('notification cards use separate native buttons so keyboard deletion cannot open a notification', () => {
    for (const language of ['ru', 'en', 'zh']) {
        let opened = 0, deleted = 0;
        const Card = load(folder + 'NotificationCard/NotificationCard.tsx', { '../../../../../hooks/useLanguage': { useLanguage: () => ({ language }) } }).default;
        const tree = Card({ icon: null, title: 'Title', description: 'Description', time: '12:00', dateTime: '2026-10-22T09:00:00Z', onClick: () => opened++, onDelete: () => deleted++ });
        assert.equal(tree.type, 'article');
        const open = find(tree, node => node.props.className === 'notification-card__open');
        const remove = find(tree, node => node.props.className === 'notification-card__delete');
        assert.equal(open.type, 'button');
        assert.equal(remove.type, 'button');
        assert.equal(find(open, node => node === remove), null);
        remove.props.onClick();
        assert.equal(deleted, 1);
        assert.equal(opened, 0);
        open.props.onClick();
        assert.equal(opened, 1);
        assert.equal(find(tree, node => node.type === 'time').props.dateTime, '2026-10-22T09:00:00Z');
        const disabled = Card({ icon: null, title: 'Title', description: '', time: '', disabled: true, onDelete() {} });
        assert.equal(find(disabled, node => node.props.className === 'notification-card__open').props.disabled, true);
        assert.equal(find(disabled, node => node.props.className === 'notification-card__delete').props.disabled, true);
    }
});

test('all three languages render the real list, read state and individual deletion', async () => {
    for (const language of ['ru', 'en', 'zh']) {
        const page = screen({ language, linked: true });
        let tree = await page.start();
        assert.ok(renderToStaticMarkup(tree).includes(page.copy[language].title));
        assert.equal(card(tree, 1).props.unread, true);
        await card(tree, 1).props.onClick();
        tree = page.render();
        assert.equal(card(tree, 1).props.unread, false);
        await card(tree, 2).props.onDelete();
        assert.equal(card(page.render(), 2), null);
        assert.deepEqual(page.calls.slice(1), [['read', 1], ['delete', 2]]);
        assert.deepEqual(page.navigations, ['/arts/7']);
    }
});

test('bulk read and confirmed deletion update the list without removing data on a failed request', async t => {
    const previousWindow = global.window;
    const events = [];
    global.window = { dispatchEvent: event => events.push(event.type) };
    t.after(() => { if (previousWindow === undefined) delete global.window; else global.window = previousWindow; });
    const page = screen({ failedAction: true });
    let tree = await page.start();
    await button(tree, page.copy.ru.markAllRead).props.onClick();
    tree = page.render();
    assert.equal(card(tree, 1).props.unread, true);
    assert.ok(renderToStaticMarkup(tree).includes(page.copy.ru.actionError));
    assert.deepEqual(events, []);
    button(tree, page.copy.ru.deleteAll).props.onClick();
    tree = page.render();
    await button(tree, page.copy.ru.yesDeleteAll).props.onClick();
    tree = page.render();
    assert.ok(find(tree, node => node.type === 'dialog'));
    assert.ok(card(tree, 1));
    assert.ok(renderToStaticMarkup(tree).includes(page.copy.ru.actionError));
    button(tree, page.copy.ru.cancel).props.onClick();
    tree = page.render();
    page.allowAction();
    await button(tree, page.copy.ru.markAllRead).props.onClick();
    tree = page.render();
    assert.equal(card(tree, 1).props.unread, false);
    button(tree, page.copy.ru.deleteAll).props.onClick();
    tree = page.render();
    assert.ok(find(tree, node => node.type === 'dialog'));
    await button(tree, page.copy.ru.yesDeleteAll).props.onClick();
    tree = page.render();
    assert.equal(card(tree, 1), null);
    assert.ok(renderToStaticMarkup(tree).includes(page.copy.ru.empty));
    assert.equal(find(tree, node => node.type === 'dialog'), null);
    assert.deepEqual(events, ['gallery:notifications-updated', 'gallery:notifications-updated']);
});

test('failed loads display a retry instead of pretending the inbox is empty', async () => {
    const page = screen({ failedLoad: true });
    let tree = await page.start();
    assert.ok(renderToStaticMarkup(tree).includes(page.copy.ru.error));
    assert.ok(!renderToStaticMarkup(tree).includes(page.copy.ru.empty));
    page.allowLoad();
    button(tree, page.copy.ru.retry).props.onClick();
    page.render();
    tree = await page.flush();
    assert.ok(card(tree, 1));
});

test('loading more appends data and ignores a stale response after switching language', async () => {
    const populated = screen({ hasNextPage: true });
    let populatedTree = await populated.start();
    await button(populatedTree, populated.copy.ru.loadMore).props.onClick();
    populatedTree = populated.render();
    assert.ok(card(populatedTree, 1));
    assert.ok(card(populatedTree, 3));
    let finish;
    const page = screen({ hasNextPage: true, secondPage: () => new Promise(resolve => { finish = resolve; }) });
    let tree = await page.start();
    const pending = button(tree, page.copy.ru.loadMore).props.onClick();
    tree = await page.setLanguage('en');
    finish({ data: [notification(3)], unread_count: 2, pagination: { hasNextPage: false } });
    await pending;
    tree = page.render();
    assert.equal(card(tree, 3), null);
    assert.ok(renderToStaticMarkup(tree).includes(page.copy.en.title));
    assert.deepEqual(page.calls, [['get', 1, 20], ['get', 2, 20], ['get', 1, 20]]);
});
