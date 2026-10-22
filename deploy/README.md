# Запуск Art Gallery на домашнем Windows-ПК

Инструкция рассчитана на другой ПК с Windows 11 x64. Сайт запускается в production: Caddy отдаёт собранный фронт и проксирует `/api/*` на Nest. API слушает `127.0.0.1:5000`, PostgreSQL установлен в Windows, PM2 следит за процессами. В Docker работает локальный переводчик. В интернет открываются только TCP 80 и 443.

Сначала проверь сайт на самом ПК, затем подключи переводы и уведомления, после этого — интернет и HTTPS. На примере ниже проект находится в `C:\Projects\ArtGallery`. Команды выполняются в PowerShell; `npm.cmd` и `pm2.cmd` обходят блокировку PowerShell-скриптов политикой выполнения.

Для передачи запуска другому Codex используй [CODEX-START.md](CODEX-START.md): там описан запуск с новой БД без переноса старого контента, порядок действий и проверки результата.

Бесплатный локальный перевод текстов RU/EN/ZH настраивается по [инструкции перевода](../TRANSLATION.md). Ollama запускается отдельно в Docker; его порт в интернет не открывается.

Telegram-бот для администраторов и модераторов, создание через BotFather и бесплатный прокси описаны в [TELEGRAM.md](../TELEGRAM.md). Перед включением бота выполни `telegram:migrate` с `NODE_ENV=production`; используй один экземпляр API с одним токеном.

## 1. Проверить внешний IP

Открой настройки роутера и найди **WAN IPv4 / Internet IP**. Сравни его с внешним IPv4, который показывает сайт проверки IP.

Если WAN находится в диапазонах `10.*`, `192.168.*`, `172.16.*–172.31.*`, `100.64.*–100.127.*` или отличается от внешнего адреса, прямой проброс может не работать: это NAT провайдера или ещё один роутер. Уточни у провайдера: «Нужен публичный белый IPv4 с входящими TCP 80 и 443 для своего сайта». При двух домашних роутерах нужен проброс на обоих или режим моста.

