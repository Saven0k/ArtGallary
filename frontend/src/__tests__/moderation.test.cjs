const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

function load(file, dependencies = {}, fallback = require) {
    const source = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
    const code = ts.transpileModule(source, {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
    }).outputText;
    const module = { exports: {} };
    new Function('require', 'module', 'exports', code)(
        name => {
            const value = name === 'react/jsx-runtime' ? require(name) : name in dependencies ? dependencies[name] : name.endsWith('.scss') ? {} : fallback(name);
            return value && Object.hasOwn(value, 'default') ? { __esModule: true, ...value } : value;
        },
        module, module.exports,
    );
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

const admin = load('pages/admin/lang.ts');
const moderation = load('components/shared/Admin/sections/Moderation/lang.ts');
const sections = load('components/layout/ProfileSidebar/sections.ts');
const router = require('react-router-dom');

test('the actual admin route admits moderators and rejects ordinary accounts', () => {
    let auth;
    const { ProtectedRoute } = load('components/ui/ProtectedRoute/ProtectedRoute.tsx', {
        '../../../hooks/useAuth': { useAuth: () => auth },
        '../../../hooks/useLanguage': { useLanguage: () => ({ language: 'ru' }) },
        './lang': load('components/ui/ProtectedRoute/lang.ts'),
        'react-router-dom': { ...router, useLocation: () => ({ pathname: '/admin', search: '?section=moderation&tab=arts' }) },
    });
    const { default: App } = load('App.tsx', {
        react: { ...React, lazy: () => () => null },
        'react-router-dom': router,
        './components/ui/ProtectedRoute/ProtectedRoute': { ProtectedRoute },
    }, () => new Proxy({}, { get: () => () => null }));
    const route = find(App(), node => node.props.path === '/admin');
    assert.ok(route);
    const group = find(App(), node => node.props.element?.type === ProtectedRoute &&
        React.Children.toArray(node.props.children).some(child => child.props.path === '/admin'));
    assert.ok(group);
    for (const role of ['admin', 'moderator', 'author', 'user', 'visitor']) {
        auth = { user: { role }, isAuthenticated: true, isLoading: false };
        const result = ProtectedRoute({ ...group.props.element.props, children: 'moderation' });
        if (role === 'admin' || role === 'moderator') assert.equal(result.props.children, 'moderation');
        else assert.equal(result.props.to, '/profile');
    }
    auth = { user: null, isAuthenticated: false, isLoading: false };
    const guest = ProtectedRoute(group.props.element.props);
    assert.equal(guest.props.to, '/');
    assert.equal(guest.props.state.from, '/admin?section=moderation&tab=arts');
});

test('moderators see only moderation and each sidebar destination selects its own queue', () => {
    assert.deepEqual(admin.ADMIN_SECTIONS.filter(section => section.roles.includes('moderator')).map(section => section.id), ['moderation']);
    const links = sections.menuSectionsModerator.find(section => section.titleKey === 'moderation').items;
    assert.deepEqual(links.map(link => new URL(link.path, 'https://gallery.test').searchParams.get('tab')), ['arts', 'authors']);
    for (const link of links) assert.equal(new URL(link.path, 'https://gallery.test').searchParams.get('section'), 'moderation');
});

function queue(url, { language = 'ru', failedLoad = false, failedDecision = false } = {}) {
    let params = new URL(url, 'https://gallery.test').searchParams;
    const states = [];
    let cursor = 0;
    let effects = [];
    const calls = [];
    const art = { id: 12, title: 'Artwork awaiting review', date_published: '2026-10-20' };
    const author = { id: 23, name: 'Artist', surname: 'Pending', authorProfile: {} };
    const Component = load('components/shared/Admin/sections/Moderation/ModerationSection.tsx', {
        react: { ...React, useCallback: callback => callback, useMemo: callback => callback(), useEffect: callback => effects.push(callback),
            useState(initial) {
                const index = cursor++;
                if (!(index in states)) states[index] = typeof initial === 'function' ? initial() : initial;
                return [states[index], value => { states[index] = typeof value === 'function' ? value(states[index]) : value; }];
            } },
        'react-router-dom': { useSearchParams: () => [params, next => { params = new URLSearchParams(typeof next === 'function' ? next(params) : next); }] },
        '../../../../../hooks/useLanguage': { useLanguage: () => ({ language }) },
        '../../../../../hooks/useAuth': { useAuth: () => ({ user: { id: 7, role: 'moderator' } }) },
        '../../../../../pages/admin/lang': admin,
        './lang': moderation,
        '../../../../../api/arts/main.api': {
            getUnmoderatedArts: async () => failedLoad ? null : { arts: [art] },
            moderateArt: async (...args) => { calls.push(['art', ...args]); return failedDecision ? null : art; },
        },
        '../../../../../api/authors/main.api': {
            getUnmoderatedAuthors: async () => ({ data: [author] }),
            moderateAuthor: async (...args) => { calls.push(['author', ...args]); return failedDecision ? null : { success: true }; },
        },
        '../../../../../api/moderators/main.api': {},
        '../../SectionHeader/SectionHeader': { default: () => null },
        '../../EmptyState/EmptyState': { default: ({ text }) => React.createElement('p', null, text) },
    }).default;
    const render = () => { cursor = 0; effects = []; return Component(); };
    return {
        render, calls, copy: moderation.moderationTranslations[language],
        params: () => params,
        navigate: url => { params = new URL(url, 'https://gallery.test').searchParams; },
        async start() {
            render();
            for (const effect of effects) effect();
            await new Promise(setImmediate);
            return render();
        },
    };
}

test('queue links, tab changes and browser navigation select the expected content in every language', async () => {
    for (const language of ['ru', 'en', 'zh']) {
        const page = queue('/admin?section=moderation&tab=arts', { language });
        let tree = await page.start();
        let html = renderToStaticMarkup(tree);
        assert.match(html, /Artwork awaiting review/);
        assert.doesNotMatch(html, /Pending Artist/);
        const authorsTab = find(tree, node => node.type === 'button' && node.props.children?.[0] === page.copy.tabs.authors);
        authorsTab.props.onClick();
        assert.equal(page.params().get('section'), 'moderation');
        assert.equal(page.params().get('tab'), 'authors');
        tree = page.render();
        html = renderToStaticMarkup(tree);
        assert.match(html, /Pending Artist/);
        assert.doesNotMatch(html, /Artwork awaiting review/);
        assert.equal(find(tree, node => node.type === 'button' && node.props.children?.[0] === page.copy.tabs.authors).props['aria-pressed'], true);
        page.navigate('/admin?section=moderation&tab=arts');
        assert.match(renderToStaticMarkup(page.render()), /Artwork awaiting review/);
        page.navigate('/admin?section=moderation&tab=unknown');
        html = renderToStaticMarkup(page.render());
        assert.match(html, /Artwork awaiting review/);
        assert.match(html, /Pending Artist/);
    }
});

test('both moderation queues submit approval, rejection and a trimmed comment as the current moderator', async () => {
    for (const [tab, kind, id] of [['arts', 'art', 12], ['authors', 'author', 23]]) {
        for (const approve of [true, false]) {
            const page = queue(`/admin?section=moderation&tab=${tab}`);
            let tree = await page.start();
            const suffix = approve ? '--approve' : '--reject';
            find(tree, node => node.type === 'button' && node.props.className.endsWith(suffix)).props.onClick();
            tree = page.render();
            find(tree, node => node.type === 'textarea').props.onChange({ target: { value: '  Review comment  ' } });
            tree = page.render();
            await find(tree, node => node.type === 'button' && node.props.className === `moderation-section__btn moderation-section__btn${approve ? '--primary' : '--danger'}`).props.onClick();
            assert.deepEqual(page.calls, [[kind, id, { moderate: approve, moderator_id: 7, comment: 'Review comment', errors: {} }]]);
            assert.equal(find(page.render(), node => node.props.className === 'moderation-section__modal'), null);
        }
    }
});

test('failed queue loads show an error and failed decisions preserve the review dialog', async t => {
    t.mock.method(console, 'error', () => {});
    const unavailable = queue('/admin?section=moderation', { failedLoad: true });
    assert.ok(renderToStaticMarkup(await unavailable.start()).includes(unavailable.copy.errors.loadFailed));
    for (const tab of ['arts', 'authors']) {
        const page = queue(`/admin?section=moderation&tab=${tab}`, { failedDecision: true });
        const tree = await page.start();
        find(tree, node => node.type === 'button' && node.props.className.endsWith('--approve')).props.onClick();
        await find(page.render(), node => node.type === 'button' && node.props.className === 'moderation-section__btn moderation-section__btn--primary').props.onClick();
        const result = page.render();
        assert.ok(find(result, node => node.props.className === 'moderation-section__modal'));
        assert.ok(renderToStaticMarkup(result).includes(page.copy.errors.moderateFailed));
    }
});
