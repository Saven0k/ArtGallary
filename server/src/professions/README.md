## Модуль профессий (Professions)
### Модуль для управления профессиями с базовым CRUD.


## Структура

#### src/professions/
#### ├── profession.model.ts          # Модель
#### ├── professions.service.ts       # Сервис
#### ├── professions.controller.ts    # Контроллер
#### ├── professions.module.ts        # Модуль
#### └── dto/
####     ├── create-profession.dto.ts
####     └── update-profession.dto.ts


## API
Метод	Эндпоинт	Описание
POST	/professions	Создать
PUT	/professions/:id	Обновить
DELETE	/professions/:id	Удалить
GET	/professions	Все
GET	/professions/:id	По ID


## Модель
```
{
  id: number;
  name: string;        // уникальное
  description?: string;
}

```

## Использование
```
// В модуле
@Module({
  imports: [ProfessionsModule]
})

// В сервисе
constructor(private professionsService: ProfessionsService) {}
```