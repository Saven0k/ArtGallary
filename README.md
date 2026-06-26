# Art Gallery — Галерея художников

Веб-приложение для управления художественной галереей: каталог картин, художники, выставки и гости.

---

## Структура проекта

```
gallary/
├── backend/     # REST API (Node.js + Express + Prisma)
├── fronted/     # SPA (React + Vite)
└── README.md
```

---

## Стек технологий

### Backend (`/backend`)

| Блок | Технология | Описание |
|------|------------|----------|
| **Runtime** | Node.js 18+ | Среда выполнения |
| **Язык** | TypeScript 5.x | Статическая типизация |
| **Фреймворк** | Express.js 4.x | HTTP-сервер и роутинг |
| **ORM** | Prisma 5.x | Работа с БД, миграции |
| **База данных** | PostgreSQL | Реляционная СУБД |
| **Аутентификация** | JWT (jsonwebtoken) | Токены для artist и guest |
| **Пароли** | bcryptjs | Хеширование паролей |
| **Валидация** | express-validator | Валидация тела запросов |
| **Загрузка файлов** | multer | Multer (в зависимостях) |
| **Разработка** | nodemon, tsx | Hot reload, запуск TS |

### Frontend (`/fronted`)

| Блок | Технология | Описание |
|------|------------|----------|
| **Фреймворк** | React 19.x | UI-библиотека |
| **Сборщик** | Vite 7.x | Сборка и dev-сервер |
| **Маршрутизация** | React Router DOM 7.x | SPA-роутинг |
| **Язык** | TypeScript 5.x | Статическая типизация |
| **Стили** | CSS (CSS Variables) | Светлая/тёмная тема |
| **Lint** | ESLint 9.x | Проверка кода |

---

## Архитектура Backend

```
backend/src/
├── app.ts              # Точка входа, Express app
├── config/
│   ├── database.ts     # Prisma Client
│   └── jwt.ts          # Настройки JWT
├── controllers/        # Обработчики HTTP
├── services/           # Бизнес-логика
├── routes/             # Роуты API
├── middleware/         # auth, валидация
└── types/              # TypeScript-типы
```

### Модели (Prisma)

- **Artist** — художник (профиль, аватар, биография)
- **Guest** — гость (регистрация на выставки)
- **Painting** — картина (автор, жанр, стоимость)
- **Genre** — жанр
- **Exhibition** — выставка
- **ArtistGenre**, **PaintingExhibition**, **ExhibitionGuest** — связующие таблицы

---

## Запуск

### Backend

```bash
cd backend
npm install
cp .env.example .env   # заполнить DATABASE_URL, JWT_SECRET
npx prisma migrate dev
npm run dev
```

Сервер: `http://localhost:3000`

### Frontend

```bash
cd fronted
npm install
npm run dev
```

Приложение: `http://localhost:5173`

---

## API (основные эндпоинты)

| Метод | Путь | Описание |
|-------|------|----------|
| POST | /api/auth/register/artist | Регистрация художника |
| POST | /api/auth/register/guest | Регистрация гостя |
| POST | /api/auth/login | Вход |
| GET | /api/auth/me | Текущий пользователь |
| GET | /backend/artists | Список художников |
| GET | /backend/paintings | Список картин |
| GET | /backend/genres | Список жанров |
| GET | /backend/exhibitions | Список выставок |
| GET | /backend/guests | Список гостей |
| GET | /health | Проверка работоспособности |

---

## Требования

- Node.js 18+
- PostgreSQL 12+
- npm или yarn
