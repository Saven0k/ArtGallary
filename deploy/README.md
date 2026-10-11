# Запуск Art Gallery на домашнем Windows-ПК

Сайт запускается в production: Caddy отдаёт собранный фронт и проксирует `/api/*` на Nest. API слушает `127.0.0.1:5000`, PostgreSQL остаётся локальным. В интернет открываются только TCP 80 и 443.

Бесплатный локальный перевод текстов RU/EN/ZH настраивается по [инструкции перевода](../TRANSLATION.md). Ollama запускается отдельно в Docker; его порт в интернет не открывается.

Telegram-бот для администраторов и модераторов, создание через BotFather и бесплатный прокси описаны в [TELEGRAM.md](../TELEGRAM.md). Перед включением бота выполни `telegram:migrate` с `NODE_ENV=production`; используй один экземпляр API с одним токеном.

## 1. Проверить внешний IP

Открой настройки роутера и найди **WAN IPv4 / Internet IP**. Сравни его с внешним IPv4, который показывает сайт проверки IP.

Если WAN находится в диапазонах `10.*`, `192.168.*`, `172.16.*–172.31.*`, `100.64.*–100.127.*` или отличается от внешнего адреса, прямой проброс может не работать: это NAT провайдера или ещё один роутер. Уточни у провайдера: «Нужен публичный белый IPv4 с входящими TCP 80 и 443 для своего сайта». При двух домашних роутерах нужен проброс на обоих или режим моста.

