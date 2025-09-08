/**
 * WASM-Native Extensions Header for Graphene.wasm
 * 
 * This header defines WASM-native API extensions for enhanced web integration
 * including persistent configuration storage and async resource loading patterns.
 * 
 * Copyright 2025 Superstruct Ltd, New Zealand
 * Licensed under MIT (same as graphene)
 */

#ifndef GRAPHENE_WASM_NATIVE_H
#define GRAPHENE_WASM_NATIVE_H

#include <graphene.h>
#include <stdint.h>
#include <stddef.h>

#ifdef __cplusplus
extern "C" {
#endif

/**
 * Initialize WASM-native extensions with virtual file system
 * Returns: 1 on success, 0 on failure
 */
int graphene_native_init_filesystem(void);

/**
 * Set persistent storage availability (called from JavaScript after IDBFS sync)
 * @param available: 1 if persistent storage is available, 0 otherwise
 */
void graphene_native_set_persistent_storage(int available);

/**
 * Load configuration from persistent storage
 * 
 * This function implements WASM-native pattern for configuration persistence:
 * 1. Check persistent storage (IDBFS) for saved configuration
 * 2. Apply performance settings and optimization preferences
 * 3. Enable/disable features based on stored user preferences
 * 
 * @param config_name: Configuration name (e.g., "performance", "precision")
 * @param callback: Callback function called when loading completes
 * @param user_data: User data passed to callback
 * 
 * Returns: 1 if loading initiated successfully, 0 on error
 * 
 * Callback signature: void callback(int success, void* user_data)
 * - success: 1 if successful, 0 if failed or defaults used
 * - user_data: User data passed to graphene_native_load_config
 */
int graphene_native_load_config(const char* config_name,
                                void (*callback)(int success, void* user_data),
                                void* user_data);

/**
 * Save configuration to persistent storage
 * 
 * Saves optimization preferences and performance settings that persist
 * across browser sessions using IDBFS integration.
 * 
 * @param config_name: Configuration name to save
 * @param simd_enabled: Enable SIMD optimizations
 * @param precision_mode: Precision mode (0=fast, 1=balanced, 2=precise)
 * @param cache_size: Memory cache size for frequently used operations
 * 
 * Returns: 1 on success, 0 on failure
 */
int graphene_native_save_config(const char* config_name,
                                int simd_enabled,
                                int precision_mode,
                                size_t cache_size);

/**
 * Create custom transformation pipeline with persistent caching
 * 
 * Creates a transformation pipeline that caches intermediate results
 * to persistent storage for improved performance on repeated operations.
 * 
 * @param pipeline_name: Name for the transformation pipeline
 * @param operations: Array of operation types to include
 * @param operation_count: Number of operations in the pipeline
 * @param cache_policy: Caching policy (0=memory, 1=persistent, 2=hybrid)
 * 
 * Returns: Pipeline handle or NULL on failure
 */
typedef struct graphene_native_pipeline graphene_native_pipeline_t;

graphene_native_pipeline_t* graphene_native_create_pipeline(const char* pipeline_name,
                                                            const int* operations,
                                                            size_t operation_count,
                                                            int cache_policy);

/**
 * Execute transformation pipeline with caching
 * 
 * @param pipeline: Pipeline handle
 * @param input_data: Input data for transformation
 * @param input_count: Number of input elements
 * @param output_data: Output buffer
 * @param progress_callback: Optional progress callback for large datasets
 * @param user_data: User data for progress callback
 * 
 * Returns: Number of elements processed, or -1 on error
 */
int graphene_native_execute_pipeline(graphene_native_pipeline_t* pipeline,
                                     const void* input_data,
                                     size_t input_count,
                                     void* output_data,
                                     void (*progress_callback)(int percent, void* user_data),
                                     void* user_data);

/**
 * Enable progressive transformation for large datasets
 * 
 * Implements streaming transformation for improved performance with large
 * datasets that don't fit in memory:
 * 1. Process data in chunks to prevent memory exhaustion
 * 2. Provide progress feedback for user interfaces
 * 3. Allow cancellation of long-running operations
 * 
 * @param enable: 1 to enable progressive processing, 0 to disable
 * @param chunk_size: Size of each processing chunk (0 = automatic)
 * 
 * Returns: 1 on success, 0 on failure
 */
int graphene_native_set_progressive_processing(int enable, size_t chunk_size);

/**
 * Get processing progress for long-running operations
 * 
 * @param pipeline: Pipeline handle
 * @param total_operations: Pointer to receive total operation count (can be NULL)
 * @param completed_operations: Pointer to receive completed count (can be NULL)
 * @param is_complete: Pointer to receive completion status (can be NULL)
 * 
 * Returns: Progress percentage (0-100)
 */
int graphene_native_get_processing_progress(graphene_native_pipeline_t* pipeline,
                                           size_t* total_operations,
                                           size_t* completed_operations,
                                           int* is_complete);

/**
 * Get cache statistics
 * 
 * @param entry_count: Pointer to receive number of cached entries (can be NULL)
 * @param total_size: Pointer to receive total cache size in bytes (can be NULL)
 * @param persistent_enabled: Pointer to receive persistent storage status (can be NULL)
 * @param hit_rate: Pointer to receive cache hit rate as percentage (can be NULL)
 */
void graphene_native_get_cache_stats(int* entry_count, size_t* total_size,
                                     int* persistent_enabled, int* hit_rate);

/**
 * Configure cache behavior
 * 
 * @param max_entries: Maximum number of cache entries (0 = unlimited)
 * @param max_size_mb: Maximum cache size in megabytes (0 = unlimited)
 * @param ttl_minutes: Time-to-live in minutes for cache entries (0 = never expire)
 * 
 * Returns: 1 on success, 0 on failure
 */
int graphene_native_configure_cache(int max_entries, int max_size_mb, int ttl_minutes);

/**
 * Clear transformation cache
 * 
 * @param clear_persistent: 1 to also clear persistent storage, 0 for memory only
 * 
 * Returns: 1 on success, 0 on failure
 */
int graphene_native_clear_cache(int clear_persistent);

/**
 * Enable/disable offline mode
 * 
 * When enabled, only cached transformations and configurations are used.
 * 
 * @param enable: 1 to enable offline mode, 0 to allow dynamic loading
 * 
 * Returns: 1 on success, 0 on failure
 */
int graphene_native_set_offline_mode(int enable);

/**
 * Check if configuration is available offline
 * 
 * @param config_name: Configuration name to check
 * 
 * Returns: 1 if available offline, 0 if requires network/initialization
 */
int graphene_native_is_config_offline(const char* config_name);

/**
 * Export transformation results to different formats
 * 
 * @param pipeline: Pipeline handle to export from
 * @param format: Export format ("json", "binary", "csv")
 * @param output_buffer: Buffer to receive exported data
 * @param buffer_size: Size of output buffer
 * 
 * Returns: Number of bytes written to buffer, or negative on error
 */
int graphene_native_export_results(graphene_native_pipeline_t* pipeline,
                                   const char* format,
                                   char* output_buffer,
                                   size_t buffer_size);

/**
 * Import transformation configuration from data
 * 
 * @param format: Import format ("json", "binary")
 * @param input_data: Data to import
 * @param data_size: Size of input data
 * 
 * Returns: Pipeline handle or NULL on error
 */
graphene_native_pipeline_t* graphene_native_import_config(const char* format,
                                                          const char* input_data,
                                                          size_t data_size);

/**
 * Set network timeout for any remote operations
 * 
 * @param timeout_ms: Timeout in milliseconds (default: 30000)
 * 
 * Returns: 1 on success, 0 on failure
 */
int graphene_native_set_network_timeout(int timeout_ms);

/**
 * Enable/disable compression for persistent storage
 * 
 * @param enable: 1 to enable compression, 0 to disable
 * 
 * Returns: 1 on success, 0 on failure
 */
int graphene_native_set_compression(int enable);

/**
 * Get performance information and statistics
 * 
 * @param pipeline: Pipeline handle (can be NULL for global stats)
 * @param info_type: Type of information requested
 * @param output_buffer: Buffer for output
 * @param buffer_size: Size of output buffer
 * 
 * Info types:
 * - "performance": Performance statistics
 * - "memory": Memory usage information
 * - "cache": Cache efficiency metrics
 * - "simd": SIMD utilization stats
 * - "operations": Operation count and timing
 * - "version": Library version and capabilities
 * 
 * Returns: Length of information string, or -1 on error
 */
int graphene_native_get_info(graphene_native_pipeline_t* pipeline,
                             const char* info_type,
                             char* output_buffer,
                             size_t buffer_size);

/**
 * Create optimized transformation with WASM-native enhancements
 * 
 * Creates a transformation optimized for web environments:
 * - SIMD-accelerated processing when available
 * - Web Worker compatibility for large datasets
 * - Progressive processing for streaming data
 * - Persistent caching for repeated operations
 * 
 * @param transform_type: Type of transformation (matrix, vector, etc.)
 * @param optimization_level: Optimization level (0=basic, 1=balanced, 2=maximum)
 * @param enable_caching: Enable result caching
 * @param enable_progressive: Enable progressive processing
 * 
 * Returns: Pipeline handle or NULL on error
 */
graphene_native_pipeline_t* graphene_native_create_optimized_transform(
    int transform_type,
    int optimization_level,
    int enable_caching,
    int enable_progressive
);

/**
 * Validate transformation pipeline integrity
 * 
 * @param pipeline: Pipeline to validate
 * @param validation_level: Validation strictness (1=basic, 2=standard, 3=strict)
 * @param error_buffer: Buffer for error messages (can be NULL)
 * @param error_buffer_size: Size of error buffer
 * 
 * Returns: 1 if valid, 0 if invalid
 */
int graphene_native_validate_pipeline(graphene_native_pipeline_t* pipeline,
                                      int validation_level,
                                      char* error_buffer,
                                      size_t error_buffer_size);

/**
 * Free pipeline resources
 * 
 * @param pipeline: Pipeline to free
 */
void graphene_native_free_pipeline(graphene_native_pipeline_t* pipeline);

#ifdef __cplusplus
}
#endif

#endif // GRAPHENE_WASM_NATIVE_H