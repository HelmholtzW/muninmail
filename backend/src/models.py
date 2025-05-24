from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


# Pydantic models for request/response
class EmailContent(BaseModel):
    subject: str
    body: str
    sender: str
    recipient: str
    timestamp: Optional[datetime] = None
    attachments: Optional[List[str]] = None


# Summarization
class SummarizeRequest(BaseModel):
    email: EmailContent
    # include_attachments: bool = True


class SummarizeResponse(BaseModel):
    summary: str
    # key_points: List[str]
    # attachments_summary: Optional[str] = None


# ToDo Extraction
class ExtractTodosRequest(BaseModel):
    email: EmailContent


class TodoItem(BaseModel):
    task: str
    priority: str  # "high", "medium", "low"
    due_date: Optional[str] = None
    # assignee: Optional[str] = None


class ExtractTodosResponse(BaseModel):
    todos: List[TodoItem]
    # total_count: int


# Flagging
class Flag(BaseModel):
    type: str  # "requires_response", "urgent", "meeting_request", "custom"
    description: str
    # confidence: float  # 0.0 to 1.0


class GetFlagsRequest(BaseModel):
    email: EmailContent
    available_flags: List[Flag]


class GetFlagsResponse(BaseModel):
    flags: List[Flag]
    # requires_response: bool
    # custom_tags: List[str]


# Email Fetching
class FetchEmailResponseItem(BaseModel):
    id: str
    subject: str
    body: str
    sender: str
    recipient: str
    timestamp: datetime
    attachments: Optional[List[str]] = None

class FetchEmailsResponse(BaseModel):
    emails: List[FetchEmailResponseItem]
    total_count: int

# Email Sending
class SendEmailRequest(BaseModel):
    to_address: str
    subject: str
    body: str

class SendEmailResponse(BaseModel):
    success: bool
    message: str
