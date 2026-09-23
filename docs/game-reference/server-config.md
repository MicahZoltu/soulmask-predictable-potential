# Soulmask Server Configuration Reference

This is the reference for the plaintext Soulmask server and gameplay configuration, read directly from the retail Windows client install at `/soulmask/`.
The game is Unreal Engine 4.27 and its cooked content is packed and encrypted in `WS/Content/Paks/WS-WindowsNoEditor.pak`; everything documented here is an unencrypted loose file that sits outside that pak and is readable on Linux with no decryption.
Configuration edits that stay inside these files need no pak, no mod, and no asset cook.

Confidence is marked per section: **direct-file** (read byte-for-byte from the shipped files), **community-documented** (stated by community guides for runtime paths that do not exist in a client install), or **inferred** (an interpretation that the files do not state outright).

## 1. File inventory and locations

### 1.1 Gameplay settings — `WS/Config/GameplaySettings/`

There are 137 `.json` files here, in three shapes.

| Path | Size (bytes) | Format | Purpose |
| --- | --- | --- | --- |
| `GameXishuConfig_Template.json` | 592068 | UTF-16LE with BOM | Base schema: for each of 282 keys, the Chinese description, default, slider range, category, step and the 6-value per-difficulty default array. |
| `GameXishuConfig_Template_Action.json` | 590024 | UTF-16LE with BOM | Same schema for the Action category. |
| `GameXishuConfig_Template_Creative.json` | 592872 | UTF-16LE with BOM | Same schema for the Creative category. |
| `GameXishuConfig_Template_Management.json` | 588268 | UTF-16LE with BOM | Same schema for the Management category. |
| `GameXishuConfig_Template_PVP.json` | 589674 | UTF-16LE with BOM | Same schema for the PvP category. |
| `GameXishu_Template*.json` (36 files, 26-28 KB each) | 26000-28000 | UTF-8 | Full 282-key value presets, each with three repeated groups `0`/`1`/`2`. The five base families are Template, Template_Action, Template_Creative, Template_Management and Template_PVP; each has `_Custom`/`_Dashi`/`_Jiandan`/`_Kunnan`/`_Putong`/`_Xiuxian` variants. `GameXishu_Template_PvP_BattleField.json` is a 238-key variant. |
| `GameXishu_Template_PvE*.json`, `GameXishu_Template_PvP*.json` (96 small files, 66-1592 bytes) | 66-1592 | UTF-8 | Sparse per-server overrides; only group `1` is populated, typically 2-43 keys. These are the official dedicated-server presets such as `GameXishu_Template_PvE_10P_3x.json` and `GameXishu_Template_PvP_AS_04P_UTC11~15_1M_Hardcore.json`. |

Collection totals: 137 files, of which 36 are full 282-key presets, 96 are sparse overrides, and 5 are schemas.
The shipped `WS/Config/GameplaySettings/GameXishu_Template*.json` files are read-only reference presets, not the live file.

The live file is `WS/Saved/GameplaySettings/GameXishu.json` on a dedicated server, generated at runtime and not present in the client install.
A dedicated server reads group `1` of the live file; a missing live file is seeded from the selected template preset.

### 1.2 Manifests and licenses — `/soulmask/`

| Path | Size (bytes) | Format | Purpose |
| --- | --- | --- | --- |
| `Manifest_NonUFSFiles_Win64.txt` | 34797 | UTF-8, tab-separated | Lists every loose file the installer placed outside the pak, with path and timestamp. Confirms the GameplaySettings files ship loose. |
| `Manifest_DebugFiles_Win64.txt` | 282 | UTF-8 | Lists debug/font files (two `.pdb`, two SlateDebug fonts). |
| `LICENSE_ThirdParty.txt` | 204171 | UTF-8 text | Third-party licence notices. |
| `WS/Content/Paks/WS-WindowsNoEditor.sig` | 1217472 | binary | RSA signature for the main pak. |
| `WS.exe` | 256512 | Windows PE (Themida/WinLicense packed) | Launcher; no Unreal strings survive packing. |

### 1.3 Plugin files — `WS/Plugins/`

| Path | Size (bytes) | Format | Purpose |
| --- | --- | --- | --- |
| `AntiGS/ThirdParty/Binaries/x64/gsc.dat` | 261 | binary config | Anti-cheat (GreenShield) client config blob. |
| `AntiGS/ThirdParty/Binaries/x64/gsccn.dat` | 261 | binary config | Anti-cheat config blob, mainland-China variant. |
| `DBAgent/ThirdParty/Binaries/Readme.txt` | 1248 | UTF-8 | Documents `CopyRoles.exe -src -dst [-userid] [-type]` save-database migration. |
| `HVoiceCommand/.../PocketSphinxLibrary/model/en-US/*` | 61-3408405 | PocketSphinx acoustic model | English voice-command dictionary/decoder data (`cmudict-en-us.dict`, `mdef`, `means`, `variances`, `sendump`). |
| `HVoiceCommand/.../model/zh-CN/*` | 27-25694276 | PocketSphinx acoustic model | Chinese voice-command dictionary/decoder data (`zh_cn.dic`, `mdef`, `means`, `variances`). |
| `Online/TapSDK/TapCommon/Source/ThirdParty/Windows/taptap_api.dll` | dll | PE | TapTap SDK, not configuration. |
| `Wwise/ThirdParty/x64_vc170/Release/bin/*.dll` | dll | PE | Wwise audio DSP plugins, not configuration. |

No readable `.ini`/config text exists under any plugin directory.

### 1.4 Other non-pak files

| Path | Size (bytes) | Format | Purpose |
| --- | --- | --- | --- |
| `Engine/Content/SlateDebug/Fonts/LastResort.ttf` | 5395052 | TTF | Debug fallback font. |
| `Engine/Content/SlateDebug/Fonts/LastResort.tps` | 930 | text | Font metrics. |
| `Engine/.../CEF3/Win64/{icudtl.dat,natives_blob.bin,snapshot_blob.bin}` | binary | CEF/ICU runtime blobs, not configuration. |
| `WS/Content/Movies/*` | 68 `.mp4`, 29 `.bk2`, 3 `.mov`, 19 `.uasset` | media assets, not configuration. |

Global count: 287 files are not `.pak`/`.exe`/`.dll`/`.pdb`; 144 of them are config-like text (137 JSON + 4 TXT + 3 DIC/model text).
The remaining 143 are media, fonts or binary model/runtime data.

## 2. The GameXishu configuration model

### 2.1 Shared key set and schema fields

The 282 configuration keys are a single shared key set: the five `GameXishuConfig_Template*.json` schema files and all `GameXishu_Template*.json` value files each carry exactly the same 282 keys.

Each schema entry has the same fields, which are the only in-file documentation.

| Field | Meaning |
| --- | --- |
| `Desc` | In-game display name, Chinese only. |
| `IsKaiGuan` | True if the entry is a boolean toggle rather than a slider. |
| `bIsLogScale` | True if the slider uses logarithmic scaling. |
| `XiShuDefaultValue` | Developer default. |
| `XiShuMinValue` / `XiShuMaxValue` | Slider bounds, normally also the accepted range. |
| `LogScaleOffset` | Offset used when `bIsLogScale` is true. |
| `XiShuFenLei` | Category index 0-11 used to group the in-game coefficient menu; the index is not named in the file, so the group names in section 3 are inferred from membership. |
| `XiShuStep` | Discrete step; 0 means continuous. |
| `IsShow` | Whether the key is exposed in the in-game coefficient UI; false entries are hidden engine tuning. |
| `BuTongNanDu_XiShuDefaultValue` | Six-element array of defaults for the six difficulty presets (client files are named `GameXishu_0`..`_5` = Casual, Easy, Normal, Hard, Master, Custom). |

The Chinese `Desc` strings inside the schema files are the only comments present; every value file is plain JSON with no comments.
Raw numeric values are IEEE-754 float32, so several print as `0.10000000149011612`, `0.699999988079071`, `0.80000001192092896`; this document rounds them to three decimals.

