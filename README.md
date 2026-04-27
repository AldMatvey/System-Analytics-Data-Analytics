# System-Analytics-Data-Analytics
## О проекте
Учебный проект по "Системной аналитике и аналитике данных". Задача - разработка web-приложения для аналитики загруженности станций метро.

## Команда
Шерстнев Матвей - лидер \
Кулага Григорий  \
Майорова Ева  \
Спеваков Владимир 

# Metro Load Service

Сервис оценки загруженности станций метро с React-фронтендом, картой Yandex Maps, Express API, Postgres, FastAPI-генератором данных и Airflow pipeline.

## Что внутри

- `frontend` - React + Vite приложение
- `backend` - Express API с handlers/services/repositories/db слоями
- `data-generator` - FastAPI-сервис генерации текущей загруженности станций
- `airflow/dags` - DAG `metro_load_pipeline` с шагами `extract -> transform -> load`
- `database/init` - SQL-схема Postgres
- `postgres` - база данных Airflow metadata, справочников станций и измерений загруженности
- `docker-compose.yml` - запуск всего стека в контейнерах

## Источник станций

Координаты и названия станций Москвы собраны из открытого датасета `nalgeon/metro`:
https://github.com/nalgeon/metro

## Модель загруженности

Загруженность считается без машинного обучения. Backend использует открытый набор `data.mos.ru 7704786030-PTMMS` с квартальным пассажиропотоком станций метро, переводит его в оценку среднесуточного пассажиропотока станции и раскладывает по типовому суточному профилю с утренним и вечерним пиком.

Дополнительно сохранена идея проекта `docker-airflow-master`: есть отдельный FastAPI-сервис-генератор данных, Airflow DAG и база. Генератор отдаёт mock endpoint-ы `/generate/stations` и `/generate/stations/:stationId`. Airflow раз в минуту выполняет pipeline `extract -> transform -> load` и пишет текущие значения в таблицу `station_load_snapshots`. Backend читает последние snapshot-ы из Postgres; если БД недоступна, используется fallback по формуле пассажиропотока.

Формула в общем виде:

```text
load = 100 * sqrt(station_daily_passengers / max_station_daily_passengers) * hourly_profile[hour] * day_type_multiplier
```

Для `01:00`-`05:00` загруженность равна `0`, потому что метро не работает.

## Запуск

1. Скопируй `.env.example` в `.env`
2. Укажи `YANDEX_MAPS_API_KEY`
3. Запусти:

```bash
docker compose up --build
```

После старта приложение будет доступно на `http://localhost:8080`.

Дополнительные сервисы:

- `http://localhost:8000/health` - health генератора
- `http://localhost:8000/generate/stations` - текущие сгенерированные значения
- `http://localhost:8081` - Airflow UI, логин `airflow`, пароль `airflow`
- `localhost:5433` - Postgres на хосте

## API

- `GET /api/health`
- `GET /api/stations`
- `GET /api/stations/:stationId/congestion`

## Тесты

```bash
docker compose build tests
```
