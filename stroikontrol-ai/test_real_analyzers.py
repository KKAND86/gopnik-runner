"""Test real analyzers with synthetic tile data."""
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent / "backend"))

import numpy as np
import cv2
from app.core.ml_inference import get_inference_engine

# --- Create synthetic tile image with defects ---
img = np.full((600, 800, 3), 200, dtype=np.uint8)  # light gray base

# Draw tile grid (3x4 tiles)
for i in range(4):
    cv2.line(img, (i * 200, 0), (i * 200, 600), (160, 160, 160), 4)
for j in range(3):
    cv2.line(img, (0, j * 200), (800, j * 200), (160, 160, 160), 4)

# Add tile colors
for i in range(4):
    for j in range(3):
        color = (180 + i * 5, 180 + j * 5, 190)
        cv2.rectangle(img, (i * 200 + 4, j * 200 + 4), ((i + 1) * 200 - 4, (j + 1) * 200 - 4), color, -1)

# Add a CRACK (thin dark line)
cv2.line(img, (250, 100), (280, 300), (40, 40, 40), 2)

# Add a VOID (smooth lighter patch — different texture)
cv2.rectangle(img, (420, 220), (580, 380), (220, 220, 220), -1)
cv2.rectangle(img, (422, 222), (578, 378), (225, 225, 225), -1)

# Add a CHIP (missing corner)
cv2.fillConvexPoly(img, np.array([[650, 450], [700, 450], [680, 500]]), (120, 120, 120))

# Save test image
test_dir = Path("test_data")
test_dir.mkdir(exist_ok=True)
img_path = test_dir / "tile_with_defects.jpg"
cv2.imwrite(str(img_path), img)
print(f"Created test image: {img_path}")

# --- Run CV analysis ---
engine = get_inference_engine()
cv_result = engine.predict_image(str(img_path))
print("\n=== CV ANALYSIS ===")
print(f"Defect probability: {cv_result['defect_probability']}")
print(f"Prediction: {cv_result['prediction']}")
print(f"Confidence: {cv_result['confidence']}")
print(f"Defects found: {len(cv_result.get('defects', []))}")
for d in cv_result.get('defects', []):
    print(f"  - {d['defect_type']} ({d['severity']}): conf={d['confidence']:.2f}")

# --- Create synthetic audio ---
sr = 44100
duration = 0.5

# Solid tap: short high-frequency burst
solid = np.zeros(int(sr * duration))
t = np.linspace(0, duration, len(solid))
# Sharp attack, quick decay
envelope = np.exp(-t * 30)
solid += envelope * np.sin(2 * np.pi * 2500 * t)
solid += 0.3 * envelope * np.sin(2 * np.pi * 4000 * t)
solid += np.random.normal(0, 0.001, len(solid))

# Hollow tap: lower frequency, longer resonance
hollow = np.zeros(int(sr * duration))
t = np.linspace(0, duration, len(hollow))
envelope = np.exp(-t * 8)  # slower decay
hollow += envelope * np.sin(2 * np.pi * 400 * t)
hollow += 0.5 * envelope * np.sin(2 * np.pi * 600 * t)
hollow += np.random.normal(0, 0.001, len(hollow))

# Save audio files
import soundfile as sf
solid_path = test_dir / "solid_tap.wav"
hollow_path = test_dir / "hollow_tap.wav"
sf.write(str(solid_path), solid, sr)
sf.write(str(hollow_path), hollow, sr)
print(f"\nCreated test audio: {solid_path}, {hollow_path}")

# --- Run Audio analysis ---
solid_res = engine.predict_audio(str(solid_path))
hollow_res = engine.predict_audio(str(hollow_path))
print("\n=== AUDIO ANALYSIS ===")
print(f"Solid tap:  prob={solid_res['debond_probability']:.3f}  pred={solid_res['prediction']}  conf={solid_res['confidence']:.3f}")
print(f"Hollow tap: prob={hollow_res['debond_probability']:.3f}  pred={hollow_res['prediction']}  conf={hollow_res['confidence']:.3f}")

# --- Full project analysis ---
full = engine.analyze_project([str(img_path)], [str(hollow_path)])
print(f"\n=== PROJECT ANALYSIS ===")
print(f"Risk score: {full['combined']['risk_score']:.1f}/100")
print(f"Prediction: {full['combined']['prediction']}")
print(f"Recommendation: {full['recommendation']}")
print(f"Total defects: {len(full['defects'])}")
