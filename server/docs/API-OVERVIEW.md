# API Overview

Документация всех API-эндпоинтов сервера GalleryTema.

## 🌐 Базовый URL

```
http://localhost:5000
```

## 🔐 Аутентификация

Большинство эндпоинтов требуют JWT-токен в cookie:
- `accessToken` — httpOnly cookie
- `refreshToken` — httpOnly cookie

### Получение токенов

```bash
POST /auth/register
POST /auth/login
```

---

## 📋 Таблица эндпоинтов

### Auth

| Метод | Путь | Описание | Требуется токен |
|-------|------|----------|-----------------|
| POST | `/auth/register` | Регистрация | ❌ |
| POST | `/auth/login` | Вход | ❌ |
| POST | `/auth/refresh` | Обновление токена | ❌ |
| POST | `/auth/logout` | Выход | ✅ |
| GET | `/auth/me` | Текущий пользователь | ✅ |
| GET | `/auth/debug` | Отладка | ❌ |

### Users

| Метод | Путь | Описание | Требуется токен |
|-------|------|----------|-----------------|
| POST | `/users` | Создать пользователя | ❌ |
| GET | `/users` | Все пользователи | ✅ |
| GET | `/users/:id` | Пользователь по ID | ✅ |
| GET | `/users/:id/profile` | Профиль пользователя | ✅ |
| PATCH | `/users/:id` | Обновить пользователя | ✅ |
| DELETE | `/users/:id` | Удалить пользователя | ✅ |
| POST | `/users/:id/restore` | Восстановить | ✅ |
| GET | `/users/deleted` | Удалённые | ✅ |

### Artists

| Метод | Путь | Описание | Требуется токен |
|-------|------|----------|-----------------|
| GET | `/artists` | Список артистов | ✅ |
| GET | `/artists/:id` | Артист по ID | ✅ |
| GET | `/artists/:id/arts` | Арты артиста | ✅ |
| POST | `/artists` | Создать артиста | ✅ |
| PATCH | `/artists/:id` | Обновить | ✅ |
| DELETE | `/artists/:id` | Удалить | ✅ |
| POST | `/artists/:id/restore` | Восстановить | ✅ |
| GET | `/artists/unmoderated` | Немодерированные | ✅ |
| GET | `/artists/moderated` | Модерированные | ✅ |
| POST | `/artists/:id/moderate` | Модерация | ✅ |
| GET | `/artists/top` | Топ артистов | ✅ |
| GET | `/artists/subscription/info` | Инфо о подписке | ✅ |
| POST | `/artists/subscription/purchase` | Купить подписку | ✅ |
| DELETE | `/artists/subscription/cancel` | Отменить подписку | ✅ |
| GET | `/artists/subscription/plans` | Планы | ✅ |

### Arts

| Метод | Путь | Описание | Требуется токен |
|-------|------|----------|-----------------|
| GET | `/arts` | Список артов | ✅ |
| GET | `/arts/:id` | Арт по ID | ✅ |
| POST | `/arts` | Создать арт | ✅ |
| PATCH | `/arts/:id` | Обновить | ✅ |
| DELETE | `/arts/:id` | Удалить | ✅ |
| GET | `/arts/top` | Топ артов | ✅ |
| GET | `/arts/moderated` | Модерированные | ✅ |
| GET | `/arts/unmoderated` | Немодерированные | ✅ |
| POST | `/arts/:id/moderate` | Модерация | ✅ |
| POST | `/arts/:id/view` | Записать просмотр | ✅ |
| POST | `/arts/:id/featured` | В featured | ✅ |
| DELETE | `/arts/:id/featured` | Из featured | ✅ |
| POST | `/arts/update-scores` | Обновить очки | ✅ |
| POST | `/arts/refresh-featured` | Обновить featured | ✅ |

### Genres

| Метод | Путь | Описание | Требуется токен |
|-------|------|----------|-----------------|
| GET | `/genres` | Все жанры | ✅ |
| GET | `/genres/:id` | Жанр по ID | ✅ |
| GET | `/genres/by-art-type/:artTypeId` | Жанры по типу | ✅ |
| POST | `/genres` | Создать | ✅ |
| POST | `/genres/seed` | Seed данные | ✅ |
| PUT | `/genres/:id` | Обновить | ✅ |
| DELETE | `/genres/:id` | Удалить | ✅ |
| DELETE | `/genres/all` | Удалить все | ✅ |

### Styles

| Метод | Путь | Описание | Требуется токен |
|-------|------|----------|-----------------|
| GET | `/styles` | Все стили | ✅ |
| GET | `/styles/:id` | Стиль по ID | ✅ |
| POST | `/styles` | Создать | ✅ |
| POST | `/styles/seed` | Seed данные | ✅ |
| PUT | `/styles/:id` | Обновить | ✅ |
| DELETE | `/styles/:id` | Удалить | ✅ |

### Art Types

| Метод | Путь | Описание | Требуется токен |
|-------|------|----------|-----------------|
| GET | `/art-types` | Все типы | ✅ |
| GET | `/art-types/:id` | Тип по ID | ✅ |
| POST | `/art-types` | Создать | ✅ |
| POST | `/art-types/seed` | Seed данные | ✅ |
| PUT | `/art-types/:id` | Обновить | ✅ |
| DELETE | `/art-types/:id` | Удалить | ✅ |

### Location

| Метод | Путь | Описание | Требуется токен |
|-------|------|----------|-----------------|
| GET | `/location/countries/search?q=` | Поиск стран | ✅ |
| GET | `/location/countries` | Все страны | ✅ |
| GET | `/location/countries/:id` | Страна по ID | ✅ |
| GET | `/location/countries/by-code/:code` | Страна по коду | ✅ |
| GET | `/location/cities/search?q=&countryCode=` | Поиск городов | ✅ |
| GET | `/location/cities/:id` | Город по ID | ✅ |
| GET | `/location/countries/by-code/:code/cities` | Города страны | ✅ |

### Moderators

| Метод | Путь | Описание | Требуется токен |
|-------|------|----------|-----------------|
| GET | `/moderators` | Все модераторы | ✅ |
| GET | `/moderators/:id` | Модератор по ID | ✅ |
| POST | `/moderators` | Создать | ✅ |
| DELETE | `/moderators/:id` | Удалить | ✅ |

### Professions

| Метод | Путь | Описание | Требуется токен |
|-------|------|----------|-----------------|
| GET | `/professions` | Все профессии | ✅ |
| GET | `/professions/:id` | Профессия по ID | ✅ |
| POST | `/professions` | Создать | ✅ |
| PUT | `/professions/:id` | Обновить | ✅ |
| DELETE | `/professions/:id` | Удалить | ✅ |

---

## 📦 Форматы ответов

### Успешный ответ (с пагинацией)

```json
{
    "data": [...],
    "pagination": {
        "total": 100,
        "page": 1,
        "limit": 12,
        "totalPages": 9,
        "hasNextPage": true,
        "hasPreviousPage": false
    }
}
```

### Ошибка

```json
{
    "statusCode": 400,
    "message": "Описание ошибки",
    "error": "Bad Request"
}
```

## 🔗 Swagger

Интерактивная документация доступна по адресу:
```
http://localhost:5000/api/docs
```