Динамический **белый** IP тоже подходит, но для постоянного адреса нужен DDNS. DDNS не устраняет NAT провайдера. [Разница публичного и частного IP](https://help.keenetic.com/hc/en-us/articles/213965789-What-is-the-difference-between-a-public-and-private-IP-address-).

## 2. Установить инструменты

### Что скачать

| Программа | Официальная загрузка | Что выбрать |
| --- | --- | --- |
| Git for Windows | [git-scm.com](https://git-scm.com/install/windows) | x64 Setup; доступ к Git из командной строки. |
| Node.js | [Node.js 22 LTS](https://nodejs.org/en/download/archive/v22.23.0) | Windows x64 Installer `.msi`, актуальный патч ветки 22. npm входит в установщик. |
| PostgreSQL 17 | [postgresql.org](https://www.postgresql.org/download/windows/) | Установщик EDB 17.x x64: Server, pgAdmin, Command Line Tools. |
| Caddy | [caddyserver.com](https://caddyserver.com/download) | Windows amd64, стандартная сборка. |
| Docker Desktop | [Установка Windows](https://docs.docker.com/desktop/setup/install/windows-install/) | x86_64, WSL 2, Linux containers — для перевода. |
| VS Code | [code.visualstudio.com](https://code.visualstudio.com/Download) | Необязателен для запуска; удобен для кода и env. |
| Psiphon | [psiphon.ca](https://psiphon.ca/en/download.html) | Необязателен: Windows Legacy, если Telegram API не работает напрямую. |

Для 16 ГБ RAM и GTX 1050 Ti начни с CPU-варианта перевода. Желательно SSD и хотя бы 30 ГБ свободного места под инструменты, Docker и модель, плюс место для БД, загруженных картинок и резервных копий. Docker Desktop бесплатен для личного использования по [условиям Docker](https://docs.docker.com/subscription-billing/desktop-license/).

### Node, Git и PM2

Установи Node и Git, открой новое окно PowerShell и проверь:

```powershell
node --version
npm.cmd --version
git --version
```

Node должен показывать `v22.*`. Если команда не найдена, перезапусти терминал после установки и проверь PATH.

Поставь PM2:

```powershell
npm.cmd install -g pm2
pm2.cmd --version
```

### PostgreSQL

При установке PostgreSQL оставь порт `5432`, задай и сохрани пароль пользователя `postgres`. Stack Builder не нужен. В `services.msc` найди службу PostgreSQL: состояние «Выполняется», запуск «Автоматически». Пароль pgAdmin для сохранённых подключений, если запрашивается, отличается по назначению от пароля пользователя PostgreSQL.

### Docker и WSL

Для переводчика включи Intel VT-x / AMD-V в BIOS/UEFI. Если WSL ещё не установлен, выполни из PowerShell от администратора:

```powershell
wsl --install --no-distribution
```

Перезагрузи ПК, затем выполни `wsl --update`. Установи и запусти Docker Desktop, выбери WSL 2 engine и Linux containers. Проверь `docker version` и `docker compose version`: должна отвечать и часть Server. [Инструкция WSL](https://learn.microsoft.com/en-us/windows/wsl/install), [требования Docker](https://docs.docker.com/desktop/setup/install/windows-install/).

Отдельный Ollama для Windows устанавливать не требуется: он запускается в контейнере.

### Получить проект и Caddy

```powershell
New-Item -ItemType Directory -Force C:\Projects
Set-Location C:\Projects
git clone https://github.com/Saven0k/ArtGallary.git ArtGallery
Set-Location C:\Projects\ArtGallery
New-Item -ItemType Directory -Force .\deploy\bin
```

Помести скачанный Caddy в `deploy/bin/caddy.exe`. Если файл называется `caddy_windows_amd64.exe`, переименуй его в `caddy.exe`. Проверь `.\deploy\bin\caddy.exe version`. Не размещай рабочий сервер в Downloads, OneDrive или временной папке.

Команды ниже выполняются из корня проекта в PowerShell. Если Windows блокирует локальные скрипты, запускай их через `powershell.exe -NoProfile -ExecutionPolicy Bypass -File <путь>`.

## 3. Подготовить и собрать

### Перенести существующий сайт

Git переносит код. Пользователи, авторы, арты, события, переводы и привязки Telegram находятся в PostgreSQL. Картинки и приватные env в Git не входят. Для переноса нужны **дамп БД, файлы загрузок и конфиг**.

На старом ПК останови API на время финального переноса, чтобы новые изменения не появлялись между копированием БД и картинок. При запуске через PM2: `pm2.cmd stop gallery-api gallery-web`; dev/Foreground останови через Ctrl+C. PostgreSQL оставь работающим.

Из корня старого проекта:

```powershell
New-Item -ItemType Directory -Force .\data\backups
& 'C:\Program Files\PostgreSQL\17\bin\pg_dump.exe' -h 127.0.0.1 -p 5432 -U postgres -d gallery -Fc -f .\data\backups\gallery.dump
```

Имя БД, порт и пользователь должны совпадать со старым env. Пароль вводится в запросе, а не пишется в команду. Если команда завершилась с ошибкой, исправь её до переноса.

Перенеси на новый ПК:

- Дамп → `C:\Projects\ArtGallery\data\backups\gallery.dump`.
- Содержимое `data/uploads` или фактического старого STATIC_DIR, например `server/src/static`, → `C:\Projects\ArtGallery\data\uploads`. Не создавай лишнюю вложенность `uploads/uploads`.
- Приватный `server/.production.env` → такое же место в новом проекте. Если его нет, отдельно сохрани старые dev-настройки для ручного переноса SMTP и других параметров.

Создай новую пустую БД и восстанови её, находясь в корне нового проекта:

```powershell
& 'C:\Program Files\PostgreSQL\17\bin\createdb.exe' -h 127.0.0.1 -p 5432 -U postgres gallery
& 'C:\Program Files\PostgreSQL\17\bin\pg_restore.exe' -h 127.0.0.1 -p 5432 -U postgres -d gallery --no-owner --no-privileges --exit-on-error .\data\backups\gallery.dump
```

Если `gallery` уже существует, не удаляй её автоматически. Для повторной попытки после ошибки используй другую пустую БД, например `gallery_restore`, и укажи её в `-d` и POSTGRES_DB. Повторное восстановление поверх заполненной БД вызовет конфликты. [Документация pg_restore](https://www.postgresql.org/docs/17/app-pgrestore.html).

Путь PostgreSQL исправь, если он установлен в другое место. В перенесённом env сохрани JWT- и VAPID-ключи, но поправь пароль PostgreSQL на установленный на новом ПК. Для совершенно нового сайта вместо восстановления создай пустую БД и используй инструкцию ниже.

### Установить зависимости и собрать

```powershell
Set-Location server
npm.cmd ci
npm.cmd run build
Set-Location ../frontend
Set-Content -LiteralPath .env.production.local -Value 'VITE_API_URL=/api' -Encoding ascii
npm.cmd ci
npm.cmd run build
Set-Location ..
node deploy/windows/prepare.cjs
```

Подготовка создаёт приватный `server/.production.env`, переносит настройки локальной БД и SMTP, создаёт отдельные JWT-секреты, сохраняет существующие VAPID-ключи или генерирует новые. Файлы из текущего STATIC_DIR копируются в `data/uploads`; оригиналы сохраняются, существующие файлы назначения не перезаписываются.

Повторный запуск подготовки сохраняет production-настройки и загрузки. `data/`, `deploy/bin/` и env-файлы исключены из Git.

При ошибке любой команды остановись и исправь её до следующего шага. Для production фронту нужен `VITE_API_URL=/api`: иначе браузер посетителя будет обращаться к собственному localhost. Значение попадает в бандл при сборке; после его изменения фронт пересобирается.

Открой `server/.production.env` и проверь:

- `POSTGRES_*` — подключение к существующей локальной БД.
- `ADMIN_EMAIL`, `ADMIN_PASSWORD` — используются для создания администратора, если такого email ещё нет. Пароль существующего аккаунта не меняется.
- `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, `VAPID_SUBJECT` — свои данные для уведомлений. В production файл `dev.env` не загружается.
- `FRONTEND_URL='http://localhost'` — пока оставь для локальной проверки.
- `DB_SYNC='false'`, `BASE_URL='/api'`, `STATIC_DIR='../data/uploads'` — оставь такими.

Для первой локальной проверки также выставь `POSTGRES_HOST='127.0.0.1'`, `POSTGRES_PORT='5432'`, свой POSTGRES_PASSWORD, `POSTGRES_DB='gallery'`, `HTTP_HOST='127.0.0.1'`, `TRUST_PROXY='true'`, `CORS_ORIGINS='http://localhost'`, `COOKIE_SECURE='false'`, `TRANSLATION_ENABLED='false'`, `TELEGRAM_BOT_ENABLED='false'`. После настройки дополнительных сервисов включишь их отдельно. Ключи YooKassa пока можно оставить пустыми.

### Подготовить схему

Для восстановленной БД оставь DB_SYNC=false. Из корня проекта примени совместимые обновления:

```powershell
& 'C:\Program Files\PostgreSQL\17\bin\psql.exe' -h 127.0.0.1 -p 5432 -U postgres -d gallery -v ON_ERROR_STOP=1 -f .\deploy\sql\20261008-cart-history-pricing.sql
& 'C:\Program Files\PostgreSQL\17\bin\psql.exe' -h 127.0.0.1 -p 5432 -U postgres -d gallery -v ON_ERROR_STOP=1 -f .\deploy\sql\20261008-notification-delivery.sql
& 'C:\Program Files\PostgreSQL\17\bin\psql.exe' -h 127.0.0.1 -p 5432 -U postgres -d gallery -v ON_ERROR_STOP=1 -f .\deploy\sql\20261022-promo-codes.sql
```

Повторный запуск этих SQL на актуальной схеме предусмотрен. Если старая БД существенно отличается и SQL заканчивается ошибкой, не включай `alter` наугад.

Для совершенно нового пустого сайта временно поставь в `.production.env` `DB_SYNC='create'`, из папки `server` выполни `npm.cmd run start:prod`. Дождись запуска и создания администратора, затем Ctrl+C и верни `DB_SYNC='false'`. Из этой же папки заполни страны и города командой `npm.cmd run seed:geonames:prod`. Она скачивает крупные справочники GeoNames; нужны интернет, место и время. На восстановленной БД с готовой географией повторять сидер не требуется. Базовые стили, жанры и виды искусства создаются при старте; профессии проверь и заполни в админке.

В обоих случаях после создания основных таблиц из папки `server`:

```powershell
$env:NODE_ENV = 'production'
npm.cmd run translations:migrate
npm.cmd run telegram:migrate
Set-Location ..
```

Эти команды создают отдельные таблицы перевода и Telegram, если их ещё нет. Для новой БД ADMIN_EMAIL/ADMIN_PASSWORD из env задают первого администратора; для восстановленной существующего пользователя они не меняют.

Старые локальные ссылки на загруженные картинки исправляются при выдаче API; переписывать БД для смены адреса не требуется.

## 4. Проверить дома

Останови ранее запущенный dev-сервер на порту 5000. PostgreSQL должен работать.

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File deploy/windows/start.ps1
pm2.cmd status
curl.exe http://localhost/api/health
```

Открой [сайт на этом ПК](http://localhost). В PM2 должны быть `gallery-api` и `gallery-web` со статусом `online`; health должен отвечать HTTP 200. Проверь вход, авторов, арты, события и картинки. `start.ps1` запускает API и Caddy, сохраняет процессы в PM2. PM2 перезапускает их при аварийном завершении. Логи: `pm2.cmd logs gallery-api`, `pm2.cmd logs gallery-web`, файлы `server/logs/`. Vite на 5173 для production запускать не требуется.

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

## 6. Переводы, email, push и Telegram

### Локальный перевод

Запусти Docker Desktop. Из корня проекта:

```powershell
docker compose -f deploy/translation.compose.yml up -d
docker compose -f deploy/translation.compose.yml exec -T translator ollama pull translategemma:4b
docker compose -f deploy/translation.compose.yml exec -T translator ollama list
```

В `server/.production.env`:

```dotenv
TRANSLATION_ENABLED='true'
TRANSLATION_URL='http://127.0.0.1:11434'
TRANSLATION_MODEL='translategemma:4b'
```

До открытия посетителям прогрей переводы:

```powershell
Set-Location server
$env:NODE_ENV = 'production'
npm.cmd run translations:warm
Set-Location ..
powershell.exe -NoProfile -ExecutionPolicy Bypass -File deploy/windows/start.ps1
```

На CPU прогрев может занять длительное время. При сбое проверь Ollama, счётчик `unavailable` и повтори команду после восстановления связи. Модель хранится в Docker volume и скачивается один раз. Полная схема и ограничения — [TRANSLATION.md](../TRANSLATION.md).

### Email и push

Достаточно отдельного обычного ящика; свой почтовый сервер устанавливать не нужно. Пример для Gmail: включи двухэтапную аутентификацию и создай [пароль приложения](https://support.google.com/accounts/answer/185833?hl=ru). В `.production.env`:

```dotenv
SMTP_HOST='smtp.gmail.com'
SMTP_PORT='587'
SMTP_USER='твоя-почта@gmail.com'
SMTP_PASS='пароль-приложения'
SMTP_FROM='Art Gallery <твоя-почта@gmail.com>'
VAPID_SUBJECT='mailto:твоя-почта@gmail.com'
```

Для другого провайдера используй его SMTP-сервер, порт и разрешённого отправителя. Без SMTP в production не работают письма и действия, которым нужен email-код; обычный вход существующим паролем проверяется отдельно.

VAPID-ключи подготовка уже генерирует; при переносе сохраняй прежнюю пару. Пользователь включает уведомления в `/settings`. Проверь email и push кнопкой тестового уведомления. Push требует localhost или HTTPS; HTTP по LAN-IP для него не подходит. Дополнительные настройки — [NOTIFICATIONS.md](NOTIFICATIONS.md).

### Telegram

Создай бота через BotFather, затем в `.production.env`:

```dotenv
TELEGRAM_BOT_ENABLED='true'
TELEGRAM_BOT_TOKEN='токен-из-BotFather'
TELEGRAM_PROXY_URL=''
```

Если прямое подключение недоступно, настрой Psiphon с локальным HTTP-прокси и поставь `TELEGRAM_PROXY_URL='http://127.0.0.1:8080'`, используя фактически заданный порт. Прокси должен оставаться запущенным; полного VPN для всего ПК эта схема не требует.

После перезапуска войди под администратором/модератором, открой `/profile?section=settings`, подключи Telegram, перейди по ссылке и нажми Start. Старый бэкенд с этим токеном должен быть остановлен. Подробные настройки BotFather, Psiphon и модерации — [TELEGRAM.md](../TELEGRAM.md).

После любых изменений server env перезапускай через `start.ps1`, чтобы обновилось окружение PM2.

## 7. Автозапуск, обновления, резервная копия

Отключи сон и гибернацию ПК, оставь питание и интернет. В службах Windows у PostgreSQL должен быть автоматический запуск.

В «Планировщике заданий» создай задачу от **того же Windows-пользователя**, который запускал PM2: триггер «При входе в систему», программа `powershell.exe`, аргументы:

```text
-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File "C:\Projects\ArtGallery\deploy\windows\start.ps1"
```

Рабочая папка задачи: `C:\Projects\ArtGallery`. Можно добавить задержку 30 секунд после входа; не создавай параллельные экземпляры задачи. Уровень прав должен совпадать с первоначальным запуском PM2.

В Docker Desktop включи **Start Docker Desktop when you sign in to your computer**. Контейнер переводчика использует `restart: unless-stopped`; если ты сам остановил его, снова выполни `docker compose -f deploy/translation.compose.yml up -d`. [Настройки Docker](https://docs.docker.com/desktop/settings-and-maintenance/settings/). Если нужен Psiphon, добавь его в автозагрузку и проверь подключение после входа.

Это автозапуск **после входа пользователя**, не до него. После входа можно заблокировать экран через Win+L и оставить сервер работающим. Не используй выход из учётной записи как замену блокировке. Для автоматического восстановления после перезагрузки без входа потребуется отдельная схема Windows-служб и запуска переводчика/прокси; текущие скрипты её не настраивают. [Варианты службы Caddy](https://caddyserver.com/docs/running).

Проверь сценарий перезагрузки: войди в Windows, дождись готовности, проверь PM2, health, Docker и сайт с телефона. ПК и роутер должны оставаться включёнными. При пропадании питания сайт будет недоступен; ИБП и восстановление питания в BIOS помогут переживать такие события.

Обновление кода и сборок:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File deploy/windows/update.ps1
pm2.cmd save
```

Если обновление содержит SQL, предварительно сделай резервную копию и применяй изменения схемы по инструкции обновления. Скрипт останавливается при ошибке; старые процессы продолжают работать до успешной сборки.

Редактировать код можно в VS Code, но production использует `server/dist` и `frontend/dist`: сохранение исходника не публикует изменение. Для разработки используй другой checkout и отдельную БД, лучше на основном рабочем ПК. Не запускай `start:dev` на занятом порту 5000 или поверх production-БД. Перед `update.ps1` проверь `git status`: локальные изменения сначала нужно сохранить и согласовать с Git. RDP-порт 3389 на роутере для публикации сайта не нужен.

Перед обновлениями сохраняй БД и папку `data/uploads` на другой диск. Пример для установленного на этом ПК PostgreSQL 17:

```powershell
New-Item -ItemType Directory -Force data/backups
& "C:\Program Files\PostgreSQL\17\bin\pg_dump.exe" -h localhost -U postgres -d gallery -Fc -f data/backups/gallery.dump
Copy-Item -LiteralPath data/uploads -Destination data/backups/uploads -Recurse
```

Пользователь/имя БД должны соответствовать production-настройкам. Пароль вводится в запросе pg_dump. Храни также приватный `.production.env` и VAPID-ключи. Повторную копию загрузок делай в новую датированную папку.

Остановка: `pm2.cmd stop gallery-api gallery-web`; переводчик отдельно — `docker compose -f deploy/translation.compose.yml stop`. Просмотр логов `pm2.cmd logs` завершается Ctrl+C без остановки сайта. После переноса старый сервер с тем же токеном Telegram оставь остановленным.

Для согласованной резервной копии временно останови API, сохрани дамп и загрузки, затем запусти сайт снова. PostgreSQL оставь работающим. Дамп, файлы и приватный env храни хотя бы в одной копии на другом диске или устройстве; модель можно скачать заново, оригинальные пользовательские данные — нет.

### Если не запускается

| Симптом | Что проверить |
| --- | --- |
| `password authentication failed` | POSTGRES_USER/PASSWORD и правильную БД в `.production.env`. |
| `relation ... does not exist` | Восстановление, первый `DB_SYNC=create` и миграции. |
| Caddy отвечает 502 | `gallery-api`, логи API, PostgreSQL и порт 5000. |
| API обращается к localhost:5000 у посетителя | `VITE_API_URL=/api` и повторную сборку фронта. |
| Нет картинок | Фактическую папку uploads, STATIC_DIR и BASE_URL=/api. |
| Не работает с телефона по LAN-IP | LAN-IP сервера, общий Wi-Fi и firewall. |
| Не работает из интернета | Публичный IPv4, DNS, проброс, firewall и сон ПК. |
| Docker Server недоступен | Запуск Docker Desktop, WSL и виртуализацию. |
| После перезагрузки сайт недоступен | Вход в Windows, задачу запуска, PM2, PostgreSQL и Docker. |

Health подтверждает, что API отвечает; отдельный SQL-запрос к БД он не выполняет. Для проверки БД можно выполнить `psql.exe -h 127.0.0.1 -p 5432 -U postgres -d gallery -c "SELECT 1;"`, используя полный путь к psql из предыдущих примеров. Email, Telegram и модель проверяй отдельно. На новом ПК нужно проверить фактические пути установки; доступ из интернета зависит от его провайдера и роутера. Программы и локальный перевод бесплатны для такого личного запуска; публичный IP, домен, электричество и интернет могут стоить денег.

Docker-вариант всего сайта сохранён в `deploy/docker-compose.yml`; он использует отдельную контейнерную БД и загрузки. Не смешивай его с описанным Windows-вариантом. Перед Docker-запуском подготовь production env и `deploy/.env` по образцу, затем `docker compose --env-file deploy/.env -f deploy/docker-compose.yml up -d --build`.
