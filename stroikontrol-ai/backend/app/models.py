"""SQLAlchemy ORM models."""

import uuid
from datetime import datetime
from typing import Optional, List
from enum import Enum as PyEnum

from sqlalchemy import (
    Column, String, Integer, Float, DateTime, Boolean, Text,
    ForeignKey, Enum, JSON, ARRAY
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.core.database import Base


class UserType(str, PyEnum):
    CUSTOMER = "customer"      # Заказчик
    FOREMAN = "foreman"        # Прораб / мастер
    EXPERT = "expert"          # Эксперт-ревьюер
    ADMIN = "admin"


class ProjectStatus(str, PyEnum):
    DRAFT = "draft"
    CALIBRATION = "calibration"
    CAPTURING = "capturing"
    ANALYZING = "analyzing"
    HUMAN_REVIEW = "human_review"
    COMPLETED = "completed"
    ERROR = "error"


class TariffType(str, PyEnum):
    FREE = "free"
    PAYG = "payg"
    B2C_MONTHLY = "b2c_monthly"
    B2C_YEARLY = "b2c_yearly"
    B2B_STARTER = "b2b_starter"
    B2B_PRO = "b2b_pro"
    B2B_ENTERPRISE = "b2b_enterprise"


class DefectSeverity(str, PyEnum):
    CRITICAL = "critical"      # Красный — брак
    WARNING = "warning"        # Желтый — проверить
    INFO = "info"              # Серый — обратить внимание


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    phone = Column(String(20), unique=True, nullable=False, index=True)
    name = Column(String(100), nullable=True)
    user_type = Column(Enum(UserType), default=UserType.CUSTOMER)
    avatar_url = Column(String(500), nullable=True)
    
    # Consent (152-FZ)
    consent_given = Column(Boolean, default=False, nullable=False)
    consent_given_at = Column(DateTime, nullable=True)
    data_deleted_at = Column(DateTime, nullable=True)
    
    # Subscription
    tariff = Column(Enum(TariffType), default=TariffType.FREE)
    tariff_expires_at = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    projects = relationship("Project", foreign_keys="Project.user_id", back_populates="user", lazy="selectin")
    assigned_projects = relationship("Project", foreign_keys="Project.expert_assigned_id", back_populates="expert_assigned")
    payments = relationship("Payment", back_populates="user", lazy="selectin")


class Project(Base):
    __tablename__ = "projects"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    title = Column(String(200), nullable=True)
    room_type = Column(String(50), nullable=True)  # bathroom, kitchen, etc.
    surface_type = Column(String(50), nullable=True)  # wall, floor, etc.
    
    status = Column(Enum(ProjectStatus), default=ProjectStatus.DRAFT)
    
    # Calibration
    calibration_object = Column(String(50), nullable=True)  # coin5, card, a4, manual
    calibration_size_mm = Column(Float, nullable=True)
    calibration_valid = Column(Boolean, default=False)
    
    # Device info
    device_class = Column(String(2), nullable=True)  # A, B, C
    device_model = Column(String(100), nullable=True)
    
    # Results
    analysis_result = Column(JSON, nullable=True)
    report_pdf_url = Column(String(500), nullable=True)
    
    # Human review
    expert_assigned_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    expert_reviewed_at = Column(DateTime, nullable=True)
    expert_notes = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    user = relationship("User", foreign_keys=[user_id], back_populates="projects")
    expert_assigned = relationship("User", foreign_keys=[expert_assigned_id], back_populates="assigned_projects")
    photos = relationship("Photo", back_populates="project", lazy="selectin")
    audio_samples = relationship("AudioSample", back_populates="project", lazy="selectin")
    defects = relationship("Defect", back_populates="project", lazy="selectin")


class Photo(Base):
    __tablename__ = "photos"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=False)
    
    # Storage
    original_url = Column(String(500), nullable=False)
    processed_url = Column(String(500), nullable=True)
    thumbnail_url = Column(String(500), nullable=True)
    
    # Metadata
    angle = Column(String(20), nullable=True)  # front, left_30, right_30
    exif = Column(JSON, nullable=True)
    
    # Quality check
    blur_score = Column(Float, nullable=True)
    lux_score = Column(Float, nullable=True)
    has_glare = Column(Boolean, nullable=True)
    quality_passed = Column(Boolean, default=False)
    
    # Position in grid (for audio correlation)
    grid_x = Column(Integer, nullable=True)
    grid_y = Column(Integer, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", back_populates="photos")


class AudioSample(Base):
    __tablename__ = "audio_samples"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=False)
    
    # Storage
    url = Column(String(500), nullable=False)
    
    # Type: background, tap_grid
    sample_type = Column(String(20), nullable=False)
    
    # Grid position (for tap samples)
    grid_x = Column(Integer, nullable=True)
    grid_y = Column(Integer, nullable=True)
    
    # Analysis
    snr_db = Column(Float, nullable=True)
    peak_frequency = Column(Float, nullable=True)
    classification = Column(String(20), nullable=True)  # normal, void
    confidence = Column(Float, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", back_populates="audio_samples")


class Defect(Base):
    __tablename__ = "defects"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=False)
    photo_id = Column(UUID(as_uuid=True), ForeignKey("photos.id"), nullable=True)
    
    # Classification
    defect_type = Column(String(50), nullable=False)  # uneven_joint, step_height, missing_joint, void, etc.
    severity = Column(Enum(DefectSeverity), nullable=False)
    
    # Localization (normalized 0-1 on image)
    bbox_x = Column(Float, nullable=True)
    bbox_y = Column(Float, nullable=True)
    bbox_w = Column(Float, nullable=True)
    bbox_h = Column(Float, nullable=True)
    
    # Measurements
    measured_value_mm = Column(Float, nullable=True)
    threshold_mm = Column(Float, nullable=True)
    
    # AI confidence
    confidence = Column(Float, nullable=False)
    ai_verdict = Column(String(20), nullable=True)  # auto, human_review
    
    # Human review
    expert_verdict = Column(String(20), nullable=True)  # confirmed, rejected, adjusted
    expert_adjusted_value_mm = Column(Float, nullable=True)
    expert_notes = Column(Text, nullable=True)
    
    # SNiP / GOST references
    regulation_refs = Column(JSON, nullable=True)
    
    # Active learning
    user_disputed = Column(Boolean, default=False)
    dispute_reason = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)

    project = relationship("Project", back_populates="defects")


class Payment(Base):
    __tablename__ = "payments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=True)
    
    amount_rub = Column(Integer, nullable=False)
    tariff = Column(Enum(TariffType), nullable=False)
    
    # Provider data
    provider = Column(String(20), nullable=False)
    provider_payment_id = Column(String(200), nullable=True)
    status = Column(String(20), default="pending")  # pending, succeeded, canceled, refunded
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="payments")


class ExpertReviewQueue(Base):
    __tablename__ = "expert_review_queue"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=False)
    expert_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    
    priority = Column(Integer, default=0)  # Higher = more urgent
    sla_deadline = Column(DateTime, nullable=False)
    
    status = Column(String(20), default="pending")  # pending, assigned, completed, expired
    assigned_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
