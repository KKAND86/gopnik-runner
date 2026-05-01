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

        # --- Tier 1: TensorFlow models ---
        if self._tf_available:
            if cv_model_path is None:
                cv_model_path = MODELS_DIR / "cv" / "tile_defect_classifier.keras"
            if audio_model_path is None:
                audio_model_path = MODELS_DIR / "audio" / "tile_tap_defect_detector.keras"
            self._load_tf_models(cv_model_path, audio_model_path)

        # --- Tier 2: Real OpenCV / librosa analyzers ---
        if self.cv_model is None and CV2_AVAILABLE and RealCVAnalyzer:
            try:
                self._real_cv = RealCVAnalyzer()
                print("[ML] RealCVAnalyzer loaded (OpenCV)")
            except Exception as e:
                print(f"[ML] RealCVAnalyzer failed: {e}")

        if self.audio_model is None and LIBROSA_AVAILABLE and RealAudioAnalyzer:
            try:
                self._real_audio = RealAudioAnalyzer()
                print("[ML] RealAudioAnalyzer loaded (librosa)")
            except Exception as e:
                print(f"[ML] RealAudioAnalyzer failed: {e}")

        # --- Tier 3: Mock ---
        if self.cv_model is None and self._real_cv is None:
            print("[ML] No CV engine available — MockInference ready")
        if self.audio_model is None and self._real_audio is None:
            print("[ML] No Audio engine available — MockInference ready")

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
    def _predict_cv_tf(self, image_path: str) -> Dict:
        try:
            img = Image.open(image_path).convert('RGB').resize((224, 224))
            img_array = np.array(img) / 255.0
            prob = self.cv_model.predict(np.expand_dims(img_array, axis=0), verbose=0)[0][0]
            return {
                'defect_probability': float(prob),
                'prediction': 'defective' if prob > 0.5 else 'normal',
                'confidence': float(max(prob, 1 - prob)),
            }
        except Exception as e:
            return {'error': str(e)}

    def _predict_cv_real(self, image_path: str) -> Dict:
        return self._real_cv.analyze(image_path)

    def predict_image(self, image_path: str) -> Dict:
        if self.cv_model:
            return self._predict_cv_tf(image_path)
        if self._real_cv:
            return self._predict_cv_real(image_path)
        return {'error': 'No CV engine'}

    def predict_images_batch(self, image_paths: List[str]) -> List[Dict]:
        return [self.predict_image(p) for p in image_paths]

    # --- Audio inference ---------------------------------------------
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
        if self.audio_model:
            return self._predict_audio_tf(audio_path)
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