Динамический **белый** IP тоже подходит, но для постоянного адреса нужен DDNS. DDNS не устраняет NAT провайдера. [Разница публичного и частного IP](https://help.keenetic.com/hc/en-us/articles/213965789-What-is-the-difference-between-a-public-and-private-IP-address-).

## 2. Установить инструменты

На этом ПК Node.js, PostgreSQL, PM2 и Caddy уже подготовлены. Шаги установки ниже нужны для другого ПК. На другом ПК также создай БД `gallery` или восстанови её резервную копию.

Поставь PM2:

```powershell
npm install -g pm2
```

Скачай Windows x64 архив Caddy с [официальной страницы](https://caddyserver.com/docs/install), распакуй `caddy.exe` в `deploy/bin/caddy.exe`. Можно вместо этого добавить Caddy в PATH.

Команды ниже выполняются из корня проекта в PowerShell. Если Windows блокирует локальные скрипты, запускай их через `powershell.exe -NoProfile -ExecutionPolicy Bypass -File <путь>`.

## 3. Подготовить и собрать

```powershell
Set-Location server
npm ci
npm run build
Set-Location ../frontend
npm ci
npm run build
Set-Location ..
node deploy/windows/prepare.cjs
```

Подготовка создаёт приватный `server/.production.env`, переносит настройки локальной БД и SMTP, создаёт отдельные JWT-секреты, сохраняет существующие VAPID-ключи или генерирует новые. Файлы из текущего STATIC_DIR копируются в `data/uploads`; оригиналы сохраняются, существующие файлы назначения не перезаписываются.

Повторный запуск подготовки сохраняет production-настройки и загрузки. `data/`, `deploy/bin/` и env-файлы исключены из Git.

Открой `server/.production.env` и проверь:

- `POSTGRES_*` — подключение к существующей локальной БД.
- `ADMIN_EMAIL`, `ADMIN_PASSWORD` — используются для создания администратора, если такого email ещё нет. Пароль существующего аккаунта не меняется.
- `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, `VAPID_SUBJECT` — свои данные для уведомлений. В production файл `dev.env` не загружается.
- `FRONTEND_URL='http://localhost'` — пока оставь для локальной проверки.
- `DB_SYNC='false'`, `BASE_URL='/api'`, `STATIC_DIR='../data/uploads'` — оставь такими.

У текущей БД необходимые изменения уже применены. Для перенесённой старой БД после резервного копирования примени файлы из `deploy/sql/` по порядку. Для совершенно новой пустой БД один раз поставь `DB_SYNC='create'`, запусти сервер, дождись создания таблиц и сразу верни `DB_SYNC='false'`. `alter` при каждом запуске не нужен.

Старые локальные ссылки на загруженные картинки исправляются при выдаче API; переписывать БД для смены адреса не требуется.

## 4. Проверить дома

Останови ранее запущенный dev-сервер на порту 5000. PostgreSQL должен работать.

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File deploy/windows/start.ps1
pm2 status
curl.exe http://localhost/api/health
```

Открой [сайт на этом ПК](http://localhost). `start.ps1` запускает API и Caddy, сохраняет процессы в PM2. PM2 перезапускает их при аварийном завершении. Логи: `pm2 logs gallery-api`, `pm2 logs gallery-web`, файлы `server/logs/`.

Если PM2 сообщает `connect EPERM \\.\pipe\rpc.sock`, не запускай несколько демонов от разных пользователей или с разными правами. Управляй им из того же пользователя и с тем же уровнем прав, с которыми он был запущен. Для проверки сайта без PM2 выполни `powershell.exe -NoProfile -ExecutionPolicy Bypass -File deploy/windows/start.ps1 -Foreground`: окно нужно оставить открытым, остановка — Ctrl+C, автоматического перезапуска в этом режиме нет. Логи API — `server/logs/foreground-*.log`. [Известное ограничение PM2 на Windows](https://github.com/Unitech/pm2/issues/5510).

Для доступа с телефона в домашней Wi-Fi сети открой `http://<локальный-IP-ПК>`. Если соединение блокируется, выполни из PowerShell **от администратора**:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File deploy/windows/firewall.ps1
```

Скрипт открывает только TCP 80 и 443; повторный запуск не создаёт дубликаты правил.

## 5. Подключить интернет и HTTPS

Закрепи за ПК постоянный локальный адрес в DHCP роутера, например `192.168.1.50`. Добавь проброс:

| Внешний порт | Протокол | IP назначения | Порт назначения |
| --- | --- | --- | --- |
| 80 | TCP | локальный IP ПК | 80 |
| 443 | TCP | локальный IP ПК | 443 |

Порты 5000, 5173 и 5432 на роутере не открывай. DMZ и UPnP для этого не нужны.

Заведи домен или DDNS-имя. DNS A-запись должна указывать на белый внешний IPv4. AAAA добавляй только при настроенном доступном IPv6.

В `server/.production.env` замени:

```dotenv
FRONTEND_URL='https://твой-домен'
CORS_ORIGINS='https://твой-домен'
COOKIE_SECURE='true'
```

Затем повтори `start.ps1`. Caddy возьмёт домен из FRONTEND_URL и автоматически получит и продлит HTTPS-сертификат. Secure-cookie переключается по протоколу FRONTEND_URL. Для выпуска сертификата домен должен вести на ПК, а входящие 80/443 быть доступны. [Официальная инструкция Caddy](https://caddyserver.com/docs/quick-starts/https).

После этого проверяй сайт **с мобильного интернета**, отключив Wi-Fi: домашний роутер может не поддерживать обращение к своему внешнему адресу из LAN. Проверь вход, картинки и уведомления. Браузерные push работают на localhost и через HTTPS. HTTP по IP оставь для диагностики; для постоянного доступа к аккаунтам используй HTTPS.

При белом IP без домена можно временно поставить `FRONTEND_URL='http://<внешний-IP>'`, `CORS_ORIGINS` с тем же адресом и `COOKIE_SECURE='false'`, затем повторить запуск.

## 6. Автозапуск, обновления, резервная копия

Отключи сон и гибернацию ПК, оставь питание и интернет. В службах Windows у PostgreSQL должен быть автоматический запуск.

В «Планировщике заданий» создай задачу от **того же Windows-пользователя**, который запускал PM2: триггер «При входе в систему», программа `powershell.exe`, аргументы:

```text
-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File "C:\Users\Savenok\Projects\GallaryTema\deploy\windows\start.ps1"
```

Это автозапуск **после входа пользователя**, не до него. Для круглосуточной работы после перезагрузки без входа потребуется отдельная настройка Windows-служб. [Варианты службы Caddy](https://caddyserver.com/docs/running).

Обновление кода и сборок:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File deploy/windows/update.ps1
pm2 save
```

Если обновление содержит SQL, предварительно сделай резервную копию и применяй изменения схемы по инструкции обновления. Скрипт останавливается при ошибке; старые процессы продолжают работать до успешной сборки.

Перед обновлениями сохраняй БД и папку `data/uploads` на другой диск. Пример для установленного на этом ПК PostgreSQL 17:

```powershell
New-Item -ItemType Directory -Force data/backups
& "C:\Program Files\PostgreSQL\17\bin\pg_dump.exe" -h localhost -U postgres -d gallery -Fc -f data/backups/gallery.dump
Copy-Item -LiteralPath data/uploads -Destination data/backups/uploads -Recurse
```

Пользователь/имя БД должны соответствовать production-настройкам. Пароль вводится в запросе pg_dump. Храни также приватный `.production.env` и VAPID-ключи. Повторную копию загрузок делай в новую датированную папку.

Остановка: `pm2 stop gallery-api gallery-web`. Дополнительная настройка уведомлений: [NOTIFICATIONS.md](NOTIFICATIONS.md). Docker-вариант сохранён в `deploy/docker-compose.yml`; перед запуском подготовь production env и `deploy/.env` по образцу, затем `docker compose --env-file deploy/.env -f deploy/docker-compose.yml up -d --build`.
