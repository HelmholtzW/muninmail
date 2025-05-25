# Email Ingestion Guide

This guide explains how to manually trigger email ingestion to process all existing emails from your IMAP inbox.

## Prerequisites

Before triggering email ingestion, ensure you have:

1. **IMAP credentials configured** in your `.env` file:
   ```bash
   IMAP_SERVER=imap.gmail.com
   IMAP_USERNAME=your-email@gmail.com
   IMAP_PASSWORD=your-app-password
   ```

2. **Services running**:
   - Redis server (for Celery task queue)
   - Celery worker process
   - PostgreSQL database

3. **Dependencies installed**:
   ```bash
   cd backend
   uv install
   ```

## Method 1: Using the API Endpoint (Recommended)

### Start the FastAPI server:
```bash
cd backend
uvicorn src.main:app --reload --port 8000
```

### Trigger ingestion via HTTP request:
```bash
curl -X POST http://localhost:8000/trigger-ingestion
```

### Response:
```json
{
  "message": "Email ingestion triggered successfully",
  "task_id": "abc123-def456-ghi789",
  "status": "queued",
  "description": "All emails from inbox will be fetched and processed..."
}
```

## Method 2: Using the Python Script

### Run the standalone script:
```bash
cd backend
python trigger_ingestion.py
```

This script provides detailed progress output and status information.

## Method 3: Using Celery Directly

### Start Celery worker (if not already running):
```bash
cd backend
celery -A src.celery_app worker --loglevel=info
```

### In another terminal, trigger the task:
```bash
cd backend
python -c "
from src.tasks.email_tasks import fetch_and_process_emails_task
task = fetch_and_process_emails_task.delay()
print(f'Task queued with ID: {task.id}')
"
```

## What Happens During Ingestion

1. **IMAP Connection**: Connects to your configured IMAP server
2. **Email Fetching**: Downloads all emails from the inbox
3. **Duplicate Prevention**: Skips emails already in the database (by message_id)
4. **AI Processing**: For each new email:
   - Generates a summary using Cerebras AI
   - Extracts todo items and action points
   - Analyzes content for flags (urgent, requires response, etc.)
5. **Database Storage**: Saves processed emails with AI insights

## Monitoring Progress

### Check API for processed emails:
```bash
curl http://localhost:8000/emails
```

### Watch Celery worker logs:
The Celery worker will show detailed logs of email processing progress.

### Check database directly:
```sql
SELECT message_id, subject, processing_status, created_at 
FROM emails 
ORDER BY created_at DESC;
```

## Troubleshooting

### "No emails fetched"
- Verify IMAP credentials in `.env`
- Check firewall/network connectivity
- Ensure IMAP access is enabled in your email provider

### "Connection refused" errors
- Ensure Redis is running (`redis-server`)
- Ensure Celery worker is running
- Check if ports are available

### "Task failed" in Celery logs
- Check CEREBRAS_API_KEY is configured
- Verify database connection
- Review detailed error logs in Celery worker

### Rate limiting
- Large inboxes may take time to process
- AI API calls are made sequentially to avoid rate limits
- Monitor API quotas if using paid AI services

## Configuration Tips

### For Gmail users:
1. Enable 2-factor authentication
2. Generate an "App Password" (not your regular password)
3. Use `imap.gmail.com` as the IMAP server

### For large inboxes:
- Start with a small test batch
- Monitor processing time and resource usage
- Consider running during off-peak hours

### Security:
- Never commit `.env` files to version control
- Use app-specific passwords when available
- Regularly rotate credentials

## Next Steps

After successful ingestion:
1. Check the `/emails` endpoint to see processed results
2. View summaries, todos, and flags in the frontend
3. Set up periodic ingestion using Celery Beat (scheduled tasks)
4. Customize AI processing rules as needed 