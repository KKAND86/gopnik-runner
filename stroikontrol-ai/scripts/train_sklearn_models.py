"""
Train ML models for tile defect detection using scikit-learn.
Uses feature extraction from OpenCV/librosa + sklearn classifiers.

Usage:
    cd backend
    python -m scripts.train_sklearn_models
"""

import os
import sys
import json
import pickle
import random
from pathlib import Path
from datetime import datetime
from collections import Counter

import numpy as np
import cv2
import librosa

from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.svm import SVC
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    classification_report, confusion_matrix, roc_auc_score,
    accuracy_score, precision_score, recall_score, f1_score
)
from sklearn.preprocessing import StandardScaler

BASE_DIR = Path(__file__).parent.parent
MODELS_DIR = BASE_DIR / "models"
DATASETS_DIR = BASE_DIR / "datasets"

MODELS_DIR.mkdir(parents=True, exist_ok=True)

# =============================================================================
# CV MODEL TRAINING
# =============================================================================

def extract_cv_features(image_path: str) -> np.ndarray:
    """Extract hand-crafted features from tile image for ML training."""
    img = cv2.imread(image_path)
    if img is None:
        return None
    
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    h, w = gray.shape
    
    features = []
    
    # 1. Basic statistics
    features.extend([
        float(np.mean(gray)),
        float(np.std(gray)),
        float(np.min(gray)),
        float(np.max(gray)),
    ])
    
    # 2. Edge density (Canny)
    edges = cv2.Canny(gray, 50, 150)
    edge_density = np.sum(edges > 0) / (h * w)
    features.append(float(edge_density))
    
    # 3. Edge direction histogram (HOG-like)
    sobelx = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=3)
    sobely = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=3)
    magnitude = np.sqrt(sobelx**2 + sobely**2)
    angle = np.arctan2(sobely, sobelx) * 180 / np.pi
    
    # 8-bin histogram of edge orientations
    angle_hist, _ = np.histogram(angle[magnitude > 10], bins=8, range=(-180, 180))
    features.extend(angle_hist.astype(float).tolist())
    
    # 4. Texture features (GLCM-like via local stats)
    # Mean and std of local variance
    local_var = cv2.blur(gray.astype(np.float32)**2, (5,5)) - cv2.blur(gray.astype(np.float32), (5,5))**2
    features.extend([
        float(np.mean(local_var)),
        float(np.std(local_var)),
    ])
    
    # 5. Color features (if color image)
    lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
    for i in range(3):
        features.extend([
            float(np.mean(lab[:,:,i])),
            float(np.std(lab[:,:,i])),
        ])
    
    # 6. Contour features
    contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    features.extend([
        float(len(contours)),  # number of contours
        float(np.mean([cv2.contourArea(c) for c in contours]) if contours else 0),
        float(np.std([cv2.contourArea(c) for c in contours]) if contours else 0),
    ])
    
    # 7. Frequency domain (FFT magnitude stats)
    fft = np.fft.fft2(gray)
    fft_mag = np.abs(fft)
    features.extend([
        float(np.mean(fft_mag)),
        float(np.std(fft_mag)),
        float(np.percentile(fft_mag, 95)),
    ])
    
    # 8. Laplacian variance (sharpness/blur measure)
    lap_var = cv2.Laplacian(gray, cv2.CV_64F).var()
    features.append(float(lap_var))
    
    # 9. Grid-based variance (tile uniformity)
    grid_h, grid_w = h // 3, w // 3
    grid_vars = []
    for i in range(3):
        for j in range(3):
            patch = gray[i*grid_h:(i+1)*grid_h, j*grid_w:(j+1)*grid_w]
            grid_vars.append(float(np.var(patch)))
    features.extend(grid_vars)
    
    return np.array(features, dtype=np.float32)


def load_cv_dataset(dataset_dir: Path) -> Tuple[np.ndarray, np.ndarray, List[str]]:
    """Load CV dataset from normal/defective subdirectories."""
    features = []
    labels = []
    paths = []
    
    normal_dir = dataset_dir / "normal"
    defective_dir = dataset_dir / "defective"
    
    # Load normal
    if normal_dir.exists():
        for img_path in sorted(normal_dir.glob("*.jpg")):
            feat = extract_cv_features(str(img_path))
            if feat is not None:
                features.append(feat)
                labels.append(0)  # 0 = normal
                paths.append(str(img_path))
    
    # Load defective
    if defective_dir.exists():
        for img_path in sorted(defective_dir.glob("*.jpg")):
            feat = extract_cv_features(str(img_path))
            if feat is not None:
                features.append(feat)
                labels.append(1)  # 1 = defective
                paths.append(str(img_path))
    
    return np.array(features), np.array(labels), paths


