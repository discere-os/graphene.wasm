/**
 * Graphene.wasm Performance Benchmarks
 * Comprehensive performance testing for 3D mathematics operations
 * 
 * Copyright 2025 Superstruct Ltd, New Zealand
 * Licensed under MIT (same as graphene)
 */

import GrapheneModule from '../dist/graphene.js';

let Module;
const ITERATIONS = {
    matrix_ops: 1000000,
    vector_ops: 10000000,  
    quaternion_ops: 1000000,
    geometric_ops: 500000
};

class BenchmarkSuite {
    constructor(module) {
        this.module = module;
        this.results = [];
    }
    
    async benchmark(name, operation, iterations, targetOpsPerSec = null) {
        console.log(`⚡ Benchmarking ${name}...`);
        
        // Warmup
        for (let i = 0; i < Math.min(1000, iterations / 10); i++) {
            await operation();
        }
        
        // Actual benchmark
        const start = performance.now();
        for (let i = 0; i < iterations; i++) {
            await operation();
        }
        const end = performance.now();
        
        const duration = end - start;
        const opsPerSecond = iterations / (duration / 1000);
        
        const result = {
            name,
            duration: duration.toFixed(2),
            iterations,
            opsPerSecond: Math.round(opsPerSecond),
            opsPerSecondFormatted: (opsPerSecond / 1000000).toFixed(2) + 'M',
            target: targetOpsPerSec,
            passed: targetOpsPerSec ? opsPerSecond >= targetOpsPerSec : true
        };
        
        this.results.push(result);
        
        console.log(`   Duration: ${result.duration}ms`);
        console.log(`   Performance: ${result.opsPerSecondFormatted} ops/second`);
        
        if (targetOpsPerSec) {
            const status = result.passed ? '✅' : '❌';
            console.log(`   Target: ${(targetOpsPerSec / 1000000).toFixed(2)}M ops/second ${status}`);
        }
        
        return result;
    }
    
    printSummary() {
        console.log('\n📊 === Performance Summary ===');
        console.log('| Operation | Duration | Ops/Second | Target | Status |');
        console.log('|-----------|----------|------------|--------|--------|');
        
        for (const result of this.results) {
            const status = result.passed ? '✅' : '❌';
            const target = result.target ? (result.target / 1000000).toFixed(2) + 'M' : 'N/A';
            console.log(`| ${result.name.padEnd(12)} | ${result.duration.padEnd(8)}ms | ${result.opsPerSecondFormatted.padEnd(10)} | ${target.padEnd(6)} | ${status.padEnd(6)} |`);
        }
        
        const passedTests = this.results.filter(r => r.passed).length;
        const totalTests = this.results.length;
        
        console.log(`\n🎯 Performance Tests: ${passedTests}/${totalTests} passed`);
        
        if (passedTests === totalTests) {
            console.log('🏆 All performance targets met!');
        } else {
            console.log('⚠️  Some performance targets not met - optimization needed');
        }
    }
}

// Matrix operation benchmarks
function benchmarkMatrixOperations(benchmark) {
    const m1 = Module._graphene_matrix_alloc_wasm();
    const m2 = Module._graphene_matrix_alloc_wasm();
    const result = Module._graphene_matrix_alloc_wasm();
    
    Module._graphene_matrix_init_identity(m1);
    Module._graphene_matrix_init_scale(m2, 1.5, 2.0, 0.5);
    
    return {
        async matrixMultiply() {
            return benchmark.benchmark(
                'Matrix Mult',
                () => Module._graphene_matrix_multiply_wasm(m1, m2, result),
                ITERATIONS.matrix_ops,
                1000000 // Target: 1M ops/second
            );
        },
        
        async matrixInvert() {
            return benchmark.benchmark(
                'Matrix Invert',
                () => Module._graphene_matrix_inverse(m1, result),
                ITERATIONS.matrix_ops / 10,
                100000 // Target: 100K ops/second (more expensive)
            );
        },
        
        async matrixTranspose() {
            return benchmark.benchmark(
                'Matrix Trans',
                () => Module._graphene_matrix_transpose(m1, result),
                ITERATIONS.matrix_ops,
                2000000 // Target: 2M ops/second
            );
        },
        
        cleanup() {
            Module._graphene_matrix_free_wasm(m1);
            Module._graphene_matrix_free_wasm(m2);
            Module._graphene_matrix_free_wasm(result);
        }
    };
}

