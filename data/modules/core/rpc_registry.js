/**
 * Central RPC Registry for Nakama V8 Runtime
 * 
 * Provides:
 * - Centralized RPC metadata storage
 * - RPC classification (read/write, sensitive, rate limits)
 * - Handler registration tracking
 * - Validation schema references
 * - Caching configuration per RPC
 * 
 * @version 1.0.0
 * @date 2026-02-05
 */

// ============================================================================
// CONSTANTS & ENUMS
// ============================================================================

/**
 * RPC operation types
 */
var RPC_TYPE = {
    READ: 'READ',
    WRITE: 'WRITE'
};

/**
 * Rate limit preset categories
 */
var RATE_LIMIT_PRESET = {
    STANDARD: 'STANDARD',   // 100/min - General operations
    WRITE: 'WRITE',         // 30/min  - Write operations
    READ: 'READ',           // 200/min - Read operations
    AUTH: 'AUTH',           // 10/min  - Authentication
    SOCIAL: 'SOCIAL',       // 50/min  - Social operations
    ADMIN: 'ADMIN',         // 1000/min - Admin operations
    EXPENSIVE: 'EXPENSIVE', // 20/min  - CPU-intensive operations
    SENSITIVE: 'SENSITIVE'  // 5/min   - Currency/reward operations
};

/**
 * Cache TTL presets (in seconds)
 */
var CACHE_TTL = {
    NONE: 0,
    SHORT: 30,              // 30 seconds - Fast-changing data
    MEDIUM: 60,             // 1 minute - Leaderboards
    LONG: 300,              // 5 minutes - Profiles, daily rewards
    VERY_LONG: 600,         // 10 minutes - Achievement definitions
    STATIC: 3600            // 1 hour - Game registry, config
};

/**
 * RPC domain categories
 */
var RPC_DOMAIN = {
    IDENTITY: 'identity',
    WALLET: 'wallet',
    LEADERBOARD: 'leaderboard',
    DAILY_REWARDS: 'daily_rewards',
    DAILY_MISSIONS: 'daily_missions',
    ACHIEVEMENTS: 'achievements',
    FRIENDS: 'friends',
    GROUPS: 'groups',
    PUSH: 'push_notifications',
    ANALYTICS: 'analytics',
    MATCHMAKING: 'matchmaking',
    TOURNAMENTS: 'tournaments',
    RETENTION: 'retention',
    ONBOARDING: 'onboarding',
    PROGRESSION: 'progression',
    REWARDED_ADS: 'rewarded_ads',
    QUIZ: 'quiz',
    CHAT: 'chat',
    INFRASTRUCTURE: 'infrastructure',
    MULTIGAME: 'multigame',
    ADMIN: 'admin'
};

// ============================================================================
// RPC REGISTRY DATA STRUCTURE
// ============================================================================

/**
 * Central registry storing RPC metadata
 * Key: RPC name
 * Value: RPC configuration object
 */
var RPC_REGISTRY = {};

/**
 * Default RPC configuration
 */
var DEFAULT_RPC_CONFIG = {
    name: '',
    handler: null,
    domain: RPC_DOMAIN.INFRASTRUCTURE,
    type: RPC_TYPE.READ,
    sensitive: false,
    rateLimitPreset: RATE_LIMIT_PRESET.STANDARD,
    idempotencyRequired: false,
    validationSchema: [],
    storageCollections: [],
    cachingEnabled: false,
    cacheTTL: CACHE_TTL.NONE,
    cacheKeyGenerator: null,
    adminOnly: false,
    deprecated: false,
    deprecationMessage: null,
    description: '',
    registeredAt: null
};

// ============================================================================
// REGISTRY FUNCTIONS
// ============================================================================

