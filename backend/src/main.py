import asyncio
import json
import logging
from contextlib import asynccontextmanager
from typing import List

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from .ai_skills.extract_todos import extract_todos_skill
from .ai_skills.get_flags import get_flags_skill
from .ai_skills.summarize_email import summarize_email_skill
from .database import get_db
from .email_logic.email_service import fetch_email_by_id
from .email_logic.email_service import send_email as send_email_service
from .models.db_models import Email
from .models.models import (
    ExtractTodosRequest,
    ExtractTodosResponse,
    FetchEmailsResponse,
    FetchProcessedEmailResponseItem,
    GetFlagsRequest,
    GetFlagsResponse,
    SendEmailRequest,
    SendEmailResponse,
    SummarizeRequest,
    SummarizeResponse,
    TodoItem,
)
from .tasks.email_fetcher_task import email_fetcher_task
from .tasks.email_processor_task import email_processor_task
from .tasks.fetch_todos import fetch_todos as fetch_todos_service

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global variable to store background tasks
background_tasks = []


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    FastAPI lifespan context manager for startup and shutdown events.

    🔍 ASYNCIO LEARNING: Background Tasks in FastAPI
    - This is the modern way to handle startup/shutdown in FastAPI
    - We start background tasks when the API starts
    - Tasks run concurrently with the API server
    - Proper cleanup on shutdown
    """
    # Startup
    logger.info("🚀 Starting FastAPI application with background email service")
    logger.info("🔍 ASYNCIO: Creating background tasks for email processing")

    try:
        # Create background tasks for email processing
        email_fetcher = asyncio.create_task(email_fetcher_task())
        email_processor = asyncio.create_task(email_processor_task())

        # Store tasks so we can cancel them on shutdown
        background_tasks.extend([email_fetcher, email_processor])

        logger.info("✅ Email processing service started in background")
        logger.info("   📨 Email fetcher: Running periodically")
        logger.info("   🔄 Email processor: Running continuously")

        yield  # FastAPI app runs here

    finally:
        # Shutdown
        logger.info("🛑 Shutting down background email service")

        # Cancel all background tasks
        for task in background_tasks:
            if not task.done():
                task.cancel()
                try:
                    await task
                except asyncio.CancelledError:
                    pass

        logger.info("✅ Background tasks stopped cleanly")


app = FastAPI(
    title="Email Agents API",
    description="API for email processing tasks including summarization, todo extraction, and flagging",
    version="1.0.0",
    lifespan=lifespan,  # 🔍 This enables background tasks
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:9002",
        "http://localhost:3000",
    ],  # Allow frontend origins
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
)


@app.get("/")
async def root():
    """Root endpoint providing API information"""
    return {
        "message": "Email Agents API",
        "version": "1.0.0",
        "endpoints": [
            "/summarize",
            "/extract_todos",
            "/get_flags",
            "/emails",
            "/send_email",
            "/todos",
            "/status",  # New endpoint for service status
        ],
        "description": "API for email processing tasks with background email service",
    }


@app.get("/status")
async def get_status():
    """
    Get the status of the background email processing service.

    🔍 ASYNCIO LEARNING: Monitoring background tasks
    - Shows how to check if background tasks are still running
    - Useful for health checks and monitoring
    """
    status = {
        "api": "running",
        "background_tasks": {
            "total": len(background_tasks),
            "running": sum(1 for task in background_tasks if not task.done()),
            "completed": sum(
                1 for task in background_tasks if task.done() and not task.cancelled()
            ),
            "cancelled": sum(1 for task in background_tasks if task.cancelled()),
            "failed": sum(
                1 for task in background_tasks if task.done() and task.exception()
            ),
        },
    }

    return status


@app.post("/summarize", response_model=SummarizeResponse)
async def summarize_email(request: SummarizeRequest):
    """
    Summarize an email and its attachments

    This endpoint processes email content and provides:
    - A concise summary of the email
    - Key points extracted from the content
    - Summary of attachments (if requested and available)
    """
    try:
        email = request.email
        response = json.loads(summarize_email_skill(email))
        return SummarizeResponse.model_validate(response)

    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error summarizing email: {str(e)}"
        )


@app.post("/extract_todos", response_model=ExtractTodosResponse)
async def extract_todos(request: ExtractTodosRequest):
    """
    Extract todo items from email content

    This endpoint analyzes email content to identify:
    - Action items and tasks
    - Priority levels
    - Due dates (if mentioned)
    - Assignees (if specified)
    """
    try:
        email = request.email
        response = json.loads(extract_todos_skill(email))
        return ExtractTodosResponse.model_validate(response)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error extracting todos: {str(e)}")


@app.post("/get_flags", response_model=GetFlagsResponse)
async def get_flags(request: GetFlagsRequest):
    """
    Analyze email to determine flags and tags

    This endpoint provides:
    - Automatic flags (requires response, urgent, etc.)
    - Custom tags based on content analysis
    - Confidence scores for each flag
    """
    try:
        email = request.email
        response = json.loads(get_flags_skill(email, request.available_flags))
        return GetFlagsResponse.model_validate(response)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing flags: {str(e)}")


@app.get("/emails", response_model=FetchEmailsResponse)
async def get_emails(db: AsyncSession = Depends(get_db)):
    """Fetches all processed emails from the postgres database."""
    try:
        # Query all emails from the database
        result = await db.execute(select(Email).where(Email.is_processed == True))  # noqa: E712
        emails = result.scalars().all()

        # Convert to response format
        email_dicts = []
        for email in emails:
            email_dict = {
                "id": email.message_id,
                "subject": email.subject,
                "sender": email.sender,
                "recipient": email.recipient,
                "body": email.body,
                "timestamp": email.timestamp.isoformat() if email.timestamp else None,
                "attachments": email.attachments or [],
                "summary": email.summary,
                "flags": email.flags or [],
            }
            email_dicts.append(email_dict)

        return FetchEmailsResponse(emails=email_dicts, total_count=len(email_dicts))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching emails: {str(e)}")


@app.post("/send_email", response_model=SendEmailResponse)
async def send_email_endpoint(request: SendEmailRequest):
    """Send an email via SMTP"""
    try:
        success = send_email_service(
            sender=request.sender,
            recipient=request.recipient,
            subject=request.subject,
            body=request.body,
        )

        if success:
            return SendEmailResponse(success=True, message="Email sent successfully")
        else:
            return SendEmailResponse(success=False, message="Failed to send email")

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error sending email: {str(e)}")


@app.get("/emails/{email_id}", response_model=FetchProcessedEmailResponseItem)
async def get_email(email_id: str):
    """Fetches a specific email by ID."""
    try:
        email = fetch_email_by_id(email_id)
        return email
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Email not found: {str(e)}")


@app.get("/todos", response_model=List[TodoItem])
async def get_todos():
    """Fetches all todos from the database."""
    try:
        todos = await fetch_todos_service()
        return todos
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching todos: {str(e)}")
