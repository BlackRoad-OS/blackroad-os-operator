# blackroad-os-operator

Operator engine for BlackRoad OS — runs jobs, schedulers, background workers, and coordinates agent workflows across OS, Prism, and Lucidia. Handles automation, task orchestration, and system-level operations.

## Structure

- **app/**: FastAPI application with health check endpoint
- **workers/**: Background job and agent orchestration modules
- **infra/**: Infrastructure configuration (Dockerfile, requirements, Railway config)

## Quick Start

### Local Development

1. Install dependencies:
```bash
pip install -r infra/requirements.txt
```

2. Run the application:
```bash
uvicorn app.main:app --reload
```

3. Access the service:
- Health check: http://localhost:8000/health
- API docs: http://localhost:8000/docs

### Docker

Build and run with Docker:

```bash
docker build -f infra/Dockerfile -t blackroad-os-operator .
docker run -p 8000:8000 blackroad-os-operator
```

### Deployment

The service can be deployed to Railway using the provided `infra/railway.toml` configuration.
