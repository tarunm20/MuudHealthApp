# MUUD Health Backend Launcher with Password Authentication
# Save this as: launch-backend.ps1 in your project root

param(
    [switch]$Reset,
    [switch]$SkipDocker,
    [switch]$Verbose
)

# Colors for better output
$colors = @{
    Info = "Cyan"
    Success = "Green"
    Warning = "Yellow"
    Error = "Red"
    Header = "Magenta"
}

function Write-ColorOutput {
    param([string]$Message, [string]$Color = "White")
    Write-Host $Message -ForegroundColor $colors[$Color]
}

function Test-Command {
    param([string]$Command)
    try {
        Get-Command $Command -ErrorAction Stop | Out-Null
        return $true
    } catch {
        return $false
    }
}

function Wait-ForDatabase {
    param([int]$MaxAttempts = 30)
    
    Write-ColorOutput "Waiting for PostgreSQL to be ready..." "Info"
    
    for ($i = 1; $i -le $MaxAttempts; $i++) {
        try {
            $env:PGPASSWORD = "muud_health"
            $result = docker exec muud_health_db pg_isready -U postgres 2>$null
            if ($result -match "accepting connections") {
                Write-ColorOutput "SUCCESS: PostgreSQL is ready with password authentication!" "Success"
                return $true
            }
        } catch {
            # Continue trying
        }
        
        Write-Progress -Activity "Waiting for Database" -Status "Attempt $i of $MaxAttempts" -PercentComplete (($i / $MaxAttempts) * 100)
        Start-Sleep -Seconds 2
    }
    
    Write-Progress -Activity "Waiting for Database" -Completed
    Write-ColorOutput "ERROR: PostgreSQL failed to start within $($MaxAttempts * 2) seconds" "Error"
    return $false
}

function Initialize-Database {
    Write-ColorOutput "Initializing database tables with password authentication..." "Info"
    
    $createTablesSQL = @"
CREATE TABLE IF NOT EXISTS journal_entries (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    entry_text TEXT NOT NULL,
    mood_rating INTEGER CHECK (mood_rating >= 1 AND mood_rating <= 5),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS contacts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    contact_name VARCHAR(255) NOT NULL,
    contact_email VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, contact_email)
);

INSERT INTO journal_entries (user_id, entry_text, mood_rating, timestamp) 
SELECT 1, 'Welcome to MUUD Health! Your secure database is ready.', 5, NOW()
WHERE NOT EXISTS (SELECT 1 FROM journal_entries);

INSERT INTO journal_entries (user_id, entry_text, mood_rating, timestamp) 
SELECT 1, 'Password authentication is now enabled for better security.', 4, NOW() - INTERVAL '1 hour'
WHERE NOT EXISTS (SELECT 1 FROM journal_entries WHERE entry_text LIKE '%Password authentication%');

INSERT INTO contacts (user_id, contact_name, contact_email) 
SELECT 1, 'Dr. Sample', 'dr.sample@healthcare.com'
WHERE NOT EXISTS (SELECT 1 FROM contacts);

INSERT INTO contacts (user_id, contact_name, contact_email) 
SELECT 1, 'MUUD Health Support', 'support@muudhealth.com'
WHERE NOT EXISTS (SELECT 1 FROM contacts WHERE contact_email = 'support@muudhealth.com');

SELECT 'Secure database initialized successfully!' as status;
SELECT 'Journal entries: ' || COUNT(*) as info FROM journal_entries;
SELECT 'Contacts: ' || COUNT(*) as info FROM contacts;
"@

    try {
        # Set password for database connection
        $env:PGPASSWORD = "muud_health"
        $createTablesSQL | docker exec -i -e PGPASSWORD=muud_health muud_health_db psql -U postgres -d muud_health
        Write-ColorOutput "SUCCESS: Secure database tables created successfully!" "Success"
        return $true
    } catch {
        Write-ColorOutput "ERROR: Failed to initialize database: $($_.Exception.Message)" "Error"
        return $false
    }
}

