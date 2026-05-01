# СтройКонтроль AI — Training Scripts

## Data Pipeline

### 1. Image Annotation
- Label Studio / CVAT for bounding boxes
- Classes: uneven_joint, step_height, missing_joint, crack, chip, wrong_color
- Export: COCO format → YOLO format

### 2. Audio Annotation
- Audacity for waveform annotation
- Classes: normal, void
- Segments: per tap (approx 500ms each)

### 3. Inter-Annotator Agreement
```python
from sklearn.metrics import cohen_kappa_score

kappa = cohen_kappa_score(annotator_a, annotator_b)
assert kappa >= 0.8, "Low agreement — needs third expert"
```

## Model Training

### YOLOv8 (CV)
```bash
yolo detect train \
  data=tile_defects.yaml \
  model=yolov8m.pt \
  epochs=200 \
  imgsz=1280 \
  batch=16 \
  device=0
```

### Audio CNN (PyTorch)
```bash
python training/train_audio.py \
  --data_dir ./datasets/audio_v2 \
  --epochs 100 \
  --batch_size 32 \
  --lr 0.001 \
  --device cuda
```

### Scene Classifier
```bash
python training/train_scene.py \
  --data_dir ./datasets/scenes \
  --model efficientnet-b0 \
  --epochs 50
```

## Validation

| Metric | Target | Test Set |
|--------|--------|----------|
| CV Precision (lab) | ≥85% | 500 images |
| CV Recall (lab) | ≥80% | 500 images |
| CV Precision (field) | ≥75% | 200 images |
| CV Recall (field) | ≥70% | 200 images |
| Audio Accuracy | ≥85% | 300 taps from 10+ devices |
| Scene Accuracy | ≥90% | 300 images |

## Active Learning Loop

1. Collect disputed predictions (user clicks "ИИ ошибся?")
2. Expert reviews and corrects
3. Add to training dataset
4. Retrain model weekly (initial phase) / monthly (stable phase)
5. A/B test new model vs production
6. Deploy if metrics improve ≥2%

## Data Augmentation

### Images
- Random rotation ±15°
- Brightness/contrast jitter
- Perspective warp (simulates camera angle)
- Gaussian noise (simulates low-light)
- Mosaic augmentation

### Audio
- Time stretching (0.9x - 1.1x)
- Pitch shifting (±2 semitones)
- Add background noise (mix with real construction sounds)
- Volume normalization
