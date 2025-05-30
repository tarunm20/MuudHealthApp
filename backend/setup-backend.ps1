# MUUD Health Backend Setup Script for PowerShell
# Save this as setup-backend.ps1 in your backend directory

Write-Host "MUUD Health Backend Setup & Debug" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan

# Step 1: Navigate to backend directory
Set-Location backend

# Step 2: Check if Docker is running
Write-Host "[INFO] Checking Docker status..." -ForegroundColor Yellow
try {
    docker ps | Out-Null
    Write-Host "[SUCCESS] Docker is running!" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Docker is not running. Please start Docker Desktop first." -ForegroundColor Red
    exit 1
}

# Step 3: Stop existing containers and clean up
Write-Host "[INFO] Cleaning up existing containers..." -ForegroundColor Yellow
docker-compose down -v
docker system prune -f

# Step 4: Create/update .env file
Write-Host "[INFO] Creating .env file..." -ForegroundColor Yellow
@"
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=muud_health
DB_USER=postgres
# No password needed with trust authentication
DB_PASSWORD=

# Server Configuration
PORT=3000
NODE_ENV=development
"@ | Out-File -FilePath ".env" -Encoding UTF8

# Step 5: Start PostgreSQL container
Write-Host "[INFO] Starting PostgreSQL container..." -ForegroundColor Yellow
docker-compose up -d

# Step 6: Wait for PostgreSQL to be ready
Write-Host "[INFO] Waiting for PostgreSQL to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Step 7: Test PostgreSQL connection
Write-Host "[INFO] Testing PostgreSQL connection..." -ForegroundColor Yellow
for ($i = 1; $i -le 30; $i++) {
    try {
        $result = docker exec muud_health_db pg_isready -U postgres
        if ($result -match "accepting connections") {
            Write-Host "[SUCCESS] PostgreSQL is ready!" -ForegroundColor Green
            break
        }
    } catch {
        # Continue trying
    }
    Write-Host "Waiting... ($i/30)" -ForegroundColor Gray
    Start-Sleep -Seconds 2
}

# Step 8: Test direct database connection
Write-Host "[INFO] Testing direct database connection..." -ForegroundColor Yellow
try {
    docker exec muud_health_db psql -U postgres -d muud_health -c "SELECT 'Database connection successful!' as status;"
    Write-Host "[SUCCESS] Database connection test passed!" -ForegroundColor Green
} catch {
    Write-Host "[WARNING] Database connection test failed, but continuing..." -ForegroundColor Yellow
}

# Step 9: Install Node.js dependencies
Write-Host "[INFO] Installing Node.js dependencies..." -ForegroundColor Yellow
npm install

# Step 10: Run diagnostic script
Write-Host "[INFO] Running database diagnostics..." -ForegroundColor Yellow
node diagnostics.js

# Step 11: Ask user if they want to start the server
Write-Host ""
Write-Host "[SUCCESS] Setup complete! Ready to start the server." -ForegroundColor Green
$startServer = Read-Host "Do you want to start the server now? (y/n)"

if ($startServer -eq "y" -or $startServer -eq "Y") {
    Write-Host "[INFO] Starting MUUD Health API server..." -ForegroundColor Green
    Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
    npm run dev
} else {
    Write-Host ""
    Write-Host "[TIP] To start the server later, run:" -ForegroundColor Cyan
    Write-Host "   npm run dev" -ForegroundColor White
    Write-Host ""
    Write-Host "[TIP] To test the API:" -ForegroundColor Cyan
    Write-Host "   Invoke-RestMethod -Uri http://localhost:3000/health" -ForegroundColor White
}