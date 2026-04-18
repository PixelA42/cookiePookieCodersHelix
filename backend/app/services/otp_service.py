from datetime import datetime, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.security import generate_numeric_otp, hash_otp
from app.models import OtpVerification, User


def get_active_otp_record(db: Session, user_id: int) -> OtpVerification | None:
    stmt = (
        select(OtpVerification)
        .where(OtpVerification.user_id == user_id, OtpVerification.is_active.is_(True))
        .order_by(OtpVerification.created_at.desc())
    )
    return db.execute(stmt).scalars().first()


def deactivate_active_otp(db: Session, user_id: int) -> None:
    active = get_active_otp_record(db, user_id)
    if active:
        active.is_active = False


def issue_new_otp(db: Session, user: User) -> tuple[OtpVerification, str]:
    settings = get_settings()
    now = datetime.utcnow()

    deactivate_active_otp(db, user.id)

    otp_code = generate_numeric_otp()
    record = OtpVerification(
        user_id=user.id,
        otp_hash=hash_otp(otp_code),
        attempts=0,
        expires_at=now + timedelta(minutes=settings.otp_expire_minutes),
        resend_available_at=now + timedelta(seconds=settings.otp_resend_cooldown_seconds),
        is_active=True,
    )
    db.add(record)
    db.flush()
    return record, otp_code
