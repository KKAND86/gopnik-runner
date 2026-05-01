"""Expert review dashboard API."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from uuid import UUID

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.schemas import ExpertReviewRequest, ExpertQueueItem
from app.models import User, UserType, Project, ProjectStatus, ExpertReviewQueue, Defect

router = APIRouter()


async def require_expert(current_user: User = Depends(get_current_user)):
    if current_user.user_type not in (UserType.EXPERT, UserType.ADMIN):
        raise HTTPException(status_code=403, detail="Expert access required")
    return current_user


@router.get("/queue", response_model=list[ExpertQueueItem])
async def get_review_queue(
    db: AsyncSession = Depends(get_db),
    expert: User = Depends(require_expert),
):
    """Get pending review items for expert."""
    result = await db.execute(
        select(ExpertReviewQueue)
        .where(ExpertReviewQueue.status == "pending")
        .order_by(ExpertReviewQueue.priority.desc(), ExpertReviewQueue.sla_deadline.asc())
        .limit(50)
    )
    items = result.scalars().all()
    return [ExpertQueueItem.model_validate(i) for i in items]


@router.post("/queue/{queue_id}/assign")
async def assign_review(
    queue_id: UUID,
    db: AsyncSession = Depends(get_db),
    expert: User = Depends(require_expert),
):
    """Assign review to expert."""
    result = await db.execute(
        select(ExpertReviewQueue).where(ExpertReviewQueue.id == queue_id)
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Queue item not found")
    
    item.expert_id = expert.id
    item.status = "assigned"
    await db.flush()
    return {"message": "Assigned"}


@router.post("/defects/{defect_id}/review")
async def submit_review(
    defect_id: UUID,
    req: ExpertReviewRequest,
    db: AsyncSession = Depends(get_db),
    expert: User = Depends(require_expert),
):
    """Submit expert verdict for a defect."""
    result = await db.execute(
        select(Defect).where(Defect.id == defect_id)
    )
    defect = result.scalar_one_or_none()
    if not defect:
        raise HTTPException(status_code=404, detail="Defect not found")
    
    defect.expert_verdict = req.verdict
    defect.expert_adjusted_value_mm = req.adjusted_value_mm
    defect.expert_notes = req.notes
    
    await db.flush()
    return {"message": "Review submitted"}
