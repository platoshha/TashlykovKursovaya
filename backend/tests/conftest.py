"""
Test configuration for the Fitness Tracker API.

Uses an in-memory SQLite database to run the full app stack without PostgreSQL.
PostgreSQL-specific partial indexes on the exercises table are dropped before
schema creation because SQLite does not support the `postgresql_where` dialect
option. All business logic, routing, auth, and ORM code runs unchanged.
"""
import os
import tempfile

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base
from app.dependencies import get_db
from app.main import app
from app.models import models as _models_module  # noqa: F401 — ensures all models register on Base
from app.models import measurement as _meas_module  # noqa: F401
from app.models import goal as _goal_module  # noqa: F401

# ---------------------------------------------------------------------------
# SQLite engine — file placed in the OS temp dir to avoid polluting the source tree
# ---------------------------------------------------------------------------

_DB_FILE = os.path.join(tempfile.gettempdir(), "fitness_test.db")
SQLITE_URL = f"sqlite:///{_DB_FILE}"

engine = create_engine(
    SQLITE_URL,
    connect_args={"check_same_thread": False},
)

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def _prepare_schema() -> None:
    """Create all tables, skipping PostgreSQL-only partial indexes."""
    # Remove indexes that use postgresql-specific dialect options before
    # calling create_all so SQLite does not choke on them.
    for table in Base.metadata.tables.values():
        pg_indexes = [
            idx for idx in list(table.indexes)
            if any(k.startswith("postgresql_") for k in idx.dialect_kwargs)
        ]
        for idx in pg_indexes:
            table.indexes.discard(idx)

    Base.metadata.create_all(bind=engine)


_prepare_schema()


# ---------------------------------------------------------------------------
# Seed reference data (workout_types required for workout creation tests)
# ---------------------------------------------------------------------------

def _seed_reference_data() -> None:
    from app.models.models import WorkoutType, ExerciseCategory, GoalType

    db = TestingSessionLocal()
    try:
        if db.query(WorkoutType).count() == 0:
            db.add_all([
                WorkoutType(id=1, code="strength", name="Силовая"),
                WorkoutType(id=2, code="cardio", name="Кардио"),
                WorkoutType(id=3, code="functional", name="Функциональная"),
            ])
        if db.query(ExerciseCategory).count() == 0:
            db.add_all([
                ExerciseCategory(id=1, code="chest", name="Грудь"),
                ExerciseCategory(id=2, code="back", name="Спина"),
            ])
        if db.query(GoalType).count() == 0:
            db.add_all([
                GoalType(id=1, code="weight_loss", name="Снижение веса"),
                GoalType(id=2, code="muscle_gain", name="Набор мышечной массы"),
            ])
        db.commit()
    finally:
        db.close()


_seed_reference_data()


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture()
def db_session():
    """Yield a fresh transactional DB session, rolled back after each test."""
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    try:
        yield session
    finally:
        session.close()
        transaction.rollback()
        connection.close()


@pytest.fixture()
def client(db_session):
    """TestClient with get_db overridden to use the test session."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass  # rollback is handled by db_session fixture

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app, raise_server_exceptions=True) as c:
        yield c
    app.dependency_overrides.clear()


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def register_and_login(client: TestClient, email: str = "test@example.com",
                       password: str = "password123",
                       name: str = "Test User") -> dict:
    """Register a user (if needed) and return Authorization headers."""
    client.post("/api/v1/auth/register", json={
        "email": email,
        "password": password,
        "name": name,
    })
    resp = client.post("/api/v1/auth/login", json={
        "email": email,
        "password": password,
    })
    assert resp.status_code == 200, f"Login failed: {resp.text}"
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture()
def auth_headers(client: TestClient) -> dict:
    """Auth headers for the default test user."""
    return register_and_login(client)