def train_cv_model(features: np.ndarray, labels: np.ndarray, model_type='rf') -> dict:
    """Train CV classification model."""
    print(f"\n[CV] Dataset: {len(labels)} samples")
    print(f"       Normal: {sum(labels==0)}, Defective: {sum(labels==1)}")
    
    X_train, X_test, y_train, y_test = train_test_split(
        features, labels, test_size=0.2, random_state=42, stratify=labels
    )
    
    # Scale features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    # Train model
    if model_type == 'rf':
        model = RandomForestClassifier(
            n_estimators=200,
            max_depth=15,
            min_samples_split=5,
            class_weight='balanced',
            random_state=42,
            n_jobs=-1
        )
    elif model_type == 'gb':
        model = GradientBoostingClassifier(
            n_estimators=200,
            max_depth=5,
            learning_rate=0.1,
            random_state=42
        )
    else:
        model = SVC(kernel='rbf', probability=True, class_weight='balanced', random_state=42)
    
    print(f"[CV] Training {model_type}...")
    model.fit(X_train_scaled, y_train)
    
    # Evaluate
    y_pred = model.predict(X_test_scaled)
    y_prob = model.predict_proba(X_test_scaled)[:, 1]
    
    acc = accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred)
    rec = recall_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred)
    auc = roc_auc_score(y_test, y_prob)
    
    print(f"\n[CV] Results:")
    print(f"       Accuracy:  {acc:.4f}")
    print(f"       Precision: {prec:.4f}")
    print(f"       Recall:    {rec:.4f}")
    print(f"       F1:        {f1:.4f}")
    print(f"       AUC-ROC:   {auc:.4f}")
    print(f"\n{classification_report(y_test, y_pred, target_names=['normal', 'defective'])}")
    
    return {
        'model': model,
        'scaler': scaler,
        'metrics': {
            'accuracy': acc,
            'precision': prec,
            'recall': rec,
            'f1': f1,
            'auc': auc,
        },
        'feature_count': features.shape[1],
        'train_size': len(y_train),
        'test_size': len(y_test),
    }


def save_cv_model(result: dict, model_path: Path, scaler_path: Path, meta_path: Path):
    """Save CV model, scaler, and metadata."""
    with open(model_path, 'wb') as f:
        pickle.dump(result['model'], f)
    with open(scaler_path, 'wb') as f:
        pickle.dump(result['scaler'], f)
    
    metadata = {
        'type': 'cv_sklearn',
        'model': type(result['model']).__name__,
        'metrics': result['metrics'],
        'feature_count': result['feature_count'],
        'train_size': result['train_size'],
        'test_size': result['test_size'],
        'classes': ['normal', 'defective'],
        'created_at': datetime.now().isoformat(),
    }
    with open(meta_path, 'w') as f:
        json.dump(metadata, f, indent=2)
    
    print(f"[CV] Saved to: {model_path}")


# =============================================================================
# AUDIO MODEL TRAINING
# =============================================================================

