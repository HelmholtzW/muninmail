import json

# Create synchronous database engine for Celery workers
import os
from datetime import datetime
from typing import Any, Dict

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import sessionmaker

from ..celery_app import celery_app
from ..db_models import Email, EmailTodo
from ..models import EmailContent, Flag
from ..skills.extract_todos import extract_todos_skill
from ..skills.get_flags import get_flags_skill
from ..skills.summarize_email import summarize_email_skill

load_dotenv()

# Use synchronous PostgreSQL connection for Celery workers
SYNC_DATABASE_URL = os.getenv(
    "DATABASE_URL", "postgresql+asyncpg://user:password@localhost/cerebras_email_db"
).replace("postgresql+asyncpg://", "postgresql://")

sync_engine = create_engine(
    SYNC_DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=300,
    pool_size=5,
    max_overflow=10,
)
SyncSessionLocal = sessionmaker(bind=sync_engine)


@celery_app.task(
    bind=True,
    autoretry_for=(SQLAlchemyError,),
    retry_kwargs={"max_retries": 3, "countdown": 60},
)
def process_email_task(self, email_data: Dict[str, Any]):
    """
    Celery task to process an email with AI services and save results to database.

    Args:
        email_data: Dictionary containing email information with keys:
            - message_id, subject, sender, recipient, body, timestamp, attachments
    """
    try:
        # Run the synchronous processing function
        result = process_email_sync(email_data)

        return {
            "status": "SUCCESS",
            "email_id": result["email_id"],
            "message": "Email processed successfully",
        }

    except SQLAlchemyError as e:
        # Database errors should be retried
        raise self.retry(exc=e, countdown=60, max_retries=3)

    except Exception:
        # Other errors should not be retried
        raise


def process_email_sync(email_data: Dict[str, Any]):
    """
    Synchronous function to process email with AI and save to database.
    """
    with SyncSessionLocal() as session:
        try:
            # Handle timestamp conversion - convert timezone-aware to timezone-naive
            timestamp = None
            if email_data["timestamp"]:
                parsed_timestamp = datetime.fromisoformat(email_data["timestamp"])
                # Convert timezone-aware datetime to timezone-naive for database compatibility
                timestamp = (
                    parsed_timestamp.replace(tzinfo=None)
                    if parsed_timestamp.tzinfo
                    else parsed_timestamp
                )

            # Create Email object
            email_obj = Email(
                message_id=email_data["message_id"],
                subject=email_data["subject"],
                sender=email_data["sender"],
                recipient=email_data["recipient"],
                body=email_data["body"],
                timestamp=timestamp,
                attachments=email_data.get("attachments", []),
                processing_status="processing",
            )

            session.add(email_obj)
            session.flush()  # Get the ID

            # Create EmailContent for AI processing
            email_content = EmailContent(
                subject=email_data["subject"],
                body=email_data["body"],
                sender=email_data["sender"],
                recipient=email_data["recipient"],
                timestamp=email_data["timestamp"],
                attachments=email_data.get("attachments", []),
            )

            # Process with AI services
            # 1. Summarize email
            summary_response = json.loads(summarize_email_skill(email_content))
            email_obj.summary = summary_response["summary"]

            # 2. Extract todos
            todos_response = json.loads(extract_todos_skill(email_content))
            for todo_data in todos_response["todos"]:
                todo_obj = EmailTodo(
                    email_id=email_obj.id,
                    task=todo_data["task"],
                    priority=todo_data["priority"],
                    due_date=todo_data.get("due_date"),
                )
                session.add(todo_obj)

            # 3. Get flags
            available_flags = [
                Flag(type="requires_response", description="Email requires a response"),
                Flag(type="urgent", description="Urgent email"),
                Flag(type="meeting_request", description="Meeting request"),
                Flag(type="custom", description="Custom flag"),
            ]

            flags_response = json.loads(get_flags_skill(email_content, available_flags))
            # Store flags as JSON array in the email object
            flags_data = []
            for flag_data in flags_response["flags"]:
                flags_data.append(
                    {
                        "type": flag_data["type"],
                        "description": flag_data["description"],
                    }
                )
            email_obj.flags = flags_data if flags_data else None

            # Mark as processed
            email_obj.processing_status = "completed"
            email_obj.is_processed = True

            session.commit()

            return {"email_id": email_obj.id}

        except Exception:
            session.rollback()
            raise


@celery_app.task
def fetch_and_process_emails_task():
    """
    Celery task to fetch new emails and queue them for processing.
    """
    try:
        from ..services.email_service import fetch_emails

        # Fetch emails from IMAP
        emails = fetch_emails()

        # Queue each email for processing
        processed_count = 0
        for email_item in emails:
            email_data = {
                "message_id": email_item.id,
                "subject": email_item.subject,
                "sender": email_item.sender,
                "recipient": email_item.recipient,
                "body": email_item.body,
                "timestamp": email_item.timestamp,
                "attachments": email_item.attachments,
            }

            # Queue for processing (this will handle duplicates via database constraints)
            process_email_task.delay(email_data)
            processed_count += 1

        return {
            "status": "SUCCESS",
            "message": f"Queued {processed_count} emails for processing",
        }

    except Exception as e:
        return {"status": "FAILURE", "error": str(e)}
