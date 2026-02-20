"""
backend/models.py
-----------------
SQLAlchemy 2.0 ORM models for the Nebula relational data layer.

Models:
    - User          : Application users
    - MovieMetadata : Relational mirror of Pinecone movie embeddings
    - Watchlist     : Many-to-many join between users and movies
"""

import uuid
from datetime import datetime

from sqlalchemy import ForeignKey, String, Float, Integer, DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.database import Base


# ---------------------------------------------------------------------------
# User
# ---------------------------------------------------------------------------
class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    username: Mapped[str] = mapped_column(
        String(50), unique=True, nullable=False, index=True
    )
    email: Mapped[str] = mapped_column(
        String(255), unique=True, nullable=False, index=True
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    watchlist_entries: Mapped[list["Watchlist"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<User(id={self.id}, username='{self.username}')>"


# ---------------------------------------------------------------------------
# MovieMetadata
# ---------------------------------------------------------------------------
class MovieMetadata(Base):
    __tablename__ = "movie_metadata"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    title: Mapped[str] = mapped_column(
        String(500), nullable=False, index=True
    )
    year: Mapped[int | None] = mapped_column(Integer, nullable=True)
    director: Mapped[str | None] = mapped_column(String(255), nullable=True)
    rating: Mapped[float | None] = mapped_column(Float, nullable=True)
    pinecone_id: Mapped[str | None] = mapped_column(
        String(255), unique=True, nullable=True, index=True,
        comment="Maps this row to its vector embedding in Pinecone",
    )

    # Relationships
    watchlist_entries: Mapped[list["Watchlist"]] = relationship(
        back_populates="movie", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<MovieMetadata(id={self.id}, title='{self.title}')>"


# ---------------------------------------------------------------------------
# Watchlist (User ↔ Movie join table)
# ---------------------------------------------------------------------------
class Watchlist(Base):
    __tablename__ = "watchlists"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    movie_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("movie_metadata.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    added_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    # Relationships
    user: Mapped["User"] = relationship(back_populates="watchlist_entries")
    movie: Mapped["MovieMetadata"] = relationship(back_populates="watchlist_entries")

    def __repr__(self) -> str:
        return f"<Watchlist(user_id={self.user_id}, movie_id={self.movie_id})>"