def extract_audio_features(audio_path: str, max_frames: int = 87) -> np.ndarray:
    """Extract audio features from WAV file for ML training."""
    try:
        audio, sr = librosa.load(audio_path, sr=44100, mono=True)
    except Exception:
        return None
    
    if len(audio) < sr * 0.05:
        return None
    
    features = []
    
    # 1. Temporal features
    rms = librosa.feature.rms(y=audio)[0]
    features.extend([
        float(np.mean(rms)),
        float(np.std(rms)),
        float(np.max(rms)),
    ])
    
    # 2. Spectral features
    spec_cent = librosa.feature.spectral_centroid(y=audio, sr=sr)[0]
    spec_rolloff = librosa.feature.spectral_rolloff(y=audio, sr=sr)[0]
    spec_bw = librosa.feature.spectral_bandwidth(y=audio, sr=sr)[0]
    zcr = librosa.feature.zero_crossing_rate(audio)[0]
    
    features.extend([
        float(np.mean(spec_cent)),
        float(np.std(spec_cent)),
        float(np.mean(spec_rolloff)),
        float(np.std(spec_rolloff)),
        float(np.mean(spec_bw)),
        float(np.std(spec_bw)),
        float(np.mean(zcr)),
        float(np.std(zcr)),
    ])
    
    # 3. MFCC features (13 coefficients, mean + std)
    mfcc = librosa.feature.mfcc(y=audio, sr=sr, n_mfcc=13, n_mels=26, n_fft=2048, hop_length=512)
    features.extend(np.mean(mfcc, axis=1).tolist())
    features.extend(np.std(mfcc, axis=1).tolist())
    
    # 4. Delta MFCC
    delta = librosa.feature.delta(mfcc)
    features.extend(np.mean(delta, axis=1).tolist())
    features.extend(np.std(delta, axis=1).tolist())
    
    # 5. Spectral contrast
    contrast = librosa.feature.spectral_contrast(y=audio, sr=sr)[0]
    features.extend([
        float(np.mean(contrast)),
        float(np.std(contrast)),
    ])
    
    # 6. Chroma features
    chroma = librosa.feature.chroma_stft(y=audio, sr=sr)[0]
    features.extend([
        float(np.mean(chroma)),
        float(np.std(chroma)),
    ])
    
    # 7. RMS envelope decay
    peak_idx = np.argmax(rms)
    decay_50 = np.argmax(rms[peak_idx:] < 0.5 * rms[peak_idx]) if any(rms[peak_idx:] < 0.5 * rms[peak_idx]) else len(rms) - peak_idx
    decay_10 = np.argmax(rms[peak_idx:] < 0.1 * rms[peak_idx]) if any(rms[peak_idx:] < 0.1 * rms[peak_idx]) else len(rms) - peak_idx
    features.extend([
        float(decay_50) * 512 / sr,  # convert frames to seconds
        float(decay_10) * 512 / sr,
    ])
    
    # 8. Frequency band energy ratios
    fft = np.fft.rfft(audio)
    freqs = np.fft.rfftfreq(len(audio), 1 / sr)
    power = np.abs(fft) ** 2
    
    def band_ratio(low, high):
        mask = (freqs >= low) & (freqs < high)
        return float(np.sum(power[mask]) / max(1, np.sum(power)))
    
    features.extend([
        band_ratio(50, 500),
        band_ratio(500, 2000),
        band_ratio(2000, 8000),
    ])
    
    return np.array(features, dtype=np.float32)


def load_audio_dataset(base_dir: Path) -> Tuple[np.ndarray, np.ndarray, List[str]]:
    """Load audio dataset from intact/debonded subdirectories."""
    features = []
    labels = []
    paths = []
    
    intact_dir = base_dir / "intact"
    debonded_dir = base_dir / "debonded"
    
    # Load intact
    if intact_dir.exists():
        for wav_path in sorted(intact_dir.rglob("*.wav")):
            feat = extract_audio_features(str(wav_path))
            if feat is not None:
                features.append(feat)
                labels.append(0)  # 0 = intact
                paths.append(str(wav_path))
    
    # Load debonded
    if debonded_dir.exists():
        for wav_path in sorted(debonded_dir.rglob("*.wav")):
            feat = extract_audio_features(str(wav_path))
            if feat is not None:
                features.append(feat)
                labels.append(1)  # 1 = debonded
                paths.append(str(wav_path))
    
    return np.array(features), np.array(labels), paths


def train_audio_model(features: np.ndarray, labels: np.ndarray, model_type='rf') -> dict:
    """Train audio classification model."""
    print(f"\n[AUDIO] Dataset: {len(labels)} samples")
    print(f"         Intact: {sum(labels==0)}, Debonded: {sum(labels==1)}")
    
    X_train, X_test, y_train, y_test = train_test_split(
        features, labels, test_size=0.2, random_state=42, stratify=labels
    )
    
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    if model_type == 'rf':
        model = RandomForestClassifier(
            n_estimators=300,
            max_depth=20,
            min_samples_split=3,
            class_weight='balanced',
            random_state=42,
            n_jobs=-1
        )
    elif model_type == 'gb':
        model = GradientBoostingClassifier(
            n_estimators=300,
            max_depth=6,
            learning_rate=0.08,
            random_state=42
        )
    else:
        model = SVC(kernel='rbf', probability=True, class_weight='balanced', random_state=42)
    
    print(f"[AUDIO] Training {model_type}...")
    model.fit(X_train_scaled, y_train)
    
    y_pred = model.predict(X_test_scaled)
    y_prob = model.predict_proba(X_test_scaled)[:, 1]
    
    acc = accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred)
    rec = recall_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred)
    auc = roc_auc_score(y_test, y_prob)
    
    print(f"\n[AUDIO] Results:")
    print(f"        Accuracy:  {acc:.4f}")
    print(f"        Precision: {prec:.4f}")
    print(f"        Recall:    {rec:.4f}")
    print(f"        F1:        {f1:.4f}")
    print(f"        AUC-ROC:   {auc:.4f}")
    print(f"\n{classification_report(y_test, y_pred, target_names=['intact', 'debonded'])}")
    
    return {
        'model': model,
        'scaler': scaler,
        'metrics': {
            'accuracy': acc,
            'precision': prec,
            'recall': rec,
            'f1': f1,
            'auc': auc,
        },
        'feature_count': features.shape[1],
        'train_size': len(y_train),
        'test_size': len(y_test),
    }


