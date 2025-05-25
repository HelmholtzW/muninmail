import asyncio
import logging

from ..tasks.email_fetcher_task import email_fetcher_task
from ..tasks.email_processor_task import email_processor_task

logging.basicConfig(level=logging.INFO)

logger = logging.getLogger(__name__)


async def main():
    """
    Main entry point for our email processing service.

    🔍 ASYNCIO CORE CONCEPT: Event Loop and Concurrency
    This is where asyncio magic begins! We're going to run two tasks concurrently:
    1. Email fetcher (runs every few minutes)
    2. Email processor (runs continuously)

    Key Learning Points:
    - asyncio.gather() starts both tasks simultaneously
    - Both tasks share the same thread but yield control at 'await' points
    - This is perfect for I/O-bound work like ours (database, network, AI APIs)
    """
    logger.info("Starting email processing service...")
    logger.info("🔍 ASYNCIO: Two concurrent tasks will now start:")
    logger.info("   1. Email fetcher - fetches from IMAP periodically")
    logger.info("   2. Email processor - processes queued emails continuously")

    try:
        # 🔍 ASYNCIO CORE CONCEPT: asyncio.gather()
        # Both tasks start immediately and run concurrently
        # The event loop switches between them at every 'await' point
        await asyncio.gather(
            email_fetcher_task(),  # Fetches emails periodically
            email_processor_task(),  # Processes queued emails continuously
        )
    except KeyboardInterrupt:
        logger.info("Service stopped by user")
    except Exception as e:
        logger.error(f"Service failed: {e}")


if __name__ == "__main__":
    # 🔍 ASYNCIO ENTRY POINT
    # asyncio.run() creates the event loop and runs our main coroutine
    # This is the standard way to start an asyncio application
    logger.info("🔍 ASYNCIO: Starting event loop...")
    asyncio.run(main())
