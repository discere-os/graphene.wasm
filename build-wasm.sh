#!/bin/bash
# GrapheneWASM Build Script - Production Implementation
# Implements dual-build strategy: Foundation + WASM-native SIMD
# Copyright 2025 Superstruct Ltd, New Zealand - Licensed under MIT

set -euo pipefail

# Build configuration
BUILD_DIR="build"
INSTALL_DIR="$(pwd)/dist"
FOUNDATION_BUILD="build-foundation"
SIMD_BUILD="build-simd"

echo "🔧 Building graphene.wasm - Graphics Mathematics Library"

# Clean previous builds
rm -rf "$BUILD_DIR" "$INSTALL_DIR" "$FOUNDATION_BUILD" "$SIMD_BUILD"

# Ensure we have EMSDK
if ! command -v emcc &> /dev/null; then
    echo "❌ Emscripten not found. Please install and activate EMSDK."
    exit 1
fi

echo "📦 Emscripten version: $(emcc --version | head -n1)"

# === FOUNDATION BUILD (Ecosystem Integration) ===
echo "🏗️  Building Foundation version (ecosystem integration)..."

emcmake meson setup "$FOUNDATION_BUILD" \
  --prefix="$INSTALL_DIR/foundation" \
  --libdir=lib \
  --includedir=include \
  -Dgobject_types=false \
  -Dintrospection=false \
  -Dtests=false \
  -Dgtk_doc=false \
  -Dsse2=false \
  -Darm_neon=false \
  -Dgcc_vector=false \
  -Dbuildtype=release

echo "🔨 Compiling foundation build..."
meson compile -C "$FOUNDATION_BUILD"

echo "📦 Installing foundation build..."
meson install -C "$FOUNDATION_BUILD"

# === WASM-NATIVE SIMD BUILD (Performance Optimized) ===
echo "🚀 Building WASM-native SIMD version (performance optimized)..."

emcmake meson setup "$SIMD_BUILD" \
  --cross-file=wasm-cross.ini \
  --prefix="$INSTALL_DIR/simd" \
  --libdir=lib \
  --includedir=include \
  -Dgobject_types=false \
  -Dintrospection=false \
  -Dtests=false \
  -Dgtk_doc=false \
  -Dsse2=false \
  -Darm_neon=false \
  -Dgcc_vector=true \
  -Dbuildtype=release

echo "🔨 Compiling SIMD build..."
meson compile -C "$SIMD_BUILD"

echo "📦 Installing SIMD build..."
meson install -C "$SIMD_BUILD"

# === CREATE WASM MODULE ===
echo "🌐 Creating WASM module..."

# Create source directories
mkdir -p src/wasm
mkdir -p test

# WASM module wrapper
cat > src/wasm/graphene_wasm_module.c << 'EOF'
/**
 * Graphene.wasm - WASM Module Wrapper
 * High-performance 3D mathematics library for WebAssembly
 * 
 * Copyright 2025 Superstruct Ltd, New Zealand
 * Licensed under MIT License (same as graphene)
 */

#include <graphene.h>
#include <emscripten.h>

// Export key graphene functions for JavaScript access
EMSCRIPTEN_KEEPALIVE
void graphene_wasm_init(void) {
    // Initialize any required global state
}

// Matrix operations
EMSCRIPTEN_KEEPALIVE 
void graphene_matrix_multiply_wasm(const graphene_matrix_t* a, 
                                   const graphene_matrix_t* b, 
                                   graphene_matrix_t* result) {
    graphene_matrix_multiply(a, b, result);
}

// Vector operations
EMSCRIPTEN_KEEPALIVE
float graphene_vec3_dot_wasm(const graphene_vec3_t* a, const graphene_vec3_t* b) {
    return graphene_vec3_dot(a, b);
}

EMSCRIPTEN_KEEPALIVE
void graphene_vec3_cross_wasm(const graphene_vec3_t* a, 
                              const graphene_vec3_t* b,
                              graphene_vec3_t* result) {
    graphene_vec3_cross(a, b, result);
}

