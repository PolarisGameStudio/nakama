/**
 * Input Validation Framework for Nakama Backend
 * PR #5: Centralized validation schemas and functions
 * 
 * Features:
 * - Predefined validation schemas for common patterns
 * - Type checking, range validation, pattern matching
 * - Nested object validation
 * - Custom validator support
 * - Detailed error messages with field paths
 */

// ============================================================================
// VALIDATION TYPES
// ============================================================================

var VALIDATION_TYPES = {
    STRING: 'string',
    NUMBER: 'number',
    INTEGER: 'integer',
    BOOLEAN: 'boolean',
    ARRAY: 'array',
    OBJECT: 'object',
    UUID: 'uuid',
    EMAIL: 'email',
    DATE: 'date',
    ENUM: 'enum',
    ANY: 'any'
};

// ============================================================================
// COMMON PATTERNS (Regex)
// ============================================================================

var PATTERNS = {
    UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    GAME_ID: /^[a-z0-9_-]{1,64}$/i,
    CURRENCY_CODE: /^[A-Z]{3,10}$/,
    ALPHANUM: /^[a-zA-Z0-9]+$/,
    ALPHANUM_UNDERSCORE: /^[a-zA-Z0-9_]+$/,
    SLUG: /^[a-z0-9-]+$/,
    ISO_DATE: /^\d{4}-\d{2}-\d{2}$/,
    ISO_DATETIME: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/
};

// ============================================================================
// PREDEFINED SCHEMAS
// ============================================================================

var SCHEMAS = {
    // Game identifier
    gameId: {
        type: VALIDATION_TYPES.STRING,
        required: true,
        minLength: 1,
        maxLength: 64,
        pattern: PATTERNS.GAME_ID,
        errorMessage: 'Invalid game_id format (alphanumeric, underscores, hyphens, max 64 chars)'
    },
    
    // User identifier (UUID)
    userId: {
        type: VALIDATION_TYPES.UUID,
        required: true,
        errorMessage: 'Invalid user_id format (must be UUID)'
    },
    
    // Currency code
    currencyCode: {
        type: VALIDATION_TYPES.STRING,
        required: true,
        minLength: 3,
        maxLength: 10,
        pattern: PATTERNS.CURRENCY_CODE,
        errorMessage: 'Invalid currency code (3-10 uppercase letters)'
    },
    
    // Currency amount (positive integer)
    amount: {
        type: VALIDATION_TYPES.INTEGER,
        required: true,
        min: 0,
        max: 999999999,
        errorMessage: 'Invalid amount (must be non-negative integer, max 999999999)'
    },
    
    // Positive amount (must be > 0)
    positiveAmount: {
        type: VALIDATION_TYPES.INTEGER,
        required: true,
        min: 1,
        max: 999999999,
        errorMessage: 'Invalid amount (must be positive integer)'
    },
    
    // Score value
    score: {
        type: VALIDATION_TYPES.INTEGER,
        required: true,
        min: 0,
        max: 999999999,
        errorMessage: 'Invalid score (must be non-negative integer)'
    },
    
    // Leaderboard period
    period: {
        type: VALIDATION_TYPES.ENUM,
        required: true,
        values: ['daily', 'weekly', 'monthly', 'alltime', 'all_time'],
        errorMessage: 'Invalid period (must be daily, weekly, monthly, or alltime)'
    },
    
    // Pagination limit
    limit: {
        type: VALIDATION_TYPES.INTEGER,
        required: false,
        default: 10,
        min: 1,
        max: 100,
        errorMessage: 'Invalid limit (must be 1-100)'
    },
    
    // Pagination offset
    offset: {
        type: VALIDATION_TYPES.INTEGER,
        required: false,
        default: 0,
        min: 0,
        max: 10000,
        errorMessage: 'Invalid offset (must be 0-10000)'
    },
    
    // Generic string (non-empty)
    nonEmptyString: {
        type: VALIDATION_TYPES.STRING,
        required: true,
        minLength: 1,
        maxLength: 1000,
        errorMessage: 'Field must be a non-empty string (max 1000 chars)'
    },
    
    // Optional string
    optionalString: {
        type: VALIDATION_TYPES.STRING,
        required: false,
        maxLength: 1000
    },
    
    // Boolean flag
    booleanFlag: {
        type: VALIDATION_TYPES.BOOLEAN,
        required: false,
        default: false
    },
    
    // Timestamp (Unix epoch seconds or milliseconds)
    timestamp: {
        type: VALIDATION_TYPES.INTEGER,
        required: false,
        min: 0,
        max: 9999999999999, // Supports both seconds and milliseconds
        errorMessage: 'Invalid timestamp'
    },
    
    // Idempotency key
    idempotencyKey: {
        type: VALIDATION_TYPES.STRING,
        required: false,
        minLength: 1,
        maxLength: 128,
        errorMessage: 'Invalid idempotency key (max 128 chars)'
    },
    
    // Email address
    email: {
        type: VALIDATION_TYPES.EMAIL,
        required: true,
        errorMessage: 'Invalid email address format'
    },
    
    // Display name
    displayName: {
        type: VALIDATION_TYPES.STRING,
        required: false,
        minLength: 1,
        maxLength: 50,
        errorMessage: 'Invalid display name (1-50 characters)'
    }
};

