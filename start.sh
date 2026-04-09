#!/bin/bash

#helps to start all services with one command, and also ensures that any existing processes on the required ports are killed first. cd ~/Desktop/AvicennaAssistant./start.sh


PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
PYTHON="$PROJECT_DIR/.venv/bin/python3"

# kill anything already on these ports
lsof -ti:3000,8000,8001 2>/dev/null | xargs kill -9 2>/dev/null || true

echo "Starting backend..."
cd "$PROJECT_DIR/backend" && "$PYTHON" manage.py runserver 8000 > /tmp/django.log 2>&1 &

echo "Starting AI service..."
cd "$PROJECT_DIR/ai-service" && "$PYTHON" -m uvicorn app.main:app --port 8001 > /tmp/fastapi.log 2>&1 &

echo "Starting frontend..."
cd "$PROJECT_DIR/frontend" && npm run dev > /tmp/nextjs.log 2>&1 &

echo ""
echo "All services started."
echo "  http://localhost:3000  — frontend"
echo "  http://localhost:8000  — backend"
echo "  http://localhost:8001  — AI service"
echo ""
echo "Logs: /tmp/django.log  /tmp/fastapi.log  /tmp/nextjs.log"

wait
