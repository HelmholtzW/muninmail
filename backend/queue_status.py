#!/usr/bin/env python3
"""
Email Queue Status Monitor

This script shows the current status of emails in the database queue.
It demonstrates how the database-as-queue pattern works.

🔍 ASYNCIO LEARNING: This shows how to do simple async database queries
"""

import sys
import asyncio
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent / "src"))

from src.database import AsyncSessionLocal
from src.models.db_models import Email
from sqlalchemy import select, func
from datetime import datetime


async def show_queue_status():
    """
    Display current email processing queue status.

    🔍 ASYNCIO CONCEPT: Simple async database queries
    - We use async session for database operations
    - This could run alongside the main service without conflicts
    """
    async with AsyncSessionLocal() as session:
        try:
            # Get counts by processing status
            result = await session.execute(
                select(
                    Email.processing_status, func.count(Email.id).label("count")
                ).group_by(Email.processing_status)
            )

            status_counts = {row.processing_status: row.count for row in result}

            # Get total count
            total_result = await session.execute(select(func.count(Email.id)))
            total_count = total_result.scalar()

            # Get recent emails
            recent_result = await session.execute(
                select(Email.subject, Email.processing_status, Email.created_at)
                .order_by(Email.created_at.desc())
                .limit(5)
            )
            recent_emails = recent_result.all()

            # Display results
            print("📊 EMAIL QUEUE STATUS")
            print("=" * 50)
            print(f"📧 Total emails: {total_count}")
            print()

            print("📈 By Status:")
            for status in ["pending", "processing", "completed", "failed"]:
                count = status_counts.get(status, 0)
                emoji = {
                    "pending": "⏳",
                    "processing": "🔄",
                    "completed": "✅",
                    "failed": "❌",
                }
                print(f"   {emoji[status]} {status.capitalize()}: {count}")

            print()
            print("📋 Recent Emails:")
            for email in recent_emails:
                status_emoji = {
                    "pending": "⏳",
                    "processing": "🔄",
                    "completed": "✅",
                    "failed": "❌",
                }
                emoji = status_emoji.get(email.processing_status, "❓")
                print(f"   {emoji} {email.subject[:50]}... ({email.processing_status})")

            print()

        except Exception as e:
            print(f"❌ Error checking queue status: {e}")


if __name__ == "__main__":
    print("🔍 ASYNCIO: Running async queue status check...")
    asyncio.run(show_queue_status())
