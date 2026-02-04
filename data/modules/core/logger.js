/**
 * Structured JSON Logging Helper for Nakama V8 Runtime
 * 
 * Provides:
 * - Structured JSON logs with consistent schema
 * - TraceId generation and propagation
 * - Request ID management
 * - Log levels: debug, info, warn, error
 * - Safe serialization (handles circular refs, large payloads)
 * 
 * @version 1.0.0
 * @date 2026-02-05
 */

// ============================================================================
// CONSTANTS
// ============================================================================

var LOG_LEVELS = {
    DEBUG: 'debug',
    INFO: 'info',
    WARN: 'warn',
    ERROR: 'error'
};

var LOG_LEVEL_PRIORITY = {
    'debug': 0,
    'info': 1,
    'warn': 2,
    'error': 3
};

// Maximum payload size to log (prevent memory issues)
var MAX_PAYLOAD_LOG_SIZE = 4096;

// Maximum depth for object serialization
var MAX_SERIALIZATION_DEPTH = 10;

// ============================================================================
// TRACE ID GENERATION
// ============================================================================

/**
 * Generate a unique trace ID for request correlation
 * Format: {timestamp_base36}-{random_base36}
 * Example: "lz1abc123-k9f2g4h"
 * 
 * @returns {string} Unique trace ID
 */
function generateTraceId() {
    try {
        var timestamp = Date.now().toString(36);
        var random = '';
        // Generate 7 random characters
        for (var i = 0; i < 7; i++) {
            random += Math.floor(Math.random() * 36).toString(36);
        }
        return timestamp + '-' + random;
    } catch (err) {
        // Fallback if generation fails
        return 'trace-' + Date.now();
    }
}

/**
 * Generate a short unique ID for request identification
 * @returns {string} Short unique ID (8 chars)
 */
