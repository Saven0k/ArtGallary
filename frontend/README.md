# Frontend — Art Gallery

Клиентская часть веб-приложения галереи художников. Single Page Application (SPA) на React.

---

## Стек технологий

| Блок | Технология | Версия | Назначение |
|------|------------|--------|------------|
| **Фреймворк** | React | 19.x | UI-библиотека, компонентная модель |
| **Сборщик** | Vite | 7.x | Dev-сервер, HMR, production-сборка |
| **Язык** | TypeScript | 5.9 | Статическая типизация |
| **Маршрутизация** | React Router DOM | 7.x | Роутинг SPA, навигация |
| **Стили** | CSS | — | Переменные (светлая/тёмная тема), BEM |
| **Lint** | ESLint | 9.x | Проверка кода, React Hooks, React Refresh |

---

## Структура проекта

```
frontend/
├── index.html              # Точка входа HTML
├── vite.config.ts          # Конфигурация Vite (прокси, алиасы)
├── package.json
├── tsconfig*.json
├── eslint.config.js
└── src/
    ├── main.tsx            # Монтирование React-приложения
    ├── App.tsx             # Корневой компонент, роутинг, AuthProvider
    ├── assets/
    │   └── index.css       # Глобальные стили и CSS-переменные
    ├── context/
    │   └── AuthContext.tsx # Контекст авторизации (user, login, register, logout)
    ├── hooks/
    │   └── useAuth.tsx     # Хук useAuth (альтернативная реализация, CookieService)
    ├── utils/
    │   └── ProtectedRoutes.tsx # Защита маршрутов для авторизованных пользователей
    ├── pages/
    │   ├── HomePage.tsx    # Главная — форма входа (AuthForm)
    │   ├── LoginPage.tsx   # Страница логина (пустая)
    │   ├── GalleryPage.tsx # Галерея картин (заглушка)
    │   └── AdminPage.tsx   # Админ-панель (заглушка)
    └── components/
        ├── layout/
        │   ├── Header/
        │   │   ├── Header.tsx     # Шапка: логотип, навигация, кнопки
        │   │   └── Header.css
        │   ├── Footer/
        │   │   ├── Footer.tsx     # Подвал (заглушка)
        │   │   └── Footer.css
        │   └── ProfileSidebar/
        │       ├── ProfileSidebar.tsx # Боковая панель профиля/меню
        │       └── ProfileSideBar.css
        └── shared/
            └── auth/
                └── AuthForm/
                    ├── AuthForm.tsx   # Форма входа (email, пароль)
                    └── style.css
```

---

## Как работает приложение

### 1. Точка входа

**`main.tsx`** — подключает глобальные стили (`assets/index.css`) и монтирует `App` в `#root`.

**`App.tsx`** — корень приложения:

- **AuthProvider** — оборачивает всё приложение, предоставляет `user`, `login`, `register`, `logout`, `isLoading`
- **BrowserRouter** — роутинг
- **Suspense** — ленивая загрузка страниц (lazy)
- **Header** — отображается на всех страницах
- **Routes** — определяет страницы по URL

### 2. Маршрутизация

| Путь | Компонент | Описание |
|------|-----------|----------|
| `/` | HomePage | Главная, форма входа |
| `/login` | LoginPage | Страница логина (сейчас пустая) |
| `/gallary` | GalleryPage | Галерея картин (заглушка) |
| `/adminPanel` | AdminPage | Админ-панель (заглушка) |
| `*` | HomePage | Все остальные пути |

**Примечание:** Роут `*` стоит последним, чтобы не перехватывать более специфичные пути.

### 3. Авторизация (AuthContext)

**`AuthContext.tsx`** — React Context для глобального состояния авторизации:

- **user** — объект пользователя (`id`, `email`, `password`, `name`, `surname`) или `null`
- **isLoading** — флаг загрузки
- **login(email, password)** — вход (сейчас пустая реализация)
- **register(email, password, surname, name)** — регистрация (пустая)
- **logout()** — выход (пустая)

**useAuth()** — хук для доступа к контексту. Используется в `AuthForm`, `ProtectedRoutes`.

**Связь с бэкендом:** Методы `login` и `register` должны вызывать API (`/api/auth/login`, `/api/auth/register/artist`, `/api/auth/register/guest`), сохранять токен и обновлять `user`. Сейчас логика не реализована.

### 4. Форма входа (AuthForm)

**`AuthForm.tsx`** — форма «Вход в аккаунт»:

- Поля: email, пароль
- Валидация при вводе (регулярное выражение для email, проверка на пустоту)
- При сабмите: проверка ошибок и переход на `/gallery` (без вызова API)
- Ссылка «Забыли пароль?» ведёт на `/forgot-password` (маршрут не настроен)

