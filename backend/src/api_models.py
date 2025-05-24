from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


# Enhanced models for database-backed API responses
class TodoItemResponse(BaseModel):
    id: int
    task: str
    priority: str
    due_date: Optional[str] = None
    created_at: datetime


class FlagResponse(BaseModel):
    id: int
    flag_type: str
    description: str
    created_at: datetime


class EmailSummaryResponse(BaseModel):
    id: int
    summary: str
    created_at: datetime


class EmailResponse(BaseModel):
    id: int
    message_id: str
    subject: str
    sender: str
    recipient: str
    body: str
    timestamp: Optional[datetime]
    attachments: Optional[List[str]]
    is_processed: bool
    processing_status: str
    created_at: datetime
    updated_at: datetime

    # AI-generated insights
    summary: Optional[EmailSummaryResponse] = None
    todos: List[TodoItemResponse] = []
    flags: List[FlagResponse] = []


class EmailListResponse(BaseModel):
    emails: List[EmailResponse]
    total_count: int
    processed_count: int
    pending_count: int


class ProcessingStatusResponse(BaseModel):
    total_emails: int
    processed: int
    pending: int
    processing: int
    failed: int


class TriggerFetchResponse(BaseModel):
    success: bool
    message: str
    task_id: Optional[str] = None
