/**
 * Standardized Error Handling for Nakama V8 Runtime
 * 
 * Provides:
 * - Error code constants with HTTP status mapping
 * - Error factory functions
 * - Error categorization (client vs server)
 * - Retry guidance for clients
 * - Error response formatting
 * 
 * @version 1.0.0
 * @date 2026-02-05
 */

// ============================================================================
// ERROR CODE DEFINITIONS
// ============================================================================

/**
 * Complete error code definitions with metadata
 * 
 * Each error code includes:
 * - code: String error code (returned to client)
 * - httpStatus: Equivalent HTTP status code
 * - category: 'client' or 'server' error
 * - retryable: Whether client should retry
 * - defaultMessage: Default error message
 */
var ERROR_DEFINITIONS = {
    // ========== CLIENT ERRORS (4xx) ==========
    
    // 400 Bad Request
    INVALID_PAYLOAD: {
        code: 'INVALID_PAYLOAD',
        httpStatus: 400,
        category: 'client',
        retryable: false,
        defaultMessage: 'The request payload is invalid or malformed.'
    },
    MISSING_FIELD: {
        code: 'MISSING_FIELD',
        httpStatus: 400,
        category: 'client',
        retryable: false,
        defaultMessage: 'A required field is missing from the request.'
    },
    INVALID_FIELD: {
        code: 'INVALID_FIELD',
        httpStatus: 400,
        category: 'client',
        retryable: false,
        defaultMessage: 'A field has an invalid value or format.'
    },
    INVALID_UUID: {
        code: 'INVALID_UUID',
        httpStatus: 400,
        category: 'client',
        retryable: false,
        defaultMessage: 'The provided UUID is not in valid format.'
    },
    INVALID_AMOUNT: {
        code: 'INVALID_AMOUNT',
        httpStatus: 400,
        category: 'client',
        retryable: false,
        defaultMessage: 'The amount must be a positive number.'
    },
    INVALID_CURRENCY: {
        code: 'INVALID_CURRENCY',
        httpStatus: 400,
        category: 'client',
        retryable: false,
        defaultMessage: 'The specified currency is not valid.'
    },
    INVALID_OPERATION: {
        code: 'INVALID_OPERATION',
        httpStatus: 400,
        category: 'client',
        retryable: false,
        defaultMessage: 'The operation type is not valid.'
    },
    VALIDATION_ERROR: {
        code: 'VALIDATION_ERROR',
        httpStatus: 400,
        category: 'client',
        retryable: false,
        defaultMessage: 'The request failed validation.'
    },
    
    // 401 Unauthorized
    UNAUTHORIZED: {
        code: 'UNAUTHORIZED',
        httpStatus: 401,
        category: 'client',
        retryable: false,
        defaultMessage: 'Authentication is required to access this resource.'
    },
    INVALID_TOKEN: {
        code: 'INVALID_TOKEN',
        httpStatus: 401,
        category: 'client',
        retryable: false,
        defaultMessage: 'The authentication token is invalid or expired.'
    },
    SESSION_EXPIRED: {
        code: 'SESSION_EXPIRED',
        httpStatus: 401,
        category: 'client',
        retryable: true,
        defaultMessage: 'Your session has expired. Please log in again.'
    },
    
    // 403 Forbidden
    FORBIDDEN: {
        code: 'FORBIDDEN',
        httpStatus: 403,
        category: 'client',
        retryable: false,
        defaultMessage: 'You do not have permission to access this resource.'
    },
    ADMIN_REQUIRED: {
        code: 'ADMIN_REQUIRED',
        httpStatus: 403,
        category: 'client',
        retryable: false,
        defaultMessage: 'Administrator access is required for this operation.'
    },
    INSUFFICIENT_BALANCE: {
        code: 'INSUFFICIENT_BALANCE',
        httpStatus: 403,
        category: 'client',
        retryable: false,
        defaultMessage: 'Insufficient balance for this operation.'
    },
    ALREADY_CLAIMED: {
        code: 'ALREADY_CLAIMED',
        httpStatus: 403,
        category: 'client',
        retryable: false,
        defaultMessage: 'This reward has already been claimed.'
    },
    NOT_ELIGIBLE: {
        code: 'NOT_ELIGIBLE',
        httpStatus: 403,
        category: 'client',
        retryable: false,
        defaultMessage: 'You are not eligible for this action.'
    },
    COOLDOWN_ACTIVE: {
        code: 'COOLDOWN_ACTIVE',
        httpStatus: 403,
        category: 'client',
        retryable: true,
        defaultMessage: 'Please wait before trying again.'
    },
    
    // 404 Not Found
    NOT_FOUND: {
        code: 'NOT_FOUND',
        httpStatus: 404,
        category: 'client',
        retryable: false,
        defaultMessage: 'The requested resource was not found.'
    },
    USER_NOT_FOUND: {
        code: 'USER_NOT_FOUND',
        httpStatus: 404,
        category: 'client',
        retryable: false,
        defaultMessage: 'The specified user was not found.'
    },
    GAME_NOT_FOUND: {
        code: 'GAME_NOT_FOUND',
        httpStatus: 404,
        category: 'client',
        retryable: false,
        defaultMessage: 'The specified game was not found.'
    },
    WALLET_NOT_FOUND: {
        code: 'WALLET_NOT_FOUND',
        httpStatus: 404,
        category: 'client',
        retryable: false,
        defaultMessage: 'The wallet was not found.'
    },
    ACHIEVEMENT_NOT_FOUND: {
        code: 'ACHIEVEMENT_NOT_FOUND',
        httpStatus: 404,
        category: 'client',
        retryable: false,
        defaultMessage: 'The specified achievement was not found.'
    },
    MISSION_NOT_FOUND: {
        code: 'MISSION_NOT_FOUND',
        httpStatus: 404,
        category: 'client',
        retryable: false,
        defaultMessage: 'The specified mission was not found.'
    },
    
    // 409 Conflict
    IDEMPOTENCY_CONFLICT: {
        code: 'IDEMPOTENCY_CONFLICT',
        httpStatus: 409,
        category: 'client',
        retryable: false,
        defaultMessage: 'This operation was already processed. Check your previous results.'
    },
    DUPLICATE_REQUEST: {
        code: 'DUPLICATE_REQUEST',
        httpStatus: 409,
        category: 'client',
        retryable: false,
        defaultMessage: 'A duplicate request was detected.'
    },
    ALREADY_EXISTS: {
        code: 'ALREADY_EXISTS',
        httpStatus: 409,
        category: 'client',
        retryable: false,
        defaultMessage: 'The resource already exists.'
    },
    VERSION_CONFLICT: {
        code: 'VERSION_CONFLICT',
        httpStatus: 409,
        category: 'client',
        retryable: true,
        defaultMessage: 'The resource was modified. Please refresh and try again.'
    },
    
    // 429 Too Many Requests
    RATE_LIMITED: {
        code: 'RATE_LIMITED',
        httpStatus: 429,
        category: 'client',
        retryable: true,
        defaultMessage: 'Too many requests. Please try again later.'
    },
    DAILY_LIMIT_REACHED: {
        code: 'DAILY_LIMIT_REACHED',
        httpStatus: 429,
        category: 'client',
        retryable: false,
        defaultMessage: 'You have reached the daily limit for this action.'
    },
    WEEKLY_LIMIT_REACHED: {
        code: 'WEEKLY_LIMIT_REACHED',
        httpStatus: 429,
        category: 'client',
        retryable: false,
        defaultMessage: 'You have reached the weekly limit for this action.'
    },
    
    // ========== SERVER ERRORS (5xx) ==========
    
    // 500 Internal Server Error
    INTERNAL_ERROR: {
        code: 'INTERNAL_ERROR',
        httpStatus: 500,
        category: 'server',
        retryable: true,
        defaultMessage: 'An internal error occurred. Please try again later.'
    },
    UNKNOWN: {
        code: 'UNKNOWN',
        httpStatus: 500,
        category: 'server',
        retryable: true,
        defaultMessage: 'An unexpected error occurred.'
    },
    
    // 502 Bad Gateway
    STORAGE_ERROR: {
        code: 'STORAGE_ERROR',
        httpStatus: 502,
        category: 'server',
        retryable: true,
        defaultMessage: 'A storage error occurred. Please try again.'
    },
    EXTERNAL_SERVICE_ERROR: {
        code: 'EXTERNAL_SERVICE_ERROR',
        httpStatus: 502,
        category: 'server',
        retryable: true,
        defaultMessage: 'An external service is unavailable.'
    },
    
    // 503 Service Unavailable
    SERVICE_UNAVAILABLE: {
        code: 'SERVICE_UNAVAILABLE',
        httpStatus: 503,
        category: 'server',
        retryable: true,
        defaultMessage: 'The service is temporarily unavailable.'
    },
    MAINTENANCE: {
        code: 'MAINTENANCE',
        httpStatus: 503,
        category: 'server',
        retryable: true,
        defaultMessage: 'The system is under maintenance. Please try again later.'
    },
    
    // 504 Gateway Timeout
    TIMEOUT: {
        code: 'TIMEOUT',
        httpStatus: 504,
        category: 'server',
        retryable: true,
        defaultMessage: 'The request timed out. Please try again.'
    }
};

