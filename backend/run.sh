#!/bin/bash
# FaceCheck Pro — Backend Startup Script
# Starts the Python FastAPI server for face embedding + vector search.

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR/.."

# Create virtual environment if needed
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate
source venv/bin/activate

# Install dependencies if needed
if ! python -c "import chromadb" 2>/dev/null; then
    echo "Installing dependencies..."
    pip install -r backend/requirements.txt
fi

# Seed database with real data (first run only)
if [ ! -d "backend/data/chroma" ] || [ -z "$(ls -A backend/data/chroma 2>/dev/null)" ]; then
    echo ""
    echo "🌱 First run detected! Seeding database with real face data..."
    echo "   This will download images from:"
    echo "   - FBI Wanted API (free, no key needed)"
    echo "   - Interpol Red Notices (free, no key needed)"
    echo "   - JailBase mugshots (free)"
    echo "   - ScamHaters United/RomanceScam.com"
    echo "   - GDELT VGKG news images (free)"
    echo "   - YouTube thumbnails (free)"
    echo ""
    python -m backend.crawlers.seed_database 2>&1 || echo "⚠️  Seeding had some errors (some sources may be unavailable)"
    echo ""
fi

# Start server
echo ""
echo "🚀 Starting FaceCheck Pro API on http://localhost:8000"
echo "   API docs: http://localhost:8000/docs"
echo ""
python -m uvicorn backend.api.main:app --host 0.0.0.0 --port 8000 --reload
