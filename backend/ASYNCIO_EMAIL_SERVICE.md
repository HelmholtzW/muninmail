# Asyncio Email Processing Service

## 🚀 Overview

This document explains the new **asyncio-based email processing service** that replaces the previous Celery+Redis setup. This implementation is simpler, more lightweight, and perfect for learning asyncio concepts.

## 🔍 Asyncio Learning Concepts

### **Why Asyncio for This Project?**

Email processing involves a lot of **I/O-bound operations**:
- 📨 Fetching emails from IMAP servers (network I/O)
- 💾 Database queries and updates (disk I/O)  
- 🤖 AI API calls to Cerebras/OpenAI (network I/O)

Asyncio excels at I/O-bound work because:
- **Single thread** - no threading overhead
- **Cooperative multitasking** - tasks yield control at `await` points
- **Non-blocking I/O** - while waiting for responses, other tasks can run

### **Core Asyncio Concepts Demonstrated**

| Concept | Where Used | Why Important |
|---------|------------|---------------|
| `async def` / `await` | All functions | Creates coroutines that can be paused/resumed |
| `asyncio.gather()` | `main()` | Runs multiple tasks concurrently |
| `asyncio.sleep()` | Task loops | Non-blocking delays (vs `time.sleep()`) |
| `asyncio.to_thread()` | AI processing | Runs sync code in thread pools |
| `async with` | Database sessions | Async context managers |

## 🏗️ Architecture

### **Database-as-Queue Pattern**
```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐
│ IMAP Server │───▶│   Database   │───▶│ AI Services │
│             │    │    Queue     │    │             │
└─────────────┘    └──────────────┘    └─────────────┘
                           │
                    processing_status:
                    • pending
                    • processing  
                    • completed
                    • failed
```

### **Two Concurrent Tasks**

**1. Email Fetcher (`email_fetcher_task`)**
```python
while True:
    emails = await fetch_emails_async()  # IMAP network I/O
    await save_emails_to_queue(emails)   # Database I/O
    await asyncio.sleep(300)             # 5 minutes (non-blocking!)
```

**2. Email Processor (`email_processor_task`)**
```python
while True:
    email = await claim_next_email()        # Atomic database operation
    if email:
        await process_email_with_ai(email)  # AI processing
    else:
        await asyncio.sleep(1)              # Quick check interval
```

## 📁 File Structure

```
backend/
├── src/
│   ├── services/
│   │   └── email_processor_service.py  # Main coordinator
│   ├── tasks/
│   │   ├── email_fetcher_task.py       # IMAP email fetching
│   │   └── email_processor_task.py     # AI processing
│   └── email_logic/
│       └── email_service.py            # Async IMAP utilities
├── run_email_service.py                # Service runner
├── queue_status.py                     # Queue monitor
└── ASYNCIO_EMAIL_SERVICE.md           # This guide
```

## 🚀 How to Run

### **Start the Service**
```bash
cd backend
python run_email_service.py
```

### **Monitor Queue Status**
```bash
cd backend  
python queue_status.py
```

### **Expected Output**
```
🚀 Starting Email Processing Service
2024-01-20 10:30:00 - Email fetcher started
2024-01-20 10:30:00 - Email processor started
2024-01-20 10:30:01 - Checking for new emails...
2024-01-20 10:30:02 - Fetched 3 emails from IMAP server
2024-01-20 10:30:02 - Saved 3 new emails to processing queue
2024-01-20 10:30:03 - Claimed email for processing: Meeting Tomorrow
2024-01-20 10:30:03 - Generating summary for: Meeting Tomorrow
...
```

## 🔍 Asyncio Deep Dive

### **1. Event Loop Fundamentals**

```python
# This is what asyncio.run(main()) does:
loop = asyncio.new_event_loop()
try:
    loop.run_until_complete(main())
finally:
    loop.close()
```

The **event loop** is like a scheduler:
- Keeps track of all running tasks
- Switches between tasks when they `await`
- Handles I/O completion notifications