// ============================================================================
// ERROR CODE CONSTANTS (for easy import)
// ============================================================================

var ErrorCodes = {};
var keys = Object.keys(ERROR_DEFINITIONS);
for (var i = 0; i < keys.length; i++) {
    ErrorCodes[keys[i]] = keys[i];
}

// ============================================================================
// ERROR FACTORY FUNCTIONS
// ============================================================================

/**
 * Get error definition by code
 * 
 * @param {string} code - Error code
 * @returns {object} Error definition or UNKNOWN definition
 */
function getErrorDefinition(code) {
    return ERROR_DEFINITIONS[code] || ERROR_DEFINITIONS.UNKNOWN;
}

/**
 * Create an error object with full metadata
 * 
 * @param {string} code - Error code
 * @param {string} [message] - Custom message (overrides default)
 * @param {object} [details] - Additional error details
 * @returns {object} Error object
 */
function createError(code, message, details) {
    var def = getErrorDefinition(code);
    
    var error = {
        code: def.code,
        message: message || def.defaultMessage,
        httpStatus: def.httpStatus,
        category: def.category,
        retryable: def.retryable
    };
    
    // Add details if provided
    if (details && typeof details === 'object') {
        error.details = {};
        var detailKeys = Object.keys(details);
        for (var i = 0; i < detailKeys.length; i++) {
            var key = detailKeys[i];
            // Sanitize details (remove sensitive info)
            if (key !== 'stack' && key !== 'password' && key !== 'token') {
                error.details[key] = details[key];
            }
        }
    }
    
    return error;
}

