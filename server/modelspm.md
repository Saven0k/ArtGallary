## 1 ArtistProfile 🎭

Таблица: `artist_profiles`  
Файл: `server/src/artists/artist.model.ts`

| Поле | Тип данных | Описание | Видимость
|------|-----------|----------|----------
| `user_id` | INTEGER PK/UNIQUE | Пользователь (FK → `users.id`) | Нет
| `date_birthday` | DATE | Дата рождения | Да
| `biography` | TEXT('long') | Биография | Да
| `moderate` | TEXT | Данные модерации (JSON-строка) | Не модерированный
| `profession_id` | INTEGER | Профессия (FK → `professions.id`) | Да (Название)
| `plan` | TEXT DEFAULT 'free' | Тип плана | Да (Название)
| `planExpiresAt` | DATE NULL | Срок действия плана | Да (5 месяце 3 дня)
| `planStatus` | BOOLEAN DEFAULT false | Активен ли план | Да
| `likes` | INTEGER DEFAULT 0 | Количество лайков | Да 
| `views` | INTEGER DEFAULT 0 | Количество просмотров | Да
| `is_deleted` | BOOLEAN DEFAULT false | Флаг удаления | Нет
| `deleted_at` | DATE | Дата удаления | При восстановлении
| `USER` | User -> | Данные пользователя | Тоже самое что в user



### enum-значения

| Поле | Значения |
|------|----------|
| `plan` | `'free'` · `'pro'` · `'vip'` |




## 2. Art 🖼️

Таблица: `arts`  
Файл: `server/src/arts/arts.model.ts`

| Поле | Тип данных | Описание | Видимость
|------|-----------|----------| ----------
| `title` | STRING | Заголовок / название | Да
| `description` | TEXT | Описание | Да
| `cost` | FLOAT NULL | Цена | Да
| `currency` | STRING NULL | Валюта | Да
| `image_path` | STRING | Путь к изображению | Да (картинка)
| `tags` | STRING | Список ключевых слов | Да (список)
| `specifications` | TEXT | Характеристики | Да (список\таблица)
| `date_published` | DATE | Дата публикации | Да
| `likes` | INTEGER DEFAULT 0 | Количество лайков | Да
| `views` | INTEGER DEFAULT 0 | Количество просмотров | Да
| `moderate` | TEXT | Данные модерации (JSON-строка) | Не модерированные
| `artist_id` | INTEGER | Художник (FK → `artist_profiles.user_id`) | Да (баннер)
| `genre_id` | INTEGER | Жанр (FK → `genres.id`) | Да (Название)
| `style_id` | INTEGER | Стиль (FK → `styles.id`) | Да (Название)
| `city_id` | INTEGER NULL | Город (FK → `cities.id`) | Да (Название)
| `country_id` | INTEGER NULL | Страна (FK → `countries.id`) | Да (Название)
| `is_adult` | BOOLEAN DEFAULT false | Контент 18+ | Да (Баннер/иконка)
| `score` | FLOAT DEFAULT 0 | Оценка для ранжирования | Нет
| `is_featured` | BOOLEAN DEFAULT false | Рекомендуемая работа | Да (Баннер/Иконка)
| `featured_until` | DATE NULL | До какого момента в топе | ТОлько артисту


## 3. User 👤

Таблица: `users`

| Поле | Тип данных | Описание | Видимость
|------|-----------|----------|----------
| `id` | INTEGER | Первичный ключ | Нет
| `email` | STRING(120) | Email | Да
| `password_hash` | STRING(255) | Хэш пароля (bcrypt) | Нет
| `surname` | STRING | Фамилия | Да
| `name` | STRING | Имя | Да
| `second_name` | STRING | Отчество / второе имя | Да
| `phone_number` | STRING | Номер телефона | Да
| `avatar_path` | STRING | Путь к аватару | Картинка
| `role` | ENUM | Роль | Нет
| `gender` | ENUM | Пол | Да
| `is_deleted` | BOOLEAN | Флаг удаления | Нет
| `deleted_at` | TIMESTAMP | Дата удаления | При восстановлении
| `city_id` | INTEGER | Город (FK → `cities.id`, OPTIONAL) | Да (Название)
| `country_id` | INTEGER | Страна (FK → `countries.id`, OPTIONAL) | Да (Название)

### Гендер (`Gender`)

| Значение | Описание |
|----------|----------|
| `'male'` | Мужской |
| `'female'` | Женский |



## 📌 Полезные утилитарные типы

### Гендер

```ts
type Gender = 'male' | 'female';
```

### Роли

```ts
type rolesTypes = 'user' | 'artist' | 'moderator' | 'admin';
```

### Валюта

```ts
type CurrencyType = 'usd' | 'EUR' | 'uah' | 'usdt' | 'rub';
```