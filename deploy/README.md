# Деплой Art Gallery

Схема одинакова для Windows-ПК и для ВМ: наружу смотрит **только порт 80** (reverse proxy),
он отдаёт собранный фронт и проксирует `/api/*` на Nest (`127.0.0.1:5000`), снимая префикс `/api`.
Фронт и API на одном origin → CORS не нужен, cookie с токенами работают.

```
Интернет → роутер (проброс 80 → ПК:80) → Caddy/nginx :80 ─┬─ /api/*  → Nest :5000 → PostgreSQL :5432
                                                          └─ /*      → frontend/dist (SPA)
```

Файлы в этой папке:

| Файл | Назначение |
|------|-----------|
| `Caddyfile` | reverse proxy + SPA для Windows/Linux без Docker (рекомендуется: один exe) |
| `nginx.conf` | то же самое на nginx для Windows, если Caddy не подходит |
| `ecosystem.config.cjs` | PM2: запуск/автоперезапуск Nest-сервера |
| `docker-compose.yml` + `.env.example` | вариант для ВМ: Postgres + API + nginx в контейнерах |
| `windows/firewall.ps1` | открыть 80 порт в брандмауэре |
| `windows/update.ps1` | обновление: `git pull` → сборка → `pm2 restart` |

---

## Вариант A — Windows-ПК (без Docker)

### 1. Установить

- **Node.js 22 LTS** — https://nodejs.org
- **PostgreSQL 16** — https://www.postgresql.org/download/windows/ (запомнить пароль `postgres`)
- **Caddy** — https://caddyserver.com/download (один `caddy.exe`, положить например в `C:\gallery\caddy\`)
- **PM2**: `npm i -g pm2 pm2-windows-startup`
- **Git**

### 2. Клонировать

```powershell
mkdir C:\gallery; cd C:\gallery
git clone https://github.com/Saven0k/ArtGallary
```

Пути `C:\gallery\ArtGallary\...` используются в `Caddyfile` / `nginx.conf` — если каталог другой, поправьте там `root`.

### 3. База данных

В pgAdmin или psql:

```sql
CREATE DATABASE gallery;
```

Таблицы создаёт сам сервер при первом старте (`DB_SYNC=alter`).

### 4. Сервер

```powershell
cd C:\gallery\ArtGallary\server
copy .env.example .production.env
notepad .production.env
```

Обязательно заполнить:

| Переменная | Значение для http://<статический-ip> |
|-----------|------|
| `POSTGRES_PASSWORD` | пароль postgres |
| `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` | два разных случайных (см. комментарий в файле) |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | учётка администратора |
| `BASE_URL` | `http://<статический-ip>/api` — **внешний** адрес, он попадает в URL картинок |
| `STATIC_DIR` | `C:/gallery/uploads` (вне исходников) |
| `TRUST_PROXY` | `true` |
| `COOKIE_SECURE` | `false` — пока нет HTTPS, иначе логин не будет работать |
| `SWAGGER_ENABLED` | `false` |
| `SMTP_*` | если нужны письма с кодами |

Затем:

```powershell
npm install
npm run build
pm2 start ..\deploy\ecosystem.config.cjs
pm2 save
pm2-startup install        # автозапуск pm2 при входе в Windows
pm2 logs gallery-api       # убедиться, что "Server started on port 5000" и "Администратор создан"
```

Проверка: `curl http://localhost:5000/health`

Справочник стран/городов (один раз, ~10 минут, качает данные geonames):

```powershell
npm run seed:geonames:prod
```

### 5. Фронт

```powershell
cd C:\gallery\ArtGallary\frontend
npm install
npm run build
```

Сборка берёт `VITE_API_URL=/api` из `frontend/.env.production`. Результат — `frontend/dist`.

### 6. Reverse proxy (Caddy)

```powershell
cd C:\gallery\ArtGallary\deploy
C:\gallery\caddy\caddy.exe run --config Caddyfile
```

Проверка в браузере: `http://localhost/` и `http://localhost/api/health`.