**Использует:** `useAuth` из `AuthContext` (но вызов `login` закомментирован).

### 5. Шапка (Header)

**`Header.tsx`** — фиксированная шапка:

- **Логотип** — ссылка на `/`
- **Навигация:** Галерея (`/gallery`), Художники (`/artists`), Выставки (`/exhibitions`)
- **Кнопки:** поиск (без логики), профиль (открывает ProfileSidebar)
- **ProfileSidebar** — lazy-компонент, открывается при клике на иконку профиля

**Состояние:** `isMenuOpen`, `isSidebarOpen`. При `Escape` — закрытие sidebar/menu; при открытии sidebar — `overflow: hidden` для body.

**Примечание:** Маршруты `/artists` и `/exhibitions` не объявлены — переход ведёт на HomePage (`*`).

### 6. Боковая панель профиля (ProfileSidebar)

**`ProfileSidebar.tsx`** — боковая панель (overlay + aside):

- **Props:** `onClose`, `onNavigate`, `isAuthenticated` (по умолчанию `true`)

**Для авторизованных (`isAuthenticated = true`):**

- Блок с аватаром, именем, email (моковые данные)
- Меню: Профиль, Редактирование, Мои картины, Добавить картину, Мои выставки, Добавить выставку, Помощь

**Для гостей (`isAuthenticated = false`):**

- Приветствие
- Кнопки: «Войти / Зарегистрироваться» (переход на `/login`), «Продолжить как гость» (`/gallery`)
- Блок преимуществ (картины, выставки, общение)

**Footer панели:** Настройки, Выйти, ссылки на Конфиденциальность и Условия.

**Связь с AuthContext:** `ProfileSidebar` не получает `isAuthenticated` из `Header` — всегда используется значение по умолчанию. Нужно передавать `isAuthenticated={!!user}` из Header.

### 7. ProtectedRoutes

**`ProtectedRoutes.tsx`** — компонент защиты маршрутов:

- Берёт `user` из `useAuth()`
- Если `!user` — редирект на `/`
- Не рендерит `Outlet` или `children` — сейчас возвращает `undefined`, маршруты не оборачиваются в ProtectedRoutes

### 8. Стили и темы

**`assets/index.css`** — глобальные стили:

- Сброс (margin, padding, box-sizing)
- Базовые стили для `button`, `a`
- **CSS-переменные** для светлой темы (`:root`) и тёмной (`[data-theme="dark"]`): цвета, фон, тени, радиусы

Тёмная тема включается атрибутом `data-theme="dark"` на корневом элементе (сейчас переключения нет).

### 9. Сборка и dev-сервер (Vite)

**`vite.config.ts`:**

- **Плагин:** `@vitejs/plugin-react` для React и HMR
- **Порт:** 5173
- **Прокси:**
  - `/api` → `http://localhost:3000` (запросы к бэкенду)
  - `/uploads` → `http://localhost:3000` (статичные файлы, например аватары)
- **Алиас:** `@` → `src` (импорты вида `@/components/...`)

**Важно:** Бэкенд отдаёт API по путям `/api/auth/*` и `/backend/*`. Прокси настроен только на `/api` — запросы к `/backend/*` с фронта не проксируются.

---

## Взаимодействие с бэкендом

| Фронтенд | Бэкенд | Статус |
|----------|--------|--------|
| AuthForm → login | POST /api/auth/login | Не подключено |
| AuthContext → register | POST /api/auth/register/artist, /guest | Не подключено |
| Художники, картины, выставки | GET /backend/artists, /paintings и т.д. | Прокси не настроен для /backend |

**Ожидаемые форматы:**

- **Login:** `{ email, password, userType: 'artist' | 'guest' }`
- **Register artist:** см. `RegisterArtistData` в бэкенде
- **Register guest:** см. `RegisterGuestData` в бэкенде
- **Ответ:** `{ success, message, user?, token? }`

---

## Запуск

```bash
npm install
npm run dev
```

Приложение: **http://localhost:5173**

Сборка: `npm run build`  
Превью продакшен-сборки: `npm run preview`  
Линт: `npm run lint`

---

## Зависимости

- **react**, **react-dom** — UI
- **react-router-dom** — маршрутизация
- **vite** — сборка
- **@vitejs/plugin-react** — поддержка React в Vite
- **typescript** — типизация
- **eslint** + плагины — линтинг


# Дизайн
https://www.figma.com/design/eCdWxp4FNr9xLkZFT8Cwo8/Untitled?node-id=0-1&t=oZ30f5qOtwxqu7No-1 -- дизайн
