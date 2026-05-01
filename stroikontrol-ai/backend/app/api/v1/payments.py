"""Payment processing router (YooKassa, Apple Pay, Google Pay, SBP)."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.core.config import settings
from app.schemas import CreatePaymentRequest, PaymentResponse
from app.models import User, Payment, TariffType

router = APIRouter()


TARIFF_PRICES = {
    TariffType.PAYG: 199,
    TariffType.B2C_MONTHLY: 499,
    TariffType.B2C_YEARLY: 3999,
    TariffType.B2B_STARTER: 4990,
    TariffType.B2B_PRO: 14990,
    TariffType.B2B_ENTERPRISE: 49990,
}


@router.post("/create", response_model=PaymentResponse)
async def create_payment(
    req: CreatePaymentRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create payment session."""
    amount = TARIFF_PRICES.get(req.tariff)
    if amount is None:
        raise HTTPException(status_code=400, detail="Invalid tariff")
    
    payment = Payment(
        user_id=current_user.id,
        project_id=req.project_id,
        amount_rub=amount,
        tariff=req.tariff,
        provider=settings.PAYMENT_PROVIDER,
        status="pending",
    )
    db.add(payment)
    await db.flush()
    
    # TODO: integrate YooKassa / Stripe / SBP
    # Return payment URL for redirect
    
    return PaymentResponse(
        id=payment.id,
        amount_rub=amount,
        tariff=req.tariff,
        provider=settings.PAYMENT_PROVIDER,
        status="pending",
        payment_url=None,
        created_at=payment.created_at,
    )


@router.post("/webhook/{provider}")
async def payment_webhook(provider: str, payload: dict):
    """Webhook for payment provider callbacks."""
    # TODO: validate signature, update payment status
    # TODO: activate subscription on success
    return {"status": "ok"}
