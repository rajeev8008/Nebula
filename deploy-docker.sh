#!/bin/bash

# Nebula Docker Deployment Script for Linux/Mac
# This script builds and deploys the Nebula application using Docker Compose

set -e  # Exit on error

echo "🚀 Nebula Docker Deployment"
echo "=============================="
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "✅ Docker and Docker Compose found"
echo ""

# Check for .env file
if [ ! -f .env ]; then
    echo "⚠️  No .env file found. Creating from template..."
    cat > .env << EOF
PINECONE_API_KEY=your_pinecone_api_key_here
TMDB_API_KEY=your_tmdb_api_key_here
EOF
    echo "📝 Please edit .env file with your API keys"
    exit 1
fi

# Verify environment variables
source .env
if [ -z "$PINECONE_API_KEY" ] || [ "$PINECONE_API_KEY" = "your_pinecone_api_key_here" ]; then
    echo "❌ PINECONE_API_KEY not configured in .env"
    exit 1
fi

if [ -z "$TMDB_API_KEY" ] || [ "$TMDB_API_KEY" = "your_tmdb_api_key_here" ]; then
    echo "❌ TMDB_API_KEY not configured in .env"
    exit 1
fi

echo "✅ Environment variables configured"
echo ""

# Build images
echo "🔨 Building Docker images..."
docker-compose build --no-cache

if [ $? -eq 0 ]; then
    echo "✅ Images built successfully"
else
    echo "❌ Build failed"
    exit 1
fi

echo ""

# Start services
echo "🚀 Starting services..."
docker-compose up -d

if [ $? -eq 0 ]; then
    echo "✅ Services started successfully"
else
    echo "❌ Failed to start services"
    exit 1
fi

echo ""

# Wait for backend to be healthy
echo "⏳ Waiting for backend to be healthy..."
for i in {1..30}; do
    if curl -s http://localhost:8000/ > /dev/null; then
        echo "✅ Backend is healthy"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ Backend failed to start"
        docker-compose logs backend
        exit 1
    fi
    sleep 2
done

echo ""
echo "=============================="
echo "✅ Deployment successful!"
echo ""
echo "🌐 Frontend: http://localhost:3000"
echo "🔌 Backend: http://localhost:8000"
echo "📚 API Docs: http://localhost:8000/docs"
echo ""
echo "=============================="
echo ""
echo "📊 Running containers:"
docker-compose ps