The exact order and meaning of the six-element `BuTongNanDu_XiShuDefaultValue` arrays is not stated in the files; the client difficulty filenames imply Casual/Easy/Normal/Hard/Master/Custom but this is **inferred**.

### 2.2 Categories (`XiShuFenLei`)

The category index runs 0-11 and is used only to group the in-game menu.
No name mapping exists in the files, so the group names below are **inferred** from membership.

| FenLei | Group (inferred) | Keys |
| --- | --- | --- |
| 0 | World, ownership, caps and feature toggles | 86 |
| 1 | Progression, experience, attribute growth and level caps | 24 |
| 2 | Loot, resource yield and economy | 28 |
| 3 | Building and construction | 24 |
| 4 | World resource respawn | 3 |
| 5 | Combat and PvP | 39 |
| 6 | Survival consumption (food, water, fuel, durability) | 14 |
| 7 | Invasions | 20 |
| 8 | Awareness day caps and PvP time windows | 23 |
| 9 | AI level and deployment counts | 3 |
| 10 | Battlefield war times | 6 |
| 11 | Global events | 12 |

Totals: 86+24+28+24+3+39+14+20+23+3+6+12 = 282 keys.

### 2.3 Value files, full presets and sparse overrides

Each full `GameXishu_Template*.json` preset contains three repeated groups `0`/`1`/`2`.
In the base Template the groups differ on only five keys (`GameWorldDayTimePortion`, `JianZhuChuanSongMenPlusKaiGuan`, `GongHuiMaxZhaoMuCount`, `ManRenChuZhanCount`, `AnimalFollowerMaxCount`); in the Action, Management and PvP base templates they differ on one or two keys.
The 96 sparse override files populate only group `1`, typically 2-43 keys.

File counts: 5 schemas + 36 full presets + 96 sparse overrides = 137 `.json` files.

### 2.4 Group `0`/`1`/`2` semantics and the `?ND` quirk

Community documentation states dedicated servers read group `1` while the in-game editor writes group `0`, and recommends copying changes into all three groups to be safe.
Which group each runtime context actually reads is unresolved; the community guides conflict, one saying group `1` and the other recommending editing all three.
This document treats group `1` as the server-read group because it is the group the dedicated-server presets populate and the group a dedicated server seeds its live file from.

The `?ND=<n>` difficulty parameter seeds group `0` and leaves group `1` at defaults; this is a documented bug and the reason an edit can appear to have no effect after a difficulty switch.
Edit group `1`, and when in doubt edit all three.

## 3. Full key tables

Defaults and ranges below are taken from `GameXishuConfig_Template.json` and are identical across the five schema files.
The "Shown" column is the `IsShow` flag: `hidden` keys are engine tuning not exposed in the in-game menu but still editable in the file.
All 282 keys are listed.

### FenLei 0 — World, ownership, caps and feature toggles (86 keys)

