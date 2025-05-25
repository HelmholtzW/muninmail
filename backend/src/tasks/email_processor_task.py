import asyncio
import logging
from datetime import datetime
from typing import Optional
import json

from sqlalchemy import select, update
from sqlalchemy.exc import IntegrityError

from ..database import AsyncSessionLocal
from ..models.db_models import Email, EmailTodo
from ..models.models import EmailContent, Flag
from ..ai_skills.extract_todos import extract_todos_skill
from ..ai_skills.get_flags import get_flags_skill
from ..ai_skills.summarize_email import summarize_email_skill

logger = logging.getLogger(__name__)


async def email_processor_task():
    """
    Continuously processes emails from the database queue.

    🔍 KEY ASYNCIO CONCEPT: Continuous processing loop
    - This runs forever, checking for emails to process
    - Each 'await' point allows other tasks (like email fetcher) to run
    - Error handling ensures one failed email doesn't stop the whole service
    """
    logger.info("Email processor started")

    while True:  # Run forever
        try:
            # Step 1: Try to claim an email atomically from the queue
            email = await claim_next_email()

            if email is None:
                # No emails to process, sleep briefly then check again
                # Short sleep so we're responsive to new emails
                await asyncio.sleep(1)  # Check every second
                continue

            logger.info(f"Processing email: {email.subject}")

            # Step 2: Process the email with AI services
            await process_email_with_ai(email)

            logger.info(f"Completed processing email: {email.subject}")

        except Exception as e:
            logger.error(f"Error in email processor task: {e}")
            # Continue to next email even if one fails
            await asyncio.sleep(1)


async def claim_next_email() -> Optional[Email]:
    """
    Atomically claims the next pending email for processing.

    🔍 KEY ASYNCIO + DATABASE CONCEPT: Atomic operations
    - We use a database transaction to atomically update status
    - This prevents two processors from claiming the same email
    - The 'await' makes it non-blocking - other tasks can run
    """
    async with AsyncSessionLocal() as session:
        try:
            # 🔍 IMPORTANT: This is an atomic "claim" operation
            # We update AND return in one transaction
            result = await session.execute(
                update(Email)
                .where(Email.processing_status == "pending")
                .values(processing_status="processing", updated_at=datetime.utcnow())
                .returning(Email)  # Return the updated row
            )

            email = result.scalar_one_or_none()

            if email:
                await session.commit()
                logger.info(f"Claimed email for processing: {email.subject}")
                return email
            else:
                # No pending emails
                return None

        except Exception as e:
            await session.rollback()
            logger.error(f"Error claiming email: {e}")
            return None


async def process_email_with_ai(email: Email):
    """
    Process a single email with AI services and update database.

    🔍 KEY ASYNCIO CONCEPT: Converting sync AI calls to async
    - AI service calls are potentially slow (network I/O)
    - We use asyncio.to_thread() to prevent blocking
    - Database updates use async sessions
    """
    async with AsyncSessionLocal() as session:
        try:
            # Refresh the email object in this session
            await session.refresh(email)

            # Create EmailContent for AI processing
            email_content = EmailContent(
                subject=email.subject,
                body=email.body,
                sender=email.sender,
                recipient=email.recipient,
                timestamp=email.timestamp.isoformat() if email.timestamp else None,
                attachments=email.attachments or [],
            )

            # 🔍 ASYNCIO LEARNING: Running sync AI functions asynchronously
            # The AI skill functions are synchronous, so we run them in thread pools
            # This prevents them from blocking the event loop

            # 1. Summarize email
            logger.info(f"Generating summary for: {email.subject}")
            summary_response = await asyncio.to_thread(
                summarize_email_skill, email_content
            )
            summary_data = json.loads(summary_response)
            email.summary = summary_data["summary"]

            # 2. Extract todos
            logger.info(f"Extracting todos for: {email.subject}")
            todos_response = await asyncio.to_thread(extract_todos_skill, email_content)
            todos_data = json.loads(todos_response)

            # Clear existing todos for this email (in case of reprocessing)
            # 🔍 ASYNCIO DATABASE PATTERN: Using async execute for deletions
            from sqlalchemy import delete

            await session.execute(
                delete(EmailTodo).where(EmailTodo.email_id == email.id)
            )

            # Add new todos
            for todo_data in todos_data["todos"]:
                todo_obj = EmailTodo(
                    email_id=email.id,
                    task=todo_data["task"],
                    priority=todo_data["priority"],
                    due_date=todo_data.get("due_date"),
                )
                session.add(todo_obj)

            # 3. Get flags
            logger.info(f"Analyzing flags for: {email.subject}")
            available_flags = [
                Flag(type="requires_response", description="Email requires a response"),
                Flag(type="urgent", description="Urgent email"),
                Flag(type="meeting_request", description="Meeting request"),
            ]

            flags_response = await asyncio.to_thread(
                get_flags_skill, email_content, available_flags
            )
            flags_data = json.loads(flags_response)

            # Store flags as JSON array in the email object
            flags_list = []
            for flag_data in flags_data["flags"]:
                flags_list.append(
                    {
                        "type": flag_data["type"],
                        "description": flag_data["description"],
                    }
                )
            email.flags = flags_list if flags_list else None

            # Mark as processed
            email.processing_status = "completed"
            email.is_processed = True
            email.updated_at = datetime.utcnow()

            # 🔍 CRITICAL ASYNCIO POINT: Async database commit
            await session.commit()
            logger.info(f"Successfully processed email: {email.subject}")

        except Exception as e:
            # Mark email as failed for retry logic
            await mark_email_as_failed(email, str(e))
            logger.error(f"Failed to process email {email.subject}: {e}")
            raise  # Re-raise so the processor task can handle it


async def mark_email_as_failed(email: Email, error_message: str):
    """
    Mark an email as failed and implement retry logic.

    🔍 ASYNCIO CONCEPT: Error handling and retry logic
    - Failed emails don't disappear - they get retry chances
    - We use async database operations for state updates
    """
    async with AsyncSessionLocal() as session:
        try:
            # Refresh email in this session
            await session.refresh(email)

            # Simple retry logic: if it's failed less than 3 times, mark as pending for retry
            # In a real system, you'd add a retry_count field to the Email model

            current_time = datetime.utcnow()

            # For now, mark as failed - you can enhance this with retry_count later
            email.processing_status = "failed"
            email.updated_at = current_time

            await session.commit()
            logger.warning(f"Marked email as failed: {email.subject} - {error_message}")

        except Exception as e:
            logger.error(f"Error marking email as failed: {e}")
            await session.rollback()
