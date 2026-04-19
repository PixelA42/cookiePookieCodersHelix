from pydantic import BaseModel, EmailStr, Field

from datetime import datetime

from app.models import ConnectionStatus, FeedbackLabel, UserRole


class RegisterRequest(BaseModel):
    organization_name: str = Field(min_length=2, max_length=255)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    role: UserRole


class VerifyOtpRequest(BaseModel):
    email: EmailStr
    otp_code: str = Field(min_length=4, max_length=10)


class ResendOtpRequest(BaseModel):
    email: EmailStr


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class MessageResponse(BaseModel):
    message: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class ProducerProfileCreateRequest(BaseModel):
    facility_name: str = Field(min_length=2, max_length=255)
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    supply_temperature_c: float
    heat_output_kw: float = Field(gt=0)
    schedule_description: str = Field(min_length=2, max_length=255)


class ProducerProfileUpdateRequest(BaseModel):
    facility_name: str | None = Field(default=None, min_length=2, max_length=255)
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)
    supply_temperature_c: float | None = None
    heat_output_kw: float | None = Field(default=None, gt=0)
    schedule_description: str | None = Field(default=None, min_length=2, max_length=255)


class ProducerProfileResponse(BaseModel):
    id: int
    user_id: int
    facility_name: str
    latitude: float
    longitude: float
    supply_temperature_c: float
    heat_output_kw: float
    schedule_description: str

    model_config = {"from_attributes": True}


class ConsumerProfileCreateRequest(BaseModel):
    facility_name: str = Field(min_length=2, max_length=255)
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    demand_temperature_c: float
    flow_rate_lph: float = Field(gt=0)
    schedule_description: str = Field(min_length=2, max_length=255)


class ConsumerProfileUpdateRequest(BaseModel):
    facility_name: str | None = Field(default=None, min_length=2, max_length=255)
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)
    demand_temperature_c: float | None = None
    flow_rate_lph: float | None = Field(default=None, gt=0)
    schedule_description: str | None = Field(default=None, min_length=2, max_length=255)


class ConsumerProfileResponse(BaseModel):
    id: int
    user_id: int
    facility_name: str
    latitude: float
    longitude: float
    demand_temperature_c: float
    flow_rate_lph: float
    schedule_description: str

    model_config = {"from_attributes": True}


class MatchCardResponse(BaseModel):
    match_id: int
    counterpart_user_id: int
    counterpart_organization_name: str
    counterpart_role: UserRole
    compatibility_score: float | None
    integration_state: str
    model_version: str | None


class MatchListResponse(BaseModel):
    integration_state: str
    items: list[MatchCardResponse]


class GenerateMatchesRequest(BaseModel):
    max_candidates: int = Field(default=100, ge=1, le=1000)


class GenerateMatchesResponse(BaseModel):
    integration_state: str
    model_version: str | None
    generated_count: int
    updated_count: int


class ProfileSummaryResponse(BaseModel):
    facility_name: str
    latitude: float
    longitude: float
    schedule_description: str
    supply_temperature_c: float | None = None
    heat_output_kw: float | None = None
    demand_temperature_c: float | None = None
    flow_rate_lph: float | None = None


class MatchDetailResponse(BaseModel):
    match_id: int
    producer_user_id: int
    consumer_user_id: int
    compatibility_score: float | None
    integration_state: str
    model_version: str | None
    producer_profile: ProfileSummaryResponse | None
    consumer_profile: ProfileSummaryResponse | None


class FeedbackRequest(BaseModel):
    feedback_label: FeedbackLabel


class FeedbackResponse(BaseModel):
    id: int
    match_id: int
    user_id: int
    feedback_label: FeedbackLabel
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class FeedbackHistoryItem(BaseModel):
    id: int
    match_id: int
    user_id: int
    feedback_label: FeedbackLabel
    counterpart_organization_name: str
    compatibility_score: float | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class FeedbackHistoryResponse(BaseModel):
    items: list[FeedbackHistoryItem]


class ConnectionRequestCreateRequest(BaseModel):
    match_id: int = Field(gt=0)
    message: str | None = Field(default=None, max_length=500)


class ConnectionRequestStatusUpdateRequest(BaseModel):
    status: ConnectionStatus


class ConnectionRequestResponse(BaseModel):
    id: int
    match_id: int
    requester_user_id: int
    counterpart_user_id: int
    counterpart_organization_name: str
    status: ConnectionStatus
    message: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ConnectionRequestListResponse(BaseModel):
    items: list[ConnectionRequestResponse]
