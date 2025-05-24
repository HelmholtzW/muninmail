from sqlalchemy import (
    JSON,
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
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

    # Consolidated fields from EmailSummary and EmailFlag
    summary = Column(Text, nullable=True)  # Email summary
    flags = Column(
        JSON, nullable=True
    )  # Store flags as JSON array: [{"flag_type": "urgent", "description": "High priority"}]

    # Database timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    todos = relationship("EmailTodo", back_populates="email")


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
