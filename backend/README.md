# Backend Run Guide

## 1. Install dependencies

```powershell
python -m pip install -r backend/requirements.txt
```

## 2. Create environment file

```powershell
Copy-Item backend/.env.example backend/.env
```

## 3. Configure PostgreSQL mode

Use one `DATABASE_URL` in `backend/.env`:

- Cloud/online PostgreSQL (production-like):

```env
DATABASE_URL=postgresql+psycopg2://user:password@host:5432/heatreco?sslmode=require
MOCK_SEED_ON_STARTUP=false
```

- Local PostgreSQL (mock/dev):

```env
DATABASE_URL=postgresql+psycopg2://postgres:postgres@localhost:5432/heatreco
MOCK_SEED_ON_STARTUP=true
```

When `MOCK_SEED_ON_STARTUP=true`, two verified users are inserted if they do not already exist:

- `producer.mock@heatreco.local`
- `consumer.mock@heatreco.local`

Password for both: `MockPassword123!`

## 4. Set SMTP/JWT values

Fill these in `backend/.env`:

- `JWT_SECRET_KEY`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USERNAME`
- `SMTP_PASSWORD`
- `SMTP_FROM_EMAIL`

## 5. Start API

```powershell
python -m uvicorn app.main:app --app-dir backend --reload --host 0.0.0.0 --port 8000
```

## 6. Health check

```powershell
curl http://localhost:8000/health
```

## 7. Match generation endpoint

```powershell
curl -X POST "http://localhost:8000/api/v1/matches/generate" \
	-H "Authorization: Bearer <ACCESS_TOKEN>" \
	-H "Content-Type: application/json" \
	-d '{"max_candidates": 100}'
```

If `ML_SERVICE_URL` is not configured or unavailable, the API returns deterministic `model_unavailable` state.

## 8. Alembic migration scaffolding

Generate migration:

```powershell
cd backend
alembic revision --autogenerate -m "init"
```

Apply migration:

```powershell
cd backend
alembic upgrade head
```

Current startup still runs `Base.metadata.create_all` for hackathon speed; migrations are now scaffolded for production-safe evolution.
