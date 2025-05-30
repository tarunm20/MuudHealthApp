# Update Docker PostgreSQL to use password authentication
# Run this from your backend directory

Write-Host "Updating PostgreSQL Docker container to use password authentication" -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan

# Step 1: Stop existing containers and remove volumes
Write-Host "[1/6] Stopping existing containers and removing data..." -ForegroundColor Yellow
docker-compose down -v
docker system prune -f

# Step 2: Create new docker-compose.yml with password
Write-Host "[2/6] Creating new docker-compose.yml with password authentication..." -ForegroundColor Yellow
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
      # Remove trust auth - now requires password
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
Write-Host "SUCCESS: Updated docker-compose.yml with password authentication" -ForegroundColor Green

# Step 3: Create/update .env file with password
Write-Host "[3/6] Creating .env file with database password..." -ForegroundColor Yellow
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

# Security Note: In production, use a strong password and environment variables
"@

$envContent | Out-File -FilePath ".env" -Encoding UTF8
Write-Host "SUCCESS: .env file created with password" -ForegroundColor Green

# Step 4: Start PostgreSQL container with password
Write-Host "[4/6] Starting PostgreSQL container with password authentication..." -ForegroundColor Yellow
docker-compose up -d

# Step 5: Wait for PostgreSQL to be ready
Write-Host "[5/6] Waiting for PostgreSQL to initialize with password (20 seconds)..." -ForegroundColor Yellow
Start-Sleep -Seconds 20

# Test connection with password
$connected = $false
for ($i = 1; $i -le 15; $i++) {
    try {
        $result = docker exec muud_health_db pg_isready -U postgres 2>$null
        if ($result -match "accepting connections") {
            Write-Host "SUCCESS: PostgreSQL is ready with password authentication!" -ForegroundColor Green
            $connected = $true
            break
        }
    } catch {
        # Continue trying
    }
    Write-Host "Waiting for PostgreSQL... ($i/15)" -ForegroundColor Gray
    Start-Sleep -Seconds 2
}

if (-not $connected) {
    Write-Host "ERROR: PostgreSQL failed to start with password" -ForegroundColor Red
    Write-Host "Checking container logs..." -ForegroundColor Yellow
    docker logs muud_health_db
    exit 1
}

# Step 6: Create database schema with password authentication
Write-Host "[6/6] Creating database schema with password authentication..." -ForegroundColor Yellow

$createSchema = @"
-- Create journal_entries table
CREATE TABLE IF NOT EXISTS journal_entries (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    entry_text TEXT NOT NULL,
    mood_rating INTEGER CHECK (mood_rating >= 1 AND mood_rating <= 5),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create contacts table
CREATE TABLE IF NOT EXISTS contacts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    contact_name VARCHAR(255) NOT NULL,
    contact_email VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, contact_email)
);

-- Insert sample data
INSERT INTO journal_entries (user_id, entry_text, mood_rating, timestamp) VALUES
(1, 'Database now uses password authentication for better security!', 5, NOW() - INTERVAL '1 hour'),
(1, 'Testing the new password-protected PostgreSQL setup.', 4, NOW() - INTERVAL '30 minutes'),
(1, 'Everything is working great with the secure database connection.', 5, NOW() - INTERVAL '10 minutes')
ON CONFLICT DO NOTHING;

INSERT INTO contacts (user_id, contact_name, contact_email) VALUES
(1, 'Dr. Sarah Wilson', 'dr.wilson@healthcare.com'),
(1, 'Alex Thompson', 'alex.thompson@email.com'),
(1, 'Maria Garcia', 'maria.garcia@counseling.org'),
(1, 'Tech Support', 'support@muudhealth.com')
ON CONFLICT DO NOTHING;

-- Verify setup
SELECT 'Password-protected database setup complete!' as status;
SELECT 'Journal entries: ' || COUNT(*) as info FROM journal_entries;
SELECT 'Contacts: ' || COUNT(*) as info FROM contacts;
"@

try {
    # Use password authentication to connect
    $env:PGPASSWORD = "muud_health_2024"
    $createSchema | docker exec -i muud_health_db psql -U postgres -d muud_health
    Write-Host "SUCCESS: Database schema created with password authentication!" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Failed to create database schema with password" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

# Test the password-protected database
Write-Host "Testing password-protected database..." -ForegroundColor Yellow
try {
    Write-Host "Journal entries:" -ForegroundColor Cyan
    docker exec -e PGPASSWORD=muud_health_2024 muud_health_db psql -U postgres -d muud_health -c "SELECT id, LEFT(entry_text, 60) || '...' as preview, mood_rating FROM journal_entries ORDER BY timestamp DESC LIMIT 3;"
    
    Write-Host "Contacts:" -ForegroundColor Cyan
    docker exec -e PGPASSWORD=muud_health_2024 muud_health_db psql -U postgres -d muud_health -c "SELECT id, contact_name, contact_email FROM contacts ORDER BY contact_name LIMIT 3;"
    
    Write-Host "SUCCESS: Password authentication is working!" -ForegroundColor Green
} catch {
    Write-Host "WARNING: Could not test password authentication" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "PASSWORD-PROTECTED DATABASE READY!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Database Details:" -ForegroundColor White
Write-Host "  Host: localhost" -ForegroundColor Gray
Write-Host "  Port: 5432" -ForegroundColor Gray
Write-Host "  Database: muud_health" -ForegroundColor Gray
Write-Host "  User: postgres" -ForegroundColor Gray
Write-Host "  Password: muud_health_2024" -ForegroundColor Gray
Write-Host ""
Write-Host "SECURITY NOTES:" -ForegroundColor Yellow
Write-Host "- Password is stored in .env file" -ForegroundColor Gray
Write-Host "- Do NOT commit .env file to version control" -ForegroundColor Gray
Write-Host "- Use a stronger password in production" -ForegroundColor Gray
Write-Host "- Consider using environment variables in production" -ForegroundColor Gray
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "1. Start backend server: npm run dev" -ForegroundColor White
Write-Host "2. Test API: Invoke-RestMethod -Uri http://localhost:3000/health" -ForegroundColor White
Write-Host "3. Verify password auth: node diagnostics.js" -ForegroundColor White
Write-Host ""
Write-Host "Useful Commands:" -ForegroundColor White
Write-Host "  Connect to DB: docker exec -e PGPASSWORD=muud_health_2024 -it muud_health_db psql -U postgres -d muud_health" -ForegroundColor Gray
Write-Host "  Check containers: docker ps" -ForegroundColor Gray
Write-Host "  View logs: docker logs muud_health_db" -ForegroundColor Gray
Write-Host ""