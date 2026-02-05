# Local Development Setup Guide

Complete guide to run and test the Nakama backend locally on Windows.

---

## Prerequisites

### Required Software

| Software | Version | Download |
|----------|---------|----------|
| Docker Desktop | Latest | https://www.docker.com/products/docker-desktop |
| Git | Latest | https://git-scm.com/downloads |
| curl | Any | Included in Windows 10+, or use Git Bash |
| jq (optional) | Any | https://jqlang.github.io/jq/download/ |

### Docker Desktop Setup

1. Install Docker Desktop for Windows
2. Enable **WSL 2** backend (recommended) in Docker settings
3. Allocate at least **4GB RAM** to Docker (Settings → Resources)
4. Ensure Docker is running (system tray icon should be green)

---

## Quick Start (5 minutes)

### Step 1: Open Terminal

Open PowerShell or Git Bash in the project directory:

```powershell
cd C:\Office\Backend\nakama
```

### Step 2: Start All Services

```powershell
docker-compose up -d
```

This starts:
- **CockroachDB** - Database (ports 8080, 26257)
- **Nakama** - Game server (ports 7349, 7350, 7351)
- **Prometheus** - Metrics (port 9090)

### Step 3: Verify Services Running

```powershell
docker-compose ps
```

Expected output:
```
NAME                    STATUS      PORTS
nakama-cockroachdb-1    healthy     0.0.0.0:8080->8080/tcp, 0.0.0.0:26257->26257/tcp
nakama-nakama-1         healthy     0.0.0.0:7349-7351->7349-7351/tcp
nakama-prometheus-1     running     0.0.0.0:9090->9090/tcp
```

### Step 4: Access Admin Console

Open browser: **http://localhost:7351**

Default credentials:
- **Username:** `admin`
- **Password:** `password`

---

## Service URLs

| Service | URL | Purpose |
|---------|-----|---------|
| Nakama Console | http://localhost:7351 | Admin dashboard |
| Nakama API | http://localhost:7350 | Client API endpoint |
| Nakama gRPC | localhost:7349 | gRPC endpoint |
| CockroachDB UI | http://localhost:8080 | Database admin |
| Prometheus | http://localhost:9090 | Metrics dashboard |

---

## Testing the Backend

### Basic Health Check

```powershell
curl http://localhost:7350/healthcheck
```

Expected: `{}` (empty JSON = healthy)

### Device Authentication Test

```powershell
# Authenticate with a test device
curl -X POST "http://localhost:7350/v2/account/authenticate/device?create=true" `
  -H "Authorization: Basic ZGVmYXVsdGtleTo=" `
  -H "Content-Type: application/json" `
  -d '{"id": "test-device-123"}'
```

Expected response contains `token` and `user_id`.

### Test an RPC Endpoint

Replace `YOUR_TOKEN` with the token from authentication:

```powershell
# Get player profile
curl -X POST "http://localhost:7350/v2/rpc/get_player_profile" `
  -H "Authorization: Bearer YOUR_TOKEN" `
  -H "Content-Type: application/json" `
  -d '{"gameId": "test-game-001"}'
```

---

## Complete Test Suite

### Run the Compatibility Quiz Test (Git Bash)

```bash
# Make executable and run
chmod +x test_compatibility_quiz.sh
./test_compatibility_quiz.sh
```

This tests the full flow: authentication → create session → join → submit answers → get results.

### Manual RPC Testing Examples

#### 1. Create/Sync User Identity

```powershell
curl -X POST "http://localhost:7350/v2/rpc/create_or_sync_user" `
  -H "Authorization: Bearer YOUR_TOKEN" `
  -H "Content-Type: application/json" `
  -d '{
    "username": "TestPlayer",
    "device_id": "test-device-123",
    "game_id": "my-quiz-game"
  }'
```

#### 2. Get Wallet Balance

```powershell
curl -X POST "http://localhost:7350/v2/rpc/create_or_get_wallet" `
  -H "Authorization: Bearer YOUR_TOKEN" `
  -H "Content-Type: application/json" `
  -d '{
    "device_id": "test-device-123",
    "game_id": "my-quiz-game"
  }'
```

#### 3. Submit Score

```powershell
curl -X POST "http://localhost:7350/v2/rpc/submit_score_and_sync" `
  -H "Authorization: Bearer YOUR_TOKEN" `
  -H "Content-Type: application/json" `
  -d '{
    "score": 1500,
    "device_id": "test-device-123",
    "game_id": "my-quiz-game"
  }'
```

#### 4. Get All Leaderboards

```powershell
curl -X POST "http://localhost:7350/v2/rpc/get_all_leaderboards" `
  -H "Authorization: Bearer YOUR_TOKEN" `
  -H "Content-Type: application/json" `
  -d '{
    "device_id": "test-device-123",
    "game_id": "my-quiz-game",
    "limit": 10
  }'
```

#### 5. Daily Rewards

