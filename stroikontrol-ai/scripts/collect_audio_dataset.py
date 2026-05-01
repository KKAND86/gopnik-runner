"""
Audio Dataset Collection Protocol for Tile Defect Detection
Based on: MDPI Buildings 2024, AID-Stick (NCU Taiwan 2024)

Usage:
    python scripts/collect_audio_dataset.py --mode record --output-dir datasets/audio/recordings
    python scripts/collect_audio_dataset.py --mode prepare --input-dir datasets/audio/recordings --output-dir datasets/audio/features
"""
import os
import sys
import argparse
import wave
import json
import time
import random
from pathlib import Path
from datetime import datetime

import numpy as np

# Audio processing imports
try:
    import sounddevice as sd
    import soundfile as sf
    AUDIO_AVAILABLE = True
except ImportError:
    AUDIO_AVAILABLE = False

try:
    import wave
    import struct
    WAVE_AVAILABLE = True
except ImportError:
    WAVE_AVAILABLE = False

try:
    import librosa
    import librosa.display
    LIBROSA_AVAILABLE = True
except ImportError:
    LIBROSA_AVAILABLE = False
    print("[WARNING] librosa not installed. Install: pip install librosa")

try:
    from scipy import signal
    from scipy.io import wavfile
    SCIPY_AVAILABLE = True
except ImportError:
    SCIPY_AVAILABLE = False

BASE_DIR = Path(__file__).parent.parent

# =============================================================================
# CONFIGURATION - Based on research papers
# =============================================================================
AUDIO_CONFIG = {
    # Recording parameters
    'sample_rate': 44100,        # 44.1 kHz (standard for audio quality)
    'duration': 2.0,             # seconds per tap
    'channels': 1,               # mono
    'dtype': 'float32',
    
    # Microphone positioning (MDPI Buildings 2024)
    'mic_distance_cm': 15,       # Fixed distance from tile
    'mic_angle_degrees': 0,     # Perpendicular to surface
    
    # Tapping protocol
    'grid_size': 3,              # 3x3 grid per tile
    'taps_per_point': 3,         # Multiple taps for robustness
    'pause_between_taps_sec': 2, # Allow vibration decay
    
    # Feature extraction (AID-Stick parameters)
    'mfcc': {
        'n_mfcc': 13,            # Static coefficients
        'n_mels': 26,            # Mel filter banks
        'n_fft': 2048,
        'hop_length': 512,
        'pre_emphasis': 0.97,      # Pre-emphasis coefficient
        'frame_length_ms': 125,    # 125 ms frame
        'frame_shift_ms': 50,      # 50 ms shift
        'delta_order': 2,          # Include delta + delta-delta = 39-D total
    },
    
    # CWT parameters
    'cwt': {
        'wavelet': 'cmor',       # Complex Morlet wavelet
        'scales': 128,           # Number of scales
    },
    
    # Spectrogram parameters
    'spectrogram': {
        'n_fft': 2048,
        'hop_length': 512,
        'n_mels': 128,
    }
}

