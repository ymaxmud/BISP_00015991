#!/bin/bash

# This script is here so you can boot the whole project with one command.
# It also clears the ports we use first, so an old crashed process does not
# block the new run and make it look like the project is broken.


PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
PYTHON="$PROJECT_DIR/.venv/bin/python3"

# Before starting again, clear the ports used by frontend, backend, and AI.
# That saves you from hunting zombie processes by hand.
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
