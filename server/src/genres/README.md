## Модуль жанров (Genres)

Модуль для управления жанрами с привязкой к видам искусства.

### Структура

```typescript
##### src/genres/
##### ├── genre.model.ts # Модель Genre
##### ├── genres.service.ts # Бизнес-логика
##### ├── genres.controller.ts # API эндпоинты
##### ├── genres.module.ts # Модуль
##### ├── genres.data.ts # Начальные данные для seed
##### └── dto/
##### ├── create-genre.dto.ts
##### └── update-genre.dto.ts
```



### Модель

```typescript
{
  id: number;
  title: string;           // название жанра
  description?: string;    // описание (необязательное)
  art_type_id: number;     // ID вида искусства
}
```


### API

| Метод | Эндпоинт | Описание |
|-------|----------|----------|
| `POST` | `/genres/seed` | Заполнить начальными данными |
| `POST` | `/genres` | Создать жанр |
| `PUT` | `/genres/:id` | Обновить жанр |
| `DELETE` | `/genres/:id` | Удалить жанр |
| `DELETE` | `/genres/all` | Удалить все жанры |
| `GET` | `/genres` | Получить все жанры |
| `GET` | `/genres/by-art-type/:artTypeId` | Получить жанры по виду искусства |
| `GET` | `/genres/:id` | Получить жанр по ID |


### Использование

```typescript
// В модуле
@Module({
  imports: [GenresModule]
})

// В сервисе
constructor(private genresService: GenresService) {}

// Создание
await genresService.create({ 
  title: 'Пейзаж', 
  art_type_id: 1,
  description: 'Описание жанра'
});

// Получение всех
const genres = await genresService.getAll();

// Получение по виду искусства
const genres = await genresService.getGenresByArtType(1);

// Обновление
await genresService.update(1, { title: 'Новое название' });

// Удаление
await genresService.delete(1);
```