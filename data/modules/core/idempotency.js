/**
 * Idempotency Infrastructure for Nakama Backend
 * PR #3: Prevents duplicate currency grants and reward claims
 * 
 * Features:
 * - Idempotency key generation and validation
 * - In-memory storage with TTL (24 hours default)
 * - Nakama storage fallback for persistence
 * - Automatic cleanup of expired keys
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

var IDEMPOTENCY_CONFIG = {
    // Default TTL for idempotency keys (24 hours in seconds)
    DEFAULT_TTL: 86400,
    
    // Maximum TTL allowed (7 days)
    MAX_TTL: 604800,
    
    // Minimum TTL allowed (1 minute)
    MIN_TTL: 60,
    
    // Storage collection name for persistent keys
    COLLECTION: 'idempotency_keys',
    
    // Cleanup interval (every 5 minutes)
    CLEANUP_INTERVAL: 300000,
    
    // Maximum keys in memory before forced cleanup
    MAX_MEMORY_KEYS: 10000,
    
    // Header name for client-provided idempotency key
    HEADER_NAME: 'X-Idempotency-Key',
    
    // Payload field name for idempotency key
    PAYLOAD_FIELD: 'idempotencyKey'
};

// ============================================================================
// IN-MEMORY STORAGE
// ============================================================================

// In-memory idempotency store
var idempotencyStore = {};

// Statistics
var idempotencyStats = {
    hits: 0,
    misses: 0,
    duplicatePrevented: 0,
    keysStored: 0,
    keysExpired: 0
};

// ============================================================================
// CORE FUNCTIONS
// ============================================================================

/**
 * Generate a unique idempotency key
 * Format: {userId}:{rpcName}:{timestamp}:{random}
 */
function generateIdempotencyKey(userId, rpcName) {
    var timestamp = Date.now().toString(36);
    var random = '';
    for (var i = 0; i < 8; i++) {
        random += Math.floor(Math.random() * 36).toString(36);
    }
    return (userId || 'anon') + ':' + rpcName + ':' + timestamp + ':' + random;
}

/**
 * Generate key hash for storage lookup
 * Uses userId + rpcName + clientKey to create unique identifier
 */
function generateKeyHash(userId, rpcName, clientKey) {
    if (!clientKey) return null;
    // Simple hash: combine all parts
    return (userId || 'anon') + ':' + rpcName + ':' + clientKey;
}

/**
 * Store idempotency result
 */
function storeIdempotencyResult(keyHash, result, ttlSeconds) {
    if (!keyHash) return false;
    
    ttlSeconds = ttlSeconds || IDEMPOTENCY_CONFIG.DEFAULT_TTL;
    ttlSeconds = Math.max(IDEMPOTENCY_CONFIG.MIN_TTL, Math.min(ttlSeconds, IDEMPOTENCY_CONFIG.MAX_TTL));
    
    var now = Math.floor(Date.now() / 1000);
    
    idempotencyStore[keyHash] = {
        result: result,
        createdAt: now,
        expiresAt: now + ttlSeconds
    };
    
    idempotencyStats.keysStored++;
    
    // Trigger cleanup if too many keys
    if (Object.keys(idempotencyStore).length > IDEMPOTENCY_CONFIG.MAX_MEMORY_KEYS) {
        cleanupExpiredKeys();
    }
    
    return true;
}

/**
 * Get stored idempotency result
 */
function getIdempotencyResult(keyHash) {
    if (!keyHash || !idempotencyStore[keyHash]) {
        idempotencyStats.misses++;
        return null;
    }
    
    var entry = idempotencyStore[keyHash];
    var now = Math.floor(Date.now() / 1000);
    
    // Check expiration
    if (entry.expiresAt < now) {
        delete idempotencyStore[keyHash];
        idempotencyStats.keysExpired++;
        idempotencyStats.misses++;
        return null;
    }
    
    idempotencyStats.hits++;
    idempotencyStats.duplicatePrevented++;
    return entry.result;
}

/**
 * Check if idempotency key exists (without returning result)
 */
function hasIdempotencyKey(keyHash) {
    if (!keyHash || !idempotencyStore[keyHash]) return false;
    
    var entry = idempotencyStore[keyHash];
    var now = Math.floor(Date.now() / 1000);
    
    if (entry.expiresAt < now) {
        delete idempotencyStore[keyHash];
        return false;
    }
    
    return true;
}

/**
 * Delete idempotency key (for rollback scenarios)
 */
function deleteIdempotencyKey(keyHash) {
    if (idempotencyStore[keyHash]) {
        delete idempotencyStore[keyHash];
        return true;
    }
    return false;
}

