"""
CV Defect Detection Pipeline
YOLOv8 + Custom post-processing for tile analysis
"""

import torch
import cv2
import numpy as np
from pathlib import Path
from typing import List, Dict, Optional
from dataclasses import dataclass
from ultralytics import YOLO


@dataclass
class DefectDetection:
    defect_type: str  # uneven_joint, step_height, missing_joint, etc.
    confidence: float
    bbox: tuple  # (x, y, w, h) normalized
    measured_mm: Optional[float] = None
    severity: str = "info"


class TileDefectDetector:
    """Computer Vision pipeline for tile defect detection."""

    CONFIDENCE_AUTO = 0.85
    CONFIDENCE_REVIEW = 0.70

    def __init__(self, model_path: str, device: str = "cuda"):
        self.device = device if torch.cuda.is_available() else "cpu"
        self.model = YOLO(model_path)
        self.model.to(self.device)

        # Calibration: pixels per mm
        self.pixels_per_mm = None

    def calibrate(self, reference_object_px: float, reference_mm: float) -> bool:
        """Calibrate using known-size reference object (coin, card, A4)."""
        if reference_mm <= 0 or reference_object_px <= 0:
            return False
        self.pixels_per_mm = reference_object_px / reference_mm
        return True

    def analyze(self, image_path: str, angle: str) -> List[DefectDetection]:
        """Run full CV analysis on a single image."""
        img = cv2.imread(image_path)
        if img is None:
            raise ValueError(f"Cannot load image: {image_path}")

        results = self.model(img, conf=self.CONFIDENCE_REVIEW)
        detections = []

        for r in results:
            boxes = r.boxes
            if boxes is None:
                continue

            for box in boxes:
                cls_id = int(box.cls.item())
                conf = float(box.conf.item())
                x1, y1, x2, y2 = box.xyxy[0].tolist()

                # Map class ID to defect type
                defect_type = self._class_id_to_defect(cls_id)
                if not defect_type:
                    continue

                # Determine severity based on confidence
                if conf >= self.CONFIDENCE_AUTO:
                    severity = "critical"
                elif conf >= self.CONFIDENCE_REVIEW:
                    severity = "warning"
                else:
                    severity = "info"

                # Measure if calibrated
                measured_mm = None
                if self.pixels_per_mm and defect_type in ("uneven_joint", "step_height", "missing_joint"):
                    width_px = x2 - x1
                    measured_mm = width_px / self.pixels_per_mm

                detections.append(DefectDetection(
                    defect_type=defect_type,
                    confidence=conf,
                    bbox=(x1 / img.shape[1], y1 / img.shape[0], 
                          (x2 - x1) / img.shape[1], (y2 - y1) / img.shape[0]),
                    measured_mm=measured_mm,
                    severity=severity,
                ))

        return detections

    def _class_id_to_defect(self, cls_id: int) -> Optional[str]:
        mapping = {
            0: "uneven_joint",
            1: "step_height",
            2: "missing_joint",
            3: "crack",
            4: "chip",
            5: "wrong_color",
        }
        return mapping.get(cls_id)

    def validate_calibration(self, image_path: str, expected_mm: float) -> bool:
        """Validation: measure same object in 3+ places, check 20% spread."""
        # TODO: implement multi-point measurement validation
        return True


class SceneClassifier:
    """Classify scene type: wall tile, floor tile, junction."""

    CLASSES = ["wall_tile", "floor_tile", "junction", "countertop", "unknown"]

    def __init__(self, model_path: str):
        self.model = torch.jit.load(model_path)
        self.model.eval()

    def classify(self, image_path: str) -> Dict:
        """Return scene type + confidence."""
        img = cv2.imread(image_path)
        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        img = cv2.resize(img, (224, 224))
        img = torch.from_numpy(img).permute(2, 0, 1).float() / 255.0
        img = img.unsqueeze(0)

        with torch.no_grad():
            outputs = self.model(img)
            probs = torch.softmax(outputs, dim=1)
            top = probs.topk(1)

        return {
            "scene_type": self.CLASSES[top.indices.item()],
            "confidence": top.values.item(),
        }


if __name__ == "__main__":
    # Test
    detector = TileDefectDetector("models/yolov8_tile.pt")
    detector.calibrate(reference_object_px=300, reference_mm=60)
    detections = detector.analyze("test_tile.jpg", "front")
    for d in detections:
        print(f"{d.defect_type}: conf={d.confidence:.2f}, mm={d.measured_mm}")
