// Nakama Runtime Entrypoint
// This file loads all TypeScript runtime modules and registers RPCs

// Import and register the leaderboard RPC
// The actual registration happens in the module itself via nk.registerRpc()
// We just need to ensure the module is loaded

// Health check RPC for post-deployment validation
function healthCheck(ctx: nkruntime.Context, payload: string): string {
    nk.loggerInfo("Health check RPC called");
    return JSON.stringify({ 
        status: "ok", 
        timestamp: Date.now(),
        message: "Nakama runtime is healthy"
    });
}

// Register health check RPC
nk.registerRpc(healthCheck, "health_check");

// Log initialization
nk.loggerInfo("Nakama TypeScript runtime initialized successfully");
nk.loggerInfo("Health check RPC registered at: /v2/rpc/health_check");

// Note: leaderboard_rpc.ts will be loaded automatically by Nakama
// and will register create_all_leaderboards_persistent RPC
