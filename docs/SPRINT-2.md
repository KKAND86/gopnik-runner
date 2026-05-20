# Спринт 2 — Аудио, заставки, лидерборд, монетизация

## Цель
Полноценный Telegram Mini App: звуки, кинематографичные заставки, онлайн-лидерборд, монетизация.

## Задачи

### 1. 8-bit звуки
- SFX: прыжок, сбор монетки, гопник рядом, бустер, Game Over
- BGM: фоновая музыка бега (можно отключить)
- Библиотека: Web Audio API или tiny 8-bit synth
- mute/unmute кнопка

### 2. Начальная заставка (Intro)
- Игрок стоит, телефон звонит
- Девушка на экране: "Милый, за кефиром сходи!"
- Игрок бежит — начало игры
- Скип через тап

### 3. Финальная заставка (Outro)
- При Game Over: мама на балконе, гопники отступают
- "Мама спасла!"
- Кнопка "Ещё раз"

### 4. Лидерборд Supabase
- Таблица `scores`: user_id, username, distance, coins, created_at
- Топ-10 в Telegram
- Персональный рекорд
- Отправка скор после Game Over

### 5. Монетизация
- Reklamka (Telegram Ads) — rewarded video за рестарт с бустером
- Или донат-ссылка

## Архитектура
- `src/audio/SoundManager.js` — Web Audio 8-bit synth
- `src/scenes/IntroScene.js` — заставка перед игрой
- `src/scenes/OutroScene.js` — заставка после Game Over
- `src/scenes/LeaderboardScene.js` — таблица лидеров
- `src/utils/supabase.js` — уже заложен, активировать
- `src/utils/ads.js` — Reklamka integration

## Приёмочные критерии
- [ ] Звуки на всех ключевых событиях
- [ ] Intro скипается тапом
- [ ] Outro при Game Over
- [ ] Топ-10 лидеров загружается из Supabase
- [ ] Рекорд пользователя сохраняется
- [ ] Монетизация работает (rewarded ad)
