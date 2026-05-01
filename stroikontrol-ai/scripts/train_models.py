"""
Training Pipeline for StroyKontrol AI
Trains CV and Audio models for tile defect detection

Usage:
    python scripts/train_models.py --mode cv       # Train computer vision model
    python scripts/train_models.py --mode audio    # Train audio model
    python scripts/train_models.py --mode all      # Train both
"""
import os
import sys
import argparse
import json
import pickle
import random
from pathlib import Path
from datetime import datetime

import numpy as np

# Deep learning
try:
    import tensorflow as tf
    from tensorflow import keras
    from tensorflow.keras import layers, Model
    TF_AVAILABLE = True
except ImportError:
    TF_AVAILABLE = False
    print("[WARNING] TensorFlow not installed. Install: pip install tensorflow")

try:
    from PIL import Image
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False

BASE_DIR = Path(__file__).parent.parent
DATASETS_DIR = BASE_DIR / "datasets"
MODELS_DIR = BASE_DIR / "models"

# =============================================================================
# CONFIGURATION
# =============================================================================
CONFIG = {
    'cv': {
        'input_size': (224, 224, 3),
        'batch_size': 8,
        'epochs': 20,
        'learning_rate': 0.001,
        'classes': ['normal', 'defective'],
    },
    'audio': {
        'input_shape_mfcc': (39, 87, 1),      # 39 MFCC coeffs x ~87 time frames
        'input_shape_spec': (128, 87, 1),     # 128 mel bins x ~87 time frames
        'batch_size': 16,
        'epochs': 30,
        'learning_rate': 0.001,
        'classes': ['intact', 'debonded'],
    }
}

# =============================================================================
# CV MODEL
# =============================================================================
def load_cv_dataset(data_dir):
    """Load CV dataset from real-photos or demo-samples"""
    print("[CV] Loading dataset...")
    
    data_dir = Path(data_dir)
    images = []
    labels = []
    
    # Check for folder-per-class structure
    for label_idx, cls_name in enumerate(CONFIG['cv']['classes']):
        cls_dir = data_dir / cls_name
        if not cls_dir.exists():
            print(f"   Warning: {cls_dir} not found, trying flat structure...")
            # Try flat structure (demo-samples)
            for img_path in data_dir.glob(f"*_{cls_name}.jpg"):
                img = Image.open(img_path).convert('RGB')
                img = img.resize((224, 224))
                img_array = np.array(img) / 255.0
                images.append(img_array)
                labels.append(label_idx)
        else:
            # Folder per class structure (real-photos)
            for img_path in cls_dir.glob("*.jpg"):
                img = Image.open(img_path).convert('RGB')
                img = img.resize((224, 224))
                img_array = np.array(img) / 255.0
                images.append(img_array)
                labels.append(label_idx)
    
    X = np.array(images)
    y = np.array(labels)
    
    # Shuffle
    indices = np.random.permutation(len(X))
    X = X[indices]
    y = y[indices]
    
    # Split 80/20
    split = int(0.8 * len(X))
    X_train, X_val = X[:split], X[split:]
    y_train, y_val = y[:split], y[split:]
    
    print(f"   Total: {len(X)} images")
    print(f"   Train: {len(X_train)}, Val: {len(X_val)}")
    print(f"   Classes: normal={sum(y==0)}, defective={sum(y==1)}")
    
    return (X_train, y_train), (X_val, y_val)

