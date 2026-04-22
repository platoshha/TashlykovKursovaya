import logging
import uuid
from datetime import datetime, timezone, timedelta

import bcrypt
import jwt
from sqlalchemy.orm import Session

from app.config import settings
from app.models.models import User, UserProfile
from app.schemas.auth import RegisterRequest

logger = logging.getLogger(__name__)


def hash_password(password: str) -> str:
    password_bytes = password.encode("utf-8")
    if len(password_bytes) > 72:
        raise ValueError("Пароль слишком длинный: bcrypt поддерживает максимум 72 байта")

    hashed = bcrypt.hashpw(password_bytes, bcrypt.gensalt())
    return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except ValueError as exc:
        logger.warning("Password verification failed due to invalid hash format: %s", exc)
        return False


def create_access_token(user_id: uuid.UUID) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_expire_minutes)
    payload = {"sub": str(user_id), "exp": expire}
    return jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm)


def decode_access_token(token: str) -> uuid.UUID:
    payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
    user_id_str: str = payload.get("sub")
    if user_id_str is None:
        raise ValueError("Некорректный токен: отсутствует идентификатор пользователя")
    return uuid.UUID(user_id_str)


def register_user(db: Session, data: RegisterRequest) -> User:
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise ValueError("Пользователь с таким email уже зарегистрирован")

    user = User(
        id=uuid.uuid4(),
        email=data.email,
        password_hash=hash_password(data.password),
    )
    profile = UserProfile(
        user_id=user.id,
        name=data.name,
        training_level="beginner",
    )

    db.add(user)
    db.add(profile)
    db.commit()
    db.refresh(user)

    logger.info("User registered: %s", user.email)
    return user


def authenticate_user(db: Session, email: str, password: str) -> User | None:
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        logger.info("Login attempt for unknown email: %s", email)
        return None
    if not verify_password(password, user.password_hash):
        logger.info("Failed login attempt for email: %s", email)
        return None
    logger.info("Successful login for email: %s", email)
    return user


def get_user_by_id(db: Session, user_id: uuid.UUID) -> User | None:
    return db.query(User).filter(User.id == user_id).first()
