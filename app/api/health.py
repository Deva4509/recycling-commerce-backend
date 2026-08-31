from sqlalchemy import text
from sqlalchemy.orm import Session

from app.database.session import SessionLocal


def database_is_ready() -> bool:
    """Return whether PostgreSQL accepts a basic query."""
    session: Session = SessionLocal()

    try:
        session.execute(text("SELECT 1"))
        return True
    except Exception:
        return False
    finally:
        session.close()
