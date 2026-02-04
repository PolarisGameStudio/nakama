/**
 * Middleware Framework for Nakama V8 Runtime RPCs
 * 
 * Provides:
 * - RPC wrapper with structured logging
 * - TraceId propagation
 * - Error handling and standardization
 * - Performance timing
 * - Response enrichment
 * - Composable middleware chain
 * 
 * Note: Rate limiting and idempotency are separate middleware
 * that can be composed with this framework.
 * 
 * @version 1.0.0
 * @date 2026-02-05
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

var MiddlewareConfig = {
    // Whether to include traceId in all responses
    includeTraceIdInResponse: true,
    
    // Whether to include latency in responses
    includeLatencyInResponse: true,
    
    // Whether to include rate limit info in responses
    includeRateLimitInfo: false,
    
    // Maximum error message length in responses
    maxErrorMessageLength: 500,
    
    // Whether to log payloads (be careful with sensitive data)
    logPayloads: false,
    
    // Whether to sanitize error messages for clients
    sanitizeClientErrors: true,
    
    // Default error message for internal errors
    defaultInternalErrorMessage: 'An internal error occurred. Please try again later.',
    
    // Request timeout warning threshold (ms)
    slowRequestThreshold: 1000
};

// ============================================================================
// ERROR CODES
// ============================================================================

var ErrorCodes = {
    // Client errors (4xx equivalent)
    INVALID_PAYLOAD: 'INVALID_PAYLOAD',
    MISSING_FIELD: 'MISSING_FIELD',
    INVALID_FIELD: 'INVALID_FIELD',
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN',
    NOT_FOUND: 'NOT_FOUND',
    RATE_LIMITED: 'RATE_LIMITED',
    IDEMPOTENCY_CONFLICT: 'IDEMPOTENCY_CONFLICT',
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    ALREADY_CLAIMED: 'ALREADY_CLAIMED',
    INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
    
    // Server errors (5xx equivalent)
    INTERNAL_ERROR: 'INTERNAL_ERROR',
    STORAGE_ERROR: 'STORAGE_ERROR',
    TIMEOUT: 'TIMEOUT',
    SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
    
    // Unknown
    UNKNOWN: 'UNKNOWN'
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Safely parse JSON payload
 * @param {string} payload - JSON string
 * @returns {object} { success, data, error }
 */
function safeParsePayload(payload) {
    // Handle null/undefined
    if (payload === null || payload === undefined) {
        return { success: true, data: {}, error: null };
    }
    
    // Handle empty string
    if (payload === '' || payload === '{}') {
        return { success: true, data: {}, error: null };
    }
    
    // Handle already parsed object
    if (typeof payload === 'object') {
        return { success: true, data: payload, error: null };
    }
    
    // Parse string
    if (typeof payload !== 'string') {
        return { 
            success: false, 
            data: null, 
            error: 'Payload must be a JSON string' 
        };
    }
    
    try {
        var data = JSON.parse(payload);
        return { success: true, data: data, error: null };
    } catch (err) {
        return { 
            success: false, 
            data: null, 
            error: 'Invalid JSON: ' + (err.message || 'parse error') 
        };
    }
}

/**
 * Create a standardized error response
 * @param {string} errorCode - Error code
 * @param {string} message - Error message
 * @param {string} traceId - Request trace ID
 * @param {object} [details] - Additional error details
 * @returns {object} Error response object
 */
function createErrorResponse(errorCode, message, traceId, details) {
    var response = {
        success: false,
        error: message,
        errorCode: errorCode || ErrorCodes.UNKNOWN,
        traceId: traceId || 'unknown'
    };
    
    // Add details if provided (but sanitize for client)
    if (details && typeof details === 'object') {
        // Only include safe fields
        if (details.field) response.field = details.field;
        if (details.expected) response.expected = details.expected;
        if (details.received !== undefined) {
            response.received = typeof details.received === 'object' ? 
                '[object]' : String(details.received);
        }
        if (details.retryAfter) response.retryAfter = details.retryAfter;
    }
    
    return response;
}

/**
 * Create a standardized success response
 * @param {object} data - Response data
 * @param {string} traceId - Request trace ID
 * @param {number} [latencyMs] - Request latency
 * @returns {object} Success response object
 */
function createSuccessResponse(data, traceId, latencyMs) {
    var response = {
        success: true
    };
    
    // Merge data into response
    if (data && typeof data === 'object') {
        var keys = Object.keys(data);
        for (var i = 0; i < keys.length; i++) {
            var key = keys[i];
            // Don't overwrite success or reserved fields
            if (key !== 'success' && key !== 'traceId' && key !== 'latencyMs') {
                response[key] = data[key];
            }
        }
    }
    
    // Add traceId if configured
    if (MiddlewareConfig.includeTraceIdInResponse && traceId) {
        response.traceId = traceId;
    }
    
    // Add latency if configured
    if (MiddlewareConfig.includeLatencyInResponse && typeof latencyMs === 'number') {
        response.latencyMs = latencyMs;
    }
    
    return response;
}

