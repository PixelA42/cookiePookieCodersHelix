from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import get_verified_current_user
from app.db import get_db
from app.models import User
from app.schemas import FeedbackHistoryResponse, FeedbackRequest, FeedbackResponse
from app.services.feedback_service import get_match_for_user, list_feedback_history_for_user, upsert_feedback

router = APIRouter(prefix="/matches", tags=["feedback"])


@router.get("/feedback/history", response_model=FeedbackHistoryResponse)
def feedback_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_verified_current_user),
):
    return FeedbackHistoryResponse(items=list_feedback_history_for_user(db, current_user))


@router.post("/{match_id}/feedback", response_model=FeedbackResponse)
def submit_feedback(
    match_id: int,
    payload: FeedbackRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_verified_current_user),
):
    match = get_match_for_user(db, current_user, match_id)
    if not match:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Match not found")
    return upsert_feedback(db, match_id=match_id, user=current_user, feedback_label=payload.feedback_label)
