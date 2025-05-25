#!/usr/bin/env python3
"""
Email Processing Service Runner

This script starts the asyncio-based email processing service.
It replaces the previous Celery+Redis setup with a simple, lightweight asyncio service.

🔍 ASYNCIO LEARNING: This demonstrates how to structure a production asyncio service
- Single entry point
- Proper logging setup
- Graceful shutdown handling
- Clear separation of concerns
"""

import logging
import sys

from .email_processor_service import main

# Configure logging for the service
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler("email_service.log"),
    ],
)

logger = logging.getLogger(__name__)

if __name__ == "__main__":
    logger.info("🚀 Starting Email Processing Service")
    logger.info("=" * 50)
    logger.info("🔍 ASYNCIO LEARNING: About to start event loop")
    logger.info("   - This will run two concurrent tasks")
    logger.info("   - Email fetcher: checks IMAP every few minutes")
    logger.info("   - Email processor: continuously processes queued emails")
    logger.info("   - Press Ctrl+C to stop gracefully")
    logger.info("=" * 50)

    try:
        # Import and run the main asyncio service
        import asyncio

        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("🛑 Service stopped by user")
    except Exception as e:
        logger.error(f"❌ Service failed: {e}")
        sys.exit(1)
