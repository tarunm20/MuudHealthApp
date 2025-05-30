# MUUD Health - Community Wellness App

A comprehensive wellness application featuring journaling and contact management, built with React Native (Expo) frontend and Node.js/PostgreSQL backend.

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Quick Start Guide](#quick-start-guide)
- [Detailed Setup Instructions](#detailed-setup-instructions)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Development Workflow](#development-workflow)
- [Troubleshooting](#troubleshooting)
- [Production Deployment](#production-deployment)
- [Contributing](#contributing)

## 📖 Overview

MUUD Health is a wellness companion app that helps users track their mental health through journaling and maintain their support network through contact management. The app demonstrates modern full-stack development practices with proper backend integration and local storage fallbacks.

### Key Features

- **Journal Management**: Create, view, and delete personal journal entries with mood ratings
- **Contact Management**: Add and organize healthcare providers, therapists, family, and friends
- **Cross-Platform**: Works on iOS, Android, and Web via Expo
- **Offline Support**: Local storage fallback when backend is unavailable
- **Real-time Sync**: Automatic data synchronization with PostgreSQL backend

### Tech Stack

**Frontend:**
- React Native with Expo SDK 53
- React Navigation for routing
- AsyncStorage for local data
- Expo Vector Icons for UI

**Backend:**
- Node.js with Express.js
- PostgreSQL database
- Docker for containerization
- Joi for data validation
- CORS enabled for cross-origin requests

## 🏗️ Architecture

```
MUUD Health App
├── Frontend (React Native/Expo)
│   ├── Screens (Home, Journal, Contacts, Add forms)
│   ├── Components (Reusable UI components)
│   ├── Services (API layer with fallbacks)
│   └── Utils (Local storage management)
├── Backend (Node.js/Express)
│   ├── REST API endpoints
│   ├── Database models
│   ├── Validation middleware
│   └── Error handling
└── Database (PostgreSQL)
    ├── journal_entries table
    └── contacts table
```

## 🔧 Prerequisites

### Required Software

1. **Node.js** (v16 or higher)
   - Download from [nodejs.org](https://nodejs.org/)
   - Verify: `node --version` and `npm --version`

2. **Docker Desktop**
   - Download from [docker.com](https://www.docker.com/products/docker-desktop/)
   - Required for PostgreSQL database
   - Verify: `docker --version`

3. **Expo CLI** (for React Native development)
   ```bash
   npm install -g @expo/cli
   ```

4. **Git** (for version control)
   - Download from [git-scm.com](https://git-scm.com/)

### Mobile Development (Optional)

**For iOS Development:**
- macOS with Xcode installed
- iOS Simulator

**For Android Development:**
- Android Studio with Android SDK
- Android Emulator or physical device

**Alternative:** Use Expo Go app on your phone for quick testing

## 🚀 Quick Start Guide

### Option 1: Automated Setup (Windows PowerShell)

```powershell
# 1. Clone the repository
git clone <repository-url>
cd muud-health-app

# 2. Setup backend (run from project root)
powershell -ExecutionPolicy Bypass -File backend/setup-backend.ps1

# 3. Setup frontend (new terminal, from project root)
npm install
npx expo start
```

### Option 2: Manual Setup (All Platforms)

```bash
# 1. Clone and navigate
git clone <repository-url>
cd muud-health-app

# 2. Install frontend dependencies
npm install

# 3. Setup backend
cd backend
npm install

# 4. Start PostgreSQL database
docker-compose up -d

# 5. Wait for database to initialize (10-15 seconds)
sleep 15

# 6. Test database connection
node diagnostics.js

# 7. Start backend server
npm run dev

# 8. Start frontend (new terminal, from project root)
cd ..
npx expo start
```

## 📝 Detailed Setup Instructions

### 1. Project Setup

```bash
# Clone the repository
git clone <repository-url>
cd muud-health-app

# Install frontend dependencies
npm install
```

### 2. Backend Configuration

#### Environment Setup

Create `backend/.env` file:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=muud_health
DB_USER=postgres
DB_PASSWORD=muud_health

# Server Configuration
PORT=3000
NODE_ENV=development
```

#### Database Setup

```bash
cd backend

# Install backend dependencies
npm install

# Start PostgreSQL with Docker
docker-compose up -d

# Wait for database initialization
# Check status: docker ps
# View logs: docker logs muud_health_db

# Test database connection
node diagnostics.js
```

#### Database Schema

The database will automatically create these tables:

```sql
-- Journal entries table
CREATE TABLE journal_entries (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    entry_text TEXT NOT NULL,
    mood_rating INTEGER CHECK (mood_rating >= 1 AND mood_rating <= 5),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Contacts table
CREATE TABLE contacts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    contact_name VARCHAR(255) NOT NULL,
    contact_email VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, contact_email)
);
```

### 3. Frontend Configuration

The frontend is pre-configured to work with the backend. Key configuration in `src/services/api.js`:

```javascript
const API_BASE_URL = 'http://localhost:3000';
const USE_BACKEND = true; // Set to false for local-only mode
```

### 4. Running the Application

#### Start Backend Server

```bash
cd backend
npm run dev

# Server will start on http://localhost:3000
# Health check: http://localhost:3000/health
```

#### Start Frontend Application

```bash
# From project root
npx expo start

# Choose your platform:
# - Press 'w' for web
# - Press 'i' for iOS simulator
# - Press 'a' for Android emulator
# - Scan QR code with Expo Go app
```

## 📁 Project Structure

```
muud-health-app/
├── App.js                          # Main app component with navigation
├── package.json                    # Frontend dependencies
├── app.json                        # Expo configuration
├── index.js                        # App entry point
├── .gitignore                      # Git ignore rules
│
├── src/
│   ├── screens/                    # Screen components
│   │   ├── HomeScreen.js           # Dashboard with stats and quick actions
│   │   ├── JournalScreen.js        # Journal entries list
│   │   ├── AddJournalEntryScreen.js # Create new journal entry
│   │   ├── ContactsScreen.js       # Contacts list with search
│   │   └── AddContactScreen.js     # Add new contact form
│   │
│   ├── components/                 # Reusable components
│   │   ├── JournalEntry.js         # Journal entry card
│   │   └── ContactCard.js          # Contact card with actions
│   │
│   ├── services/                   # API and data services
│   │   └── api.js                  # Backend API calls with fallbacks
│   │
│   └── utils/                      # Utility functions
│       └── storage.js              # Local storage management
│
├── backend/                        # Backend server
│   ├── server.js                   # Express server with API endpoints
│   ├── package.json                # Backend dependencies
│   ├── docker-compose.yml          # PostgreSQL container config
│   ├── diagnostics.js              # Database connection tester
│   ├── setup-backend.ps1           # Windows setup script
│   ├── setup-db.ps1                # Database setup script
│   └── .env                        # Environment variables (create this)
│
└── assets/                         # App assets (icons, images)
    ├── icon.png
    ├── splash-icon.png
    ├── adaptive-icon.png
    └── favicon.png
```

## 🔌 API Documentation

### Journal Endpoints

#### Create Journal Entry
```http
POST /journal/entry
Content-Type: application/json

{
  "user_id": 1,
  "entry_text": "Had a great day today!",
  "mood_rating": 5
}
```

#### Get User's Journal Entries
```http
GET /journal/user/:id
```

#### Delete Journal Entry
```http
DELETE /journal/entry/:id
```

### Contact Endpoints

#### Add Contact
```http
POST /contacts/add
Content-Type: application/json

{
  "user_id": 1,
  "contact_name": "Dr. Smith",
  "contact_email": "dr.smith@healthcare.com"
}
```

#### Get User's Contacts
```http
GET /contacts/user/:id
```

### Utility Endpoints

#### Health Check
```http
GET /health
```

#### Simple Test
```http
GET /test
```

### Response Format

All API responses follow this format:

```json
{
  "success": true,
  "message": "Operation completed successfully",
  "data": {},
  "count": 5
}
```

Error responses:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message"
}
```

## 🔄 Development Workflow

### Daily Development

1. **Start Database** (if not running):
   ```bash
   cd backend && docker-compose up -d
   ```

2. **Start Backend**:
   ```bash
   cd backend && npm run dev
   ```

3. **Start Frontend**:
   ```bash
   npx expo start
   ```

### Making Changes

#### Frontend Changes
- Modify files in `src/` directory
- Changes auto-reload in Expo
- Use React Native debugger for debugging

#### Backend Changes
- Modify `backend/server.js`
- Server auto-restarts with nodemon
- Use console logs and API testing tools

#### Database Changes
- Connect directly: 
  ```bash
  docker exec -it muud_health_db psql -U postgres -d muud_health
  ```
- Use SQL commands or modify initialization in `server.js`

### Testing

#### Manual Testing

1. **API Testing** with curl:
   ```bash
   # Health check
   curl http://localhost:3000/health
   
   # Create journal entry
   curl -X POST http://localhost:3000/journal/entry \
     -H "Content-Type: application/json" \
     -d '{"user_id":1,"entry_text":"Test entry","mood_rating":4}'
   
   # Get entries
   curl http://localhost:3000/journal/user/1
   ```

2. **Database Testing**:
   ```bash
   # Run diagnostics
   cd backend && node diagnostics.js
   
   # Manual connection
   docker exec -it muud_health_db psql -U postgres -d muud_health
   
   # List tables
   \dt
   
   # Query data
   SELECT * FROM journal_entries LIMIT 5;
   SELECT * FROM contacts LIMIT 5;
   ```

#### Frontend Testing

1. **Web Browser**: Press 'w' in Expo CLI
2. **iOS Simulator**: Press 'i' in Expo CLI (macOS only)
3. **Android Emulator**: Press 'a' in Expo CLI
4. **Physical Device**: Install Expo Go app and scan QR code

### Data Management

#### Local Storage (Fallback Mode)
- Data stored in device's AsyncStorage
- Persists between app restarts
- Used when backend is unavailable

#### Backend Mode
- Data stored in PostgreSQL
- Synced across devices
- Local storage used as fallback

#### Switching Modes
Modify `src/services/api.js`:
```javascript
const USE_BACKEND = false; // Switch to local-only mode
```

## 🐛 Troubleshooting

### Common Issues

#### 1. Database Connection Failed

**Symptoms:**
- "Cannot connect to database" errors
- Backend health check fails
- API calls timeout

**Solutions:**
```bash
# Check Docker status
docker ps

# Restart database
cd backend
docker-compose down
docker-compose up -d

# Wait 15 seconds, then test
sleep 15
node diagnostics.js

# Reset completely if needed
docker-compose down -v
docker system prune -f
docker-compose up -d
```

#### 2. Backend Server Won't Start

**Symptoms:**
- Port 3000 already in use
- Module not found errors
- Permission denied

**Solutions:**
```bash
# Kill process on port 3000
npx kill-port 3000

# Reinstall dependencies
cd backend
rm -rf node_modules package-lock.json
npm install

# Check permissions (Unix)
chmod +x setup-backend.ps1
```

#### 3. Frontend Won't Connect to Backend

**Symptoms:**
- "Network request failed"
- API calls fail in app
- App works but no data syncs

**Solutions:**
1. **Check backend URL** in `src/services/api.js`:
   ```javascript
   const API_BASE_URL = 'http://localhost:3000';
   ```

2. **Verify backend is running**:
   ```bash
   curl http://localhost:3000/health
   ```

3. **Check network connectivity**:
   - Web: Use browser dev tools
   - Mobile: Ensure phone and computer on same network
   - Simulator: Check network settings

#### 4. Expo/React Native Issues

**Symptoms:**
- Metro bundler fails
- App crashes on startup
- Missing dependencies

**Solutions:**
```bash
# Clear cache
npx expo start --clear

# Reset metro cache
npx expo start -c

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Check Expo version
npx expo --version
```

#### 5. Database Initialization Issues

**Symptoms:**
- Tables don't exist
- Sample data missing
- Permission denied errors

**Solutions:**
```bash
# Manual database setup
docker exec -it muud_health_db psql -U postgres -d muud_health

# Create tables manually
CREATE TABLE IF NOT EXISTS journal_entries (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    entry_text TEXT NOT NULL,
    mood_rating INTEGER CHECK (mood_rating >= 1 AND mood_rating <= 5),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

# Exit and restart backend
\q
```

### Platform-Specific Issues

#### Windows
- Use PowerShell scripts: `setup-backend.ps1`
- Docker Desktop must be running
- Windows Defender might block Docker ports

#### macOS
```bash
# Install Homebrew if needed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install dependencies
brew install node docker
```

#### Linux
```bash
# Install Docker
sudo apt-get update
sudo apt-get install docker.io docker-compose

# Add user to docker group
sudo usermod -aG docker $USER
```

### Debug Mode

Enable detailed logging:

1. **Backend Debugging**:
   ```bash
   # Set environment variable
   export DEBUG=*
   npm run dev
   ```

2. **Frontend Debugging**:
   ```javascript
   // In src/services/api.js
   const DEBUG_MODE = true;
   ```

3. **Database Debugging**:
   ```bash
   # View all logs
   docker logs muud_health_db

   # Follow logs in real-time
   docker logs -f muud_health_db
   ```

### Getting Help

1. **Check the logs**:
   - Backend: Terminal output where `npm run dev` is running
   - Frontend: Expo dev tools in browser
   - Database: `docker logs muud_health_db`

2. **Run diagnostics**:
   ```bash
   cd backend && node diagnostics.js
   ```

3. **Verify setup**:
   ```bash
   # Check all services
   docker ps                    # Database running?
   curl localhost:3000/health   # Backend responding?
   npx expo doctor             # Expo environment OK?
   ```

## 🚀 Production Deployment

### Environment Variables

Create production `.env` file:

```env
# Production Database
DB_HOST=your-production-db-host
DB_PORT=5432
DB_NAME=muud_health_prod
DB_USER=your-db-user
DB_PASSWORD=your-secure-password

# Production Server
PORT=3000
NODE_ENV=production

# Security
JWT_SECRET=your-jwt-secret
ENCRYPTION_KEY=your-encryption-key
```

### Backend Deployment

#### Using Docker

```bash
# Build production image
docker build -t muud-health-backend .

# Run with production environment
docker run -d \
  --name muud-health-api \
  -p 3000:3000 \
  --env-file .env.production \
  muud-health-backend
```

#### Using PM2

```bash
# Install PM2
npm install -g pm2

# Start with PM2
pm2 start server.js --name muud-health-api

# Setup auto-restart
pm2 startup
pm2 save
```

### Frontend Deployment

#### Web Deployment

```bash
# Build for web
npx expo export --platform web

# Deploy to static hosting (Netlify, Vercel, etc.)
# Upload dist/ folder
```

#### Mobile App Store

```bash
# Build for iOS
npx expo build:ios

# Build for Android
npx expo build:android

# Or use EAS Build
npx expo install @expo/eas-cli
eas build --platform all
```

### Database Migration

```sql
-- Production database setup
-- Run these commands on your production PostgreSQL

CREATE DATABASE muud_health_prod;

\c muud_health_prod;

-- Create tables (same as development)
-- Import any existing data
-- Set up backups and monitoring
```

## 📞 Support

If you encounter issues not covered in this guide:

1. Check the troubleshooting section above
2. Run the diagnostic script: `node backend/diagnostics.js`
3. Review logs for error details
4. Ensure all prerequisites are properly installed

## 🔗 Useful Links

- [Expo Documentation](https://docs.expo.dev/)
- [React Navigation](https://reactnavigation.org/)
- [Express.js Guide](https://expressjs.com/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Docker Documentation](https://docs.docker.com/)

---

**Happy coding! 🎉**

This README provides complete setup instructions for the MUUD Health wellness application. Follow the steps carefully, and you'll have a fully functional app with both frontend and backend components working together.