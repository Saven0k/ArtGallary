# Changes — подготовка к деплою

Дата: 2026-10-06. Цель: прод-деплой на Windows-ПК (позже — ВМ), статический IP, проброс портов.
Инструкция по развёртыванию — [deploy/README.md](deploy/README.md). Ничего не запускалось и не собиралось — только правки файлов.

## Что было не так (и что это ломало в проде)

| # | Проблема | Последствие |
|---|----------|-------------|
| 1 | `frontend/src/api/main.api.ts`: `BASE_URL_API = "http://localhost:5000"` захардкожен | Собранный фронт у всех пользователей стучался бы на их собственный localhost |
| 2 | `server/src/auth/auth.service.ts`: `secure: NODE_ENV === 'production'` без возможности отключить | По голому `http://<ip>` браузер не сохраняет secure-cookie → логин не работает |
| 3 | `server/package.json`: `"start": "cross-env NODE_ENV=production start"` | Скрипт неработоспособный; `start:prod` не выставлял `NODE_ENV` → грузился `.undefined.env` → падение на `ADMIN_PASSWORD must be set` |
| 4 | `ConfigModule` читает `.<NODE_ENV>.env` только при сборке модуля, а `PORT`, cookie-настройки и т.п. читаются раньше (при импорте файлов) | Значения из env-файла для них молча игнорировались |
| 5 | `pg` лежал в `devDependencies` | `npm ci --omit=dev` (Docker) → Sequelize не находит драйвер |
| 6 | Загрузки пишутся в `server/src/static`; путь вычислялся по-разному в `main.ts`, `app.module.ts`, `files.service.ts` | Пользовательские файлы внутри исходников; путь нельзя вынести |
| 7 | `sync: { alter: true }` всегда | ALTER TABLE на каждом старте в проде без возможности отключить |
| 8 | Swagger `/api/docs` всегда включён | Публичная документация API в проде |
| 9 | `server/.gitignore` игнорировал `Dockerfile`, `docker-compose.yml`, `.dockerignore` | Docker-конфиги нельзя закоммитить |
| 10 | `server/.development.env` с секретами закоммичен (хотя и в `.gitignore`) | Секреты в репозитории |
| 11 | Нет `trust proxy` | За Caddy/nginx `req.ip` (пишется в refresh-токены) всегда `127.0.0.1` |
| 12 | Сидер geonames читал только `.env`, а сервер — `.development.env` | Разные настройки БД у сидера и сервера |
| 13 | Нет health-эндпоинта | Нечем проверить деплой / healthcheck в pm2 и docker |

## Что изменено

### server/

- **`src/load-env.ts`** (новый) — грузит `.<NODE_ENV>.env`, затем `.env` до импорта `AppModule`; импортируется первой строкой в `src/main.ts`. Переменные окружения процесса (pm2/docker) имеют приоритет (№4).
- **`src/main.ts`**
  - `TRUST_PROXY=true` → `app.set('trust proxy', 1)` (№11);
  - `CORS_ORIGINS` — значения тримятся;
  - статика отдаётся из `STATIC_DIR`;
  - Swagger включается по `SWAGGER_ENABLED` (не задано → выключен в production) (№8).
- **`src/app.module.ts`**
  - `envFilePath: ['.<NODE_ENV>.env', '.env']` с fallback на `development`;
  - `ServeStaticModule` → `STATIC_DIR`;
  - `DB_SYNC=alter|create|false` вместо жёсткого `{ alter: true }` (№7);
  - зарегистрирован `HealthController`.
- **`src/shared/helpers/static-dir.helper.ts`** (новый) — единый `STATIC_DIR` (env `STATIC_DIR`, по умолчанию `src/static`, относительно `process.cwd()`). Используется в `main.ts`, `app.module.ts`, `files.service.ts` (№6).
- **`src/files/files.service.ts`** — запись и удаление файлов через `STATIC_DIR` (две строки).
- **`src/auth/auth.service.ts`** — флаг `COOKIE_SECURE` из env (не задано → `true` в production). Убрано дублирование опций cookie для accessToken (№2).
- **`src/health.controller.ts`** (новый) — `GET /health` → `{status:'ok', uptime, timestamp}`, скрыт из Swagger (№13).
- **`src/location/seeders/geonames.seeder.ts`** — читает `.<NODE_ENV>.env`, затем `.env` (№12).
- **`package.json`**
  - `start` и `start:prod` → `cross-env NODE_ENV=production node dist/main` (№3);
  - новые скрипты `seed:geonames`, `seed:geonames:prod`;
  - `pg` перенесён в `dependencies`, добавлен `dotenv` (№5).