// ============================================================================
// COMPOSITE SCHEMAS (for common RPC payloads)
// ============================================================================

var COMPOSITE_SCHEMAS = {
    // Wallet operations
    walletUpdate: {
        game_id: SCHEMAS.gameId,
        currency: SCHEMAS.currencyCode,
        amount: SCHEMAS.amount,
        reason: SCHEMAS.optionalString
    },
    
    // Score submission
    scoreSubmit: {
        game_id: SCHEMAS.gameId,
        score: SCHEMAS.score,
        metadata: { type: VALIDATION_TYPES.OBJECT, required: false }
    },
    
    // Leaderboard query
    leaderboardQuery: {
        game_id: SCHEMAS.gameId,
        period: SCHEMAS.period,
        limit: SCHEMAS.limit,
        offset: SCHEMAS.offset
    },
    
    // Daily rewards claim
    dailyRewardsClaim: {
        game_id: SCHEMAS.gameId,
        idempotencyKey: SCHEMAS.idempotencyKey
    },
    
    // Mission claim
    missionClaim: {
        game_id: SCHEMAS.gameId,
        mission_id: SCHEMAS.nonEmptyString,
        idempotencyKey: SCHEMAS.idempotencyKey
    },
    
    // Generic game operation
    gameOperation: {
        game_id: SCHEMAS.gameId
    },
    
    // Pagination
    paginated: {
        limit: SCHEMAS.limit,
        offset: SCHEMAS.offset
    }
};

// ============================================================================
// CORE VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate a single value against a schema
 * @param {*} value - Value to validate
 * @param {object} schema - Schema definition
 * @param {string} fieldPath - Path to field for error messages
 * @returns {object} { valid: boolean, error: string|null, value: * }
 */
