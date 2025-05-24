FROM python:3.12-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PYTHONPATH=/app

# Set work directory
WORKDIR /app

# Install system dependencies
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install uv for fast dependency management
RUN pip install uv

# Copy dependency files
COPY pyproject.toml uv.lock ./

# Install Python dependencies
RUN uv sync --frozen

# Copy project files
COPY . .

# Create a script to wait for database
RUN echo '#!/bin/bash\n\
    set -e\n\
    host="$1"\n\
    shift\n\
    cmd="$@"\n\
    until PGPASSWORD=$POSTGRES_PASSWORD psql -h "$host" -U "$POSTGRES_USER" -d "$POSTGRES_DB" -c "\\q"; do\n\
    >&2 echo "Postgres is unavailable - sleeping"\n\
    sleep 1\n\
    done\n\
    >&2 echo "Postgres is up - executing command"\n\
    exec $cmd' > /wait-for-postgres.sh

RUN chmod +x /wait-for-postgres.sh

# Set the PATH to include the virtual environment
ENV PATH="/app/.venv/bin:$PATH"

# Expose port
EXPOSE 8000

# Default command (can be overridden in docker-compose)
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"] 