### **2. Cooperative Multitasking**

```python
async def task_a():
    print("A: Starting")
    await asyncio.sleep(1)    # ← A yields control here
    print("A: Resuming")

async def task_b():  
    print("B: Starting")
    await asyncio.sleep(0.5)  # ← B yields control here
    print("B: Resuming")

# Running concurrently:
await asyncio.gather(task_a(), task_b())
```

**Output:**
```
A: Starting
B: Starting
B: Resuming      # ← B finishes first
A: Resuming      # ← A resumes after 1 second
```

### **3. Why `asyncio.to_thread()` for AI Calls**

AI skill functions are **synchronous** and potentially slow:

```python
# WRONG - This blocks the event loop:
summary = summarize_email_skill(email_content)  # 2-3 seconds!

# RIGHT - This runs in a thread pool:  
summary = await asyncio.to_thread(summarize_email_skill, email_content)
```

### **4. Atomic Database Operations**

The `claim_next_email()` function demonstrates **database-level atomicity**:

```python
# This is atomic - no race conditions:
result = await session.execute(
    update(Email)
    .where(Email.processing_status == "pending")
    .values(processing_status="processing")
    .returning(Email)
    .limit(1)
)
```

Even with multiple processors, only one can claim each email.

## 📊 Benefits vs Celery+Redis

| Aspect | Celery+Redis | Asyncio Service |
|--------|--------------|-----------------|
| **Processes** | 3+ (API, Celery, Redis) | 1 |
| **Dependencies** | Redis, broker setup | Database only |
| **Memory** | High (multiple processes) | Low (single process) |
| **Deployment** | Complex | Simple |
| **Job Persistence** | Lost on restart | Database-persisted |
| **Monitoring** | External tools | Direct database queries |
| **Debugging** | Multiple log sources | Single log stream |

## 🛠️ Configuration

### **Environment Variables**
```bash
# Email credentials
IMAP_SERVER=imap.gmail.com
IMAP_USERNAME=your-email@gmail.com  
IMAP_PASSWORD=your-app-password

# AI service
CEREBRAS_API_KEY=your-api-key

# Database (optional - defaults to SQLite)
DATABASE_URL=sqlite+aiosqlite:///muninmail.db
```

### **Timing Configuration**
```python
# In email_fetcher_task.py
TASK_INTERVAL_MINUTES = 5  # How often to check for new emails

# In email_processor_task.py  
await asyncio.sleep(1)     # How often to check for pending emails
```

## 🔍 Debugging & Monitoring

### **Real-time Queue Status**
```bash
python queue_status.py
```

### **Service Logs**
```bash
tail -f email_service.log
```

### **Database Queries**
```sql
-- Check processing status
SELECT processing_status, COUNT(*) 
FROM emails 
GROUP BY processing_status;

-- See recent activity
SELECT subject, processing_status, created_at, updated_at
FROM emails 
ORDER BY updated_at DESC 
LIMIT 10;
```

## 🚦 Next Steps

### **Enhancements You Can Add**

1. **Retry Logic**: Add `retry_count` field to Email model
2. **Rate Limiting**: Add delays between AI API calls
3. **Parallel Processing**: Use `asyncio.Semaphore` for concurrency control
4. **Health Checks**: Add endpoint to check service status
5. **Metrics**: Add processing time tracking

### **Scaling Options**

- **Horizontal**: Run multiple instances (they'll coordinate via database)
- **Vertical**: Increase AI call concurrency with semaphores
- **Hybrid**: Keep asyncio for coordination, add worker processes for CPU-heavy tasks

## 🎓 Learning Exercises

1. **Add a delay** between AI calls to see how asyncio handles it
2. **Run multiple instances** of the service to see database coordination
3. **Add logging** to see exactly when tasks yield and resume
4. **Modify the timing** to understand the responsiveness tradeoffs

---

This asyncio implementation demonstrates that **simple can be powerful**. You've replaced a complex multi-process setup with elegant single-threaded concurrency! 🎉 