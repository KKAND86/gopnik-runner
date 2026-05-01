# СтройКонтроль AI — Mobile App Specification

## Platform Requirements
- **iOS:** 16.0+ (ARCore не требуется, ARKit для Class A)
- **Android:** 12.0+ (ARCore для AR-функций)

## Device Classes
| Class | Devices | LiDAR | AR | 3D Analysis |
|-------|---------|-------|-----|-------------|
| A | iPhone 12 Pro+, Pixel 6 Pro+ | Yes | Full | Yes |
| B | iPhone 11, Pixel 5 | No | Limited | No |
| C | Older devices | No | No | No |

## Screens

### 1. Auth Screen (P0)
- Phone input with +7 mask
- SMS code input (6 digits)
- Consent checkbox (152-ФЗ)

### 2. Home Screen (P0)
- Project list with thumbnails
- Status badges
- FAB (+) for new project

### 3. Project Create (P0)
- Room type selector (bathroom, kitchen, etc.)
- Surface type selector (wall, floor)
- Tariff info

### 4. Calibration Screen (P0)
- Object selector (coin 5₽, card, A4, manual)
- Camera preview with overlay
- On-device detection (TensorFlow Lite)
- Validation: 3-point measurement check
- Block capture until calibrated

### 5. Camera Screen (P0)
- Multi-angle capture (front, left_30, right_30)
- Grid overlay for alignment
- On-device quality checks (blur, lux, glare)
- Auto-correct perspective
- Normalize color temperature
- Progress indicator

### 6. Audio Record Screen (P0)
- Phase 1: Background noise (3 sec)
- Phase 2: Tap grid 3×3
- Real-time SNR check (≥15 dB)
- Visual grid with tap positions

### 7. Analysis Screen (P0)
- Progress indicator
- Status updates (queued/processing/completed)
- Cancel button
- Auto-redirect on completion

### 8. Report Screen (P0)
- Defect list with severity colors
  - Red: Critical (confidence ≥0.85)
  - Yellow: Warning (0.70–0.85)
  - Gray: Info (<0.70, UI only)
- Photo with bounding box overlay
- SNiP/GOST references
- "ИИ ошибся?" button
- PDF export
- Share button

### 9. Payment Screen (P0)
- Tariff selector
  - PAYG: 199₽/комната
  - B2C Monthly: 499₽/мес
  - B2C Yearly: 3999₽/год
- Payment methods (Apple Pay, Google Pay, СБП)
- Success/failure states

### 10. Profile Screen (P1)
- Name, avatar, type
- Subscription management
- Payment history
- Data deletion (152-ФЗ)
- Language settings

### 11. Expert Dashboard (WebView)
- Embedded for experts
- Review queue
- Verdict interface

## On-Device ML
- **Calibration helper:** TensorFlow Lite model (≈5MB) for coin/card detection
- **Quality checks:** OpenCV + custom algorithms (blur, lux, glare)
- **SNR check:** Real-time audio analysis before upload

## Offline Capability
- Cache projects locally (SQLite/MM KV)
- Queue uploads when online
- Draft projects work offline

## Performance Targets
- App launch: <2 seconds
- Camera open: <1 second
- Photo processing: <500ms per image
- Audio analysis (on-device): <200ms per tap
- Upload resume: support for interrupted uploads