function validateValue(value, schema, fieldPath) {
    fieldPath = fieldPath || 'value';
    
    // Handle undefined/null
    if (value === undefined || value === null) {
        if (schema.required) {
            return {
                valid: false,
                error: fieldPath + ' is required',
                errorCode: 'MISSING_FIELD',
                field: fieldPath
            };
        }
        // Return default if available
        if (schema.default !== undefined) {
            return { valid: true, error: null, value: schema.default };
        }
        return { valid: true, error: null, value: value };
    }
    
    var type = schema.type || VALIDATION_TYPES.ANY;
    
    // Type validation
    switch (type) {
        case VALIDATION_TYPES.STRING:
            if (typeof value !== 'string') {
                return {
                    valid: false,
                    error: fieldPath + ' must be a string',
                    errorCode: 'INVALID_TYPE',
                    field: fieldPath
                };
            }
            break;
            
        case VALIDATION_TYPES.NUMBER:
            if (typeof value !== 'number' || isNaN(value)) {
                return {
                    valid: false,
                    error: fieldPath + ' must be a number',
                    errorCode: 'INVALID_TYPE',
                    field: fieldPath
                };
            }
            break;
            
        case VALIDATION_TYPES.INTEGER:
            if (typeof value !== 'number' || !Number.isInteger(value)) {
                // Try to parse string as integer
                if (typeof value === 'string') {
                    var parsed = parseInt(value, 10);
                    if (!isNaN(parsed) && parsed.toString() === value.trim()) {
                        value = parsed;
                    } else {
                        return {
                            valid: false,
                            error: fieldPath + ' must be an integer',
                            errorCode: 'INVALID_TYPE',
                            field: fieldPath
                        };
                    }
                } else {
                    return {
                        valid: false,
                        error: fieldPath + ' must be an integer',
                        errorCode: 'INVALID_TYPE',
                        field: fieldPath
                    };
                }
            }
            break;
            
        case VALIDATION_TYPES.BOOLEAN:
            if (typeof value !== 'boolean') {
                // Accept string 'true'/'false'
                if (value === 'true') value = true;
                else if (value === 'false') value = false;
                else {
                    return {
                        valid: false,
                        error: fieldPath + ' must be a boolean',
                        errorCode: 'INVALID_TYPE',
                        field: fieldPath
                    };
                }
            }
            break;
            
        case VALIDATION_TYPES.ARRAY:
            if (!Array.isArray(value)) {
                return {
                    valid: false,
                    error: fieldPath + ' must be an array',
                    errorCode: 'INVALID_TYPE',
                    field: fieldPath
                };
            }
            break;
            
        case VALIDATION_TYPES.OBJECT:
            if (typeof value !== 'object' || value === null || Array.isArray(value)) {
                return {
                    valid: false,
                    error: fieldPath + ' must be an object',
                    errorCode: 'INVALID_TYPE',
                    field: fieldPath
                };
            }
            break;
            
        case VALIDATION_TYPES.UUID:
            if (typeof value !== 'string' || !PATTERNS.UUID.test(value)) {
                return {
                    valid: false,
                    error: schema.errorMessage || (fieldPath + ' must be a valid UUID'),
                    errorCode: 'INVALID_FORMAT',
                    field: fieldPath
                };
            }
            break;
            
        case VALIDATION_TYPES.EMAIL:
            if (typeof value !== 'string' || !PATTERNS.EMAIL.test(value)) {
                return {
                    valid: false,
                    error: schema.errorMessage || (fieldPath + ' must be a valid email'),
                    errorCode: 'INVALID_FORMAT',
                    field: fieldPath
                };
            }
            break;
            
        case VALIDATION_TYPES.ENUM:
            if (!schema.values || schema.values.indexOf(value) === -1) {
                return {
                    valid: false,
                    error: schema.errorMessage || (fieldPath + ' must be one of: ' + (schema.values || []).join(', ')),
                    errorCode: 'INVALID_VALUE',
                    field: fieldPath
                };
            }
            break;
    }
    
    // String length validation
    if (typeof value === 'string') {
        if (schema.minLength !== undefined && value.length < schema.minLength) {
            return {
                valid: false,
                error: fieldPath + ' must be at least ' + schema.minLength + ' characters',
                errorCode: 'TOO_SHORT',
                field: fieldPath
            };
        }
        if (schema.maxLength !== undefined && value.length > schema.maxLength) {
            return {
                valid: false,
                error: fieldPath + ' must be at most ' + schema.maxLength + ' characters',
                errorCode: 'TOO_LONG',
                field: fieldPath
            };
        }
    }
    
    // Number range validation
    if (typeof value === 'number') {
        if (schema.min !== undefined && value < schema.min) {
            return {
                valid: false,
                error: fieldPath + ' must be at least ' + schema.min,
                errorCode: 'TOO_SMALL',
                field: fieldPath
            };
        }
        if (schema.max !== undefined && value > schema.max) {
            return {
                valid: false,
                error: fieldPath + ' must be at most ' + schema.max,
                errorCode: 'TOO_LARGE',
                field: fieldPath
            };
        }
    }
    
    // Array length validation
    if (Array.isArray(value)) {
        if (schema.minItems !== undefined && value.length < schema.minItems) {
            return {
                valid: false,
                error: fieldPath + ' must have at least ' + schema.minItems + ' items',
                errorCode: 'TOO_FEW_ITEMS',
                field: fieldPath
            };
        }
        if (schema.maxItems !== undefined && value.length > schema.maxItems) {
            return {
                valid: false,
                error: fieldPath + ' must have at most ' + schema.maxItems + ' items',
                errorCode: 'TOO_MANY_ITEMS',
                field: fieldPath
            };
        }
    }
    
    // Pattern validation
    if (schema.pattern && typeof value === 'string') {
        var regex = schema.pattern instanceof RegExp ? schema.pattern : new RegExp(schema.pattern);
        if (!regex.test(value)) {
            return {
                valid: false,
                error: schema.errorMessage || (fieldPath + ' has invalid format'),
                errorCode: 'INVALID_FORMAT',
                field: fieldPath
            };
        }
    }
    
    // Custom validator
    if (schema.custom && typeof schema.custom === 'function') {
        var customResult = schema.custom(value, fieldPath);
        if (customResult !== true) {
            return {
                valid: false,
                error: typeof customResult === 'string' ? customResult : (fieldPath + ' failed custom validation'),
                errorCode: 'CUSTOM_VALIDATION_FAILED',
                field: fieldPath
            };
        }
    }
    
    return { valid: true, error: null, value: value };
}

