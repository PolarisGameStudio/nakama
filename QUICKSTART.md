# Quick Start - Deploy Nakama

## Build the Image
```bash
# Compile TypeScript (if not already done)
cd data/modules && npx tsc && cd ../..

# Build Docker image
docker build -t nakama:latest .
```

## Run with Docker Compose (PostgreSQL)
```bash
# Start services
docker compose -f docker-compose-postgres.yml up -d

# Check status
docker compose -f docker-compose-postgres.yml ps

# View logs
docker compose -f docker-compose-postgres.yml logs -f nakama

# Stop services
docker compose -f docker-compose-postgres.yml down
```

## Run with Docker Compose (CockroachDB)
```bash
# Start services
docker compose up -d

# Check status
docker compose ps

# View logs
docker compose logs -f nakama

# Stop services
docker compose down
```

## Access the Services

- **Console UI**: http://localhost:7351
  - Default username: `admin`
  - Default password: `password`

- **HTTP API**: http://localhost:7350
- **gRPC API**: localhost:7349

## Health Check
```bash
# Using Docker healthcheck
docker ps

# Manual check (inside container)
docker exec <container-name> /nakama/nakama healthcheck
```

## Verify Modules Loaded
```bash
# Check logs for module initialization
docker logs <container-name> | grep -i "runtime"

# Should see:
# - "Go runtime modules loaded"
# - "Lua runtime modules loaded"
# - "JavaScript runtime modules loaded"
```

## Troubleshooting

### Build Fails
```bash
# Clean build
docker build --no-cache -t nakama:latest .

# Check TypeScript compiled
ls -la data/modules/build/
```

### Service Won't Start
```bash
# Check logs
docker logs <container-name>

# Verify database connection
docker compose logs postgres
# or
docker compose logs cockroachdb
```

### Can't Access Console
```bash
# Verify ports are exposed
docker ps

# Check if service is healthy
docker inspect <container-name> | grep -i health
```

## Production Deployment

For production, update the following in your deployment configuration:
1. Change console username/password
2. Configure proper database connection string
3. Set up proper TLS/SSL certificates
4. Configure session encryption keys
5. Set appropriate logging levels
6. Configure metrics collection

See `config.yaml` for all configuration options.