# =============================================================================
# RECORDING MODULE
# =============================================================================
class AudioRecorder:
    """Record tapping sounds from tiles following research protocol"""
    
    def __init__(self, config=AUDIO_CONFIG):
        self.config = config
        self.sample_rate = config['sample_rate']
        self.duration = config['duration']
        self.channels = config['channels']
        
        if not AUDIO_AVAILABLE:
            raise RuntimeError("sounddevice/soundfile required for recording")
    
    def record_sample(self, duration=None):
        """Record a single audio sample"""
        dur = duration or self.duration
        print(f"   Recording {dur}s...", end=' ', flush=True)
        
        recording = sd.rec(
            int(dur * self.sample_rate),
            samplerate=self.sample_rate,
            channels=self.channels,
            dtype=self.config['dtype']
        )
        sd.wait()
        
        print("DONE")
        return recording.flatten()
    
    def record_background_noise(self, room_name='unknown'):
        """Record ambient noise for 3 seconds (silence baseline)"""
        print(f"[BG] Recording background noise for room: {room_name}")
        print("   Keep silent...")
        
        bg = self.record_sample(duration=3.0)
        
        metadata = {
            'type': 'background_noise',
            'room': room_name,
            'sample_rate': self.sample_rate,
            'duration_sec': 3.0,
            'timestamp': datetime.now().isoformat(),
            'mic_distance_cm': self.config['mic_distance_cm'],
        }
        
        return bg, metadata
    
    def record_tile_tapping(self, tile_id, condition, grid_position=None, tap_num=0):
        """
        Record tapping sound from a tile
        
        Args:
            tile_id: Unique identifier for the tile
            condition: 'intact' or 'debonded' (ground truth label)
            grid_position: (row, col) in 3x3 grid, or None for center
            tap_num: Tap iteration number
        """
        print(f"[TAP] Tile {tile_id} | Condition: {condition} | Grid: {grid_position} | Tap #{tap_num+1}")
        
        # Record
        audio = self.record_sample(duration=self.config['duration'])
        
        # Metadata
        metadata = {
            'type': 'tile_tapping',
            'tile_id': tile_id,
            'condition': condition,  # 'intact' or 'debonded'
            'grid_position': grid_position,  # (row, col) or None
            'tap_number': tap_num,
            'sample_rate': self.sample_rate,
            'duration_sec': self.config['duration'],
            'timestamp': datetime.now().isoformat(),
            'mic_distance_cm': self.config['mic_distance_cm'],
            'mic_angle_degrees': self.config['mic_angle_degrees'],
        }
        
        return audio, metadata
    
    def record_full_tile(self, tile_id, condition, output_dir):
        """
        Complete recording protocol for one tile:
        1. Background noise (3s)
        2. 9 tapping points (3x3 grid) x 3 taps each = 27 samples
        """
        print(f"\n{'='*60}")
        print(f"[PROTOCOL] Recording full tile: {tile_id} ({condition})")
        print(f"{'='*60}")
        
        output_dir = Path(output_dir)
        tile_dir = output_dir / f"{tile_id}_{condition}"
        tile_dir.mkdir(parents=True, exist_ok=True)
        
        samples = []
        
        # 1. Background noise
        bg_audio, bg_meta = self.record_background_noise(room_name=f"room_{tile_id}")
        bg_path = tile_dir / "background_noise.wav"
        self.save_wav(bg_audio, bg_path)
        samples.append({**bg_meta, 'filepath': str(bg_path)})
        
        # 2. Tapping grid 3x3
        grid_size = self.config['grid_size']
        taps_per_point = self.config['taps_per_point']
        
        for row in range(grid_size):
            for col in range(grid_size):
                pos = (row, col)
                print(f"\n[GRID] Position ({row}, {col})")
                
                for tap in range(taps_per_point):
                    tap_audio, tap_meta = self.record_tile_tapping(
                        tile_id=tile_id,
                        condition=condition,
                        grid_position=pos,
                        tap_num=tap
                    )
                    
                    tap_path = tile_dir / f"tap_r{row}_c{col}_n{tap}.wav"
                    self.save_wav(tap_audio, tap_path)
                    samples.append({**tap_meta, 'filepath': str(tap_path)})
                    
                    if tap < taps_per_point - 1:
                        time.sleep(self.config['pause_between_taps_sec'])
        
        # Save metadata JSON
        meta_path = tile_dir / "metadata.json"
        with open(meta_path, 'w') as f:
            json.dump(samples, f, indent=2, default=str)
        
        print(f"\n[OK] Recorded {len(samples)} samples for tile {tile_id}")
        print(f"   Saved to: {tile_dir}")
        
        return tile_dir
    
    def save_wav(self, audio, filepath):
        """Save audio as WAV file using standard library"""
        filepath = Path(filepath)
        filepath.parent.mkdir(parents=True, exist_ok=True)
        
        # Convert float32 to int16
        audio_int16 = (audio * 32767).astype(np.int16)
        
        with wave.open(str(filepath), 'wb') as wav_file:
            wav_file.setnchannels(self.config['channels'])
            wav_file.setsampwidth(2)  # 16-bit = 2 bytes
            wav_file.setframerate(self.sample_rate)
            wav_file.writeframes(audio_int16.tobytes())