/**
 * Truncate string to max length
 * @param {string} str - String to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated string
 */
function truncateString(str, maxLength) {
    if (!str || typeof str !== 'string') return str;
    if (str.length <= maxLength) return str;
    return str.substring(0, maxLength - 3) + '...';
}

/**
 * Extract gameId from payload
 * @param {object} data - Parsed payload
 * @returns {string|null} Game ID or null
 */
function extractGameId(data) {
    if (!data || typeof data !== 'object') return null;
    return data.gameId || data.game_id || data.gameid || null;
}

/**
 * Check if value is a valid UUID
 * @param {*} value - Value to check
 * @returns {boolean} True if valid UUID
 */
function isValidUUID(value) {
    if (!value || typeof value !== 'string') return false;
    var uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
    return uuidRegex.test(value);
}

// ============================================================================
// MIDDLEWARE WRAPPER
// ============================================================================

/**
 * Wrap an RPC function with middleware (logging, timing, error handling)
 * 
 * This is the main middleware wrapper that provides:
 * - Structured JSON logging (start, complete, error)
 * - TraceId generation and propagation
 * - Performance timing
 * - Error handling and standardization
 * - Response enrichment with traceId
 * 
 * @param {function} rpcFunction - Original RPC handler
 * @param {string} rpcName - Name of the RPC
 * @param {object} [options] - Additional options
 * @param {boolean} [options.logPayload=false] - Log request payload
 * @param {boolean} [options.logResponse=false] - Log response data
 * @param {string} [options.domain] - RPC domain for logging
 * @returns {function} Wrapped RPC function
 */