// Vector operation benchmarks
function benchmarkVectorOperations(benchmark) {
    const v1 = Module._graphene_vec3_alloc_wasm();
    const v2 = Module._graphene_vec3_alloc_wasm();
    const result = Module._graphene_vec3_alloc_wasm();
    
    Module._graphene_vec3_init(v1, 1.0, 2.0, 3.0);
    Module._graphene_vec3_init(v2, 4.0, 5.0, 6.0);
    
    return {
        async vectorDotProduct() {
            return benchmark.benchmark(
                'Vector Dot',
                () => Module._graphene_vec3_dot_wasm(v1, v2),
                ITERATIONS.vector_ops,
                10000000 // Target: 10M ops/second
            );
        },
        
        async vectorCrossProduct() {
            return benchmark.benchmark(
                'Vector Cross',
                () => Module._graphene_vec3_cross_wasm(v1, v2, result),
                ITERATIONS.vector_ops / 2,
                5000000 // Target: 5M ops/second
            );
        },
        
        async vectorNormalize() {
            return benchmark.benchmark(
                'Vector Norm',
                () => Module._graphene_vec3_normalize(v1, result),
                ITERATIONS.vector_ops / 2,
                3000000 // Target: 3M ops/second
            );
        },
        
        async vectorLength() {
            return benchmark.benchmark(
                'Vector Len',
                () => Module._graphene_vec3_length(v1),
                ITERATIONS.vector_ops,
                8000000 // Target: 8M ops/second
            );
        },
        
        cleanup() {
            Module._graphene_vec3_free_wasm(v1);
            Module._graphene_vec3_free_wasm(v2);
            Module._graphene_vec3_free_wasm(result);
        }
    };
}

// Quaternion operation benchmarks
function benchmarkQuaternionOperations(benchmark) {
    const q1 = Module._graphene_quaternion_alloc();
    const q2 = Module._graphene_quaternion_alloc();
    const result = Module._graphene_quaternion_alloc();
    
    Module._graphene_quaternion_init_identity(q1);
    Module._graphene_quaternion_init_from_angle_vec3(q2, 45.0, 0.0, 0.0, 1.0);
    
    return {
        async quaternionSlerp() {
            return benchmark.benchmark(
                'Quat SLERP',
                () => Module._graphene_quaternion_slerp_wasm(q1, q2, 0.5, result),
                ITERATIONS.quaternion_ops,
                500000 // Target: 500K ops/second
            );
        },
        
        async quaternionMultiply() {
            return benchmark.benchmark(
                'Quat Mult',
                () => Module._graphene_quaternion_multiply(q1, q2, result),
                ITERATIONS.quaternion_ops,
                2000000 // Target: 2M ops/second
            );
        },
        
        async quaternionNormalize() {
            return benchmark.benchmark(
                'Quat Norm',
                () => Module._graphene_quaternion_normalize(q1, result),
                ITERATIONS.quaternion_ops,
                1500000 // Target: 1.5M ops/second
            );
        },
        
        cleanup() {
            Module._graphene_quaternion_free(q1);
            Module._graphene_quaternion_free(q2);
            Module._graphene_quaternion_free(result);
        }
    };
}

