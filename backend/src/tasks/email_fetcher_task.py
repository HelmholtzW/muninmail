import asyncio
import logging

from ..email_logic.email_service import fetch_emails_async
from ..utils.email_utils import save_emails_to_queue

logger = logging.getLogger(__name__)

TASK_INTERVAL_MINUTES = 1


async def email_fetcher_task():
    """
    Fetches emails periodically and adds them to the database queue.

    🔍 KEY ASYNCIO CONCEPT: Periodic tasks with asyncio.sleep()
    - This runs forever in a loop
    - await asyncio.sleep() yields control to other tasks
    - While this sleeps, the email processor can work
    """
    logger.info("Email fetcher started")

    while True:  # Run forever
        try:
            logger.info("Checking for new emails...")

            # Step 1: Fetch emails from IMAP (converted to async)
            emails = await fetch_emails_async()

            # Step 2: Save to database with status="pending"
            saved_count = await save_emails_to_queue(emails)

            logger.info(f"Queued {saved_count} new emails for processing")

            logger.info(f"Sleeping for {TASK_INTERVAL_MINUTES} minutes...")
            await asyncio.sleep(
                TASK_INTERVAL_MINUTES * 60
            )  # Convert minutes to seconds

        except Exception as e:
            logger.error(f"Error in email fetcher: {e}")
            await asyncio.sleep(30)  # Sleep 30 seconds on error, then retry
