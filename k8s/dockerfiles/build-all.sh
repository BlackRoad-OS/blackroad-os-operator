#!/bin/bash

# BlackRoad OS - Docker Image Build Script
# Builds all custom Docker images for K8s deployment

set -e

echo "🐳 BlackRoad OS - Docker Image Builder"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Docker registry (change to your registry)
REGISTRY="${DOCKER_REGISTRY:-blackroad}"
TAG="${DOCKER_TAG:-latest}"

cd "$(dirname "$0")"

# List of images to build
declare -A IMAGES=(
    ["blackroad-os"]="Main BlackRoad OS web server"
    ["mqtt-edge-client"]="MQTT edge device client"
    ["multicloud-orchestrator"]="Multicloud orchestration service"
    ["sqtt-quantum"]="SQTT quantum processor"
    ["edge-agent"]="Edge device agent"
    ["quantum-entanglement"]="Quantum entanglement node"
    ["quantum-teleport"]="Quantum teleportation service"
)

echo -e "${BLUE}📦 Images to build:${NC}"
for image in "${!IMAGES[@]}"; do
    echo "  - $REGISTRY/$image:$TAG - ${IMAGES[$image]}"
done
echo ""

read -p "Continue with build? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
fi

# Build function
build_image() {
    local name=$1
    local description=$2

    echo -e "${GREEN}🔨 Building $name...${NC}"
    echo "   $description"

    if docker build -t $REGISTRY/$name:$TAG -f $name.Dockerfile . 2>&1 | grep -E "(Step|Successfully)"; then
        echo -e "${GREEN}✅ $name built successfully${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠️  $name build had warnings${NC}"
        return 1
    fi
}

# Build all images
SUCCESS_COUNT=0
TOTAL_COUNT=${#IMAGES[@]}

for image in "${!IMAGES[@]}"; do
    echo ""
    if build_image "$image" "${IMAGES[$image]}"; then
        ((SUCCESS_COUNT++))
    fi
done

echo ""
echo -e "${BLUE}======================================"
echo "🎉 Build Complete!"
echo "======================================${NC}"
echo ""
echo -e "${GREEN}✅ Successfully built: $SUCCESS_COUNT/$TOTAL_COUNT images${NC}"
echo ""

# Show images
echo "📦 Built images:"
for image in "${!IMAGES[@]}"; do
    docker images $REGISTRY/$image:$TAG --format "  - {{.Repository}}:{{.Tag}} ({{.Size}})"
done
echo ""

# Ask about pushing to registry
echo -e "${YELLOW}📤 Next steps:${NC}"
echo "1. Test images locally: docker run -p 8080:8080 $REGISTRY/blackroad-os:$TAG"
echo "2. Push to registry: docker push $REGISTRY/<image>:$TAG"
echo "3. Update K8s deployments: kubectl rollout restart deployment/<name>"
echo ""

read -p "Push images to registry now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${GREEN}🚀 Pushing images to registry...${NC}"
    for image in "${!IMAGES[@]}"; do
        echo "  Pushing $REGISTRY/$image:$TAG..."
        docker push $REGISTRY/$image:$TAG || echo "  ⚠️ Push failed for $image"
    done
fi

echo ""
echo -e "${GREEN}✨ All done!${NC}"
echo ""