function generateShortId() {
    try {
        var chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
        var id = '';
        for (var i = 0; i < 8; i++) {
            id += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return id;
    } catch (err) {
        return 'id' + Date.now().toString(36).slice(-6);
    }
}

/**
 * Validate a trace ID format
 * @param {*} traceId - Value to validate
 * @returns {boolean} True if valid trace ID
 */
function isValidTraceId(traceId) {
    if (!traceId || typeof traceId !== 'string') {
        return false;
    }
    // Must be 5-50 chars, alphanumeric with hyphens
    if (traceId.length < 5 || traceId.length > 50) {
        return false;
    }
    return /^[a-zA-Z0-9\-_]+$/.test(traceId);
}

// ============================================================================
// SAFE SERIALIZATION
// ============================================================================

/**
 * Safely serialize a value, handling circular references and size limits
 * @param {*} value - Value to serialize
 * @param {number} [maxDepth] - Maximum nesting depth
 * @returns {*} Serialized value (safe for JSON.stringify)
 */
function safeSerialize(value, maxDepth) {
    maxDepth = typeof maxDepth === 'number' ? maxDepth : MAX_SERIALIZATION_DEPTH;
    var seen = [];
    
    function serialize(val, depth) {
        if (depth > maxDepth) {
            return '[Max Depth Exceeded]';
        }
        
        // Handle null/undefined
        if (val === null) return null;
        if (val === undefined) return '[undefined]';
        
        // Handle primitives
        var type = typeof val;
        if (type === 'string') {
            // Truncate very long strings
            if (val.length > MAX_PAYLOAD_LOG_SIZE) {
                return val.substring(0, MAX_PAYLOAD_LOG_SIZE) + '...[truncated, total: ' + val.length + ' chars]';
            }
            return val;
        }
        if (type === 'number' || type === 'boolean') {
            return val;
        }
        if (type === 'function') {
            return '[Function: ' + (val.name || 'anonymous') + ']';
        }
        if (type === 'symbol') {
            return val.toString();
        }
        
        // Handle Date
        if (val instanceof Date) {
            return val.toISOString();
        }
        
        // Handle Error
        if (val instanceof Error) {
            return {
                name: val.name,
                message: val.message,
                stack: val.stack ? val.stack.substring(0, 1000) : undefined
            };
        }
        
        // Handle arrays
        if (Array.isArray(val)) {
            if (seen.indexOf(val) !== -1) {
                return '[Circular Reference]';
            }
            seen.push(val);
            
            var arr = [];
            var limit = Math.min(val.length, 100); // Limit array size
            for (var i = 0; i < limit; i++) {
                arr.push(serialize(val[i], depth + 1));
            }
            if (val.length > 100) {
                arr.push('...[' + (val.length - 100) + ' more items]');
            }
            return arr;
        }
        
        // Handle objects
        if (type === 'object') {
            if (seen.indexOf(val) !== -1) {
                return '[Circular Reference]';
            }
            seen.push(val);
            
            var obj = {};
            var keys;
            try {
                keys = Object.keys(val);
            } catch (e) {
                return '[Object]';
            }
            
            var keyLimit = Math.min(keys.length, 50); // Limit object keys
            for (var j = 0; j < keyLimit; j++) {
                var key = keys[j];
                try {
                    obj[key] = serialize(val[key], depth + 1);
                } catch (e) {
                    obj[key] = '[Serialization Error]';
                }
            }
            if (keys.length > 50) {
                obj['__more__'] = (keys.length - 50) + ' more keys';
            }
            return obj;
        }
        
        return String(val);
    }
    
    return serialize(value, 0);
}

/**
 * Safely stringify JSON with error handling
 * @param {*} value - Value to stringify
 * @returns {string} JSON string or error message
 */
function safeStringify(value) {
    try {
        return JSON.stringify(safeSerialize(value));
    } catch (err) {
        return '{"_error":"Failed to stringify: ' + (err.message || 'unknown') + '"}';
    }
}

// ============================================================================
// STRUCTURED LOGGING
// ============================================================================

/**
 * Log a structured JSON message
 * 
 * @param {object} logger - Nakama logger instance
 * @param {object} data - Log data object
 * @param {string} [data.level='info'] - Log level (debug, info, warn, error)
 * @param {string} data.traceId - Request trace ID
 * @param {string} [data.rpcName] - RPC name being executed
 * @param {string} [data.userId] - User ID making the request
 * @param {string} [data.gameId] - Game ID context
 * @param {number} [data.latencyMs] - Request latency in milliseconds
 * @param {string} [data.result] - Result status (success, error, etc.)
 * @param {string} [data.errorCode] - Error code if applicable
 * @param {string} [data.message] - Human-readable message
 * @param {object} [data.metadata] - Additional metadata
 * @param {string} [data.event] - Event type (rpc_start, rpc_complete, etc.)
 */
function logStructured(logger, data) {
    // Validate logger
    if (!logger || typeof logger !== 'object') {
        // Can't log without a logger, silently fail
        return;
    }
    
    // Build structured log entry
    var logEntry = {
        // Timing
        timestamp: new Date().toISOString(),
        
        // Level
        level: data.level || LOG_LEVELS.INFO,
        
        // Correlation
        traceId: data.traceId || 'no-trace',
        requestId: data.requestId || null,
        
        // Context
        rpcName: data.rpcName || null,
        userId: data.userId || null,
        gameId: data.gameId || null,
        
        // Event info
        event: data.event || null,
        
        // Performance
        latencyMs: typeof data.latencyMs === 'number' ? data.latencyMs : null,
        
        // Result
        result: data.result || null,
        errorCode: data.errorCode || null,
        errorMessage: data.errorMessage || null,
        
        // Message
        message: data.message || null,
        
        // Additional metadata (sanitized)
        metadata: data.metadata ? safeSerialize(data.metadata, 5) : null
    };
    
    // Remove null values for cleaner logs (optional)
    var cleanEntry = {};
    for (var key in logEntry) {
        if (logEntry.hasOwnProperty(key) && logEntry[key] !== null) {
            cleanEntry[key] = logEntry[key];
        }
    }
    
    // Stringify the log entry
    var logString;
    try {
        logString = JSON.stringify(cleanEntry);
    } catch (err) {
        logString = '{"level":"error","message":"Failed to serialize log entry","error":"' + (err.message || 'unknown') + '"}';
    }
    
    // Route to appropriate log level
    var level = (data.level || LOG_LEVELS.INFO).toLowerCase();
    
    try {
        switch (level) {
            case LOG_LEVELS.ERROR:
                logger.error(logString);
                break;
            case LOG_LEVELS.WARN:
                logger.warn(logString);
                break;
            case LOG_LEVELS.DEBUG:
                logger.debug(logString);
                break;
            case LOG_LEVELS.INFO:
            default:
                logger.info(logString);
                break;
        }
    } catch (err) {
        // Last resort - try info
        try {
            logger.info('{"level":"error","message":"Logger method failed","originalLevel":"' + level + '"}');
        } catch (e) {
            // Give up silently
        }
    }
}

/**
 * Convenience method: Log debug message
 */
function logDebug(logger, traceId, rpcName, message, metadata) {
    logStructured(logger, {
        level: LOG_LEVELS.DEBUG,
        traceId: traceId,
        rpcName: rpcName,
        message: message,
        metadata: metadata
    });
}

/**
 * Convenience method: Log info message
 */
function logInfo(logger, traceId, rpcName, message, metadata) {
    logStructured(logger, {
        level: LOG_LEVELS.INFO,
        traceId: traceId,
        rpcName: rpcName,
        message: message,
        metadata: metadata
    });
}

/**
 * Convenience method: Log warning message
 */
function logWarn(logger, traceId, rpcName, message, metadata) {
    logStructured(logger, {
        level: LOG_LEVELS.WARN,
        traceId: traceId,
        rpcName: rpcName,
        message: message,
        metadata: metadata
    });
}

/**
 * Convenience method: Log error message
 */
function logError(logger, traceId, rpcName, message, error, metadata) {
    var errorInfo = null;
    if (error) {
        errorInfo = {
            name: error.name || 'Error',
            message: error.message || String(error),
            stack: error.stack ? error.stack.substring(0, 500) : undefined
        };
    }
    
    logStructured(logger, {
        level: LOG_LEVELS.ERROR,
        traceId: traceId,
        rpcName: rpcName,
        message: message,
        errorMessage: error ? (error.message || String(error)) : null,
        metadata: metadata ? Object.assign({}, metadata, { error: errorInfo }) : { error: errorInfo }
    });
}

// ============================================================================
// RPC LIFECYCLE LOGGING
// ============================================================================

/**
 * Log RPC start event
 * 
 * @param {object} logger - Nakama logger
 * @param {string} traceId - Trace ID
 * @param {string} rpcName - RPC name
 * @param {string} userId - User ID
 * @param {object} [payload] - Request payload (will be sanitized)
 */
function logRpcStart(logger, traceId, rpcName, userId, payload) {
    var meta = {};
    
    // Safely extract gameId from payload if present
    if (payload && typeof payload === 'object') {
        if (payload.gameId) meta.gameId = payload.gameId;
        if (payload.game_id) meta.gameId = payload.game_id;
        
        // Log payload keys (not values for privacy)
        try {
            meta.payloadKeys = Object.keys(payload);
        } catch (e) {
            meta.payloadKeys = [];
        }
    }
    
    logStructured(logger, {
        level: LOG_LEVELS.INFO,
        traceId: traceId,
        rpcName: rpcName,
        userId: userId,
        gameId: meta.gameId || null,
        event: 'rpc_start',
        message: 'RPC started',
        metadata: meta
    });
}

/**
 * Log RPC completion event
 * 
 * @param {object} logger - Nakama logger
 * @param {string} traceId - Trace ID
 * @param {string} rpcName - RPC name
 * @param {string} userId - User ID
 * @param {number} latencyMs - Request duration in milliseconds
 * @param {boolean} success - Whether RPC succeeded
 * @param {string} [errorCode] - Error code if failed
 * @param {object} [metadata] - Additional metadata
 */
function logRpcComplete(logger, traceId, rpcName, userId, latencyMs, success, errorCode, metadata) {
    logStructured(logger, {
        level: success ? LOG_LEVELS.INFO : LOG_LEVELS.WARN,
        traceId: traceId,
        rpcName: rpcName,
        userId: userId,
        latencyMs: latencyMs,
        result: success ? 'success' : 'error',
        errorCode: errorCode || null,
        event: 'rpc_complete',
        message: success ? 'RPC completed successfully' : 'RPC completed with error',
        metadata: metadata
    });
}

/**
 * Log RPC error event
 * 
 * @param {object} logger - Nakama logger
 * @param {string} traceId - Trace ID
 * @param {string} rpcName - RPC name
 * @param {string} userId - User ID
 * @param {number} latencyMs - Request duration in milliseconds
 * @param {Error|string} error - Error object or message
 * @param {string} [errorCode] - Error code
 */
function logRpcError(logger, traceId, rpcName, userId, latencyMs, error, errorCode) {
    var errorMessage = error instanceof Error ? error.message : String(error);
    var errorStack = error instanceof Error ? error.stack : null;
    
    logStructured(logger, {
        level: LOG_LEVELS.ERROR,
        traceId: traceId,
        rpcName: rpcName,
        userId: userId,
        latencyMs: latencyMs,
        result: 'error',
        errorCode: errorCode || 'INTERNAL_ERROR',
        errorMessage: errorMessage,
        event: 'rpc_error',
        message: 'RPC failed with exception',
        metadata: {
            errorStack: errorStack ? errorStack.substring(0, 500) : null
        }
    });
}

// ============================================================================
// PERFORMANCE TRACKING
// ============================================================================

/**
 * Create a simple performance timer
 * 
 * @returns {object} Timer object with elapsed() method
 */
function createTimer() {
    var startTime = Date.now();
    var startHrTime = startTime; // In V8 runtime, we use Date.now()
    
    return {
        /**
         * Get elapsed time in milliseconds
         * @returns {number} Elapsed milliseconds
         */
        elapsed: function() {
            return Date.now() - startTime;
        },
        
        /**
         * Get elapsed time and reset timer
         * @returns {number} Elapsed milliseconds
         */
        lap: function() {
            var elapsed = Date.now() - startTime;
            startTime = Date.now();
            return elapsed;
        },
        
        /**
         * Get start timestamp
         * @returns {number} Start timestamp
         */
        getStartTime: function() {
            return startHrTime;
        }
    };
}

// ============================================================================
// EXPORTS (for V8 runtime - global assignment)
// ============================================================================

// Make functions available globally for V8 runtime
if (typeof globalThis !== 'undefined') {
    globalThis.StructuredLogger = {
        // Core functions
        logStructured: logStructured,
        generateTraceId: generateTraceId,
        generateShortId: generateShortId,
        isValidTraceId: isValidTraceId,
        
        // Convenience logging
        logDebug: logDebug,
        logInfo: logInfo,
        logWarn: logWarn,
        logError: logError,
        
        // RPC lifecycle
        logRpcStart: logRpcStart,
        logRpcComplete: logRpcComplete,
        logRpcError: logRpcError,
        
        // Utilities
        safeSerialize: safeSerialize,
        safeStringify: safeStringify,
        createTimer: createTimer,
        
        // Constants
        LOG_LEVELS: LOG_LEVELS
    };
}
