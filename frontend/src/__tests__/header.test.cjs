const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

function header(language) {
    const states = [];
    let cursor = 0;
    const labels = { ru: ['Открыть меню', 'Закрыть меню'], en: ['Open menu', 'Close menu'], zh: ['打开菜单', '关闭菜单'] };
    const source = fs.readFileSync(path.join(__dirname, '../components/layout/Header/Header.tsx'), 'utf8');
    const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
    const module = { exports: {} };
    const dependencies = {
        react: { ...React, useEffect() {}, useCallback: callback => callback, useState(initial) {
            const index = cursor++;
            if (!(index in states)) states[index] = initial;
            return [states[index], next => { states[index] = typeof next === 'function' ? next(states[index]) : next; }];
        } },
        'react-router-dom': { Link: ({ to, children, ...props }) => React.createElement('a', { href: to, ...props }, children), useLocation: () => ({ pathname: '/arts' }), useNavigate: () => () => {} },
        '../../../hooks/useAuth': { useAuth: () => ({ user: null }) },
        '../../../hooks/useLanguage': { useLanguage: () => ({ language }) },
        '../../../hooks/useCart': { useCart: () => ({ getCartCount: () => 0 }) },
        './lang': { headerTranslations: { [language]: { logoTitle: 'Gallery', menu: { open: labels[language][0], close: labels[language][1] }, nav: { gallery: 'Gallery', authors: 'Authors', services: 'Services', contacts: 'Contacts', about: 'About' } } } },
    };
    new Function('require', 'module', 'exports', code)(name => {
        if (name in dependencies) return dependencies[name];
        if (name === 'react/jsx-runtime') return require(name);
        if (name.endsWith('.svg')) return 'icon.svg';
        return { default: () => null };
    }, module, module.exports);
    const render = () => { cursor = 0; return module.exports.default.type({}); };
    const find = (node, predicate) => {
        if (!React.isValidElement(node)) return null;
        if (predicate(node)) return node;
        for (const child of React.Children.toArray(node.props.children)) {
            const match = find(child, predicate);
            if (match) return match;
        }
        return null;
    };
    const menuButton = tree => find(tree, node => node.props['aria-controls'] === 'primary-navigation');
    return { render, find, menuButton, labels: labels[language] };
}

test('mobile navigation opens, keeps all destinations and closes after selecting a link in every language', () => {
    for (const language of ['ru', 'en', 'zh']) {
        const page = header(language);
        let tree = page.render();
        assert.equal(page.menuButton(tree).props['aria-expanded'], false);
        assert.equal(page.menuButton(tree).props['aria-label'], page.labels[0]);
        page.menuButton(tree).props.onClick();
        tree = page.render();
        assert.equal(page.menuButton(tree).props['aria-expanded'], true);
        assert.equal(page.menuButton(tree).props['aria-label'], page.labels[1]);
        const html = renderToStaticMarkup(tree);
        for (const destination of ['/arts', '/authors', '/services', '/contacts', '/about']) assert.ok(html.includes(`href="${destination}"`));
        page.find(tree, node => node.props.id === 'primary-navigation').props.onClick({ target: { closest: selector => selector === 'a' ? {} : null } });
        assert.equal(page.menuButton(page.render()).props['aria-expanded'], false);
    }
});

test('opening the profile or returning home closes the mobile navigation', () => {
    const page = header('ru');
    for (const selector of [node => node.props.className === 'header__profile-btn', node => node.props.className === 'header__logo']) {
        page.menuButton(page.render()).props.onClick();
        assert.equal(page.menuButton(page.render()).props['aria-expanded'], true);
        page.find(page.render(), selector).props.onClick();
        assert.equal(page.menuButton(page.render()).props['aria-expanded'], false);
    }
});