| Key | Type | Default | Range | Shown | Description |
| --- | --- | --- | --- | --- | --- |
| `AddRenKeDuRatio` | Number | 1 | 0.1-10 | yes | Speed multiplier for taming/recruiting a barbarian. |
| `AnimalFollowerMaxCount` | Number | 3 | 0-100 | yes | Maximum number of animals that can follow you. |
| `BagRepOptimizeSwitch` | Toggle | 1 | 0-1 | hidden | Backpack network-sync optimisation (performance). |
| `BanGlider` | Toggle | 0 | 0-1 | yes | Disables the glider item. |
| `BaoXiangDiaoLuoDengJi` | Number | 0 | 0-4 | hidden | Loot-table level used for chest drops. |
| `BinSiKaiGuan` | Toggle | 1 | 0-1 | yes | Enables the near-death (downed) state. |
| `BossDeathEventSwitch` | Toggle | 0 | 0-1 | yes | Enables boss-death world events. |
| `ChestDropEquipmentMaxQualitySwitch` | Toggle | 0 | 0-1 | yes | Caps the quality tier of equipment found in chests. |
| `ChongsuRatio` | Number | 1 | 0.1-10 | yes | Time multiplier for body remodeling. |
| `ConverPropsSpeedRatio` | Number | 5 | 1-10 | yes | Conversion-furnace throughput. |
| `CrewCountRatio` | Number | 1 | 0-10 | yes | Multiplier on crew (hired NPC) count. |
| `DrawDebugDungeon` | Toggle | 0 | 0-1 | hidden | Draws dungeon routes for debugging. |
| `FuHuoMoveSiWangBaoKaiGuan` | Toggle | 0 | 0-1 | yes | Moves your death loot bag under you on respawn. |
| `GameWorldDayTimePortion` | Number | 0.7 | 0-1 | yes | Fraction of the day cycle that is daytime (0-1). |
| `GameWorldTimePower` | Number | 24 | 1-48 | yes | Time-flow multiplier; hours advanced per cycle. |
| `GeRenBiaoJiMaxCount` | Number | 20 | 1-100 | yes | Personal map-marker limit. |
| `GeRenMaxDongWuCount` | Number | 10 | 1-100 | yes | Personal animal-count cap. |
| `GeRenMaxRaftSpaceCount` | Number | 2 | 1-50 | yes | Personal boat-count cap. |
| `GeRenMaxSpecDongWuCount` | Number | 1 | 1-100 | yes | Personal cap for special animals. |
| `GeRenMaxSpecRaftSpaceCount` | Number | 1 | 1-10 | yes | Personal cap for ray-class airships. |
| `GeRenMaxZhaoMuCount` | Number | 6 | 1-10 | yes | Personal recruitable-tribesman cap at Connection Enhancement 1. |
| `GeRenMaxZhaoMuCount_Three` | Number | 15 | 1-1000 | yes | Personal recruitable-tribesman cap at Connection Enhancement 3. |
| `GeRenMaxZhaoMuCount_Two` | Number | 10 | 1-20 | yes | Personal recruitable-tribesman cap at Connection Enhancement 2. |
| `GongHuiBiaoJiMaxCount` | Number | 20 | 1-100 | yes | Guild map-marker limit. |
| `GongHuiMaxDongWuCount` | Number | 50 | 1-100 | yes | Guild animal-count cap. |
| `GongHuiMaxMember` | Number | 20 | 1-50 | yes | Guild (tribe) member cap. |
| `GongHuiMaxRaftSpaceCount` | Number | 10 | 1-50 | yes | Tribe boat-count cap. |
| `GongHuiMaxSpecDongWuCount` | Number | 1 | 1-100 | yes | Guild cap for special animals. |
| `GongHuiMaxSpecRaftSpaceCount` | Number | 2 | 1-20 | yes | Tribe cap for ray-class airships. |
| `GongHuiMaxZhaoMuCount` | Number | 50 | 1-1000 | yes | Guild recruitable-tribesman cap. |
| `HuDongExcludeBetweenCameraCharacter` | Toggle | 1 | 0-1 | hidden | Excludes interactables between camera and character. |
| `HuXIangShangHaiKaiGuan` | Toggle | 0 | 0-1 | yes | Master PvP damage toggle. |
| `HuanXingDistance` | Number | 9000 | 2000-15100 | hidden | Wake-up distance (engine tuning). |
| `IgnoreEnemyJianZhuInSelfYingHuo` | Toggle | 1 | 0-1 | yes | Ignores enemy buildings inside your own campfire range. |
| `IsOpenGuideTask` | Toggle | 1 | 0-1 | yes | Enables the tutorial/guide task chain. |
| `IsPlayBossAppearanceSequence` | Toggle | 1 | 0-1 | yes | Plays boss intro cutscenes. |
| `JiQiChuZhanKaiGuan` | Toggle | 1 | 0-1 | yes | Enables capturing machines. |
| `JianDuiRuQinKaiGuan` | Toggle | 0 | 0-1 | yes | Enables fleet invasions. |
| `JianZhuFuLanKaiGuan` | Toggle | 1 | 0-1 | yes | Enables building decay. |
| `JianZhuMirageKaiGuan` | Toggle | 1 | 0-1 | yes | Enables ghost/preview building placement. |
| `JinJianQuKaiGuan` | Toggle | 1 | 0-1 | yes | Enables scene no-build zones. |
| `KaiQiKuaFu` | Toggle | 0 | 0-1 | yes | Enables cross-server play. |
| `KuaiSuDaoDaOnZuDangKaiGuan` | Toggle | 0 | 0-1 | yes | Fast-arrive dash when movement is blocked. |
| `KurmaFuZhongRatio` | Number | 1 | 0-1 | yes | Carry-weight multiplier for platform animals. |
| `MainGunUseTimeCD` | Number | 1 | 0-10 | yes | Ray-airship main-gun cooldown in minutes. |
| `MakeUseAroundRongQiKaiGuan` | Toggle | 1 | 0-1 | yes | Auto-pulls resources from nearby containers when crafting. |
| `MaskRepairUpgradeSwitch` | Toggle | 1 | 0-1 | yes | Enables mask mimicry upgrades. |
| `MaxConvertCount` | Number | 3 | 1-10 | yes | Mystic converter count cap. |
| `MaxConveyorCount` | Number | 1000 | 1-10000 | yes | Power-conveyor build cap. |
| `MaxDiCiCount` | Number | 400 | 1-1000 | yes | Spike-trap build cap. |
| `MaxDongLiKuangChangCount` | Number | 10 | 1-1000 | yes | Power-mine build cap. |
| `MaxFuZhongRatio` | Number | 1 | 1-100 | yes | Maximum carry-weight multiplier. |
| `MentalRecoveryRate` | Number | 1 | 0-10 | yes | Sanity recovery rate. |
| `MovementYouHua` | Toggle | 1 | 0-1 | hidden | Movement optimisation (performance). |
| `PVEOnlyTongGuiShuCanOpenKaiGuan` | Toggle | 1 | 0-1 | yes | PvE: only same-tribe players may open a death bag. |
| `PanpaKaiGuan` | Toggle | 1 | 0-1 | yes | Enables climbing. |
| `PingTaiAffectNavigation` | Toggle | 1 | 0-1 | hidden | Whether platforms affect pathfinding. |
| `PingTaiBuildRangeLimit` | Toggle | 1 | 0-1 | yes | Build-range limit for mammoths and boats. |
| `PlayerDeathCantDropItemKaiGuan` | Toggle | 0 | 0-1 | yes | Players drop no items on death. |
| `ProtectJianZhuInYingHuoSwitch` | Toggle | 0 | 0-1 | yes | PvP protection for buildings inside campfire range. |
| `RelicChestEventSwitch` | Toggle | 0 | 0-1 | yes | Enables relic chest-open events. |
| `RestartGameForceSpawnMonsterSwitch` | Toggle | 1 | 0-1 | yes | Forces monster respawn on restart. |
| `RoleBagCapacity` | Number | 60 | 30-256 | yes | Character inventory capacity. |
| `RuQinKaiGuan` | Toggle | 1 | 0-1 | yes | Enables monster invasions. |
| `RuinsExplorationKaiGuan` | Toggle | 1 | 0-1 | yes | Enables ruins-exploration events. |
| `ShipBlueprintBuildConsumeSwitch` | Toggle | 1 | 0-1 | yes | Boat blueprint builds consume materials. |
| `ShuaXinNPCKaiGuan` | Toggle | 0 | 0-1 | yes | Periodically respawns enemies while players are in a camp. |
| `SpecialBossSwitch` | Toggle | 1 | 0-1 | yes | Enables special-event bosses. |
| `TiaoWuLengQueTime` | Number | 4 | 0-24 | yes | Dance cooldown in hours. |
| `TribalExplorationKaiGuan` | Toggle | 1 | 0-1 | yes | Enables tribal-exploration events. |
| `TribalTransportSwitch` | Toggle | 1 | 0-1 | yes | Enables tribal-transport events. |
| `WanMeiChongSu` | Toggle | 1 | 0-1 | yes | Enables perfect remodel (deep copy). |
| `WarKaiGuan` | Toggle | 0 | 0-1 | yes | Enables the battlefield feature. |
| `WuLiYouHuaDist` | Number | 6666 | 5000-9000 | hidden | Physics-optimisation distance (engine tuning). |
| `WuLiYouHuaKaiGuan` | Toggle | 1 | 0-1 | hidden | Enables physics optimisation. |
| `XiShuWeiLing` | Number | 0 | 0-0 | hidden | Placeholder coefficient; must remain 0. |
| `XinQingJianShao` | Number | 1 | 0-5 | yes | Mood-decrease rate. |
| `XinQingZengZhang` | Number | 1 | 0-5 | yes | Mood-increase rate. |
| `XinXiLuRu` | Number | 5 | 1-10 | yes | Intel entry-count cap. |
| `XiuMianDistance` | Number | 10000 | 3000-16000 | hidden | Hibernation distance (engine tuning). |
| `XiuMianOfflineDays` | Number | 7 | 0-30 | yes | Days offline before tribesmen hibernate and stop working. |
| `YunXuOtherDaKaiGongZuoTai` | Toggle | 0 | 0-1 | yes | Allows opening other players' workbenches. |
| `YunXuOtherDaKaiXiangZi` | Toggle | 0 | 0-1 | yes | Allows opening other players' chests. |
| `ZhaoHuanDisRatio` | Number | 1 | 1-100 | yes | Animal summon distance. |
| `ZuRenDirectCunQu` | Toggle | 1 | 0-1 | yes | Enables remote deposit/withdraw for tribesmen. |
| `ZuRenFuZhi` | Toggle | 1 | 0-1 | yes | Enables tribesman duplication. |

### FenLei 1 — Progression, experience, attribute growth and level caps (24 keys)

| Key | Type | Default | Range | Shown | Description |
| --- | --- | --- | --- | --- | --- |
| `BeiDongYiJiShuXingRatio` | Number | 1 | 0-3 | yes | Body level-up passive (innate attribute point) multiplier. |
| `CaiJiExpRatio` | Number | 1 | 0-5 | yes | Gathering XP multiplier. |
| `ChengZhangExpRatio` | Number | 1 | 0.1-5 | yes | Body growth/level XP multiplier. |
| `ChuZhanZuRenShaGuaiExpShareRatio` | Number | 1 | 0-10 | yes | Kill-XP share for deployed tribesmen. |
| `CurProfInitRatio` | Number | 0 | 0-1 | yes | Initial current-proficiency range for elites/bosses; 0 = initial value, 1 = maximum. |
| `DongWuBeiDongYiJiShuXingRatio` | Number | 1 | 1-3 | yes | Animal passive attribute points gained per level. |
| `DongWuErJiShuXingRatio` | Number | 1 | 0.5-3 | yes | Animal secondary HP/attack/defence growth per level. |
| `DongWuZhuDongYiJiShuXingRatio` | Number | 1 | 1-3 | yes | Animal active (assignable) attribute points per level. |
| `ErJiShuXingRatio` | Number | 1 | 0.5-3 | yes | Body secondary HP/attack/defence growth per level. |
| `ExpRatio` | Number | 1 | 0.1-5 | yes | Awareness (mask) XP multiplier. |
| `HuiFuChuShiBodyData` | Toggle | 1 | 0-1 | yes | Keeps initial body data when reviving. |
| `MJExpRatio` | Number | 1 | 0.1-5 | yes | Mask XP multiplier. |
| `MaRenBeiDongYiJiShuXingRatio` | Number | 1 | 1-3 | yes | Barbarian passive attribute points gained per level. |
| `MaRenErJiShuXingRatio` | Number | 1 | 0.5-3 | yes | Barbarian secondary HP/attack/defence growth per level. |
| `MaRenZhuDongYiJiShuXingRatio` | Number | 1 | 1-3 | yes | Barbarian active (assignable) attribute points per level. |
| `MaxLevel` | Number | 60 | 1-60 | yes | Maximum awareness level. |
| `OtherShaGuaiExpShareRatio` | Number | 1 | 0-10 | yes | Kill-XP share for mounts and non-human followers. |
| `QiTaExpRatio` | Number | 1 | 0-5 | yes | Other XP multiplier. |
| `ShaGuaiExpRatio` | Number | 1 | 0-5 | yes | Kill-XP multiplier. |
| `ShaGuaiExpShareRatio` | Number | 0.2 | 0-1 | yes | Kill-XP share coefficient. |
| `ShuLianDuExpRatio` | Number | 1 | 0.1-10 | yes | Proficiency XP multiplier. |
| `TrainingExpRatio` | Number | 1 | 0.1-100 | yes | Training Ground XP multiplier; scales training duration. |
| `ZhiZuoExpRatio` | Number | 1 | 0-5 | yes | Crafting XP multiplier. |
| `ZhuDongYiJiShuXingRatio` | Number | 1 | 0-3 | yes | Body active (assignable) attribute points per level. |