/**
 * Register an RPC with metadata
 * 
 * @param {string} name - RPC name (must be unique)
 * @param {function} handler - RPC handler function
 * @param {object} [metadata] - RPC metadata configuration
 * @param {string} [metadata.domain] - Domain category
 * @param {string} [metadata.type] - READ or WRITE
 * @param {boolean} [metadata.sensitive] - Requires idempotency
 * @param {string} [metadata.rateLimitPreset] - Rate limit category
 * @param {boolean} [metadata.idempotencyRequired] - Needs idempotency key
 * @param {string[]} [metadata.validationSchema] - Required fields
 * @param {string[]} [metadata.storageCollections] - Collections accessed
 * @param {boolean} [metadata.cachingEnabled] - Enable caching
 * @param {number} [metadata.cacheTTL] - Cache TTL in seconds
 * @param {function} [metadata.cacheKeyGenerator] - Cache key generator
 * @param {boolean} [metadata.adminOnly] - Requires admin access
 * @param {string} [metadata.description] - RPC description
 * @returns {object} Registered RPC configuration
 */
function registerRpc(name, handler, metadata) {
    // Validate inputs
    if (!name || typeof name !== 'string') {
        throw new Error('RPC name must be a non-empty string');
    }
    
    if (typeof handler !== 'function') {
        throw new Error('RPC handler must be a function for: ' + name);
    }
    
    // Normalize name
    var normalizedName = name.trim().toLowerCase();
    
    // Check for duplicate registration
    if (RPC_REGISTRY[normalizedName] && RPC_REGISTRY[normalizedName].handler) {
        // Allow re-registration but log warning
        // This supports hot-reloading scenarios
    }
    
    // Build configuration
    var config = {
        name: name,
        handler: handler,
        domain: (metadata && metadata.domain) || DEFAULT_RPC_CONFIG.domain,
        type: (metadata && metadata.type) || DEFAULT_RPC_CONFIG.type,
        sensitive: (metadata && metadata.sensitive) || DEFAULT_RPC_CONFIG.sensitive,
        rateLimitPreset: (metadata && metadata.rateLimitPreset) || 
            (metadata && metadata.type === RPC_TYPE.WRITE ? RATE_LIMIT_PRESET.WRITE : RATE_LIMIT_PRESET.READ),
        idempotencyRequired: (metadata && metadata.idempotencyRequired) || 
            (metadata && metadata.sensitive) || DEFAULT_RPC_CONFIG.idempotencyRequired,
        validationSchema: (metadata && metadata.validationSchema) || [],
        storageCollections: (metadata && metadata.storageCollections) || [],
        cachingEnabled: (metadata && metadata.cachingEnabled) || DEFAULT_RPC_CONFIG.cachingEnabled,
        cacheTTL: (metadata && typeof metadata.cacheTTL === 'number') ? 
            metadata.cacheTTL : DEFAULT_RPC_CONFIG.cacheTTL,
        cacheKeyGenerator: (metadata && metadata.cacheKeyGenerator) || null,
        adminOnly: (metadata && metadata.adminOnly) || DEFAULT_RPC_CONFIG.adminOnly,
        deprecated: (metadata && metadata.deprecated) || false,
        deprecationMessage: (metadata && metadata.deprecationMessage) || null,
        description: (metadata && metadata.description) || '',
        registeredAt: new Date().toISOString()
    };
    
    // Auto-set sensitive flag for currency-related RPCs
    if (!config.sensitive && isCurrencyRpc(name)) {
        config.sensitive = true;
        config.idempotencyRequired = true;
        config.rateLimitPreset = RATE_LIMIT_PRESET.SENSITIVE;
    }
    
    // Store in registry
    RPC_REGISTRY[normalizedName] = config;
    
    return config;
}

/**
 * Get RPC metadata by name
 * 
 * @param {string} name - RPC name
 * @returns {object|null} RPC configuration or null if not found
 */
function getRpcMetadata(name) {
    if (!name) return null;
    var normalizedName = name.trim().toLowerCase();
    return RPC_REGISTRY[normalizedName] || null;
}

/**
 * Get RPC handler by name
 * 
 * @param {string} name - RPC name
 * @returns {function|null} RPC handler or null if not found
 */
function getRpcHandler(name) {
    var metadata = getRpcMetadata(name);
    return metadata ? metadata.handler : null;
}

/**
 * Check if an RPC is registered
 * 
 * @param {string} name - RPC name
 * @returns {boolean} True if registered
 */
function isRpcRegistered(name) {
    return getRpcMetadata(name) !== null;
}

/**
 * Check if an RPC requires idempotency
 * 
 * @param {string} name - RPC name
 * @returns {boolean} True if idempotency required
 */
