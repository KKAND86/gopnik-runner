# СтройКонтроль AI v2.1

Мобильное приложение с AI-анализом качества строительно-отделочных работ.

## Архитектура

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   iOS/Android   │────▶│   API Gateway   │────▶│   FastAPI App   │
│   (React Native)│     │   (Nginx/Traefik)│     │   (Python)      │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │                         │
                               ▼                         ▼
                        ┌─────────────────┐     ┌─────────────────┐
                        │   Rate Limiter  │     │   ML Pipeline   │
                        │   (Redis)       │     │   (GPU Server)  │
                        └─────────────────┘     └─────────────────┘
                                                       │
                                                       ▼
                        ┌─────────────────┐     ┌─────────────────┐
                        │   PostgreSQL    │     │   MinIO/S3      │
                        │   (Metadata)    │     │   (Images/Audio)│
                        └─────────────────┘     └─────────────────┘
```

## Модули

- `mobile/` — React Native приложение (Expo)
- `backend/` — FastAPI сервер, авторизация, бизнес-логика
- `ai-models/` — ML модели (CV + Audio)
- `infra/` — Docker, K8s, Terraform
- `docs/` — Документация

## Быстрый старт

```bash
docker-compose up -d
```

## Стек

- **Mobile:** React Native (Expo), TypeScript, TensorFlow Lite
- **Backend:** Python 3.11, FastAPI, SQLAlchemy, Celery, Redis
- **ML:** PyTorch, OpenCV, librosa, YOLOv8
- **Infra:** Docker, Kubernetes, PostgreSQL, MinIO, Nginx

## Лицензия

Проприетарное ПО. Все права защищены.
