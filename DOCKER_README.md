# 🚀 Docker Compose Setup for Cerebras Email Client

This Docker Compose setup provides a complete email processing environment with PostgreSQL, Redis, FastAPI backend, Celery workers, and monitoring tools.

## 📋 Prerequisites

- Docker and Docker Compose installed
- Your email credentials (Gmail app password recommended)

## 🛠️ Quick Start

### 1. **Configure Environment Variables**
```bash
# Copy the environment template
cp env.docker.example .env

# Edit .env with your email credentials
# REQUIRED: Update IMAP_USERNAME, IMAP_PASSWORD, SMTP_USERNAME, SMTP_PASSWORD
```

### 2. **Start All Services**
```bash
# Start all services in background
docker-compose up -d

# Or start with logs visible
docker-compose up
```

### 3. **Check Service Status**
```bash
# View all running services
docker-compose ps

# View logs for specific service
docker-compose logs backend
docker-compose logs celery-worker
```

## 🏗️ Services Included

| Service | Port | Description |
|---------|------|-------------|
| **PostgreSQL** | 5432 | Database for storing emails and AI insights |
| **Redis** | 6379 | Message broker for Celery tasks |
| **Backend API** | 8000 | FastAPI application |
| **Celery Worker** | - | Background email processing |
| **Celery Beat** | - | Scheduled task scheduler |
| **Celery Flower** | 5555 | Task monitoring dashboard |

## 🌐 Access Points

- **API Documentation**: http://localhost:8000/docs
- **API Root**: http://localhost:8000
- **Celery Monitoring**: http://localhost:5555

## 📚 Key API Endpoints

- `GET /emails` - Fetch processed emails from database
- `POST /summarize` - Summarize an email
- `POST /extract_todos` - Extract todos from email
- `POST /get_flags` - Get email flags
- `POST /send_email` - Send an email

## 🔧 Common Commands

### **Development**
```bash
# Rebuild and restart services
docker-compose up --build

# Restart specific service
docker-compose restart backend

# View real-time logs
docker-compose logs -f celery-worker
```

### **Database Operations**
```bash
# Run database migrations
docker-compose exec backend alembic upgrade head

# Create new migration
docker-compose exec backend alembic revision --autogenerate -m "description"

# Access PostgreSQL directly
docker-compose exec postgres psql -U postgres -d muninmail_db
```

### **Celery Operations**
```bash
# Monitor Celery worker status
docker-compose exec celery-worker celery -A src.celery_app inspect active

# Purge all tasks
docker-compose exec celery-worker celery -A src.celery_app purge
```

## 🛑 Stopping Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: This deletes all data)
docker-compose down -v
```

## 🔍 Troubleshooting

### **Services won't start**
```bash
# Check logs for errors
docker-compose logs

# Rebuild containers
docker-compose up --build --force-recreate
```

### **Database connection errors**
```bash
# Check if PostgreSQL is healthy
docker-compose exec postgres pg_isready -U postgres

# Restart database service
docker-compose restart postgres
```

### **Celery worker issues**
```bash
# Check worker logs
docker-compose logs celery-worker

# Restart worker
docker-compose restart celery-worker
```

### **Email fetching issues**
Check your email credentials in `.env` file and ensure:
- IMAP/SMTP server settings are correct
- App-specific password is used (for Gmail)
- Account has IMAP enabled

## 📂 Data Persistence

- **PostgreSQL data**: Stored in `postgres_data` volume
- **Redis data**: Stored in `redis_data` volume

Data persists between container restarts unless volumes are explicitly removed.

## 🔐 Security Notes

- Change default passwords in production
- Use environment-specific `.env` files
- Consider using Docker secrets for sensitive data
- Limit network exposure in production

## 🧪 Testing the Setup

1. **Check API Health**:
   ```bash
   curl http://localhost:8000/
   ```

2. **View API Documentation**:
   Open http://localhost:8000/docs in your browser

3. **Monitor Celery Tasks**:
   Open http://localhost:5555 in your browser

4. **Test Email Fetching**:
   ```bash
   curl http://localhost:8000/emails
   ```

## 🔄 Development Workflow

1. **Make code changes** in the `backend/` directory
2. **Changes are automatically reloaded** (volume mount + --reload flag)
3. **Database changes** require migration: `docker-compose exec backend alembic revision --autogenerate -m "description"`
4. **Apply migrations**: `docker-compose exec backend alembic upgrade head`

This setup provides a complete development and testing environment for your smart email client! 🎉
