#!/bin/bash
# BlackRoad OS - SDK Generation Script
# Generates Python and TypeScript SDKs from OpenAPI specs
#
# @blackroad_name: SDK Generator
# @operator: alexa.operator.v1

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
OPENAPI_DIR="$ROOT_DIR/integrations/api-architecture/openapi"

echo "=========================================="
echo "BlackRoad OS SDK Generator"
echo "=========================================="

# Check for required tools
check_tools() {
    echo "Checking required tools..."

    if ! command -v python3 &> /dev/null; then
        echo "Error: python3 is required"
        exit 1
    fi

    if ! command -v npm &> /dev/null; then
        echo "Error: npm is required"
        exit 1
    fi

    echo "✓ All required tools found"
}

# Generate Python SDK
generate_python() {
    echo ""
    echo "Generating Python SDK..."
    echo "----------------------------------------"

    cd "$SCRIPT_DIR/python"

    # Install generator if needed
    pip install datamodel-code-generator openapi-python-client 2>/dev/null || true

    # Generate from each OpenAPI spec
    for spec in "$OPENAPI_DIR"/*.yaml; do
        if [ -f "$spec" ]; then
            name=$(basename "$spec" .yaml | sed 's/-/_/g')
            echo "  → Processing: $(basename "$spec")"

            # Generate Pydantic models
            datamodel-codegen \
                --input "$spec" \
                --output "blackroad/models/${name}.py" \
                --output-model-type pydantic_v2.BaseModel \
                --use-standard-collections \
                --use-union-operator \
                --target-python-version 3.11 \
                2>/dev/null || echo "    (skipped - may need manual review)"
        fi
    done

    echo "✓ Python SDK generated"
}

# Generate TypeScript SDK
generate_typescript() {
    echo ""
    echo "Generating TypeScript SDK..."
    echo "----------------------------------------"

    cd "$SCRIPT_DIR/typescript"

    # Install generator if needed
    npm install openapi-typescript 2>/dev/null || true

    # Generate from each OpenAPI spec
    for spec in "$OPENAPI_DIR"/*.yaml; do
        if [ -f "$spec" ]; then
            name=$(basename "$spec" .yaml)
            echo "  → Processing: $(basename "$spec")"

            npx openapi-typescript "$spec" -o "src/types/${name}.ts" 2>/dev/null || \
                echo "    (skipped - may need manual review)"
        fi
    done

    echo "✓ TypeScript SDK generated"
}

# Main
main() {
    check_tools

    case "${1:-all}" in
        python)
            generate_python
            ;;
        typescript|ts)
            generate_typescript
            ;;
        all)
            generate_python
            generate_typescript
            ;;
        *)
            echo "Usage: $0 [python|typescript|all]"
            exit 1
            ;;
    esac

    echo ""
    echo "=========================================="
    echo "SDK generation complete!"
    echo "=========================================="
}

main "$@"
