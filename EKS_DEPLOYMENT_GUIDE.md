# Nakama EKS Deployment Guide

Complete guide for deploying Nakama with Lua and TypeScript runtime modules on AWS EKS.

## 📋 Overview

This repository contains a production-ready Nakama deployment setup with:

- ✅ **TypeScript Runtime** - Compiled automatically during Docker build
- ✅ **Lua Runtime** - All modules included and loaded
- ✅ **RPC Registration** - Automatic registration of all RPCs on startup
- ✅ **Health Checks** - Built-in validation endpoints
- ✅ **EKS Ready** - Kubernetes manifests and Helm chart included
- ✅ **Post-Deploy Validation** - Automated RPC verification

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                       AWS EKS Cluster                        │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                    LoadBalancer                         │ │
│  │              (nakama-service:7350)                      │ │
│  └──────────────────────┬─────────────────────────────────┘ │
│                         │                                    │
│  ┌──────────────────────┴─────────────────────────────────┐ │
│  │              Nakama Deployment (Replicas: 1-N)         │ │
│  │  ┌──────────────────────────────────────────────────┐  │ │
│  │  │  /nakama/nakama (binary)                         │  │ │
│  │  │  /nakama/config.yml (from ConfigMap)             │  │ │
│  │  │  /nakama/data/modules/                           │  │ │
│  │  │    ├── index.js (TS entrypoint)                  │  │ │
│  │  │    ├── leaderboard_rpc.js (compiled TS)          │  │ │
│  │  │    ├── leaderboards.lua                          │  │ │
│  │  │    └── *.lua (all Lua modules)                   │  │ │
│  │  └──────────────────────────────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────┘ │
│                         │                                    │
│  ┌──────────────────────┴─────────────────────────────────┐ │
│  │         PersistentVolume (/nakama/data)                │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### Option 1: Kubernetes Manifests (Simple)

1. **Build Docker image**:
   ```bash
   docker build -t intelliverse-nakama:latest .
   ```

2. **Deploy to EKS**:
   ```bash
   kubectl apply -f k8s/nakama-all-in-one.yaml
   ```

3. **Verify deployment**:
   ```bash
   kubectl get pods -l app=nakama
   kubectl logs -f deployment/nakama
   ```

4. **Run validation**:
   ```bash
   kubectl apply -f k8s/post-deploy-validation-job.yaml
   kubectl logs job/nakama-rpc-validation
   ```

### Option 2: Helm Chart (Recommended for Production)

1. **Build Docker image**:
   ```bash
   docker build -t intelliverse-nakama:latest .
   ```

2. **Install with Helm**:
   ```bash
   helm install nakama ./helm/nakama-runtime
   ```

3. **Check status**:
   ```bash
   helm status nakama
   kubectl get all -l app.kubernetes.io/name=nakama-runtime
   ```

## 📦 Repository Structure

```
nakama/
├── Dockerfile                          # Multi-stage build with TypeScript compilation
├── nakama.yml                          # Nakama configuration file
├── data/modules/                       # Runtime modules
│   ├── index.ts                        # TypeScript entrypoint
│   ├── leaderboard_rpc.ts             # TypeScript RPC module
│   └── *.lua                          # Lua modules
├── k8s/                               # Kubernetes manifests
│   ├── nakama-configmap.yaml         # Configuration
│   ├── nakama-pvc.yaml               # Persistent storage
│   ├── nakama-deployment.yaml        # Deployment
│   ├── nakama-service.yaml           # LoadBalancer service
│   ├── nakama-all-in-one.yaml        # Complete deployment
│   ├── post-deploy-validation-job.yaml # RPC validation
│   └── README.md                      # Kubernetes guide
└── helm/                              # Helm chart (optional)
    └── nakama-runtime/
        ├── Chart.yaml
        ├── values.yaml
        ├── templates/
        └── README.md
```

## 🔧 Configuration

### Runtime Paths

The deployment uses the following structure:

```yaml
runtime:
  path: "/nakama/data/modules"
  js_entrypoint: "index.js"
  lua_path: "/nakama/data/modules"
```

This matches the Dockerfile output:
- JavaScript files: `/nakama/data/modules/*.js`
- Lua files: `/nakama/data/modules/*.lua`
- Entry point: `/nakama/data/modules/index.js`

### Registered RPCs

After successful deployment, the following RPCs are available:

1. **`health_check`** - Health validation endpoint
   ```bash
   curl -X POST http://<service-ip>:7350/v2/rpc/health_check \
     -H "Content-Type: application/json" \
     -d '{}'
   ```

2. **`create_all_leaderboards_persistent`** - Main leaderboard creation RPC
   ```bash
   curl -X POST http://<service-ip>:7350/v2/rpc/create_all_leaderboards_persistent \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer <token>" \
     -d '{}'
   ```

3. **`lb.submit_score`** - Submit leaderboard score (from Lua)

4. **`lb.get`** - Get leaderboard records (from Lua)

## 🔍 Validation

### Automated Validation

The post-deploy validation job automatically checks:

1. ✅ Nakama service is running
2. ✅ Health check RPC is registered
3. ✅ Main leaderboard RPC is registered
4. ✅ REST API endpoints are accessible

Expected logs from validation job:

```
Waiting for Nakama service to be ready...
Testing health_check RPC...
Response: {"status":"ok","timestamp":1234567890,"message":"Nakama runtime is healthy"}
✅ Health check RPC validation successful!
Testing create_all_leaderboards_persistent RPC...
Status code: 401
✅ create_all_leaderboards_persistent RPC is registered!
✅ All RPC validations passed!
```

### Manual Validation

1. **Check Nakama logs**:
   ```bash
   kubectl logs -l app=nakama | grep -i "registered\|loaded"
   ```

   Expected output:
   ```
   [INFO] Nakama TypeScript runtime initialized successfully
   [INFO] Health check RPC registered at: /v2/rpc/health_check
   [INFO] Loaded Lua module: leaderboards.lua
   [INFO] Registered RPC 'lb.submit_score'
   [INFO] Registered RPC 'lb.get'
   [INFO] Registered RPC 'create_all_leaderboards_persistent'
   ```

2. **Verify file structure**:
   ```bash
   kubectl exec -it deployment/nakama -- ls -la /nakama/data/modules/
   ```

   Expected files:
   ```
   index.js
   leaderboard_rpc.js
   leaderboards.lua
   clientrpc.lua
   (and other .lua files)
   ```

3. **Test REST endpoints**:
   ```bash
   # Get service IP
   SERVICE_IP=$(kubectl get svc nakama-service -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
   
   # Test health check
   curl -X POST http://$SERVICE_IP:7350/v2/rpc/health_check
   ```

## 🎯 Production Deployment Checklist

Before deploying to production:

- [ ] **Build and push Docker image to container registry**:
  ```bash
  docker build -t your-registry/intelliverse-nakama:v1.0.0 .
  docker push your-registry/intelliverse-nakama:v1.0.0
  ```

- [ ] **Update image reference** in `k8s/nakama-deployment.yaml` or Helm `values.yaml`

- [ ] **Change default credentials** in `nakama-configmap.yaml`:
  - Console username/password
  - Session encryption key
  - Runtime HTTP key
  - Socket server key

- [ ] **Configure database connection**:
  ```yaml
  database:
    address:
      - "username:password@postgres-host:5432/nakama"
  ```

- [ ] **Set up persistent storage** with appropriate storage class:
  ```yaml
  storageClassName: gp3  # AWS EBS gp3
  size: 100Gi
  ```

- [ ] **Configure resource limits** based on expected load:
  ```yaml
  resources:
    requests:
      memory: "2Gi"
      cpu: "1000m"
    limits:
      memory: "8Gi"
      cpu: "4000m"
  ```

- [ ] **Enable SSL/TLS** using Ingress with cert-manager

