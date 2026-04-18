from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import get_verified_current_user
from app.db import get_db
from app.models import User
from app.schemas import GenerateMatchesRequest, GenerateMatchesResponse, MatchDetailResponse, MatchListResponse
from app.services.match_service import generate_matches_for_user, get_match_detail_for_user, list_matches_for_user

router = APIRouter(prefix="/matches", tags=["matches"])


@router.get("", response_model=MatchListResponse)
def list_matches(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_verified_current_user),
):
    return list_matches_for_user(db, current_user)


@router.post("/generate", response_model=GenerateMatchesResponse)
def generate_matches(
    payload: GenerateMatchesRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_verified_current_user),
):
    return generate_matches_for_user(db, current_user, max_candidates=payload.max_candidates)


@router.get("/{match_id}", response_model=MatchDetailResponse)
def get_match_detail(
    match_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_verified_current_user),
):
    match_detail = get_match_detail_for_user(db, current_user, match_id)
    if not match_detail:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Match not found")
    return match_detail
