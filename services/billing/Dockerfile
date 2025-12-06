FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY main.py .
COPY tools.json .

# Expose port (Railway will set PORT env var)
EXPOSE 8080

# Run with uvicorn - use Railway's PORT env var with fallback to 8080
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8080}
