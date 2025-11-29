FROM python:3.11-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY br_operator ./br_operator
COPY agent-catalog ./agent-catalog

ENV CATALOG_PATH=/app/agent-catalog/agents.yaml

EXPOSE 8080
CMD ["sh", "-c", "uvicorn br_operator.main:app --host 0.0.0.0 --port ${PORT:-8080}"]
