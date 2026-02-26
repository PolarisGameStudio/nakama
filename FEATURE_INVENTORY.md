# Nakama Server — Comprehensive Feature Inventory

> Auto-generated from codebase analysis of `c:\Office\Backend\nakama`

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Core Nakama Platform Features](#2-core-nakama-platform-features)
   - [Authentication (9 Methods)](#21-authentication-9-methods)
   - [Account Management](#22-account-management)
   - [Session Management](#23-session-management)
   - [Friends System](#24-friends-system)
   - [Groups / Clans](#25-groups--clans)
   - [Chat / Channels (Realtime)](#26-chat--channels-realtime)
   - [Storage Engine](#27-storage-engine)
   - [Notifications](#28-notifications)
   - [Leaderboards](#29-leaderboards)
   - [Tournaments](#210-tournaments)
   - [Matchmaking](#211-matchmaking)
   - [Authoritative Matches (Realtime)](#212-authoritative-matches-realtime)
   - [Parties](#213-parties)
   - [Wallet / Economy](#214-wallet--economy)
   - [In-App Purchases (IAP)](#215-in-app-purchases-iap)
   - [Subscriptions](#216-subscriptions)
   - [Events](#217-events)
   - [Status / Presence](#218-status--presence)
   - [Link / Unlink Identities](#219-link--unlink-identities)
3. [Server Infrastructure](#3-server-infrastructure)
   - [Runtime System (Lua + JS)](#31-runtime-system-lua--js)
   - [gRPC + REST API Gateway](#32-grpc--rest-api-gateway)
   - [WebSocket Realtime Pipeline](#33-websocket-realtime-pipeline)
   - [Metrics (Prometheus)](#34-metrics-prometheus)
   - [Admin Console (90 Endpoints)](#35-admin-console-90-endpoints)
   - [Database (CockroachDB / PostgreSQL)](#36-database-cockroachdb--postgresql)
   - [Fleet Management](#37-fleet-management)
   - [MFA (Multi-Factor Authentication)](#38-mfa-multi-factor-authentication)
   - [Satori Integration (LiveOps / Analytics)](#39-satori-integration-liveops--analytics)
   - [Segment.io Telemetry](#310-segmentio-telemetry)
   - [Configuration System](#311-configuration-system)
   - [Hook System (Before/After)](#312-hook-system-beforeafter)
4. [Custom Game Features (JavaScript Modules)](#4-custom-game-features-javascript-modules)
   - [User Onboarding & Identity](#41-user-onboarding--identity)
   - [Wallet System (Multi-Currency)](#42-wallet-system-multi-currency)
   - [Leaderboard System (Time-Period)](#43-leaderboard-system-time-period)
   - [Chat System](#44-chat-system)
   - [Friends System (Extended)](#45-friends-system-extended)
   - [Groups System (Extended)](#46-groups-system-extended)
   - [Push Notifications](#47-push-notifications)
   - [Player Data & Metadata](#48-player-data--metadata)
   - [Score & Reward System](#49-score--reward-system)
   - [Daily Rewards](#410-daily-rewards)
   - [Daily Missions](#411-daily-missions)
   - [Quiz Results & Analytics](#412-quiz-results--analytics)
   - [Game Entry (Pay-to-Play)](#413-game-entry-pay-to-play)
   - [Achievements](#414-achievements)
   - [Matchmaking (Extended)](#415-matchmaking-extended)
   - [Tournaments (Extended)](#416-tournaments-extended)
   - [Infrastructure RPCs](#417-infrastructure-rpcs)
   - [QuizVerse Game RPCs](#418-quizverse-game-rpcs)
   - [Onboarding System](#419-onboarding-system)
   - [Retention System](#420-retention-system)
   - [Weekly Goals](#421-weekly-goals)
   - [Season Pass](#422-season-pass)
   - [Monthly Milestones](#423-monthly-milestones)
   - [Collections System](#424-collections-system)
   - [Winback / Re-engagement](#425-winback--re-engagement)
   - [Progressive Unlocks](#426-progressive-unlocks)
   - [Progression / Mastery](#427-progression--mastery)
   - [Rewarded Ads](#428-rewarded-ads)
   - [Compatibility Quiz](#429-compatibility-quiz)
   - [Analytics](#430-analytics)
   - [Cleanup Utilities](#431-cleanup-utilities)
5. [Multi-Game System (QuizVerse + LastToLive)](#5-multi-game-system-quizverse--lasttolive)
6. [Lua Module Features](#6-lua-module-features)
7. [All gRPC API Endpoints (84)](#7-all-grpc-api-endpoints-84)
8. [All Console Admin Endpoints (90)](#8-all-console-admin-endpoints-90)
9. [All Custom RPC Endpoints (156+30 = 186)](#9-all-custom-rpc-endpoints-186)

---

## 1. Architecture Overview

| Component | Technology | Port |
|---|---|---|
| Game API (gRPC) | Go / gRPC | 7349 (API port - 1) |
| Game API (REST + WebSocket) | Go / gRPC-Gateway | 7350 |
| Admin Console | Go / gRPC-Gateway | 7351 |
| Database | CockroachDB / PostgreSQL | 26257 |
| Metrics | Prometheus | Configurable |
| Server Runtime (Lua) | GopherLua VM | Embedded |
| Server Runtime (JS) | V8 Engine | Embedded |
| Analytics | Satori (LiveOps) | External |
| Telemetry | Segment.io | External |

**Source:** `server/api.go`, `server/config.go`, `server/console.go`

---

## 2. Core Nakama Platform Features

### 2.1 Authentication (9 Methods)

All authentication methods support: JWT token generation, refresh tokens, before/after hooks, and single-session enforcement.

| Method | Source | Notes |
|---|---|---|
| `AuthenticateApple` | `api_authenticate.go` | Apple Sign In, requires BundleId |
| `AuthenticateCustom` | `api_authenticate.go` | Arbitrary custom ID |
| `AuthenticateDevice` | `api_authenticate.go` | Device-based auth |
| `AuthenticateEmail` | `api_authenticate.go` | Email + password |
| `AuthenticateFacebook` | `api_authenticate.go` | Facebook OAuth, can auto-import friends |
| `AuthenticateFacebookInstantGame` | `api_authenticate.go` | Facebook Instant Game signed player info |
| `AuthenticateGameCenter` | `api_authenticate.go` | Apple GameCenter |
| `AuthenticateGoogle` | `api_authenticate.go` | Google OAuth |
| `AuthenticateSteam` | `api_authenticate.go` | Steam AppID + PublisherKey, can auto-import friends |

**Session features:** `SingleSocket`, `SingleMatch`, `SingleParty`, `SingleSession` enforcement. Configurable token/refresh-token expiry.

### 2.2 Account Management

- **GetAccount** — Retrieve full account (user, wallet, devices, custom_id, email, etc.)
- **UpdateAccount** — Update display name, avatar, language, location, timezone, metadata
- **DeleteAccount** — Soft-delete with optional "recorded" flag
- **GetUsers** — Batch fetch users by ID, username, or Facebook ID

### 2.3 Session Management

- **SessionRefresh** — Refresh expiring JWT tokens
- **SessionLogout** — Invalidate refresh tokens, configurable single-session/socket/match/party
- Token expiry: configurable `token_expiry_sec` (default: 60) and `refresh_token_expiry_sec` (default: 3600)

### 2.4 Friends System

| Feature | Source |
|---|---|
| Add friends (by ID or username) | `core_friend.go` |
| Delete/remove friends | `core_friend.go` |
| Block/unblock friends | `core_friend.go` |
| List friends (with state filter + pagination) | `core_friend.go` |
| List friends-of-friends | `api_friend.go` |
| Import Facebook friends | `api_friend.go` |
| Import Steam friends | `api_friend.go` |
| Online/offline presence tracking | `core_friend.go` (via StatusRegistry) |
| Friendship states | Mutual, invite-sent, invite-received, blocked |
| Friend metadata | Stored per friend edge |

### 2.5 Groups / Clans

| Feature | Source |
|---|---|
| Create group (name, desc, lang, avatar, open/closed, max members) | `core_group.go` |
| Update group metadata/properties | `core_group.go` |
| Delete group | `core_group.go` |
| Join / Leave group | `core_group.go` |
| Add / Ban / Kick group users | `core_group.go` |
| Promote / Demote members | `core_group.go` |
| List groups (with filter + pagination) | `core_group.go` |
| List group users / user groups | `core_group.go` |
| Member roles: Owner, Admin, Member, Banned | Edge-state codes 0-4 |
| Edge count tracking | `core_group.go` |

### 2.6 Chat / Channels (Realtime)

Handled via the WebSocket pipeline (`pipeline.go`):

- **ChannelJoin** — Join a room, group, or DM channel
- **ChannelLeave** — Leave a channel
- **ChannelMessageSend** — Send a message
- **ChannelMessageUpdate** — Edit a sent message
- **ChannelMessageRemove** — Remove a message
- **ListChannelMessages** (gRPC) — Paginated message history

Channel types: Room, Group, Direct Message.

### 2.7 Storage Engine

| Feature | Source |
|---|---|
| Read objects (batch) | `core_storage.go` |
| Write objects (batch, with version check) | `core_storage.go` |
| Delete objects (batch) | `core_storage.go` |
| List objects (by collection, user, public) | `core_storage.go` |
| Permission model | Read: 0=none, 1=owner, 2=public; Write: 0=none, 1=owner |
| Cursor-based pagination | `core_storage.go` |
| Version tracking (MD5 hash) | `core_storage.go` |
| Collection/Key/UserId addressing | `core_storage.go` |
| Index-only storage queries | `config.go` (StorageConfig) |

### 2.8 Notifications

| Feature | Source |
|---|---|
| Send to single user | `core_notification.go` |
| Broadcast to all users (batched) | `core_notification.go` |
| Persistent + non-persistent modes | `core_notification.go` |
| Live delivery via streams | `core_notification.go` |
| List + delete notifications | API endpoints |

**Built-in notification codes:**

| Code | Meaning |
|---|---|
| -1 | DM Request |
| -2 | Friend Request |
| -3 | Friend Accept |
| -4 | Group Add |
| -5 | Group Join Request |
| -6 | Friend Join Game |
| -7 | Single Socket |
| -8 | User Banned |
| -9 | Friend Remove |

### 2.9 Leaderboards

| Feature | Source |
|---|---|
| Create leaderboard (sort order, operator, reset schedule) | `leaderboard_cache.go` |
| Sort orders: Ascending, Descending | `leaderboard_cache.go` |
| Operators: Best, Set, Increment, Decrement | `leaderboard_cache.go` |
| Cron-based reset schedule | `leaderboard_cache.go` |
| Write / Delete / List records | API endpoints |
| List records around owner | API endpoint |
| Rank cache (configurable, blacklist supported) | `config.go` |
| Authoritative mode | `leaderboard_cache.go` |
| MaxSize + MaxNumScore caps | `leaderboard_cache.go` |
| JoinRequired flag | `leaderboard_cache.go` |
| Enable/disable ranks | `leaderboard_cache.go` |
| Metadata per record | `leaderboard_cache.go` |
| Callback queue + workers | `config.go` |

### 2.10 Tournaments

Tournaments are leaderboards with duration. Source: `core_tournament.go`, `leaderboard_cache.go`.

| Feature | Details |
|---|---|
| Create tournament | Duration, reset schedule, categories, max size, join required |
| Join tournament | TournamentJoin |
| Submit score | WriteTournamentRecord |
| Delete record | DeleteTournamentRecord |
| List active tournaments | ListTournaments (with category/date filters) |
| List records / around owner | ListTournamentRecords, ListTournamentRecordsAroundOwner |
| Add attempts | TournamentAddAttempt |
| Tournament lifecycle | Active → Expiry → Reset callbacks |
| Cron-based reset | `core_tournament.go` |

### 2.11 Matchmaking

| Feature | Source |
|---|---|
| Bluge-based search indexing | `matchmaker.go` |
| String + numeric properties | `matchmaker.go` |
| Min/max player count | `matchmaker.go` |
| Count multiple | `matchmaker.go` |
| Party support | `matchmaker.go` |
| Ticket-based system | `matchmaker.go` |
| Add / Remove tickets | `matchmaker.go` |
| Pause / Resume | `matchmaker.go` |
| Configurable intervals (default 15s) | `config.go` |
| Max tickets per session (default 3) | `config.go` |
| Reverse precision matching | `config.go` |
| GetMatchmakerStats | API endpoint |

### 2.12 Authoritative Matches (Realtime)

| Feature | Source |
|---|---|
| Tick-based game loop | `match_handler.go` |
| Configurable tick rate | `match_handler.go` |
| Match lifecycle: Init → Loop → JoinAttempt → Join → Leave → Signal → Terminate | `match_handler.go` |
| Input queue | `config.go` (default 128) |
| Call queue | `config.go` (default 128) |
| Signal queue | `config.go` (default 10) |
| Join attempt queue | `config.go` (default 128) |
| Deferred message queue | `config.go` (default 128) |
| Max empty seconds | `config.go` (default unlimited) |
| Label update interval | `config.go` (default 1000ms) |
| Match data send (via WebSocket) | `pipeline.go` |
| Match create / join / leave | `pipeline.go` |
| List matches | API endpoint |
| Match signals | For external communication |

### 2.13 Parties

| Feature | Source |
|---|---|
| Create party | `pipeline.go` |
| Join / Leave party | `pipeline.go` |
| Promote leader | `pipeline.go` |
| Accept / Remove members | `pipeline.go` |
| Close party | `pipeline.go` |
| Join request list | `pipeline.go` |
| Party matchmaker add / remove | `pipeline.go` |
| Party data send | `pipeline.go` |
| Party update | `pipeline.go` |
| List parties | API endpoint |
| Party label update interval | `config.go` (default 1000ms) |

### 2.14 Wallet / Economy

| Feature | Source |
|---|---|
| Wallet update (with changeset) | `core_wallet.go` |
| Ledger tracking (full audit trail) | `core_wallet.go` |
| Negative balance protection | `core_wallet.go` (`WalletNegativeError`) |
| Batch wallet updates (multi-user) | `core_wallet.go` |
| Transactional updates (via CockroachDB) | `core_wallet.go` |

### 2.15 In-App Purchases (IAP)

| Store | Validation Method | Source |
|---|---|---|
| **Apple App Store** | Receipt validation (production + sandbox auto-fallback) | `iap/iap.go` |
| **Google Play Store** | Service Account JWT auth, purchase state validation | `iap/iap.go` |
| **Huawei AppGallery** | Public key signature verification, OAuth token auth | `iap/iap.go` |
| **Facebook Instant Games** | App secret HMAC verification | `iap/iap.go` |

**Additional IAP features:**
- Persist / no-persist options
- Seen-before duplicate detection
- Apple auto-renewable subscription support (shared_password)
- Google/Apple notifications endpoint callbacks
- Token caching (Google, Huawei)

**API Endpoints:** `ValidatePurchaseApple`, `ValidatePurchaseGoogle`, `ValidatePurchaseHuawei`, `ValidatePurchaseFacebookInstant`

### 2.16 Subscriptions

| Feature | Source |
|---|---|
| Validate Apple subscription | `ValidateSubscriptionApple` |
| Validate Google subscription | `ValidateSubscriptionGoogle` |
| Get subscription by ID | `GetSubscription` |
| List subscriptions (paginated) | `ListSubscriptions` |
| Tracking: product_id, purchase_time, expire_time, refund_time | `core_subscription.go` |
| Active status calculation | `core_subscription.go` |

### 2.17 Events

- **Event** — Client-to-server custom event submission (gRPC endpoint)
- Event queue with configurable size (default 65536) and workers (default 8)

### 2.18 Status / Presence

- **StatusFollow** — Follow users' online presence
- **StatusUnfollow** — Unfollow users
- **StatusUpdate** — Update own status message
- Stream-based presence tracking via Tracker

### 2.19 Link / Unlink Identities

9 identity providers can be linked/unlinked post-registration:

| Provider | Link | Unlink |
|---|---|---|
| Apple | `LinkApple` | `UnlinkApple` |
| Custom | `LinkCustom` | `UnlinkCustom` |
| Device | `LinkDevice` | `UnlinkDevice` |
| Email | `LinkEmail` | `UnlinkEmail` |
| Facebook | `LinkFacebook` | `UnlinkFacebook` |
| Facebook Instant Game | `LinkFacebookInstantGame` | `UnlinkFacebookInstantGame` |
| GameCenter | `LinkGameCenter` | `UnlinkGameCenter` |
| Google | `LinkGoogle` | `UnlinkGoogle` |
| Steam | `LinkSteam` | `UnlinkSteam` |

---

## 3. Server Infrastructure

### 3.1 Runtime System (Lua + JS)

| Feature | Details |
|---|---|
| **Lua Runtime** | GopherLua VM, min 16 / max 48 instances, call stack 128, registry 512 |
| **JS Runtime** | V8 engine, min 16 / max 32 instances, configurable entrypoint |
| **Go Modules** | Native Go plugin support |
| **Read-only globals** | Memory optimization (default: true for both) |
| **Environment variables** | Passthrough to runtime context |
| **HTTP key** | Authenticates RPC calls via REST |
| **Event queue** | 65536 buffer, 8 workers |
| **Lua stacktrace** | Optional in error responses |

### 3.2 gRPC + REST API Gateway

- gRPC server on port `API_PORT - 1` (default 7349)
- gRPC-Gateway (REST) + WebSocket on `API_PORT` (default 7350)
- CORS support, gzip compression, TLS optional
- JSON marshaling with original proto field names
- Max message size configurable (default 4MB)

### 3.3 WebSocket Realtime Pipeline

30 realtime message types handled in `pipeline.go`:

| Category | Messages |
|---|---|
| **Channel** | Join, Leave, MessageSend, MessageUpdate, MessageRemove |
| **Match** | Create, DataSend, Join, Leave |
| **Matchmaker** | Add, Remove |
| **Status** | Follow, Unfollow, Update |
| **Party** | Create, Join, Leave, Promote, Accept, Remove, Close, JoinRequestList, MatchmakerAdd, MatchmakerRemove, DataSend, Update |
| **Other** | Ping, Pong, Rpc |

All messages support before/after hooks.

### 3.4 Metrics (Prometheus)

| Metric Type | Metrics |
|---|---|
| **Histograms** | API latency per endpoint |
| **Counters** | Request count, recv/sent bytes, DroppedEvents, WebsocketOpened/Closed |
| **Gauges** | Runtimes, AuthoritativeMatches, Sessions, Presences, StorageIndexEntries |
| **Custom** | Counter, Gauge, Timer (runtime-defined) |
| **DB stats** | Refreshed on Prometheus scrape |

Configuration: namespace, prefix, custom metrics, configurable port.

### 3.5 Admin Console (90 Endpoints)

The admin console runs on port 7351 with JWT auth, ACL, audit logging, and MFA support.

**Console RPC Endpoints (from `console.proto`):**

| Category | Endpoints |
|---|---|
| **Auth** | Authenticate, AuthenticateLogout, AuthenticateMFASetup |
| **Account Notes** | AddAccountNote, ListAccountNotes, DeleteAccountNote |
| **ACL Templates** | AddAclTemplate, UpdateAclTemplate, ListAclTemplates, DeleteAclTemplate |
| **Users (Admin)** | AddUser, ResetUserPassword, DeleteUser, ListUsers, GetUser, UpdateUser |
| **Accounts** | GetAccount, UpdateAccount, DeleteAccount, DeleteAccounts, BanAccount, UnbanAccount, ListAccounts, ExportAccount, ImportAccount, ImportAccountFull |
| **Groups** | AddGroupUsers, DeleteGroup, DeleteGroupUser, GetGroup, GetGroups, GetMembers, ListGroups, UpdateGroup, ExportGroup, PromoteGroupMember, DemoteGroupMember |
| **Friends** | GetFriends, DeleteFriend |
| **Storage** | GetStorage, WriteStorageObject, DeleteStorage, DeleteStorageObject, ListStorage, ListStorageCollections |
| **Leaderboards** | GetLeaderboard, DeleteLeaderboard, DeleteLeaderboardRecord, ListLeaderboards, ListLeaderboardRecords |
| **Channels** | ListChannelMessages, DeleteChannelMessages |
| **Notifications** | GetNotification, ListNotifications, DeleteNotification, SendNotification |
| **Matches** | GetMatchState, ListMatches |
| **Purchases** | GetPurchase, ListPurchases |
| **Subscriptions** | GetSubscription, ListSubscriptions |
| **Wallet** | GetWalletLedger, DeleteWalletLedger |
| **MFA** | RequireUserMfa, ResetUserMfa |
| **Unlink** | UnlinkCustom, UnlinkDevice, UnlinkEmail, UnlinkApple, UnlinkFacebook, UnlinkFacebookInstantGame, UnlinkGameCenter, UnlinkGoogle, UnlinkSteam |
| **System** | CallApiEndpoint, CallRpcEndpoint, DeleteAllData, GetConfig, GetRuntime, GetStatus, ListApiEndpoints, ListSettings, GetSetting, UpdateSetting |
| **Satori** | SatoriListTemplates, SatoriSendDirectMessage |
| **Audit** | ListAuditLogs, ListAuditLogsUsers |
| **Other** | RegisteredExtensions |

### 3.6 Database (CockroachDB / PostgreSQL)

- Default: `root@localhost:26257`
- Max open connections: 100
- Connection pooling with min idle connections
- DNS scan interval: 60s
- SSL mode support
- Migration system in `migrate/sql/`

### 3.7 Fleet Management

- Callback handler for distributed game server instances (`fleet_manager_callback_handler.go`)
- UUID-based callback registration
- Async invocation for scaling events

### 3.8 MFA (Multi-Factor Authentication)

- Console-level MFA support
- 32-byte storage encryption key
- Optional AdminAccountOn enforcement
- Setup via `AuthenticateMFASetup`, manage via `RequireUserMfa`, `ResetUserMfa`

### 3.9 Satori Integration (LiveOps / Analytics)

- URL-based configuration
- API key authentication (key name + key)
- Signing key for session tokens
- Response caching (configurable)
- HTTP timeout (default 2s)
- Console integration: `SatoriListTemplates`, `SatoriSendDirectMessage`

### 3.10 Segment.io Telemetry

- Server telemetry via Segment.io (`se/se.go`)
- Start/end lifecycle events
- Server name, version, startup configuration

### 3.11 Configuration System

**Full config sections** (from `server/config.go`):

| Section | Key Settings |
|---|---|
| **Name** | Server name identifier |
| **Logger** | Level, stdout, file, rotation |
| **Metrics** | Prometheus namespace, prefix, port, custom metrics |
| **Session** | Token expiry (60s), refresh expiry (3600s), single socket/match/party/session |
| **Socket** | Port 7350, TLS, ping/pong, outgoing queue, max message 4MB |
| **Database** | CockroachDB conn string, pool size (100), DNS scan interval |
| **Social** | Steam (AppID, PublisherKey), Facebook Instant (AppSecret), Facebook Limited Login, Apple (BundleId) |
| **Runtime** | Lua (16-48 instances), JS (16-32 instances), HTTP key, event queue, entrypoint |
| **Match** | Input/call/signal/join/deferred queue sizes, max empty sec, label update interval |
| **Tracker** | Event queue size (1024) |
| **Console** | Port 7351, username/password, token expiry, MFA |
| **Leaderboard** | Blacklist rank cache, callback queue/workers, rank cache workers |
| **Matchmaker** | Max tickets (3), interval (15s), max intervals (2), reverse precision |
| **IAP** | Apple, Google, Huawei, Facebook Instant configs |
| **GoogleAuth** | Credentials JSON, OAuth config |
| **Satori** | URL, API key, signing key, cache, timeout |
| **Storage** | disable_index_only flag |
| **MFA** | Encryption key (32 bytes), admin account toggle |
| **Party** | Label update interval (1000ms) |

### 3.12 Hook System (Before/After)

Every API endpoint supports `Before` and `After` hooks registered via the runtime. Source: `server/runtime.go` (3616 lines).

**Hook categories:**

- All 9 authentication methods
- All channel message operations
- All friend operations (list, add, delete, block, import)
- All group operations (create, update, delete, join, leave, add/ban/kick/promote/demote, list)
- All leaderboard operations (write, delete, list records)
- All tournament operations (join, write, list)
- All match operations (create, list)
- All notification operations (list, delete)
- All storage operations (read, write, delete, list)
- All purchase validations
- All subscription validations
- Account operations (get, update)
- Session operations (refresh, logout)
- Event submission
- RPC calls

---

## 4. Custom Game Features (JavaScript Modules)

All custom RPCs are registered in `data/modules/index.js` (18,902 lines consolidated). Module source files are organized under `data/modules/`.

### 4.1 User Onboarding & Identity

**Source:** `data/modules/copilot/index.js`, `data/modules/identity.js`

| RPC | Description |
|---|---|
| `create_or_sync_user` | Create new user or sync existing account |
| `create_or_get_wallet` | Initialize or retrieve user wallet |

**Identity features:**
- Device-to-game identity management
- Wallet ID generation per user
- Legacy migration from system-user to user-scoped storage
- Cognito/IDP integration support

### 4.2 Wallet System (Multi-Currency)

**Source:** `data/modules/wallet/wallet.js`, `data/modules/copilot/wallet_utils.js`, `data/modules/copilot/wallet_registry.js`

| RPC | Description |
|---|---|
| `get_user_wallet` | Get wallet by user ID |
| `link_wallet_to_game` | Associate wallet with a specific game |
| `get_wallet_registry` | Get wallet → game mappings |
| `wallet_get_all` | Get all wallets for a user |
| `wallet_update_global` | Update global (cross-game) wallet |
| `wallet_update_game_wallet` | Update game-specific wallet |
| `wallet_transfer_between_game_wallets` | Transfer currency between game wallets |
| `wallet_get_balances` | Get balance across all wallets |

**Wallet features:**
- Multi-currency support: `game`, `global`, `tokens`, `xut`, `xp`
- Game-scoped wallets (per-game balances)
- Global wallet (cross-game)
- Legacy deviceId-to-userId migration
- Wallet registry for game↔wallet mapping

### 4.3 Leaderboard System (Time-Period)

**Source:** `data/modules/copilot/leaderboard_sync.js`, `data/modules/copilot/leaderboard_aggregate.js`, `data/modules/copilot/leaderboard_friends.js`

| RPC | Description |
|---|---|
| `submit_score_and_sync` | Submit + sync across boards |
| `get_all_leaderboards` | List all leaderboards |
| `submit_score_sync` | Submit with sync |
| `submit_score_with_aggregate` | Submit + aggregate across time periods |
| `create_all_leaderboards_with_friends` | Create boards including friend rankings |
| `submit_score_with_friends_sync` | Submit + sync friend leaderboards |
| `get_friend_leaderboard` | Get friend-only leaderboard |
| `create_all_leaderboards_persistent` | Create all persistent boards |
| `create_time_period_leaderboards` | Create daily/weekly/monthly/alltime boards |
| `submit_score_to_time_periods` | Submit score to all time period boards |
| `get_time_period_leaderboard` | Get a specific time-period board |

**Leaderboard features:**
- Auto-creation of game-specific + global boards
- Time periods: daily, weekly, monthly, all-time
- Friend leaderboards
- Aggregate scoring across multiple boards per submission
- Persistent leaderboards

### 4.4 Chat System

**Source:** `data/modules/copilot/social_features.js`, `data/modules/chat.js`

| RPC | Description |
|---|---|
| `send_group_chat_message` | Send message to a group chat |
| `send_direct_message` | Send DM to another user |
| `send_chat_room_message` | Send to a named chat room |
| `get_group_chat_history` | Paginated group chat history |
| `get_direct_message_history` | Paginated DM history |
| `get_chat_room_history` | Paginated room history |
| `mark_direct_messages_read` | Mark DMs as read |

**Chat features:**
- Group, DM, and Room channel types
- Nakama channels for realtime + storage for persistence
- Notification on DM receipt
- Message history with cursor pagination

### 4.5 Friends System (Extended)

**Source:** `data/modules/friends/friends.js`, `data/modules/copilot/social_features.js`

| RPC | Description |
|---|---|
| `send_friend_invite` | Send friend request |
| `accept_friend_invite` | Accept pending invite |
| `decline_friend_invite` | Decline pending invite |
| `get_notifications` | Get friend-related notifications |
| `friends_block` | Block a user |
| `friends_unblock` | Unblock a user |
| `friends_remove` | Remove a friend |
| `friends_list` | List all friends |
| `friends_challenge_user` | Send challenge to a friend |
| `friends_spectate` | Spectate a friend's game |

### 4.6 Groups System (Extended)

**Source:** `data/modules/groups/groups.js`

| RPC | Description |
|---|---|
| `create_game_group` | Create a game-specific group |
| `update_group_xp` | Add XP to a group |
| `get_group_wallet` | Get group's shared wallet |
| `update_group_wallet` | Update group wallet balance |
| `get_user_groups` | Get groups a user belongs to |

### 4.7 Push Notifications

**Source:** `data/modules/push_notifications/push_notifications.js`

| RPC | Description |
|---|---|
| `push_register_token` | Register device push token |
| `push_send_event` | Trigger push notification event |
| `push_get_endpoints` | Get registered push endpoints |

### 4.8 Player Data & Metadata

**Source:** `data/modules/player_rpcs.js`, `data/modules/copilot/index.js`

| RPC | Description |
|---|---|
| `create_player_wallet` | Initialize player wallet |
| `update_wallet_balance` | Update wallet amount |
| `get_wallet_balance` | Get current balance |
| `submit_leaderboard_score` | Submit score to leaderboard |
| `get_leaderboard` | Get leaderboard records |
| `check_geo_and_update_profile` | Geolocation check + profile update |
| `get_player_portfolio` | Get player portfolio data |
| `rpc_update_player_metadata` | Update player metadata (unified) |
| `get_player_metadata` | Read player metadata |
| `admin_delete_player_metadata` | Admin: delete player metadata |

### 4.9 Score & Reward System

**Source:** `data/modules/copilot/index.js`

| RPC | Description |
|---|---|
| `calculate_score_reward` | Calculate reward based on score |
| `update_game_reward_config` | Update reward configuration |

### 4.10 Daily Rewards

**Source:** `data/modules/daily_rewards/daily_rewards.js`

| RPC | Description |
|---|---|
| `daily_rewards_get_status` | Get daily reward status (streak, claimable) |
| `daily_rewards_claim` | Claim daily reward |

### 4.11 Daily Missions

**Source:** `data/modules/daily_missions/daily_missions.js`

| RPC | Description |
|---|---|
| `get_daily_missions` | Get today's mission list |
| `submit_mission_progress` | Report mission progress |
| `claim_mission_reward` | Claim completed mission reward |

### 4.12 Quiz Results & Analytics

**Source:** `data/modules/quiz_results/quiz_results.js`

| RPC | Description |
|---|---|
| `quiz_submit_result` | Submit quiz result |
| `quiz_get_history` | Get quiz history |
| `quiz_get_stats` | Get aggregated quiz statistics |
| `quiz_check_daily_completion` | Check if daily quiz is completed |

### 4.13 Game Entry (Pay-to-Play)

**Source:** `data/modules/copilot/index.js`

| RPC | Description |
|---|---|
| `game_entry_validate` | Validate entry requirements (currency check) |
| `game_entry_complete` | Complete entry and deduct currency |
| `game_entry_get_status` | Get entry status |

### 4.14 Achievements

**Source:** `data/modules/achievements/achievements.js`

| RPC | Description |
|---|---|
| `achievements_get_all` | Get all achievements + progress |
| `achievements_update_progress` | Update achievement progress |
| `achievements_create_definition` | Create new achievement definition |
| `achievements_bulk_create` | Bulk create achievement definitions |

### 4.15 Matchmaking (Extended)

**Source:** `data/modules/matchmaking/matchmaking.js`

| RPC | Description |
|---|---|
| `matchmaking_find_match` | Find match with custom parameters |
| `matchmaking_cancel` | Cancel matchmaking ticket |
| `matchmaking_get_status` | Get matchmaking status |
| `matchmaking_create_party` | Create matchmaking party |
| `matchmaking_join_party` | Join existing party |

### 4.16 Tournaments (Extended)

**Source:** `data/modules/tournaments/tournaments.js`

| RPC | Description |
|---|---|
| `tournament_create` | Create a tournament |
| `tournament_join` | Join a tournament |
| `tournament_list_active` | List active tournaments |
| `tournament_submit_score` | Submit tournament score |
| `tournament_get_leaderboard` | Get tournament leaderboard |
| `tournament_claim_rewards` | Claim tournament rewards |

### 4.17 Infrastructure RPCs

**Source:** `data/modules/infrastructure/batch_operations.js`, `caching.js`, `rate_limiting.js`

| RPC | Description |
|---|---|
| `batch_execute` | Execute multiple RPCs in one call |
| `batch_wallet_operations` | Batch wallet updates |
| `batch_achievement_progress` | Batch achievement progress updates |
| `rate_limit_status` | Check rate limit status |
| `cache_stats` | Get cache statistics |
| `cache_clear` | Clear server-side cache |

### 4.18 QuizVerse Game RPCs

**Source:** `data/modules/copilot/index.js`

| RPC | Description |
|---|---|
| `quizverse_submit_score` | Submit QuizVerse score |
| `quizverse_get_leaderboard` | Get QuizVerse leaderboard |
| `quizverse_submit_multiplayer_match` | Submit multiplayer match result |

### 4.19 Onboarding System

**Source:** `data/modules/onboarding/onboarding.js`

| RPC | Description |
|---|---|
| `onboarding_get_state` | Get onboarding progress state |
| `onboarding_update_state` | Update onboarding state |
| `onboarding_complete_step` | Mark onboarding step complete |
| `onboarding_set_interests` | Set user interests/preferences |
| `onboarding_get_interests` | Get user interests |
| `onboarding_claim_welcome_bonus` | Claim welcome bonus reward |
| `onboarding_first_quiz_complete` | Mark first quiz as complete |
| `onboarding_get_tomorrow_preview` | Preview tomorrow's content |
| `onboarding_track_session` | Track session for retention |
| `onboarding_get_retention_data` | Get retention analytics data |
| `onboarding_create_link_quiz` | Create a shareable quiz link |

### 4.20 Retention System

**Source:** `data/modules/retention/` (multiple files)

| RPC | Description |
|---|---|
| `retention_grant_streak_shield` | Grant streak protection shield |
| `retention_get_streak_shield` | Get streak shield status |
| `retention_use_streak_shield` | Use streak shield |
| `retention_schedule_notification` | Schedule retention notification |
| `retention_get_recommendations` | Get content recommendations |
| `retention_track_first_session` | Track user's first session |
| `retention_claim_welcome_bonus` | Claim retention welcome bonus |

### 4.21 Weekly Goals

**Source:** `data/modules/retention/weekly_goals.js`

| RPC | Description |
|---|---|
| `weekly_goals_get_status` | Get weekly goals progress |
| `weekly_goals_update_progress` | Update goal progress |
| `weekly_goals_claim_reward` | Claim weekly goal reward |
| `weekly_goals_claim_bonus` | Claim bonus for completing all goals |

### 4.22 Season Pass

**Source:** `data/modules/retention/season_pass.js`

| RPC | Description |
|---|---|
| `season_pass_get_status` | Get season pass level/rewards |
| `season_pass_add_xp` | Add XP to season pass |
| `season_pass_complete_quest` | Complete a season pass quest |
| `season_pass_claim_reward` | Claim tier reward |
| `season_pass_purchase_premium` | Upgrade to premium season pass |

### 4.23 Monthly Milestones

**Source:** `data/modules/retention/monthly_milestones.js`

| RPC | Description |
|---|---|
| `monthly_milestones_get_status` | Get milestone progress |
| `monthly_milestones_update_progress` | Update milestone progress |
| `monthly_milestones_claim_reward` | Claim milestone reward |
| `monthly_milestones_claim_legendary` | Claim legendary milestone reward |

### 4.24 Collections System

**Source:** `data/modules/retention/collections.js`

| RPC | Description |
|---|---|
| `collections_get_status` | Get collection status |
| `collections_unlock_item` | Unlock a collectible item |
| `collections_equip_item` | Equip a collectible item |
| `collections_add_mastery_xp` | Add mastery XP to collection |

### 4.25 Winback / Re-engagement

**Source:** `data/modules/retention/winback.js`

| RPC | Description |
|---|---|
| `winback_check_status` | Check winback eligibility |
| `winback_claim_rewards` | Claim winback rewards |
| `winback_record_session` | Record session for winback tracking |
| `winback_schedule_reengagement` | Schedule re-engagement push |

### 4.26 Progressive Unlocks

**Source:** `data/modules/progression/progressive_unlocks.js`

| RPC | Description |
|---|---|
| `progressive_get_state` | Get unlock state |
| `progressive_claim_unlock` | Claim an unlocked feature |
| `progressive_check_feature` | Check if feature is unlocked |
| `progressive_update_progress` | Update unlock progress |

### 4.27 Progression / Mastery

**Source:** `data/modules/progression/mastery_system.js`

| RPC | Description |
|---|---|
| `progression_add_mastery_xp` | Add mastery XP |
| `progression_get_state` | Get mastery/progression state |
| `progression_claim_prestige` | Claim prestige level reward |

### 4.28 Rewarded Ads

**Source:** `data/modules/rewarded_ads/rewarded_ads.js`

| RPC | Description |
|---|---|
| `rewarded_ad_request_token` | Request ad watch token |
| `rewarded_ad_claim` | Claim ad reward |
| `rewarded_ad_validate_score_multiplier` | Validate score multiplier from ad |
| `rewarded_ad_get_status` | Get rewarded ad availability |

### 4.29 Compatibility Quiz

**Source:** `data/modules/` (compatibility quiz module)

| RPC | Description |
|---|---|
| `compatibility_create_session` | Create a compatibility quiz session |
| `compatibility_join_session` | Join an existing quiz session |
| `compatibility_get_session` | Get session details |
| `compatibility_submit_answers` | Submit quiz answers |
| `compatibility_calculate` | Calculate compatibility result |
| `compatibility_list_sessions` | List user's quiz sessions |

### 4.30 Analytics

**Source:** `data/modules/analytics/analytics.js`

| RPC | Description |
|---|---|
| `analytics_log_event` | Log custom analytics event |

### 4.31 Cleanup Utilities

| RPC | Description |
|---|---|
| `cleanup_guest_user_metadata` | Clean up guest user metadata |

### 4.32 Game Registry

**Source:** `data/modules/copilot/index.js`

| RPC | Description |
|---|---|
| `get_game_registry` | Get list of registered games |
| `get_game_by_id` | Get game by ID |
| `sync_game_registry` | Sync game registry data |

---

## 5. Multi-Game System (QuizVerse + LastToLive)

**Source:** `data/modules/multigame_rpcs.js` (1,271 lines)

A dynamic multi-game RPC registration system. Each game gets its own prefixed set of RPCs providing a standardized feature set.

### QuizVerse RPCs (14)

| RPC | Description |
|---|---|
| `quizverse_update_user_profile` | Update QuizVerse player profile |
| `quizverse_grant_currency` | Grant in-game currency |
| `quizverse_spend_currency` | Spend in-game currency |
| `quizverse_validate_purchase` | Validate IAP purchase |
| `quizverse_list_inventory` | List player inventory |
| `quizverse_grant_item` | Grant inventory item |
| `quizverse_consume_item` | Consume inventory item |
| `quizverse_submit_score` | Submit game score |
| `quizverse_get_leaderboard` | Get game leaderboard |
| `quizverse_join_or_create_match` | Join or create multiplayer match |
| `quizverse_claim_daily_reward` | Claim daily reward |
| `quizverse_find_friends` | Find friends in game |
| `quizverse_save_player_data` | Save player data blob |
| `quizverse_load_player_data` | Load player data blob |

### LastToLive RPCs (14)

| RPC | Description |
|---|---|
| `lasttolive_update_user_profile` | Update LastToLive player profile |
| `lasttolive_grant_currency` | Grant in-game currency |
| `lasttolive_spend_currency` | Spend in-game currency |
| `lasttolive_validate_purchase` | Validate IAP purchase |
| `lasttolive_list_inventory` | List player inventory |
| `lasttolive_grant_item` | Grant inventory item |
| `lasttolive_consume_item` | Consume inventory item |
| `lasttolive_submit_score` | Submit game score |
| `lasttolive_get_leaderboard` | Get game leaderboard |
| `lasttolive_join_or_create_match` | Join or create multiplayer match |
| `lasttolive_claim_daily_reward` | Claim daily reward |
| `lasttolive_find_friends` | Find friends in game |
| `lasttolive_save_player_data` | Save player data blob |
| `lasttolive_load_player_data` | Load player data blob |

**Multi-game features per game:**
- User profile management
- Currency (grant/spend)
- IAP validation
- Inventory (list/grant/consume)
- Score submission + leaderboards
- Matchmaking (join/create)
- Daily rewards
- Friend discovery
- Player data save/load

---

## 6. Lua Module Features

**Source:** `data/modules/*.lua`

### RPCs (Lua)

| RPC ID | Source | Description |
|---|---|---|
| `rpc` | `clientrpc.lua` | Test echo RPC |
| `rpc_error` | `clientrpc.lua` | Test error RPC |
| `rpc_get` | `clientrpc.lua` | Test GET RPC |
| `send_notification` | `clientrpc.lua` | Test notification sender |
| `send_stream_data` | `clientrpc.lua` | Test stream data sender |
| `create_authoritative_match` | `clientrpc.lua` | Create authoritative match |
| `print_env` | `clientrpc.lua` | Print runtime environment |
| `create_leaderboard` | `clientrpc.lua` | Create test leaderboard |
| `lb.submit_score` | `leaderboards.lua` | Submit leaderboard score |
| `lb.get` | `leaderboards.lua` | Get leaderboard records |
| `iap.apple_verify_payment` | `iap_verifier_rpc.lua` | Apple IAP verification |
| `iap.google_verify_payment` | `iap_verifier_rpc.lua` | Google IAP verification |
| `t.create` | `tournament.lua` | Create tournament |
| `t.delete` | `tournament.lua` | Delete tournament |
| `t.addattempt` | `tournament.lua` | Add tournament attempt |

### Authoritative Match (Lua)

**Source:** `match.lua` (375 lines)

- `match_init` — Initialize match state
- `match_join_attempt` — Validate join request
- `match_join` — Handle player join
- `match_leave` — Handle player leave
- `match_loop` — Tick-based game loop
- `match_signal` — External signal handler
- `match_terminate` — Cleanup on match end

### P2P Relay Match (Lua)

**Source:** `p2prelayer.lua`

- Peer-to-peer relay match handler
- Lightweight alternative to authoritative matches

### Callbacks (Lua)

**Source:** `tournament.lua`

- `tournament_end` — Callback when tournament ends
- `tournament_reset` — Callback when tournament resets
- `leaderboard_reset` — Callback when leaderboard resets

### Utilities (Lua)

- **iap_verifier.lua** — Apple + Google IAP receipt verification module
- **debug_utils.lua** — `print_r` table dump utility

---

## 7. All gRPC API Endpoints (84)

From `apigrpc/apigrpc.proto`:

### Authentication (11)
1. `AuthenticateApple`
2. `AuthenticateCustom`
3. `AuthenticateDevice`
4. `AuthenticateEmail`
5. `AuthenticateFacebook`
6. `AuthenticateFacebookInstantGame`
7. `AuthenticateGameCenter`
8. `AuthenticateGoogle`
9. `AuthenticateSteam`
10. `SessionRefresh`
11. `SessionLogout`

### Account (3)
12. `GetAccount`
13. `UpdateAccount`
14. `DeleteAccount`

### Users (1)
15. `GetUsers`

### Friends (7)
16. `AddFriends`
17. `DeleteFriends`
18. `BlockFriends`
19. `ListFriends`
20. `ListFriendsOfFriends`
21. `ImportFacebookFriends`
22. `ImportSteamFriends`

### Groups (11)
23. `CreateGroup`
24. `UpdateGroup`
25. `DeleteGroup`
26. `JoinGroup`
27. `LeaveGroup`
28. `AddGroupUsers`
29. `BanGroupUsers`
30. `KickGroupUsers`
31. `PromoteGroupUsers`
32. `DemoteGroupUsers`
33. `ListGroups`

### Group Members (2)
34. `ListGroupUsers`
35. `ListUserGroups`

### Channels (1)
36. `ListChannelMessages`

### Leaderboards (4)
37. `WriteLeaderboardRecord`
38. `DeleteLeaderboardRecord`
39. `ListLeaderboardRecords`
40. `ListLeaderboardRecordsAroundOwner`

### Tournaments (6)
41. `JoinTournament`
42. `WriteTournamentRecord`
43. `DeleteTournamentRecord`
44. `ListTournaments`
45. `ListTournamentRecords`
46. `ListTournamentRecordsAroundOwner`

### Storage (4)
47. `ReadStorageObjects`
48. `WriteStorageObjects`
49. `DeleteStorageObjects`
50. `ListStorageObjects`

### Notifications (2)
51. `ListNotifications`
52. `DeleteNotifications`

### Matches (1)
53. `ListMatches`

### Parties (1)
54. `ListParties`

### Matchmaker (1)
55. `GetMatchmakerStats`

### IAP / Purchases (4)
56. `ValidatePurchaseApple`
57. `ValidatePurchaseGoogle`
58. `ValidatePurchaseHuawei`
59. `ValidatePurchaseFacebookInstant`

### Subscriptions (4)
60. `ValidateSubscriptionApple`
61. `ValidateSubscriptionGoogle`
62. `GetSubscription`
63. `ListSubscriptions`

### Link (9)
64. `LinkApple`
65. `LinkCustom`
66. `LinkDevice`
67. `LinkEmail`
68. `LinkFacebook`
69. `LinkFacebookInstantGame`
70. `LinkGameCenter`
71. `LinkGoogle`
72. `LinkSteam`

### Unlink (9)
73. `UnlinkApple`
74. `UnlinkCustom`
75. `UnlinkDevice`
76. `UnlinkEmail`
77. `UnlinkFacebook`
78. `UnlinkFacebookInstantGame`
79. `UnlinkGameCenter`
80. `UnlinkGoogle`
81. `UnlinkSteam`

### Other (3)
82. `RpcFunc`
83. `Event`
84. `Healthcheck`

---

## 8. All Console Admin Endpoints (90)

From `console/console.proto`:

1. Authenticate
2. AuthenticateLogout
3. AuthenticateMFASetup
4. AddAccountNote
5. ListAccountNotes
6. AddAclTemplate
7. UpdateAclTemplate
8. ListAclTemplates
9. DeleteAclTemplate
10. DeleteAccountNote
11. AddUser
12. ResetUserPassword
13. AddGroupUsers
14. BanAccount
15. CallApiEndpoint
16. CallRpcEndpoint
17. DeleteAllData
18. DeleteAccount
19. DeleteChannelMessages
20. DeleteFriend
21. DeleteGroup
22. DeleteGroupUser
23. DeleteStorage
24. DeleteStorageObject
25. DeleteAccounts
26. DeleteLeaderboard
27. DeleteLeaderboardRecord
28. DeleteNotification
29. DeleteUser
30. DeleteWalletLedger
31. DemoteGroupMember
32. ExportAccount
33. ImportAccount
34. ImportAccountFull
35. ExportGroup
36. GetAccount
37. GetConfig
38. GetFriends
39. GetGroup
40. GetMembers
41. GetGroups
42. GetLeaderboard
43. GetMatchState
44. GetRuntime
45. GetSetting
46. GetStatus
47. GetStorage
48. GetUser
49. GetWalletLedger
50. GetNotification
51. GetPurchase
52. GetSubscription
53. ListAuditLogs
54. ListAuditLogsUsers
55. ListApiEndpoints
56. ListLeaderboardRecords
57. ListLeaderboards
58. ListSettings
59. ListStorage
60. ListStorageCollections
61. ListAccounts
62. ListChannelMessages
63. ListGroups
64. ListNotifications
65. ListMatches
66. ListPurchases
67. ListSubscriptions
68. ListUsers
69. PromoteGroupMember
70. RequireUserMfa
71. ResetUserMfa
72. UnbanAccount
73. UnlinkCustom
74. UnlinkDevice
75. UnlinkEmail
76. UnlinkApple
77. UnlinkFacebook
78. UnlinkFacebookInstantGame
79. UnlinkGameCenter
80. UnlinkGoogle
81. UnlinkSteam
82. UpdateAccount
83. UpdateGroup
84. UpdateSetting
85. UpdateUser
86. WriteStorageObject
87. SatoriListTemplates
88. SatoriSendDirectMessage
89. SendNotification
90. RegisteredExtensions

---

## 9. All Custom RPC Endpoints (156 + 30 = 186)

### JavaScript RPCs registered in index.js (156 active)

#### Core / Legacy (4)
1. `create_or_sync_user`
2. `create_or_get_wallet`
3. `submit_score_and_sync`
4. `get_all_leaderboards`

#### Leaderboard Sync (7)
5. `submit_score_sync`
6. `submit_score_with_aggregate`
7. `create_all_leaderboards_with_friends`
8. `submit_score_with_friends_sync`
9. `get_friend_leaderboard`
10. `create_all_leaderboards_persistent`
11. `create_time_period_leaderboards`

#### Leaderboard Time Period (2)
12. `submit_score_to_time_periods`
13. `get_time_period_leaderboard`

#### Social (4)
14. `send_friend_invite`
15. `accept_friend_invite`
16. `decline_friend_invite`
17. `get_notifications`

#### Wallet Registry (3)
18. `get_user_wallet`
19. `link_wallet_to_game`
20. `get_wallet_registry`

#### Game Registry (3)
21. `get_game_registry`
22. `get_game_by_id`
23. `sync_game_registry`

#### Daily Rewards (2)
24. `daily_rewards_get_status`
25. `daily_rewards_claim`

#### Quiz Results (4)
26. `quiz_submit_result`
27. `quiz_get_history`
28. `quiz_get_stats`
29. `quiz_check_daily_completion`

#### Game Entry (3)
30. `game_entry_validate`
31. `game_entry_complete`
32. `game_entry_get_status`

#### Daily Missions (3)
33. `get_daily_missions`
34. `submit_mission_progress`
35. `claim_mission_reward`

#### Wallet Operations (5)
36. `wallet_get_all`
37. `wallet_update_global`
38. `wallet_update_game_wallet`
39. `wallet_transfer_between_game_wallets`
40. `wallet_get_balances`

#### Analytics (1)
41. `analytics_log_event`

#### Friends Extended (6)
42. `friends_block`
43. `friends_unblock`
44. `friends_remove`
45. `friends_list`
46. `friends_challenge_user`
47. `friends_spectate`

#### Groups Extended (5)
48. `create_game_group`
49. `update_group_xp`
50. `get_group_wallet`
51. `update_group_wallet`
52. `get_user_groups`

#### Push Notifications (3)
53. `push_register_token`
54. `push_send_event`
55. `push_get_endpoints`

#### Player Data (10)
56. `create_player_wallet`
57. `update_wallet_balance`
58. `get_wallet_balance`
59. `submit_leaderboard_score`
60. `get_leaderboard`
61. `check_geo_and_update_profile`
62. `get_player_portfolio`
63. `rpc_update_player_metadata`
64. `get_player_metadata`
65. `admin_delete_player_metadata`

#### Score Rewards (2)
66. `calculate_score_reward`
67. `update_game_reward_config`

#### Chat (7)
68. `send_group_chat_message`
69. `send_direct_message`
70. `send_chat_room_message`
71. `get_group_chat_history`
72. `get_direct_message_history`
73. `get_chat_room_history`
74. `mark_direct_messages_read`

#### Achievements (4)
75. `achievements_get_all`
76. `achievements_update_progress`
77. `achievements_create_definition`
78. `achievements_bulk_create`

#### Matchmaking (5)
79. `matchmaking_find_match`
80. `matchmaking_cancel`
81. `matchmaking_get_status`
82. `matchmaking_create_party`
83. `matchmaking_join_party`

#### Tournaments (6)
84. `tournament_create`
85. `tournament_join`
86. `tournament_list_active`
87. `tournament_submit_score`
88. `tournament_get_leaderboard`
89. `tournament_claim_rewards`

#### Infrastructure (6)
90. `batch_execute`
91. `batch_wallet_operations`
92. `batch_achievement_progress`
93. `rate_limit_status`
94. `cache_stats`
95. `cache_clear`

#### QuizVerse (3)
96. `quizverse_submit_score`
97. `quizverse_get_leaderboard`
98. `quizverse_submit_multiplayer_match`

#### Cleanup (1)
99. `cleanup_guest_user_metadata`

#### Onboarding (11)
100. `onboarding_get_state`
101. `onboarding_update_state`
102. `onboarding_complete_step`
103. `onboarding_set_interests`
104. `onboarding_get_interests`
105. `onboarding_claim_welcome_bonus`
106. `onboarding_first_quiz_complete`
107. `onboarding_get_tomorrow_preview`
108. `onboarding_track_session`
109. `onboarding_get_retention_data`
110. `onboarding_create_link_quiz`

#### Retention (7)
111. `retention_grant_streak_shield`
112. `retention_get_streak_shield`
113. `retention_use_streak_shield`
114. `retention_schedule_notification`
115. `retention_get_recommendations`
116. `retention_track_first_session`
117. `retention_claim_welcome_bonus`

#### Weekly Goals (4)
118. `weekly_goals_get_status`
119. `weekly_goals_update_progress`
120. `weekly_goals_claim_reward`
121. `weekly_goals_claim_bonus`

#### Season Pass (5)
122. `season_pass_get_status`
123. `season_pass_add_xp`
124. `season_pass_complete_quest`
125. `season_pass_claim_reward`
126. `season_pass_purchase_premium`

#### Monthly Milestones (4)
127. `monthly_milestones_get_status`
128. `monthly_milestones_update_progress`
129. `monthly_milestones_claim_reward`
130. `monthly_milestones_claim_legendary`

#### Collections (4)
131. `collections_get_status`
132. `collections_unlock_item`
133. `collections_equip_item`
134. `collections_add_mastery_xp`

#### Winback (4)
135. `winback_check_status`
136. `winback_claim_rewards`
137. `winback_record_session`
138. `winback_schedule_reengagement`

#### Progressive Unlocks (4)
139. `progressive_get_state`
140. `progressive_claim_unlock`
141. `progressive_check_feature`
142. `progressive_update_progress`

#### Progression / Mastery (3)
143. `progression_add_mastery_xp`
144. `progression_get_state`
145. `progression_claim_prestige`

#### Rewarded Ads (4)
146. `rewarded_ad_request_token`
147. `rewarded_ad_claim`
148. `rewarded_ad_validate_score_multiplier`
149. `rewarded_ad_get_status`

#### Compatibility Quiz (6)
150. `compatibility_create_session`
151. `compatibility_join_session`
152. `compatibility_get_session`
153. `compatibility_submit_answers`
154. `compatibility_calculate`
155. `compatibility_list_sessions`

### Multi-Game RPCs from multigame_rpcs.js (30)

#### QuizVerse Multi-Game (15 — 1 overlap with above)
156. `quizverse_update_user_profile`
157. `quizverse_grant_currency`
158. `quizverse_spend_currency`
159. `quizverse_validate_purchase`
160. `quizverse_list_inventory`
161. `quizverse_grant_item`
162. `quizverse_consume_item`
163. `quizverse_submit_score` *(also at #96)*
164. `quizverse_get_leaderboard` *(also at #97)*
165. `quizverse_join_or_create_match`
166. `quizverse_claim_daily_reward`
167. `quizverse_find_friends`
168. `quizverse_save_player_data`
169. `quizverse_load_player_data`

#### LastToLive Multi-Game (14)
170. `lasttolive_update_user_profile`
171. `lasttolive_grant_currency`
172. `lasttolive_spend_currency`
173. `lasttolive_validate_purchase`
174. `lasttolive_list_inventory`
175. `lasttolive_grant_item`
176. `lasttolive_consume_item`
177. `lasttolive_submit_score`
178. `lasttolive_get_leaderboard`
179. `lasttolive_join_or_create_match`
180. `lasttolive_claim_daily_reward`
181. `lasttolive_find_friends`
182. `lasttolive_save_player_data`
183. `lasttolive_load_player_data`

### Lua RPCs (15)

184. `rpc` (test echo)
185. `rpc_error` (test error)
186. `rpc_get` (test GET)
187. `send_notification`
188. `send_stream_data`
189. `create_authoritative_match`
190. `print_env`
191. `create_leaderboard`
192. `lb.submit_score`
193. `lb.get`
194. `iap.apple_verify_payment`
195. `iap.google_verify_payment`
196. `t.create`
197. `t.delete`
198. `t.addattempt`

---

## Summary Totals

| Category | Count |
|---|---|
| **gRPC API Endpoints** | 84 |
| **Console Admin Endpoints** | 90 |
| **Custom JS RPCs (index.js)** | 155 unique |
| **Multi-Game RPCs (multigame_rpcs.js)** | 28 unique (2 overlap) |
| **Lua RPCs** | 15 |
| **WebSocket Realtime Message Types** | 30 |
| **Authentication Methods** | 9 |
| **IAP Stores Supported** | 4 (Apple, Google, Huawei, Facebook Instant) |
| **Identity Providers (Link/Unlink)** | 9 |
| **Notification Built-in Codes** | 9 |
| **Config Sections** | 18 |
| **Total Unique Endpoints (all types)** | **~370+** |

### JS Module Directory Map

```
data/modules/
├── index.js                      (18,902 lines — consolidated entry point)
├── chat.js                       (group/DM/room chat)
├── identity.js                   (device-to-game identity)
├── leaderboard.js                (time-period leaderboards)
├── multigame_rpcs.js             (QuizVerse + LastToLive)
├── player_rpcs.js                (player wallet/score RPCs)
├── wallet.js                     (multi-currency wallet)
├── achievements/                 (achievements.js)
├── analytics/                    (analytics.js)
├── copilot/                      (core logic modules)
│   ├── index.js                  (main registration)
│   ├── cognito_wallet_mapper.js
│   ├── leaderboard_aggregate.js
│   ├── leaderboard_friends.js
│   ├── leaderboard_sync.js
│   ├── social_features.js
│   ├── utils.js
│   ├── wallet_registry.js
│   └── wallet_utils.js
├── daily_missions/               (daily_missions.js)
├── daily_rewards/                (daily_rewards.js)
├── friends/                      (friends.js)
├── groups/                       (groups.js)
├── infrastructure/               (batch_operations.js, caching.js, rate_limiting.js)
├── matchmaking/                  (matchmaking.js)
├── onboarding/                   (onboarding.js)
├── progression/                  (mastery_system.js, progressive_unlocks.js)
├── push_notifications/           (push_notifications.js)
├── quiz_results/                 (quiz_results.js)
├── retention/                    (collections.js, monthly_milestones.js, season_pass.js, weekly_goals.js, winback.js)
├── rewarded_ads/                 (rewarded_ads.js)
├── tournaments/                  (tournaments.js)
└── wallet/                       (wallet.js)
```

### Lua Module Map

```
data/modules/
├── clientrpc.lua                (test RPCs)
├── leaderboards.lua             (score submission/retrieval)
├── match.lua                    (authoritative match handler)
├── tournament.lua               (tournament lifecycle + callbacks)
├── iap_verifier.lua             (Apple/Google IAP verification)
├── iap_verifier_rpc.lua         (IAP client RPCs)
├── p2prelayer.lua               (P2P relay match)
└── debug_utils.lua              (print_r utility)
```
