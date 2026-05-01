import subprocess
import sys

print("="*60)
print("STROYKONTROL AI - Production Dataset Generation")
print("="*60)

# Step 1: Generate CV dataset
print("\n[1/3] Generating CV dataset (200 normal + 200 defective)...")
cv_result = subprocess.run(
    [sys.executable, "scripts/generate_production_cv.py", 
     "--normal", "200", "--defective", "200"],
    capture_output=True, text=True
)
print(cv_result.stdout)
if cv_result.returncode != 0:
    print("CV generation failed:", cv_result.stderr)

# Step 2: Generate Audio dataset
print("\n[2/3] Generating Audio dataset (50 intact + 50 debonded)...")
audio_result = subprocess.run(
    [sys.executable, "scripts/generate_production_audio.py",
     "--intact", "50", "--debonded", "50"],
    capture_output=True, text=True
)
print(audio_result.stdout)
if audio_result.returncode != 0:
    print("Audio generation failed:", audio_result.stderr)

# Step 3: Train models on production data
print("\n[3/3] Training models on production data...")

# Update train script to use new paths
import os
os.environ["CV_DATASET"] = "datasets/cv/real-photos"
os.environ["AUDIO_DATASET"] = "datasets/audio/real-recordings"

train_result = subprocess.run(
    [sys.executable, "scripts/train_models.py", "--mode", "all"],
    capture_output=True, text=True
)
print(train_result.stdout)
if train_result.returncode != 0:
    print("Training failed:", train_result.stderr)

print("\n" + "="*60)
print("DONE - Production models trained")
print("="*60)