Чтобы Caddy стартовал как служба — через [NSSM](https://nssm.cc/) или [WinSW](https://github.com/winsw/winsw):

```powershell
nssm install gallery-caddy C:\gallery\caddy\caddy.exe run --config C:\gallery\ArtGallary\deploy\Caddyfile
nssm start gallery-caddy
```

### 7. Сеть

- `deploy\windows\firewall.ps1` от администратора — открывает входящий TCP 80.
- На роутере: проброс внешнего порта 80 → `<ip ПК в LAN>:80`. Порты 5000 и 5432 **не** пробрасывать.
- Отключить спящий режим ПК (Параметры → Система → Питание).

Проверка снаружи: `http://<статический-ip>/` и `http://<статический-ip>/api/health`.

### 8. Обновление

```powershell
powershell -ExecutionPolicy Bypass -File C:\gallery\ArtGallary\deploy\windows\update.ps1
```

### Когда появится домен и HTTPS

1. DNS A-запись домена → статический IP, проброс 443 на роутере, открыть 443 в брандмауэре.
2. В `Caddyfile` заменить `:80` на `gallery.example.com` — Caddy сам получит сертификат.
3. В `server/.production.env`: `COOKIE_SECURE=true`, `BASE_URL=https://gallery.example.com/api`, затем `pm2 restart gallery-api --update-env`.

---

## Вариант B — ВМ с Docker

```bash
git clone https://github.com/Saven0k/ArtGallary && cd ArtGallary
cp server/.env.example server/.production.env    # заполнить: секреты, ADMIN_*, BASE_URL=http://<ip-вм>/api, COOKIE_SECURE=false
cp deploy/.env.example deploy/.env               # POSTGRES_PASSWORD такой же, как в .production.env
docker compose -f deploy/docker-compose.yml up -d --build
docker compose -f deploy/docker-compose.yml logs -f server
```

`POSTGRES_HOST`, `STATIC_DIR`, `TRUST_PROXY` для контейнера compose задаёт сам. Загрузки и БД лежат в volumes `uploads`, `pgdata`.

Сидер geonames (образ сервера без dev-зависимостей, поэтому запускается с хоста, где есть Node):

```bash
cd server && npm ci && POSTGRES_HOST=127.0.0.1 NODE_ENV=production npm run seed:geonames:prod
```

Обновление: `git pull && docker compose -f deploy/docker-compose.yml up -d --build`.

---

## Частые проблемы

| Симптом | Причина |
|--------|---------|
| Логин «проходит», но пользователь не залогинен | `COOKIE_SECURE=true` при работе по http. Поставить `false`. |
| Картинки не открываются / ссылки на `localhost:5000` | `BASE_URL` не внешний. Старые записи в БД хранят абсолютный URL — после смены `BASE_URL` их надо перезалить или обновить в БД (`UPDATE arts SET image_path = replace(image_path, 'http://localhost:5000', 'http://<ip>/api');` и аналогично `author_profiles.avatar_path`, `events.image`). |
| 502 на `/api/*` | Nest не запущен: `pm2 logs gallery-api`. |
| `ADMIN_PASSWORD must be set` | Не найден `.production.env` или pm2 запущен не из `server/` (cwd задаёт `ecosystem.config.cjs`). |
| Сервер стартует, но «Таблица стран пуста» | Запустить `npm run seed:geonames:prod`. |

## Оплата подписок через ЮKassa

В `server/.production.env` задайте `YOOKASSA_SHOP_ID`, `YOOKASSA_SECRET_KEY` и `YOOKASSA_RETURN_URL=https://ваш-домен/profile?section=tariff`. Секретный ключ используется только сервером. Платёж подтверждается после проверки статуса, суммы, валюты и принадлежности через API провайдера. Без настроек оплата вернёт понятную ошибку; подписки не активируются автоматически.

Используйте тестовый магазин ЮKassa для проверки интеграции. Документация: [сценарий оплаты](https://yookassa.ru/developers/payment-acceptance/getting-started/payment-process), [аутентификация и идемпотентность](https://yookassa.ru/developers/using-api/interaction-format).
