from sqlalchemy import and_, or_, select
from sqlalchemy.inspection import inspect
from sqlalchemy.orm import Session, joinedload

from app.models import ConnectionRequest, ConnectionStatus, Match, User
from app.schemas import ConnectionRequestResponse


def _user_id(user: User) -> int:
    identity = inspect(user).identity
    return int(identity[0]) if identity else int(user.id)


def list_connections_for_user(db: Session, user: User) -> list[ConnectionRequestResponse]:
    user_id = _user_id(user)
    stmt = (
        select(ConnectionRequest)
        .where(
            or_(
                ConnectionRequest.requester_user_id == user_id,
                ConnectionRequest.counterpart_user_id == user_id,
            )
        )
        .options(
            joinedload(ConnectionRequest.requester_user),
            joinedload(ConnectionRequest.counterpart_user),
        )
        .order_by(ConnectionRequest.updated_at.desc(), ConnectionRequest.id.desc())
    )
    rows = db.execute(stmt).scalars().all()
    return [_to_response(item, user_id) for item in rows]


def create_connection_request(
    db: Session,
    user: User,
    match_id: int,
    message: str | None,
) -> ConnectionRequestResponse | None:
    requester_id = _user_id(user)
    match = _get_user_match(db, requester_id, match_id)
    if not match:
        return None
    counterpart_id = match.consumer_user_id if requester_id == match.producer_user_id else match.producer_user_id

    existing_stmt = select(ConnectionRequest).where(
        and_(
            ConnectionRequest.match_id == match_id,
            or_(
                and_(
                    ConnectionRequest.requester_user_id == requester_id,
                    ConnectionRequest.counterpart_user_id == counterpart_id,
                ),
                and_(
                    ConnectionRequest.requester_user_id == counterpart_id,
                    ConnectionRequest.counterpart_user_id == requester_id,
                ),
            ),
        )
    )
    existing = db.execute(existing_stmt).scalars().first()
    if existing:
        existing.status = ConnectionStatus.pending
        existing.message = message
        if existing.requester_user_id != requester_id:
            existing.requester_user_id = requester_id
            existing.counterpart_user_id = counterpart_id
        db.commit()
        db.refresh(existing)
        return _to_response(existing, requester_id)

    created = ConnectionRequest(
        match_id=match_id,
        requester_user_id=requester_id,
        counterpart_user_id=counterpart_id,
        status=ConnectionStatus.pending,
        message=message,
    )
    db.add(created)
    db.commit()
    db.refresh(created)
    return _to_response(created, requester_id)


def update_connection_status(
    db: Session,
    user: User,
    request_id: int,
    status: ConnectionStatus,
) -> ConnectionRequestResponse | None:
    user_id = _user_id(user)
    stmt = select(ConnectionRequest).where(
        and_(
            ConnectionRequest.id == request_id,
            or_(
                ConnectionRequest.requester_user_id == user_id,
                ConnectionRequest.counterpart_user_id == user_id,
            ),
        )
    )
    row = db.execute(stmt).scalars().first()
    if not row:
        return None

    row.status = status
    db.commit()
    db.refresh(row)
    return _to_response(row, user_id)


def _get_user_match(db: Session, user_id: int, match_id: int) -> Match | None:
    stmt = select(Match).where(
        and_(
            Match.id == match_id,
            or_(Match.producer_user_id == user_id, Match.consumer_user_id == user_id),
        )
    )
    return db.execute(stmt).scalars().first()


def _to_response(row: ConnectionRequest, current_user_id: int) -> ConnectionRequestResponse:
    counterpart = row.counterpart_user if row.requester_user_id == current_user_id else row.requester_user
    return ConnectionRequestResponse(
        id=row.id,
        match_id=row.match_id,
        requester_user_id=row.requester_user_id,
        counterpart_user_id=counterpart.id,
        counterpart_organization_name=counterpart.organization_name,
        status=row.status,
        message=row.message,
        created_at=row.created_at,
        updated_at=row.updated_at,
    )
