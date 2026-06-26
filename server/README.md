<!-- Сделать обязательное заполнение фотографии профиля  -->
<!-- Убрать типы и сделать их стилями, инфа в вк -->
<!-- Сделать модерацию вывода для артиста в профиле картины и выставки для картин и выставок -->
<!-- Сделать проверку на то что мы хотим удалить из понравившегося юзер, выставка, картина ( добавляем всем лайки) -->4
<!-- С profileSidebar убери выход  и вынести язык туда, что бы сразу было видно с выбором -->
<!-- Подписка для артиста с отдельным полем, так же поле вида исскуства -->
<!-- Характеристики для картин отдельное поле продумать и сделать -->





<!-- Стили отдельная сущность, сразу заполним нашими данными выбор только из них.

    Вид исскуства - 5 штук,  у каждого свой жанр
    Вид исскуства заполняем сами 
    Вид исскуства дружит с жанром
    стили сами по себе
    Всё заполняем сами


 -->

# 1. Остановить все контейнеры если запущены
docker-compose down -v

# 2. Собрать и запустить контейнеры
docker-compose up -d --build

# 3. Посмотреть логи для проверки подключения
docker-compose logs -f main

# Запуск всех сервисов
docker-compose up -d

# Перезапуск конкретного сервиса
docker-compose restart main
docker-compose restart postgres

# Просмотр статуса контейнеров
docker-compose ps

# Просмотр логов конкретного сервиса
docker-compose logs -f main
docker-compose logs -f postgres

# Выполнить команду в контейнере
docker exec -it gallery_main sh
docker exec -it gallery_postgres psql -U postgres -d gallery

# Подключиться к PostgreSQL через терминал
docker exec -it gallery_postgres psql -U postgres -d gallery

# Создать бэкап БД
docker exec gallery_postgres pg_dump -U postgres gallery > backup.sql

# Восстановить БД из бэкапа
cat backup.sql | docker exec -i gallery_postgres psql -U postgres gallery

# Просмотр списка таблиц
docker exec -it gallery_postgres psql -U postgres -d gallery -c "\dt"

# Описание таблицы
docker exec -it gallery_postgres psql -U postgres -d gallery -c "\d users"

# Проверить соединение
docker exec -it gallery_main sh -c "nc -zv postgres 5432"


# 1. Проверить что контейнеры запущены
docker ps

# 2. Проверить логи main контейнера
docker-compose logs main | grep -i "database\|connected\|error"

# 3. Проверить что БД принимает подключения
docker exec -it gallery_postgres pg_isready -U postgres

# 4. Проверить переменные окружения в контейнере
docker exec -it gallery_main env | grep POSTGRES

# 5. Проверить сеть между контейнерами
docker exec -it gallery_main ping postgres


# Запустить всё в фоне
docker-compose up -d

# Смотреть логи в реальном времени
docker-compose logs -f --tail=100

# Пересобрать только main контейнер после изменений в package.json
docker-compose build main
docker-compose up -d main



Доступ к сервисам:
Сервис	URL	Данные для входа
API сервер	http://localhost:5000	-
pgAdmin	http://localhost:5050	email: admin@admin.com
password: admin
PostgreSQL	localhost:5432	user: postgres
password: root
Redis	localhost:6379	