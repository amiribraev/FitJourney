# ФитПуть — мобильное приложение

React Native приложение (Expo) для iOS и Android. Использует тот же Firebase, что и веб-версия.

## Возможности

- Вход и регистрация
- План питания (калории, бюджет, белки)
- План тренировок (подходы × повторения)
- Прогресс за день
- Профиль и пересоздание планов ИИ

## Быстрый старт

### 1. Запустите веб-сервер (обязательно для ИИ)

В корне проекта:

```bash
npm run dev
```

Сервер слушает порт **9002**.

### 2. Настройте мобильное приложение

```bash
cd mobile
copy .env.example .env
```

Заполните `.env` — те же ключи Firebase, что `NEXT_PUBLIC_FIREBASE_*` в корневом `.env`.

Укажите `EXPO_PUBLIC_API_URL`:

| Где тестируете | URL |
|----------------|-----|
| Expo Go на телефоне (та же Wi‑Fi) | `http://ВАШ_IP:9002` |
| Android-эмулятор | `http://10.0.2.2:9002` |
| iOS-симулятор (Mac) | `http://localhost:9002` |
| Продакшен | URL задеплоенного сайта |

### 3. Запустите приложение

```bash
npm start
```

Отсканируйте QR-код в **Expo Go** (App Store / Google Play) или нажмите `a` для Android-эмулятора.

## Сборка APK / IPA

```bash
npx eas build --platform android
```

Требуется аккаунт [Expo](https://expo.dev). Подробнее: [документация EAS Build](https://docs.expo.dev/build/introduction/).

## Структура

- `app/` — экраны (expo-router)
- `context/AuthContext.tsx` — авторизация и профиль
- `lib/firebase.ts` — Firebase
- `lib/api.ts` — запросы к `/api/plans/generate` на Next.js