### FenLei 2 — Loot, resource yield and economy (28 keys)

| Key | Type | Default | Range | Shown | Description |
| --- | --- | --- | --- | --- | --- |
| `BaoXiangDropRatio` | Number | 1 | 1-3 | yes | Chest drop multiplier. |
| `BossEquipDropRatioCorrection` | Number | 1 | 0-5 | hidden | Boss equipment drop-rate correction. |
| `BossEquipDurabilityCorrection` | Number | 1 | 0-5 | hidden | Durability correction for boss-dropped equipment. |
| `BossRenDiaoLuoRatio` | Number | 1 | 1-3 | yes | Boss drop multiplier. |
| `CaiJiDamageRatio` | Number | 1 | 0-5 | yes | Harvesting efficiency multiplier. |
| `CaiJiDiaoLuoRatio` | Number | 1 | 1-3 | yes | Gathering yield multiplier. |
| `CaiJiShengChanJianZhuDiaoLuoRatio` | Number | 1 | 0.5-3 | yes | Automated production-building output multiplier. |
| `CaiKuangDiaoLuoRatio` | Number | 1 | 1-3 | yes | Mining yield multiplier. |
| `DongWuChanChuRatio` | Number | 1 | 0-3 | yes | Animal product yield multiplier. |
| `DongWuShengChanJianGeRatio` | Number | 1 | 0-5 | yes | Animal production speed. |
| `DongWuShengZhangRatio` | Number | 1 | 0-100 | yes | Animal growth speed. |
| `DongWuShiTiDiaoLuoRatio` | Number | 1 | 1-3 | yes | Animal corpse yield multiplier. |
| `DongWuShiTiZhongYaoDiaoLuoRatio` | Number | 1 | 1-3 | yes | Animal key-part yield multiplier. |
| `EliteEquipDropRatioCorrection` | Number | 1 | 0-5 | hidden | Elite equipment drop-rate correction. |
| `EliteEquipDurabilityCorrection` | Number | 1 | 0-5 | hidden | Durability correction for elite-dropped equipment. |
| `FaMuDiaoLuoRatio` | Number | 1 | 1-3 | yes | Logging yield multiplier. |
| `FanZhiJianGeRatio` | Number | 1 | 0-5 | yes | Animal breeding speed. |
| `FuHuaSpeed` | Number | 1 | 0-100 | yes | Egg hatch speed. |
| `JingYingRenDiaoLuoRatio` | Number | 1 | 1-3 | yes | Elite barbarian drop multiplier. |
| `NormalEquipDropRatioCorrection` | Number | 1 | 0-5 | hidden | Normal-barbarian equipment drop-rate correction. |
| `NormalEquipDurabilityCorrection` | Number | 1 | 0-5 | hidden | Durability correction for normal dropped equipment. |
| `PuTongRenDiaoLuoRatio` | Number | 1 | 1-3 | yes | Normal barbarian drop multiplier. |
| `TeShuDaoJuDropXiShuJiaChengKaiGuan` | Toggle | 0 | 0-1 | yes | Whether special items benefit from yield multipliers. |
| `ZhiZuoTimeRatio` | Number | 1 | 0.1-100 | yes | Crafting speed multiplier. |
| `ZiYuanShengMingRatio` | Number | 1 | 0.1-3 | yes | Resource-node HP multiplier. |
| `ZuoWuDropRatio` | Number | 1 | 0.5-3 | yes | Crop yield multiplier. |
| `ZuoWuShengZhangRatio` | Number | 1 | 0.1-100 | yes | Crop growth speed multiplier. |
| `ZuoWuXiaoHuiRatio` | Number | 1 | 0-5 | yes | Crop decay speed. |

### FenLei 3 — Building and construction (24 keys)

| Key | Type | Default | Range | Shown | Description |
| --- | --- | --- | --- | --- | --- |
| `EnableFloatFoundation` | Toggle | 1 | 0-1 | yes | Enables floating foundations. |
| `JianZhuAroundNumLimit` | Toggle | 1 | 0-1 | yes | Building-area count limit. |
| `JianZhuBeDamageLimit` | Toggle | 1 | 0-1 | yes | Building damage-interaction limit. |
| `JianZhuChuanSongMenPlusKaiGuan` | Toggle | 1 | 0-1 | yes | Player-built portals can transport supplies. |
| `JianZhuFuLanMul` | Number | 1 | 0-5 | yes | Building decay-speed multiplier. |
| `JianZhuGaoDuLimit` | Toggle | 1 | 0-1 | yes | Building height limit. |
| `JianZhuXiuLiMul` | Number | 1 | 0-10 | yes | Build and repair speed coefficient. |
| `KaiQiJianZhuHuiXueBuilding` | Toggle | 1 | 0-1 | yes | Building heal-while-placing mode. |
| `MaxCaiJiChangLimitCount` | Number | 20 | 0-100 | yes | Gathering-camp count limit. |
| `MaxChuanSongMenNumber` | Number | 10 | 1-100 | yes | Maximum number of portals. |
| `MaxFaMuChangLimitCount` | Number | 20 | 0-100 | yes | Logging-camp count limit. |
| `MaxFloatFoundationNum` | Number | 100 | 1-10000 | yes | Maximum floating foundations. |
| `MaxGenRenYingHuoNumber` | Number | 6 | 1-100 | yes | Personal campfire build cap. |
| `MaxGongHuiYingHuoNumber` | Number | 6 | 1-100 | yes | Guild campfire build cap. |
| `MaxPingTaiJianZhuNumMul` | Number | 0.1 | 0-10 | yes | Mammoth/boat maximum building-count multiplier. |
| `MaxWaJueChangLimitCount` | Number | 20 | 0-100 | yes | Dig-site count limit. |
| `MaxXiuMianCangCount` | Number | 50 | 1-100 | yes | Maximum hibernation pods. |
| `NewYingHuoTimeLenMul` | Number | 1 | 0-10 | yes | New-campfire claiming-period multiplier. |
| `OpenEscMenuInfJianZao` | Toggle | 0 | 0-1 | yes | ESC menu unlocks infinite build mode. |
| `PingTaiJianZhuNumLimit` | Toggle | 1 | 0-1 | yes | Mammoth/boat build count limit. |
| `TransDoorInterworkKaiGuan` | Toggle | 1 | 0-1 | yes | Portal interconnection toggle. |
| `WanJiaHitJianZhuShangHaiRatio` | Number | 1 | 0-5 | yes | Player-owned damage to buildings. |
| `YeShengHitJianZhuShangHaiRatio` | Number | 4 | 0-10 | yes | Wild-creature damage to buildings. |
| `YingHuoRanShaoSuDuRatio` | Number | 1 | 0-2 | yes | Global campfire burn rate. |

