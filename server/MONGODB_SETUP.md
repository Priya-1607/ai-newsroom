# MongoDB Setup Guide for AI Newsroom Server

## Prerequisites

- MongoDB Community Server (free) - Download from [mongodb.com](https://www.mongodb.com/try/download/community)
- Or use MongoDB Atlas (cloud) - Free tier available at [mongodb.com/atlas](https://www.mongodb.com/atlas)

## Option 1: Local MongoDB Installation

### 1. Install MongoDB Community Server

**macOS (using Homebrew):**

```bash
# Install Homebrew if not already installed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Tap MongoDB and install the latest available version
brew tap mongodb/brew
brew install mongodb-community

# Start MongoDB as a background service
brew services start mongodb-community

# Verify it's running
brew services list
```

**If mongodb-community is not available, try:**

```bash
# Check available MongoDB formulas
brew search mongodb

# Install the latest available version
brew install mongodb-community@latest

# Or use MongoDB Atlas (cloud - no installation needed)
```

**Alternative: Download directly from MongoDB**

1. Go to [MongoDB Community Server Download](https://www.mongodb.com/try/download/community)
2. Download the macOS `.tgz` file
3. Extract and follow the installation instructions

### 2. Create Data Directory

```bash
sudo mkdir -p /data/db
sudo chown -R $(whoami) /data/db
```

### 3. Start MongoDB Manually (if not using brew services)

```bash
mongod --dbpath /data/db
```

### 4. Verify Connection

```bash
mongosh --eval "db.version()"
```

## Option 2: MongoDB Atlas (Cloud)

### 1. Create Free Account

1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Click "Try Free" and create an account
3. Verify your email

### 2. Create Cluster

1. Click "Create a Cluster"
2. Choose "Free" tier (M0)
3. Select your preferred region
4. Click "Create Cluster" (takes 1-3 minutes)

### 3. Configure Security

1. **Create Database User:**
   - Go to "Database Access" → "Add New Database User"
   - Username: `liquid_news_admin`
   - Password: Generate a strong password
   - Role: `Atlas admin`

2. **Network Access:**
   - Go to "Network Access" → "Add IP Address"
   - Click "Allow Access from Anywhere" (0.0.0.0/0)
   - Or add your specific IP address

### 4. Get Connection String

1. Click "Database" → "Connect" → "Drivers"
2. Copy your connection string:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/liquid-news?retryWrites=true&w=majority
   ```

### 5. Update .env File

```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/liquid-news?retryWrites=true&w=majority
```

## Environment Configuration

The following MongoDB settings are available in `.env`:

```env
# Required
MONGODB_URI=mongodb://localhost:27017/liquid-news

# Optional - will be derived from MONGODB_URI if not specified
MONGODB_DB_NAME=liquid-news

# Connection Pool Settings (optional)
MONGODB_MAX_POOL_SIZE=10
MONGODB_MIN_POOL_SIZE=2
MONGODB_CONNECT_TIMEOUT=10000
MONGODB_SOCKET_TIMEOUT=45000
```

## Testing the Connection

### 1. Start the Server

```bash
cd /Users/priya/Desktop/liquid-news-system/server
npm run dev
```

### 2. Check Health Endpoint

```bash
curl http://localhost:5000/api/health
```

Expected response:

```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 10.5,
  "environment": "development",
  "database": {
    "status": "connected",
    "connected": true
  }
}
```

### 3. Test with mongosh (local)

```bash
mongosh liquid-news --eval "db.getCollectionNames()"
```

## Common Issues

### ❌ Connection Refused

- MongoDB is not running: `brew services start mongodb-community@7.0`
- Wrong port: Ensure MongoDB is running on port 27017
- Firewall blocking: Allow connections on port 27017

### ❌ Authentication Failed

- Wrong credentials in `.env`
- User doesn't have permissions
- Check Atlas network access settings

### ❌ Database Not Found

- Create the database first with `use liquid-news`
- Or let Mongoose create it automatically on first operation

## Useful Commands

### Start MongoDB (macOS)

```bash
brew services start mongodb-community@7.0
```

### Stop MongoDB (macOS)

```bash
brew services stop mongodb-community@7.0
```

### Check MongoDB Status

```bash
brew services list | grep mongodb
```

### Access MongoDB Shell

```bash
mongosh liquid-news
```

### View All Databases

```bash
mongosh --eval "db.adminCommand('listDatabases')"
```

## MongoDB Compass (GUI)

Download MongoDB Compass from [mongodb.com/products/compass](https://www.mongodb.com/products/compass) for a visual interface to manage your databases.

## Production Considerations

1. **Use MongoDB Atlas** for production deployments
2. **Enable SSL/TLS** for encrypted connections
3. **Use environment-specific** connection strings
4. **Set up replica sets** for high availability
5. **Configure backup** and recovery procedures
6. **Monitor performance** using MongoDB Atlas monitoring

## File Structure

After setup, your MongoDB configuration files will be:

```
server/
├── .env                          # Environment variables (add MONGODB_URI here)
├── .env.example                  # Template for environment variables
├── src/
│   ├── config/
│   │   ├── database.ts          # MongoDB connection configuration
│   │   └── index.ts             # Config exports
│   ├── utils/
│   │   └── logger.ts            # Winston logger configuration
│   └── index.ts                 # Server entry point with DB connection
└── MONGODB_SETUP.md             # This file
```