/**
 * Cleanup expired idempotency keys
 */
function cleanupExpiredKeys() {
    var now = Math.floor(Date.now() / 1000);
    var keys = Object.keys(idempotencyStore);
    var cleaned = 0;
    
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        if (idempotencyStore[key].expiresAt < now) {
            delete idempotencyStore[key];
            cleaned++;
        }
    }
    
    idempotencyStats.keysExpired += cleaned;
    return cleaned;
}

/**
 * Get idempotency statistics
 */
function getIdempotencyStats() {
    var activeKeys = Object.keys(idempotencyStore).length;
    
    return {
        hits: idempotencyStats.hits,
        misses: idempotencyStats.misses,
        duplicatesPrevented: idempotencyStats.duplicatePrevented,
        keysStored: idempotencyStats.keysStored,
        keysExpired: idempotencyStats.keysExpired,
        activeKeys: activeKeys,
        hitRate: idempotencyStats.hits + idempotencyStats.misses > 0
            ? (idempotencyStats.hits / (idempotencyStats.hits + idempotencyStats.misses) * 100).toFixed(2) + '%'
            : '0%'
    };
}

// ============================================================================
// MIDDLEWARE WRAPPER
// ============================================================================

/**
 * Extract idempotency key from request
 * Checks payload.idempotencyKey, payload.idempotency_key, or generates one
 */
function extractIdempotencyKey(payload) {
    if (!payload) return null;
    
    var parsed = payload;
    if (typeof payload === 'string') {
        try {
            parsed = JSON.parse(payload);
        } catch (e) {
            return null;
        }
    }
    
    // Check various field names
    return parsed.idempotencyKey || 
           parsed.idempotency_key || 
           parsed.idemKey ||
           parsed.requestId ||
           parsed.request_id ||
           null;
}

/**
 * Idempotency middleware wrapper
 * Prevents duplicate execution of critical operations
 * 
 * @param {function} rpcFunction - Original RPC function
 * @param {string} rpcName - RPC name for key generation
 * @param {object} options - { ttlSeconds, requireKey, autoGenerate }
 */
function withIdempotency(rpcFunction, rpcName, options) {
    if (typeof rpcFunction !== 'function') {
        throw new Error('withIdempotency: rpcFunction must be a function');
    }
    
    options = options || {};
    var ttlSeconds = options.ttlSeconds || IDEMPOTENCY_CONFIG.DEFAULT_TTL;
    var requireKey = options.requireKey !== false; // Default true
    var autoGenerate = options.autoGenerate !== false; // Default true
    
    return function idempotentRpc(ctx, logger, nk, payload) {
        var userId = ctx && ctx.userId ? ctx.userId : null;
        var traceId = ctx && ctx.traceId ? ctx.traceId : 'no-trace';
        
        // Extract or generate idempotency key
        var clientKey = extractIdempotencyKey(payload);
        
        if (!clientKey && requireKey && !autoGenerate) {
            // Key required but not provided and auto-generate disabled
            return JSON.stringify({
                success: false,
                error: 'Idempotency key required for this operation',
                errorCode: 'IDEMPOTENCY_KEY_REQUIRED',
                traceId: traceId,
                hint: 'Include idempotencyKey in your request payload'
            });
        }
        
        // Auto-generate key if not provided (based on payload hash)
        if (!clientKey && autoGenerate) {
            // Generate deterministic key from payload to catch exact duplicates
            try {
                var payloadStr = typeof payload === 'string' ? payload : JSON.stringify(payload || {});
                // Simple hash: use first 16 chars of base64-ish encoding
                var hash = '';
                for (var i = 0; i < Math.min(payloadStr.length, 100); i++) {
                    hash += payloadStr.charCodeAt(i).toString(36);
                }
                clientKey = 'auto:' + hash.substring(0, 32);
            } catch (e) {
                clientKey = 'auto:' + Date.now().toString(36);
            }
        }
        
        // Generate storage key hash
        var keyHash = generateKeyHash(userId, rpcName, clientKey);
        
        // Check for existing result
        var existingResult = getIdempotencyResult(keyHash);
        if (existingResult !== null) {
            // Log duplicate detection
            try {
                if (typeof globalThis !== 'undefined' && globalThis.StructuredLogger) {
                    globalThis.StructuredLogger.logStructured(logger, {
                        level: 'warn',
                        traceId: traceId,
                        rpcName: rpcName,
                        userId: userId,
                        event: 'idempotency_duplicate',
                        message: 'Duplicate request detected, returning cached result',
                        metadata: { 
                            idempotencyKey: clientKey,
                            keyHash: keyHash
                        }
                    });
                } else {
                    logger.warn('[Idempotency][' + traceId + '] Duplicate request for ' + rpcName + ', key: ' + clientKey);
                }
            } catch (e) { /* Intentional: logging should not affect cached response */ }
            
            // Return cached result with duplicate indicator
            var cachedResponse = existingResult;
            if (typeof cachedResponse === 'object') {
                cachedResponse.idempotent = true;
                cachedResponse.duplicate = true;
                cachedResponse.traceId = traceId;
            }
            return JSON.stringify(cachedResponse);
        }
        
        // Execute original RPC
        var response = rpcFunction(ctx, logger, nk, payload);
        
        // Store result for idempotency (only for successful responses)
        try {
            var parsed = typeof response === 'string' ? JSON.parse(response) : response;
            
            if (parsed && parsed.success !== false) {
                // Add idempotency metadata to response
                parsed.idempotencyKey = clientKey;
                parsed.idempotent = true;
                
                // Store result
                storeIdempotencyResult(keyHash, parsed, ttlSeconds);
                
                // Log successful idempotent operation
                try {
                    if (typeof globalThis !== 'undefined' && globalThis.StructuredLogger) {
                        globalThis.StructuredLogger.logStructured(logger, {
                            level: 'debug',
                            traceId: traceId,
                            rpcName: rpcName,
                            userId: userId,
                            event: 'idempotency_stored',
                            message: 'Result stored for idempotency',
                            metadata: { 
                                idempotencyKey: clientKey,
                                ttlSeconds: ttlSeconds
                            }
                        });
                    }
                } catch (e) { /* Intentional: storage logging should not affect response */ }
                
                response = JSON.stringify(parsed);
            }
        } catch (e) {
            // Response not parseable, skip idempotency storage
        }
        
        return response;
    };
}

