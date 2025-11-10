# Deployment Fix Summary

## Problem
Service deployment was failing with **503 Service Temporarily Unavailable** errors.

### Root Cause
1. **Alpine Linux network issues**: The Dockerfile was using Alpine Linux base images which experienced network connectivity problems when trying to fetch packages from `dl-cdn.alpinelinux.org`
2. **NPM SSL certificate errors**: TypeScript compilation during Docker build failed with `SELF_SIGNED_CERT_IN_CHAIN` errors when trying to install packages from npm registry
3. **Build failures**: These issues prevented the Docker image from building successfully, causing deployment failures

## Solution
Replaced the Alpine-based Dockerfile with a Debian-based multi-stage build that pre-compiles TypeScript modules outside of Docker.

### Changes Made

#### 1. Dockerfile
**Before**: Alpine Linux base with in-Docker TypeScript compilation
**After**: Debian bookworm base with pre-compiled modules

Key changes:
- Changed from `alpine:3.19` → `debian:bookworm-slim`
- Changed from `golang:1.25-alpine` → `golang:1.25.0-bookworm`
- Removed TypeScript compilation stage (moved outside Docker)
- Added proper module directory structure

#### 2. TypeScript Compilation
- Moved TypeScript compilation outside of Docker build
- Pre-compile using local `tsc` before building image
- Committed compiled JavaScript files to repository

#### 3. .gitignore
- Updated to allow committing `data/modules/build/` directory
- Ensures compiled modules are available during deployment

## Verification

### Build Test
```bash
docker build -t nakama-test -f Dockerfile .
# Result: ✅ SUCCESS
```

### Runtime Test
```bash
docker compose -f docker-compose-postgres-test.yml up -d
# Result: ✅ Service HEALTHY
```

### Service Status
```
NAME            STATUS
nakama-test     Up (healthy)
postgres-test   Up (healthy)
```

### Module Loading
All runtime providers initialized successfully:
- ✅ Go runtime modules loaded
- ✅ Lua runtime modules loaded
- ✅ JavaScript runtime modules loaded

### Service Endpoints
- Port 7349: gRPC API ✅
- Port 7350: HTTP API ✅
- Port 7351: Console UI ✅

## Deployment Instructions

### Prerequisites
1. Compile TypeScript modules:
```bash
cd data/modules
npx tsc
# This creates data/modules/build/leaderboard_rpc.js
```

### Build Image
```bash
docker build -t your-registry/nakama:tag .
```

### Deploy
Use existing docker-compose files or Kubernetes configurations. The service will now build and start successfully.

## Migration Notes

### For Existing Deployments
1. Pull latest changes from this branch
2. Recompile TypeScript if needed: `cd data/modules && npx tsc`
3. Rebuild Docker image
4. Deploy new image

### For New Deployments
No special steps needed - just build and deploy as normal.

## Technical Details

### Image Size
- Base image: debian:bookworm-slim (~74 MB)
- Final image: ~150-200 MB (depends on Go binary size)
- Significantly larger than Alpine but more stable

### Performance
No performance impact - the change only affects build process, not runtime.

### Security
- Using official Debian base images (regularly updated)
- No additional security concerns introduced
- CodeQL scan: ✅ No issues found

## Testing Checklist

Before deploying to production:
- [ ] Docker build completes without errors
- [ ] Service starts successfully
- [ ] Health checks pass
- [ ] Console UI accessible
- [ ] API endpoints responding
- [ ] Database connection working
- [ ] Runtime modules loading correctly

## Troubleshooting

### Build Still Fails
- Check network connectivity
- Verify Docker has access to package repositories
- Try building with `--no-cache` flag

### Service Won't Start
- Check database connection string
- Verify database is accessible
- Review logs: `docker logs <container-name>`

### Modules Not Loading
- Verify `data/modules/build/` contains compiled JS files
- Check file permissions
- Ensure Lua files are in `data/modules/lua/`

## Support
For issues or questions, check the logs and verify all steps above were followed correctly.