def build_cv_model(input_shape=(224, 224, 3), num_classes=2):
    """Build lightweight CNN for tile defect classification"""
    print("[CV] Building model...")
    
    inputs = layers.Input(shape=input_shape)
    
    # Block 1
    x = layers.Conv2D(32, 3, activation='relu', padding='same')(inputs)
    x = layers.BatchNormalization()(x)
    x = layers.MaxPooling2D(2)(x)
    x = layers.Dropout(0.25)(x)
    
    # Block 2
    x = layers.Conv2D(64, 3, activation='relu', padding='same')(x)
    x = layers.BatchNormalization()(x)
    x = layers.MaxPooling2D(2)(x)
    x = layers.Dropout(0.25)(x)
    
    # Block 3
    x = layers.Conv2D(128, 3, activation='relu', padding='same')(x)
    x = layers.BatchNormalization()(x)
    x = layers.MaxPooling2D(2)(x)
    x = layers.Dropout(0.25)(x)
    
    # Classifier
    x = layers.GlobalAveragePooling2D()(x)
    x = layers.Dense(128, activation='relu')(x)
    x = layers.Dropout(0.5)(x)
    
    if num_classes == 2:
        outputs = layers.Dense(1, activation='sigmoid')(x)
        loss = 'binary_crossentropy'
        metrics = ['accuracy', tf.keras.metrics.AUC(name='auc')]
    else:
        outputs = layers.Dense(num_classes, activation='softmax')(x)
        loss = 'sparse_categorical_crossentropy'
        metrics = ['accuracy']
    
    model = Model(inputs, outputs, name='cv_tile_classifier')
    
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=CONFIG['cv']['learning_rate']),
        loss=loss,
        metrics=metrics
    )
    
    print(f"   Parameters: {model.count_params():,}")
    return model

def train_cv_model(data_dir=None):
    """Train computer vision model"""
    print("="*60)
    print("CV Model Training - Extended Dataset")
    print("="*60)
    
    if not TF_AVAILABLE or not PIL_AVAILABLE:
        print("[ERROR] Requires tensorflow and Pillow")
        return None
    
    # Use extended dataset if available, fall back to real-photos or demo
    if data_dir is None:
        ext_dir = DATASETS_DIR / "cv" / "extended-photos"
        prod_dir = DATASETS_DIR / "cv" / "real-photos"
        demo_dir = DATASETS_DIR / "cv" / "demo-samples"
        
        if ext_dir.exists() and any((ext_dir / 'normal').glob('*.jpg')):
            data_dir = ext_dir
        elif prod_dir.exists() and any((prod_dir / 'normal').glob('*.jpg')):
            data_dir = prod_dir
        else:
            data_dir = demo_dir
    
    data_dir = Path(data_dir)
    if not data_dir.exists():
        print(f"[ERROR] Dataset not found: {data_dir}")
        return None
    
    print(f"[CV] Using dataset: {data_dir}")
    
    (X_train, y_train), (X_val, y_val) = load_cv_dataset(data_dir)
    
    # Build model
    model = build_cv_model()
    
    # Callbacks
    callbacks = [
        tf.keras.callbacks.EarlyStopping(patience=5, restore_best_weights=True, monitor='val_loss'),
        tf.keras.callbacks.ReduceLROnPlateau(factor=0.5, patience=3, monitor='val_loss'),
    ]
    
    # Train
    print("\n[CV] Training...")
    history = model.fit(
        X_train, y_train,
        validation_data=(X_val, y_val),
        epochs=CONFIG['cv']['epochs'],
        batch_size=CONFIG['cv']['batch_size'],
        callbacks=callbacks,
        verbose=1
    )
    
    # Evaluate
    print("\n[CV] Evaluation:")
    loss, acc, auc = model.evaluate(X_val, y_val, verbose=0)
    print(f"   Loss: {loss:.4f}")
    print(f"   Accuracy: {acc:.4f}")
    print(f"   AUC: {auc:.4f}")
    
    # Save model
    model_dir = MODELS_DIR / "cv"
    model_dir.mkdir(parents=True, exist_ok=True)
    
    model_path = model_dir / "tile_defect_classifier.keras"
    model.save(str(model_path))
    
    # Save metadata
    meta = {
        'model_type': 'cv_classifier',
        'input_shape': list(CONFIG['cv']['input_size']),
        'classes': CONFIG['cv']['classes'],
        'val_accuracy': float(acc),
        'val_auc': float(auc),
        'val_loss': float(loss),
        'epochs_trained': len(history.history['loss']),
        'training_date': datetime.now().isoformat(),
        'model_path': str(model_path),
        'framework': 'tensorflow',
        'version': tf.__version__,
    }
    
    meta_path = model_dir / "metadata.json"
    with open(meta_path, 'w') as f:
        json.dump(meta, f, indent=2)
    
    # Save history
    history_path = model_dir / "history.pkl"
    with open(history_path, 'wb') as f:
        pickle.dump(history.history, f)
    
    print(f"\n[OK] CV model saved to: {model_path}")
    print(f"   Metadata: {meta_path}")
    
    return model, meta

