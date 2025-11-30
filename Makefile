# BlackRoad OS Operator - Development Makefile

.PHONY: help install dev test lint health version clean docker-build docker-run

PYTHON := python3
PORT := 8080

help:
	@echo "BlackRoad OS Operator - Development Commands"
	@echo ""
	@echo "  make install    - Install dependencies"
	@echo "  make dev        - Run development server"
	@echo "  make test       - Run tests"
	@echo "  make lint       - Run linter"
	@echo "  make health     - Check health endpoint"
	@echo "  make version    - Check version endpoint"
	@echo "  make docker-build - Build Docker image"
	@echo "  make docker-run   - Run Docker container"
	@echo ""

install:
	$(PYTHON) -m pip install -r requirements.txt

dev:
	uvicorn br_operator.main:app --host 0.0.0.0 --port $(PORT) --reload

test:
	$(PYTHON) -m pytest tests/ -v

lint:
	$(PYTHON) -m ruff check br_operator/

health:
	@curl -sf http://localhost:$(PORT)/health | python3 -m json.tool || echo "Service not running on port $(PORT)"

version:
	@curl -sf http://localhost:$(PORT)/version | python3 -m json.tool || echo "Service not running on port $(PORT)"

clean:
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete 2>/dev/null || true

docker-build:
	docker build -t blackroad-os-operator .

docker-run:
	docker run -p $(PORT):$(PORT) -e PORT=$(PORT) blackroad-os-operator