/**
 * Validate an object against a schema
 * @param {object} data - Data object to validate
 * @param {object} schema - Schema object with field definitions
 * @param {object} options - { strict: boolean, stripUnknown: boolean }
 * @returns {object} { valid: boolean, errors: array, data: object }
 */
function validateObject(data, schema, options) {
    options = options || {};
    var strict = options.strict !== false;
    var stripUnknown = options.stripUnknown === true;
    
    var errors = [];
    var validatedData = {};
    
    // Parse string payload
    if (typeof data === 'string') {
        try {
            data = JSON.parse(data);
        } catch (e) {
            return {
                valid: false,
                errors: [{ field: 'payload', error: 'Invalid JSON payload', errorCode: 'INVALID_JSON' }],
                data: null
            };
        }
    }
    
    if (!data || typeof data !== 'object') {
        return {
            valid: false,
            errors: [{ field: 'payload', error: 'Payload must be an object', errorCode: 'INVALID_PAYLOAD' }],
            data: null
        };
    }
    
    // Validate each field in schema
    for (var fieldName in schema) {
        if (schema.hasOwnProperty(fieldName)) {
            var fieldSchema = schema[fieldName];
            var fieldValue = data[fieldName];
            
            // Also check snake_case variant
            if (fieldValue === undefined) {
                var snakeCase = fieldName.replace(/([A-Z])/g, '_$1').toLowerCase();
                if (data[snakeCase] !== undefined) {
                    fieldValue = data[snakeCase];
                }
            }
            
            var result = validateValue(fieldValue, fieldSchema, fieldName);
            
            if (!result.valid) {
                errors.push({
                    field: result.field,
                    error: result.error,
                    errorCode: result.errorCode
                });
            } else {
                validatedData[fieldName] = result.value;
            }
        }
    }
    
    // Check for unknown fields in strict mode
    if (strict && !stripUnknown) {
        for (var key in data) {
            if (data.hasOwnProperty(key) && !schema.hasOwnProperty(key)) {
                // Check if it's a snake_case variant
                var camelCase = key.replace(/_([a-z])/g, function(m, p1) { return p1.toUpperCase(); });
                if (!schema.hasOwnProperty(camelCase)) {
                    // Allow common fields
                    if (['idempotencyKey', 'idempotency_key', 'traceId', 'trace_id', 'requestId', 'request_id'].indexOf(key) === -1) {
                        // Just copy unknown fields, don't error
                        validatedData[key] = data[key];
                    }
                }
            }
        }
    }
    
    // Copy through allowed unknown fields
    if (!stripUnknown) {
        for (var k in data) {
            if (data.hasOwnProperty(k) && validatedData[k] === undefined) {
                validatedData[k] = data[k];
            }
        }
    }
    
    return {
        valid: errors.length === 0,
        errors: errors,
        data: errors.length === 0 ? validatedData : null
    };
}

/**
 * Quick validation helper - validates and returns data or throws
 * @param {object} data - Data to validate
 * @param {object} schema - Schema to validate against
 * @returns {object} Validated data
 * @throws {Error} If validation fails
 */
function validate(data, schema) {
    var result = validateObject(data, schema);
    if (!result.valid) {
        var error = new Error(result.errors[0].error);
        error.code = result.errors[0].errorCode;
        error.field = result.errors[0].field;
        error.errors = result.errors;
        throw error;
    }
    return result.data;
}

/**
 * Create validation error response
 */
