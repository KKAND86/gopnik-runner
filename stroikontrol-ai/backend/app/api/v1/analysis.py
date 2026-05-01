"""AI Analysis router — triggers ML pipeline."""

import os
import time
import uuid as uuid_mod
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.core.ml_inference import get_inference_engine
from app.schemas import AnalysisRequest, AnalysisResult, DefectItem, ErrorResponse
from app.models import User, Project, ProjectStatus

router = APIRouter()

# Base upload directory
UPLOAD_DIR = Path(os.getenv("UPLOAD_DIR", "uploads"))


def _map_defects(raw_defects: list, project_id: UUID) -> list:
    """Convert raw ML defects to schema DefectItem objects."""
    out = []
    for d in raw_defects:
        bbox = d.get("bbox")
        out.append(DefectItem(
            id=uuid_mod.uuid4(),
            defect_type=d.get("defect_type", "unknown"),
            severity=d.get("severity", "info"),
            confidence=d.get("confidence", 0.0),
            measured_value_mm=d.get("measured_value_mm"),
            threshold_mm=d.get("threshold_mm"),
            regulation_refs=d.get("regulation_refs", []),
            bbox=bbox,
        ))
    return out


@router.post("/start", response_model=AnalysisResult)
async def start_analysis(
    req: AnalysisRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Start AI analysis pipeline for a project."""
    result = await db.execute(
        select(Project).where(Project.id == req.project_id, Project.user_id == current_user.id)
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if project.status not in (ProjectStatus.CAPTURING, ProjectStatus.COMPLETED):
        raise HTTPException(status_code=400, detail="Project not ready for analysis")

    # Run analysis synchronously (for immediate feedback)
    # In production, move to background_tasks.add_task(...)
    analysis_output = await _run_analysis(project)

    # Update project with results
    project.status = ProjectStatus.COMPLETED if analysis_output['combined']['prediction'] == 'pass' else ProjectStatus.HUMAN_REVIEW
    project.analysis_result = analysis_output
    await db.flush()

    return AnalysisResult(
        project_id=project.id,
        status=project.status.value,
        scene_type=analysis_output.get('scene_type', 'tile'),
        defects=_map_defects(analysis_output.get('defects', []), project.id),
        overall_score=analysis_output['combined']['risk_score'],
        processing_time_seconds=analysis_output.get('processing_time', 0.0),
        human_review_required=project.status == ProjectStatus.HUMAN_REVIEW,
    )


async def _run_analysis(project: Project) -> dict:
    """Run ML inference on project photos and audio."""
    start_time = time.time()

    # Initialize inference engine (auto-falls back to MockInference if no models)
    engine = get_inference_engine()

    # Collect photo paths
    project_dir = UPLOAD_DIR / str(project.id)
    photo_paths = []
    if project_dir.exists():
        photo_paths = sorted([str(p) for p in project_dir.glob("*") if p.suffix.lower() in {'.jpg', '.jpeg', '.png'} and 'photo' in p.name])

    # Collect audio paths
    audio_paths = []
    audio_dir = project_dir / "audio"
    if audio_dir.exists():
        audio_paths = sorted([str(p) for p in audio_dir.glob("*") if p.suffix.lower() in {'.wav', '.m4a', '.mp4', '.aac'}])

    # Run inference
    results = engine.analyze_project(
        image_paths=photo_paths,
        audio_paths=audio_paths,
    )

    results['processing_time'] = round(time.time() - start_time, 2)
    results['scene_type'] = f"{project.room_type}_{project.surface_type}"

    return results


@router.get("/{project_id}", response_model=AnalysisResult)
async def get_analysis_status(
    project_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get current analysis status and results."""
    result = await db.execute(
        select(Project).where(Project.id == project_id, Project.user_id == current_user.id)
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Load analysis results from project
    analysis_data = project.analysis_result or {}

    return AnalysisResult(
        project_id=project.id,
        status=project.status.value,
        scene_type=analysis_data.get("scene_type"),
        defects=_map_defects(analysis_data.get("defects", []), project.id),
        overall_score=analysis_data.get("combined", {}).get("risk_score"),
        processing_time_seconds=analysis_data.get("processing_time", 0.0),
        human_review_required=project.status == ProjectStatus.HUMAN_REVIEW,
    )