# =============================================================================
# FEATURE EXTRACTION MODULE
# =============================================================================
class FeatureExtractor:
    """Extract MFCC, CWT, and Spectrogram features from audio"""
    
    def __init__(self, config=AUDIO_CONFIG):
        self.config = config
        self.sample_rate = config['sample_rate']
        
        if not LIBROSA_AVAILABLE:
            raise RuntimeError("librosa required for feature extraction")
    
    def load_audio(self, filepath):
        """Load audio file"""
        audio, sr = librosa.load(filepath, sr=self.sample_rate)
        return audio, sr
    
    def extract_mfcc(self, audio):
        """
        Extract MFCC features (39-D: 13 static + delta + delta-delta)
        Based on AID-Stick parameters
        """
        cfg = self.config['mfcc']
        
        # Pre-emphasis
        audio = np.append(audio[0], audio[1:] - cfg['pre_emphasis'] * audio[:-1])
        
        # MFCC
        mfcc = librosa.feature.mfcc(
            y=audio,
            sr=self.sample_rate,
            n_mfcc=cfg['n_mfcc'],
            n_mels=cfg['n_mels'],
            n_fft=cfg['n_fft'],
            hop_length=cfg['hop_length']
        )
        
        # Delta + Delta-Delta
        delta = librosa.feature.delta(mfcc)
        delta2 = librosa.feature.delta(mfcc, order=2)
        
        # Concatenate: 13 + 13 + 13 = 39-D
        features = np.vstack([mfcc, delta, delta2])
        
        return features  # Shape: (39, time_frames)
    
    def extract_cwt(self, audio):
        """
        Extract pseudo-CWT using constant-Q transform (librosa CQT)
        Approximates wavelet analysis with logarithmic frequency spacing
        """
        cfg = self.config['cwt']
        
        # Use CQT as wavelet-like analysis (limit bins to avoid Nyquist issue)
        cqt = np.abs(librosa.cqt(
            audio,
            sr=self.sample_rate,
            n_bins=84,              # 7 octaves × 12 bins = 84 (safe for 44.1kHz)
            bins_per_octave=12,
            hop_length=self.config['mfcc']['hop_length']
        ))
        
        return cqt
    
    def extract_spectrogram(self, audio):
        """Extract Mel spectrogram"""
        cfg = self.config['spectrogram']
        
        spectrogram = librosa.feature.melspectrogram(
            y=audio,
            sr=self.sample_rate,
            n_fft=cfg['n_fft'],
            hop_length=cfg['hop_length'],
            n_mels=cfg['n_mels']
        )
        
        # Convert to dB
        spectrogram_db = librosa.power_to_db(spectrogram, ref=np.max)
        
        return spectrogram_db
    
    def extract_all(self, audio):
        """Extract all features for a single audio sample"""
        return {
            'mfcc': self.extract_mfcc(audio),
            'spectrogram': self.extract_spectrogram(audio),
            'cwt': self.extract_cwt(audio)[0],
            'raw_audio': audio,
            'sample_rate': self.sample_rate
        }
    
    def process_directory(self, input_dir, output_dir):
        """
        Process all recordings in a directory and save features as numpy arrays
        """
        input_dir = Path(input_dir)
        output_dir = Path(output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)
        
        print(f"[FEAT] Processing recordings from: {input_dir}")
        
        # Find all WAV files
        wav_files = list(input_dir.rglob("*.wav"))
        print(f"   Found {len(wav_files)} WAV files")
        
        processed = []
        
        for wav_path in wav_files:
            print(f"   Processing: {wav_path.name}...", end=' ', flush=True)
            
            try:
                # Load audio
                audio, sr = self.load_audio(wav_path)
                
                # Extract features
                features = self.extract_all(audio)
                
                # Save as NPZ
                rel_path = wav_path.relative_to(input_dir)
                feat_path = output_dir / rel_path.with_suffix('.npz')
                feat_path.parent.mkdir(parents=True, exist_ok=True)
                
                np.savez(
                    feat_path,
                    mfcc=features['mfcc'],
                    spectrogram=features['spectrogram'],
                    cwt=features['cwt'],
                    sample_rate=features['sample_rate']
                )
                
                # Load metadata if available
                meta_path = wav_path.parent / "metadata.json"
                metadata = {}
                if meta_path.exists():
                    with open(meta_path) as f:
                        all_meta = json.load(f)
                        # Find matching entry
                        for entry in all_meta:
                            if entry.get('filepath', '').endswith(wav_path.name):
                                metadata = entry
                                break
                
                processed.append({
                    'source': str(wav_path),
                    'features': str(feat_path),
                    'metadata': metadata,
                    'shapes': {
                        'mfcc': features['mfcc'].shape,
                        'spectrogram': features['spectrogram'].shape,
                        'cwt': features['cwt'].shape,
                    }
                })
                
                print("OK")
                
            except Exception as e:
                print(f"ERROR: {e}")
        
        # Save index
        index_path = output_dir / "feature_index.json"
        with open(index_path, 'w') as f:
            json.dump(processed, f, indent=2, default=str)
        
        print(f"\n[OK] Processed {len(processed)} files")
        print(f"   Feature index: {index_path}")
        
        return processed

# =============================================================================
# SIMULATION MODULE (for testing without hardware)
# =============================================================================
def generate_synthetic_tap(condition='intact', sample_rate=44100, duration=2.0):
    """
    Generate synthetic tapping sound for testing pipeline
    
    Intact: sharp, high-frequency, short decay
    Debonded: dull, low-frequency, longer decay with ringing
    """
    t = np.linspace(0, duration, int(sample_rate * duration))
    
    if condition == 'intact':
        # Sharp impact: high frequency, quick decay
        freq = 800 + np.random.normal(0, 50)
        decay = np.exp(-t * 8)
        amplitude = 0.8
    else:
        # Dull impact: lower frequency, slower decay, ringing
        freq = 200 + np.random.normal(0, 30)
        decay = np.exp(-t * 2)
        # Add ringing/hollowness
        ringing = np.sin(2 * np.pi * 50 * t) * np.exp(-t * 0.5) * 0.3
        amplitude = 0.6
        
    signal = amplitude * np.sin(2 * np.pi * freq * t) * decay
    
    if condition == 'debonded':
        signal += ringing
    
    # Add noise
    noise = np.random.normal(0, 0.02, len(t))
    signal += noise
    
    return signal.astype(np.float32)