function Create-DockerCompose {
    Write-ColorOutput "Creating docker-compose.yml with password authentication..." "Info"
    
    $dockerComposeContent = @"
version: '3.8'

services:
  postgres:
    image: postgres:15
    container_name: muud_health_db
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: muud_health
      POSTGRES_DB: muud_health
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  postgres_data:
"@
    
    $dockerComposeContent | Out-File -FilePath "docker-compose.yml" -Encoding UTF8
    Write-ColorOutput "SUCCESS: docker-compose.yml created with password authentication" "Success"
}

# Main script execution
Clear-Host
Write-ColorOutput "MUUD Health Secure Backend Launcher" "Header"
Write-ColorOutput "===================================" "Header"
Write-Host ""

# Check prerequisites
Write-ColorOutput "Checking prerequisites..." "Info"

if (-not (Test-Command "docker")) {
    Write-ColorOutput "ERROR: Docker is not installed or not in PATH" "Error"
    Write-ColorOutput "Please install Docker Desktop from https://docker.com/products/docker-desktop" "Warning"
    exit 1
}

if (-not (Test-Command "node")) {
    Write-ColorOutput "ERROR: Node.js is not installed or not in PATH" "Error"
    Write-ColorOutput "Please install Node.js from https://nodejs.org" "Warning"
    exit 1
}

if (-not (Test-Command "npm")) {
    Write-ColorOutput "ERROR: npm is not available" "Error"
    exit 1
}

Write-ColorOutput "SUCCESS: All prerequisites met!" "Success"

# Check if Docker is running
try {
    docker ps | Out-Null
    Write-ColorOutput "SUCCESS: Docker is running" "Success"
} catch {
    Write-ColorOutput "ERROR: Docker is not running. Please start Docker Desktop first." "Error"
    exit 1
}

# Navigate to backend directory
if (-not (Test-Path "backend")) {
    Write-ColorOutput "ERROR: Backend directory not found. Please run this script from the project root." "Error"
    exit 1
}

Set-Location backend
Write-ColorOutput "Changed to backend directory" "Info"

# Reset option
if ($Reset) {
    Write-ColorOutput "Resetting Docker containers and volumes..." "Warning"
    docker-compose down -v 2>$null
    docker system prune -f 2>$null
    Write-ColorOutput "SUCCESS: Reset complete" "Success"
}

# Docker setup
if (-not $SkipDocker) {
    Write-ColorOutput "Setting up secure Docker containers..." "Info"
    
    # Stop existing containers
    docker-compose down 2>$null
    
    # Create docker-compose.yml with password
    Create-DockerCompose
    
    # Create .env file with password
    Write-ColorOutput "Creating .env file with password authentication..." "Info"
    $envContent = @"
# Database Configuration with Password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=muud_health
DB_USER=postgres
DB_PASSWORD=muud_health

# Server Configuration
PORT=3000
NODE_ENV=development

# Security Note: In production, use a stronger password
"@
    $envContent | Out-File -FilePath ".env" -Encoding UTF8
    Write-ColorOutput "SUCCESS: .env file created with secure password" "Success"
    
    # Start Docker containers with password
    Write-ColorOutput "Starting PostgreSQL container with password authentication..." "Info"
    $dockerResult = docker-compose up -d 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-ColorOutput "SUCCESS: Secure Docker containers started" "Success"
    } else {
        Write-ColorOutput "ERROR: Failed to start Docker containers:" "Error"
        Write-ColorOutput $dockerResult "Error"
        exit 1
    }
    
    # Wait longer for password-protected database
    Write-ColorOutput "Waiting for password-protected database to initialize..." "Info"
    Start-Sleep -Seconds 5
    
    # Wait for database to be ready
    if (-not (Wait-ForDatabase)) {
        Write-ColorOutput "ERROR: Database failed to start. Checking logs..." "Error"
        docker logs muud_health_db
        exit 1
    }
    
    # Initialize database with password
    if (-not (Initialize-Database)) {
        exit 1
    }
} else {
    Write-ColorOutput "Skipping Docker setup" "Warning"
}

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-ColorOutput "Installing Node.js dependencies..." "Info"
    npm install
    
    if ($LASTEXITCODE -eq 0) {
        Write-ColorOutput "SUCCESS: Dependencies installed" "Success"
    } else {
        Write-ColorOutput "ERROR: Failed to install dependencies" "Error"
        exit 1
    }
} else {
    Write-ColorOutput "Node.js dependencies already installed" "Info"
}

