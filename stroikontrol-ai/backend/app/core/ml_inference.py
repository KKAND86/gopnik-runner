"""
ML Inference module for StroyKontrol AI backend.
Tiers:
  1. TensorFlow trained models (best accuracy)
  2. OpenCV + librosa real analyzers (real signal processing, no random)
  3. MockInference (last resort, random data)
"""

import os
import json
from pathlib import Path
from typing import Dict, List, Optional
import numpy as np

# OpenCV (needed for _extract_sklearn_cv_features)
try:
    import cv2
    CV2_IMPORT = True
except ImportError:
    CV2_IMPORT = False

# TensorFlow
try:
    import tensorflow as tf
    from PIL import Image
    TF_AVAILABLE = True
except ImportError:
    TF_AVAILABLE = False

# Real analyzers
try:
    from app.core.real_analyzers import RealCVAnalyzer, RealAudioAnalyzer, CV2_AVAILABLE, LIBROSA_AVAILABLE
except ImportError:
    CV2_AVAILABLE = False
    LIBROSA_AVAILABLE = False
    RealCVAnalyzer = None
    RealAudioAnalyzer = None

# Librosa for TF audio features
try:
    import librosa
    LIBROSA_TF_AVAILABLE = True
except ImportError:
    LIBROSA_TF_AVAILABLE = False

BASE_DIR = Path(__file__).parent.parent.parent.parent
MODELS_DIR = BASE_DIR / "models"
# Docker compatibility: models may be at /app/models instead of /models
if not MODELS_DIR.exists():
    docker_models = Path("/app") / "models"
    if docker_models.exists():
        MODELS_DIR = docker_models

# ------------------------------------------------------------------
# MOCK FALLBACK — random data, only if nothing else works
# ------------------------------------------------------------------
import random

class MockInference:
    """Last-resort fallback with realistic-looking random results."""

    def __init__(self):
        random.seed(42)
        self._defect_types = ["uneven_joint", "step_height", "missing_joint", "chip", "crack", "void"]
        self._regulations = {
            "uneven_joint": ["СНиП 3.04.01-87", "СП 71.13330.2017"],
            "step_height": ["СНиП 3.04.01-87", "ГОСТ 6787-2001"],
            "missing_joint": ["СНиП 3.04.01-87"],
            "chip": ["ГОСТ 6787-2001"],
            "crack": ["СНиП 3.04.01-87", "ГОСТ 6787-2001"],
            "void": ["СП 71.13330.2017"],
        }

    def analyze_project(self, image_paths: List[str], audio_paths: List[str]) -> Dict:
        n_images = len(image_paths)
        n_audio = len(audio_paths)

        # Random but deterministic via seed
        is_defective = random.random() < 0.35 if n_images > 0 else False
        is_debonded = random.random() < 0.30 if n_audio > 0 else False

        avg_cv_prob = random.uniform(0.55, 0.85) if is_defective else random.uniform(0.05, 0.25)
        avg_audio_prob = random.uniform(0.50, 0.80) if is_debonded else random.uniform(0.05, 0.30)

        risk_score = float((0.4 * avg_cv_prob + 0.6 * avg_audio_prob) * 100)

        defects = []
        if is_defective and n_images > 0:
            for _ in range(random.randint(1, 3)):
                d_type = random.choice(self._defect_types)
                sev = random.choices(['critical', 'warning', 'info'], weights=[0.2, 0.5, 0.3])[0]
                defects.append({
                    'defect_type': d_type,
                    'severity': sev,
                    'confidence': round(random.uniform(0.6, 0.95), 4),
                    'measured_value_mm': round(random.uniform(0.5, 5.0), 2) if sev != 'info' else None,
                    'threshold_mm': 2.0,
                    'regulation_refs': self._regulations.get(d_type, []),
                    'bbox': {
                        'x': round(random.uniform(0.1, 0.7), 3),
                        'y': round(random.uniform(0.1, 0.7), 3),
                        'w': round(random.uniform(0.05, 0.25), 3),
                        'h': round(random.uniform(0.05, 0.25), 3),
                    } if sev != 'info' else None,
                })

        if risk_score < 30:
            prediction = 'pass'
            recommendation = 'Качество укладки в норме. Дефекты не обнаружены.'
        elif risk_score < 70:
            prediction = 'warning'
            recommendation = 'Обнаружены признаки дефектов. Рекомендуется локальная проверка проблемных зон.'
        else:
            prediction = 'fail'
            recommendation = 'Выявлены значительные дефекты. Требуется экспертная оценка и возможный демонтаж.'

        return {
            'cv_results': [],
            'audio_results': [],
            'defects': defects,
            'combined': {
                'defect_probability': round(avg_cv_prob, 4),
                'debond_probability': round(avg_audio_prob, 4),
                'risk_score': round(risk_score, 2),
                'prediction': prediction,
            },
            'recommendation': recommendation,
        }


