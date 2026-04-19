from database import Base, engine, test_connection
from sample_user_model import User  # noqa: F401


def main() -> None:
    if not test_connection():
        raise SystemExit("Connection failed")

    Base.metadata.create_all(bind=engine)
    print("Connection OK and users table ensured.")


if __name__ == "__main__":
    main()
