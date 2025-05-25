import os

from celery import Celery
from dotenv import load_dotenv

load_dotenv()

# Redis configuration for Celery
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

# Create Celery app
celery_app = Celery(
    "email_processor",
    broker=REDIS_URL,
    backend=REDIS_URL,
    include=["src.tasks.email_tasks"],
)

# Simplified configuration
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
)
