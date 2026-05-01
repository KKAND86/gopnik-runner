"""Report generation router (PDF, JSON)."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.schemas import ReportExportRequest, ReportResponse
from app.models import User, Project

router = APIRouter()


@router.post("/export", response_model=ReportResponse)
async def export_report(
    req: ReportExportRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Project).where(Project.id == req.project_id, Project.user_id == current_user.id)
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    if project.status.value != "completed":
        raise HTTPException(status_code=400, detail="Project analysis not completed")
    
    # TODO: generate PDF with ReportLab / WeasyPrint
    # Include: defects, photos with annotations, SNiP refs, summary
    
    return ReportResponse(
        project_id=project.id,
        download_url=f"/api/v1/reports/download/{project.id}",
        expires_at=None,  # TODO
    )


@router.post("/{project_id}/dispute")
async def dispute_ai_verdict(
    project_id: UUID,
    defect_id: UUID,
    reason: str = "",
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """User disputes AI verdict — triggers refund + active learning."""
    result = await db.execute(
        select(Project).where(Project.id == project_id, Project.user_id == current_user.id)
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    # TODO: mark defect as disputed, queue for re-review
    # TODO: trigger refund if PAYG
    
    return {"message": "Dispute registered", "refund_initiated": project.tariff == "payg"}
