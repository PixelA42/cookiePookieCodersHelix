from datetime import datetime
from enum import Enum

from sqlalchemy import Boolean, DateTime, Enum as SqlEnum, Float, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


class UserRole(str, Enum):
    producer = "producer"
    consumer = "consumer"


class FeedbackLabel(str, Enum):
    useful = "useful"
    not_useful = "not_useful"


class ConnectionStatus(str, Enum):
    pending = "pending"
    accepted = "accepted"
    rejected = "rejected"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    organization_name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(320), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(SqlEnum(UserRole, name="user_role"), nullable=False)
    is_email_verified: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    otp_records: Mapped[list["OtpVerification"]] = relationship(
        "OtpVerification", back_populates="user", cascade="all, delete-orphan"
    )
    producer_profile: Mapped["ProducerProfile | None"] = relationship(
        "ProducerProfile", back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
    consumer_profile: Mapped["ConsumerProfile | None"] = relationship(
        "ConsumerProfile", back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
    producer_matches: Mapped[list["Match"]] = relationship(
        "Match", foreign_keys="Match.producer_user_id", back_populates="producer_user"
    )
    consumer_matches: Mapped[list["Match"]] = relationship(
        "Match", foreign_keys="Match.consumer_user_id", back_populates="consumer_user"
    )
    match_feedback: Mapped[list["MatchFeedback"]] = relationship(
        "MatchFeedback", back_populates="user", cascade="all, delete-orphan"
    )
    connections_requested: Mapped[list["ConnectionRequest"]] = relationship(
        "ConnectionRequest",
        foreign_keys="ConnectionRequest.requester_user_id",
        back_populates="requester_user",
        cascade="all, delete-orphan",
    )
    connections_received: Mapped[list["ConnectionRequest"]] = relationship(
        "ConnectionRequest",
        foreign_keys="ConnectionRequest.counterpart_user_id",
        back_populates="counterpart_user",
        cascade="all, delete-orphan",
    )


class OtpVerification(Base):
    __tablename__ = "otp_verifications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    otp_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    attempts: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    resend_available_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    user: Mapped[User] = relationship("User", back_populates="otp_records")


class ProducerProfile(Base):
    __tablename__ = "producer_profiles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True, index=True
    )
    facility_name: Mapped[str] = mapped_column(String(255), nullable=False)
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    supply_temperature_c: Mapped[float] = mapped_column(Float, nullable=False)
    heat_output_kw: Mapped[float] = mapped_column(Float, nullable=False)
    schedule_description: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    user: Mapped[User] = relationship("User", back_populates="producer_profile")


class ConsumerProfile(Base):
    __tablename__ = "consumer_profiles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True, index=True
    )
    facility_name: Mapped[str] = mapped_column(String(255), nullable=False)
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    demand_temperature_c: Mapped[float] = mapped_column(Float, nullable=False)
    flow_rate_lph: Mapped[float] = mapped_column(Float, nullable=False)
    schedule_description: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    user: Mapped[User] = relationship("User", back_populates="consumer_profile")


class Match(Base):
    __tablename__ = "matches"
    __table_args__ = (UniqueConstraint("producer_user_id", "consumer_user_id", name="uq_match_pair"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    producer_user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    consumer_user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    compatibility_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    integration_state: Mapped[str] = mapped_column(String(64), default="model_unavailable", nullable=False)
    model_version: Mapped[str | None] = mapped_column(String(64), nullable=True)
    generated_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    producer_user: Mapped[User] = relationship(
        "User", foreign_keys=[producer_user_id], back_populates="producer_matches"
    )
    consumer_user: Mapped[User] = relationship(
        "User", foreign_keys=[consumer_user_id], back_populates="consumer_matches"
    )
    feedback_entries: Mapped[list["MatchFeedback"]] = relationship(
        "MatchFeedback", back_populates="match", cascade="all, delete-orphan"
    )


class MatchFeedback(Base):
    __tablename__ = "match_feedback"
    __table_args__ = (UniqueConstraint("match_id", "user_id", name="uq_match_feedback_user"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    match_id: Mapped[int] = mapped_column(
        ForeignKey("matches.id", ondelete="CASCADE"), nullable=False, index=True
    )
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    feedback_label: Mapped[FeedbackLabel] = mapped_column(
        SqlEnum(FeedbackLabel, name="feedback_label"), nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    match: Mapped[Match] = relationship("Match", back_populates="feedback_entries")
    user: Mapped[User] = relationship("User", back_populates="match_feedback")


class ConnectionRequest(Base):
    __tablename__ = "connection_requests"
    __table_args__ = (
        UniqueConstraint("match_id", "requester_user_id", "counterpart_user_id", name="uq_connection_request_triplet"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    match_id: Mapped[int] = mapped_column(ForeignKey("matches.id", ondelete="CASCADE"), nullable=False, index=True)
    requester_user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    counterpart_user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    status: Mapped[ConnectionStatus] = mapped_column(
        SqlEnum(ConnectionStatus, name="connection_status"), default=ConnectionStatus.pending, nullable=False
    )
    message: Mapped[str | None] = mapped_column(String(500), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )

    match: Mapped[Match] = relationship("Match")
    requester_user: Mapped[User] = relationship(
        "User", foreign_keys=[requester_user_id], back_populates="connections_requested"
    )
    counterpart_user: Mapped[User] = relationship(
        "User", foreign_keys=[counterpart_user_id], back_populates="connections_received"
    )
