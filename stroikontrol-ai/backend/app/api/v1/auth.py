"""Authentication router: phone + SMS OTP."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.config import settings
from app.core.security import create_access_token, hash_otp_secret
from app.schemas import PhoneRequest, OTPVerifyRequest, TokenResponse, UserResponse
from app.models import User, UserType

router = APIRouter()


# Mock OTP storage (use Redis in production)
_otp_store: dict[str, str] = {}


def _generate_otp() -> str:
    import random
    return f"{random.randint(100000, 999999)}"


def _send_sms_mock(phone: str, code: str):
    print(f"[SMS MOCK] To {phone}: Your code is {code}")


@router.post("/otp/send", response_model=dict)
async def send_otp(req: PhoneRequest, db: AsyncSession = Depends(get_db)):
    """Send SMS OTP to phone number."""
    # Validate Russian phone
    if not req.phone.startswith("+7") or len(req.phone) != 12:
        raise HTTPException(status_code=400, detail="Invalid phone format. Use +7XXXXXXXXXX")
    
    code = _generate_otp()
    _otp_store[req.phone] = code
    
    if settings.SMS_PROVIDER == "mock":
        _send_sms_mock(req.phone, code)
    # TODO: integrate real SMS provider
    
    return {"message": "OTP sent", "expires_in": settings.OTP_EXPIRE_MINUTES * 60}


@router.post("/otp/verify", response_model=TokenResponse)
async def verify_otp(req: OTPVerifyRequest, db: AsyncSession = Depends(get_db)):
    """Verify OTP and return JWT token."""
    stored = _otp_store.get(req.phone)
    if not stored or stored != req.code:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")
    
    del _otp_store[req.phone]
    
    # Find or create user
    result = await db.execute(select(User).where(User.phone == req.phone))
    user = result.scalar_one_or_none()
    
    if not user:
        user = User(
            phone=req.phone,
            user_type=UserType.CUSTOMER,
            consent_given=False,
        )
        db.add(user)
        await db.flush()
    
    token = create_access_token({"sub": str(user.id), "phone": user.phone})
    
    return TokenResponse(
        access_token=token,
        user=UserResponse.model_validate(user),
    )