- **`.env.example`** (новый) — все переменные с комментариями: какие значения для dev и для prod.
- **`Dockerfile`**, **`.dockerignore`** (новые) — multi-stage образ, `STATIC_DIR=/data/uploads`.
- **`.gitignore`** — больше не игнорирует Docker-файлы; `.env.example` явно разрешён (№9).

### frontend/

- **`src/api/main.api.ts`** — `BASE_URL_API` берётся из `import.meta.env.VITE_API_URL` (fallback `http://localhost:5000`), хвостовые `/` обрезаются (№1).
- **`src/vite-env.d.ts`** (новый) — типы для `VITE_API_URL`.
- **`.env.development`** — `VITE_API_URL=http://localhost:5000`; **`.env.production`** — `VITE_API_URL=/api`; **`.env.example`**.
- **`Dockerfile`**, **`nginx.conf`**, **`.dockerignore`** (новые) — образ фронта: nginx раздаёт SPA и проксирует `/api/*` → `server:5000`.

### deploy/ (новая папка)

- `Caddyfile` — reverse proxy для Windows/Linux: `:80`, `/api/*` → `127.0.0.1:5000` со снятием префикса, остальное — SPA из `frontend/dist`. Переход на домен/HTTPS — одна строка.
- `nginx.conf` — то же на nginx для Windows.
- `ecosystem.config.cjs` — PM2 для Nest (`cwd=server/`, `NODE_ENV=production`, 1 инстанс).
- `docker-compose.yml` + `.env.example` — Postgres 16 + server + web для ВМ; наружу только `:80`.
- `windows/firewall.ps1`, `windows/update.ps1` — брандмауэр и скрипт обновления.
- `README.md` — пошаговая инструкция для обоих вариантов и таблица частых проблем.

### Корень

- `README.md` — добавлена ссылка на деплой и уточнение актуального стека. Остальной текст README описывает старый Express+Prisma и папки `backend/`/`fronted/` — он устарел, не трогал.

## Схема прода

```
Интернет → роутер (проброс 80 → ПК:80) → Caddy :80 ─┬─ /api/*  → Nest 127.0.0.1:5000 → PostgreSQL
                                                    └─ /*      → frontend/dist (SPA)
```

Фронт и API на одном origin, поэтому CORS не нужен и cookie работают. Наружу открывается только 80 (позже 443).

## Осталось сделать вручную

1. **`cd server && npm install`** — `package.json` изменён (pg → dependencies, + dotenv), `package-lock.json` надо пересинхронизировать, иначе `npm ci` в Dockerfile и в `update.ps1` упадёт.
2. **Убрать `.development.env` из git** (файл остаётся на диске): `git rm --cached server/.development.env`. Секреты из него (`JWT_*`, `ADMIN_PASSWORD`) в проде использовать нельзя — они уже в истории репозитория.
3. **Проверить сборку**: `npm run build` в `server/` и `frontend/`, затем `npm run start:prod` в `server/`. В сервере 83 импорта вида `from 'src/...'` — `nest build` переписывает их в относительные через `baseUrl` в `tsconfig.json`, но запуск `dist/main` до деплоя нужно сделать хотя бы раз.
4. При смене `BASE_URL` уже загруженные картинки хранят старый абсолютный URL в БД — см. таблицу проблем в `deploy/README.md`.
5. Опционально: `server/.agnes/`, `check-issues.js`, `debug-app.js`, `fix-all.js`, `modelspm.md` — отладочный мусор, в проде не нужен. `react-native` и `expo-image-picker` в `frontend/package.json` нигде не импортируются — можно удалить, установка станет легче.

## Переменные окружения для прода (кратко)

```
NODE_ENV=production            # ставит pm2 / cross-env / docker, не файл
PORT=5000
POSTGRES_HOST/PORT/USER/PASSWORD/DB
DB_SYNC=alter
JWT_ACCESS_SECRET, JWT_REFRESH_SECRET   # разные, случайные
BASE_URL=http://<ip>/api       # внешний адрес, попадает в URL картинок
STATIC_DIR=C:/gallery/uploads  # вне исходников
TRUST_PROXY=true
COOKIE_SECURE=false            # пока http; true после HTTPS
SWAGGER_ENABLED=false
ADMIN_EMAIL, ADMIN_PASSWORD
SMTP_HOST/PORT/USER/PASS/FROM  # если нужны письма
```
