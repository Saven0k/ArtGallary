const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

const root = path.join(__dirname, '..');
function files(directory) {
    return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
        const file = path.join(directory, entry.name);
        return entry.isDirectory() ? files(file) : [file];
    });
}

function loader(language = 'ru') {
    const cache = new Map();
    return function load(file) {
        if (cache.has(file)) return cache.get(file).exports;
        const module = { exports: {} };
        cache.set(file, module);
        const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
            compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
        }).outputText;
        new Function('require', 'module', 'exports', code)(name => {
            if (/\.(svg|png|jpg|jpeg|webp|scss)$/.test(name)) return 'asset';
            if (name.endsWith('/useLanguage')) return { useLanguage: () => ({ language }) };
            if (name.endsWith('/useAuth')) return { useAuth: () => ({ logout() {} }) };
            if (name.endsWith('/useLikes')) return { useLikes: () => ({ loading: false, isArtLiked: () => false }) };
            if (name.endsWith('/useCart')) return { useCart: () => ({ isInCart: () => false }) };
            if (name.endsWith('/useNotification')) return { useNotification: () => ({ showNotification() {} }) };
            if (name.endsWith('.api')) return {};
            if (name.startsWith('.')) {
                const target = path.resolve(path.dirname(file), name);
                return load([target + '.ts', target + '.tsx'].find(candidate => fs.existsSync(candidate)));
            }
            return require(name);
        }, module, module.exports);
        return module.exports;
    };
}

function strings(value, prefix = '', result = {}) {
    if (typeof value === 'string') result[prefix] = value;
    else if (value && typeof value === 'object') {
        for (const [key, item] of Object.entries(value)) strings(item, prefix ? `${prefix}.${key}` : key, result);
    }
    return result;
}

test('every translation dictionary has matching nonempty RU, EN and ZH text and interpolation tokens', () => {
    const load = loader();
    for (const file of files(root).filter(file => path.basename(file) === 'lang.ts')) {
        for (const [name, dictionary] of Object.entries(load(file))) {
            if (!dictionary || typeof dictionary !== 'object' || !dictionary.ru) continue;
            const original = strings(dictionary.ru);
            for (const language of ['ru', 'en', 'zh']) {
                const label = `${path.relative(root, file)} ${name}.${language}`;
                assert.ok(dictionary[language], label);
                const translated = strings(dictionary[language]);
                assert.deepEqual(Object.keys(translated).sort(), Object.keys(original).sort(), label);
                for (const [key, text] of Object.entries(translated)) {
                    if (original[key].trim()) assert.ok(text.trim(), `${label}.${key} is empty`);
                    if (language !== 'ru') assert.doesNotMatch(text, /[А-Яа-яЁё]/, `${label}.${key}`);
                    assert.deepEqual(text.match(/\{\w+\}/g)?.sort() ?? [], original[key].match(/\{\w+\}/g)?.sort() ?? [], `${label}.${key} placeholders`);
                }
            }
        }
    }
});

test('page copy and accessible labels are not hardcoded outside the translation dictionaries', () => {
    const allowed = new Set(['ArtGallery.', 'Tilinin`s Gallary', 'AG', 'Art Gallery', "TILININ'S GALLERY", 'TILININ’S GALLERY', 'Facebook', 'Instagram', 'Twitter', 'Telegram', 'support@artgallery.com']);
    for (const file of files(root).filter(file => file.endsWith('.tsx'))) {
        const source = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
        function visit(node) {
            const text = ts.isJsxText(node) ? node.text.trim() : ts.isJsxAttribute(node) && /^(alt|title|placeholder|aria-label)$/.test(node.name.text) && node.initializer && ts.isStringLiteral(node.initializer) ? node.initializer.text : '';
            if (/\p{L}/u.test(text)) assert.ok(allowed.has(text), `${path.relative(root, file)}: ${text}`);
            ts.forEachChild(node, visit);
        }
        visit(source);
    }
});

test('home, artwork lists and profile navigation render in the selected language', () => {
    for (const language of ['ru', 'en', 'zh']) {
        const load = loader(language);
        const components = [
            ['pages/home/components/About.tsx', {}],
            ['pages/home/components/Events.tsx', {}],
            ['components/shared/Arts/ArtsList/ArtsList.tsx', { data: { arts: [] } }],
            ['components/shared/ProfileScreen/ProfileSidebar/ProfileSidebar.tsx', { active: 'personal', onChange() {}, role: 'author' }],
        ];
        for (const [file, props] of components) {
            const Component = load(path.join(root, file)).default;
            const html = renderToStaticMarkup(React.createElement(require('react-router-dom').MemoryRouter, null, React.createElement(Component, props)));
            assert.ok(html.length > 0, file);
            if (language === 'ru') assert.match(html, /[А-Яа-яЁё]/, file);
            else assert.doesNotMatch(html, /[А-Яа-яЁё]/, `${file} ${language}`);
            if (language === 'zh') assert.match(html, /\p{Script=Han}/u, file);
        }
    }
});

test('guest sidebar uses the selected language and keeps signed-in role menus', () => {
    for (const language of ['ru', 'en', 'zh']) {
        const load = loader(language);
        const Sidebar = load(path.join(root, 'components/layout/ProfileSidebar/ProfileSidebar.tsx')).default;
        const copy = load(path.join(root, 'components/layout/ProfileSidebar/lang.ts')).sidebarTranslations[language];
        const props = { onClose() {}, onNavigate() {} };
        const guest = renderToStaticMarkup(React.createElement(Sidebar, props));
        assert.match(guest, /sidebarProfile--guest/);
        for (const text of [copy.guest.title, copy.guest.login, copy.guest.register, copy.guest.settings]) {
            assert.ok(guest.includes(text), `${language}: ${text}`);
        }
        for (const userRole of ['user', 'author', 'moderator', 'admin']) {
            const html = renderToStaticMarkup(React.createElement(Sidebar, {
                ...props, isAuthenticated: true, userRole,
                userData: { name: 'Test', surname: 'Account', email: 'test@example.com' },
            }));
            assert.doesNotMatch(html, /sidebarProfile--guest|sidebarProfile__guest-content/);
            assert.match(html, /sidebarProfile__nav/);
            assert.match(html, /Test Account/);
        }
    }
});

test('Chinese language badge reads CH while the application retains the zh locale', () => {
    const Switcher = loader('zh')(path.join(root, 'components/layout/LanguageSwitcher/LanguageSwitcher.tsx')).default;
    const html = renderToStaticMarkup(React.createElement(Switcher));
    assert.match(html, /class="lang-switcher__text">CH<\/span>/);
});

test('chart dates use the selected language and preserve invalid dates', () => {
    const { formatShortDate } = loader()(path.join(root, 'components/shared/ProfileScreen/StatisticsSection/Charts/utils.ts'));
    for (const language of ['ru', 'en', 'zh']) {
        assert.equal(formatShortDate('2026-03-15', language), new Date('2026-03-15').toLocaleDateString(language, { day: 'numeric', month: 'short' }));
        assert.equal(formatShortDate('invalid', language), 'invalid');
    }
});

test('cart prices use the selected locale without changing currency or value', () => {
    const { formatPrice } = loader()(path.join(root, 'components/shared/ProfileScreen/CartSection/utils.ts'));
    for (const language of ['ru', 'en', 'zh']) {
        assert.equal(formatPrice(1234.56, 'RUB', language), `${(1234.56).toLocaleString(language)} ₽`);
        assert.equal(formatPrice(1234.56, 'USD', language), `${(1234.56).toLocaleString(language)} USD`);
    }
});