// Geometric operation benchmarks
function benchmarkGeometricOperations(benchmark) {
    const point = Module._graphene_point3d_alloc();
    const plane = Module._graphene_plane_alloc();
    const box = Module._graphene_box_alloc();
    const sphere = Module._graphene_sphere_alloc();
    
    Module._graphene_point3d_init(point, 1.0, 2.0, 3.0);
    Module._graphene_plane_init_from_point_normal(plane, point, Module._graphene_vec3_y_axis());
    Module._graphene_box_init_from_points(box, 8, [/* test points */]);
    Module._graphene_sphere_init_from_points(sphere, 8, [/* test points */]);
    
    return {
        async planeDistance() {
            return benchmark.benchmark(
                'Plane Dist',
                () => Module._graphene_plane_distance(plane, point),
                ITERATIONS.geometric_ops,
                2000000 // Target: 2M ops/second
            );
        },
        
        async sphereContainsPoint() {
            return benchmark.benchmark(
                'Sphere Test',
                () => Module._graphene_sphere_contains_point(sphere, point),
                ITERATIONS.geometric_ops,
                1500000 // Target: 1.5M ops/second
            );
        },
        
        async boxContainsPoint() {
            return benchmark.benchmark(
                'Box Test',
                () => Module._graphene_box_contains_point(box, point),
                ITERATIONS.geometric_ops,
                1000000 // Target: 1M ops/second
            );
        },
        
        cleanup() {
            Module._graphene_point3d_free(point);
            Module._graphene_plane_free(plane);
            Module._graphene_box_free(box);
            Module._graphene_sphere_free(sphere);
        }
    };
}

// Memory allocation/deallocation benchmark
function benchmarkMemoryOperations(benchmark) {
    return {
        async memoryAllocationMatrix() {
            return benchmark.benchmark(
                'Alloc Matrix',
                () => {
                    const m = Module._graphene_matrix_alloc_wasm();
                    Module._graphene_matrix_free_wasm(m);
                },
                100000, // Less iterations for allocation tests
                50000 // Target: 50K alloc/free cycles per second
            );
        },
        
        async memoryAllocationVector() {
            return benchmark.benchmark(
                'Alloc Vector',
                () => {
                    const v = Module._graphene_vec3_alloc_wasm();
                    Module._graphene_vec3_free_wasm(v);
                },
                100000,
                80000 // Target: 80K alloc/free cycles per second
            );
        }
    };
}

async function runBenchmarks() {
    console.log('🔧 Initializing graphene.wasm module...');
    Module = await GrapheneModule();
    Module._graphene_wasm_init();
    console.log('✅ Module initialized\n');
    
    const benchmark = new BenchmarkSuite(Module);
    
    console.log('🏁 === Graphene.wasm Performance Benchmarks ===\n');
    
    // Matrix operations
    console.log('📊 Matrix Operations:');
    const matrixOps = benchmarkMatrixOperations(benchmark);
    await matrixOps.matrixMultiply();
    await matrixOps.matrixInvert();
    await matrixOps.matrixTranspose();
    matrixOps.cleanup();
    
    console.log('\n📊 Vector Operations:');
    const vectorOps = benchmarkVectorOperations(benchmark);
    await vectorOps.vectorDotProduct();
    await vectorOps.vectorCrossProduct();
    await vectorOps.vectorNormalize();
    await vectorOps.vectorLength();
    vectorOps.cleanup();
    
    console.log('\n📊 Quaternion Operations:');
    const quaternionOps = benchmarkQuaternionOperations(benchmark);
    await quaternionOps.quaternionSlerp();
    await quaternionOps.quaternionMultiply();
    await quaternionOps.quaternionNormalize();
    quaternionOps.cleanup();
    
    console.log('\n📊 Geometric Operations:');
    const geometricOps = benchmarkGeometricOperations(benchmark);
    await geometricOps.planeDistance();
    await geometricOps.sphereContainsPoint();
    await geometricOps.boxContainsPoint();
    geometricOps.cleanup();
    
    console.log('\n📊 Memory Operations:');
    const memoryOps = benchmarkMemoryOperations(benchmark);
    await memoryOps.memoryAllocationMatrix();
    await memoryOps.memoryAllocationVector();
    
    // Print final summary
    benchmark.printSummary();
    
    // Check for SIMD support
    const simdSupported = typeof WebAssembly.SIMD !== 'undefined';
    console.log(`\n🔧 WebAssembly SIMD Support: ${simdSupported ? '✅ Enabled' : '❌ Not Available'}`);
    
    if (!simdSupported) {
        console.log('💡 Performance could be improved with WebAssembly SIMD support');
    }
    
    console.log('\n🏁 Benchmark complete!');
}

runBenchmarks().catch(error => {
    console.error('❌ Benchmark failed:', error);
    process.exit(1);
});