function requiresIdempotency(name) {
    var metadata = getRpcMetadata(name);
    return metadata ? metadata.idempotencyRequired : false;
}

/**
 * Check if an RPC is sensitive (currency/reward)
 * 
 * @param {string} name - RPC name
 * @returns {boolean} True if sensitive
 */
function isSensitiveRpc(name) {
    var metadata = getRpcMetadata(name);
    return metadata ? metadata.sensitive : false;
}

/**
 * Check if an RPC is admin-only
 * 
 * @param {string} name - RPC name
 * @returns {boolean} True if admin-only
 */
function isAdminRpc(name) {
    var metadata = getRpcMetadata(name);
    return metadata ? metadata.adminOnly : false;
}

/**
 * Get caching configuration for an RPC
 * 
 * @param {string} name - RPC name
 * @returns {object} Caching config { enabled, ttl, keyGenerator }
 */
function getCacheConfig(name) {
    var metadata = getRpcMetadata(name);
    if (!metadata) {
        return { enabled: false, ttl: 0, keyGenerator: null };
    }
    return {
        enabled: metadata.cachingEnabled,
        ttl: metadata.cacheTTL,
        keyGenerator: metadata.cacheKeyGenerator
    };
}

/**
 * Get rate limit configuration for an RPC
 * 
 * @param {string} name - RPC name
 * @returns {object} Rate limit config { preset, maxCalls, windowSeconds }
 */
function getRateLimitConfig(name) {
    var metadata = getRpcMetadata(name);
    var preset = metadata ? metadata.rateLimitPreset : RATE_LIMIT_PRESET.STANDARD;
    
    // Map presets to actual values
    var presetConfigs = {
        'STANDARD': { maxCalls: 100, windowSeconds: 60 },
        'WRITE': { maxCalls: 30, windowSeconds: 60 },
        'READ': { maxCalls: 200, windowSeconds: 60 },
        'AUTH': { maxCalls: 10, windowSeconds: 60 },
        'SOCIAL': { maxCalls: 50, windowSeconds: 60 },
        'ADMIN': { maxCalls: 1000, windowSeconds: 60 },
        'EXPENSIVE': { maxCalls: 20, windowSeconds: 60 },
        'SENSITIVE': { maxCalls: 5, windowSeconds: 60 }
    };
    
    var config = presetConfigs[preset] || presetConfigs['STANDARD'];
    
    return {
        preset: preset,
        maxCalls: config.maxCalls,
        windowSeconds: config.windowSeconds
    };
}

// ============================================================================
// REGISTRY QUERIES
// ============================================================================

/**
 * Get all registered RPC names
 * 
 * @returns {string[]} Array of RPC names
 */
function getAllRpcNames() {
    return Object.keys(RPC_REGISTRY);
}

/**
 * Get all RPCs by domain
 * 
 * @param {string} domain - Domain category
 * @returns {object[]} Array of RPC configurations
 */
function getRpcsByDomain(domain) {
    var results = [];
    var names = getAllRpcNames();
    
    for (var i = 0; i < names.length; i++) {
        var config = RPC_REGISTRY[names[i]];
        if (config.domain === domain) {
            results.push(config);
        }
    }
    
    return results;
}

/**
 * Get all sensitive RPCs (require idempotency)
 * 
 * @returns {object[]} Array of sensitive RPC configurations
 */
function getSensitiveRpcs() {
    var results = [];
    var names = getAllRpcNames();
    
    for (var i = 0; i < names.length; i++) {
        var config = RPC_REGISTRY[names[i]];
        if (config.sensitive || config.idempotencyRequired) {
            results.push(config);
        }
    }
    
    return results;
}

/**
 * Get all write RPCs
 * 
 * @returns {object[]} Array of write RPC configurations
 */
function getWriteRpcs() {
    var results = [];
    var names = getAllRpcNames();
    
    for (var i = 0; i < names.length; i++) {
        var config = RPC_REGISTRY[names[i]];
        if (config.type === RPC_TYPE.WRITE) {
            results.push(config);
        }
    }
    
    return results;
}

/**
 * Get registry statistics
 * 
 * @returns {object} Registry statistics
 */
