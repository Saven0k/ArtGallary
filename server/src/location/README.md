# Модуль Location

Управление географическими данными: страны и города.

## 📋 Описание

Хранение стран и городов на основе GeoNames. Поиск, фильтрация, связь с пользователями и артами.

## 🔑 Ключевые файлы

| Файл | Назначение |
|------|-----------|
| `location.controller.ts` | HTTP-контроллер (7 эндпоинтов) |
| `location.service.ts` | Бизнес-логика + Nominatim fallback |
| `location.module.ts` | Конфигурация модуля |
| `models/country.model.ts` | Модель Country |
| `models/city.model.ts` | Модель City |
| `seeders/geonames.seeder.ts` | Загрузка данных из GeoNames |

## 🌐 API-эндпоинты

### Страны

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/location/countries/search?q=` | Поиск стран |
| GET | `/location/countries` | Все страны |
| GET | `/location/countries/:id` | Страна по ID |
| GET | `/location/countries/by-code/:code` | Страна по ISO2 коду |

### Города

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/location/cities/search?q=&countryCode=` | Поиск городов |
| GET | `/location/cities/:id` | Город по ID |
| GET | `/location/countries/by-code/:code/cities` | Города по стране |

## ⚙️ Особенности

- Данные загружаются из GeoNames dump при первом старте
- Seed: 252 страны, города привязаны к странам
- Fallback через Nominatim (OpenStreetMap API) если данные неполные
- Каждый город имеет координаты, часовой пояс, население
- Поддержка мультиязычности (ru/en названия)
- Используется для привязки location к User, Artist, Art

## 🗄 Модель Country

```typescript
{
    id: number;
    iso2: string;
    iso3: string;
    name_en: string;
    name_ru: string;
    name_local: string;
    phone_code: string;
    currency: string;
    continent: string;
    capital: string;
    area: number;
    population: number;
}
```

## 🗄 Модель City

```typescript
{
    id: number;
    name_en: string;
    name_ru: string;
    country_code: string;
    region: string;
    latitude: number;
    longitude: number;
    population: number;
    timezone: string;
}
```
