# 🚀 Nakama EKS Deployment - Quick Reference

## Deployment Methods

### Method 1: Kubernetes Manifests (Recommended for Quick Start)

```bash
# Build Docker image
docker build -t intelliverse-nakama:latest .

# Deploy to EKS
kubectl apply -f k8s/nakama-all-in-one.yaml

# Verify
kubectl get pods -l app=nakama
kubectl logs -f deployment/nakama

# Validate RPCs
kubectl apply -f k8s/post-deploy-validation-job.yaml
kubectl logs job/nakama-rpc-validation
```

### Method 2: Helm Chart (Recommended for Production)

```bash
# Build Docker image
docker build -t intelliverse-nakama:latest .

# Install with Helm
helm install nakama ./helm/nakama-runtime

# Or with custom values
helm install nakama ./helm/nakama-runtime -f my-values.yaml

# Check status
helm status nakama
kubectl get all -l app.kubernetes.io/name=nakama-runtime
```

## Test RPC Endpoints

```bash
# Get service IP
SERVICE_IP=$(kubectl get svc nakama-service -o jsonpath='{.status.loadBalancer.ingress[0].ip}')

# Test health check
curl -X POST http://$SERVICE_IP:7350/v2/rpc/health_check

# Expected response:
# {"status":"ok","timestamp":1234567890,"message":"Nakama runtime is healthy"}
```

## Validation

```bash
# Run local validation
./validate-deployment.sh

# Check deployed logs
kubectl logs -l app=nakama | grep -i "registered\|loaded"

# Expected:
# [INFO] Nakama TypeScript runtime initialized successfully
# [INFO] Health check RPC registered at: /v2/rpc/health_check
# [INFO] Registered RPC 'create_all_leaderboards_persistent'
```

## Production Checklist

Before production deployment:

1. **Update Credentials**
   ```yaml
   # In k8s/nakama-configmap.yaml or helm values.yaml
   console:
     username: "your-admin"
     password: "SecurePassword123!"
   session:
     encryptionKey: "32-character-key-here"
   ```

2. **Push to Registry**
   ```bash
   docker tag intelliverse-nakama:latest YOUR_REGISTRY/nakama:v1.0.0
   docker push YOUR_REGISTRY/nakama:v1.0.0
   ```

3. **Update Image Reference**
   ```yaml
   # In deployment.yaml or values.yaml
   image:
     repository: YOUR_REGISTRY/nakama
     tag: v1.0.0
   ```

4. **Configure Database**
   ```yaml
   database:
     address:
       - "user:pass@postgres-host:5432/nakama"
   ```

5. **Deploy**
   ```bash
   kubectl apply -f k8s/
   # or
   helm install nakama ./helm/nakama-runtime -f prod-values.yaml
   ```

## Troubleshooting

### RPC Not Found
```bash
# Check logs
kubectl logs deployment/nakama | grep -i error

# Verify modules
kubectl exec deployment/nakama -- ls -la /nakama/data/modules/

# Check config
kubectl exec deployment/nakama -- cat /nakama/config.yml
```

### Pod Crashes
```bash
# Describe pod
kubectl describe pod -l app=nakama

# Check previous logs
kubectl logs -l app=nakama --previous

# Verify PVC
kubectl get pvc nakama-data-pvc
```

## Documentation

- **Main Guide**: `EKS_DEPLOYMENT_GUIDE.md`
- **K8s Guide**: `k8s/README.md`
- **Helm Guide**: `helm/nakama-runtime/README.md`
- **Implementation**: `DEPLOYMENT_IMPLEMENTATION_COMPLETE.md`

## Support

- [Nakama Docs](https://heroiclabs.com/docs)
- [Heroic Labs Forum](https://forum.heroiclabs.com)
- [Kubernetes Docs](https://kubernetes.io/docs/)