function getRegistryStats() {
    var names = getAllRpcNames();
    var stats = {
        totalRpcs: names.length,
        byDomain: {},
        byType: { READ: 0, WRITE: 0 },
        sensitiveCount: 0,
        idempotencyRequiredCount: 0,
        cachingEnabledCount: 0,
        adminOnlyCount: 0
    };
    
    for (var i = 0; i < names.length; i++) {
        var config = RPC_REGISTRY[names[i]];
        
        // By domain
        if (!stats.byDomain[config.domain]) {
            stats.byDomain[config.domain] = 0;
        }
        stats.byDomain[config.domain]++;
        
        // By type
        stats.byType[config.type]++;
        
        // Flags
        if (config.sensitive) stats.sensitiveCount++;
        if (config.idempotencyRequired) stats.idempotencyRequiredCount++;
        if (config.cachingEnabled) stats.cachingEnabledCount++;
        if (config.adminOnly) stats.adminOnlyCount++;
    }
    
    return stats;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if RPC name suggests currency/reward operations
 * 
 * @param {string} name - RPC name
 * @returns {boolean} True if likely currency-related
 */
function isCurrencyRpc(name) {
    if (!name) return false;
    
    var currencyKeywords = [
        'wallet_update',
        '_claim',
        'claim_',
        'reward_claim',
        'purchase',
        'grant_currency',
        'spend_currency',
        'unlock'
    ];
    
    var lowerName = name.toLowerCase();
    
    for (var i = 0; i < currencyKeywords.length; i++) {
        if (lowerName.indexOf(currencyKeywords[i]) !== -1) {
            return true;
        }
    }
    
    return false;
}

/**
 * Bulk register multiple RPCs
 * 
 * @param {object[]} rpcs - Array of { name, handler, metadata }
 * @returns {object} Registration results { success: number, failed: number, errors: [] }
 */
function bulkRegisterRpcs(rpcs) {
    var results = {
        success: 0,
        failed: 0,
        errors: []
    };
    
    if (!Array.isArray(rpcs)) {
        results.errors.push('Input must be an array');
        return results;
    }
    
    for (var i = 0; i < rpcs.length; i++) {
        var rpc = rpcs[i];
        try {
            registerRpc(rpc.name, rpc.handler, rpc.metadata);
            results.success++;
        } catch (err) {
            results.failed++;
            results.errors.push({
                name: rpc.name || 'unknown',
                error: err.message
            });
        }
    }
    
    return results;
}

// ============================================================================
// PRE-DEFINED RPC METADATA
// ============================================================================

/**
 * Pre-defined metadata for known RPCs
 * This can be used to initialize the registry with known configurations
 */
var PREDEFINED_RPC_METADATA = {
    // ========== WALLET RPCs (Sensitive) ==========
    'wallet_get_all': {
        domain: RPC_DOMAIN.WALLET,
        type: RPC_TYPE.READ,
        sensitive: false,
        rateLimitPreset: RATE_LIMIT_PRESET.READ,
        cachingEnabled: true,
        cacheTTL: CACHE_TTL.SHORT,
        storageCollections: ['wallets', 'global_wallets'],
        description: 'Get all wallets for user (global + game wallets)'
    },
    'wallet_update_global': {
        domain: RPC_DOMAIN.WALLET,
        type: RPC_TYPE.WRITE,
        sensitive: true,
        idempotencyRequired: true,
        rateLimitPreset: RATE_LIMIT_PRESET.SENSITIVE,
        validationSchema: ['currency', 'amount', 'operation'],
        storageCollections: ['wallets', 'transaction_logs'],
        description: 'Update global wallet balance (requires idempotency)'
    },
    'wallet_update_game_wallet': {
        domain: RPC_DOMAIN.WALLET,
        type: RPC_TYPE.WRITE,
        sensitive: true,
        idempotencyRequired: true,
        rateLimitPreset: RATE_LIMIT_PRESET.SENSITIVE,
        validationSchema: ['gameId', 'currency', 'amount', 'operation'],
        storageCollections: ['wallets', 'transaction_logs'],
        description: 'Update game-specific wallet balance (requires idempotency)'
    },
    
    // ========== DAILY REWARDS RPCs ==========
    'daily_rewards_get_status': {
        domain: RPC_DOMAIN.DAILY_REWARDS,
        type: RPC_TYPE.READ,
        sensitive: false,
        rateLimitPreset: RATE_LIMIT_PRESET.READ,
        cachingEnabled: true,
        cacheTTL: CACHE_TTL.LONG,
        validationSchema: ['gameId'],
        storageCollections: ['daily_streaks'],
        description: 'Get daily rewards status and streak info'
    },
    'daily_rewards_claim': {
        domain: RPC_DOMAIN.DAILY_REWARDS,
        type: RPC_TYPE.WRITE,
        sensitive: true,
        idempotencyRequired: true,
        rateLimitPreset: RATE_LIMIT_PRESET.SENSITIVE,
        validationSchema: ['gameId'],
        storageCollections: ['daily_streaks', 'wallets', 'transaction_logs'],
        description: 'Claim daily reward (requires idempotency)'
    },
    
    // ========== LEADERBOARD RPCs ==========
    'get_time_period_leaderboard': {
        domain: RPC_DOMAIN.LEADERBOARD,
        type: RPC_TYPE.READ,
        sensitive: false,
        rateLimitPreset: RATE_LIMIT_PRESET.READ,
        cachingEnabled: true,
        cacheTTL: CACHE_TTL.MEDIUM,
        validationSchema: ['gameId', 'period'],
        description: 'Get leaderboard for specific time period'
    },
    'submit_score_to_time_periods': {
        domain: RPC_DOMAIN.LEADERBOARD,
        type: RPC_TYPE.WRITE,
        sensitive: false,
        rateLimitPreset: RATE_LIMIT_PRESET.WRITE,
        validationSchema: ['gameId', 'score'],
        description: 'Submit score to all time period leaderboards'
    },
    
    // ========== OTHER SENSITIVE RPCs ==========
    'claim_mission_reward': {
        domain: RPC_DOMAIN.DAILY_MISSIONS,
        type: RPC_TYPE.WRITE,
        sensitive: true,
        idempotencyRequired: true,
        rateLimitPreset: RATE_LIMIT_PRESET.SENSITIVE,
        validationSchema: ['gameId', 'missionId'],
        storageCollections: ['mission_progress', 'wallets', 'transaction_logs'],
        description: 'Claim mission reward (requires idempotency)'
    },
    'rewarded_ad_claim': {
        domain: RPC_DOMAIN.REWARDED_ADS,
        type: RPC_TYPE.WRITE,
        sensitive: true,
        idempotencyRequired: true,
        rateLimitPreset: RATE_LIMIT_PRESET.SENSITIVE,
        validationSchema: ['token'],
        storageCollections: ['rewarded_ad_claims', 'wallets'],
        description: 'Claim rewarded ad reward (requires idempotency)'
    },
    'season_pass_claim_reward': {
        domain: RPC_DOMAIN.RETENTION,
        type: RPC_TYPE.WRITE,
        sensitive: true,
        idempotencyRequired: true,
        rateLimitPreset: RATE_LIMIT_PRESET.SENSITIVE,
        validationSchema: ['gameId', 'tier'],
        storageCollections: ['season_pass', 'wallets'],
        description: 'Claim season pass tier reward (requires idempotency)'
    },
    'weekly_goals_claim_reward': {
        domain: RPC_DOMAIN.RETENTION,
        type: RPC_TYPE.WRITE,
        sensitive: true,
        idempotencyRequired: true,
        rateLimitPreset: RATE_LIMIT_PRESET.SENSITIVE,
        validationSchema: ['gameId', 'goalId'],
        storageCollections: ['weekly_goals', 'wallets'],
        description: 'Claim weekly goal reward (requires idempotency)'
    },
    'monthly_milestones_claim_reward': {
        domain: RPC_DOMAIN.RETENTION,
        type: RPC_TYPE.WRITE,
        sensitive: true,
        idempotencyRequired: true,
        rateLimitPreset: RATE_LIMIT_PRESET.SENSITIVE,
        validationSchema: ['gameId', 'milestoneId'],
        storageCollections: ['monthly_milestones', 'wallets'],
        description: 'Claim monthly milestone reward (requires idempotency)'
    },
    'tournament_claim_rewards': {
        domain: RPC_DOMAIN.TOURNAMENTS,
        type: RPC_TYPE.WRITE,
        sensitive: true,
        idempotencyRequired: true,
        rateLimitPreset: RATE_LIMIT_PRESET.SENSITIVE,
        validationSchema: ['tournamentId'],
        storageCollections: ['tournaments', 'wallets'],
        description: 'Claim tournament rewards (requires idempotency)'
    },
    'onboarding_claim_welcome_bonus': {
        domain: RPC_DOMAIN.ONBOARDING,
        type: RPC_TYPE.WRITE,
        sensitive: true,
        idempotencyRequired: true,
        rateLimitPreset: RATE_LIMIT_PRESET.SENSITIVE,
        validationSchema: ['gameId'],
        storageCollections: ['onboarding_state', 'wallets'],
        description: 'Claim welcome bonus (requires idempotency)'
    },
    'retention_claim_welcome_bonus': {
        domain: RPC_DOMAIN.RETENTION,
        type: RPC_TYPE.WRITE,
        sensitive: true,
        idempotencyRequired: true,
        rateLimitPreset: RATE_LIMIT_PRESET.SENSITIVE,
        validationSchema: ['gameId'],
        storageCollections: ['retention', 'wallets'],
        description: 'Claim retention welcome bonus (requires idempotency)'
    },
    'winback_claim_rewards': {
        domain: RPC_DOMAIN.RETENTION,
        type: RPC_TYPE.WRITE,
        sensitive: true,
        idempotencyRequired: true,
        rateLimitPreset: RATE_LIMIT_PRESET.SENSITIVE,
        validationSchema: ['gameId'],
        storageCollections: ['winback', 'wallets'],
        description: 'Claim winback rewards (requires idempotency)'
    },
    'achievements_unlock': {
        domain: RPC_DOMAIN.ACHIEVEMENTS,
        type: RPC_TYPE.WRITE,
        sensitive: true,
        idempotencyRequired: true,
        rateLimitPreset: RATE_LIMIT_PRESET.SENSITIVE,
        validationSchema: ['gameId', 'achievementId'],
        storageCollections: ['achievements', 'wallets'],
        description: 'Unlock achievement with reward (requires idempotency)'
    }
};

/**
 * Initialize registry with predefined metadata (without handlers)
 * Handlers will be set when RPCs are actually registered
 */
function initializePredefinedMetadata() {
    var names = Object.keys(PREDEFINED_RPC_METADATA);
    for (var i = 0; i < names.length; i++) {
        var name = names[i];
        var metadata = PREDEFINED_RPC_METADATA[name];
        
        // Create placeholder registration (handler will be set later)
        RPC_REGISTRY[name.toLowerCase()] = Object.assign({}, DEFAULT_RPC_CONFIG, metadata, {
            name: name,
            handler: null,
            registeredAt: null
        });
    }
}

// Initialize predefined metadata on load
initializePredefinedMetadata();

// ============================================================================
// EXPORTS (for V8 runtime - global assignment)
// ============================================================================

if (typeof globalThis !== 'undefined') {
    globalThis.RpcRegistry = {
        // Core functions
        registerRpc: registerRpc,
        getRpcMetadata: getRpcMetadata,
        getRpcHandler: getRpcHandler,
        isRpcRegistered: isRpcRegistered,
        
        // Query functions
        requiresIdempotency: requiresIdempotency,
        isSensitiveRpc: isSensitiveRpc,
        isAdminRpc: isAdminRpc,
        getCacheConfig: getCacheConfig,
        getRateLimitConfig: getRateLimitConfig,
        
        // Registry queries
        getAllRpcNames: getAllRpcNames,
        getRpcsByDomain: getRpcsByDomain,
        getSensitiveRpcs: getSensitiveRpcs,
        getWriteRpcs: getWriteRpcs,
        getRegistryStats: getRegistryStats,
        
        // Bulk operations
        bulkRegisterRpcs: bulkRegisterRpcs,
        
        // Constants
        RPC_TYPE: RPC_TYPE,
        RATE_LIMIT_PRESET: RATE_LIMIT_PRESET,
        CACHE_TTL: CACHE_TTL,
        RPC_DOMAIN: RPC_DOMAIN,
        PREDEFINED_RPC_METADATA: PREDEFINED_RPC_METADATA
    };
}
