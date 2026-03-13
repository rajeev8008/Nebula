# Nebula Docker Deployment Script for Windows
# This script builds and deploys the Nebula application using Docker Compose

Write-Host "🚀 Nebula Docker Deployment" -ForegroundColor Cyan
Write-Host "==============================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is installed
if (!(Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Docker is not installed. Please install Docker Desktop first." -ForegroundColor Red
    exit 1
}

# Check if Docker Compose is available
if (!(Get-Command docker-compose -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Docker Compose is not installed. Please install Docker Compose first." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Docker and Docker Compose found" -ForegroundColor Green
Write-Host ""

# Check for .env file
if (!(Test-Path .env)) {
    Write-Host "⚠️  No .env file found. Creating from template..." -ForegroundColor Yellow
    @"
PINECONE_API_KEY=your_pinecone_api_key_here
TMDB_API_KEY=your_tmdb_api_key_here
"@ | Out-File -FilePath .env -Encoding utf8
    Write-Host "📝 Please edit .env file with your API keys" -ForegroundColor Yellow
    exit 1
}

# Verify environment variables
$envContent = Get-Content .env -Raw
if ($envContent -match "PINECONE_API_KEY=(.+)") {
    $pineconeKey = $matches[1].Trim()
    if ([string]::IsNullOrWhiteSpace($pineconeKey) -or $pineconeKey -eq "your_pinecone_api_key_here") {
        Write-Host "❌ PINECONE_API_KEY not configured in .env" -ForegroundColor Red
        exit 1
    }
}

if ($envContent -match "TMDB_API_KEY=(.+)") {
    $tmdbKey = $matches[1].Trim()
    if ([string]::IsNullOrWhiteSpace($tmdbKey) -or $tmdbKey -eq "your_tmdb_api_key_here") {
        Write-Host "❌ TMDB_API_KEY not configured in .env" -ForegroundColor Red
        exit 1
    }
}

Write-Host "✅ Environment variables configured" -ForegroundColor Green
Write-Host ""

# Build images
Write-Host "🔨 Building Docker images..." -ForegroundColor Cyan
docker-compose build --no-cache

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Images built successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Build failed" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Start services
Write-Host "🚀 Starting services..." -ForegroundColor Cyan
docker-compose up -d

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Services started successfully" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to start services" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Wait for backend to be healthy
Write-Host "⏳ Waiting for backend to be healthy..." -ForegroundColor Yellow
$maxAttempts = 30
$attempt = 0
$healthy = $false

while ($attempt -lt $maxAttempts) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8000/" -TimeoutSec 2 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            $healthy = $true
            break
        }
    } catch {
        # Continue waiting
    }
    $attempt++
    Start-Sleep -Seconds 2
}

if ($healthy) {
    Write-Host "✅ Backend is healthy" -ForegroundColor Green
} else {
    Write-Host "❌ Backend failed to start" -ForegroundColor Red
    Write-Host "Logs:" -ForegroundColor Yellow
    docker-compose logs backend
    exit 1
}

Write-Host ""
Write-Host "==============================" -ForegroundColor Cyan
Write-Host "✅ Deployment successful!" -ForegroundColor Green
Write-Host ""
Write-Host "🌐 Frontend: http://localhost:3000" -ForegroundColor Cyan
Write-Host "🔌 Backend: http://localhost:8000" -ForegroundColor Cyan
Write-Host "📚 API Docs: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host ""
Write-Host "==============================" -ForegroundColor Cyan
Write-Host ""
Write-Host "📊 Running containers:" -ForegroundColor Yellow
docker-compose ps
