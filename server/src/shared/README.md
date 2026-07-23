# Модуль Shared

Общие утилиты и хелперы, используемые несколькими модулями.

## 📋 Описание

Переиспользуемые функции для снижения дублирования кода.

## 🔑 Ключевые файлы

| Файл | Назначение |
|------|-----------|
| `helpers/pagination.helper.ts` | Формирование пагинации |
| `helpers/parse-json.helper.ts` | Безопасный JSON.parse |
| `helpers/handle-error.helper.ts` | Единая обработка ошибок |

## 📦 API

### buildPagination(total, page, limit)

```typescript
{
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
}
```

### parseJsonField<T>(value)

Безопасно парсит JSON-строку. Возвращает `null` при ошибке.

```typescript
parseJsonField<{ moderate: boolean }>(profile.moderate)
```

### handleError(logger, method, error)

Единая обработка ошибок с логированием через Winston.
