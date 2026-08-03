# GalleryTema Server

NestJS-сервер для платформы цифрового искусства и галереи.

## 🚀 Быстрый старт

```bash
npm install
npm run start:dev
```

Сервер запустится на порту `5000`. Swagger API доступен по адресу: http://localhost:5000/api/docs

## 📁 Структура проекта

```
server/
├── src/
│   ├── main.ts                    # Точка входа приложения
│   ├── app.module.ts              # Корневой модуль
│   ├── auth/                      # Аутентификация и авторизация
│   ├── users/                     # Пользователи
│   ├── artists/                   # Артисты и подписки
│   ├── arts/                      # Произведения искусства
│   ├── genres/                    # Жанры
│   ├── styles/                    # Стили
│   ├── art-types/                 # Типы артов
│   ├── tags/                      # Теги
│   ├── location/                  # География (страны, города)
│   ├── moderators/                # Модерация контента
│   ├── professions/               # Профессии
│   ├── files/                     # Работа с файлами
│   ├── password/                  # Восстановление пароля
│   ├── shared/                    # Общие хелперы
│   └── types/                     # Типы и интерфейсы
├── docs/                          # Дополнительная документация
├── services/                      # Микросервисы
└── README.md                      # Этот файл
```

## 🔧 Основные команды

| Команда              | Описание                   |
| -------------------- | -------------------------- |
| `npm run build`      | Сборка проекта             |
| `npm run start:dev`  | Запуск в режиме разработки |
| `npm run start:prod` | Запуск в production режиме |

## 🔐 Переменные окружения

| Переменная           | По умолчанию            | Описание                                        |
| -------------------- | ----------------------- | ----------------------------------------------- |
| `PORT`               | `5000`                  | Порт сервера                                    |
| `DATABASE_URL`       | —                       | URL подключения к PostgreSQL                    |
| `JWT_ACCESS_SECRET`  | —                       | Секрет для access-токенов                       |
| `JWT_REFRESH_SECRET` | —                       | Секрет для refresh-токенов                      |
| `CORS_ORIGINS`       | `http://localhost:3000` | Разрешённые CORS origins                        |
| `ADMIN_PASSWORD`     | —                       | Пароль администратора (обязателен в production) |
| `ADMIN_EMAIL`        | `admin@mail.ru`         | Email администратора                            |
| `BASE_URL`           | `http://localhost:5000` | Базовый URL сервера                             |
| `NODE_ENV`           | `development`           | Окружение (development/production)              |

## 📚 Документация

### Глобальная

- [Обзор API](docs/API-OVERVIEW.md)

### По модулям

| Модуль      | Описание                     | Документация                        |
| ----------- | ---------------------------- | ----------------------------------- |
| Auth        | Аутентификация и авторизация | [README](src/auth/README.md)        |
| Users       | Пользователи                 | [README](src/users/README.md)       |
| Artists     | Артисты и подписки           | [README](src/artists/README.md)     |
| Arts        | Произведения искусства       | [README](src/arts/README.md)        |
| Genres      | Жанры                        | [README](src/genres/README.md)      |
| Styles      | Стили                        | [README](src/styles/README.md)      |
| Art Types   | Типы артов                   | [README](src/art-types/README.md)   |
| Tags        | Теги                         | [README](src/tags/README.md)        |
| Location    | География                    | [README](src/location/README.md)    |
| Moderators  | Модерация                    | [README](src/moderators/README.md)  |
| Professions | Профессии                    | [README](src/professions/README.md) |
| Files       | Файлы                        | [README](src/files/README.md)       |
| Password    | Пароли                       | [README](src/password/README.md)    |
| Shared      | Общие хелперы                | [README](src/shared/README.md)      |

### Микросервисы

| Сервис        | Описание                      | Документация                               |
| ------------- | ----------------------------- | ------------------------------------------ |
| Files Service | Выделенный микросервис файлов | [README](services/files-service/README.md) |

## 🏗 Архитектура

Проект построен на **NestJS** с использованием:
- **PostgreSQL** + **Sequelize ORM**
- **JWT-аутентификация** (access + refresh токены)
- **Swagger** для документации API
- **Winston** для логирования

### Микросервисы

Проект декомпозируется на микросервисы:
- ✅ `files-service` — выделен в отдельный микросервис

## 🔒 Безопасность

- bcrypt с cost factor ≥ 10
- CORS ограничен по разрешённым origin
- Защита от path traversal
- Валидация загружаемых файлов (MIME + размер)
- JWT-токены в httpOnly cookies
- Refresh tokens с JTI привязкой

## 📝 Лицензия

MIT



    private buildPagination(total: number, page: number, limit: number) {
        const totalPages = Math.ceil(total / limit);
        return {
            total,
            page,
            limit,
            totalPages,
            hasNextPage: page < totalPages,
            hasPreviousPage: page > 1,
        };
    }

    private pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
        return keys.reduce((acc, key) => {
            if (obj[key] !== undefined && obj[key] !== null) {
                acc[key] = obj[key];
            }
            return acc;
        }, {} as Pick<T, K>);
    }

        private log(method: string, data: any): void {
        this.logger.log('info', JSON.stringify({
            message: `📋 ${method}`,
            context: 'ArtistsService',
            ...data,
        }));
    }


<!-- TODO -->
<!-- <Больше года на удаление 5> -->
<!-- Изменение сущности на автор author -->