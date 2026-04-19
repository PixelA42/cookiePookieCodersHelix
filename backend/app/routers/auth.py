from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.security import create_access_token, hash_password, get_verified_current_user, verify_otp, verify_password
from app.db import get_db
from app.models import User
from app.schemas import (
    CurrentUserResponse,
    LoginRequest,
    MessageResponse,
    RegisterRequest,
    ResendOtpRequest,
    TokenResponse,
    UpdateCurrentUserRequest,
    VerifyOtpRequest,
)
from app.services.email_service import send_otp_email
from app.services.otp_service import get_active_otp_record, issue_new_otp

router = APIRouter(prefix="/auth", tags=["auth"])
public_router = APIRouter(tags=["auth"])


def _find_user_by_email(db: Session, email: str) -> User | None:
    stmt = select(User).where(User.email == email.lower().strip())
    return db.execute(stmt).scalars().first()


@router.post("/register", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
@public_router.post("/register", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    existing_user = _find_user_by_email(db, payload.email)
    if existing_user and existing_user.is_email_verified:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="User already exists")

    if existing_user and not existing_user.is_email_verified:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="User is pending verification. Use resend OTP.",
        )

    user = User(
        organization_name=payload.organization_name.strip(),
        email=payload.email.lower().strip(),
        password_hash=hash_password(payload.password),
        role=payload.role,
        is_email_verified=False,
    )
    db.add(user)
    db.flush()

    _, otp_code = issue_new_otp(db, user)

    try:
        send_otp_email(recipient_email=user.email, otp_code=otp_code, org_name=user.organization_name)
    except Exception as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to send OTP email: {exc}",
        ) from exc

    db.commit()
    return MessageResponse(message="Registration successful. OTP sent to email.")


@router.post("/verify-otp", response_model=MessageResponse)
def verify_signup_otp(payload: VerifyOtpRequest, db: Session = Depends(get_db)):
    settings = get_settings()
    user = _find_user_by_email(db, payload.email)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if user.is_email_verified:
        return MessageResponse(message="Email already verified")

    otp_record = get_active_otp_record(db, user.id)
    if not otp_record:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No active OTP. Request resend.")

    now = datetime.utcnow()
    if now > otp_record.expires_at:
        otp_record.is_active = False
        db.commit()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="OTP expired")

    if otp_record.attempts >= settings.otp_max_attempts:
        otp_record.is_active = False
        db.commit()
        raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="OTP attempts exhausted")

    if not verify_otp(payload.otp_code, otp_record.otp_hash):
        otp_record.attempts += 1
        if otp_record.attempts >= settings.otp_max_attempts:
            otp_record.is_active = False
        db.commit()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid OTP")

    otp_record.is_active = False
    user.is_email_verified = True
    db.commit()
    return MessageResponse(message="Email verified successfully")


@router.post("/resend-otp", response_model=MessageResponse)
def resend_signup_otp(payload: ResendOtpRequest, db: Session = Depends(get_db)):
    user = _find_user_by_email(db, payload.email)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    if user.is_email_verified:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already verified")

    active_otp = get_active_otp_record(db, user.id)
    now = datetime.utcnow()
    if active_otp and now < active_otp.resend_available_at:
        seconds_remaining = int((active_otp.resend_available_at - now).total_seconds())
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=f"Resend available in {max(seconds_remaining, 1)} seconds",
        )

    _, otp_code = issue_new_otp(db, user)
    try:
        send_otp_email(recipient_email=user.email, otp_code=otp_code, org_name=user.organization_name)
    except Exception as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to send OTP email: {exc}",
        ) from exc

    db.commit()
    return MessageResponse(message="OTP resent successfully")


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = _find_user_by_email(db, payload.email)
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    if not user.is_email_verified:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Email not verified")

    token = create_access_token(subject=str(user.id))
    return TokenResponse(access_token=token)


@router.get("/me", response_model=CurrentUserResponse)
def get_current_account(current_user: User = Depends(get_verified_current_user)):
    return current_user


@router.put("/me", response_model=CurrentUserResponse)
def update_current_account(
    payload: UpdateCurrentUserRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_verified_current_user),
):
    persisted_user = db.get(User, current_user.id)
    if not persisted_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    persisted_user.organization_name = payload.organization_name.strip()
    db.commit()
    db.refresh(persisted_user)
    return persisted_user
