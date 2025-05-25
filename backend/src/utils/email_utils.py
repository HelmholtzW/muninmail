import logging
from datetime import datetime
from typing import List
from sqlalchemy.exc import IntegrityError

from ..database import AsyncSessionLocal
from ..models.db_models import Email
from ..models.models import FetchEmailResponseItem

logger = logging.getLogger(__name__)


async def save_emails_to_queue(emails: List[FetchEmailResponseItem]) -> int:
    """
    Saves fetched emails to database with status='pending'.

    🔍 KEY ASYNCIO CONCEPT: async database transactions
    - 'async with' creates an async context manager
    - Database I/O operations use 'await' (they're non-blocking)
    - While waiting for DB responses, other tasks can run
    """
    async with AsyncSessionLocal() as session:
        saved_count = 0

        for email_item in emails:
            try:
                # Handle timestamp conversion
                timestamp = None
                if email_item.timestamp:
                    try:
                        parsed_timestamp = datetime.fromisoformat(email_item.timestamp)
                        timestamp = (
                            parsed_timestamp.replace(tzinfo=None)
                            if parsed_timestamp.tzinfo
                            else parsed_timestamp
                        )
                    except ValueError:
                        logger.warning(
                            f"Could not parse timestamp: {email_item.timestamp}"
                        )

                # Create Email object with status='pending'
                email_obj = Email(
                    message_id=email_item.id,
                    subject=email_item.subject,
                    sender=email_item.sender,
                    recipient=email_item.recipient,
                    body=email_item.body,
                    timestamp=timestamp,
                    attachments=email_item.attachments or [],
                    processing_status="pending",  # This is our queue!
                    is_processed=False,
                )

                session.add(email_obj)
                saved_count += 1

            except IntegrityError:
                # Email already exists (duplicate message_id)
                # This is normal - just skip it
                await session.rollback()
                logger.debug(f"Email {email_item.id} already exists, skipping")
                continue

        # 🔍 CRITICAL ASYNCIO POINT:
        # await session.commit() is non-blocking I/O
        # While the database writes to disk, other tasks can run
        await session.commit()
        logger.info(f"Saved {saved_count} new emails to processing queue")

        return saved_count
