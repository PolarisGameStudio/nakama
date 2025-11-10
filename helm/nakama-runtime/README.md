# Nakama Runtime Helm Chart

This Helm chart deploys Nakama with full Lua and TypeScript runtime support on Kubernetes/EKS.

## Prerequisites

- Kubernetes 1.19+
- Helm 3.0+
- Docker image built and available (locally or in a registry)

## Installation

### Quick Start

1. **Build and tag the Docker image**:
   ```bash
   docker build -t intelliverse-nakama:latest .
   ```

2. **Install the chart**:
   ```bash
   helm install nakama ./helm/nakama-runtime
   ```

3. **Check deployment status**:
   ```bash
   kubectl get pods -l app.kubernetes.io/name=nakama-runtime
   ```

### Custom Installation

Install with custom values:

```bash
helm install nakama ./helm/nakama-runtime \
  --set image.repository=your-registry/intelliverse-nakama \
  --set image.tag=v1.0.0 \
  --set replicaCount=3
```

Or use a values file:

```bash
helm install nakama ./helm/nakama-runtime -f custom-values.yaml
```

## Configuration

The following table lists the configurable parameters:

| Parameter | Description | Default |
|-----------|-------------|---------|
| `image.repository` | Nakama image repository | `intelliverse-nakama` |
| `image.tag` | Image tag | `latest` |
| `image.pullPolicy` | Image pull policy | `IfNotPresent` |
| `replicaCount` | Number of replicas | `1` |
| `service.type` | Service type | `LoadBalancer` |
| `service.grpcPort` | gRPC port | `7349` |
| `service.httpPort` | HTTP port | `7350` |
| `service.consolePort` | Console port | `7351` |
| `persistence.enabled` | Enable persistent storage | `true` |
| `persistence.size` | Storage size | `10Gi` |
| `nakama.console.username` | Console username | `admin` |
| `nakama.console.password` | Console password | `password` |
| `validation.enabled` | Enable post-deploy validation | `true` |

### Security Configuration

**Important**: Change default credentials before production deployment!

Create a `production-values.yaml`:

```yaml
nakama:
  console:
    username: "your-admin-username"
    password: "your-secure-password"
  
  session:
    encryptionKey: "your-32-character-encryption-key-here"
  
  runtime:
    httpKey: "your-runtime-http-key"
  
  socket:
    serverKey: "your-socket-server-key"

resources:
  requests:
    memory: "1Gi"
    cpu: "500m"
  limits:
    memory: "4Gi"
    cpu: "2000m"
```

Install with production values:

```bash
helm install nakama ./helm/nakama-runtime -f production-values.yaml
```

## Upgrading

Update the deployment:

```bash
helm upgrade nakama ./helm/nakama-runtime
```

With new values:

```bash
helm upgrade nakama ./helm/nakama-runtime -f production-values.yaml
```

## Uninstallation

Remove the deployment:

```bash
helm uninstall nakama
```

**Note**: This does not delete the PersistentVolumeClaim by default. To delete it:

```bash
kubectl delete pvc nakama-runtime-data
```

## Validation

After installation, check the validation job:

```bash
kubectl logs job/nakama-validation
```

Expected output:
```
✅ Health check RPC validation successful!
✅ create_all_leaderboards_persistent RPC is registered!
✅ All RPC validations passed!
```

## Troubleshooting

### View logs

```bash
kubectl logs -l app.kubernetes.io/name=nakama-runtime
```

### Check pod status

```bash
kubectl describe pod -l app.kubernetes.io/name=nakama-runtime
```

### Access Nakama console

Get the service external IP:

```bash
kubectl get svc nakama-runtime
```

Access console at: `http://<EXTERNAL-IP>:7351`

### Test RPC endpoints

```bash
# Get service IP
SERVICE_IP=$(kubectl get svc nakama-runtime -o jsonpath='{.status.loadBalancer.ingress[0].ip}')

# Test health check
curl -X POST http://$SERVICE_IP:7350/v2/rpc/health_check \
  -H "Content-Type: application/json" \
  -d '{}'
```

## Production Deployment

For production deployments:

1. **Use external database**:
   ```yaml
   nakama:
     database:
       address: "username:password@postgres.example.com:5432/nakama"
   ```

2. **Enable autoscaling**:
   ```yaml
   replicaCount: 2  # Minimum replicas
   
   # Add HPA separately:
   # kubectl autoscale deployment nakama-runtime --min=2 --max=10 --cpu-percent=70
   ```

3. **Configure resource limits**:
   ```yaml
   resources:
     requests:
       memory: "2Gi"
       cpu: "1000m"
     limits:
       memory: "8Gi"
       cpu: "4000m"
   ```

4. **Use proper storage class**:
   ```yaml
   persistence:
     storageClass: "gp3"  # AWS EBS gp3 for better performance
     size: 50Gi
   ```

5. **Enable monitoring** (requires Prometheus operator):
   ```yaml
   # Add ServiceMonitor for Prometheus
   ```

## AWS EKS Specific Configuration

For AWS EKS deployments:

```yaml
# Use AWS Load Balancer Controller annotations
service:
  type: LoadBalancer
  annotations:
    service.beta.kubernetes.io/aws-load-balancer-type: "nlb"
    service.beta.kubernetes.io/aws-load-balancer-cross-zone-load-balancing-enabled: "true"

persistence:
  storageClass: "gp3"
```

## Examples

### Development Setup

```yaml
# dev-values.yaml
replicaCount: 1
persistence:
  size: 5Gi
resources:
  requests:
    memory: "256Mi"
    cpu: "100m"
nakama:
  logger:
    level: "DEBUG"
```

```bash
helm install nakama ./helm/nakama-runtime -f dev-values.yaml
```

### Production Setup

```yaml
# prod-values.yaml
replicaCount: 3
persistence:
  storageClass: "gp3"
  size: 100Gi
resources:
  requests:
    memory: "2Gi"
    cpu: "1000m"
  limits:
    memory: "8Gi"
    cpu: "4000m"
nakama:
  logger:
    level: "INFO"
  console:
    username: "prodadmin"
    password: "SuperSecurePassword123!"
  session:
    encryptionKey: "prod-encryption-key-32-chars!!"
```

```bash
helm install nakama ./helm/nakama-runtime -f prod-values.yaml --namespace production
```

## Support

- [Nakama Documentation](https://heroiclabs.com/docs)
- [Helm Documentation](https://helm.sh/docs/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
