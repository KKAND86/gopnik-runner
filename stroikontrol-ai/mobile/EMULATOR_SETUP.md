# Android Emulator Setup Guide for Expo

## Option 1: Expo Go on Real Phone (FASTEST - Recommended)

### Requirements:
- Android phone or iPhone
- Wi-Fi (same network as PC)

### Steps:
1. Install **Expo Go** from:
   - Android: Google Play → "Expo Go"
   - iOS: App Store → "Expo Go"

2. On PC, start Expo:
   ```powershell
   cd C:\Users\Сергей\.kimi_openclaw\workspace\stroikontrol-ai\mobile
   npx expo start --tunnel
   ```

3. Scan QR code from terminal with phone camera

4. App loads on phone — camera and microphone work natively!

---

## Option 2: Install Android Studio (FULL)

### Download:
- https://developer.android.com/studio
- ~8 GB download + installation

### Setup Steps:

1. Install Android Studio (default options)

2. Open Android Studio → More Actions → SDK Manager
   - Install: Android SDK Platform 33
   - Install: Intel x86 Atom_64 System Image (or ARM for M1)

3. Open AVD Manager → Create Device:
   - Phone: Pixel 6
   - System Image: Android 13 (API 33)
   - Graphics: Hardware - GLES 2.0

4. Start emulator

5. In project terminal:
   ```powershell
   npx expo start --android
   ```

---

## Option 3: BlueStacks (Lightweight Alternative)

### Download:
- https://www.bluestacks.com
- ~500 MB

### Steps:
1. Install BlueStacks
2. Install Expo Go APK inside BlueStacks
3. Start Expo on PC with `--lan` or `--tunnel`
4. Open Expo Go in BlueStacks, enter URL manually

---

## Option 4: Windows Subsystem for Android (Windows 11 only)

### Install from Microsoft Store:
1. Amazon Appstore (installs WSA)
2. Or: Windows Subsystem for Android directly
3. Sideload Expo Go APK via adb

---

## Current Status

| Option | Time | Camera | Mic | Recommended |
|--------|------|--------|-----|-------------|
| Expo Go (phone) | 2 min | ✅ | ✅ | ⭐ |
| Android Studio | 60 min | ✅ | ✅ | |
| BlueStacks | 15 min | ⚠️ | ⚠️ | |
| WSA | 20 min | ⚠️ | ⚠️ | |

---

## Quick Test Without Emulator

Expo Web already supports:
- ✅ Auth / Demo login
- ✅ Navigation / Screens
- ✅ Project list / Create
- ✅ Profile / Logout
- ⚠️ Camera (shows UI but can't access hardware)
- ⚠️ Microphone (shows UI but can't access hardware)

For testing camera/mic flow in web: UI loads, buttons clickable, but actual capture requires mobile device.
