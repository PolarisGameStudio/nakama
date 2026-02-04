/**
 * Core Module Index - Nakama V8 Runtime
 * 
 * This file consolidates all core infrastructure modules for the Nakama backend.
 * It should be included at the top of the main index.js file.
 * 
 * Modules included:
 * - logger.js: Structured JSON logging with traceId
 * - rpc_registry.js: Central RPC metadata registry
 * - middleware.js: RPC middleware framework
 * - errors.js: Standardized error codes and handling
 * 
 * Usage in main index.js:
 * Simply copy the contents of the individual files and paste them at the top,
 * OR use a build tool to concatenate them.
 * 
 * @version 1.0.0
 * @date 2026-02-05
 */

// ============================================================================
// MODULE VERIFICATION
// ============================================================================

/**
 * Verify that all core modules are loaded
 * Call this after all modules are included to ensure they're available
 * 
 * @param {object} logger - Nakama logger instance
 * @returns {object} Verification result { success, modules, missing }
 */
function verifyCoreModules(logger) {
    var modules = {
        'StructuredLogger': typeof globalThis !== 'undefined' && globalThis.StructuredLogger,
        'RpcRegistry': typeof globalThis !== 'undefined' && globalThis.RpcRegistry,
        'RpcMiddleware': typeof globalThis !== 'undefined' && globalThis.RpcMiddleware,
        'RpcErrors': typeof globalThis !== 'undefined' && globalThis.RpcErrors
    };
    
    var missing = [];
    var loaded = [];
    
    for (var name in modules) {
        if (modules[name]) {
            loaded.push(name);
        } else {
            missing.push(name);
        }
    }
    
    var success = missing.length === 0;
    
    if (logger) {
        if (success) {
            logger.info('[Core] All core modules loaded: ' + loaded.join(', '));
        } else {
            logger.error('[Core] Missing core modules: ' + missing.join(', '));
            logger.info('[Core] Loaded modules: ' + loaded.join(', '));
        }
    }
    
    return {
        success: success,
        modules: loaded,
        missing: missing
    };
}

// ============================================================================
// QUICK ACCESS HELPERS
// ============================================================================

/**
 * Get the StructuredLogger module
 * @returns {object|null} StructuredLogger or null
 */
function getLogger() {
    return (typeof globalThis !== 'undefined' && globalThis.StructuredLogger) || null;
}

/**
 * Get the RpcRegistry module
 * @returns {object|null} RpcRegistry or null
 */
function getRegistry() {
    return (typeof globalThis !== 'undefined' && globalThis.RpcRegistry) || null;
}

/**
 * Get the RpcMiddleware module
 * @returns {object|null} RpcMiddleware or null
 */
function getMiddleware() {
    return (typeof globalThis !== 'undefined' && globalThis.RpcMiddleware) || null;
}

/**
 * Get the RpcErrors module
 * @returns {object|null} RpcErrors or null
 */
function getErrors() {
    return (typeof globalThis !== 'undefined' && globalThis.RpcErrors) || null;
}

// ============================================================================
// CONVENIENCE WRAPPERS
// ============================================================================

/**
 * Wrap an RPC with the full middleware stack
 * This is the primary way to enhance RPCs with logging, validation, etc.
 * 
 * @param {function} handler - Original RPC handler
 * @param {string} rpcName - RPC name
 * @param {object} [options] - Middleware options
 * @returns {function} Wrapped RPC handler
 */
function wrapRpc(handler, rpcName, options) {
    var middleware = getMiddleware();
    
    if (!middleware) {
        // Fallback: return original handler if middleware not loaded
        return handler;
    }
    
    return middleware.withMiddleware(handler, rpcName, options);
}

/**
 * Generate a new trace ID
 * @returns {string} Trace ID
 */
function newTraceId() {
    var logger = getLogger();
    if (logger && logger.generateTraceId) {
        return logger.generateTraceId();
    }
    return 'trace-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
}

/**
 * Create an error response using the errors module
 * 
 * @param {string} code - Error code
 * @param {string} message - Error message
 * @param {string} [traceId] - Trace ID
 * @param {object} [details] - Additional details
 * @returns {string} JSON error response
 */
function errorResponse(code, message, traceId, details) {
    var errors = getErrors();
    if (errors && errors.errorResponse) {
        return errors.errorResponse(code, message, traceId, details);
    }
    
    // Fallback
    return JSON.stringify({
        success: false,
        error: message,
        errorCode: code,
        traceId: traceId
    });
}

/**
 * Create a success response
 * 
 * @param {object} data - Response data
 * @param {string} [traceId] - Trace ID
 * @returns {string} JSON success response
 */
function successResponse(data, traceId) {
    var middleware = getMiddleware();
    if (middleware && middleware.rpcSuccess) {
        return middleware.rpcSuccess(data, { traceId: traceId });
    }
    
    // Fallback
    var response = { success: true };
    if (data && typeof data === 'object') {
        for (var key in data) {
            if (data.hasOwnProperty(key)) {
                response[key] = data[key];
            }
        }
    }
    if (traceId) {
        response.traceId = traceId;
    }
    return JSON.stringify(response);
}

// ============================================================================
// INITIALIZATION HELPER
// ============================================================================

/**
 * Initialize core modules
 * Call this in InitModule after including all core module code
 * 
 * @param {object} ctx - Nakama context
 * @param {object} logger - Nakama logger
 * @param {object} nk - Nakama runtime
 * @returns {boolean} True if initialization successful
 */
function initializeCoreModules(ctx, logger, nk) {
    logger.info('========================================');
    logger.info('[Core] Initializing Core Infrastructure');
    logger.info('========================================');
    
    // Verify all modules are loaded
    var verification = verifyCoreModules(logger);
    
    if (!verification.success) {
        logger.error('[Core] Failed to load all core modules!');
        logger.error('[Core] Missing: ' + verification.missing.join(', '));
        return false;
    }
    
    // Log module versions/info
    logger.info('[Core] StructuredLogger: Loaded');
    logger.info('[Core] RpcRegistry: Loaded (' + 
        (globalThis.RpcRegistry ? Object.keys(globalThis.RpcRegistry.PREDEFINED_RPC_METADATA || {}).length : 0) + 
        ' predefined RPC configs)');
    logger.info('[Core] RpcMiddleware: Loaded');
    logger.info('[Core] RpcErrors: Loaded (' + 
        (globalThis.RpcErrors ? Object.keys(globalThis.RpcErrors.Codes || {}).length : 0) + 
        ' error codes)');
    
    logger.info('========================================');
    logger.info('[Core] Core Infrastructure Ready');
    logger.info('========================================');
    
    return true;
}

// ============================================================================
// EXPORTS (for V8 runtime - global assignment)
// ============================================================================

if (typeof globalThis !== 'undefined') {
    globalThis.Core = {
        // Verification
        verifyCoreModules: verifyCoreModules,
        initializeCoreModules: initializeCoreModules,
        
        // Module getters
        getLogger: getLogger,
        getRegistry: getRegistry,
        getMiddleware: getMiddleware,
        getErrors: getErrors,
        
        // Convenience functions
        wrapRpc: wrapRpc,
        newTraceId: newTraceId,
        errorResponse: errorResponse,
        successResponse: successResponse
    };
}
