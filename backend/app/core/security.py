import hashlib
import hmac
import secrets
from datetime import UTC, datetime, timedelta

from jose import jwt
from passlib.context import CryptContext

from app.core.config import get_settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, password_hash: str) -> bool:
    return pwd_context.verify(plain_password, password_hash)


def create_access_token(subject: str) -> str:
    settings = get_settings()
    now = datetime.now(UTC)
    expire = now + timedelta(minutes=settings.access_token_expire_minutes)
    payload = {"sub": subject, "iat": int(now.timestamp()), "exp": int(expire.timestamp())}
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def generate_numeric_otp(length: int = 6) -> str:
    if length < 4:
        raise ValueError("OTP length must be at least 4 digits")

    return "".join(secrets.choice("0123456789") for _ in range(length))


def hash_otp(otp: str) -> str:
    settings = get_settings()
    digest = hmac.new(
        key=settings.jwt_secret_key.encode("utf-8"),
        msg=otp.encode("utf-8"),
        digestmod=hashlib.sha256,
    ).hexdigest()
    return digest


def verify_otp(plain_otp: str, stored_hash: str) -> bool:
    calculated_hash = hash_otp(plain_otp)
    return hmac.compare_digest(calculated_hash, stored_hash)
