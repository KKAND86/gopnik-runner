"""
Seed script for development database.
Run: python -m app.scripts.seed
"""

import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import AsyncSessionLocal
from app.models import User, Project, Defect, TariffType, UserType, ProjectStatus, DefectSeverity


async def seed():
    async with AsyncSessionLocal() as db:
        # Create test user
        user = User(
            phone="+79990000001",
            name="Тестовый Пользователь",
            user_type=UserType.CUSTOMER,
            consent_given=True,
            tariff=TariffType.PAYG,
        )
        db.add(user)
        await db.flush()

        # Create test project
        project = Project(
            user_id=user.id,
            title="Ванная комната — стены",
            room_type="bathroom",
            surface_type="wall",
            status=ProjectStatus.COMPLETED,
            calibration_object="coin5",
            calibration_size_mm=25.0,
            calibration_valid=True,
        )
        db.add(project)
        await db.flush()

        # Create test defects
        defects = [
            Defect(
                project_id=project.id,
                defect_type="uneven_joint",
                severity=DefectSeverity.CRITICAL,
                confidence=0.92,
                measured_value_mm=3.2,
                threshold_mm=2.0,
                regulation_refs=["СНиП 3.04.01-87"],
            ),
            Defect(
                project_id=project.id,
                defect_type="missing_joint",
                severity=DefectSeverity.WARNING,
                confidence=0.78,
                measured_value_mm=0.0,
                threshold_mm=5.0,
                regulation_refs=["ГОСТ 13958-74"],
                ai_verdict="human_review",
            ),
        ]
        db.add_all(defects)
        await db.commit()
        
        print(f"Seeded: user={user.id}, project={project.id}, defects={len(defects)}")


if __name__ == "__main__":
    asyncio.run(seed())
