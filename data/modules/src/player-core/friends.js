// ============================================================================
// PLAYER CORE: FRIENDS MODULE
// ============================================================================
// Version: 1.0.0 | Date: 2026-02-05
// ============================================================================
// This module handles social connections that persist across all games.
// Part of PLAYER CORE - cross-game player data.
//
// RPCs in this module:
// - friends_list: Get friend list
// - send_friend_invite: Send friend request
// - accept_friend_invite: Accept friend request
// - decline_friend_invite: Decline friend request
// - friends_block: Block a user
// - friends_unblock: Unblock a user
// - friends_remove: Remove friend
// - friends_challenge_user: Challenge friend to game
// - friends_spectate: Spectate friend's game
//
// Storage Patterns:
// - Uses Nakama's built-in friends API
// - Collection: "user_blocks" for block relationships
// - Key: "blocked_{userId}_{targetUserId}"
//
// NOTE: This file is for documentation/reference only.
// The actual implementation is in the main index.js file.
// ============================================================================

/**
 * FRIENDS MODULE - Function Index
 * 
 * RPC Handlers (registered in InitModule ~line 22003-22013):
 * - rpcFriendsBlock: ~line (search in friends/ folder or index.js)
 * - rpcFriendsUnblock
 * - rpcFriendsRemove
 * - rpcFriendsList
 * - rpcFriendsChallengeUser
 * - rpcFriendsSpectate
 * 
 * Also from copilot/social_features.js:
 * - rpcSendFriendInvite: ~line 13472
 * - rpcAcceptFriendInvite: ~line 13479
 * - rpcDeclineFriendInvite: ~line 13486
 */

var PLAYER_CORE_FRIENDS_MODULE = {
    name: 'player-core/friends',
    version: '1.0.0',
    rpcs: [
        'friends_list',
        'send_friend_invite',
        'accept_friend_invite',
        'decline_friend_invite',
        'friends_block',
        'friends_unblock',
        'friends_remove',
        'friends_challenge_user',
        'friends_spectate'
    ],
    description: 'Social connections (cross-game friends)'
};

if (typeof globalThis !== 'undefined') {
    globalThis.PlayerCoreModules = globalThis.PlayerCoreModules || {};
    globalThis.PlayerCoreModules.Friends = PLAYER_CORE_FRIENDS_MODULE;
}