function withMiddleware(rpcFunction, rpcName, options) {
    // Validate inputs
    if (typeof rpcFunction !== 'function') {
        throw new Error('withMiddleware: rpcFunction must be a function');
    }
    if (!rpcName || typeof rpcName !== 'string') {
        throw new Error('withMiddleware: rpcName must be a non-empty string');
    }
    
    options = options || {};
    
    return function wrappedRpc(ctx, logger, nk, payload) {
        // ====== SETUP ======
        var startTime = Date.now();
        
        // Generate or extract traceId
        var traceId = (ctx && ctx.traceId) ? ctx.traceId : null;
        if (!traceId) {
            // Check if traceId is in payload
            try {
                var payloadData = typeof payload === 'string' ? JSON.parse(payload || '{}') : (payload || {});
                traceId = payloadData.traceId || payloadData.trace_id;
            } catch (e) {
                // Ignore parse errors for traceId extraction
            }
        }
        
        // Generate traceId if not provided
        if (!traceId && typeof globalThis !== 'undefined' && globalThis.StructuredLogger) {
            traceId = globalThis.StructuredLogger.generateTraceId();
        } else if (!traceId) {
            traceId = 'trace-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
        }
        
        // Store traceId in context for downstream use
        if (ctx && typeof ctx === 'object') {
            ctx.traceId = traceId;
        }
        
        // Get userId safely
        var userId = (ctx && ctx.userId) ? ctx.userId : null;
        
        // ====== LOG START ======
        try {
            if (typeof globalThis !== 'undefined' && globalThis.StructuredLogger) {
                var parsedPayload = null;
                if (options.logPayload) {
                    try {
                        parsedPayload = typeof payload === 'string' ? JSON.parse(payload || '{}') : payload;
                    } catch (e) {
                        parsedPayload = { _parseError: true };
                    }
                }
                globalThis.StructuredLogger.logRpcStart(logger, traceId, rpcName, userId, parsedPayload);
            } else {
                // Fallback to basic logging
                logger.info('[' + rpcName + '][' + traceId + '] RPC started - userId: ' + userId);
            }
        } catch (logErr) {
            // Don't fail the RPC if logging fails
            try {
                logger.warn('[' + rpcName + '] Failed to log RPC start: ' + logErr.message);
            } catch (e) { /* ignore */ }
        }
        
        // ====== EXECUTE RPC ======
        var result;
        var success = false;
        var errorCode = null;
        var errorMessage = null;
        
        try {
            // Call the original RPC function
            result = rpcFunction(ctx, logger, nk, payload);
            
            // Parse result to check success
            var parsedResult = null;
            if (result && typeof result === 'string') {
                try {
                    parsedResult = JSON.parse(result);
                } catch (e) {
                    // Result is not JSON, wrap it
                    parsedResult = { data: result };
                }
            } else if (result && typeof result === 'object') {
                parsedResult = result;
            } else {
                parsedResult = {};
            }
            
            // Check if RPC reported success
            success = parsedResult.success !== false;
            
            if (!success) {
                errorCode = parsedResult.errorCode || ErrorCodes.UNKNOWN;
                errorMessage = parsedResult.error || 'RPC returned failure';
            }
            
            // Enrich response with traceId
            if (MiddlewareConfig.includeTraceIdInResponse) {
                if (typeof parsedResult === 'object') {
                    parsedResult.traceId = traceId;
                    
                    // Add latency if configured
                    if (MiddlewareConfig.includeLatencyInResponse) {
                        parsedResult.latencyMs = Date.now() - startTime;
                    }
                    
                    result = JSON.stringify(parsedResult);
                }
            }
            
        } catch (err) {
            // ====== HANDLE EXCEPTION ======
            success = false;
            errorCode = ErrorCodes.INTERNAL_ERROR;
            errorMessage = err.message || 'Unknown error';
            
            // Log the error
            var latencyMs = Date.now() - startTime;
            
            try {
                if (typeof globalThis !== 'undefined' && globalThis.StructuredLogger) {
                    globalThis.StructuredLogger.logRpcError(
                        logger, traceId, rpcName, userId, latencyMs, err, errorCode
                    );
                } else {
                    logger.error('[' + rpcName + '][' + traceId + '] Exception: ' + errorMessage);
                }
            } catch (logErr) {
                try {
                    logger.error('[' + rpcName + '] Exception: ' + errorMessage + ' (logging also failed)');
                } catch (e) { /* ignore */ }
            }
            
            // Create error response
            var clientMessage = MiddlewareConfig.sanitizeClientErrors ? 
                MiddlewareConfig.defaultInternalErrorMessage : 
                truncateString(errorMessage, MiddlewareConfig.maxErrorMessageLength);
            
            result = JSON.stringify(createErrorResponse(
                errorCode,
                clientMessage,
                traceId,
                { originalError: MiddlewareConfig.sanitizeClientErrors ? undefined : errorMessage }
            ));
        }
        
        // ====== LOG COMPLETION ======
        var finalLatencyMs = Date.now() - startTime;
        
        try {
            if (typeof globalThis !== 'undefined' && globalThis.StructuredLogger) {
                globalThis.StructuredLogger.logRpcComplete(
                    logger, traceId, rpcName, userId, finalLatencyMs, success, errorCode,
                    options.logResponse ? { responseLength: result ? result.length : 0 } : null
                );
            } else {
                var status = success ? 'SUCCESS' : 'ERROR';
                logger.info('[' + rpcName + '][' + traceId + '] ' + status + ' in ' + finalLatencyMs + 'ms');
            }
            
            // Warn on slow requests
            if (finalLatencyMs > MiddlewareConfig.slowRequestThreshold) {
                logger.warn('[' + rpcName + '][' + traceId + '] SLOW REQUEST: ' + finalLatencyMs + 'ms');
            }
        } catch (logErr) {
            // Don't fail if logging fails
        }
        
        return result;
    };
}

// ============================================================================
// MIDDLEWARE COMPOSITION
// ============================================================================

/**
 * Compose multiple middleware functions
 * Middleware are applied in order: first middleware wraps second, etc.
 * 
 * @param {...function} middlewares - Middleware functions
 * @returns {function} Composed middleware
 * 
 * @example
 * var wrapped = compose(
 *   withRateLimit,
 *   withMiddleware
 * )(rpcFunction, 'my_rpc', options);
 */
function compose() {
    var middlewares = Array.prototype.slice.call(arguments);
    
    if (middlewares.length === 0) {
        return function(fn) { return fn; };
    }
    
    if (middlewares.length === 1) {
        return middlewares[0];
    }
    
    return function(rpcFunction, rpcName, options) {
        var wrapped = rpcFunction;
        
        // Apply middlewares in reverse order (innermost first)
        for (var i = middlewares.length - 1; i >= 0; i--) {
            wrapped = middlewares[i](wrapped, rpcName, options);
        }
        
        return wrapped;
    };
}

/**
 * Create a middleware that validates required fields in payload
 * 
 * @param {string[]} requiredFields - Array of required field names
 * @returns {function} Middleware function
 */
function withValidation(requiredFields) {
    return function(rpcFunction, rpcName, options) {
        return function(ctx, logger, nk, payload) {
            // Get traceId from context or generate
            var traceId = (ctx && ctx.traceId) || 'no-trace';
            
            // Parse payload
            var parsed = safeParsePayload(payload);
            if (!parsed.success) {
                return JSON.stringify(createErrorResponse(
                    ErrorCodes.INVALID_PAYLOAD,
                    parsed.error,
                    traceId
                ));
            }
            
            var data = parsed.data;
            
            // Check required fields
            var missing = [];
            for (var i = 0; i < requiredFields.length; i++) {
                var field = requiredFields[i];
                if (!data.hasOwnProperty(field) || 
                    data[field] === null || 
                    data[field] === undefined) {
                    missing.push(field);
                }
            }
            
            if (missing.length > 0) {
                return JSON.stringify(createErrorResponse(
                    ErrorCodes.MISSING_FIELD,
                    'Missing required fields: ' + missing.join(', '),
                    traceId,
                    { fields: missing }
                ));
            }
            
            // Call original function
            return rpcFunction(ctx, logger, nk, payload);
        };
    };
}

