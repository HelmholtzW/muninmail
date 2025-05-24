from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    DateTime,
    Boolean,
    ForeignKey,
    JSON,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base


class Email(Base):
    __tablename__ = "emails"

    id = Column(Integer, primary_key=True, index=True)
    message_id = Column(String, unique=True, index=True)  # IMAP message ID
    subject = Column(String, index=True)
    sender = Column(String, index=True)
    recipient = Column(String)
    body = Column(Text)
    timestamp = Column(DateTime(timezone=True), index=True)
    attachments = Column(JSON)  # Store attachment filenames as JSON

    # Processing status
    is_processed = Column(Boolean, default=False)
    processing_status = Column(
        String, default="pending"
    )  # pending, processing, completed, failed

    # Database timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    summary = relationship("EmailSummary", back_populates="email", uselist=False)
    todos = relationship("EmailTodo", back_populates="email")
    flags = relationship("EmailFlag", back_populates="email")


class EmailSummary(Base):
    __tablename__ = "email_summaries"

    id = Column(Integer, primary_key=True, index=True)
    email_id = Column(Integer, ForeignKey("emails.id"), unique=True)
    summary = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationship
    email = relationship("Email", back_populates="summary")


class EmailTodo(Base):
    __tablename__ = "email_todos"

    id = Column(Integer, primary_key=True, index=True)
    email_id = Column(Integer, ForeignKey("emails.id"))
    task = Column(Text)
    priority = Column(String)  # high, medium, low
    due_date = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationship
    email = relationship("Email", back_populates="todos")


class EmailFlag(Base):
    __tablename__ = "email_flags"

    id = Column(Integer, primary_key=True, index=True)
    email_id = Column(Integer, ForeignKey("emails.id"))
    flag_type = Column(String)
    description = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationship
    email = relationship("Email", back_populates="flags")
