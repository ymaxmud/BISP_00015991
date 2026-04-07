#!/bin/bash
# Avicenna Platform - Start All Services
# Usage: ./start.sh

set -e

export PATH="/usr/local/bin:/opt/homebrew/bin:$PATH"

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
PYTHON_BIN="python3"

if [ -x "$PROJECT_DIR/.venv/bin/python3" ]; then
  PYTHON_BIN="$PROJECT_DIR/.venv/bin/python3"
fi

echo "🏥 Starting Avicenna Platform..."
echo "================================"

# Kill any existing processes on our ports
echo "→ Clearing ports 3000, 8000, 8001..."
lsof -ti:3000 2>/dev/null | xargs kill -9 2>/dev/null || true
lsof -ti:8000 2>/dev/null | xargs kill -9 2>/dev/null || true
lsof -ti:8001 2>/dev/null | xargs kill -9 2>/dev/null || true
sleep 1

# Start Django Backend
echo "→ Starting Django backend on port 8000..."
cd "$PROJECT_DIR/backend"
"$PYTHON_BIN" manage.py runserver 8000 > /tmp/avicenna-django.log 2>&1 &
DJANGO_PID=$!

# Start FastAPI AI Service
echo "→ Starting AI service on port 8001..."
cd "$PROJECT_DIR/ai-service"
"$PYTHON_BIN" -m uvicorn app.main:app --port 8001 > /tmp/avicenna-fastapi.log 2>&1 &
FASTAPI_PID=$!

# Start Next.js Frontend
echo "→ Starting frontend on port 3000..."
cd "$PROJECT_DIR/frontend"
npm run dev > /tmp/avicenna-nextjs.log 2>&1 &
NEXTJS_PID=$!

# Wait for services to start
echo "→ Waiting for services to start..."
sleep 4

# Health checks
BACKEND_OK=false
AI_OK=false
FRONTEND_OK=false

curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/api/v1/organizations/specialties/ | grep -q "200" && BACKEND_OK=true
curl -s -o /dev/null -w "%{http_code}" http://localhost:8001/health | grep -q "200" && AI_OK=true
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200" && FRONTEND_OK=true

echo ""
echo "================================"
echo "Service Status:"
echo "  Frontend (Next.js):  $([ "$FRONTEND_OK" = true ] && echo '✅ Running on http://localhost:3000' || echo '❌ Failed - check /tmp/avicenna-nextjs.log')"
echo "  Backend (Django):    $([ "$BACKEND_OK" = true ] && echo '✅ Running on http://localhost:8000' || echo '❌ Failed - check /tmp/avicenna-django.log')"
echo "  AI Service (FastAPI):$([ "$AI_OK" = true ] && echo '✅ Running on http://localhost:8001' || echo '❌ Failed - check /tmp/avicenna-fastapi.log')"
echo ""
echo "Demo Accounts:"
echo "  Patient: sardor@mail.uz / demo1234"
echo "  Doctor:  dr.karimov@avicenna.uz / demo1234"
echo "  Admin:   admin@avicenna.uz / admin1234"
echo ""
echo "Open http://localhost:3000 in your browser"
echo "================================"
echo ""
echo "PIDs: Django=$DJANGO_PID  FastAPI=$FASTAPI_PID  Next.js=$NEXTJS_PID"
echo "To stop all: kill $DJANGO_PID $FASTAPI_PID $NEXTJS_PID"
echo ""

# Keep script running so terminal stays open
wait