```powershell
# Claim daily reward
curl -X POST "http://localhost:7350/v2/rpc/claim_daily_reward" `
  -H "Authorization: Bearer YOUR_TOKEN" `
  -H "Content-Type: application/json" `
  -d '{"gameId": "my-quiz-game"}'

# Get streak status
curl -X POST "http://localhost:7350/v2/rpc/get_daily_reward_status" `
  -H "Authorization: Bearer YOUR_TOKEN" `
  -H "Content-Type: application/json" `
  -d '{"gameId": "my-quiz-game"}'
```

---

## Viewing Logs

### Real-time Logs (All Services)

```powershell
docker-compose logs -f
```

### Nakama Logs Only

```powershell
docker-compose logs -f nakama
```

### Filter for Errors

```powershell
docker-compose logs nakama 2>&1 | Select-String -Pattern "error|ERROR|Error"
```

---

## Database Access

### CockroachDB Web UI

Open: **http://localhost:8080**

### SQL Shell

```powershell
docker exec -it nakama-cockroachdb-1 ./cockroach sql --insecure
```

Useful queries:

```sql
-- List all users
SELECT id, username, create_time FROM users LIMIT 10;

-- View storage data
SELECT collection, key, user_id FROM storage LIMIT 20;

-- Check leaderboard records
SELECT leaderboard_id, owner_id, score FROM leaderboard_record LIMIT 20;
```

---

## Common Operations

### Stop All Services

```powershell
docker-compose down
```

### Stop and Remove Data (Clean Reset)

```powershell
docker-compose down -v
```

### Restart Nakama Only (After Code Changes)

```powershell
docker-compose restart nakama
```

### Rebuild After Changing Docker Config

```powershell
docker-compose up -d --build
```

### View JavaScript Module Errors

If your JavaScript modules have syntax errors:

```powershell
docker-compose logs nakama | Select-String -Pattern "Failed to eval|ReferenceError|SyntaxError"
```

---

## Development Workflow

### Making Code Changes

1. Edit files in `data/modules/`
2. Restart Nakama to reload modules:
   ```powershell
   docker-compose restart nakama
   ```
3. Check logs for compilation errors:
   ```powershell
   docker-compose logs nakama --tail 50
   ```
4. Test your changes via curl or Unity client

### Hot Reload (Not Supported)

Nakama loads JavaScript modules at startup. You must restart the container to reload changes.

---

## Troubleshooting

### "Port already in use"

```powershell
# Find what's using port 7350
netstat -ano | findstr :7350

# Kill the process (replace PID)
taskkill /PID <PID> /F
```

### "CockroachDB not healthy"

Wait 30 seconds for CockroachDB to initialize, then:

```powershell
docker-compose down -v
docker-compose up -d
```

### "ReferenceError: require is not defined"

Your JavaScript uses CommonJS syntax. Nakama 3.x requires ES Modules:
- ❌ `const x = require('...')`
- ✅ `import x from '...'`

See: [ESM Migration Guide](./_archived_docs/esm_guides/ESM_MIGRATION_COMPLETE_GUIDE.md)

### "Failed to connect to database"

Ensure CockroachDB is healthy:

```powershell
docker-compose ps
# If cockroachdb shows "unhealthy", restart it:
docker-compose restart cockroachdb
# Wait 30 seconds, then restart nakama:
docker-compose restart nakama
```

### Viewing Nakama Server Configuration

```powershell
docker exec nakama-nakama-1 cat /nakama/data/local.yml
```

---

## Testing with Unity

### Configure Unity Client

In your Unity Nakama client configuration:

```csharp
var client = new Nakama.Client(
    scheme: "http",
    host: "localhost",
    port: 7350,
    serverKey: "defaultkey"
);
```

### Local vs Production

| Setting | Local | Production |
|---------|-------|------------|
| Host | `localhost` | Your server domain |
| Port | `7350` | `7350` (or 443 with HTTPS) |
| Scheme | `http` | `https` |
| Server Key | `defaultkey` | Your production key |

---

## Performance Monitoring

### Prometheus Metrics

Open: **http://localhost:9090**

Useful queries:
- `nakama_rpc_duration_seconds` - RPC latency
- `nakama_session_count` - Active sessions
- `nakama_socket_count` - WebSocket connections

### Nakama Console Status

Open: **http://localhost:7351** → Status tab shows:
- Active sessions
- Message rate
- Memory usage

---

## Quick Reference

```powershell
# Start everything
docker-compose up -d

# View logs
docker-compose logs -f nakama

# Restart after code changes
docker-compose restart nakama

# Full reset
docker-compose down -v && docker-compose up -d

# Test health
curl http://localhost:7350/healthcheck
```

---

## Next Steps

1. **Run the test script**: `./test_compatibility_quiz.sh`
2. **Explore the Admin Console**: http://localhost:7351
3. **Review available RPCs**: See [docs/COMPLETE_RPC_REFERENCE.md](docs/COMPLETE_RPC_REFERENCE.md)
4. **Connect Unity client**: Use the configuration above
