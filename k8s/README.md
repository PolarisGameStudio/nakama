# Nakama Kubernetes Deployment Guide for AWS EKS

This directory contains Kubernetes manifests for deploying Nakama on AWS EKS with full runtime module support (Lua + TypeScript).

## 📁 Files Overview

- `nakama-configmap.yaml` - ConfigMap containing nakama.yml configuration
- `nakama-pvc.yaml` - PersistentVolumeClaim for data storage
- `nakama-deployment.yaml` - Nakama deployment with health checks
- `nakama-service.yaml` - LoadBalancer service exposing Nakama
- `post-deploy-validation-job.yaml` - Job to validate RPC registration

## 🚀 Quick Start

### Prerequisites

1. AWS EKS cluster running
2. `kubectl` configured to access your EKS cluster
3. Docker image built and pushed to registry:
   ```bash
   docker build -t intelliverse-nakama:latest .
   # Tag and push to your registry (ECR, Docker Hub, etc.)
   docker tag intelliverse-nakama:latest YOUR_REGISTRY/intelliverse-nakama:latest
   docker push YOUR_REGISTRY/intelliverse-nakama:latest
   ```
4. Update the image in `nakama-deployment.yaml` if using a remote registry

### Deploy to EKS

1. **Create namespace (optional)**:
   ```bash
   kubectl create namespace nakama
   ```

2. **Apply all manifests**:
   ```bash
   # If using default namespace:
   kubectl apply -f k8s/

   # If using custom namespace:
   kubectl apply -f k8s/ -n nakama
   ```

3. **Check deployment status**:
   ```bash
   kubectl get pods -l app=nakama
   kubectl logs -f deployment/nakama
   ```

4. **Run validation job**:
   ```bash
   kubectl apply -f k8s/post-deploy-validation-job.yaml
   kubectl logs job/nakama-rpc-validation
   ```

### Expected Logs

When Nakama starts successfully, you should see:

```
[INFO] Nakama TypeScript runtime initialized successfully
[INFO] Health check RPC registered at: /v2/rpc/health_check
[INFO] Loaded Lua module: leaderboards.lua
[INFO] Registered RPC 'lb.submit_score'
[INFO] Registered RPC 'lb.get'
[INFO] Registered RPC 'create_all_leaderboards_persistent'
```

### Verify RPC Registration

```bash
# Get the LoadBalancer IP/hostname
kubectl get svc nakama-service

# Test health check RPC (replace LOAD_BALANCER_IP)
curl -X POST http://LOAD_BALANCER_IP:7350/v2/rpc/health_check \
  -H "Content-Type: application/json" \
  -d '{}'

# Expected response:
# {"status":"ok","timestamp":1234567890,"message":"Nakama runtime is healthy"}
```

## 🔧 Configuration

### Runtime Paths

The configuration in `nakama-configmap.yaml` sets:

```yaml
runtime:
  path: "/nakama/data/modules"
  js_entrypoint: "index.js"
  lua_path: "/nakama/data/modules"
```

These paths match the Dockerfile structure:
- JavaScript files: `/nakama/data/modules/*.js`
- Lua files: `/nakama/data/modules/*.lua`
- Entry point: `/nakama/data/modules/index.js`

### Volume Mounts

The deployment mounts:
1. **ConfigMap** → `/nakama/config.yml` (read-only)
2. **PersistentVolume** → `/nakama/data` (for runtime data)
3. **EmptyDir** → `/nakama/logs` (for log files)

### Database Configuration

By default, the configuration expects CockroachDB at `cockroachdb:26257`. To use a different database:

1. Edit `nakama-configmap.yaml`:
   ```yaml
   database:
     address:
       - "username:password@postgres-host:5432/nakama"
   ```

2. Apply the changes:
   ```bash
   kubectl apply -f k8s/nakama-configmap.yaml
   kubectl rollout restart deployment/nakama
   ```

## 📊 Health Checks

The deployment includes:

1. **Liveness Probe**: Checks if Nakama is running
   - Path: `/`
   - Port: `7350`
   - Initial delay: 30s

2. **Readiness Probe**: Checks if Nakama is ready for traffic
   - Path: `/`
   - Port: `7350`
   - Initial delay: 20s

## 🔍 Troubleshooting

### RPC Not Found Errors

If you see "RPC function not found" errors:

1. **Check module loading**:
   ```bash
   kubectl logs deployment/nakama | grep -i "loaded\|registered"
   ```

2. **Verify file structure inside container**:
   ```bash
   kubectl exec -it deployment/nakama -- ls -la /nakama/data/modules/
   ```

3. **Check config**:
   ```bash
   kubectl exec -it deployment/nakama -- cat /nakama/config.yml
   ```

### Pod Crashes

1. **Check pod events**:
   ```bash
   kubectl describe pod -l app=nakama
   ```

2. **Check logs**:
   ```bash
   kubectl logs -l app=nakama --previous
   ```

3. **Verify PVC is bound**:
   ```bash
   kubectl get pvc nakama-data-pvc
   ```

### Performance Issues

Adjust resources in `nakama-deployment.yaml`:

```yaml
resources:
  requests:
    memory: "1Gi"    # Increase if needed
    cpu: "500m"
  limits:
    memory: "4Gi"
    cpu: "2000m"
```

## 🔐 Security Best Practices

### 1. Update Default Credentials

Edit `nakama-configmap.yaml` and change:

```yaml
console:
  username: "admin"
  password: "CHANGE_THIS_PASSWORD"

session:
  encryption_key: "CHANGE_THIS_32_CHAR_KEY_STRING"

runtime:
  http_key: "CHANGE_THIS_HTTP_KEY"

socket:
  server_key: "CHANGE_THIS_SERVER_KEY"
```

### 2. Use Kubernetes Secrets

Instead of storing sensitive data in ConfigMap:

```bash
kubectl create secret generic nakama-secrets \
  --from-literal=console-password='your-secure-password' \
  --from-literal=encryption-key='your-32-char-key'
```

Update deployment to use secrets as environment variables.

### 3. Network Policies

Restrict access to Nakama:

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: nakama-network-policy
spec:
  podSelector:
    matchLabels:
      app: nakama
  policyTypes:
  - Ingress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          access: nakama
    ports:
    - protocol: TCP
      port: 7350
```

## 📈 Scaling

### Horizontal Scaling

Increase replicas:

```bash
kubectl scale deployment nakama --replicas=3
```

Or edit `nakama-deployment.yaml`:

```yaml
spec:
  replicas: 3
```

**Note**: Ensure your database can handle multiple connections.

### Autoscaling

Create HPA (Horizontal Pod Autoscaler):

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: nakama-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: nakama
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

## 🎯 Production Checklist

- [ ] Change all default passwords and keys
- [ ] Use Kubernetes Secrets for sensitive data
- [ ] Configure proper resource limits
- [ ] Set up monitoring (Prometheus + Grafana)
- [ ] Configure backup for PersistentVolume
- [ ] Enable SSL/TLS (use Ingress with cert-manager)
- [ ] Set up logging aggregation (EFK stack)
- [ ] Configure network policies
- [ ] Test disaster recovery procedures
- [ ] Set up alerting for failed health checks

## 📚 Additional Resources

- [Nakama Documentation](https://heroiclabs.com/docs)
- [AWS EKS Best Practices](https://aws.github.io/aws-eks-best-practices/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)

## 🆘 Support

For issues related to:
- **Nakama**: [Heroic Labs Forum](https://forum.heroiclabs.com)
- **Kubernetes**: [Kubernetes Slack](https://slack.k8s.io/)
- **AWS EKS**: [AWS Support](https://aws.amazon.com/support/)