/**
 * Create a middleware that validates gameId is a valid UUID
 * 
 * @returns {function} Middleware function
 */
function withGameIdValidation() {
    return function(rpcFunction, rpcName, options) {
        return function(ctx, logger, nk, payload) {
            var traceId = (ctx && ctx.traceId) || 'no-trace';
            
            // Parse payload
            var parsed = safeParsePayload(payload);
            if (!parsed.success) {
                return JSON.stringify(createErrorResponse(
                    ErrorCodes.INVALID_PAYLOAD,
                    parsed.error,
                    traceId
                ));
            }
            
            var gameId = extractGameId(parsed.data);
            
            if (gameId && !isValidUUID(gameId)) {
                return JSON.stringify(createErrorResponse(
                    ErrorCodes.INVALID_FIELD,
                    'Invalid gameId UUID format',
                    traceId,
                    { field: 'gameId', received: gameId }
                ));
            }
            
            return rpcFunction(ctx, logger, nk, payload);
        };
    };
}

/**
 * Create a middleware that requires authentication
 * 
 * @returns {function} Middleware function
 */
function withAuthentication() {
    return function(rpcFunction, rpcName, options) {
        return function(ctx, logger, nk, payload) {
            var traceId = (ctx && ctx.traceId) || 'no-trace';
            
            if (!ctx || !ctx.userId) {
                return JSON.stringify(createErrorResponse(
                    ErrorCodes.UNAUTHORIZED,
                    'User not authenticated',
                    traceId
                ));
            }
            
            return rpcFunction(ctx, logger, nk, payload);
        };
    };
}

// ============================================================================
// UTILITY FUNCTIONS FOR WRAPPED RPCS
// ============================================================================

/**
 * Create a standardized RPC response from within an RPC handler
 * Use this in your RPC handlers for consistent responses
 * 
 * @param {boolean} success - Whether the operation succeeded
 * @param {object} data - Response data
 * @param {string} [traceId] - Trace ID (from ctx.traceId)
 * @returns {string} JSON response string
 */
function rpcResponse(success, data, traceId) {
    if (success) {
        return JSON.stringify(createSuccessResponse(data, traceId));
    } else {
        var errorCode = (data && data.errorCode) || ErrorCodes.UNKNOWN;
        var errorMessage = (data && (data.error || data.message)) || 'Operation failed';
        return JSON.stringify(createErrorResponse(errorCode, errorMessage, traceId, data));
    }
}

/**
 * Create a success response from within an RPC handler
 * 
 * @param {object} data - Response data
 * @param {object} [ctx] - Request context (for traceId)
 * @returns {string} JSON response string
 */
function rpcSuccess(data, ctx) {
    var traceId = (ctx && ctx.traceId) || null;
    return JSON.stringify(createSuccessResponse(data, traceId));
}

/**
 * Create an error response from within an RPC handler
 * 
 * @param {string} errorCode - Error code
 * @param {string} message - Error message
 * @param {object} [ctx] - Request context (for traceId)
 * @param {object} [details] - Additional error details
 * @returns {string} JSON response string
 */
function rpcError(errorCode, message, ctx, details) {
    var traceId = (ctx && ctx.traceId) || null;
    return JSON.stringify(createErrorResponse(errorCode, message, traceId, details));
}

// ============================================================================
// EXPORTS (for V8 runtime - global assignment)
// ============================================================================

if (typeof globalThis !== 'undefined') {
    globalThis.RpcMiddleware = {
        // Core middleware
        withMiddleware: withMiddleware,
        
        // Composition
        compose: compose,
        
        // Validation middlewares
        withValidation: withValidation,
        withGameIdValidation: withGameIdValidation,
        withAuthentication: withAuthentication,
        
        // Response helpers
        rpcResponse: rpcResponse,
        rpcSuccess: rpcSuccess,
        rpcError: rpcError,
        createErrorResponse: createErrorResponse,
        createSuccessResponse: createSuccessResponse,
        
        // Utilities
        safeParsePayload: safeParsePayload,
        extractGameId: extractGameId,
        isValidUUID: isValidUUID,
        
        // Error codes
        ErrorCodes: ErrorCodes,
        
        // Configuration
        Config: MiddlewareConfig
    };
}
