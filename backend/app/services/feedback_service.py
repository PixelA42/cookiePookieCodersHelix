from sqlalchemy import and_, or_, select
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.inspection import inspect

from app.models import FeedbackStatus, Match, MatchFeedback, MatchFeedbackEvent, User
from app.schemas import FeedbackHistoryItem


def _user_id(user: User) -> int:
    identity = inspect(user).identity
    return int(identity[0]) if identity else int(user.id)


def get_match_for_user(db: Session, user: User, match_id: int) -> Match | None:
    user_id = _user_id(user)
    stmt = select(Match).where(
        and_(
            Match.id == match_id,
            or_(Match.producer_user_id == user_id, Match.consumer_user_id == user_id),
        )
    )
    return db.execute(stmt).scalars().first()


def upsert_feedback(db: Session, match_id: int, user: User, feedback_label) -> MatchFeedback:
    user_id = _user_id(user)
    stmt = select(MatchFeedback).where(MatchFeedback.match_id == match_id, MatchFeedback.user_id == user_id)
    existing = db.execute(stmt).scalars().first()
    if existing:
        existing.feedback_label = feedback_label
        db.commit()
        db.refresh(existing)
        return existing

    feedback = MatchFeedback(match_id=match_id, user_id=user_id, feedback_label=feedback_label)
    db.add(feedback)
    db.commit()
    db.refresh(feedback)
    return feedback


def record_feedback_event(db: Session, match_id: int, user: User, status: str | None, reason: str | None) -> None:
    if status is None:
        return
    event = MatchFeedbackEvent(
        match_id=match_id,
        user_id=_user_id(user),
        status=FeedbackStatus(status),
        reason=reason,
    )
    db.add(event)
    db.commit()


def list_feedback_history_for_user(db: Session, user: User) -> list[FeedbackHistoryItem]:
    user_id = _user_id(user)
    stmt = (
        select(MatchFeedback, Match)
        .join(Match, Match.id == MatchFeedback.match_id)
        .options(joinedload(Match.producer_user), joinedload(Match.consumer_user))
        .where(MatchFeedback.user_id == user_id)
        .order_by(MatchFeedback.updated_at.desc(), MatchFeedback.id.desc())
    )
    rows = db.execute(stmt).all()
    history: list[FeedbackHistoryItem] = []
    for feedback, match in rows:
        counterpart = match.consumer_user if user_id == match.producer_user_id else match.producer_user
        history.append(
            FeedbackHistoryItem(
                id=feedback.id,
                match_id=feedback.match_id,
                user_id=feedback.user_id,
                feedback_label=feedback.feedback_label,
                counterpart_organization_name=counterpart.organization_name,
                compatibility_score=match.compatibility_score,
                created_at=feedback.created_at,
                updated_at=feedback.updated_at,
            )
        )
    return history
