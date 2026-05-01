"""Pydantic schemas for API."""

from datetime import datetime
from typing import Optional, List, Dict, Any
from uuid import UUID
from pydantic import BaseModel, Field, ConfigDict

from app.models import UserType, ProjectStatus, TariffType, DefectSeverity


# --- Common ---
class ErrorResponse(BaseModel):
    detail: str


# --- Auth ---
class PhoneRequest(BaseModel):
    phone: str = Field(..., pattern=r"^\+7\d{10}$")


class OTPVerifyRequest(BaseModel):
    phone: str = Field(..., pattern=r"^\+7\d{10}$")
    code: str = Field(..., min_length=6, max_length=6)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserResponse"


# --- User ---
class UserUpdate(BaseModel):
    name: Optional[str] = None
    user_type: Optional[UserType] = None
    avatar_url: Optional[str] = None


class ConsentRequest(BaseModel):
    consent_given: bool


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    phone: str
    name: Optional[str]
    user_type: UserType
    avatar_url: Optional[str]
    consent_given: bool
    tariff: TariffType
    tariff_expires_at: Optional[datetime]
    created_at: datetime


# --- Project ---
class ProjectCreate(BaseModel):
    title: Optional[str] = None
    room_type: str = Field(..., pattern=r"^(bathroom|kitchen|living_room|bedroom|hallway|other)$")
    surface_type: str = Field(..., pattern=r"^(wall|floor|ceiling|countertop)$")


class CalibrationRequest(BaseModel):
    calibration_object: str = Field(..., pattern=r"^(coin5|card|a4|manual)$")
    calibration_size_mm: Optional[float] = None
    device_class: Optional[str] = Field(None, pattern=r"^[ABC]$")
    device_model: Optional[str] = None


class ProjectResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    user_id: UUID
    title: Optional[str]
    room_type: Optional[str]
    surface_type: Optional[str]
    status: ProjectStatus
    calibration_object: Optional[str]
    calibration_size_mm: Optional[float]
    calibration_valid: bool
    device_class: Optional[str]
    analysis_result: Optional[Dict[str, Any]]
    report_pdf_url: Optional[str]
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime]


class ProjectListResponse(BaseModel):
    items: List[ProjectResponse]
    total: int


# --- Photo / Audio ---
class PhotoUploadResponse(BaseModel):
    id: UUID
    original_url: str
    thumbnail_url: Optional[str]
    quality_passed: bool
    blur_score: Optional[float]
    lux_score: Optional[float]
    has_glare: Optional[bool]


class AudioUploadResponse(BaseModel):
    id: UUID
    url: str
    snr_db: Optional[float]
    quality_passed: bool


# --- Analysis ---
class AnalysisRequest(BaseModel):
    project_id: UUID


class DefectItem(BaseModel):
    id: UUID
    defect_type: str
    severity: str  # critical | warning | info
    confidence: float
    measured_value_mm: Optional[float] = None
    threshold_mm: Optional[float] = None
    regulation_refs: List[str] = []
    bbox: Optional[Dict[str, float]] = None


class AnalysisResult(BaseModel):
    project_id: UUID
    status: str
    scene_type: Optional[str]
    defects: List[DefectItem]
    overall_score: Optional[float]
    processing_time_seconds: float
    human_review_required: bool


# --- Report ---
class ReportExportRequest(BaseModel):
    project_id: UUID
    format: str = Field(default="pdf", pattern=r"^(pdf|json)$")


class ReportResponse(BaseModel):
    project_id: UUID
    download_url: str
    expires_at: datetime


# --- Payment ---
class CreatePaymentRequest(BaseModel):
    tariff: TariffType
    project_id: Optional[UUID] = None


class PaymentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    amount_rub: int
    tariff: TariffType
    provider: str
    status: str
    payment_url: Optional[str]
    created_at: datetime


# --- Expert Review ---
class ExpertReviewRequest(BaseModel):
    defect_id: UUID
    verdict: str = Field(..., pattern=r"^(confirmed|rejected|adjusted)$")
    adjusted_value_mm: Optional[float] = None
    notes: Optional[str] = None


class ExpertQueueItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    project_id: UUID
    priority: int
    sla_deadline: datetime
    status: str
    assigned_at: Optional[datetime]