### FenLei 4 — World resource respawn (3 keys)

| Key | Type | Default | Range | Shown | Description |
| --- | --- | --- | --- | --- | --- |
| `JianZhuZiYuanJinShuaBanJing` | Number | 1 | 0-100 | yes | No-resource-respawn radius around buildings. |
| `WanJiaZiYuanJinShuaBanJing` | Number | 1 | 0-100 | yes | No-resource-respawn radius around players. |
| `ZhiBeiChongShengRatio` | Number | 1 | 0.1-3 | yes | Vegetation regrowth speed. |

### FenLei 5 — Combat and PvP (39 keys)

| Key | Type | Default | Range | Shown | Description |
| --- | --- | --- | --- | --- | --- |
| `BeDamageByYeShengRatio` | Number | 1 | 0.2-2 | yes | Damage taken from wild animals. |
| `DamageYeShengRatio` | Number | 1 | 0.5-5 | yes | Damage dealt to wild animals. |
| `DongWuBossTenacityDamageRatio` | Number | 0.5 | 0-5 | yes | Wild machine-boss tenacity damage. |
| `DongWuBossTiLiDamageRatio` | Number | 1 | 0-5 | yes | Wild machine-boss stamina damage. |
| `DongWuDamageRatio` | Number | 1 | 0.5-2 | yes | Wild animal attack damage. |
| `DongWuJianShangRatio` | Number | 1 | 0.5-2 | yes | Damage taken by wild animals. |
| `DongWuPinZhiRatio` | Number | 1 | 0-5 | yes | Wild creature quality coefficient. |
| `DongWuTenacityDamageRatio` | Number | 0.5 | 0-5 | yes | Wild creature tenacity damage. |
| `DongWuTiLiDamageRatio` | Number | 1 | 0-5 | yes | Wild creature stamina damage. |
| `DungeonReborn` | Toggle | 1 | 0-1 | yes | Enables reviving inside dungeons. |
| `DynamicBossStats` | Toggle | 1 | 0-1 | yes | Dynamic difficulty adjustment for boss stats. |
| `GongJiJianZhuDamageRatio` | Number | 1 | 0-5 | yes | Damage dealt to buildings. |
| `JiaSiHuiFuRatio` | Number | 1 | 0-5 | yes | Feign-death HP recovery speed. |
| `MaRenDamageRatio` | Number | 1 | 0.5-2 | yes | Wild barbarian attack damage. |
| `ManRenBossTenacityDamageRatio` | Number | 0.5 | 0-5 | yes | Barbarian boss tenacity damage. |
| `ManRenBossTiLiDamageRatio` | Number | 1 | 0-5 | yes | Barbarian boss stamina damage. |
| `ManRenJianShangRatio` | Number | 1 | 0.5-2 | yes | Damage taken by wild barbarians. |
| `ManRenPinZhiRatio` | Number | 1 | 0-5 | yes | Wild barbarian quality coefficient; scales the quality of recruitable barbarians. |
| `ManRenTenacityDamageRatio` | Number | 0.5 | 0-5 | yes | Barbarian tenacity damage. |
| `ManRenTiLiDamageRatio` | Number | 1 | 0-5 | yes | Barbarian stamina damage. |
| `PVP_GAPVPDamageRatio` | Number | 1 | 0-5 | yes | PvP skill percentage true-damage multiplier. |
| `PVP_ShangHaiRatio_JinZhan` | Number | 0.4 | 0-1 | yes | PvP melee damage coefficient. |
| `PVP_ShangHaiRatio_PlayerToPlayer_DiFang` | Number | 1 | 0-5 | yes | PvP hostile player-vs-player damage coefficient. |
| `PVP_ShangHaiRatio_PlayerToPlayer_YouFang` | Number | 0.06 | 0-1 | yes | PvP friendly player-vs-player damage coefficient. |
| `PVP_ShangHaiRatio_WithoutP2P_YouFang` | Number | 0 | 0-5 | yes | PvP damage between non-player objects. |
| `PVP_ShangHaiRatio_YuanCheng` | Number | 0.4 | 0-1 | yes | PvP ranged damage coefficient. |
| `PhysicalRecoveryIntervalRate` | Number | 1 | 0-5 | yes | Stamina recovery interval coefficient. |
| `PlayerSweepRangeScale` | Number | 1 | 0.1-10 | yes | PvE player hit-check range scale. |
| `PlayerYouFangShangHaiKaiGuan` | Toggle | 1 | 0-1 | yes | PvP friendly-fire between players toggle. |
| `QiXiHuiFuRatio` | Number | 1 | 0-5 | yes | Breath/aura recovery speed. |
| `ReboundDifficulty` | Number | 1 | 0-2 | yes | Parry difficulty (0-2). |
| `ReleaseControlStatusCDRatio` | Number | 1 | 0-1 | yes | Control-break skill cooldown coefficient. |
| `RollingInvincibleTimeRatio` | Number | 1 | 0.5-1 | yes | Roll invincibility-time multiplier. |
| `ShengMingHuiFuRatio` | Number | 1 | 0-5 | yes | HP recovery speed. |
| `SuoDingKaiGuan` | Toggle | 1 | 0-1 | yes | Enables lock-on targeting. |
| `TiLiHuiFuRatio` | Number | 1 | 0-5 | yes | Stamina recovery speed. |
| `WanJiaBeiXiaoRenRatio` | Number | 0.8 | 0-1 | yes | PvP player tenacity-reduction coefficient. |
| `WanJiaBeiXiaoTiRatio` | Number | 0.8 | 0-1 | yes | PvP player stamina-reduction coefficient. |
| `YouFangShangHaiKaiGuan` | Toggle | 0 | 0-1 | yes | PvP friendly-damage toggle. |

### FenLei 6 — Survival consumption (food, water, fuel, durability) (14 keys)

| Key | Type | Default | Range | Shown | Description |
| --- | --- | --- | --- | --- | --- |
| `DongWuXiaoHaoShiWuRatio` | Number | 1 | 0-2 | yes | Animal food-consumption speed. |
| `DongWuXiaoHaoShuiRatio` | Number | 1 | 0-2 | yes | Animal water-consumption speed. |
| `JingShenNoXiaoHao` | Toggle | 0 | 0-1 | yes | Sanity-consumption toggle (default: consumes). |
| `NaiJiuXiShu` | Number | 1 | 0-2 | yes | Durability-consumption coefficient. |
| `QiXiXiaoHaoRatio` | Number | 1 | 0-2 | yes | Breath-consumption speed. |
| `RanLiaoXiaoHaoRatio` | Number | 1 | 0-2 | yes | Fuel-consumption speed. |
| `ShiWuXiaoHaoRatio` | Number | 1 | 0-2 | yes | Food-consumption speed multiplier. |
| `ShuiXiaoHaoRatio` | Number | 1 | 0-2 | yes | Water-consumption speed multiplier. |
| `WuPinFuHuaiRatio` | Number | 1 | 0-5 | yes | Item spoilage-time multiplier. |
| `WuPinXiaoHuiTime` | Number | 1 | 0-5 | yes | Death-bag despawn-time multiplier. |
| `XiuLiJiangNaiJiuShangXianRatio` | Number | 1 | 0-1 | yes | Durability-cap loss from repairing. |
| `XiuLiXuYaoCaiLiaoRatio` | Number | 1 | 0-1 | yes | Repair material cost. |
| `ZuoWuFeiLiaoXiaoHaoRatio` | Number | 1 | 0-2 | yes | Crop fertilizer-consumption speed. |
| `ZuoWuShuiXiaoHaoRatio` | Number | 1 | 0-2 | yes | Crop water-consumption speed. |

### FenLei 7 — Invasions (20 keys)

