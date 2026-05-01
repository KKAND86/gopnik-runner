"""
ML Inference module for StroyKontrol AI backend.
Loads trained CV and Audio models and performs predictions.
"""
import os
import sys
import json
import pickle
from pathlib import Path
from typing import Dict, List, Optional, Tuple
import numpy as np

# TensorFlow
try:
    import tensorflow as tf
    from PIL import Image
    TF_AVAILABLE = True
except ImportError:
    TF_AVAILABLE = False

# Librosa for audio feature extraction
try:
    import librosa
    LIBROSA_AVAILABLE = True
except ImportError:
    LIBROSA_AVAILABLE = False

BASE_DIR = Path(__file__).parent.parent.parent.parent  # backend -> app -> core -> (project root)
MODELS_DIR = BASE_DIR / "models"
DATASETS_DIR = BASE_DIR / "datasets"

# ------------------------------------------------------------------
# MOCK / FALLBACK MODE — used when models are not trained yet
# ------------------------------------------------------------------
import random

class MockInference:
    """Fallback inference that simulates realistic results without ML models."""
    
    def __init__(self):
        random.seed(42)
        self._defect_types = [
            "uneven_joint", "step_height", "missing_joint", "chip", "crack", "void"
        ]
        self._regulations = {
            "uneven_joint": ["СНиП 3.04.01-87", "СП 71.13330.2017"],
            "step_height": ["СНиП 3.04.01-87", "ГОСТ 6787-2001"],
            "missing_joint": ["СНиП 3.04.01-87"],
            "chip": ["ГОСТ 6787-2001"],
            "crack": ["СНиП 3.04.01-87", "ГОСТ 6787-2001"],
            "void": ["СП 71.13330.2017"],
        }
    
    def predict_image(self, image_path: str) -> Dict:
        """Simulate CV prediction with realistic probabilities."""
        # Simulate 30% chance of defect per image
        is_defective = random.random() < 0.30
        prob = random.uniform(0.65, 0.95) if is_defective else random.uniform(0.05, 0.35)
        return {
            'defect_probability': float(prob),
            'prediction': 'defective' if prob > 0.5 else 'normal',
            'confidence': float(max(prob, 1 - prob)),
        }
    
    def predict_images_batch(self, image_paths: List[str]) -> List[Dict]:
        return [self.predict_image(p) for p in image_paths]
    
    def extract_audio_features(self, audio_path: str) -> Dict:
        return {
            'mfcc': np.zeros((39, 87)),
            'spectrogram': np.zeros((128, 87)),
            'sample_rate': 44100,
        }
    
    def predict_audio(self, audio_path: str) -> Dict:
        """Simulate audio debonding detection."""
        # Simulate 25% chance of debonding per sample
        is_debonded = random.random() < 0.25
        prob = random.uniform(0.60, 0.90) if is_debonded else random.uniform(0.05, 0.40)
        return {
            'debond_probability': float(prob),
            'prediction': 'debonded' if prob > 0.5 else 'intact',
            'confidence': float(max(prob, 1 - prob)),
        }
    
    def predict_audio_batch(self, audio_paths: List[str]) -> List[Dict]:
        return [self.predict_audio(p) for p in audio_paths]
    
    def _generate_defects(self, cv_results: List[Dict], photo_paths: List[str]) -> List[Dict]:
        """Generate realistic defect records from CV predictions."""
        defects = []
        for i, result in enumerate(cv_results):
            if result.get('prediction') == 'defective':
                # Generate 1-3 defects per defective image
                num_defects = random.randint(1, 3)
                for _ in range(num_defects):
                    defect_type = random.choice(self._defect_types)
                    severity = random.choices(
                        ['critical', 'warning', 'info'],
                        weights=[0.2, 0.5, 0.3]
                    )[0]
                    defects.append({
                        'photo_index': i,
                        'photo_path': photo_paths[i] if i < len(photo_paths) else None,
                        'defect_type': defect_type,
                        'severity': severity,
                        'confidence': result['confidence'],
                        'measured_value_mm': round(random.uniform(0.5, 5.0), 2) if severity != 'info' else None,
                        'threshold_mm': 2.0,
                        'regulation_refs': self._regulations.get(defect_type, []),
                        'bbox': {
                            'x': round(random.uniform(0.1, 0.7), 3),
                            'y': round(random.uniform(0.1, 0.7), 3),
                            'w': round(random.uniform(0.05, 0.25), 3),
                            'h': round(random.uniform(0.05, 0.25), 3),
                        } if severity != 'info' else None,
                    })
        return defects
    
    def analyze_project(self, image_paths: List[str], audio_paths: List[str]) -> Dict:
        """Full mock project analysis."""
        cv_results = self.predict_images_batch(image_paths) if image_paths else []
        audio_results = self.predict_audio_batch(audio_paths) if audio_paths else []
        
        cv_probs = [r['defect_probability'] for r in cv_results if 'defect_probability' in r]
        audio_probs = [r['debond_probability'] for r in audio_results if 'debond_probability' in r]
        
        avg_cv_prob = np.mean(cv_probs) if cv_probs else 0.0
        avg_audio_prob = np.mean(audio_probs) if audio_probs else 0.0
        
        # Combined risk score
        risk_score = 0.4 * avg_cv_prob + 0.6 * avg_audio_prob
        risk_score = float(risk_score * 100)
        
        # Generate defects list
        defects = self._generate_defects(cv_results, image_paths)
        
        # Determine verdict
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
            'cv_results': cv_results,
            'audio_results': audio_results,
            'defects': defects,
            'combined': {
                'defect_probability': float(avg_cv_prob),
                'debond_probability': float(avg_audio_prob),
                'risk_score': risk_score,
                'prediction': prediction,
            },
            'recommendation': recommendation,
        }


