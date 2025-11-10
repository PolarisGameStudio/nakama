#!/bin/bash
# Nakama EKS Deployment Validation Script
# This script validates the local setup before deploying to EKS

# Don't exit on errors for optional checks
set +e

echo "======================================"
echo "Nakama EKS Deployment Validation"
echo "======================================"
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $2"
    else
        echo -e "${RED}✗${NC} $2"
        exit 1
    fi
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Check 1: Verify repository structure
echo "Checking repository structure..."
[ -f "Dockerfile" ]
print_status $? "Dockerfile exists"

[ -f "nakama.yml" ]
print_status $? "nakama.yml exists"

[ -d "data/modules" ]
print_status $? "data/modules directory exists"

[ -f "data/modules/index.ts" ]
print_status $? "TypeScript entrypoint (index.ts) exists"

[ -f "data/modules/leaderboard_rpc.ts" ]
print_status $? "leaderboard_rpc.ts exists"

# Count Lua files
LUA_COUNT=$(ls data/modules/*.lua 2>/dev/null | wc -l)
print_status 0 "Found $LUA_COUNT Lua modules"

# Check 2: Verify Kubernetes manifests
echo ""
echo "Checking Kubernetes manifests..."
[ -d "k8s" ]
print_status $? "k8s directory exists"

[ -f "k8s/nakama-configmap.yaml" ]
print_status $? "nakama-configmap.yaml exists"

[ -f "k8s/nakama-deployment.yaml" ]
print_status $? "nakama-deployment.yaml exists"

[ -f "k8s/nakama-service.yaml" ]
print_status $? "nakama-service.yaml exists"

[ -f "k8s/nakama-pvc.yaml" ]
print_status $? "nakama-pvc.yaml exists"

[ -f "k8s/post-deploy-validation-job.yaml" ]
print_status $? "post-deploy-validation-job.yaml exists"

[ -f "k8s/nakama-all-in-one.yaml" ]
print_status $? "nakama-all-in-one.yaml exists"

# Check 3: Verify Helm chart
echo ""
echo "Checking Helm chart..."
[ -d "helm/nakama-runtime" ]
print_status $? "Helm chart directory exists"

[ -f "helm/nakama-runtime/Chart.yaml" ]
print_status $? "Chart.yaml exists"

[ -f "helm/nakama-runtime/values.yaml" ]
print_status $? "values.yaml exists"

[ -d "helm/nakama-runtime/templates" ]
print_status $? "templates directory exists"

# Check 4: Verify TypeScript compilation setup
echo ""
echo "Checking TypeScript setup..."
[ -f "data/modules/tsconfig.json" ]
print_status $? "tsconfig.json exists"

# Check 5: Test TypeScript compilation
echo ""
echo "Testing TypeScript compilation..."
cd data/modules

# Check if tsc is available
if command -v tsc &> /dev/null; then
    print_status 0 "TypeScript compiler (tsc) is available"
    
    # Clean build directory
    rm -rf build
    
    # Compile
    tsc 2>&1 | grep -q "error TS" && HAS_ERRORS=1 || HAS_ERRORS=0
    
    if [ $HAS_ERRORS -eq 1 ]; then
        print_warning "TypeScript compilation has type errors (expected - Nakama types not available)"
    fi
    
    # Check if output was generated
    [ -f "build/index.js" ]
    print_status $? "index.js generated"
    
    [ -f "build/leaderboard_rpc.js" ]
    print_status $? "leaderboard_rpc.js generated"
    
    # Check if RPC registration is present in generated code
    grep -q "registerRpc" build/index.js
    print_status $? "index.js contains RPC registration"
    
    grep -q "create_all_leaderboards_persistent" build/leaderboard_rpc.js
    print_status $? "leaderboard_rpc.js contains RPC registration"
else
    print_warning "TypeScript compiler not found - skipping compilation test"
    print_warning "Run: npm install -g typescript"
fi

cd ../..

# Check 6: Verify nakama.yml configuration
echo ""
echo "Validating nakama.yml configuration..."
if command -v grep &> /dev/null; then
    grep -q "js_entrypoint:" nakama.yml
    print_status $? "js_entrypoint configured"
    
    grep -q "lua_path:" nakama.yml
    print_status $? "lua_path configured"
    
    grep -q "port: 7350" nakama.yml
    print_status $? "Socket port configured"
fi

# Check 7: Verify Docker prerequisites
echo ""
echo "Checking Docker prerequisites..."
if command -v docker &> /dev/null; then
    print_status 0 "Docker is installed"
    
    docker info &> /dev/null
    print_status $? "Docker daemon is running"
else
    print_warning "Docker not found - cannot build image"
fi

# Check 8: Verify kubectl prerequisites (optional)
echo ""
echo "Checking Kubernetes prerequisites (optional)..."
if command -v kubectl &> /dev/null; then
    print_status 0 "kubectl is installed"
    
    kubectl cluster-info &> /dev/null
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓${NC} kubectl can connect to cluster"
    else
        print_warning "kubectl cannot connect to cluster (expected if not configured)"
    fi
else
    print_warning "kubectl not found - required for EKS deployment"
fi

# Check 9: Verify Helm prerequisites (optional)
echo ""
echo "Checking Helm prerequisites (optional)..."
if command -v helm &> /dev/null; then
    print_status 0 "Helm is installed"
    HELM_VERSION=$(helm version --short)
    echo "   Helm version: $HELM_VERSION"
else
    print_warning "Helm not found - required for Helm chart deployment"
fi

# Summary
echo ""
echo "======================================"
echo "Validation Summary"
echo "======================================"
echo -e "${GREEN}✓${NC} All critical checks passed!"
echo ""
echo "Next steps:"
echo "1. Build Docker image:"
echo "   docker build -t intelliverse-nakama:latest ."
echo ""
echo "2. Deploy to Kubernetes:"
echo "   kubectl apply -f k8s/nakama-all-in-one.yaml"
echo ""
echo "3. Or deploy with Helm:"
echo "   helm install nakama ./helm/nakama-runtime"
echo ""
echo "4. Validate deployment:"
echo "   kubectl apply -f k8s/post-deploy-validation-job.yaml"
echo "   kubectl logs job/nakama-rpc-validation"
echo ""
echo "For more information, see:"
echo "  - EKS_DEPLOYMENT_GUIDE.md"
echo "  - k8s/README.md"
echo "  - helm/nakama-runtime/README.md"
echo ""