// ============================================================================
// NAKAMA STORAGE PERSISTENCE (Optional)
// ============================================================================

/**
 * Persist idempotency key to Nakama storage
 * Use for critical operations that must survive server restarts
 */
function persistIdempotencyKey(nk, userId, keyHash, result, ttlSeconds) {
    if (!nk || !keyHash) return false;
    
    try {
        var expiresAt = Math.floor(Date.now() / 1000) + ttlSeconds;
        
        nk.storageWrite([{
            collection: IDEMPOTENCY_CONFIG.COLLECTION,
            key: keyHash,
            userId: userId || '00000000-0000-0000-0000-000000000000',
            value: {
                result: result,
                expiresAt: expiresAt,
                createdAt: Math.floor(Date.now() / 1000)
            },
            permissionRead: 0,
            permissionWrite: 0
        }]);
        
        return true;
    } catch (e) {
        return false;
    }
}

/**
 * Load idempotency key from Nakama storage
 */
function loadIdempotencyKey(nk, userId, keyHash) {
    if (!nk || !keyHash) return null;
    
    try {
        var objects = nk.storageRead([{
            collection: IDEMPOTENCY_CONFIG.COLLECTION,
            key: keyHash,
            userId: userId || '00000000-0000-0000-0000-000000000000'
        }]);
        
        if (objects && objects.length > 0) {
            var data = objects[0].value;
            var now = Math.floor(Date.now() / 1000);
            
            // Check expiration
            if (data.expiresAt && data.expiresAt < now) {
                // Key expired, delete it
                nk.storageDelete([{
                    collection: IDEMPOTENCY_CONFIG.COLLECTION,
                    key: keyHash,
                    userId: userId || '00000000-0000-0000-0000-000000000000'
                }]);
                return null;
            }
            
            return data.result;
        }
        
        return null;
    } catch (e) {
        return null;
    }
}

// ============================================================================
// EXPORTS
// ============================================================================

// Export to globalThis for V8 runtime compatibility
if (typeof globalThis !== 'undefined') {
    globalThis.Idempotency = {
        // Core functions
        withIdempotency: withIdempotency,
        generateKey: generateIdempotencyKey,
        generateKeyHash: generateKeyHash,
        extractKey: extractIdempotencyKey,
        
        // Storage operations
        store: storeIdempotencyResult,
        get: getIdempotencyResult,
        has: hasIdempotencyKey,
        delete: deleteIdempotencyKey,
        cleanup: cleanupExpiredKeys,
        
        // Persistence (optional)
        persist: persistIdempotencyKey,
        load: loadIdempotencyKey,
        
        // Stats
        getStats: getIdempotencyStats,
        
        // Config
        Config: IDEMPOTENCY_CONFIG
    };
}
