// friends.js - Enhanced Friend System

import * as utils from "../copilot/utils.js";

/**
 * RPC: Block user
 * @param {object} ctx - Request context
 * @param {object} logger - Logger instance
 * @param {object} nk - Nakama runtime
 * @param {string} payload - JSON payload with { targetUserId: "uuid" }
 * @returns {string} JSON response
 */
function rpcFriendsBlock(ctx, logger, nk, payload) {
    utils.logInfo(logger, "RPC friends_block called");
    
    var parsed = utils.safeJsonParse(payload);
    if (!parsed.success) {
        return utils.handleError(ctx, null, "Invalid JSON payload");
    }
    
    var data = parsed.data;
    var validation = utils.validatePayload(data, ['targetUserId']);
    if (!validation.valid) {
        return utils.handleError(ctx, null, "Missing required fields: " + validation.missing.join(", "));
    }
    
    var userId = ctx.userId;
    if (!userId) {
        return utils.handleError(ctx, null, "User not authenticated");
    }
    
    var targetUserId = data.targetUserId;
    
    // EDGE CASE: Prevent self-blocking
    if (userId === targetUserId) {
        return utils.handleError(ctx, null, "Cannot block yourself");
    }
    
    // EDGE CASE: Check if already blocked
    var existingBlock = null;
    try {
        var records = nk.storageRead([{
            collection: "user_blocks",
            key: "blocked_" + userId + "_" + targetUserId,
            userId: userId
        }]);
        if (records && records.length > 0) {
            existingBlock = records[0];
        }
    } catch (err) {
        utils.logWarn(logger, "Error checking existing block: " + err.message);
    }
    
    if (existingBlock) {
        return JSON.stringify({
            success: true,
            userId: userId,
            blockedUserId: targetUserId,
            blockedAt: existingBlock.value.blockedAt,
            alreadyBlocked: true
        });
    }
    
    // Store block relationship
    var collection = "user_blocks";
    var key = "blocked_" + userId + "_" + targetUserId;
    var blockData = {
        userId: userId,
        blockedUserId: targetUserId,
        blockedAt: utils.getCurrentTimestamp()
    };
    
    if (!utils.writeStorage(nk, logger, collection, key, userId, blockData)) {
        return utils.handleError(ctx, null, "Failed to block user");
    }
    
    // Remove from friends if exists
    try {
        nk.friendsDelete(userId, [targetUserId]);
    } catch (err) {
        utils.logWarn(logger, "Could not remove friend relationship: " + err.message);
    }
    
    return JSON.stringify({
        success: true,
        userId: userId,
        blockedUserId: targetUserId,
        blockedAt: blockData.blockedAt
    });
}

/**
 * RPC: Unblock user
 * @param {object} ctx - Request context
 * @param {object} logger - Logger instance
 * @param {object} nk - Nakama runtime
 * @param {string} payload - JSON payload with { targetUserId: "uuid" }
 * @returns {string} JSON response
 */
function rpcFriendsUnblock(ctx, logger, nk, payload) {
    utils.logInfo(logger, "RPC friends_unblock called");
    
    var parsed = utils.safeJsonParse(payload);
    if (!parsed.success) {
        return utils.handleError(ctx, null, "Invalid JSON payload");
    }
    
    var data = parsed.data;
    var validation = utils.validatePayload(data, ['targetUserId']);
    if (!validation.valid) {
        return utils.handleError(ctx, null, "Missing required fields: " + validation.missing.join(", "));
    }
    
    var userId = ctx.userId;
    if (!userId) {
        return utils.handleError(ctx, null, "User not authenticated");
    }
    
    var targetUserId = data.targetUserId;
    
    // Remove block relationship
    var collection = "user_blocks";
    var key = "blocked_" + userId + "_" + targetUserId;
    
    try {
        nk.storageDelete([{
            collection: collection,
            key: key,
            userId: userId
        }]);
    } catch (err) {
        utils.logWarn(logger, "Failed to unblock user: " + err.message);
    }
    
    return JSON.stringify({
        success: true,
        userId: userId,
        unblockedUserId: targetUserId,
        unblockedAt: utils.getCurrentTimestamp()
    });
}