// Quaternion operations  
EMSCRIPTEN_KEEPALIVE
void graphene_quaternion_slerp_wasm(const graphene_quaternion_t* a,
                                    const graphene_quaternion_t* b,
                                    float factor,
                                    graphene_quaternion_t* result) {
    graphene_quaternion_slerp(a, b, factor, result);
}

// Memory management helpers
EMSCRIPTEN_KEEPALIVE
graphene_matrix_t* graphene_matrix_alloc_wasm(void) {
    return graphene_matrix_alloc();
}

EMSCRIPTEN_KEEPALIVE
void graphene_matrix_free_wasm(graphene_matrix_t* matrix) {
    graphene_matrix_free(matrix);
}

EMSCRIPTEN_KEEPALIVE
graphene_vec3_t* graphene_vec3_alloc_wasm(void) {
    return graphene_vec3_alloc();  
}

EMSCRIPTEN_KEEPALIVE
void graphene_vec3_free_wasm(graphene_vec3_t* vec) {
    graphene_vec3_free(vec);
}
EOF

echo "🔧 Compiling WASM module..."

# Determine which build to use for module creation
GRAPHENE_LIB="$INSTALL_DIR/simd/lib/libgraphene-1.0.a"
GRAPHENE_INCLUDE="$INSTALL_DIR/simd/include/graphene-1.0"

if [ ! -f "$GRAPHENE_LIB" ]; then
    echo "⚠️  SIMD build not available, using foundation build"
    GRAPHENE_LIB="$INSTALL_DIR/foundation/lib/libgraphene-1.0.a"  
    GRAPHENE_INCLUDE="$INSTALL_DIR/foundation/include/graphene-1.0"
fi

# Compile WASM module
emcc \
  -I"$GRAPHENE_INCLUDE" \
  -L"$(dirname "$GRAPHENE_LIB")" \
  -lgraphene-1.0 \
  -lm \
  src/wasm/graphene_wasm_module.c \
  -o "$INSTALL_DIR/graphene.js" \
  -s WASM=1 \
  -s MODULARIZE=1 \
  -s EXPORT_ES6=1 \
  -s INITIAL_MEMORY=64MB \
  -s MAXIMUM_MEMORY=512MB \
  -s ALLOW_MEMORY_GROWTH=1 \
  -s EXPORTED_FUNCTIONS='["_graphene_wasm_init","_graphene_matrix_multiply_wasm","_graphene_vec3_dot_wasm","_graphene_vec3_cross_wasm","_graphene_quaternion_slerp_wasm","_graphene_matrix_alloc_wasm","_graphene_matrix_free_wasm","_graphene_vec3_alloc_wasm","_graphene_vec3_free_wasm","_malloc","_free"]' \
  -s EXPORTED_RUNTIME_METHODS='["ccall","cwrap","HEAPU8"]' \
  -O3 \
  -flto \
  --closure 1

echo "✅ Build complete!"

# Validate outputs
echo "📊 Build results:"
echo "Foundation library: $(ls -lh "$INSTALL_DIR/foundation/lib/"libgraphene-1.0.* 2>/dev/null | head -1 || echo "Not found")"
echo "SIMD library: $(ls -lh "$INSTALL_DIR/simd/lib/"libgraphene-1.0.* 2>/dev/null | head -1 || echo "Not found")"
echo "WASM module: $(ls -lh "$INSTALL_DIR"/graphene.{js,wasm} 2>/dev/null || echo "Not found")"

if [ -f "$INSTALL_DIR/graphene.wasm" ]; then
    echo "📏 WASM module size: $(stat -c%s "$INSTALL_DIR/graphene.wasm" | numfmt --to=iec)B"
    echo "🎉 graphene.wasm build successful!"
else
    echo "❌ WASM module creation failed"
    exit 1
fi