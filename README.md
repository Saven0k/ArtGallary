# GalleryTema

Галерея произведений искусства с каталогом, профилями авторов, модерацией, корзиной и подписками.

## Структура

- `frontend/` — React 19, TypeScript, Vite, SCSS.
- `server/` — NestJS 11, Sequelize, PostgreSQL.
- `deploy/` — Docker, nginx/Caddy и обновление на Windows.

## Локальный запуск

Нужны Node.js 22 и PostgreSQL. Команды выполняются из соответствующего каталога.

1. Скопируйте `server/.env.example` в `server/.development.env` и заполните настройки БД, JWT, администратора и почты.
2. Создайте базу `gallery` или укажите существующую в `POSTGRES_DB`.
3. В `server/`: `npm ci`, затем `npm run start:dev`.
4. В `frontend/`: `npm ci`, затем `npm run dev`.

Фронтенд: http://localhost:5173. API: http://localhost:5000. Проверка API: `GET /health`.
Swagger доступен на `/api/docs`, когда `SWAGGER_ENABLED=true`.
Справочник стран и городов заполняется командой `npm run seed:geonames` в `server/`.

Для контейнера разработки: `docker compose --env-file .development.env -f docker-compose.yml up --build` из `server/`.
PostgreSQL в этой конфигурации доступен на хосте через порт 5433.

## Проверки

- `frontend/`: `npm run build`, `npm run lint`, `node --test src/__tests__/api.test.cjs`.
- `server/`: `npm run build`, `npm run lint:check`, `npm test -- --runInBand`, `npm run test:e2e -- --runInBand`.
- Windows: `powershell -NoProfile -ExecutionPolicy Bypass -File deploy/windows/update.tests.ps1`.

## Оплата подписок

Подписки и оплата пока не подключены. Настройки ЮKassa можно оставить пустыми.
Когда потребуется подключение, задайте `YOOKASSA_SHOP_ID`, `YOOKASSA_SECRET_KEY` и `YOOKASSA_RETURN_URL` в окружении сервера.
Адрес возврата указывает на фронтенд: `https://ваш-домен/profile?section=tariff`.
Ключ магазина хранится только на сервере. После возврата с оплаты сервер проверяет платёж через API ЮKassa;
данные об успешной оплате, сумма и валюта из браузера не подтверждают покупку.
При отсутствии настройки провайдера покупка недоступна, бесплатный тариф и остальные функции сохраняются.
Для тестового магазина в production дополнительно нужен `YOOKASSA_ALLOW_TEST_PAYMENTS=true`.

## Деплой

Инструкция и настройки reverse proxy: [deploy/README.md](deploy/README.md).
В production загрузки размещаются вне исходников, `BASE_URL` должен соответствовать внешнему адресу API.
Для сохранения состава и цены заказов добавлен столбец `cart_history.pricing`. При `DB_SYNC=false`
перед запуском примените [deploy/sql/20261008-cart-history-pricing.sql](deploy/sql/20261008-cart-history-pricing.sql).
