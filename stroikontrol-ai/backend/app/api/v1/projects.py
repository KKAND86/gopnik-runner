"""Project management router."""

import os
import shutil
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Optional, List
from uuid import UUID

from app.core.database import get_db
from app.core.config import settings
from app.core.dependencies import get_current_user
from app.schemas import (
    ProjectCreate, ProjectResponse, ProjectListResponse,
    CalibrationRequest, PhotoUploadResponse, AudioUploadResponse,
)
from app.models import User, Project, ProjectStatus, Photo, AudioSample

router = APIRouter()

UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", "uploads"))


def _ensure_dir(path: Path) -> Path:
    path.mkdir(parents=True, exist_ok=True)
    return path


def _save_upload_file(file: UploadFile, dest: Path) -> str:
    """Save uploaded file to disk and return local path."""
    _ensure_dir(dest.parent)
    with open(dest, "wb") as f:
        shutil.copyfileobj(file.file, f)
    return str(dest)



@router.post("", response_model=ProjectResponse)
async def create_project(
    req: ProjectCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = Project(
        user_id=current_user.id,
        title=req.title,
        room_type=req.room_type,
        surface_type=req.surface_type,
        status=ProjectStatus.DRAFT,
    )
    db.add(project)
    await db.flush()
    return ProjectResponse.model_validate(project)


@router.get("", response_model=ProjectListResponse)
async def list_projects(
    skip: int = 0,
    limit: int = 20,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Project)
        .where(Project.user_id == current_user.id)
        .order_by(Project.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    items = result.scalars().all()
    
    count_result = await db.execute(
        select(func.count()).where(Project.user_id == current_user.id)
    )
    total = count_result.scalar()
    
    return ProjectListResponse(
        items=[ProjectResponse.model_validate(p) for p in items],
        total=total,
    )


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Project).where(Project.id == project_id, Project.user_id == current_user.id)
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return ProjectResponse.model_validate(project)


@router.patch("/{project_id}/calibration", response_model=ProjectResponse)
async def set_calibration(
    project_id: UUID,
    req: CalibrationRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Project).where(Project.id == project_id, Project.user_id == current_user.id)
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    project.calibration_object = req.calibration_object
    project.calibration_size_mm = req.calibration_size_mm
    project.device_class = req.device_class
    project.device_model = req.device_model
    project.status = ProjectStatus.CALIBRATION
    
    # TODO: trigger CV calibration verification (background task)
    
    await db.flush()
    return ProjectResponse.model_validate(project)


@router.post("/{project_id}/photos", response_model=PhotoUploadResponse)
async def upload_photo(
    project_id: UUID,
    angle: str = Form(..., pattern=r"^(front|left_30|right_30)$"),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Project).where(Project.id == project_id, Project.user_id == current_user.id)
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Validate file type
    allowed_types = {"image/jpeg", "image/jpg", "image/png"}
    content_type = file.content_type or ""
    if content_type not in allowed_types:
        raise HTTPException(status_code=400, detail=f"Invalid file type: {content_type}")

    # Save to disk
    ext = content_type.split("/")[-1].replace("jpeg", "jpg")
    filename = f"photo_{angle}_{Date.now() if hasattr(Date, 'now') else project_id}_{ext}"
    # Use a simpler filename
    import time
    filename = f"photo_{angle}_{int(time.time())}.jpg"
    local_path = _save_upload_file(file, UPLOAD_DIR / str(project_id) / filename)

    # Also update project status
    if project.status in (ProjectStatus.DRAFT, ProjectStatus.CALIBRATION):
        project.status = ProjectStatus.CAPTURING

    photo = Photo(
        project_id=project_id,
        original_url=local_path,
        angle=angle,
        quality_passed=True,
    )
    db.add(photo)
    await db.flush()

    return PhotoUploadResponse(
        id=photo.id,
        original_url=photo.original_url,
        quality_passed=photo.quality_passed,
    )


@router.post("/{project_id}/audio", response_model=AudioUploadResponse)
async def upload_audio(
    project_id: UUID,
    sample_type: str = Form(..., pattern=r"^(background|tap_grid)$"),
    grid_x: Optional[int] = Form(None),
    grid_y: Optional[int] = Form(None),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Project).where(Project.id == project_id, Project.user_id == current_user.id)
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Validate audio format
    allowed_types = {"audio/m4a", "audio/wav", "audio/x-wav", "audio/mp4", "audio/aac"}
    content_type = file.content_type or ""
    ext = "m4a"
    if content_type in {"audio/wav", "audio/x-wav"}:
        ext = "wav"
    elif content_type == "audio/mp4":
        ext = "m4a"

    # Save to disk
    import time
    filename = f"audio_{sample_type}_{int(time.time())}.{ext}"
    if grid_x is not None and grid_y is not None:
        filename = f"audio_{sample_type}_{grid_x}_{grid_y}_{int(time.time())}.{ext}"
    local_path = _save_upload_file(file, UPLOAD_DIR / str(project_id) / "audio" / filename)

    audio = AudioSample(
        project_id=project_id,
        url=local_path,
        sample_type=sample_type,
        grid_x=grid_x,
        grid_y=grid_y,
    )
    db.add(audio)
    await db.flush()

    return AudioUploadResponse(
        id=audio.id,
        url=audio.url,
        snr_db=None,
        quality_passed=True,
    )