/**
 * Create an error response object for RPC return
 * 
 * @param {string} code - Error code
 * @param {string} [message] - Custom message
 * @param {string} [traceId] - Request trace ID
 * @param {object} [details] - Additional details
 * @returns {object} Error response object
 */
function createErrorResponse(code, message, traceId, details) {
    var error = createError(code, message, details);
    
    var response = {
        success: false,
        error: error.message,
        errorCode: error.code,
        retryable: error.retryable
    };
    
    if (traceId) {
        response.traceId = traceId;
    }
    
    // Add retry guidance for rate limiting
    if (details && details.retryAfter) {
        response.retryAfter = details.retryAfter;
    }
    
    // Add field info for validation errors
    if (details && details.field) {
        response.field = details.field;
    }
    
    if (details && details.fields) {
        response.fields = details.fields;
    }
    
    return response;
}

/**
 * Create a JSON error response string
 * 
 * @param {string} code - Error code
 * @param {string} [message] - Custom message
 * @param {string} [traceId] - Request trace ID
 * @param {object} [details] - Additional details
 * @returns {string} JSON response string
 */
function errorResponse(code, message, traceId, details) {
    return JSON.stringify(createErrorResponse(code, message, traceId, details));
}

// ============================================================================
// ERROR CHECKING UTILITIES
// ============================================================================

/**
 * Check if an error code is a client error
 * 
 * @param {string} code - Error code
 * @returns {boolean} True if client error
 */
function isClientError(code) {
    var def = getErrorDefinition(code);
    return def.category === 'client';
}

/**
 * Check if an error code is a server error
 * 
 * @param {string} code - Error code
 * @returns {boolean} True if server error
 */
function isServerError(code) {
    var def = getErrorDefinition(code);
    return def.category === 'server';
}

/**
 * Check if an error is retryable
 * 
 * @param {string} code - Error code
 * @returns {boolean} True if retryable
 */
function isRetryable(code) {
    var def = getErrorDefinition(code);
    return def.retryable;
}

/**
 * Get the HTTP status code for an error
 * 
 * @param {string} code - Error code
 * @returns {number} HTTP status code
 */
function getHttpStatus(code) {
    var def = getErrorDefinition(code);
    return def.httpStatus;
}

// ============================================================================
// VALIDATION ERROR HELPERS
// ============================================================================

/**
 * Create a missing field error response
 * 
 * @param {string|string[]} fields - Missing field name(s)
 * @param {string} [traceId] - Request trace ID
 * @returns {string} JSON error response
 */
function missingFieldError(fields, traceId) {
    var fieldList = Array.isArray(fields) ? fields : [fields];
    var message = 'Missing required field' + (fieldList.length > 1 ? 's' : '') + ': ' + fieldList.join(', ');
    
    return errorResponse(ErrorCodes.MISSING_FIELD, message, traceId, {
        fields: fieldList
    });
}

/**
 * Create an invalid field error response
 * 
 * @param {string} field - Field name
 * @param {string} reason - Why it's invalid
 * @param {*} [received] - Value that was received
 * @param {string} [traceId] - Request trace ID
 * @returns {string} JSON error response
 */
function invalidFieldError(field, reason, received, traceId) {
    var message = 'Invalid value for field "' + field + '": ' + reason;
    
    var details = { field: field };
    if (received !== undefined) {
        details.received = typeof received === 'object' ? '[object]' : String(received);
    }
    
    return errorResponse(ErrorCodes.INVALID_FIELD, message, traceId, details);
}

