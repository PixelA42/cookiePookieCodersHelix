from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_name: str = "HeatREco API"
    api_v1_prefix: str = "/api/v1"

    database_url: str = Field(..., alias="DATABASE_URL")
    mock_seed_on_startup: bool = Field(False, alias="MOCK_SEED_ON_STARTUP")

    jwt_secret_key: str = Field(..., alias="JWT_SECRET_KEY")
    jwt_algorithm: str = Field("HS256", alias="JWT_ALGORITHM")
    access_token_expire_minutes: int = Field(60, alias="ACCESS_TOKEN_EXPIRE_MINUTES")

    otp_expire_minutes: int = Field(10, alias="OTP_EXPIRE_MINUTES")
    otp_max_attempts: int = Field(3, alias="OTP_MAX_ATTEMPTS")
    otp_resend_cooldown_seconds: int = Field(90, alias="OTP_RESEND_COOLDOWN_SECONDS")

    smtp_host: str = Field(..., alias="SMTP_HOST")
    smtp_port: int = Field(587, alias="SMTP_PORT")
    smtp_username: str = Field(..., alias="SMTP_USERNAME")
    smtp_password: str = Field(..., alias="SMTP_PASSWORD")
    smtp_from_email: str = Field(..., alias="SMTP_FROM_EMAIL")
    smtp_use_tls: bool = Field(True, alias="SMTP_USE_TLS")

    ml_service_url: str | None = Field(None, alias="ML_SERVICE_URL")
    ml_service_timeout_seconds: int = Field(8, alias="ML_SERVICE_TIMEOUT_SECONDS")


@lru_cache
def get_settings() -> Settings:
    return Settings()