# =============================================================================
# AUDIO MODEL
# =============================================================================
def load_audio_features(features_dir):
    """Load pre-extracted audio features from NPZ files"""
    print("[AUDIO] Loading features...")
    
    features_dir = Path(features_dir)
    
    # Try loading from feature_index.json first
    index_path = features_dir / "feature_index.json"
    if index_path.exists():
        return _load_from_index(features_dir, index_path)
    
    # Otherwise scan for NPZ files directly
    print("   Scanning for NPZ files...")
    npz_files = list(features_dir.rglob("*.npz"))
    
    if not npz_files:
        print(f"[ERROR] No NPZ files found in {features_dir}")
        return None
    
    print(f"   Found {len(npz_files)} NPZ files")
    return _load_npz_files(npz_files)

def _load_from_index(features_dir, index_path):
    """Load features using index file"""
    with open(index_path) as f:
        index = json.load(f)
    
    mfcc_list = []
    spec_list = []
    labels = []
    
    for entry in index:
        feat_path = entry.get('features')
        if not feat_path:
            continue
        
        feat_file = Path(feat_path)
        if not feat_file.exists():
            continue
        
        try:
            data = np.load(feat_file)
            mfcc = data['mfcc']
            spec = data['spectrogram']
            
            # Determine label from path or metadata
            meta = entry.get('metadata', {})
            condition = meta.get('condition', '')
            if not condition:
                # Try from path
                path_str = str(feat_file)
                if 'debonded' in path_str or 'defective' in path_str:
                    condition = 'debonded'
                else:
                    condition = 'intact'
            
            label = 1 if condition == 'debonded' else 0
            
            # Ensure consistent shapes
            target_frames = 87
            
            if mfcc.shape[1] < target_frames:
                mfcc = np.pad(mfcc, ((0, 0), (0, target_frames - mfcc.shape[1])))
            else:
                mfcc = mfcc[:, :target_frames]
            
            if spec.shape[1] < target_frames:
                spec = np.pad(spec, ((0, 0), (0, target_frames - spec.shape[1])))
            else:
                spec = spec[:, :target_frames]
            
            mfcc_list.append(mfcc)
            spec_list.append(spec)
            labels.append(label)
            
        except Exception as e:
            print(f"   Skip {feat_file.name}: {e}")
    
    return _package_audio_data(mfcc_list, spec_list, labels)

def _load_npz_files(npz_files):
    """Load features directly from NPZ files"""
    mfcc_list = []
    spec_list = []
    labels = []
    
    for feat_file in npz_files:
        try:
            data = np.load(feat_file)
            mfcc = data['mfcc']
            spec = data['spectrogram']
            
            # Determine label from path
            path_str = str(feat_file)
            if 'debonded' in path_str or 'defective' in path_str:
                label = 1
            else:
                label = 0
            
            # Ensure consistent shapes
            target_frames = 87
            
            if mfcc.shape[1] < target_frames:
                mfcc = np.pad(mfcc, ((0, 0), (0, target_frames - mfcc.shape[1])))
            else:
                mfcc = mfcc[:, :target_frames]
            
            if spec.shape[1] < target_frames:
                spec = np.pad(spec, ((0, 0), (0, target_frames - spec.shape[1])))
            else:
                spec = spec[:, :target_frames]
            
            mfcc_list.append(mfcc)
            spec_list.append(spec)
            labels.append(label)
            
        except Exception as e:
            print(f"   Skip {feat_file.name}: {e}")
    
    return _package_audio_data(mfcc_list, spec_list, labels)

def _package_audio_data(mfcc_list, spec_list, labels):
    """Package audio data for training"""
    if len(mfcc_list) == 0:
        print("[ERROR] No valid features loaded")
        return None
    
    X_mfcc = np.array(mfcc_list)[..., np.newaxis]
    X_spec = np.array(spec_list)[..., np.newaxis]
    y = np.array(labels)
    
    # Shuffle
    indices = np.random.permutation(len(y))
    X_mfcc = X_mfcc[indices]
    X_spec = X_spec[indices]
    y = y[indices]
    
    # Split 80/20
    split = int(0.8 * len(y))
    
    train_data = (X_mfcc[:split], X_spec[:split], y[:split])
    val_data = (X_mfcc[split:], X_spec[split:], y[split:])
    
    print(f"   Total: {len(y)} samples")
    print(f"   Train: {split}, Val: {len(y) - split}")
    print(f"   Classes: intact={sum(y==0)}, debonded={sum(y==1)}")
    print(f"   MFCC shape: {X_mfcc.shape}")
    print(f"   Spec shape: {X_spec.shape}")
    
    return train_data, val_data