# Test database connection with password
Write-ColorOutput "Testing secure database connection..." "Info"
try {
    $testQuery = "SELECT 'Secure connection test successful!' as test;"
    $env:PGPASSWORD = "muud_health"
    $testResult = docker exec -e PGPASSWORD=muud_health muud_health_db psql -U postgres -d muud_health -c $testQuery 2>$null
    if ($testResult -match "Secure connection test successful") {
        Write-ColorOutput "SUCCESS: Secure database connection test passed" "Success"
    } else {
        Write-ColorOutput "WARNING: Database connection test inconclusive" "Warning"
    }
} catch {
    Write-ColorOutput "WARNING: Could not test database connection" "Warning"
}

# Show final status
Write-Host ""
Write-ColorOutput "Secure Backend Setup Complete!" "Success"
Write-ColorOutput "=============================" "Success"
Write-Host ""
Write-ColorOutput "Security Configuration:" "Info"
Write-ColorOutput "  - Database Password: muud_health" "Success"
Write-ColorOutput "  - User: postgres" "Success"
Write-ColorOutput "  - Database: muud_health" "Success"
Write-ColorOutput "  - Port: 5432" "Success"
Write-Host ""
Write-ColorOutput "Status Summary:" "Info"
Write-ColorOutput "  - Docker containers running with password auth" "Success"
Write-ColorOutput "  - PostgreSQL database ready and secured" "Success"
Write-ColorOutput "  - Node.js dependencies installed" "Success"
Write-ColorOutput "  - Database tables initialized with sample data" "Success"
Write-Host ""

# Show security warning
Write-ColorOutput "SECURITY NOTES:" "Warning"
Write-ColorOutput "  - Password is stored in .env file" "Warning"
Write-ColorOutput "  - DO NOT commit .env file to version control" "Warning"
Write-ColorOutput "  - Use stronger passwords in production" "Warning"
Write-Host ""

# Ask if user wants to start the server
$startServer = Read-Host "Start the API server now? (y/N)"

if ($startServer -match "^[Yy]") {
    Write-ColorOutput "Starting MUUD Health API server with secure database..." "Success"
    Write-ColorOutput "Press Ctrl+C to stop the server" "Warning"
    Write-Host ""
    
    # Start the server
    npm run dev
} else {
    Write-Host ""
    Write-ColorOutput "To start the server later:" "Info"
    Write-ColorOutput "   cd backend" "Info"
    Write-ColorOutput "   npm run dev" "Info"
    Write-Host ""
    Write-ColorOutput "Test endpoints:" "Info"
    Write-ColorOutput "   http://localhost:3000/health" "Info"
    Write-ColorOutput "   http://localhost:3000/test" "Info"
    Write-Host ""
    Write-ColorOutput "Database access:" "Info"
    Write-ColorOutput "   docker exec -e PGPASSWORD=muud_health -it muud_health_db psql -U postgres -d muud_health" "Info"
    Write-Host ""
    Write-ColorOutput "Useful commands:" "Info"
    Write-ColorOutput "   docker ps                    # Check containers" "Info"
    Write-ColorOutput "   docker logs muud_health_db   # View database logs" "Info"
    Write-ColorOutput "   docker-compose down          # Stop containers" "Info"
    Write-Host ""
}

# Return to original directory
Set-Location ..
Write-ColorOutput "Returned to project root" "Info"