from sqlalchemy import and_, or_, select
from sqlalchemy.orm import Session

from app.models import Match, MatchFeedback, User


def get_match_for_user(db: Session, user: User, match_id: int) -> Match | None:
    stmt = select(Match).where(
        and_(
            Match.id == match_id,
            or_(Match.producer_user_id == user.id, Match.consumer_user_id == user.id),
        )
    )
    return db.execute(stmt).scalars().first()


def upsert_feedback(db: Session, match_id: int, user: User, feedback_label) -> MatchFeedback:
    stmt = select(MatchFeedback).where(MatchFeedback.match_id == match_id, MatchFeedback.user_id == user.id)
    existing = db.execute(stmt).scalars().first()
    if existing:
        existing.feedback_label = feedback_label
        db.commit()
        db.refresh(existing)
        return existing

    feedback = MatchFeedback(match_id=match_id, user_id=user.id, feedback_label=feedback_label)
    db.add(feedback)
    db.commit()
    db.refresh(feedback)
    return feedback