/**
 * RPC: Remove friend
 * @param {object} ctx - Request context
 * @param {object} logger - Logger instance
 * @param {object} nk - Nakama runtime
 * @param {string} payload - JSON payload with { friendUserId: "uuid" }
 * @returns {string} JSON response
 */
function rpcFriendsRemove(ctx, logger, nk, payload) {
    utils.logInfo(logger, "RPC friends_remove called");
    
    var parsed = utils.safeJsonParse(payload);
    if (!parsed.success) {
        return utils.handleError(ctx, null, "Invalid JSON payload");
    }
    
    var data = parsed.data;
    var validation = utils.validatePayload(data, ['friendUserId']);
    if (!validation.valid) {
        return utils.handleError(ctx, null, "Missing required fields: " + validation.missing.join(", "));
    }
    
    var userId = ctx.userId;
    if (!userId) {
        return utils.handleError(ctx, null, "User not authenticated");
    }
    
    var friendUserId = data.friendUserId;
    
    try {
        nk.friendsDelete(userId, [friendUserId]);
    } catch (err) {
        return utils.handleError(ctx, err, "Failed to remove friend");
    }
    
    return JSON.stringify({
        success: true,
        userId: userId,
        removedFriendUserId: friendUserId,
        removedAt: utils.getCurrentTimestamp()
    });
}

/**
 * RPC: List friends
 * @param {object} ctx - Request context
 * @param {object} logger - Logger instance
 * @param {object} nk - Nakama runtime
 * @param {string} payload - JSON payload with optional { limit: 100 }
 * @returns {string} JSON response
 */
function rpcFriendsList(ctx, logger, nk, payload) {
    utils.logInfo(logger, "RPC friends_list called");
    
    var userId = ctx.userId;
    if (!userId) {
        return utils.handleError(ctx, null, "User not authenticated");
    }
    
    var limit = 100;
    if (payload) {
        var parsed = utils.safeJsonParse(payload);
        if (parsed.success && parsed.data.limit) {
            limit = parsed.data.limit;
        }
    }
    
    var friends = [];
    try {
        var friendsList = nk.friendsList(userId, limit, null, null);
        for (var i = 0; i < friendsList.friends.length; i++) {
            var friend = friendsList.friends[i];
            friends.push({
                userId: friend.user.id,
                username: friend.user.username,
                displayName: friend.user.displayName,
                online: friend.user.online,
                state: friend.state
            });
        }
    } catch (err) {
        return utils.handleError(ctx, err, "Failed to list friends");
    }
    
    return JSON.stringify({
        success: true,
        userId: userId,
        friends: friends,
        count: friends.length,
        timestamp: utils.getCurrentTimestamp()
    });
}

/**
 * RPC: Challenge friend to a match
 * @param {object} ctx - Request context
 * @param {object} logger - Logger instance
 * @param {object} nk - Nakama runtime
 * @param {string} payload - JSON payload with { friendUserId: "uuid", gameId: "uuid", challengeData: {} }
 * @returns {string} JSON response
 */