def build_audio_dual_branch_model():
    """
    Build Dual-Branch CNN based on MDPI Buildings 2024 paper
    Branch 1: MFCC (39-D temporal features)
    Branch 2: Spectrogram (128 mel bins)
    """
    print("[AUDIO] Building Dual-Branch CNN...")
    
    # MFCC Branch
    mfcc_input = layers.Input(shape=CONFIG['audio']['input_shape_mfcc'], name='mfcc_input')
    
    m = layers.Conv2D(32, (3, 3), activation='relu', padding='same')(mfcc_input)
    m = layers.BatchNormalization()(m)
    m = layers.MaxPooling2D((2, 2))(m)
    m = layers.Dropout(0.25)(m)
    
    m = layers.Conv2D(64, (3, 3), activation='relu', padding='same')(m)
    m = layers.BatchNormalization()(m)
    m = layers.MaxPooling2D((2, 2))(m)
    m = layers.Dropout(0.25)(m)
    
    m = layers.Conv2D(128, (3, 3), activation='relu', padding='same')(m)
    m = layers.BatchNormalization()(m)
    m = layers.GlobalAveragePooling2D()(m)
    m = layers.Dense(64, activation='relu')(m)
    
    # Spectrogram Branch
    spec_input = layers.Input(shape=CONFIG['audio']['input_shape_spec'], name='spec_input')
    
    s = layers.Conv2D(32, (3, 3), activation='relu', padding='same')(spec_input)
    s = layers.BatchNormalization()(s)
    s = layers.MaxPooling2D((2, 2))(s)
    s = layers.Dropout(0.25)(s)
    
    s = layers.Conv2D(64, (3, 3), activation='relu', padding='same')(s)
    s = layers.BatchNormalization()(s)
    s = layers.MaxPooling2D((2, 2))(s)
    s = layers.Dropout(0.25)(s)
    
    s = layers.Conv2D(128, (3, 3), activation='relu', padding='same')(s)
    s = layers.BatchNormalization()(s)
    s = layers.GlobalAveragePooling2D()(s)
    s = layers.Dense(64, activation='relu')(s)
    
    # Fusion
    fused = layers.Concatenate()([m, s])
    fused = layers.Dense(128, activation='relu')(fused)
    fused = layers.Dropout(0.5)(fused)
    fused = layers.Dense(64, activation='relu')(fused)
    
    # Output
    output = layers.Dense(1, activation='sigmoid', name='output')(fused)
    
    model = Model(inputs=[mfcc_input, spec_input], outputs=output, name='audio_dual_branch')
    
    model.compile(
        optimizer=tf.keras.optimizers.Adam(learning_rate=CONFIG['audio']['learning_rate']),
        loss='binary_crossentropy',
        metrics=['accuracy', tf.keras.metrics.AUC(name='auc')]
    )
    
    print(f"   Parameters: {model.count_params():,}")
    return model

