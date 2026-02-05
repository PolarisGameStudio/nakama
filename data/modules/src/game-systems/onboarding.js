// ============================================================================
// GAME SYSTEMS: ONBOARDING MODULE (GAME-SPECIFIC)
// ============================================================================
// Version: 1.0.0 | Date: 2026-02-05
// ============================================================================
// This module handles first-time user experience PER GAME.
// Part of GAME SYSTEMS - isolated by game_id.
//
// WHY GAME-SPECIFIC (not in player-core):
// - Each game has different welcome bonuses (QuizVerse: coins, Terminal Rush: power-ups)
// - Interests/preferences vary by game type (quiz categories vs game modes)
// - Tutorial completion states are game-specific
// - First-time rewards differ per game
// - Each game may have unique onboarding flow
//
// RPCs in this module:
// - onboarding_get_state: Get onboarding state for specific game
// - onboarding_update_state: Update onboarding progress
// - onboarding_complete_step: Mark step complete
// - onboarding_set_interests: Set game-specific preferences
// - onboarding_get_interests: Get game-specific preferences
// - onboarding_claim_welcome_bonus: Claim game's welcome bonus
// - onboarding_first_quiz_complete: Mark first quiz done (QuizVerse)
// - onboarding_get_tomorrow_preview: Preview tomorrow's content
// - onboarding_track_session: Track user session
// - onboarding_get_retention_data: Get retention metrics
// - onboarding_create_link_quiz: Create shareable quiz link
//
// Storage Patterns:
// - Collection: "onboarding"
// - Key: "state:{game_id}:{user_id}"
// - Key: "interests:{game_id}:{user_id}"
// - Key: "welcome_bonus:{game_id}:{user_id}"
//
// Game-Specific Configurations:
// Each game can have its own:
// - welcomeBonus: { coins: 100, gems: 5 } or { powerUps: 3 }
// - tutorialSteps: ["intro", "gameplay", "rewards", "social"]
// - interestCategories: ["Science", "History"] or ["Arcade", "Puzzle"]
//
// NOTE: This file is for documentation/reference only.
// The actual implementation is in the main index.js file.
// ============================================================================

/**
 * ONBOARDING MODULE - Function Index
 * 
 * RPC Handlers (registered in InitModule ~line 22478-22511):
 * - rpcOnboardingGetState
 * - rpcOnboardingUpdateState
 * - rpcOnboardingCompleteStep
 * - rpcOnboardingSetInterests
 * - rpcOnboardingGetInterests
 * - wrappedOnboardingClaimBonus (idempotent)
 * - rpcOnboardingFirstQuizComplete
 * - rpcOnboardingGetTomorrowPreview
 * - rpcOnboardingTrackSession
 * - rpcOnboardingGetRetentionData
 * - rpcOnboardingCreateLinkQuiz
 */

var GAME_SYSTEMS_ONBOARDING_MODULE = {
    name: 'game-systems/onboarding',
    version: '1.0.0',
    rpcs: [
        'onboarding_get_state',
        'onboarding_update_state',
        'onboarding_complete_step',
        'onboarding_set_interests',
        'onboarding_get_interests',
        'onboarding_claim_welcome_bonus',
        'onboarding_first_quiz_complete',
        'onboarding_get_tomorrow_preview',
        'onboarding_track_session',
        'onboarding_get_retention_data',
        'onboarding_create_link_quiz'
    ],
    scope: 'GAME_SPECIFIC',
    isolationKey: 'game_id',
    description: 'First-time user experience (per-game)'
};

// Game-specific onboarding configurations (examples)
var ONBOARDING_CONFIGS = {
    // QuizVerse
    '126bf539-dae2-4bcf-964d-316c0fa1f92b': {
        gameName: 'QuizVerse',
        welcomeBonus: {
            coins: 100,
            xp: 50
        },
        tutorialSteps: [
            'welcome',
            'select_category',
            'play_first_quiz',
            'view_results',
            'check_leaderboard',
            'claim_daily_reward'
        ],
        interestCategories: [
            'Science', 'History', 'Geography', 'Sports',
            'Entertainment', 'Art', 'Technology', 'Nature'
        ]
    },
    // Terminal Rush (example)
    'terminal-rush-uuid': {
        gameName: 'Terminal Rush',
        welcomeBonus: {
            powerUps: 3,
            lives: 5
        },
        tutorialSteps: [
            'welcome',
            'learn_controls',
            'first_level',
            'use_powerup',
            'complete_level'
        ],
        interestCategories: [
            'Arcade', 'Puzzle', 'Speed', 'Strategy'
        ]
    }
};

if (typeof globalThis !== 'undefined') {
    globalThis.GameSystemsModules = globalThis.GameSystemsModules || {};
    globalThis.GameSystemsModules.Onboarding = GAME_SYSTEMS_ONBOARDING_MODULE;
    globalThis.GameSystemsModules.OnboardingConfigs = ONBOARDING_CONFIGS;
}