# ------------------------------------------------------------------
# ML INFERENCE — tiered fallback: TF → Real CV/Audio → Mock
# ------------------------------------------------------------------

class MLInference:
    """Combined CV + Audio inference with tiered fallback."""

    def __init__(self, cv_model_path: Optional[str] = None, audio_model_path: Optional[str] = None):
        self.cv_model = None
        self.audio_model = None
        self._tf_available = TF_AVAILABLE
        self._real_cv = None
        self._real_audio = None
        self._mock = None
        self._sklearn_cv = None
        self._sklearn_cv_scaler = None
        self._sklearn_audio = None
        self._sklearn_audio_scaler = None

        # --- Tier 0: Trained sklearn models (best if available) ---
        self._load_sklearn_models()

        # --- Tier 1: TensorFlow models ---
        if self.cv_model is None and self.audio_model is None and self._tf_available:
            if cv_model_path is None:
                cv_model_path = MODELS_DIR / "cv" / "tile_defect_classifier.keras"
            if audio_model_path is None:
                audio_model_path = MODELS_DIR / "audio" / "tile_tap_defect_detector.keras"
            self._load_tf_models(cv_model_path, audio_model_path)

        # --- Tier 2: Real OpenCV / librosa analyzers ---
        if self.cv_model is None and self._sklearn_cv is None and CV2_AVAILABLE and RealCVAnalyzer:
            try:
                self._real_cv = RealCVAnalyzer()
                print("[ML] RealCVAnalyzer loaded (OpenCV)")
            except Exception as e:
                print(f"[ML] RealCVAnalyzer failed: {e}")

        if self.audio_model is None and self._sklearn_audio is None and LIBROSA_AVAILABLE and RealAudioAnalyzer:
            try:
                self._real_audio = RealAudioAnalyzer()
                print("[ML] RealAudioAnalyzer loaded (librosa)")
            except Exception as e:
                print(f"[ML] RealAudioAnalyzer failed: {e}")

        # --- Tier 3: Mock ---
        has_cv = self.cv_model or self._sklearn_cv or self._real_cv
        has_audio = self.audio_model or self._sklearn_audio or self._real_audio
        if not has_cv or not has_audio:
            print("[ML] Some engines missing — MockInference ready as fallback")

    def _load_sklearn_models(self):
        """Load trained scikit-learn models if available."""
        # CV sklearn model
        cv_pkl = MODELS_DIR / "cv" / "tile_defect_classifier.pkl"
        cv_scaler = MODELS_DIR / "cv" / "scaler.pkl"
        if cv_pkl.exists() and cv_scaler.exists():
            try:
                import pickle
                with open(cv_pkl, 'rb') as f:
                    self._sklearn_cv = pickle.load(f)
                with open(cv_scaler, 'rb') as f:
                    self._sklearn_cv_scaler = pickle.load(f)
                print("[ML] Sklearn CV model loaded")
            except Exception as e:
                print(f"[ML] Sklearn CV load failed: {e}")

        # Audio sklearn model
        audio_pkl = MODELS_DIR / "audio" / "tile_tap_defect_detector.pkl"
        audio_scaler = MODELS_DIR / "audio" / "scaler.pkl"
        if audio_pkl.exists() and audio_scaler.exists():
            try:
                import pickle
                with open(audio_pkl, 'rb') as f:
                    self._sklearn_audio = pickle.load(f)
                with open(audio_scaler, 'rb') as f:
                    self._sklearn_audio_scaler = pickle.load(f)
                print("[ML] Sklearn Audio model loaded")
            except Exception as e:
                print(f"[ML] Sklearn Audio load failed: {e}")

    def _load_tf_models(self, cv_path: Path, audio_path: Path):
        cv_path = Path(cv_path)
        if cv_path.exists():
            try:
                self.cv_model = tf.keras.models.load_model(str(cv_path))
                print(f"[ML] TF CV model loaded: {cv_path.name}")
            except Exception as e:
                print(f"[ML] TF CV load failed: {e}")

        audio_path = Path(audio_path)
        if audio_path.exists():
            try:
                self.audio_model = tf.keras.models.load_model(str(audio_path))
                print(f"[ML] TF Audio model loaded: {audio_path.name}")
            except Exception as e:
                print(f"[ML] TF Audio load failed: {e}")

    # --- CV inference ------------------------------------------------
    def _extract_sklearn_cv_features(self, image_path: str) -> np.ndarray:
        """Extract features matching train_sklearn_models.py format."""
        img = cv2.imread(image_path)
        if img is None:
            return None
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        h, w = gray.shape
        features = []
        # Basic stats
        features.extend([float(np.mean(gray)), float(np.std(gray)), float(np.min(gray)), float(np.max(gray))])
        # Edge density
        edges = cv2.Canny(gray, 50, 150)
        features.append(float(np.sum(edges > 0) / (h * w)))
        # Edge direction histogram
        sobelx = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=3)
        sobely = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=3)
        magnitude = np.sqrt(sobelx**2 + sobely**2)
        angle = np.arctan2(sobely, sobelx) * 180 / np.pi
        angle_hist, _ = np.histogram(angle[magnitude > 10], bins=8, range=(-180, 180))
        features.extend(angle_hist.astype(float).tolist())
        # Texture
        local_var = cv2.blur(gray.astype(np.float32)**2, (5,5)) - cv2.blur(gray.astype(np.float32), (5,5))**2
        features.extend([float(np.mean(local_var)), float(np.std(local_var))])
        # LAB color
        lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
        for i in range(3):
            features.extend([float(np.mean(lab[:,:,i])), float(np.std(lab[:,:,i]))])
        # Contours
        contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        features.extend([float(len(contours)), float(np.mean([cv2.contourArea(c) for c in contours]) if contours else 0), float(np.std([cv2.contourArea(c) for c in contours]) if contours else 0)])
        # FFT
        fft = np.fft.fft2(gray)
        fft_mag = np.abs(fft)
        features.extend([float(np.mean(fft_mag)), float(np.std(fft_mag)), float(np.percentile(fft_mag, 95))])
        # Laplacian
        features.append(float(cv2.Laplacian(gray, cv2.CV_64F).var()))
        # Grid variance
        grid_h, grid_w = h // 3, w // 3
        for i in range(3):
            for j in range(3):
                patch = gray[i*grid_h:(i+1)*grid_h, j*grid_w:(j+1)*grid_w]
                features.append(float(np.var(patch)))
        return np.array(features, dtype=np.float32)

    def _predict_cv_sklearn(self, image_path: str) -> Dict:
        feat = self._extract_sklearn_cv_features(image_path)
        if feat is None:
            return {'error': 'Could not read image'}
        feat_scaled = self._sklearn_cv_scaler.transform(feat.reshape(1, -1))
        prob = self._sklearn_cv.predict_proba(feat_scaled)[0][1]
        return {
            'defect_probability': float(prob),
            'prediction': 'defective' if prob > 0.5 else 'normal',
            'confidence': float(max(prob, 1 - prob)),
        }

    def _predict_cv_tf(self, image_path: str) -> Dict:
        try:
            img = Image.open(image_path).convert('RGB').resize((224, 224))
            img_array = np.array(img) / 255.0
            prob = self.cv_model.predict(np.expand_dims(img_array, axis=0), verbose=0)[0][0]
            prediction = 'defective' if prob > 0.5 else 'normal'
            defects = []
            if prediction == 'defective':
                severity = 'critical' if prob > 0.85 else 'warning' if prob > 0.6 else 'info'
                defects = [{
                    'defect_type': 'ai_detected',
                    'severity': severity,
                    'confidence': float(prob),
                    'bbox': {'x': 0.1, 'y': 0.1, 'width': 0.8, 'height': 0.8},
                    'measured_value_mm': None,
                    'threshold_mm': None,
                }]
            return {
                'defect_probability': float(prob),
                'prediction': prediction,
                'confidence': float(max(prob, 1 - prob)),
                'defects': defects,
            }
        except Exception as e:
            return {'error': str(e)}

    def _predict_cv_real(self, image_path: str) -> Dict:
        return self._real_cv.analyze(image_path)

    def predict_image(self, image_path: str) -> Dict:
        # Tier 1: TensorFlow (trained on real data, best accuracy)
        if self.cv_model and self._tf_available:
            return self._predict_cv_tf(image_path)
        # Tier 2: sklearn (fallback)
        # Tier 1: TensorFlow (trained on real data)
        if self.cv_model and self._tf_available:
            return self._predict_cv_tf(image_path)
        # Tier 2: sklearn (fallback)
        if self._sklearn_cv:
            return self._predict_cv_sklearn(image_path)
        # Tier 3: Real OpenCV analyzers
        if self._real_cv:
            return self._predict_cv_real(image_path)
        return {'error': 'No CV engine'}

    def predict_images_batch(self, image_paths: List[str]) -> List[Dict]:
        return [self.predict_image(p) for p in image_paths]

    # --- Audio inference ---------------------------------------------
    def _extract_sklearn_audio_features(self, audio_path: str) -> np.ndarray:
        """Extract features matching train_sklearn_models.py format."""
        try:
            audio, sr = librosa.load(audio_path, sr=44100, mono=True)
        except Exception:
            return None
        if len(audio) < sr * 0.05:
            return None
        features = []
        # RMS
        rms = librosa.feature.rms(y=audio)[0]
        features.extend([float(np.mean(rms)), float(np.std(rms)), float(np.max(rms))])
        # Spectral
        spec_cent = librosa.feature.spectral_centroid(y=audio, sr=sr)[0]
        spec_rolloff = librosa.feature.spectral_rolloff(y=audio, sr=sr)[0]
        spec_bw = librosa.feature.spectral_bandwidth(y=audio, sr=sr)[0]
        zcr = librosa.feature.zero_crossing_rate(audio)[0]
        features.extend([float(np.mean(spec_cent)), float(np.std(spec_cent)), float(np.mean(spec_rolloff)), float(np.std(spec_rolloff)), float(np.mean(spec_bw)), float(np.std(spec_bw)), float(np.mean(zcr)), float(np.std(zcr))])
        # MFCC
        mfcc = librosa.feature.mfcc(y=audio, sr=sr, n_mfcc=13, n_mels=26, n_fft=2048, hop_length=512)
        features.extend(np.mean(mfcc, axis=1).tolist())
        features.extend(np.std(mfcc, axis=1).tolist())
        delta = librosa.feature.delta(mfcc)
        features.extend(np.mean(delta, axis=1).tolist())
        features.extend(np.std(delta, axis=1).tolist())
        # Contrast + chroma
        contrast = librosa.feature.spectral_contrast(y=audio, sr=sr)[0]
        features.extend([float(np.mean(contrast)), float(np.std(contrast))])
        chroma = librosa.feature.chroma_stft(y=audio, sr=sr)[0]
        features.extend([float(np.mean(chroma)), float(np.std(chroma))])
        # Decay
        peak_idx = np.argmax(rms)
        decay_50 = np.argmax(rms[peak_idx:] < 0.5 * rms[peak_idx]) if any(rms[peak_idx:] < 0.5 * rms[peak_idx]) else len(rms) - peak_idx
        decay_10 = np.argmax(rms[peak_idx:] < 0.1 * rms[peak_idx]) if any(rms[peak_idx:] < 0.1 * rms[peak_idx]) else len(rms) - peak_idx
        features.extend([float(decay_50) * 512 / sr, float(decay_10) * 512 / sr])
        # Band ratios
        fft = np.fft.rfft(audio)
        freqs = np.fft.rfftfreq(len(audio), 1 / sr)
        power = np.abs(fft) ** 2
        def band_ratio(low, high):
            mask = (freqs >= low) & (freqs < high)
            return float(np.sum(power[mask]) / max(1, np.sum(power)))
        features.extend([band_ratio(50, 500), band_ratio(500, 2000), band_ratio(2000, 8000)])
        return np.array(features, dtype=np.float32)

    def _predict_audio_sklearn(self, audio_path: str) -> Dict:
        feat = self._extract_sklearn_audio_features(audio_path)
        if feat is None:
            return {'error': 'Could not read audio'}
        feat_scaled = self._sklearn_audio_scaler.transform(feat.reshape(1, -1))
        prob = self._sklearn_audio.predict_proba(feat_scaled)[0][1]
        return {
            'debond_probability': float(prob),
            'prediction': 'debonded' if prob > 0.5 else 'intact',
            'confidence': float(max(prob, 1 - prob)),
        }

    def _predict_audio_tf(self, audio_path: str) -> Dict:
        if not LIBROSA_TF_AVAILABLE:
            return {'error': 'librosa not installed'}
        try:
            audio, sr = librosa.load(audio_path, sr=44100)
            mfcc = librosa.feature.mfcc(y=audio, sr=sr, n_mfcc=13, n_mels=26, n_fft=2048, hop_length=512)
            delta = librosa.feature.delta(mfcc)
            delta2 = librosa.feature.delta(mfcc, order=2)
            mfcc_full = np.vstack([mfcc, delta, delta2])
            spec = librosa.feature.melspectrogram(y=audio, sr=sr, n_fft=2048, hop_length=512, n_mels=128)
            spec_db = librosa.power_to_db(spec, ref=np.max)

            target_frames = 87
            mfcc_pad = np.pad(mfcc_full, ((0, 0), (0, max(0, target_frames - mfcc_full.shape[1]))))[:, :target_frames]
            spec_pad = np.pad(spec_db, ((0, 0), (0, max(0, target_frames - spec_db.shape[1]))))[:, :target_frames]

            mfcc_batch = np.expand_dims(mfcc_pad, axis=(0, -1))
            spec_batch = np.expand_dims(spec_pad, axis=(0, -1))
            prob = self.audio_model.predict([mfcc_batch, spec_batch], verbose=0)[0][0]
            return {
                'debond_probability': float(prob),
                'prediction': 'debonded' if prob > 0.5 else 'intact',
                'confidence': float(max(prob, 1 - prob)),
            }
        except Exception as e:
            return {'error': str(e)}

    def _predict_audio_real(self, audio_path: str) -> Dict:
        return self._real_audio.analyze(audio_path)

    def predict_audio(self, audio_path: str) -> Dict:
        # Tier 1: TensorFlow (trained on real data, best accuracy)
        if self.audio_model and self._tf_available:
            return self._predict_audio_tf(audio_path)
        # Tier 2: sklearn (fallback)
        if self._sklearn_audio:
            return self._predict_audio_sklearn(audio_path)
        # Tier 3: Real librosa analyzers
        if self._real_audio:
            return self._predict_audio_real(audio_path)
        return {'error': 'No Audio engine'}

    def predict_audio_batch(self, audio_paths: List[str]) -> List[Dict]:
        return [self.predict_audio(p) for p in audio_paths]

    # --- Combined project analysis ------------------------------------
    def analyze_project(self, image_paths: List[str], audio_paths: List[str]) -> Dict:
        # Try real engines first
        cv_results = self.predict_images_batch(image_paths) if image_paths else []
        audio_results = self.predict_audio_batch(audio_paths) if audio_paths else []

        # Collect defects from real CV analyzer
        all_defects = []
        for r in cv_results:
            if 'defects' in r and isinstance(r['defects'], list):
                all_defects.extend(r['defects'])

        cv_probs = [r.get('defect_probability', 0) for r in cv_results if 'defect_probability' in r]
        audio_probs = [r.get('debond_probability', 0) for r in audio_results if 'debond_probability' in r]

        avg_cv = float(np.mean(cv_probs)) if cv_probs else 0.0
        avg_audio = float(np.mean(audio_probs)) if audio_probs else 0.0
        risk_score = float((0.4 * avg_cv + 0.6 * avg_audio) * 100)

        if risk_score < 30:
            prediction = 'pass'
            rec = 'Качество укладки в норме. Дефекты не обнаружены.'
        elif risk_score < 70:
            prediction = 'warning'
            rec = 'Обнаружены признаки дефектов. Рекомендуется локальная проверка проблемных зон.'
        else:
            prediction = 'fail'
            rec = 'Выявлены значительные дефекты. Требуется экспертная оценка и возможный демонтаж.'

        return {
            'cv_results': cv_results,
            'audio_results': audio_results,
            'defects': all_defects,
            'combined': {
                'defect_probability': avg_cv,
                'debond_probability': avg_audio,
                'risk_score': risk_score,
                'prediction': prediction,
            },
            'recommendation': rec,
        }


# Singleton
_inference_engine: Optional[MLInference] = None

def get_inference_engine() -> MLInference:
    global _inference_engine
    if _inference_engine is None:
        _inference_engine = MLInference()
    return _inference_engine