def train_audio_model(data_dir=None):
    """Train audio defect detection model"""
    print("="*60)
    print("Audio Model Training - Production Dataset")
    print("="*60)
    
    if not TF_AVAILABLE:
        print("[ERROR] TensorFlow not installed")
        return None
    
    # Use production dataset if available
    if data_dir is None:
        prod_dir = DATASETS_DIR / "audio" / "real-recordings"
        demo_dir = DATASETS_DIR / "audio" / "features_features"
        data_dir = prod_dir if prod_dir.exists() and any(prod_dir.iterdir()) else demo_dir
    
    data_dir = Path(data_dir)
    
    # If using raw recordings, extract features first
    if data_dir.name == "real-recordings":
        print("[AUDIO] Extracting features from raw recordings...")
        from collect_audio_dataset import FeatureExtractor
        extractor = FeatureExtractor()
        features_dir = DATASETS_DIR / "audio" / "real-features"
        extractor.process_directory(data_dir, features_dir)
        data_dir = features_dir
    
    data = load_audio_features(data_dir)
    if data is None:
        print("[ERROR] Could not load audio features")
        return None
    
    (X_mfcc_train, X_spec_train, y_train), (X_mfcc_val, X_spec_val, y_val) = data
    
    # Build model
    model = build_audio_dual_branch_model()
    
    # Callbacks
    callbacks = [
        tf.keras.callbacks.EarlyStopping(patience=7, restore_best_weights=True, monitor='val_loss'),
        tf.keras.callbacks.ReduceLROnPlateau(factor=0.5, patience=3, monitor='val_loss'),
    ]
    
    # Train
    print("\n[AUDIO] Training...")
    history = model.fit(
        [X_mfcc_train, X_spec_train], y_train,
        validation_data=([X_mfcc_val, X_spec_val], y_val),
        epochs=CONFIG['audio']['epochs'],
        batch_size=CONFIG['audio']['batch_size'],
        callbacks=callbacks,
        verbose=1
    )
    
    # Evaluate
    print("\n[AUDIO] Evaluation:")
    loss, acc, auc = model.evaluate([X_mfcc_val, X_spec_val], y_val, verbose=0)
    print(f"   Loss: {loss:.4f}")
    print(f"   Accuracy: {acc:.4f}")
    print(f"   AUC: {auc:.4f}")
    
    # Save model
    model_dir = MODELS_DIR / "audio"
    model_dir.mkdir(parents=True, exist_ok=True)
    
    model_path = model_dir / "tile_tap_defect_detector.keras"
    model.save(str(model_path))
    
    # Save metadata
    meta = {
        'model_type': 'audio_dual_branch_cnn',
        'input_shapes': {
            'mfcc': list(CONFIG['audio']['input_shape_mfcc']),
            'spectrogram': list(CONFIG['audio']['input_shape_spec']),
        },
        'classes': CONFIG['audio']['classes'],
        'val_accuracy': float(acc),
        'val_auc': float(auc),
        'val_loss': float(loss),
        'epochs_trained': len(history.history['loss']),
        'training_date': datetime.now().isoformat(),
        'model_path': str(model_path),
        'framework': 'tensorflow',
        'version': tf.__version__,
    }
    
    meta_path = model_dir / "metadata.json"
    with open(meta_path, 'w') as f:
        json.dump(meta, f, indent=2)
    
    # Save history
    history_path = model_dir / "history.pkl"
    with open(history_path, 'wb') as f:
        pickle.dump(history.history, f)
    
    print(f"\n[OK] Audio model saved to: {model_path}")
    print(f"   Metadata: {meta_path}")
    
    return model, meta