/**
 * Create an invalid UUID error response
 * 
 * @param {string} field - Field name (e.g., 'gameId', 'userId')
 * @param {*} [value] - Invalid value received
 * @param {string} [traceId] - Request trace ID
 * @returns {string} JSON error response
 */
function invalidUuidError(field, value, traceId) {
    var message = field + ' must be a valid UUID format';
    
    return errorResponse(ErrorCodes.INVALID_UUID, message, traceId, {
        field: field,
        received: value ? String(value).substring(0, 50) : undefined
    });
}

// ============================================================================
// CURRENCY ERROR HELPERS
// ============================================================================

/**
 * Create an insufficient balance error response
 * 
 * @param {string} currency - Currency type
 * @param {number} required - Amount required
 * @param {number} available - Amount available
 * @param {string} [traceId] - Request trace ID
 * @returns {string} JSON error response
 */
function insufficientBalanceError(currency, required, available, traceId) {
    var message = 'Insufficient ' + currency + ' balance. Required: ' + required + ', Available: ' + available;
    
    return errorResponse(ErrorCodes.INSUFFICIENT_BALANCE, message, traceId, {
        currency: currency,
        required: required,
        available: available,
        shortfall: required - available
    });
}

/**
 * Create an already claimed error response
 * 
 * @param {string} rewardType - Type of reward (e.g., 'daily_reward', 'mission_reward')
 * @param {string} [traceId] - Request trace ID
 * @returns {string} JSON error response
 */
function alreadyClaimedError(rewardType, traceId) {
    var message = 'This ' + rewardType.replace(/_/g, ' ') + ' has already been claimed.';
    
    return errorResponse(ErrorCodes.ALREADY_CLAIMED, message, traceId, {
        rewardType: rewardType
    });
}

// ============================================================================
// RATE LIMIT ERROR HELPERS
// ============================================================================

/**
 * Create a rate limit error response
 * 
 * @param {number} retryAfter - Seconds until rate limit resets
 * @param {number} [limit] - The rate limit
 * @param {string} [traceId] - Request trace ID
 * @returns {string} JSON error response
 */
function rateLimitError(retryAfter, limit, traceId) {
    var message = 'Rate limit exceeded. Please try again in ' + retryAfter + ' seconds.';
    
    return errorResponse(ErrorCodes.RATE_LIMITED, message, traceId, {
        retryAfter: retryAfter,
        limit: limit
    });
}

// ============================================================================
// AUTHENTICATION ERROR HELPERS
// ============================================================================

/**
 * Create an unauthorized error response
 * 
 * @param {string} [message] - Custom message
 * @param {string} [traceId] - Request trace ID
 * @returns {string} JSON error response
 */
function unauthorizedError(message, traceId) {
    return errorResponse(ErrorCodes.UNAUTHORIZED, message || 'User not authenticated', traceId);
}

/**
 * Create a forbidden error response
 * 
 * @param {string} [message] - Custom message
 * @param {string} [traceId] - Request trace ID
 * @returns {string} JSON error response
 */
function forbiddenError(message, traceId) {
    return errorResponse(ErrorCodes.FORBIDDEN, message || 'Access denied', traceId);
}

/**
 * Create an admin required error response
 * 
 * @param {string} [traceId] - Request trace ID
 * @returns {string} JSON error response
 */
function adminRequiredError(traceId) {
    return errorResponse(ErrorCodes.ADMIN_REQUIRED, 'Administrator access is required', traceId);
}

// ============================================================================
// EXPORTS (for V8 runtime - global assignment)
// ============================================================================

if (typeof globalThis !== 'undefined') {
    globalThis.RpcErrors = {
        // Error code constants
        Codes: ErrorCodes,
        
        // Error definitions (full metadata)
        Definitions: ERROR_DEFINITIONS,
        
        // Factory functions
        createError: createError,
        createErrorResponse: createErrorResponse,
        errorResponse: errorResponse,
        getErrorDefinition: getErrorDefinition,
        
        // Checking utilities
        isClientError: isClientError,
        isServerError: isServerError,
        isRetryable: isRetryable,
        getHttpStatus: getHttpStatus,
        
        // Validation errors
        missingFieldError: missingFieldError,
        invalidFieldError: invalidFieldError,
        invalidUuidError: invalidUuidError,
        
        // Currency errors
        insufficientBalanceError: insufficientBalanceError,
        alreadyClaimedError: alreadyClaimedError,
        
        // Rate limit errors
        rateLimitError: rateLimitError,
        
        // Auth errors
        unauthorizedError: unauthorizedError,
        forbiddenError: forbiddenError,
        adminRequiredError: adminRequiredError
    };
}
