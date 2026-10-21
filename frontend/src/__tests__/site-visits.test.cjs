const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

function load(file, dependencies) {
    const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
    }).outputText;
    const module = { exports: {} };
    new Function('require', 'module', 'exports', code)(name => {
        if (name in dependencies) return dependencies[name];
        if (name.endsWith('.scss')) return {};
        return require(name);
    }, module, module.exports);
    return module.exports;
}

test('page views wait for authentication, ignore rerenders and count each pathname navigation once', t => {
    const timers = new Map();
    let sequence = 0;
    t.mock.method(global, 'setTimeout', callback => { timers.set(++sequence, callback); return sequence; });
    t.mock.method(global, 'clearTimeout', id => timers.delete(id));
    const flush = () => { for (const callback of timers.values()) callback(); timers.clear(); };
    let pathname = '/services';
    let isLoading = true;
    let deps;
    let cleanup;
    const ref = { current: null };
    const visits = [];
    const { useSiteVisits } = load('hooks/useSiteVisits.ts', {
        react: { useRef: () => ref, useEffect(effect, next) {
            if (deps && next.every((value, i) => Object.is(value, deps[i]))) return;
            cleanup?.();
            deps = next;
            cleanup = effect();
        } },
        'react-router-dom': { useLocation: () => ({ pathname, search: '?lang=ru' }) },
        './useAuth': { useAuth: () => ({ isLoading }) },
        '../api/site/main.api': { trackSiteVisit: path => { visits.push(path); return Promise.resolve(null); } },
    });
    useSiteVisits(); flush();
    assert.deepEqual(visits, []);
    isLoading = false;
    useSiteVisits(); flush();
    useSiteVisits(); flush();
    assert.deepEqual(visits, ['/services']);
    pathname = '/arts'; useSiteVisits(); flush();
    pathname = '/services'; useSiteVisits(); flush();
    assert.deepEqual(visits, ['/services', '/arts', '/services']);
    pathname = '/redirect'; useSiteVisits();
    pathname = '/login'; useSiteVisits(); flush();
    assert.equal(visits.at(-1), '/login');
    assert.ok(!visits.includes('/redirect'));
    pathname = '/' + 'a'.repeat(300); useSiteVisits(); flush();
    assert.equal(visits.at(-1).length, 255);
    pathname = '/unmounted'; useSiteVisits(); cleanup(); flush();
    assert.ok(!visits.includes('/unmounted'));
});

test('visit totals remain visible before the first rating in all three languages', () => {
    const { ratingsTranslations } = load('components/shared/Admin/sections/Ratings/lang.ts', {});
    for (const language of ['ru', 'en', 'zh']) {
        const values = [{ totalVisits: 347, todayVisits: 18, weekVisits: 92, monthVisits: 347, uniqueUsers: 11, averageRating: 0, ratingsCount: 0 }, false, null];
        let cursor = 0;
        const { default: Ratings } = load('components/shared/Admin/sections/Ratings/RatingsSection.tsx', {
            react: { ...React, useState: () => [values[cursor++], () => {}], useEffect() {}, useCallback: fn => fn },
            '../../../../../hooks/useLanguage': { useLanguage: () => ({ language }) },
            '../../../../../pages/admin/lang': { adminTranslations: { [language]: { common: {} } } },
            '../../../../../api/site/main.api': {},
            '../../SectionHeader/SectionHeader': { default: ({ title }) => React.createElement('h2', null, title) },
            './lang': { ratingsTranslations },
        });
        const html = renderToStaticMarkup(React.createElement(Ratings));
        assert.match(html, />347</);
        for (const key of ['totalVisits', 'todayVisits', 'weekVisits', 'monthVisits', 'uniqueUsers']) {
            assert.ok(html.includes(ratingsTranslations[language].summary[key]));
        }
        assert.doesNotMatch(html, /NaN|undefined/);
    }
});