# =============================================================================
# INFERENCE PIPELINE
# =============================================================================
class DefectDetectionPipeline:
    """Combined CV + Audio inference pipeline"""
    
    def __init__(self, cv_model_path=None, audio_model_path=None):
        self.cv_model = None
        self.audio_model = None
        
        if cv_model_path and Path(cv_model_path).exists():
            self.cv_model = tf.keras.models.load_model(str(cv_model_path))
            print(f"[PIPELINE] Loaded CV model: {cv_model_path}")
        
        if audio_model_path and Path(audio_model_path).exists():
            self.audio_model = tf.keras.models.load_model(str(audio_model_path))
            print(f"[PIPELINE] Loaded Audio model: {audio_model_path}")
    
    def predict_cv(self, image_path):
        """Predict defect probability from image"""
        if self.cv_model is None:
            return None
        
        img = Image.open(image_path).convert('RGB')
        img = img.resize((224, 224))
        img_array = np.array(img) / 255.0
        img_batch = np.expand_dims(img_array, axis=0)
        
        prob = self.cv_model.predict(img_batch, verbose=0)[0][0]
        
        return {
            'defect_probability': float(prob),
            'prediction': 'defective' if prob > 0.5 else 'normal',
            'confidence': float(max(prob, 1 - prob))
        }
    
    def predict_audio(self, mfcc_features, spec_features):
        """Predict debonding probability from audio features"""
        if self.audio_model is None:
            return None
        
        # Ensure correct shapes
        target_frames = 87
        
        mfcc = np.array(mfcc_features)
        if mfcc.shape[1] < target_frames:
            mfcc = np.pad(mfcc, ((0, 0), (0, target_frames - mfcc.shape[1])))
        else:
            mfcc = mfcc[:, :target_frames]
        
        spec = np.array(spec_features)
        if spec.shape[1] < target_frames:
            spec = np.pad(spec, ((0, 0), (0, target_frames - spec.shape[1])))
        else:
            spec = spec[:, :target_frames]
        
        # Add batch and channel dims
        mfcc_batch = np.expand_dims(mfcc, axis=(0, -1))
        spec_batch = np.expand_dims(spec, axis=(0, -1))
        
        prob = self.audio_model.predict([mfcc_batch, spec_batch], verbose=0)[0][0]
        
        return {
            'debond_probability': float(prob),
            'prediction': 'debonded' if prob > 0.5 else 'intact',
            'confidence': float(max(prob, 1 - prob))
        }
    
    def predict_combined(self, image_path=None, audio_features=None):
        """Combined prediction using both modalities"""
        cv_result = self.predict_cv(image_path) if image_path else None
        audio_result = self.predict_audio(**audio_features) if audio_features else None
        
        # Weighted fusion (can be tuned)
        if cv_result and audio_result:
            cv_weight = 0.4
            audio_weight = 0.6
            
            combined_prob = (cv_weight * cv_result['defect_probability'] + 
                           audio_weight * audio_result['debond_probability'])
            
            return {
                'cv': cv_result,
                'audio': audio_result,
                'combined': {
                    'defect_probability': float(combined_prob),
                    'prediction': 'defective' if combined_prob > 0.5 else 'normal',
                    'confidence': float(max(combined_prob, 1 - combined_prob))
                }
            }
        
        return {'cv': cv_result, 'audio': audio_result}

# =============================================================================
# MAIN
# =============================================================================
def main():
    parser = argparse.ArgumentParser(description='Train models for StroyKontrol AI')
    parser.add_argument('--mode', choices=['cv', 'audio', 'all'], required=True,
                        help='Which model to train')
    parser.add_argument('--inference-test', action='store_true',
                        help='Run inference test after training')
    
    args = parser.parse_args()
    
    print("="*60)
    print("StroyKontrol AI - Model Training Pipeline")
    print("="*60)
    
    if not TF_AVAILABLE:
        print("[ERROR] TensorFlow is required")
        print("   Install: pip install tensorflow")
        return
    
    print(f"TensorFlow version: {tf.__version__}")
    print(f"GPU available: {tf.config.list_physical_devices('GPU')}")
    
    cv_result = None
    audio_result = None
    
    if args.mode in ['cv', 'all']:
        cv_result = train_cv_model()
    
    if args.mode in ['audio', 'all']:
        audio_result = train_audio_model()
    
    if args.inference_test:
        print("\n" + "="*60)
        print("Inference Test")
        print("="*60)
        
        cv_path = MODELS_DIR / "cv" / "tile_defect_classifier.keras"
        audio_path = MODELS_DIR / "audio" / "tile_tap_defect_detector.keras"
        
        pipeline = DefectDetectionPipeline(
            cv_model_path=cv_path if cv_path.exists() else None,
            audio_model_path=audio_path if audio_path.exists() else None
        )
        
        # Test CV
        demo_dir = DATASETS_DIR / "cv" / "demo-samples"
        if demo_dir.exists():
            demo_images = list(demo_dir.glob("*.jpg"))[:3]
            for img in demo_images:
                result = pipeline.predict_cv(img)
                print(f"\n   Image: {img.name}")
                print(f"      Prediction: {result['prediction']} ({result['confidence']:.2%})")
        
        # Test Audio
        feat_dir = DATASETS_DIR / "audio" / "features_features"
        if feat_dir.exists():
            npz_files = list(feat_dir.rglob("*.npz"))[:3]
            for npz in npz_files:
                data = np.load(npz)
                result = pipeline.predict_audio(data['mfcc'], data['spectrogram'])
                if result:
                    print(f"\n   Audio: {npz.name}")
                    print(f"      Prediction: {result['prediction']} ({result['confidence']:.2%})")
    
    print("\n" + "="*60)
    print("Training Complete")
    print("="*60)

if __name__ == '__main__':
    main()