| Key | Type | Default | Range | Shown | Description |
| --- | --- | --- | --- | --- | --- |
| `JinGongMinuteLimit` | Number | 90 | 30-120 | yes | Invasion attack duration in minutes. |
| `LengQueMinuteLimit` | Number | 1440 | 1-14400 | yes | Invasion cooldown in minutes. |
| `ManageModeRuQin` | Toggle | 0 | 0-1 | yes | Management-mode invasion toggle. |
| `ManageModeRuQinCountDownTimeRatio` | Number | 1 | 0-10 | hidden | Management-mode invasion countdown multiplier. |
| `ReDuXiShu` | Number | 1 | 0.1-5 | yes | Heat accumulation-rate multiplier. |
| `RuQinBeginHour` | Number | 0 | 0-23 | yes | Invasion start hour. |
| `RuQinEndHour` | Number | 24 | 1-24 | yes | Invasion end hour. |
| `RuQinGuaiCountMax` | Number | 128 | 2-256 | yes | Invasion monster total upper bound. |
| `RuQinGuaiCountMin` | Number | 8 | 1-50 | yes | Invasion monster total lower bound. |
| `RuQinGuaiLevelXiShu` | Number | 1 | 0-10 | yes | Invasion monster level coefficient. |
| `RuQinGuiMoXiShu` | Number | 1 | 0-10 | yes | Invasion scale coefficient. |
| `RuQinMaxChangCiCount` | Number | 2 | 1-5 | yes | Maximum concurrent invasions. |
| `RuQinPerBoGuaiMax` | Number | 16 | 1-256 | yes | Invasion per-wave upper bound. |
| `RuQinPerBoGuaiMin` | Number | 3 | 1-50 | yes | Invasion per-wave lower bound. |
| `RuQinQiangDuXiShu` | Number | 1 | 0-10 | yes | Invasion monster strength coefficient. |
| `RuQinShaoChengXiShu` | Number | 0.6 | 0-1 | yes | Invasion city-burn coefficient. |
| `RuQinSucceedPrizeTimes` | Number | 3 | 1-10 | yes | Consecutive successful defenses between rewards. |
| `RuQinTuShaXiShu` | Number | 0.3 | 0-1 | yes | Invasion slaughter coefficient. |
| `SuiJiRuQinKaiGuan` | Toggle | 1 | 0-1 | yes | Random-invasion toggle. |
| `TanChaMinuteLimit` | Number | 20 | 1-100 | yes | Invasion scout duration in minutes. |

### FenLei 8 — Awareness day caps and PvP time windows (23 keys)

| Key | Type | Default | Range | Shown | Description |
| --- | --- | --- | --- | --- | --- |
| `EighthDayMaxAwarenessLevel` | Number | 60 | 1-60 | yes | Awareness level cap on server day 8. |
| `FifthDayMaxAwarenessLevel` | Number | 60 | 1-60 | yes | Awareness level cap on server day 5. |
| `FirstDayMaxAwarenessLevel` | Number | 60 | 1-60 | yes | Awareness level cap on server day 1. |
| `FourthDayMaxAwarenessLevel` | Number | 60 | 1-60 | yes | Awareness level cap on server day 4. |
| `InitialDefaultAwarenessLevel` | Number | 1 | 1-60 | yes | Starting awareness level on character creation. |
| `NinthDayMaxAwarenessLevel` | Number | 60 | 1-60 | yes | Awareness level cap on server day 9. |
| `PVPTimeAmericaNoWorkEndTime` | Number | 24 | 0-24 | yes | America non-workday PvP end hour. |
| `PVPTimeAmericaNoWorkStartTime` | Number | 0 | 0-24 | yes | America non-workday PvP start hour. |
| `PVPTimeAmericaWorkEndTime` | Number | 24 | 0-24 | yes | America workday PvP end hour. |
| `PVPTimeAmericaWorkStartTime` | Number | 0 | 0-24 | yes | America workday PvP start hour. |
| `PVPTimeAsiaNoWorkEndTime` | Number | 24 | 0-24 | yes | Asia non-workday PvP end hour. |
| `PVPTimeAsiaNoWorkStartTime` | Number | 0 | 0-24 | yes | Asia non-workday PvP start hour. |
| `PVPTimeAsiaWorkEndTime` | Number | 24 | 0-24 | yes | Asia workday PvP end hour. |
| `PVPTimeAsiaWorkStartTime` | Number | 0 | 0-24 | yes | Asia workday PvP start hour. |
| `PVPTimeEuropeNoWorkEndTime` | Number | 24 | 0-24 | yes | Europe non-workday PvP end hour. |
| `PVPTimeEuropeNoWorkStartTime` | Number | 0 | 0-24 | yes | Europe non-workday PvP start hour. |
| `PVPTimeEuropeWorkEndTime` | Number | 24 | 0-24 | yes | Europe workday PvP end hour. |
| `PVPTimeEuropeWorkStartTime` | Number | 0 | 0-24 | yes | Europe workday PvP start hour. |
| `SecondDayMaxAwarenessLevel` | Number | 60 | 1-60 | yes | Awareness level cap on server day 2. |
| `SeventhDayMaxAwarenessLevel` | Number | 60 | 1-60 | yes | Awareness level cap on server day 7. |
| `SixthDayMaxAwarenessLevel` | Number | 60 | 1-60 | yes | Awareness level cap on server day 6. |
| `TenthDayMaxAwarenessLevel` | Number | 60 | 1-60 | yes | Awareness level cap on server day 10. |
| `ThirdDayMaxAwarenessLevel` | Number | 60 | 1-60 | yes | Awareness level cap on server day 3. |

### FenLei 9 — AI level and deployment counts (3 keys)

| Key | Type | Default | Range | Shown | Description |
| --- | --- | --- | --- | --- | --- |
| `AIDengJi` | Number | 1 | 1-3 | yes | AI level (1-3). |
| `DongWuChuZhanCount` | Number | 1 | 1-100 | hidden | Animal deploy count. |
| `ManRenChuZhanCount` | Number | 3 | 1-100 | yes | Tribesman deploy count. |

### FenLei 10 — Battlefield war times (6 keys)

| Key | Type | Default | Range | Shown | Description |
| --- | --- | --- | --- | --- | --- |
| `AmericaWarTimeEnd` | Number | 4 | 0-24 | yes | America battlefield end hour. |
| `AmericaWarTimeStart` | Number | 0 | 0-24 | yes | America battlefield start hour. |
| `AsiaWarTimeEnd` | Number | 14 | 0-24 | yes | Asia battlefield end hour. |
| `AsiaWarTimeStart` | Number | 10 | 0-24 | yes | Asia battlefield start hour. |
| `EuropeWarTimeEnd` | Number | 21 | 0-24 | yes | Europe battlefield end hour. |
| `EuropeWarTimeStart` | Number | 17 | 0-24 | yes | Europe battlefield start hour. |

### FenLei 11 — Global events (12 keys)

| Key | Type | Default | Range | Shown | Description |
| --- | --- | --- | --- | --- | --- |
| `SpecialEventAmericaEndTime` | Number | 5 | 0-24 | yes | America global-event end hour. |
| `SpecialEventAmericaStartTime` | Number | 23 | 0-24 | yes | America global-event start hour. |
| `SpecialEventAsiaEndTime` | Number | 16 | 0-24 | yes | Asia global-event end hour. |
| `SpecialEventAsiaStartTime` | Number | 10 | 0-24 | yes | Asia global-event start hour. |
| `SpecialEventConfigSwitch` | Toggle | 0 | 0-1 | yes | Global-event correction toggle. |
| `SpecialEventEuropeEndTime` | Number | 23 | 0-24 | yes | Europe global-event end hour. |
| `SpecialEventEuropeStartTime` | Number | 17 | 0-24 | yes | Europe global-event start hour. |
| `SpecialEventGameDist` | Number | 0 | 0-2 | yes | Global-event region setting. |
| `SpecialEventServerOpenDay` | Number | 1 | 0-10 | yes | Server-open day used for global events. |
| `SpecialEventTriggerInterval` | Number | 3600 | 1-86399 | yes | Global-event trigger interval in seconds. |
| `SpecialEventTriggerPercent` | Number | 50 | 0-100 | yes | Global-event trigger probability (percent). |
| `SpecialEventTriggetLimitNum` | Number | 2 | 0-10 | yes | Global-event trigger count limit. |

