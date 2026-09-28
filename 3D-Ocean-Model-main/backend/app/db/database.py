import os
import hashlib
import secrets
from pathlib import Path
from typing import Generator
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base, Session

# Define default database path (SQLite ocean3d.db in backend directory)
BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
DEFAULT_DB_PATH = BACKEND_DIR / "ocean3d.db"

# DATABASE_URL can be set via environment variable, fallback to SQLite
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{DEFAULT_DB_PATH.as_posix()}")

# For SQLite, enable check_same_thread=False for multithreaded FastAPI async handling
connect_args = {}
if DATABASE_URL.startswith("sqlite"):
    connect_args["check_same_thread"] = False

engine = create_engine(DATABASE_URL, connect_args=connect_args, echo=False)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """
    FastAPI Dependency that provides a transactional database session per request.
    Automatically closes the session when request completes.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def hash_password(password: str, salt: str = None) -> str:
    """
    Generates a secure salted PBKDF2 HMAC SHA-256 hash for user authentication passwords.
    Format: salt$hash
    """
    if not salt:
        salt = secrets.token_hex(16)
    key = hashlib.pbkdf2_hmac(
        'sha256',
        password.encode('utf-8'),
        salt.encode('utf-8'),
        100000
    )
    return f"{salt}${key.hex()}"


def verify_password(password: str, hashed_password: str) -> bool:
    """
    Verifies plain password against stored salted hash.
    """
    try:
        if '$' not in hashed_password:
            return False
        salt, _ = hashed_password.split('$', 1)
        expected = hash_password(password, salt)
        return secrets.compare_digest(expected, hashed_password)
    except Exception:
        return False


def check_db_connection() -> dict:
    """
    Queries database to verify connectivity status.
    """
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return {"status": "connected", "database_type": engine.name, "url": str(engine.url)}
    except Exception as err:
        return {"status": "error", "message": str(err)}


def init_db():
    """
    Creates all database tables if they do not exist, and seeds initial officer accounts.
    """
    from app.db.models import UserModel, BookmarkModel, SystemLogModel

    Base.metadata.create_all(bind=engine)

    # Seed default operational officer accounts if table is empty
    db = SessionLocal()
    try:
        if db.query(UserModel).count() == 0:
            default_users = [
                {
                    "username": "saromatic369@gmail.com",
                    "email": "saromatic369@gmail.com",
                    "full_name": "S. Aromatic (Chief Oceanographer)",
                    "hashed_password": hash_password("ocean123"),
                    "role": "Lead Director",
                    "is_active": True,
                },
                {
                    "username": "officer",
                    "email": "officer@incois.gov.in",
                    "full_name": "Officer (INCOIS Operations)",
                    "hashed_password": hash_password("ocean123"),
                    "role": "Chief Officer",
                    "is_active": True,
                },
                {
                    "username": "admin",
                    "email": "admin@incois.gov.in",
                    "full_name": "System Administrator",
                    "hashed_password": hash_password("admin123"),
                    "role": "Administrator",
                    "is_active": True,
                },
                {
                    "username": "moes",
                    "email": "scientist@moes.gov.in",
                    "full_name": "MoES Senior Scientist",
                    "hashed_password": hash_password("moes123"),
                    "role": "Tactical Oceanographer",
                    "is_active": True,
                },
            ]
            for user_data in default_users:
                user = UserModel(**user_data)
                db.add(user)
            
            # Log initialization
            sys_log = SystemLogModel(
                action="INITIALIZE_DATABASE",
                details="Database tables created and default INCOIS officer accounts seeded successfully."
            )
            db.add(sys_log)
            db.commit()
    except Exception as e:
        db.rollback()
        print(f"[DB INIT ERROR] Could not seed database: {e}")
    finally:
        db.close()