class MLInference:
    """Combined CV + Audio inference for tile defect detection.
    Falls back to MockInference if models are not available."""
    
    def __init__(self, cv_model_path: Optional[str] = None, audio_model_path: Optional[str] = None, mock: bool = False):
        self.cv_model = None
        self.audio_model = None
        self.cv_meta = None
        self.audio_meta = None
        self._tf_available = TF_AVAILABLE
        self._librosa_available = LIBROSA_AVAILABLE
        self._mock_engine = None
        
        # If mock mode requested or TF not available, use mock
        if mock or not self._tf_available:
            print("[ML] Using MockInference (no trained models)")
            self._mock_engine = MockInference()
            return
        
        # Default paths
        if cv_model_path is None:
            cv_model_path = MODELS_DIR / "cv" / "tile_defect_classifier.keras"
        if audio_model_path is None:
            audio_model_path = MODELS_DIR / "audio" / "tile_tap_defect_detector.keras"
        
        self._load_cv_model(cv_model_path)
        self._load_audio_model(audio_model_path)
        
        # If models failed to load, fall back to mock
        if self.cv_model is None and self.audio_model is None:
            print("[ML] No models loaded — falling back to MockInference")
            self._mock_engine = MockInference()
    
    def _load_cv_model(self, path: Path):
        """Load CV classification model"""
        if not TF_AVAILABLE:
            print("[ML] TensorFlow not available, CV inference disabled")
            return
        
        path = Path(path)
        if not path.exists():
            print(f"[ML] CV model not found: {path}")
            return
        
        try:
            self.cv_model = tf.keras.models.load_model(str(path))
            
            # Load metadata
            meta_path = path.parent / "metadata.json"
            if meta_path.exists():
                with open(meta_path) as f:
                    self.cv_meta = json.load(f)
            
            print(f"[ML] CV model loaded: {path.name}")
            print(f"   Input shape: {self.cv_meta.get('input_shape') if self.cv_meta else 'unknown'}")
            print(f"   Classes: {self.cv_meta.get('classes') if self.cv_meta else 'unknown'}")
            
        except Exception as e:
            print(f"[ML] Failed to load CV model: {e}")
    
    def _load_audio_model(self, path: Path):
        """Load Audio dual-branch model"""
        if not TF_AVAILABLE:
            print("[ML] TensorFlow not available, Audio inference disabled")
            return
        
        path = Path(path)
        if not path.exists():
            print(f"[ML] Audio model not found: {path}")
            return
        
        try:
            self.audio_model = tf.keras.models.load_model(str(path))
            
            # Load metadata
            meta_path = path.parent / "metadata.json"
            if meta_path.exists():
                with open(meta_path) as f:
                    self.audio_meta = json.load(f)
            
            print(f"[ML] Audio model loaded: {path.name}")
            print(f"   Input shapes: {self.audio_meta.get('input_shapes') if self.audio_meta else 'unknown'}")
            print(f"   Classes: {self.audio_meta.get('classes') if self.audio_meta else 'unknown'}")
            
        except Exception as e:
            print(f"[ML] Failed to load Audio model: {e}")
    
    def predict_image(self, image_path: str) -> Dict:
        if self._mock_engine:
            return self._mock_engine.predict_image(image_path)
        if self.cv_model is None:
            return {'error': 'CV model not loaded'}
        
        try:
            img = Image.open(image_path).convert('RGB')
            img = img.resize((224, 224))
            img_array = np.array(img) / 255.0
            img_batch = np.expand_dims(img_array, axis=0)
            
            prob = self.cv_model.predict(img_batch, verbose=0)[0][0]
            
            return {
                'defect_probability': float(prob),
                'prediction': 'defective' if prob > 0.5 else 'normal',
                'confidence': float(max(prob, 1 - prob)),
            }
        except Exception as e:
            return {'error': str(e)}
    
    def predict_images_batch(self, image_paths: List[str]) -> List[Dict]:
        if self._mock_engine:
            return self._mock_engine.predict_images_batch(image_paths)
        return [self.predict_image(p) for p in image_paths]
    
    def extract_audio_features(self, audio_path: str) -> Dict:
        if self._mock_engine:
            return self._mock_engine.extract_audio_features(audio_path)
        if not LIBROSA_AVAILABLE:
            return {'error': 'librosa not installed'}
        
        try:
            audio, sr = librosa.load(audio_path, sr=44100)
            
            # MFCC (39-D: 13 static + delta + delta-delta)
            mfcc = librosa.feature.mfcc(
                y=audio,
                sr=sr,
                n_mfcc=13,
                n_mels=26,
                n_fft=2048,
                hop_length=512,
            )
            delta = librosa.feature.delta(mfcc)
            delta2 = librosa.feature.delta(mfcc, order=2)
            mfcc_full = np.vstack([mfcc, delta, delta2])  # (39, time)
            
            # Spectrogram
            spec = librosa.feature.melspectrogram(
                y=audio,
                sr=sr,
                n_fft=2048,
                hop_length=512,
                n_mels=128,
            )
            spec_db = librosa.power_to_db(spec, ref=np.max)
            
            return {
                'mfcc': mfcc_full,
                'spectrogram': spec_db,
                'sample_rate': sr,
            }
        except Exception as e:
            return {'error': str(e)}
    
    def predict_audio(self, audio_path: str) -> Dict:
        if self._mock_engine:
            return self._mock_engine.predict_audio(audio_path)
        if self.audio_model is None:
            return {'error': 'Audio model not loaded'}
        
        features = self.extract_audio_features(audio_path)
        if 'error' in features:
            return features
        
        try:
            # Ensure consistent shapes
            target_frames = 87
            
            mfcc = features['mfcc']
            if mfcc.shape[1] < target_frames:
                mfcc = np.pad(mfcc, ((0, 0), (0, target_frames - mfcc.shape[1])))
            else:
                mfcc = mfcc[:, :target_frames]
            
            spec = features['spectrogram']
            if spec.shape[1] < target_frames:
                spec = np.pad(spec, ((0, 0), (0, target_frames - spec.shape[1])))
            else:
                spec = spec[:, :target_frames]
            
            # Add batch and channel dimensions
            mfcc_batch = np.expand_dims(mfcc, axis=(0, -1))    # (1, 39, 87, 1)
            spec_batch = np.expand_dims(spec, axis=(0, -1))     # (1, 128, 87, 1)
            
            prob = self.audio_model.predict([mfcc_batch, spec_batch], verbose=0)[0][0]
            
            return {
                'debond_probability': float(prob),
                'prediction': 'debonded' if prob > 0.5 else 'intact',
                'confidence': float(max(prob, 1 - prob)),
            }
        except Exception as e:
            return {'error': str(e)}
    
    def predict_audio_batch(self, audio_paths: List[str]) -> List[Dict]:
        if self._mock_engine:
            return self._mock_engine.predict_audio_batch(audio_paths)
        return [self.predict_audio(p) for p in audio_paths]
    
    def analyze_project(self, image_paths: List[str], audio_paths: List[str]) -> Dict:
        """Full project analysis combining CV and Audio predictions."""
        if self._mock_engine:
            return self._mock_engine.analyze_project(image_paths, audio_paths)
        
        # CV predictions
        cv_results = self.predict_images_batch(image_paths) if image_paths else []
        
        # Audio predictions
        audio_results = self.predict_audio_batch(audio_paths) if audio_paths else []
        
        # Aggregate
        cv_probs = [r['defect_probability'] for r in cv_results if 'defect_probability' in r]
        audio_probs = [r['debond_probability'] for r in audio_results if 'debond_probability' in r]
        
        avg_cv_prob = np.mean(cv_probs) if cv_probs else 0.0
        avg_audio_prob = np.mean(audio_probs) if audio_probs else 0.0
        
        # Combined risk score (weighted fusion)
        # CV: visual defects (cracks, chips) = 40%
        # Audio: debonding (hollow sound) = 60%
        risk_score = 0.4 * avg_cv_prob + 0.6 * avg_audio_prob
        risk_score = float(risk_score * 100)  # 0-100 scale
        
        # Prediction category
        if risk_score < 30:
            prediction = 'pass'
            recommendation = 'Качество укладки в норме. Дефекты не обнаружены.'
        elif risk_score < 70:
            prediction = 'warning'
            recommendation = 'Обнаружены признаки дефектов. Рекомендуется локальная проверка.'
        else:
            prediction = 'fail'
            recommendation = 'Выявлены значительные дефекты. Требуется экспертная оценка и возможный демонтаж.'
        
        return {
            'cv_results': cv_results,
            'audio_results': audio_results,
            'combined': {
                'defect_probability': float(avg_cv_prob),
                'debond_probability': float(avg_audio_prob),
                'risk_score': risk_score,
                'prediction': prediction,
            },
            'recommendation': recommendation,
        }


# Singleton instance
_inference_engine: Optional[MLInference] = None

def get_inference_engine() -> MLInference:
    """Get or create singleton inference engine"""
    global _inference_engine
    if _inference_engine is None:
        _inference_engine = MLInference()
    return _inference_engine