function rpcFriendsChallengeUser(ctx, logger, nk, payload) {
    utils.logInfo(logger, "RPC friends_challenge_user called");
    
    var parsed = utils.safeJsonParse(payload);
    if (!parsed.success) {
        return utils.handleError(ctx, null, "Invalid JSON payload");
    }
    
    var data = parsed.data;
    var validation = utils.validatePayload(data, ['friendUserId', 'gameId']);
    if (!validation.valid) {
        return utils.handleError(ctx, null, "Missing required fields: " + validation.missing.join(", "));
    }
    
    var gameId = data.gameId;
    if (!utils.isValidUUID(gameId)) {
        return utils.handleError(ctx, null, "Invalid gameId UUID format");
    }
    
    var userId = ctx.userId;
    if (!userId) {
        return utils.handleError(ctx, null, "User not authenticated");
    }
    
    var friendUserId = data.friendUserId;
    
    // EDGE CASE: Prevent self-challenge
    if (userId === friendUserId) {
        return utils.handleError(ctx, null, "Cannot challenge yourself");
    }
    
    // EDGE CASE: Verify friendship exists (mutual friends only)
    var isFriend = false;
    try {
        var friendsList = nk.friendsList(userId, 100, null, null);
        for (var i = 0; i < friendsList.friends.length; i++) {
            if (friendsList.friends[i].user.id === friendUserId && friendsList.friends[i].state === 0) {
                isFriend = true;
                break;
            }
        }
    } catch (err) {
        utils.logWarn(logger, "Error verifying friendship: " + err.message);
        // Continue anyway - challenge will still work but notification may not be meaningful
    }
    
    if (!isFriend) {
        utils.logWarn(logger, "Challenge sent to non-friend: " + friendUserId);
        // Allow challenge but log warning (user may have pending request)
    }
    
    var challengeData = data.challengeData || {};
    
    // Create challenge
    var challengeId = "challenge_" + userId + "_" + friendUserId + "_" + utils.getUnixTimestamp();
    var challenge = {
        challengeId: challengeId,
        fromUserId: userId,
        toUserId: friendUserId,
        gameId: gameId,
        challengeData: challengeData,
        status: "pending",
        createdAt: utils.getCurrentTimestamp()
    };
    
    // Store challenge
    var collection = "challenges";
    if (!utils.writeStorage(nk, logger, collection, challengeId, userId, challenge)) {
        return utils.handleError(ctx, null, "Failed to create challenge");
    }
    
    // Send notification to friend
    try {
        nk.notificationSend(friendUserId, "Friend Challenge", {
            type: "friend_challenge",
            challengeId: challengeId,
            fromUserId: userId,
            gameId: gameId
        }, 1);
    } catch (err) {
        utils.logWarn(logger, "Failed to send challenge notification: " + err.message);
    }
    
    return JSON.stringify({
        success: true,
        challengeId: challengeId,
        fromUserId: userId,
        toUserId: friendUserId,
        gameId: gameId,
        status: "pending",
        timestamp: utils.getCurrentTimestamp()
    });
}

/**
 * RPC: Spectate friend's match
 * @param {object} ctx - Request context
 * @param {object} logger - Logger instance
 * @param {object} nk - Nakama runtime
 * @param {string} payload - JSON payload with { friendUserId: "uuid" }
 * @returns {string} JSON response
 */
function rpcFriendsSpectate(ctx, logger, nk, payload) {
    utils.logInfo(logger, "RPC friends_spectate called");
    
    var parsed = utils.safeJsonParse(payload);
    if (!parsed.success) {
        return utils.handleError(ctx, null, "Invalid JSON payload");
    }
    
    var data = parsed.data;
    var validation = utils.validatePayload(data, ['friendUserId']);
    if (!validation.valid) {
        return utils.handleError(ctx, null, "Missing required fields: " + validation.missing.join(", "));
    }
    
    var userId = ctx.userId;
    if (!userId) {
        return utils.handleError(ctx, null, "User not authenticated");
    }
    
    var friendUserId = data.friendUserId;
    
    // Get friend's presence
    var presences = [];
    try {
        var statuses = nk.usersGetStatus([friendUserId]);
        if (statuses && statuses.length > 0) {
            presences = statuses[0].presences;
        }
    } catch (err) {
        return utils.handleError(ctx, err, "Failed to get friend presence");
    }
    
    // Find if friend is in a match
    var matchId = null;
    for (var i = 0; i < presences.length; i++) {
        if (presences[i].status && presences[i].status.indexOf("match:") === 0) {
            matchId = presences[i].status.substring(6);
            break;
        }
    }
    
    if (!matchId) {
        return JSON.stringify({
            success: false,
            error: "Friend is not currently in a match"
        });
    }
    
    return JSON.stringify({
        success: true,
        userId: userId,
        friendUserId: friendUserId,
        matchId: matchId,
        spectateReady: true,
        timestamp: utils.getCurrentTimestamp()
    });
}

// Export RPC functions (ES Module syntax)
export {
    rpcFriendsBlock,
    rpcFriendsUnblock,
    rpcFriendsRemove,
    rpcFriendsList,
    rpcFriendsChallengeUser,
    rpcFriendsSpectate
};
