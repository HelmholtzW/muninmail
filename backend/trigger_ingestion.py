#!/usr/bin/env python3
"""
Manual Email Ingestion Script

This script manually triggers the email ingestion process to fetch all emails
from the configured IMAP inbox and process them with AI services.

Usage:
    python trigger_ingestion.py

Requirements:
    - Redis server running (for Celery)
    - Celery worker running (celery -A src.celery_app worker --loglevel=info)
    - IMAP credentials configured in .env file
"""

import sys
from pathlib import Path

# Add the src directory to Python path
sys.path.insert(0, str(Path(__file__).parent / "src"))

from src.tasks.email_tasks import fetch_and_process_emails_task


def main():
    """Main function to trigger email ingestion."""
    print("🚀 Triggering email ingestion...")
    print(
        "This will fetch all emails from your IMAP inbox and process them with AI services."
    )
    print()

    try:
        # Trigger the Celery task
        task = fetch_and_process_emails_task.delay()

        print("✅ Email ingestion task queued successfully!")
        print(f"📋 Task ID: {task.id}")
        print()
        print("📧 The system will now:")
        print("   1. Connect to your IMAP server")
        print("   2. Fetch all emails from inbox")
        print("   3. Process each email with AI (summary, todos, flags)")
        print("   4. Save results to the database")
        print()
        print(
            "⏰ This process may take a few minutes depending on the number of emails."
        )
        print("💡 You can check the progress by:")
        print("   - Watching the Celery worker logs")
        print("   - Calling GET /emails API endpoint")
        print("   - Checking your database directly")
        print()
        print(f"🔍 Task status can be tracked with ID: {task.id}")

        return task.id

    except Exception as e:
        print(f"❌ Error triggering email ingestion: {str(e)}")
        print("🔧 Make sure:")
        print("   - Redis server is running")
        print("   - Celery worker is running")
        print("   - IMAP credentials are configured in .env")
        return None


if __name__ == "__main__":
    task_id = main()
    if task_id:
        sys.exit(0)
    else:
        sys.exit(1)
