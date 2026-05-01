"""
Audio Analysis Pipeline — Tap test for void detection
Spectral analysis + CNN classifier
"""

import librosa
import numpy as np
import torch
import torch.nn as nn
from pathlib import Path
from typing import List, Dict, Optional
from dataclasses import dataclass


@dataclass
class TapClassification:
    grid_x: int
    grid_y: int
    classification: str  # normal, void
    confidence: float
    snr_db: float
    peak_freq: float


class AudioVoidsClassifier(nn.Module):
    """CNN for tap sound classification: normal vs void."""

    def __init__(self, n_mels: int = 64, n_classes: int = 2):
        super().__init__()
        self.features = nn.Sequential(
            nn.Conv2d(1, 32, kernel_size=3, padding=1),
            nn.ReLU(),
            nn.BatchNorm2d(32),
            nn.MaxPool2d(2, 2),
            
            nn.Conv2d(32, 64, kernel_size=3, padding=1),
            nn.ReLU(),
            nn.BatchNorm2d(64),
            nn.MaxPool2d(2, 2),
            
            nn.Conv2d(64, 128, kernel_size=3, padding=1),
            nn.ReLU(),
            nn.BatchNorm2d(128),
            nn.AdaptiveAvgPool2d((4, 4)),
        )
        self.classifier = nn.Sequential(
            nn.Flatten(),
            nn.Linear(128 * 4 * 4, 256),
            nn.ReLU(),
            nn.Dropout(0.5),
            nn.Linear(256, n_classes),
        )

    def forward(self, x):
        x = self.features(x)
        x = self.classifier(x)
        return x


class TapAnalyzer:
    """Analyze tap recordings for void detection."""

    SNR_THRESHOLD_DB = 15.0
    SAMPLE_RATE = 44100
    N_MELS = 64
    HOP_LENGTH = 512

    def __init__(self, model_path: str, device: str = "cuda"):
        self.device = device if torch.cuda.is_available() else "cpu"
        self.model = AudioVoidsClassifier()
        self.model.load_state_dict(torch.load(model_path, map_location=self.device))
        self.model.to(self.device)
        self.model.eval()

    def extract_features(self, audio_path: str) -> np.ndarray:
        """Extract mel spectrogram features."""
        y, sr = librosa.load(audio_path, sr=self.SAMPLE_RATE, mono=True)
        
        # Compute mel spectrogram
        mel_spec = librosa.feature.melspectrogram(
            y=y, sr=sr, n_mels=self.N_MELS, hop_length=self.HOP_LENGTH
        )
        mel_db = librosa.power_to_db(mel_spec, ref=np.max)
        
        # Resize to fixed size (pad or crop)
        target_frames = 128
        if mel_db.shape[1] < target_frames:
            pad_width = target_frames - mel_db.shape[1]
            mel_db = np.pad(mel_db, ((0, 0), (0, pad_width)), mode='constant')
        else:
            mel_db = mel_db[:, :target_frames]
        
        return mel_db

    def compute_snr(self, audio_path: str) -> float:
        """Compute signal-to-noise ratio in dB."""
        y, sr = librosa.load(audio_path, sr=self.SAMPLE_RATE, mono=True)
        
        # Simple energy-based SNR estimate
        signal_energy = np.sum(y ** 2)
        # Assume last 10% is noise (or use background recording)
        noise_sample = y[-int(len(y) * 0.1):]
        noise_energy = np.sum(noise_sample ** 2) + 1e-10
        
        snr = 10 * np.log10(signal_energy / noise_energy)
        return float(snr)

    def analyze_tap(self, audio_path: str, grid_x: int, grid_y: int) -> TapClassification:
        """Classify a single tap recording."""
        snr = self.compute_snr(audio_path)
        
        if snr < self.SNR_THRESHOLD_DB:
            return TapClassification(
                grid_x=grid_x,
                grid_y=grid_y,
                classification="unknown",
                confidence=0.0,
                snr_db=snr,
                peak_freq=0.0,
            )

        features = self.extract_features(audio_path)
        features_tensor = torch.from_numpy(features).unsqueeze(0).unsqueeze(0).float().to(self.device)

        with torch.no_grad():
            logits = self.model(features_tensor)
            probs = torch.softmax(logits, dim=1)
            pred = torch.argmax(probs, dim=1)
            conf = probs[0][pred.item()].item()

        # Peak frequency for additional diagnostics
        y, sr = librosa.load(audio_path, sr=self.SAMPLE_RATE)
        fft = np.fft.fft(y)
        freqs = np.fft.fftfreq(len(y), 1/sr)
        peak_freq = freqs[np.argmax(np.abs(fft))]

        classes = ["normal", "void"]
        return TapClassification(
            grid_x=grid_x,
            grid_y=grid_y,
            classification=classes[pred.item()],
            confidence=conf,
            snr_db=snr,
            peak_freq=abs(peak_freq),
        )

    def analyze_project(self, tap_files: List[Dict[str, any]]) -> List[TapClassification]:
        """Analyze all taps for a project."""
        results = []
        for tap in tap_files:
            result = self.analyze_tap(
                tap["path"],
                tap.get("grid_x", 0),
                tap.get("grid_y", 0),
            )
            results.append(result)
        return results


if __name__ == "__main__":
    analyzer = TapAnalyzer("models/audio_voids.pt")
    result = analyzer.analyze_tap("test_tap_0_0.wav", 0, 0)
    print(f"Classification: {result.classification} (conf={result.confidence:.2f}, SNR={result.snr_db:.1f}dB)")