- [ ] **Set up monitoring** (Prometheus + Grafana)

- [ ] **Configure backups** for persistent volumes

- [ ] **Test disaster recovery** procedures

- [ ] **Set up logging aggregation** (EFK stack)

- [ ] **Configure autoscaling**:
  ```bash
  kubectl autoscale deployment nakama --min=2 --max=10 --cpu-percent=70
  ```

## 🐛 Troubleshooting

### RPC Not Found Errors

**Symptom**: `{"error":"RPC function not found"}`

**Solutions**:

1. Check module loading:
   ```bash
   kubectl logs deployment/nakama | grep -i "loaded\|registered"
   ```

2. Verify file structure:
   ```bash
   kubectl exec deployment/nakama -- ls -la /nakama/data/modules/
   ```

3. Check configuration:
   ```bash
   kubectl exec deployment/nakama -- cat /nakama/config.yml
   ```

### Pod Crashes / CrashLoopBackOff

**Symptom**: Pod keeps restarting

**Solutions**:

1. Check pod events:
   ```bash
   kubectl describe pod -l app=nakama
   ```

2. View previous logs:
   ```bash
   kubectl logs -l app=nakama --previous
   ```

3. Check PVC status:
   ```bash
   kubectl get pvc nakama-data-pvc
   ```

### TypeScript Compilation Errors

**Symptom**: Docker build fails during TypeScript compilation

**Solutions**:

1. The Dockerfile is designed to continue even with type warnings
2. Check if TypeScript files have syntax errors
3. Verify `data/modules/index.ts` exists
4. Build locally to debug:
   ```bash
   docker build --progress=plain -t intelliverse-nakama:latest .
   ```

## 📊 Monitoring

### Health Checks

The deployment includes:

- **Liveness Probe**: Restarts pod if unhealthy
- **Readiness Probe**: Removes pod from service if not ready

### Metrics

Access Prometheus metrics (if configured):
```bash
curl http://<nakama-service>:9100/metrics
```

### Logs

View aggregated logs:
```bash
kubectl logs -l app=nakama --tail=100 -f
```

## 🔐 Security

### Best Practices

1. **Never use default passwords in production**
2. **Store secrets in Kubernetes Secrets**, not ConfigMaps
3. **Use TLS/SSL** for all external traffic
4. **Implement network policies** to restrict pod communication
5. **Run security scans** on Docker images
6. **Keep Nakama updated** to latest stable version
7. **Use least-privilege RBAC** for service accounts

### Example: Using Secrets

```bash
# Create secrets
kubectl create secret generic nakama-secrets \
  --from-literal=console-password='SecurePassword123!' \
  --from-literal=encryption-key='32-character-encryption-key-here'

# Reference in deployment (modify deployment.yaml):
env:
- name: CONSOLE_PASSWORD
  valueFrom:
    secretKeyRef:
      name: nakama-secrets
      key: console-password
```

## 📚 Additional Documentation

- [Kubernetes Deployment Guide](k8s/README.md)
- [Helm Chart Documentation](helm/nakama-runtime/README.md)
- [Official Nakama Documentation](https://heroiclabs.com/docs)

## 🆘 Support

For help with:
- **Nakama**: [Heroic Labs Forum](https://forum.heroiclabs.com)
- **Kubernetes**: [Kubernetes Slack](https://slack.k8s.io/)
- **AWS EKS**: [AWS Documentation](https://docs.aws.amazon.com/eks/)

## ✅ Success Criteria

Your deployment is successful when:

1. ✅ Docker build completes without errors
2. ✅ All pods are in `Running` state
3. ✅ Validation job passes all checks
4. ✅ Health check RPC returns `{"status":"ok"}`
5. ✅ All expected RPCs are registered
6. ✅ Logs show "TypeScript runtime initialized"
7. ✅ Logs show all Lua modules loaded
8. ✅ No "RPC function not found" errors

## 📝 License

This deployment configuration is provided as-is for use with Nakama server.
See Nakama license for server usage terms.
