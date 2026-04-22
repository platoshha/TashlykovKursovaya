# Fitness App (MVP)

Монорепозиторий с двумя частями:
- `backend` — FastAPI + SQLAlchemy + Alembic + PostgreSQL
- `frontend` — React + Vite + TypeScript + MUI

## Требования

- Python `3.11+`
- Node.js `18+` (рекомендуется LTS)
- PostgreSQL `14+`

## Структура

- `backend/` — API, миграции, сиды
- `frontend/` — веб-клиент
- `design.md`, `info.md`, `REQUIREMENTS.md` — документация проекта

## 1) Запуск Backend

Все команды выполнять из `backend/`.

### 1.1 Установить зависимости

```bash
python -m venv .venv
```

Windows PowerShell:
```powershell
.\.venv\Scripts\Activate.ps1
```

Установка пакетов:
```bash
pip install -r requirements.txt
```

### 1.2 Настроить переменные окружения

Создайте файл `.env` на основе `.env.example` и заполните:
- `DATABASE_URL`
- `SECRET_KEY`
- при необходимости `FRONTEND_ORIGINS`

Пример `FRONTEND_ORIGINS`:
```env
FRONTEND_ORIGINS=http://localhost:5173,http://localhost:5174
```

### 1.3 Применить миграции

```bash
alembic upgrade head
```

### 1.4 Заполнить справочники и системные упражнения

```bash
python seed_data.py
```

### 1.5 Запустить API

```bash
uvicorn app.main:app --reload
```

Backend будет доступен:
- API: `http://127.0.0.1:8000`
- Swagger: `http://127.0.0.1:8000/docs`
- Healthcheck: `http://127.0.0.1:8000/health`

## 2) Запуск Frontend

Все команды выполнять из `frontend/`.

### 2.1 Установить зависимости

```bash
npm install
```

### 2.2 Запустить dev-сервер

```bash
npm run dev
```

Обычно фронтенд поднимается на `http://localhost:5173` (иногда `5174`, если порт занят).

## 3) Важные настройки интеграции

- В фронтенде `baseURL` сейчас задан в `frontend/src/api/axios.ts`:
  - `http://localhost:8000/api/v1`
- Если frontend запускается на нестандартном порту, добавьте origin в `backend/.env` через `FRONTEND_ORIGINS`.

## 4) Быстрая проверка после запуска

1. Открыть `http://127.0.0.1:8000/docs`
2. Выполнить `POST /api/v1/auth/register`
3. Выполнить `POST /api/v1/auth/login`
4. Убедиться, что frontend открывается и выполняет запросы к backend без CORS-ошибок

## Полезные команды

Backend:
```bash
alembic current
alembic history
```

Frontend:
```bash
npm run build
npm run lint
```


## 5) Запуск через Docker

### Что нужно установить

- Docker Desktop
- Docker Compose (обычно уже входит в Docker Desktop)

### Запуск проекта

Из корня проекта выполните:

```bash
docker compose up --build
```

После запуска будут доступны:
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:8000`
- Swagger: `http://localhost:8000/docs`
- PostgreSQL: `localhost:5432`

### Что делает Docker-конфигурация

- поднимает контейнер `db` с PostgreSQL;
- поднимает контейнер `backend` с FastAPI;
- автоматически применяет миграции Alembic;
- запускает `seed_data.py` для заполнения справочников;
- поднимает контейнер `frontend` с Vite.

### Остановка проекта

```bash
docker compose down
```

### Остановка с удалением тома БД

```bash
docker compose down -v
```

Эта команда удаляет контейнеры и локальный том PostgreSQL, поэтому база будет создана заново при следующем запуске.
