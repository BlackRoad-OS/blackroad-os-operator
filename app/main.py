"""
BlackRoad OS Operator - Main FastAPI entrypoint
"""
from fastapi import FastAPI

app = FastAPI(
    title="BlackRoad OS Operator",
    description="Operator engine for BlackRoad OS — runs jobs, schedulers, background workers, and coordinates agent workflows",
    version="0.1.0"
)


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "blackroad-os-operator"}


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "blackroad-os-operator",
        "version": "0.1.0",
        "description": "Operator engine for BlackRoad OS"
    }
