# Ubuntu / Coolify

Use branch `main`, Docker Compose build pack, root `/`, Compose file `/compose.coolify.yaml`.
This deployment uses its own PostgreSQL, API and uploads; it does not use a Windows database.

Set these private environment variables in Coolify before deploying:

- `POSTGRES_PASSWORD`: generated database password.
- `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`: two different random secrets, at least 32 characters each.
- `ADMIN_PASSWORD`: generated password for the first site administrator.
- `ADMIN_EMAIL`: defaults to `romasav2017@gmail.com`.
- `FRONTEND_URL`, `CORS_ORIGINS`: initially `http://192.168.1.97:3101`.
- `COOKIE_SECURE`: initially `false`; use `true` after HTTPS is connected.

Passwords and keys stay in Coolify; do not commit an env file.
Changing POSTGRES_PASSWORD on an existing database volume does not change its database password.

Local endpoints:

- Website: `http://192.168.1.97:3101`.
- Separate API: `http://192.168.1.97:3102/health`.
- Website API proxy: `http://192.168.1.97:3101/api/health`.
- Database: internal `db:5432`, database/user `gallery`; no published database port.

Only TCP 80 and 443 need router forwarding to Ubuntu after the domain reverse proxy is configured.
Ports 3101/3102 are for home-network access; do not open the administration panel or database on the router.

## Database deployment

The API entrypoint takes a PostgreSQL advisory lock. For an entirely empty database it creates the current model tables without ALTER or DROP.
It then applies `deploy/sql/*.sql` in filename order, one transaction per file, with name and SHA256 saved in `_schema_migrations`.
An error prevents the API from serving. A missing or edited applied migration also stops deployment.
Existing BEGIN/COMMIT wrappers are unwrapped so the SQL and ledger insert commit atomically.
Once initialized, API startup always uses `DB_SYNC=false`.

Future schema changes require a new dated SQL file, for example `20261016-add-example.sql`.
Never edit/delete an applied migration or rely on changing a Sequelize model alone.
Use compatible additive migrations for automatic deployment; destructive changes need a separate reviewed migration and a tested backup.
The external update script is responsible for the pre-deployment backup.

An interrupted initial model creation can leave a partial schema. Bootstrap refuses to guess how to repair an existing schema; inspect logs and restore or repair that database explicitly.

## Countries and cities

The runtime image includes the existing compiled GeoNames seeder and its adm-zip dependency.
After the first successful deployment, run once from the Coolify API terminal:

```sh
node dist/location/seeders/geonames.seeder.js
```

This downloads large public GeoNames archives and may take significant time and disk space.
It upserts geography rather than deleting user data. Do not run multiple seeders at once.
Verify `/api/location/countries` and `/api/location/cities/search?q=Moscow` afterwards.

## Gmail: почта галереи

В Compose подготовлен отправитель **Tilinin’s Gallery <tilininsgallery@gmail.com>**.
Используется `smtp.gmail.com:587` с STARTTLS. Для отправки нужен пароль приложения Google.

1. Войдите в Google под `tilininsgallery@gmail.com` и включите двухэтапную аутентификацию.
2. Откройте [пароли приложений Google](https://myaccount.google.com/apppasswords), создайте пароль для `Tilinin’s Gallery`.
   [Инструкция Google](https://support.google.com/accounts/answer/185833?hl=ru) описывает требования и случаи, когда этот раздел недоступен.
3. В Coolify откройте приложение → **Environment Variables** и заполните переменные окружения работающего контейнера:

   ```dotenv
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=tilininsgallery@gmail.com
   SMTP_PASS=
   SMTP_FROM="Tilinin’s Gallery <tilininsgallery@gmail.com>"
   FRONTEND_URL=https://artgallary.178-64-25-131.sslip.io
   ```

   В `SMTP_PASS` вставьте созданный пароль приложения без пробелов. В репозиторий пароль не сохраняйте.
   `FRONTEND_URL` должен совпадать с актуальным публичным адресом сайта: он используется в ссылках внутри писем.
   Остальные существующие переменные приложения сохраните.
4. Сохраните переменные и выполните **Redeploy** с обновлённым Compose из ветки `main`.
   После следующих изменений только SMTP-переменных достаточно пересоздания контейнера через Restart в Coolify.

Пока `SMTP_PASS` пустой, сервис сообщает, что почта не подключена. Пароль Google-аккаунта для SMTP не используется.

### Пробное письмо

После настройки откройте Terminal компонента **server** в Coolify. Следующая команда отправит одно пробное письмо
на согласованный адрес `tilininsgallery@gmail.com`, не раскрывая пароль:

```sh
node -e 'const n=require("nodemailer"); const p=Number(process.env.SMTP_PORT||587); const t=n.createTransport({host:process.env.SMTP_HOST,port:p,secure:p===465,requireTLS:p!==465,connectionTimeout:5000,socketTimeout:10000,auth:{user:process.env.SMTP_USER,pass:process.env.SMTP_PASS}}); t.sendMail({from:process.env.SMTP_FROM||process.env.SMTP_USER,to:"tilininsgallery@gmail.com",subject:"Tilinin’s Gallery — проверка почты",text:"Проверка отправки писем галереи через Gmail."}).then(()=>console.log("Почтовый сервер принял пробное письмо. Проверьте входящие и спам.")).catch(e=>{console.error("SMTP test failed:",e.code||"unknown");process.exitCode=1})'
```

Успешный ответ SMTP означает принятие письма сервером; проверьте его получение во входящих или спаме.
Уведомления о событиях отправляются пользователям, включившим email-уведомления в настройках сайта.
Встроенная кнопка пробного email отправляет письмо на адрес текущего аккаунта сайта.

Настройка выполнена по [документации Gmail](https://support.google.com/mail/answer/7104828?hl=en)
и [переменных окружения Coolify](https://coolify.io/docs/applications/configuration/environment-variables).

## Logs and checks

API file logs persist in `server-logs` at `/app/logs/app.log` and `/app/logs/error.log`, with size rotation.
Console logs also go to the Ubuntu journal with tags `artgallary-api`, `artgallary-db`, `artgallary-web`:

```sh
sudo journalctl -f -t artgallary-api -t artgallary-db -t artgallary-web
```

Check the three containers are healthy, website and both health URLs return 200, administrator login works,
and the database contains the administrator with role admin. The health URL itself does not issue a database query.
Translation/Ollama, Telegram, push and payments are not configured by this Compose file.
SMTP defaults to the gallery Gmail account and becomes available after setting `SMTP_PASS` as described above.