def save_wav_standard(audio, filepath, sample_rate=44100, channels=1):
    """Save audio as WAV using standard wave module"""
    filepath = Path(filepath)
    filepath.parent.mkdir(parents=True, exist_ok=True)
    
    audio_int16 = (audio * 32767).astype(np.int16)
    
    with wave.open(str(filepath), 'wb') as wav_file:
        wav_file.setnchannels(channels)
        wav_file.setsampwidth(2)
        wav_file.setframerate(sample_rate)
        wav_file.writeframes(audio_int16.tobytes())

def create_synthetic_dataset(output_dir, n_tiles=20):
    """Create synthetic audio dataset for testing"""
    print("[SYNTH] Creating synthetic audio dataset...")
    
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    
    config = AUDIO_CONFIG
    samples = []
    
    for i in range(n_tiles):
        condition = random.choice(['intact', 'debonded'])
        tile_id = f"synth_{i:03d}"
        
        tile_dir = output_dir / f"{tile_id}_{condition}"
        tile_dir.mkdir(parents=True, exist_ok=True)
        
        # Background noise
        bg = np.random.normal(0, 0.01, int(config['sample_rate'] * 3))
        bg_path = tile_dir / "background_noise.wav"
        save_wav_standard(bg, bg_path, config['sample_rate'])
        
        # Taps
        grid_size = config['grid_size']
        for row in range(grid_size):
            for col in range(grid_size):
                for tap in range(config['taps_per_point']):
                    audio = generate_synthetic_tap(condition, config['sample_rate'])
                    tap_path = tile_dir / f"tap_r{row}_c{col}_n{tap}.wav"
                    save_wav_standard(audio, tap_path, config['sample_rate'])
                    
                    samples.append({
                        'tile_id': tile_id,
                        'condition': condition,
                        'grid_position': (row, col),
                        'tap_number': tap,
                        'filepath': str(tap_path),
                        'type': 'tile_tapping',
                        'sample_rate': config['sample_rate'],
                        'synthetic': True
                    })
    
    # Save metadata
    meta_path = output_dir / "synthetic_metadata.json"
    with open(meta_path, 'w') as f:
        json.dump(samples, f, indent=2, default=str)
    
    print(f"[OK] Created {len(samples)} synthetic samples")
    print(f"   Output: {output_dir}")
    
    return output_dir

# =============================================================================
# MAIN
# =============================================================================
def main():
    parser = argparse.ArgumentParser(description='Audio dataset collection for tile defect detection')
    parser.add_argument('--mode', choices=['record', 'prepare', 'synthetic'], required=True,
                        help='record: collect audio, prepare: extract features, synthetic: generate test data')
    parser.add_argument('--output-dir', type=str, default='datasets/audio/recordings')
    parser.add_argument('--input-dir', type=str, default='datasets/audio/recordings')
    parser.add_argument('--n-tiles', type=int, default=20, help='Number of tiles for synthetic mode')
    
    args = parser.parse_args()
    
    print("="*60)
    print("Audio Dataset Collection - StroyKontrol AI")
    print("="*60)
    
    if args.mode == 'record':
        if not AUDIO_AVAILABLE:
            print("[ERROR] sounddevice/soundfile not installed")
            print("   Run: pip install sounddevice soundfile")
            return
        
        recorder = AudioRecorder()
        
        print("\n[!] RECORDING PROTOCOL")
        print("-" * 40)
        print("1. Place microphone at 15cm from tile surface")
        print("2. Use rubber hammer for consistent strikes")
        print("3. Follow the 3x3 grid pattern (9 points per tile)")
        print("4. Tap 3 times at each point with 2s pause")
        print("5. Record background noise first (3s silence)")
        print("-" * 40)
        
        # Interactive recording
        tile_count = int(input("\nHow many tiles to record? "))
        
        for i in range(tile_count):
            tile_id = input(f"\nTile #{i+1} ID (e.g., bathroom_01): ")
            condition = input("Condition [intact/debonded]: ").strip().lower()
            
            recorder.record_full_tile(tile_id, condition, args.output_dir)
    
    elif args.mode == 'prepare':
        if not LIBROSA_AVAILABLE:
            print("[ERROR] librosa not installed")
            print("   Run: pip install librosa scipy")
            return
        
        extractor = FeatureExtractor()
        extractor.process_directory(args.input_dir, args.output_dir + "_features")
    
    elif args.mode == 'synthetic':
        create_synthetic_dataset(args.output_dir, args.n_tiles)

if __name__ == '__main__':
    main()
