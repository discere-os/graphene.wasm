/**
 * Graphene.wasm Basic Tests
 * Tests core 3D mathematics operations for WebAssembly implementation
 * 
 * Copyright 2025 Superstruct Ltd, New Zealand
 * Licensed under MIT (same as graphene)
 */

import GrapheneModule from '../dist/graphene.js';

// Test configuration
const EPSILON = 1e-6;
let Module;

function assertApproximatelyEqual(actual, expected, message) {
    if (Math.abs(actual - expected) > EPSILON) {
        throw new Error(`${message}: expected ${expected}, got ${actual}`);
    }
}

function assertVectorsEqual(v1, v2, message) {
    assertApproximatelyEqual(v1.x, v2.x, `${message} (x component)`);
    assertApproximatelyEqual(v1.y, v2.y, `${message} (y component)`);  
    assertApproximatelyEqual(v1.z, v2.z, `${message} (z component)`);
}

async function initializeModule() {
    console.log('🔧 Initializing graphene.wasm module...');
    Module = await GrapheneModule();
    Module._graphene_wasm_init();
    console.log('✅ Module initialized');
}

function testBasicVector3Operations() {
    console.log('🧮 Testing basic vector3 operations...');
    
    // Test dot product
    const vec1 = Module._graphene_vec3_alloc_wasm();
    const vec2 = Module._graphene_vec3_alloc_wasm();
    
    // Set test vectors: (1,0,0) and (0,1,0)
    Module._graphene_vec3_init(vec1, 1.0, 0.0, 0.0);
    Module._graphene_vec3_init(vec2, 0.0, 1.0, 0.0);
    
    // Dot product should be 0 (perpendicular vectors)
    const dotProduct = Module._graphene_vec3_dot_wasm(vec1, vec2);
    assertApproximatelyEqual(dotProduct, 0.0, 'Vector dot product test');
    
    // Test cross product
    const crossResult = Module._graphene_vec3_alloc_wasm();
    Module._graphene_vec3_cross_wasm(vec1, vec2, crossResult);
    
    // Cross product of (1,0,0) × (0,1,0) = (0,0,1)
    const x = Module._graphene_vec3_get_x(crossResult);
    const y = Module._graphene_vec3_get_y(crossResult);
    const z = Module._graphene_vec3_get_z(crossResult);
    
    assertApproximatelyEqual(x, 0.0, 'Cross product X');
    assertApproximatelyEqual(y, 0.0, 'Cross product Y');
    assertApproximatelyEqual(z, 1.0, 'Cross product Z');
    
    // Cleanup
    Module._graphene_vec3_free_wasm(vec1);
    Module._graphene_vec3_free_wasm(vec2);
    Module._graphene_vec3_free_wasm(crossResult);
    
    console.log('✅ Vector3 operations test passed');
}

function testMatrixOperations() {
    console.log('🧮 Testing matrix operations...');
    
    // Allocate matrices
    const identity = Module._graphene_matrix_alloc_wasm();
    const transform = Module._graphene_matrix_alloc_wasm();
    const result = Module._graphene_matrix_alloc_wasm();
    
    // Initialize identity matrix
    Module._graphene_matrix_init_identity(identity);
    
    // Create a simple translation matrix
    Module._graphene_matrix_init_translate(transform, 10.0, 20.0, 30.0);
    
    // Multiply identity * transform = transform
    Module._graphene_matrix_multiply_wasm(identity, transform, result);
    
    // Extract translation components
    const translation = Module._graphene_vec3_alloc_wasm();
    Module._graphene_matrix_get_translation(result, translation);
    
    const tx = Module._graphene_vec3_get_x(translation);
    const ty = Module._graphene_vec3_get_y(translation);
    const tz = Module._graphene_vec3_get_z(translation);
    
    assertApproximatelyEqual(tx, 10.0, 'Matrix translation X');
    assertApproximatelyEqual(ty, 20.0, 'Matrix translation Y');
    assertApproximatelyEqual(tz, 30.0, 'Matrix translation Z');
    
    // Cleanup
    Module._graphene_matrix_free_wasm(identity);
    Module._graphene_matrix_free_wasm(transform);
    Module._graphene_matrix_free_wasm(result);
    Module._graphene_vec3_free_wasm(translation);
    
    console.log('✅ Matrix operations test passed');
}

