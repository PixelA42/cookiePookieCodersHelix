from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models import User, UserRole


def seed_mock_users(db: Session) -> None:
    mock_users = [
        {
            "organization_name": "Mock Factory Alpha",
            "email": "producer.mock@heatreco.local",
            "password": "MockPassword123!",
            "role": UserRole.producer,
            "is_email_verified": True,
        },
        {
            "organization_name": "Mock Greenhouse Beta",
            "email": "consumer.mock@heatreco.local",
            "password": "MockPassword123!",
            "role": UserRole.consumer,
            "is_email_verified": True,
        },
    ]

    for item in mock_users:
        stmt = select(User).where(User.email == item["email"])
        existing_user = db.execute(stmt).scalars().first()
        if existing_user:
            continue

        db.add(
            User(
                organization_name=item["organization_name"],
                email=item["email"],
                password_hash=hash_password(item["password"]),
                role=item["role"],
                is_email_verified=item["is_email_verified"],
            )
        )

    db.commit()
