"""
Real analyzers for tile defect detection — no random data.
Uses OpenCV for CV analysis and librosa for audio analysis.
"""

import math
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import numpy as np

# OpenCV
try:
    import cv2
    CV2_AVAILABLE = True
except ImportError:
    CV2_AVAILABLE = False

# PIL fallback / helper
try:
    from PIL import Image
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False

# Librosa for audio
try:
    import librosa
    LIBROSA_AVAILABLE = True
except ImportError:
    LIBROSA_AVAILABLE = False


# ------------------------------------------------------------------
# CV ANALYZER — OpenCV based
# ------------------------------------------------------------------

class RealCVAnalyzer:
    """Analyze tile images using classical computer vision.
    Detects: cracks, chips, voids (texture anomalies), uneven joints.
    """

    # Defect type names in Russian for mobile display
    DEFECT_NAMES = {
        "crack": "Трещина",
        "chip": "Скол",
        "void": "Пустота / отслоение",
        "uneven_joint": "Неровный шов",
        "step_height": "Ступенчатость",
        "stain": "Пятно / загрязнение",
    }

    def __init__(self):
        if not CV2_AVAILABLE:
            raise RuntimeError("OpenCV not installed. Install: pip install opencv-python")

    def analyze(self, image_path: str) -> Dict:
        """Run full CV analysis on an image.
        Returns defect_probability + list of detected defects.
        """
        img_bgr = cv2.imread(image_path)
        if img_bgr is None:
            return {"defect_probability": 0.0, "prediction": "normal", "confidence": 0.5, "defects": []}

        img_gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
        h, w = img_gray.shape
        img_rgb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB)

        defects = []

        # 1. Crack detection (Canny + contour analysis)
        crack_defects = self._detect_cracks(img_gray, w, h)
        defects.extend(crack_defects)

        # 2. Void / debond detection via texture uniformity
        void_defects = self._detect_voids(img_gray, w, h)
        defects.extend(void_defects)

        # 3. Joint uniformity (Hough line distances)
        joint_defects = self._detect_joint_issues(img_gray, w, h)
        defects.extend(joint_defects)

        # 4. Chip detection (corner anomalies + contour convexity)
        chip_defects = self._detect_chips(img_gray, w, h)
        defects.extend(chip_defects)

        # 5. Color / reflectivity anomaly
        color_defects = self._detect_color_anomalies(img_rgb, w, h)
        defects.extend(color_defects)

        # Compute overall probability from defect count + severity
        if not defects:
            defect_probability = 0.0
            prediction = "normal"
            confidence = 0.92
        else:
            # Weight by severity
            severity_weights = {"critical": 1.0, "warning": 0.6, "info": 0.2}
            total_weight = sum(severity_weights.get(d["severity"], 0.3) for d in defects)
            # Normalize: 1 defect warning ~ 30%, 3 critical ~ 95%
            defect_probability = min(0.95, 0.15 * total_weight + 0.1 * len(defects))
            prediction = "defective" if defect_probability > 0.5 else "normal"
            confidence = min(0.98, 0.6 + 0.1 * len(defects))

        return {
            "defect_probability": round(float(defect_probability), 4),
            "prediction": prediction,
            "confidence": round(float(confidence), 4),
            "defects": defects,
        }

    # --- Crack detection ------------------------------------------------
    def _detect_cracks(self, gray: np.ndarray, w: int, h: int) -> List[Dict]:
        """Detect cracks via Canny + morphological skeleton + contour aspect ratio."""
        # CLAHE to enhance faint cracks
        clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
        enhanced = clahe.apply(gray)

        # Canny edges
        edges = cv2.Canny(enhanced, 50, 150)

        # Morphological closing with small kernel to connect crack segments
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
        edges = cv2.morphologyEx(edges, cv2.MORPH_CLOSE, kernel)

        # Find contours
        contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        defects = []
        for cnt in contours:
            area = cv2.contourArea(cnt)
            if area < 30:  # noise
                continue

            # Bounding box
            x, y, bw, bh = cv2.boundingRect(cnt)
            aspect = max(bw, bh) / max(1, min(bw, bh))
            perimeter = cv2.arcLength(cnt, False)
            compactness = (perimeter ** 2) / max(1, 4 * math.pi * area)

            # Cracks: long thin objects with high perimeter/area ratio
            is_crack = (aspect > 8 and area < 500) or (compactness > 15 and area < 800)

            if is_crack:
                severity = "critical" if aspect > 20 else "warning"
                defects.append({
                    "defect_type": "crack",
                    "severity": severity,
                    "confidence": round(min(0.98, 0.7 + aspect / 50), 4),
                    "bbox": {
                        "x": round(x / w, 4),
                        "y": round(y / h, 4),
                        "w": round(bw / w, 4),
                        "h": round(bh / h, 4),
                    },
                    "regulation_refs": ["СНиП 3.04.01-87", "ГОСТ 6787-2001"],
                })

        return defects

    # --- Void / debond detection ----------------------------------------
    def _detect_voids(self, gray: np.ndarray, w: int, h: int) -> List[Dict]:
        """Detect voids via local variance anomalies.
        Voids under tiles create slightly different reflections."""
        # Compute local standard deviation (sliding window)
        ksize = 15
        mean = cv2.blur(gray.astype(np.float32), (ksize, ksize))
        mean_sq = cv2.blur((gray.astype(np.float32) ** 2), (ksize, ksize))
        std = np.sqrt(np.maximum(0, mean_sq - mean ** 2))

        # Global stats
        global_mean = float(np.mean(std))
        global_std = float(np.std(std))

        # Threshold: regions with abnormally LOW variance (smooth void)
        # or HIGH variance (irregular surface)
        low_mask = std < (global_mean - 2.5 * global_std)
        high_mask = std > (global_mean + 2.5 * global_std)
        anomaly_mask = low_mask | high_mask

        # Morphological cleanup
        kernel = np.ones((5, 5), np.uint8)
        anomaly_mask = cv2.morphologyEx(anomaly_mask.astype(np.uint8), cv2.MORPH_OPEN, kernel)
        anomaly_mask = cv2.morphologyEx(anomaly_mask, cv2.MORPH_CLOSE, kernel)

        # Find connected components
        num_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(anomaly_mask, connectivity=8)

        defects = []
        for i in range(1, num_labels):
            area = stats[i, cv2.CC_STAT_AREA]
            if area < 200:  # ignore tiny noise
                continue

            x = stats[i, cv2.CC_STAT_LEFT]
            y = stats[i, cv2.CC_STAT_TOP]
            bw = stats[i, cv2.CC_STAT_WIDTH]
            bh = stats[i, cv2.CC_STAT_HEIGHT]

            # Severity by size relative to image
            rel_area = (area / (w * h)) * 100
            if rel_area > 2.0:
                severity = "critical"
            elif rel_area > 0.5:
                severity = "warning"
            else:
                severity = "info"

            defects.append({
                "defect_type": "void",
                "severity": severity,
                "confidence": round(min(0.95, 0.6 + rel_area / 5), 4),
                "bbox": {
                    "x": round(x / w, 4),
                    "y": round(y / h, 4),
                    "w": round(bw / w, 4),
                    "h": round(bh / h, 4),
                },
                "regulation_refs": ["СП 71.13330.2017"],
            })

        return defects

    # --- Joint uniformity ------------------------------------------------
    def _detect_joint_issues(self, gray: np.ndarray, w: int, h: int) -> List[Dict]:
        """Detect uneven joints using Hough line transform."""
        # Edge detection
        edges = cv2.Canny(gray, 50, 150, apertureSize=3)

        # Hough lines
        lines = cv2.HoughLinesP(edges, 1, np.pi / 180, threshold=80, minLineLength=max(w, h) // 8, maxLineGap=10)

        if lines is None or len(lines) < 4:
            return []

        # Separate horizontal / vertical
        horiz = []
        vert = []
        for line in lines:
            x1, y1, x2, y2 = line[0]
            dx = abs(x2 - x1)
            dy = abs(y2 - y1)
            if dx > dy * 3:  # horizontal
                horiz.append((min(y1, y2), max(y1, y2), min(x1, x2), max(x1, x2)))
            elif dy > dx * 3:  # vertical
                vert.append((min(x1, x2), max(x1, x2), min(y1, y2), max(y1, y2)))

        defects = []

        # Check horizontal line spacing (joint height uniformity)
        if len(horiz) >= 3:
            horiz_sorted = sorted(horiz, key=lambda t: (t[0] + t[1]) / 2)
            gaps = []
            for i in range(1, len(horiz_sorted)):
                gap = (horiz_sorted[i][0] + horiz_sorted[i][1]) / 2 - (horiz_sorted[i-1][0] + horiz_sorted[i-1][1]) / 2
                gaps.append(gap)

            if gaps:
                mean_gap = np.mean(gaps)
                std_gap = np.std(gaps)
                cv_gap = std_gap / max(1, mean_gap)

                if cv_gap > 0.25:  # >25% variation in joint spacing
                    severity = "warning" if cv_gap < 0.4 else "critical"
                    defects.append({
                        "defect_type": "uneven_joint",
                        "severity": severity,
                        "confidence": round(min(0.95, 0.65 + cv_gap), 4),
                        "measured_value_mm": round(std_gap, 1),
                        "threshold_mm": 2.0,
                        "bbox": None,
                        "regulation_refs": ["СНиП 3.04.01-87", "СП 71.13330.2017"],
                    })

        # Check vertical line spacing
        if len(vert) >= 3:
            vert_sorted = sorted(vert, key=lambda t: (t[0] + t[1]) / 2)
            gaps = []
            for i in range(1, len(vert_sorted)):
                gap = (vert_sorted[i][0] + vert_sorted[i][1]) / 2 - (vert_sorted[i-1][0] + vert_sorted[i-1][1]) / 2
                gaps.append(gap)

            if gaps:
                mean_gap = np.mean(gaps)
                std_gap = np.std(gaps)
                cv_gap = std_gap / max(1, mean_gap)

                if cv_gap > 0.25:
                    severity = "warning" if cv_gap < 0.4 else "critical"
                    defects.append({
                        "defect_type": "uneven_joint",
                        "severity": severity,
                        "confidence": round(min(0.95, 0.65 + cv_gap), 4),
                        "measured_value_mm": round(std_gap, 1),
                        "threshold_mm": 2.0,
                        "bbox": None,
                        "regulation_refs": ["СНиП 3.04.01-87", "СП 71.13330.2017"],
                    })

        return defects

    # --- Chip detection --------------------------------------------------
    def _detect_chips(self, gray: np.ndarray, w: int, h: int) -> List[Dict]:
        """Detect chips / missing corners via contour convexity defects."""
        # Threshold
        _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)

        # Morphological closing
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5))
        morph = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel)

        contours, _ = cv2.findContours(morph, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        defects = []
        for cnt in contours:
            area = cv2.contourArea(cnt)
            if area < 100 or area > (w * h) * 0.8:
                continue

            # Convex hull and defects
            hull = cv2.convexHull(cnt, returnPoints=False)
            if len(hull) > 3:
                try:
                    conv_defects = cv2.convexityDefects(cnt, hull)
                except cv2.error:
                    conv_defects = None

                if conv_defects is not None:
                    deep_defects = 0
                    for i in range(conv_defects.shape[0]):
                        s, e, f, d = conv_defects[i, 0]
                        # depth normalized by area
                        if d > 5000:  # significant concavity
                            deep_defects += 1

                    if deep_defects > 0:
                        x, y, bw, bh = cv2.boundingRect(cnt)
                        severity = "warning" if deep_defects < 3 else "critical"
                        defects.append({
                            "defect_type": "chip",
                            "severity": severity,
                            "confidence": round(min(0.95, 0.6 + deep_defects * 0.1), 4),
                            "bbox": {
                                "x": round(x / w, 4),
                                "y": round(y / h, 4),
                                "w": round(bw / w, 4),
                                "h": round(bh / h, 4),
                            },
                            "regulation_refs": ["ГОСТ 6787-2001"],
                        })

        return defects

    # --- Color / reflectivity anomalies ---------------------------------
    def _detect_color_anomalies(self, rgb: np.ndarray, w: int, h: int) -> List[Dict]:
        """Detect color inconsistencies that may indicate stains or repairs."""
        # Convert to LAB for perceptual uniformity
        lab = cv2.cvtColor(rgb, cv2.COLOR_RGB2LAB)
        l, a, b = cv2.split(lab)

        # Compute local mean in L channel
        ksize = 21
        local_mean = cv2.blur(l.astype(np.float32), (ksize, ksize))
        diff = np.abs(l.astype(np.float32) - local_mean)

        # Threshold significant deviations
        threshold = np.mean(diff) + 2.5 * np.std(diff)
        mask = diff > threshold

        # Morphological cleanup
        kernel = np.ones((5, 5), np.uint8)
        mask = cv2.morphologyEx(mask.astype(np.uint8), cv2.MORPH_OPEN, kernel)

        num_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(mask, connectivity=8)

        defects = []
        for i in range(1, num_labels):
            area = stats[i, cv2.CC_STAT_AREA]
            if area < 300:
                continue

            x = stats[i, cv2.CC_STAT_LEFT]
            y = stats[i, cv2.CC_STAT_TOP]
            bw = stats[i, cv2.CC_STAT_WIDTH]
            bh = stats[i, cv2.CC_STAT_HEIGHT]

            rel_area = (area / (w * h)) * 100
            severity = "warning" if rel_area < 2.0 else "critical"

            defects.append({
                "defect_type": "stain",
                "severity": severity,
                "confidence": round(min(0.9, 0.55 + rel_area / 4), 4),
                "bbox": {
                    "x": round(x / w, 4),
                    "y": round(y / h, 4),
                    "w": round(bw / w, 4),
                    "h": round(bh / h, 4),
                },
                "regulation_refs": ["СНиП 3.04.01-87"],
            })

        return defects


# ------------------------------------------------------------------
# AUDIO ANALYZER — librosa based
# ------------------------------------------------------------------

class RealAudioAnalyzer:
    """Analyze tile-tapping audio using signal processing.
    Detects hollow (debonded) vs solid (well-bonded) sounds.
    """

    def __init__(self):
        if not LIBROSA_AVAILABLE:
            raise RuntimeError("librosa not installed. Install: pip install librosa soundfile")

    def analyze(self, audio_path: str, background_path: Optional[str] = None) -> Dict:
        """Analyze a tap audio sample.
        Returns debond_probability + acoustic features.
        """
        try:
            audio, sr = librosa.load(audio_path, sr=44100, mono=True)
        except Exception:
            return {"debond_probability": 0.0, "prediction": "intact", "confidence": 0.5}

        if len(audio) < sr * 0.05:  # less than 50ms
            return {"debond_probability": 0.0, "prediction": "intact", "confidence": 0.5}

        # --- 1. Temporal features ----------------------------------------
        rms = librosa.feature.rms(y=audio)[0]
        max_rms = float(np.max(rms))
        mean_rms = float(np.mean(rms))

        # Attack time (time to reach max amplitude)
        attack_idx = np.argmax(np.abs(audio))
        attack_time = attack_idx / sr

        # Decay time (time from max to below 10%)
        threshold = max_rms * 0.1 if max_rms > 0 else 0.001
        tail = rms[rms > threshold]
        decay_time = len(tail) * (512 / sr) if len(tail) > 0 else 0  # hop_length=512 default

        # --- 2. Spectral features --------------------------------------
        spec_cent = librosa.feature.spectral_centroid(y=audio, sr=sr)[0]
        spec_rolloff = librosa.feature.spectral_rolloff(y=audio, sr=sr)[0]
        zcr = librosa.feature.zero_crossing_rate(audio)[0]

        # MFCCs
        mfcc = librosa.feature.mfcc(y=audio, sr=sr, n_mfcc=13)

        mean_cent = float(np.mean(spec_cent))
        mean_rolloff = float(np.mean(spec_rolloff))
        mean_zcr = float(np.mean(zcr))

        # --- 3. Frequency band energy analysis ------------------------
        # FFT for band analysis
        fft = np.fft.rfft(audio)
        freqs = np.fft.rfftfreq(len(audio), 1 / sr)
        power = np.abs(fft) ** 2

        # Define bands
        def band_energy(low, high):
            mask = (freqs >= low) & (freqs < high)
            return float(np.sum(power[mask])) / max(1, len(audio))

        low_band = band_energy(50, 500)      # Low resonance (void/hollow)
        mid_band = band_energy(500, 2000)    # Mid
        high_band = band_energy(2000, 8000)  # High crispness (solid)

        total_energy = low_band + mid_band + high_band
        if total_energy > 0:
            low_ratio = low_band / total_energy
            high_ratio = high_band / total_energy
        else:
            low_ratio = 0.0
            high_ratio = 0.0

        # --- 4. Classification logic ------------------------------------
        # Hollow (debonded) sound characteristics:
        # - Lower spectral centroid (< 1500 Hz typically)
        # - More energy in low band (resonance)
        # - Longer decay time (ringing)
        # - Lower zero-crossing rate (dull thud vs sharp tick)
        #
        # Solid sound characteristics:
        # - Higher spectral centroid (> 2000 Hz)
        # - More energy in high band (crisp)
        # - Shorter decay
        # - Higher ZCR

        # Score components (0-1 each)
        cent_score = 1.0 - min(1.0, mean_cent / 2500)  # lower cent = more hollow
        low_band_score = min(1.0, low_ratio * 3.0)      # more low energy = hollow
        decay_score = min(1.0, decay_time / 0.3)      # longer decay = hollow
        zcr_score = 1.0 - min(1.0, mean_zcr / 0.15)   # lower zcr = hollow

        # Weighted combination
        debond_probability = (
            0.30 * cent_score +
            0.25 * low_band_score +
            0.25 * decay_score +
            0.20 * zcr_score
        )

        # Confidence based on signal quality
        snr_estimate = max_rms / (np.std(rms[-10:]) + 1e-6) if len(rms) >= 10 else 10.0
        confidence = min(0.98, 0.6 + min(snr_estimate / 50, 0.35))

        prediction = "debonded" if debond_probability > 0.55 else "intact"

        return {
            "debond_probability": round(float(debond_probability), 4),
            "prediction": prediction,
            "confidence": round(float(confidence), 4),
            "features": {
                "spectral_centroid_hz": round(mean_cent, 1),
                "spectral_rolloff_hz": round(mean_rolloff, 1),
                "zero_crossing_rate": round(mean_zcr, 4),
                "rms_energy": round(max_rms, 4),
                "attack_time_ms": round(attack_time * 1000, 1),
                "decay_time_ms": round(decay_time * 1000, 1),
                "low_band_ratio": round(low_ratio, 4),
                "high_band_ratio": round(high_ratio, 4),
            },
        }

    def analyze_batch(self, audio_paths: List[str], background_path: Optional[str] = None) -> List[Dict]:
        return [self.analyze(p, background_path) for p in audio_paths]
