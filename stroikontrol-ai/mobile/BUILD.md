# СтройКонтроль AI — Инструкция по сборке и запуску

## 📱 Вариант 1: Expo Go (БЫСТРО — 2 минуты)

Самый простой способ — запуск через приложение Expo Go. Не требует сборки APK.

### Шаг 1: Установи Expo Go на телефон
- **Android**: Google Play → поиск "Expo Go" → установить
- **iPhone**: App Store → поиск "Expo Go" → установить

### Шаг 2: Запусти сервер разработки
На ПК (PowerShell):
```powershell
cd C:\Users\Сергей\.kimi_openclaw\workspace\stroikontrol-ai\mobile
npx expo start --tunnel
```

### Шаг 3: Подключи телефон
- Убедись, что телефон и ПК в одной Wi-Fi сети
- Открой камеру телефона → отсканируй QR-код из терминала
- Или открой Expo Go → "Scan QR Code"
- Приложение загрузится автоматически

### ✅ Готово
- Камера работает
- Микрофон работает
- Все функции доступны

---

## 🔧 Вариант 2: Сборка APK через EAS (Облачная сборка — 15 минут)

Создаётся полноценный APK-файл для установки на любой Android.

### Шаг 1: Создай аккаунт Expo
1. Перейди на https://expo.dev/signup
2. Зарегистрируйся (email + пароль, или Google/GitHub)
3. Подтверди email

### Шаг 2: Войди в Expo CLI
```powershell
cd C:\Users\Сергей\.kimi_openclaw\workspace\stroikontrol-ai\mobile
npx eas login
# Введи email и пароль от аккаунта Expo
```

### Шаг 3: Инициализируй проект в EAS
```powershell
npx eas build:configure
# Выбери платформу: Android
# Подтверди настройки
```

### Шаг 4: Запусти сборку APK
```powershell
npx eas build --platform android --profile preview
```

### Шаг 5: Скачай APK
- Сборка займёт 10-15 минут
- Получишь ссылку для скачивания в терминале
- Или открой https://expo.dev/builds в браузере
- Скачай APK на телефон и установи

---

## 🏗️ Вариант 3: Локальная сборка APK (Android Studio — 30 минут)

Собирает APK прямо на ПК без облака.

### Шаг 1: Установи Android Studio
- Скачай: https://developer.android.com/studio
- Установи с настройками по умолчанию

### Шаг 2: Установи Android SDK
- Открой Android Studio → SDK Manager
- Установи:
  - Android SDK Platform 33
  - Android SDK Build-Tools 33.0.0
  - Intel x86 Atom_64 System Image (или Google APIs ARM)

### Шаг 3: Настрой переменные окружения
```powershell
# Найди путь к SDK (обычно C:\Users\ИМЯ\AppData\Local\Android\Sdk)
# Добавь в PATH:
#   C:\Users\ИМЯ\AppData\Local\Android\Sdk\platform-tools
#   C:\Users\ИМЯ\AppData\Local\Android\Sdk\cmdline-tools\latest\bin
```

### Шаг 4: Сгенерируй нативный проект
```powershell
cd C:\Users\Сергей\.kimi_openclaw\workspace\stroikontrol-ai\mobile
npx expo prebuild --platform android
```

### Шаг 5: Собери APK
```powershell
cd android
.\gradlew assembleRelease
```

### Шаг 6: Найди APK
```
android\app\build\outputs\apk\release\app-release.apk
```

---

## 🖥️ Вариант 4: Веб-версия (Без телефона — для теста UI)

Для тестирования интерфейса без камеры/микрофона.

```powershell
cd C:\Users\Сергей\.kimi_openclaw\workspace\stroikontrol-ai\mobile
npx expo start --web
```

Открой в браузере: **http://localhost:8081**

### ⚠️ Ограничения веб-версии:
- ❌ Камера — не работает (нужен мобильный девайс)
- ❌ Микрофон — не работает
- ✅ Навигация, проекты, профиль — работают
- ✅ Демо-вход, создание проектов, отчёты — работают

---

## 📋 Предварительные требования

### На ПК должен быть установлен:
1. **Node.js** ≥ 18 (проверь: `node --version`)
2. **npm** (входит в Node.js)
3. **Git** (для клонирования)

### Зависимости проекта уже установлены:
```
stroikontrol-ai/mobile/node_modules/
```
Если нужно переустановить:
```powershell
cd C:\Users\Сергей\.kimi_openclaw\workspace\stroikontrol-ai\mobile
npm install
```

---

## 🚀 Бэкенд (уже запущен)

API сервер работает на `http://localhost:8001`

Если нужно перезапустить:
```powershell
cd C:\Users\Сергей\.kimi_openclaw\workspace\stroikontrol-ai\backend
py -V:3.12 -m uvicorn app.main:app --host 0.0.0.0 --port 8001
```

---

## 🎯 Рекомендация

| Твоя ситуация | Рекомендуемый вариант | Время |
|---------------|----------------------|-------|
| Есть телефон Android/iPhone | **Вариант 1 — Expo Go** | 2 мин |
| Нужен APK для распространения | **Вариант 2 — EAS Build** | 15 мин |
| Нет телефона, тест UI только | **Вариант 4 — Web** | 1 мин |
| Полный контроль над сборкой | **Вариант 3 — Android Studio** | 30 мин |

---

## ❓ Возможные проблемы

### "Unable to resolve module"
```powershell
npm install --force
npx expo start -c  # с очисткой кэша
```

### "Metro Bundler не запускается"
```powershell
# Убей старые процессы Node
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force
npx expo start
```

### "Network response timeout"
```powershell
# Запуск без проверки обновлений
$env:CI=1
$env:EXPO_NO_DOCTOR=1
npx expo start --offline
```

### "Camera not working"
- Expo Web НЕ поддерживает камеру
- Используй реальный телефон или Android-эмулятор

---

## 📞 Поддержка

Если возникнут вопросы:
- Expo документация: https://docs.expo.dev
- EAS Build: https://docs.expo.dev/build/introduction/
- Проект: `C:\Users\Сергей\.kimi_openclaw\workspace\stroikontrol-ai\mobile\`
