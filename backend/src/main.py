import json
from typing import List

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from .database import get_db
from .db_models import Email
from .models import (
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
from .services.email_service import (
    fetch_email_by_id,
)
from .services.email_service import (
    send_email as send_email_service,
)
from .services.todo_service import fetch_todos as fetch_todos_service
from .skills.extract_todos import extract_todos_skill
from .skills.get_flags import get_flags_skill
from .skills.summarize_email import summarize_email_skill
from .tasks.email_tasks import fetch_and_process_emails_task

app = FastAPI(
    title="Email Agents API",
    description="API for email processing tasks including summarization, todo extraction, and flagging",
    version="1.0.0",
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
            "/trigger-ingestion",
        ],
        "description": "API for email processing tasks",
    }


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
        result = await db.execute(select(Email).where(Email.is_processed == True))
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
async def post_send_email(request: SendEmailRequest):
    """Sends an email using the configured SMTP server."""
    try:
        success = send_email_service(
            request.sender, request.recipient, request.subject, request.body
        )
        if success:
            return SendEmailResponse(success=True, message="Email sent successfully.")
        else:
            # The email_service already prints the error, so a generic message here is fine.
            raise HTTPException(status_code=500, detail="Failed to send email.")
    except Exception as e:
        # Catch any other unexpected errors during the process
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


@app.post("/trigger-ingestion")
async def trigger_email_ingestion():
    """
    Manually trigger email ingestion from the configured IMAP inbox.

    This endpoint will:
    1. Fetch all emails from the IMAP server
    2. Queue them for AI processing (summary, todos, flags)
    3. Save processed results to the database

    Returns the task ID for tracking the ingestion process.
    """
    try:
        # Trigger the Celery task for email ingestion
        task = fetch_and_process_emails_task.delay()

        return {
            "message": "Email ingestion triggered successfully",
            "task_id": task.id,
            "status": "queued",
            "description": "All emails from inbox will be fetched and processed. Check task status or refresh /emails endpoint to see results.",
        }
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Error triggering email ingestion: {str(e)}"
        )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
