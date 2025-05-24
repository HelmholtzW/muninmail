import json
import asyncio
from datetime import datetime
from typing import Dict, Any
from celery import current_task
from sqlalchemy.ext.asyncio import AsyncSession

from ..celery_app import celery_app
from ..database import AsyncSessionLocal
from ..db_models import Email, EmailSummary, EmailTodo, EmailFlag
from ..models import EmailContent, TodoItem, Flag
from ..skills.summarize_email import summarize_email_skill
from ..skills.extract_todos import extract_todos_skill
from ..skills.get_flags import get_flags_skill


@celery_app.task(bind=True)
def process_email_task(self, email_data: Dict[str, Any]):
    """
    Celery task to process an email with AI services and save results to database.

    Args:
        email_data: Dictionary containing email information with keys:
            - message_id, subject, sender, recipient, body, timestamp, attachments
    """
    try:
        # Update task status
        self.update_state(
            state="PROCESSING", meta={"step": "Starting email processing"}
        )

        # Run the async processing function
        result = asyncio.run(process_email_async(email_data, self))

        return {
            "status": "SUCCESS",
            "email_id": result["email_id"],
            "message": "Email processed successfully",
        }

    except Exception as e:
        self.update_state(
            state="FAILURE", meta={"error": str(e), "step": "Processing failed"}
        )
        raise


async def process_email_async(email_data: Dict[str, Any], task=None):
    """
    Async function to process email with AI and save to database.
    """
    async with AsyncSessionLocal() as session:
        try:
            # Update task status
            if task:
                task.update_state(
                    state="PROCESSING", meta={"step": "Saving email to database"}
                )

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
            await session.flush()  # Get the ID

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
            if task:
                task.update_state(
                    state="PROCESSING", meta={"step": "Generating summary"}
                )

            # 1. Summarize email
            summary_response = json.loads(summarize_email_skill(email_content))
            summary_obj = EmailSummary(
                email_id=email_obj.id, summary=summary_response["summary"]
            )
            session.add(summary_obj)

            if task:
                task.update_state(state="PROCESSING", meta={"step": "Extracting todos"})

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

            if task:
                task.update_state(state="PROCESSING", meta={"step": "Analyzing flags"})

            # 3. Get flags
            available_flags = [
                Flag(type="requires_response", description="Email requires a response"),
                Flag(type="urgent", description="Urgent email"),
                Flag(type="meeting_request", description="Meeting request"),
                Flag(type="custom", description="Custom flag"),
            ]

            flags_response = json.loads(get_flags_skill(email_content, available_flags))
            for flag_data in flags_response["flags"]:
                flag_obj = EmailFlag(
                    email_id=email_obj.id,
                    flag_type=flag_data["type"],
                    description=flag_data["description"],
                )
                session.add(flag_obj)

            # Mark as processed
            email_obj.processing_status = "completed"
            email_obj.is_processed = True

            await session.commit()

            if task:
                task.update_state(
                    state="PROCESSING", meta={"step": "Email processing completed"}
                )

            return {"email_id": email_obj.id}

        except Exception as e:
            await session.rollback()
            if task:
                task.update_state(
                    state="FAILURE",
                    meta={"error": str(e), "step": "Database operation failed"},
                )
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
