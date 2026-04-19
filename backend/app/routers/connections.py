from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import get_verified_current_user
from app.db import get_db
from app.models import User
from app.schemas import (
    ConnectionRequestCreateRequest,
    ConnectionRequestListResponse,
    ConnectionRequestResponse,
    ConnectionRequestStatusUpdateRequest,
)
from app.services.connection_service import (
    create_connection_request,
    list_connections_for_user,
    update_connection_status,
)

router = APIRouter(prefix="/connections", tags=["connections"])


@router.get("", response_model=ConnectionRequestListResponse)
def list_connections(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_verified_current_user),
):
    return ConnectionRequestListResponse(items=list_connections_for_user(db, current_user))


@router.post("", response_model=ConnectionRequestResponse, status_code=status.HTTP_201_CREATED)
def create_connection(
    payload: ConnectionRequestCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_verified_current_user),
):
    created = create_connection_request(
        db,
        current_user,
        match_id=payload.match_id,
        message=payload.message,
    )
    if not created:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Match not found")
    return created


@router.patch("/{request_id}", response_model=ConnectionRequestResponse)
def patch_connection(
    request_id: int,
    payload: ConnectionRequestStatusUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_verified_current_user),
):
    updated = update_connection_status(db, current_user, request_id=request_id, status=payload.status)
    if not updated:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Connection request not found")
    return updated
