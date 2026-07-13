## Модуль видов искусства (ArtTypes)

Модуль для управления видами искусства с поддержкой описания и CRUD операций.

### Структура
```
##### src/art-types/
##### ├── art-type.model.ts # Модель ArtType
##### ├── art-types.service.ts # Бизнес-логика
##### ├── art-types.controller.ts # API эндпоинты
##### ├── art-types.module.ts # Модуль
##### ├── art-types.data.ts # Начальные данные для seed
##### └── dto/
##### 		├── create-art-type.dto.ts
##### 		└── update-art-type.dto.ts
```

### Модель

```typescript
{
  id: number;
  name: string;          // уникальное
  description?: string;  // описание
}
```

### API

| Метод | Эндпоинт | Описание |
|-------|----------|----------|
| POST | `/art-types/seed` | Заполнить начальными данными |
| POST | `/art-types` | Создать вид искусства |
| PUT | `/art-types/:id` | Обновить вид искусства |
| DELETE | `/art-types/:id` | Удалить вид искусства |
| GET | `/art-types` | Получить все виды |
| GET | `/art-types/:id` | Получить по ID |

### Использование


```typescript
// В модуле
@Module({
  imports: [ArtTypesModule]
})

// В сервисе
constructor(private artTypesService: ArtTypesService) {}

// Создание
await artTypesService.create({ name: 'Живопись', description: '...' });

// Получение всех
const types = await artTypesService.getAll();

// Обновление
await artTypesService.update(1, { name: 'Новое название' });

// Удаление
await artTypesService.delete(1);
```