function createValidationErrorResponse(errors, traceId) {
    var firstError = errors[0] || { error: 'Validation failed', errorCode: 'VALIDATION_ERROR', field: 'unknown' };
    
    return {
        success: false,
        error: firstError.error,
        errorCode: firstError.errorCode,
        field: firstError.field,
        traceId: traceId || 'no-trace',
        validationErrors: errors
    };
}

// ============================================================================
// MIDDLEWARE WRAPPER
// ============================================================================

/**
 * Validation middleware wrapper
 * Validates request payload before executing RPC
 * 
 * @param {function} rpcFunction - Original RPC function
 * @param {string} rpcName - RPC name for logging
 * @param {object} schema - Validation schema
 * @param {object} options - { strict: boolean }
 */
function withValidation(rpcFunction, rpcName, schema, options) {
    if (typeof rpcFunction !== 'function') {
        throw new Error('withValidation: rpcFunction must be a function');
    }
    if (!schema || typeof schema !== 'object') {
        throw new Error('withValidation: schema must be an object');
    }
    
    options = options || {};
    
    return function validatedRpc(ctx, logger, nk, payload) {
        var traceId = ctx && ctx.traceId ? ctx.traceId : 'no-trace';
        
        // Parse payload
        var data = payload;
        if (typeof payload === 'string') {
            try {
                data = JSON.parse(payload || '{}');
            } catch (e) {
                return JSON.stringify(createValidationErrorResponse(
                    [{ field: 'payload', error: 'Invalid JSON payload', errorCode: 'INVALID_JSON' }],
                    traceId
                ));
            }
        }
        
        // Validate
        var result = validateObject(data, schema, options);
        
        if (!result.valid) {
            // Log validation failure
            try {
                if (typeof globalThis !== 'undefined' && globalThis.StructuredLogger) {
                    globalThis.StructuredLogger.logStructured(logger, {
                        level: 'warn',
                        traceId: traceId,
                        rpcName: rpcName,
                        userId: ctx && ctx.userId,
                        event: 'validation_failed',
                        message: 'Request validation failed',
                        metadata: {
                            errors: result.errors,
                            fieldCount: Object.keys(data || {}).length
                        }
                    });
                } else {
                    logger.warn('[Validation][' + traceId + '] ' + rpcName + ' failed: ' + result.errors[0].error);
                }
            } catch (e) { /* Intentional: validation logging should not affect error response */ }
            
            return JSON.stringify(createValidationErrorResponse(result.errors, traceId));
        }
        
        // Execute with validated data
        return rpcFunction(ctx, logger, nk, JSON.stringify(result.data));
    };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if value is a valid UUID
 */
function isValidUUID(value) {
    return typeof value === 'string' && PATTERNS.UUID.test(value);
}

/**
 * Check if value is a valid game ID
 */
function isValidGameId(value) {
    return typeof value === 'string' && PATTERNS.GAME_ID.test(value) && value.length <= 64;
}

/**
 * Check if value is a valid currency code
 */
function isValidCurrencyCode(value) {
    return typeof value === 'string' && PATTERNS.CURRENCY_CODE.test(value);
}

/**
 * Check if value is a valid positive integer
 */
function isValidAmount(value) {
    return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}

/**
 * Sanitize string input (trim, limit length)
 */
function sanitizeString(value, maxLength) {
    if (typeof value !== 'string') return '';
    maxLength = maxLength || 1000;
    return value.trim().substring(0, maxLength);
}

// ============================================================================
// EXPORTS
// ============================================================================

// Export to globalThis for V8 runtime compatibility
if (typeof globalThis !== 'undefined') {
    globalThis.Validation = {
        // Core functions
        validate: validate,
        validateValue: validateValue,
        validateObject: validateObject,
        withValidation: withValidation,
        createErrorResponse: createValidationErrorResponse,
        
        // Schemas
        Schemas: SCHEMAS,
        CompositeSchemas: COMPOSITE_SCHEMAS,
        
        // Types and patterns
        Types: VALIDATION_TYPES,
        Patterns: PATTERNS,
        
        // Helpers
        isValidUUID: isValidUUID,
        isValidGameId: isValidGameId,
        isValidCurrencyCode: isValidCurrencyCode,
        isValidAmount: isValidAmount,
        sanitizeString: sanitizeString
    };
}
