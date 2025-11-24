FROM python:3.11-slim AS base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY br_operator ./br_operator
COPY agent-catalog ./agent-catalog

ENV PORT=4000
ENV CATALOG_PATH=/app/agent-catalog/agents.yaml

EXPOSE 4000
CMD ["uvicorn", "br_operator.main:app", "--host", "0.0.0.0", "--port", "4000"]
