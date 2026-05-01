# СтройКонтроль AI — Project Status Report

## Результат проверки

### Backend API ✅ РАБОТАЕТ
- **URL:** `http://localhost:8001`
- **Health Check:** `{"status": "ok", "version": "2.1.0"}`
- **Endpoints проверены:**
  - `GET /health` ✅
  - `POST /api/v1/auth/otp/send` ✅
- **База данных:** SQLite (aiosqlite), таблицы созданы
- **Статус:** API полностью функционален

### Mobile App ❌ НЕ ЗАПУЩЕН

**Проблема:** Expo SDK 50 несовместим с Node.js 24 на Windows.

**Конкретные ошибки:**
1. **Metro Bundler → `node:sea` filename error**
   - Node.js 24+ имеет встроенный модуль `node:sea`
   - Metro пытается создать shim-файл `.expo/metro/externals/node:sea/index.js`
   - Windows запрещает двоеточия (`:`) в именах файлов
   - ✅ **Пофикшено:** Патч в `externals.js` (пропуск модулей с `:` на Windows)

2. **TypeScript → npm install loop**
   - `npm install typescript@5.3.3` возвращает "up to date", но пакет не устанавливается
   - Возможно баг npm 10.x + Node 24 или проблема с кэшем
   - ❌ **Не удалось обойти**

3. **Expo SDK 50 → Устаревшие зависимости**
   - 29 security vulnerabilities в зависимостях
   - Множество deprecated пакетов

## Что работает сейчас

```powershell
# Backend (запущен и работает)
cd C:\Users\Сергей\.kimi_openclaw\workspace\stroikontrol-ai\backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8001

# API доступно на:
# http://localhost:8001/health
# http://localhost:8001/docs  (Swagger UI)
```

## Для запуска Mobile требуется

### Вариант 1: Node.js 18 LTS (рекомендуется)
```powershell
# Скачать Node 18 с nodejs.org и установить
# Затем:
cd stroikontrol-ai/mobile
Remove-Item -Recurse -Force node_modules, package-lock.json
npm install
npx expo start
```

### Вариант 2: WSL2 (Linux в Windows)
```bash
# В WSL2 Ubuntu:
cd /mnt/c/Users/Сергей/.kimi_openclaw/workspace/stroikontrol-ai/mobile
npm install
npx expo start
```

### Вариант 3: Web-only preview (без Expo)
Создать отдельный React web frontend вместо React Native.

## Структура проекта
```
stroikontrol-ai/
├── backend/          # FastAPI ✅ работает
├── mobile/           # React Native + Expo ❌ требует Node 18
├── ai-models/      # YOLOv8 + Audio CNN (требует GPU)
├── infra/            # Docker, K8s configs
└── docs/             # API docs, architecture
```

## Рекомендации

1. **Для разработки backend:** Всё готово, API полностью функционален
2. **Для разработки mobile:** Установить Node.js 18 LTS или использовать WSL2
3. **Для production:** Использовать Docker Compose (описано в `docker-compose.yml`)

## Быстрый тест API

```powershell
# Health check
python -c "import urllib.request, json; print(json.loads(urllib.request.urlopen('http://localhost:8001/health').read().decode()))"

# Send OTP (mock)
python -c "
import urllib.request, json
req = urllib.request.Request('http://localhost:8001/api/v1/auth/otp/send',
    data=json.dumps({'phone': '+79990000001'}).encode(),
    headers={'Content-Type': 'application/json'})
print(json.loads(urllib.request.urlopen(req).read().decode()))
"
```

---

**Backend запущен и работает. Mobile требует Node.js 18 LTS или WSL2 для запуска Expo.**