## 4. Focus keys for progression

Values below are group `1` of each mode preset, the group a dedicated server reads.
Every key here is `IsShow=true` and is therefore settable both in the in-game coefficient menu and by file edit.
The `Survival` column is the unsuffixed `GameXishu_Template.json` family, whose `ECustomGameMode` enum value is `Survival`; `Action`, `Creative`, `Management` and `PVP` map to their same-named enum values.

| Key | Range | Survival | Action | Creative | Management | PVP |
| --- | --- | --- | --- | --- | --- | --- |
| `MaxLevel` | 1-60 | 60 | 60 | 60 | 60 | 60 |
| `ExpRatio` | 0.1-5 | 1 | 1 | 5 | 1 | 1 |
| `ShuLianDuExpRatio` | 0.1-10 | 1 | 3 | 2 | 1 | 1.5 |
| `ChengZhangExpRatio` | 0.1-5 | 1 | 1 | 2 | 1 | 1 |
| `MJExpRatio` | 0.1-5 | 1 | 5 | 2 | 1 | 1 |
| `CurProfInitRatio` | 0-1 | 0 | 1 | 0 | 0 | 0 |
| `TrainingExpRatio` | 0.1-100 | 1 | 10 | 50 | 1 | 5 |
| `ManRenPinZhiRatio` | 0-5 | 1 | 1 | 1 | 1 | 1 |
| `MaRenBeiDongYiJiShuXingRatio` | 1-3 | 1 | 1 | 1 | 1 | 1 |
| `MaRenZhuDongYiJiShuXingRatio` | 1-3 | 1 | 1 | 1 | 1 | 1 |
| `MaRenErJiShuXingRatio` | 0.5-3 | 1 | 1 | 1 | 1 | 1 |
| `BeiDongYiJiShuXingRatio` | 0-3 | 1 | 1 | 1 | 1 | 1 |
| `ZhuDongYiJiShuXingRatio` | 0-3 | 1 | 1 | 1 | 1 | 1 |
| `ErJiShuXingRatio` | 0.5-3 | 1 | 1 | 1 | 1 | 1 |
| `GeRenMaxZhaoMuCount` | 1-10 | 6 | 6 | 10 | 6 | 6 |
| `GeRenMaxZhaoMuCount_Two` | 1-20 | 10 | 10 | 20 | 10 | 10 |
| `GeRenMaxZhaoMuCount_Three` | 1-1000 | 15 | 15 | 1000 | 15 | 15 |
| `GongHuiMaxZhaoMuCount` | 1-1000 | 40 | 40 | 1000 | 40 | 40 |
| `ManRenChuZhanCount` | 1-100 | 1 | 3 | 100 | 3 | 1 |
| `GongHuiMaxMember` | 1-50 | 20 | 20 | 50 | 20 | 10 |
| `ShiWuXiaoHaoRatio` | 0-2 | 1 | 0.1 | 1 | 1 | 1 |
| `WanMeiChongSu` | 0-1 | 1 | 1 | 1 | 1 | 1 |
| `ZuRenFuZhi` | 0-1 | 1 | 1 | 1 | 1 | 1 |
| `ChestDropEquipmentMaxQualitySwitch` | 0-1 | 0 | 0 | 0 | 0 | 0 |
| `ZhiZuoTimeRatio` | 0.1-100 | 1 | 5 | 10 | 1 | 5 |
| `DongWuPinZhiRatio` | 0-5 | 1 | 1 | 1 | 1 | 1 |
| `ShuaXinNPCKaiGuan` | 0-1 | 0 | 0 | 0 | 0 | 0 |

Notes on individual focus keys:

- `MaxLevel` is the awareness level cap and is hard-clamped at 60 by its schema range.
- `ExpRatio` scales awareness/mask XP; `ShuLianDuExpRatio` scales proficiency XP; `TrainingExpRatio` is specifically the Training Ground multiplier and is the direct training-duration control.
- `ManRenPinZhiRatio` is the wild-barbarian quality coefficient; it scales the quality of recruitable barbarians, making it the only config lever that indirectly moves the recruit quality distribution.
- `MaRenBeiDong/ZhuDong/ErJiShuXingRatio` are the barbarian per-level attribute gains; the `BeiDong` and `ZhuDong` keys clamp at 1 minimum, so they can only increase, not decrease, growth.
- `CurProfInitRatio` is documented as the initial current-proficiency range for elites/bosses, not for ordinary recruits; it is 0 in every preset except Action.
- `GeRenMaxZhaoMuCount` (personal) and `GongHuiMaxZhaoMuCount` (guild) are the recruit roster caps; `ManRenChuZhanCount` caps deployed tribesmen.
- The mod's ramp magnitudes (`ZhaoMuRamp01`-`ZhaoMuRamp15`) are keys on each mode's coefficient manager (`BP_GameXiShu_GuanLiQi` for Survival, `BP_GameXiShu_GuanLiQi_Management` for Tribe Mode), absent from the shipped disk schema; the game picks the manager per `ECustomGameMode` and a key absent from that mode's manager falls back to `1.0`. `UHGameXiShuGuanLiQi::LoadFromJsonFile` applies every key present in the loaded `GameXishu.json` with no schema filter, so once the game writes the ramp keys into that saved file they override the pak. **asset-level verified.**
- `GongHuiMaxZhaoMuCount` also min-bounds the personal total, so the mod's Tribe Mode `93` target holds only where the world tribe cap allows; group `1` sets `GongHuiMaxZhaoMuCount` to `40`, and [`roster-limits.md`](roster-limits.md) records the per-mode and per-group values.
- `ChestDropEquipmentMaxQualitySwitch` is a 0/1 toggle that caps chest-dropped equipment quality; it is off in every shipped preset.
- `WanMeiChongSu` and `ZuRenFuZhi` are the deep-copy and tribesman-duplication toggles.

Related reference: see `roster-limits.md` for how the personal and guild recruit caps are composed, `proficiencies-and-caps.md` for the DataTable cap mechanism that config cannot reach, and `starting-proficiency.md` for the deterministic starting-value curve.

## 5. Linux-only levers (no pak, no mod, no cook)

These are the keys a server admin can change with a text editor on Linux and have take effect without cooking or installing any mod.

| Goal | Keys | What config can do | Limitation |
| --- | --- | --- | --- |
| Deterministic caps f(class, level) | `ManRenPinZhiRatio` | Shifts the overall quality distribution of wild/recruitable barbarians. | Cannot make caps a function of class and level; caps live in `ProfConfigDTList`/DataTables, not config. |
| Sequential mastery unlock | none | Nothing. | Mastery pools are DataTable data (`DT_ZhuanJingSLD`, `DT_SpecializedSkill`). |
| Talent pool and tiers | none | Nothing. | Talent structure is DataTable data (`DT_Gift*`). |
| Training Ground duration and value transfer | `TrainingExpRatio` | Scales Training Ground speed from 0.1x to 100x, i.e. a tunable duration from very slow to near-instant. | Does not change what is transferred (still talents/caps, not proficiency values). |
| Training Ground pacing | `ShuLianDuExpRatio`, `ExpRatio`, `ChengZhangExpRatio` | Change overall proficiency and leveling speed. | Global, not training-specific except `TrainingExpRatio`. |
| Item quality | `ChestDropEquipmentMaxQualitySwitch`, `ManRenPinZhiRatio`, `DongWuPinZhiRatio` | Cap chest equipment quality; shift creature quality. | No deterministic crafter-proficiency quality floor; recipes (`HPeiFangBase`) are DataTable data. |
| Roster pressure | `GeRenMaxZhaoMuCount`, `GeRenMaxZhaoMuCount_Two`, `GeRenMaxZhaoMuCount_Three`, `GongHuiMaxZhaoMuCount`, `ManRenChuZhanCount`, `GongHuiMaxMember` | Tighten or loosen recruitment and deployment caps directly. | Roster cap alone does not make later recruits attractive. |
| Deep-copy / remodel toggles | `WanMeiChongSu`, `ZuRenFuZhi` | Enable or disable perfect remodel and tribesman duplication. | Binary toggles; cannot repurpose deep copy into a proficiency transfer. |
| Progression pace | `ExpRatio`, `ShuLianDuExpRatio`, `ChengZhangExpRatio`, `MJExpRatio`, `CaiJiExpRatio`, `ZhiZuoExpRatio`, `ShaGuaiExpRatio`, `QiTaExpRatio` | Scale all XP sources. | Speed only, not structure. |
| Attribute growth | `BeiDongYiJiShuXingRatio`, `ZhuDongYiJiShuXingRatio`, `ErJiShuXingRatio`, `MaRen*`, `DongWu*` | Scale per-level attribute gains. | Global multipliers, not class-specific curves. |
| Level ceiling | `MaxLevel`, `InitialDefaultAwarenessLevel`, day-1..day-10 caps | Raise or throttle the awareness level ceiling. | Hard maximum 60. |