def save_audio_model(result: dict, model_path: Path, scaler_path: Path, meta_path: Path):
    """Save audio model, scaler, and metadata."""
    with open(model_path, 'wb') as f:
        pickle.dump(result['model'], f)
    with open(scaler_path, 'wb') as f:
        pickle.dump(result['scaler'], f)
    
    metadata = {
        'type': 'audio_sklearn',
        'model': type(result['model']).__name__,
        'metrics': result['metrics'],
        'feature_count': result['feature_count'],
        'train_size': result['train_size'],
        'test_size': result['test_size'],
        'classes': ['intact', 'debonded'],
        'created_at': datetime.now().isoformat(),
    }
    with open(meta_path, 'w') as f:
        json.dump(metadata, f, indent=2)
    
    print(f"[AUDIO] Saved to: {model_path}")


# =============================================================================
# MAIN
# =============================================================================

def main():
    print("=" * 70)
    print("StroyKontrol AI — Model Training Pipeline")
    print("=" * 70)
    
    # --- CV Training ---
    print("\n" + "=" * 70)
    print("[1] CV MODEL TRAINING")
    print("=" * 70)
    
    # Try extended-photos first (bigger dataset)
    cv_dataset = DATASETS_DIR / "cv" / "extended-photos"
    if not cv_dataset.exists() or not (cv_dataset / "normal").exists():
        cv_dataset = DATASETS_DIR / "cv" / "real-photos"
    
    # Fallback if extended-photos is corrupted
    if cv_dataset.exists():
        test_img = list((cv_dataset / "normal").glob("*.jpg"))
        if test_img and cv2.imread(str(test_img[0])) is None:
            print(f"[CV] Extended-photos corrupted, falling back to real-photos")
            cv_dataset = DATASETS_DIR / "cv" / "real-photos"
    
    if cv_dataset.exists() and (cv_dataset / "normal").exists():
        print(f"[CV] Loading dataset from: {cv_dataset}")
        X_cv, y_cv, paths_cv = load_cv_dataset(cv_dataset)
        
        if len(y_cv) > 10:
            cv_result = train_cv_model(X_cv, y_cv, model_type='rf')
            save_cv_model(
                cv_result,
                MODELS_DIR / "cv" / "tile_defect_classifier.pkl",
                MODELS_DIR / "cv" / "scaler.pkl",
                MODELS_DIR / "cv" / "metadata.json"
            )
            
            # Also train GB for comparison
            print("\n[CV] Training GradientBoosting for comparison...")
            cv_gb = train_cv_model(X_cv, y_cv, model_type='gb')
            print(f"[CV] GB F1: {cv_gb['metrics']['f1']:.4f} vs RF F1: {cv_result['metrics']['f1']:.4f}")
        else:
            print(f"[CV] Not enough data ({len(y_cv)} samples), skipping")
    else:
        print(f"[CV] Dataset not found: {cv_dataset}")
    
    # --- Audio Training ---
    print("\n" + "=" * 70)
    print("[2] AUDIO MODEL TRAINING")
    print("=" * 70)
    
    audio_dataset = DATASETS_DIR / "audio" / "real-recordings"
    
    if audio_dataset.exists():
        print(f"[AUDIO] Loading dataset from: {audio_dataset}")
        X_audio, y_audio, paths_audio = load_audio_dataset(audio_dataset)
        
        if len(y_audio) > 10:
            audio_result = train_audio_model(X_audio, y_audio, model_type='rf')
            save_audio_model(
                audio_result,
                MODELS_DIR / "audio" / "tile_tap_defect_detector.pkl",
                MODELS_DIR / "audio" / "scaler.pkl",
                MODELS_DIR / "audio" / "metadata.json"
            )
        else:
            print(f"[AUDIO] Not enough data ({len(y_audio)} samples), skipping")
    else:
        print(f"[AUDIO] Dataset not found: {audio_dataset}")
    
    # --- Summary ---
    print("\n" + "=" * 70)
    print("[DONE] Training complete")
    print("=" * 70)
    print(f"Models saved to: {MODELS_DIR}")


if __name__ == '__main__':
    main()
