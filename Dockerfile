FROM python:3.11-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

# Install dependencies first for layer caching
COPY requirements.txt ./
RUN pip install -r requirements.txt

# Copy application code
COPY br_operator ./br_operator
COPY agent-catalog ./agent-catalog
COPY config ./config
COPY migrations ./migrations

# Environment
ENV CATALOG_PATH=/app/agent-catalog/agents.yaml \
    POLICY_PATH=/app/config/policies \
    LOG_LEVEL=info

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD python -c "import httpx; httpx.get('http://localhost:${PORT:-8080}/health', timeout=5).raise_for_status()"

EXPOSE 8080
CMD ["sh", "-c", "uvicorn br_operator.main:app --host 0.0.0.0 --port ${PORT:-8080} --workers ${WORKERS:-1}"]