To set any of these, edit group `1` of `WS/Saved/GameplaySettings/GameXishu.json` on the stopped server with a text editor.
Config alone can tune training speed, roster counts, XP pacing, attribute growth, wild-creature quality and feature toggles.
Config alone cannot deliver deterministic per-class caps, ordered mastery unlocks, a restructured talent pool, a deterministic crafted-quality floor, or defect auto-removal; those require DataTable or Blueprint data changes.

## 6. User-editable paths and precedence

The live file is generated by the game at runtime; it is not present in this client install.
The shipped templates are read-only reference presets used to seed a missing live file.

| Context | Exact path | Notes |
| --- | --- | --- |
| Dedicated server default | `WS/Saved/GameplaySettings/GameXishu.json` | One file for the whole server. Dedicated servers read group `1`. **Community-documented.** |
| Dedicated server with `-coef=<Name>` | `WS/Saved/GameplaySettings/GameXishu_<Name>.json` | `-coef=PvE_10P_3x` selects `WS/Config/GameplaySettings/GameXishu_Template_PvE_10P_3x.json` and renames the saved file accordingly. **Community-documented.** |
| Local / co-op game | `%localappdata%\WS\<SteamID>\2646460\AutoGames\<world>\GameXishu_<0-5>.json` | One file per difficulty: 0 Casual, 1 Easy, 2 Normal, 3 Hard, 4 Master, 5 Custom. Only the host's machine holds it. **Community-documented.** |
| Server engine settings | `WS/Saved/Config/WindowsServer/Engine.ini` | Holds server-only settings such as `[Server.SafeIP]` RCON allow-list. Not present in this client install. **Community-documented.** |

Precedence, highest first:

1. Command-line parameters, e.g. `-GongHuiMaxMember=<count>`, which override the setting on next start.
2. The live in-game coefficient menu, which edits the saved file immediately.
3. `WS/Saved/GameplaySettings/GameXishu[_<Name>].json` group `1` on a dedicated server.
4. The selected `GameXishu_Template[_<Name>].json` preset, used to seed a missing saved file.
5. Built-in compiled defaults.

`UHGameXiShuGuanLiQi::LoadFromJsonFile` resolves the gameplay-settings keys: it prefers the world's saved `WS/Saved/GameplaySettings/GameXishu.json` and falls back to `GameXishu_Template[_<coef>].json` when the saved file is absent, then applies every key present in the loaded JSON to `GameXiShuMap`, auto-creating a missing key (`FindOrAdd`) with no schema or whitelist filter, so a key is overridden exactly when it is present in the loaded JSON.
Each applied value is then clamped into its `GameXiShuConfigUnit`'s `[XiShuMinValue, XiShuMaxValue]` without raising it **asset-level verified**.

## 7. Mod loading and signatures

No `.ini` file is present anywhere in this client install, so `DefaultEngine.ini`/`DefaultGame.ini` and any mod-loading settings are inside the encrypted pak rather than plaintext.
What is visible and documented:

- `WS/Content/Paks/WS-WindowsNoEditor.sig` is present; the game rejects unsigned paks unless the `-fileopenlog` launch option is supplied.
- The canonical mod drop directory is `WS/Mods/` (client or server), with a `~mods` variant; neither exists in this install because no mods are installed.
- `-fileopenlog` is added to the client Steam launch options or the server launch script (for example `WSServer.sh`).
- The only plaintext file that governs `-coef` preset selection is the command line; there is no ini key for it in the shipped client.
- Signature generation is not possible from Linux because the RSA private key is not public; see `../modding-guide/authoring-pipeline.md`.

Config and mod loading are disjoint: `GameXishu.json` is a disk file read by the server, not a pak asset, so it is never carried inside a mod pak.

## 8. Reproduction commands

Inventory every non-pak, non-executable plaintext file:

```
find /soulmask -type f ! -iname '*.pak' ! -iname '*.exe' ! -iname '*.dll' ! -iname '*.pdb' | sort
```

List the gameplay configuration files with sizes and encodings:

```
ls -la /soulmask/WS/Config/GameplaySettings/
stat -c '%s %n' /soulmask/WS/Config/GameplaySettings/*.json
xxd -l 4 /soulmask/WS/Config/GameplaySettings/GameXishuConfig_Template.json   # fffe = UTF-16LE BOM
```

Extract all 282 keys and their schema metadata (run under bun; the schema files are UTF-16LE):

```
bun -e 'const b=require("fs").readFileSync("/soulmask/WS/Config/GameplaySettings/GameXishuConfig_Template.json");const o=JSON.parse(b.toString("utf16le").slice(1));const s=o["0"];for(const k of Object.keys(s).sort()){const v=s[k];console.log(k,v.XiShuDefaultValue,v.XiShuMinValue,v.XiShuMaxValue,v.XiShuFenLei,v.IsShow)}'
```

Show a focus key across every template group `1`:

```
cd /soulmask/WS/Config/GameplaySettings
for f in GameXishu_Template.json GameXishu_Template_Action.json GameXishu_Template_Creative.json GameXishu_Template_Management.json GameXishu_Template_PVP.json; do printf '%s ' "$f"; bun -e 'const o=JSON.parse(require("fs").readFileSync(process.argv[1],"utf8"));console.log("TrainingExpRatio="+o["1"].TrainingExpRatio)' "$f"; done
```

Confirm there is no plaintext ini and no mods folder in this client install:

```
find /soulmask -type f \( -iname '*.ini' -o -iname '*.cfg' -o -iname '*.yaml' -o -iname '*.xml' \) | wc -l
find /soulmask -type d \( -iname 'Mods' -o -iname 'Saved' \) 2>/dev/null
ls -la /soulmask/WS/Content/Paks/
```

## 9. Foot-guns

- A running server can overwrite a hand-edited live file from its template; stop the server before editing `GameXishu.json`, and keep a backup.
- The `?ND=<n>` difficulty parameter seeds group `0` and leaves group `1` at defaults; a documented bug, and a common reason an edit appears to do nothing.
- The group `0`/`1`/`2` read target is ambiguous; community guides conflict on which group each runtime reads, so copy edits into all three groups when unsure.
- A malformed JSON live file may be silently reset to defaults; validate JSON before starting the server.
- GameXishu is disk configuration and cannot be shipped inside a pak or mod; it must be distributed as a file placed at `WS/Saved/GameplaySettings/GameXishu.json`.
- Hidden (`IsShow=false`) keys are still editable in the file even though the in-game menu does not show them.
- Raw values are IEEE-754 float32; round them when comparing or copying, or the printed value will not match your edit.
- The shipped templates are not the live file; editing them alone does not change a running server.