function testQuaternionOperations() {
    console.log('🧮 Testing quaternion operations...');
    
    // Test quaternion SLERP (Spherical Linear Interpolation)
    const q1 = Module._graphene_quaternion_alloc();
    const q2 = Module._graphene_quaternion_alloc(); 
    const result = Module._graphene_quaternion_alloc();
    
    // Initialize quaternions (identity and 90-degree rotation around Z)
    Module._graphene_quaternion_init_identity(q1);
    Module._graphene_quaternion_init_from_angle_vec3(q2, 90.0, 0.0, 0.0, 1.0);
    
    // Interpolate halfway
    Module._graphene_quaternion_slerp_wasm(q1, q2, 0.5, result);
    
    // Verify the result is valid (quaternion length should be 1)
    const length = Module._graphene_quaternion_length(result);
    assertApproximatelyEqual(length, 1.0, 'Quaternion SLERP length');
    
    // Cleanup
    Module._graphene_quaternion_free(q1);
    Module._graphene_quaternion_free(q2);
    Module._graphene_quaternion_free(result);
    
    console.log('✅ Quaternion operations test passed');
}

function performanceTest() {
    console.log('⚡ Running performance tests...');
    
    const iterations = 100000;
    
    // Matrix multiplication performance
    const m1 = Module._graphene_matrix_alloc_wasm();
    const m2 = Module._graphene_matrix_alloc_wasm();
    const result = Module._graphene_matrix_alloc_wasm();
    
    Module._graphene_matrix_init_identity(m1);
    Module._graphene_matrix_init_scale(m2, 2.0, 2.0, 2.0);
    
    console.log(`🔢 Testing ${iterations} matrix multiplications...`);
    
    const start = performance.now();
    for (let i = 0; i < iterations; i++) {
        Module._graphene_matrix_multiply_wasm(m1, m2, result);
    }
    const end = performance.now();
    
    const duration = end - start;
    const ops_per_second = iterations / (duration / 1000);
    
    console.log(`⏱️  Duration: ${duration.toFixed(2)}ms`);
    console.log(`🚀 Performance: ${(ops_per_second / 1000).toFixed(0)}K matrix multiplications/second`);
    
    // Cleanup
    Module._graphene_matrix_free_wasm(m1);
    Module._graphene_matrix_free_wasm(m2);
    Module._graphene_matrix_free_wasm(result);
    
    // Performance should be reasonable
    if (ops_per_second < 10000) {
        console.warn('⚠️  Performance may be below expected levels');
    } else {
        console.log('✅ Performance test passed');
    }
}

function memoryTest() {
    console.log('💾 Testing memory management...');
    
    const initialMemory = Module.HEAPU8.length;
    const allocations = [];
    
    // Allocate and free many objects
    for (let i = 0; i < 1000; i++) {
        const matrix = Module._graphene_matrix_alloc_wasm();
        const vec = Module._graphene_vec3_alloc_wasm();
        allocations.push({ matrix, vec });
    }
    
    // Free all allocations
    for (const { matrix, vec } of allocations) {
        Module._graphene_matrix_free_wasm(matrix);
        Module._graphene_vec3_free_wasm(vec);
    }
    
    const finalMemory = Module.HEAPU8.length;
    const memoryGrowth = ((finalMemory - initialMemory) / initialMemory) * 100;
    
    console.log(`📊 Memory growth: ${memoryGrowth.toFixed(2)}%`);
    
    if (memoryGrowth > 50) {
        console.warn('⚠️  Significant memory growth detected');
    } else {
        console.log('✅ Memory management test passed');
    }
}

async function runAllTests() {
    try {
        await initializeModule();
        
        console.log('\n🧪 === Graphene.wasm Test Suite ===\n');
        
        testBasicVector3Operations();
        testMatrixOperations();
        testQuaternionOperations();
        performanceTest();
        memoryTest();
        
        console.log('\n🎉 === All tests passed! ===');
        console.log('📦 graphene.wasm is working correctly');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        process.exit(1);
    }
}

// Run tests
runAllTests();