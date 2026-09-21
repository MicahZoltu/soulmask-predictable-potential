# Roster Limits and the Recruit-Cap Ramp

This is the authoritative reference for every Soulmask setting that limits or raises a player's tribesman count, the traced composition of the effective personal cap, and the mask-node mechanism that grows it.
It documents the shipped game and the Consistent Progression mod separately: the shipped mask node `BP_Mask_XiuFu01_1012` carries exactly three keyed tiers, and the 15-tier `ZhaoMuRamp01`–`ZhaoMuRamp15` ladder is the mod's own design, specified in [`../../DESIGN.md`](../../DESIGN.md) and delivered in [`../mod-status.md`](../mod-status.md).
Confidence tags used throughout: **in-game verified** (observed on a running server), **asset-level verified** (read from a cooked asset or disassembled from the shipping binary), **inferred** (derived from structure), and **unverified** (plausible but not confirmed).
The plaintext settings file layout behind these keys is covered by [server-config.md](server-config.md); proficiency caps and the class and talent machinery that decide recruit quality are covered by [proficiencies-and-caps.md](proficiencies-and-caps.md).

## Count-limit settings

Every `GameXishu` key that changes a tribesman count, with its three group defaults and schema range.
Group `0` is the base preset, group `1` a restricted mode, and group `2` the permissive/creative side; the shipped templates assign them as the table shows **asset-level verified**.

| Key | Meaning | Group 0 | Group 1 | Group 2 | Range (g0 / g1 / g2) |
| --- | --- | --- | --- | --- | --- |
| `GeRenMaxZhaoMuCount` | Lv.1 Connection Enhancement increment | `6` | `6` | `6` | 1–10 / 1–100 / 1–10 |
| `GeRenMaxZhaoMuCount_Two` | Lv.2 increment | `10` | `10` | `10` | 1–20 / 1–200 / 1–20 |
| `GeRenMaxZhaoMuCount_Three` | Lv.3 increment | `15` | `15` | `15` | 1–1000 all groups |
| `GongHuiMaxZhaoMuCount` | Tribe Recruitment limit | `50` | `40` | `50` | 1–1000 all groups |
| `ManRenChuZhanCount` | Deployed Tribesmen | `3` | `1` | `3` | 1–100 all groups |
| `DongWuChuZhanCount` | Deployed animals | `1` | `1` | `1` | 1–100 all groups |
| `XinXiLuRu` | Info Entry Limit (stored/resurrectable) | `5` | `5` | `5` | 1–10 all groups |
| `CrewCountRatio` | Crew Count Multiplier | `1` | `1` | `1` | 0–10 all groups |
| `GongHuiMaxMember` | Tribe Players (human players, not tribesmen) | `20` | `20` | `20` | 1–50 / 1–100 / 1–50 |
| `MaxXiuMianCangCount` | Max Hibernation Pods | `50` | `50` | `50` | 1–100 all groups |
| `GeRenMaxDongWuCount` | Personal Animal Quantity Limit | `10` | `10` | `10` | 1–100 all groups |
| `GongHuiMaxDongWuCount` | Tribe Animal Quantity Limit | `50` | `50` | `50` | 1–100 all groups |
| `AnimalFollowerMaxCount` | Max followable animals | `3` | `3` | `3` | 0–100 all groups |

The `_Two` and `_Three` suffixes are literal; the three personal keys are the three Connection Enhancement mask tiers, not a chain of multipliers.
There is no single key named "max tribesmen": the personal limit is composed from a native base plus the three personal keys, and the tribe-wide limit is `GongHuiMaxZhaoMuCount`.

The schema is `GameXishuConfig_Template.json`, stored as UTF-16, with one record per key per group.
Each record carries `XiShuDefaultValue`, `XiShuMinValue`, `XiShuMaxValue`, `XiShuFenLei` (settings category), `IsShow`, and `BuTongNanDu_XiShuDefaultValue`, a six-entry per-difficulty default array.
The manager CDO `Default__BP_GameXiShu_GuanLiQi_C` serializes the same records as `GameXiShuConfigUnit` structs with `XiShuKey`, `Description`, `XiShuFenLei`, and the difficulty array.

The relevant new-game difficulty arrays **asset-level verified**:

| Key | Difficulty array (six entries) |
| --- | --- |
| `GeRenMaxZhaoMuCount` | `[6, 6, 6, 6, 6, 6]` |
| `GeRenMaxZhaoMuCount_Two` | `[10, 10, 10, 10, 10, 10]` |
| `GeRenMaxZhaoMuCount_Three` | `[50, 50, 50, 50, 50, 15]` |
| `GongHuiMaxZhaoMuCount` | `[50, 50, 50, 50, 50, 50]` |
| `ManRenChuZhanCount` | `[3, 3, 3, 3, 3, 3]` |
| `GeRenMaxDongWuCount` | `[50, 50, 50, 50, 50, 10]` |

The base template keeps `GeRenMaxZhaoMuCount_Three = 15`, while the five named-difficulty templates (`_Jiandan`, `_Putong`, `_Kunnan`, `_Dashi`, `_Xiuxian`) and the `_Action` and `_Management` difficulty variants set it to `50`; only the Custom preset keeps `15`.
`GongHuiMaxZhaoMuCount` is `50` on groups 0 and 2 and `40` on group 1 regardless of difficulty.
The `_Creative` family raises the whole family (`10` / `20` / `1000`, tribe cap `1000`, deploy `100`), and the dedicated `GameXishu_Template_PvE_*` / `_PvP_*` presets change only `GongHuiMaxMember` and `GeRenMaxDongWuCount`, never a recruit-cap key **asset-level verified**.

## The traced personal-cap formula

The effective personal cap is native state on `AHPlayerState`.
`AHPlayerState::AHPlayerState` is at `0x49a2050`, and it seeds the cap block at construction from the constant at virtual address `0x6df880`.
The constant's sixteen bytes are `03 00 00 00 03 00 00 00 00 00 00 00 00 00 00 00`, written by `movaps %xmm0,0x4e0(%rbx)` at `0x49a212d` **asset-level verified**.

| Offset | Property | Seeded value |
| --- | --- | --- |
| `0x4e0` | `PeiZhiMaxZhaoMuCount` (configured base) | `3` |
| `0x4e4` | `MaxZhaoMuCount` (effective cap) | `3` |
| `0x4e8` | `ConfigMaxChuZhanCount` | `0` |
| `0x4ec` | `AddCanChuZhanManRenCount` | `0` |
| `0x4f0` | `GuiShuCharaterRenCount` | `0` |

No store to `0x4e0` was found anywhere in the binaries after construction, so the configured base stays `3` **inferred**.
The effective cap is written by `AHPlayerState::SetMaxZhaoMuCount` at `0x4a307b0` (`mov %eax,0x4e4(%r14)`), and the caller supplies the computed value **asset-level verified**.

```text
personalBase         = 3                                                  // AHPlayerState constructor constant at 0x6df880, offset 0x4e0
maskIncrements(L)    = 0                                                  // L = awareness level
                     + GameXishu[GeRenMaxZhaoMuCount]                     when L >= 12   // 6
                     + GameXishu[GeRenMaxZhaoMuCount_Two]                 when L >= 18   // 10
                     + GameXishu[GeRenMaxZhaoMuCount_Three]               when L >= 25   // 15, or 50 on a named difficulty
effectivePersonalCap = personalBase + min(maskIncrements, GameXishu[GongHuiMaxZhaoMuCount])
tribeCap             = GameXishu[GongHuiMaxZhaoMuCount] + Σ guild TribeMemCount   // 50 + 0..20
deployCap            = GameXishu[ManRenChuZhanCount] + AHPlayerState.AddCanChuZhanManRenCount
storedCap            = GameXishu[XinXiLuRu]
```

The awareness-table column is not part of the formula.
Each `AwarenessLevel_*` asset is a cooked `DataTable` whose row struct is `PlayerLevelConfig`, which carries three columns: `UpgradeExp`, `AddKeJiPoints`, and `ZhaoMuMaxCount` **asset-level verified**.
`PlayerLevelConfig.ZhaoMuMaxCount` in `AwarenessLevel_{Survival,Action,Management,PVP}` is flat `10` across all 60 rows in all four modes, but it is not consumed: if it fed the base the base would read `10`, while both the constructor constant and the observed base are `3` **in-game verified**.
The base of `3` is high confidence; the mask increments are high confidence; the tribe-cap clamp is medium confidence.
The exact clamp placement is unresolved: `3 + min(Σ increments, tribeLimit)` versus `min(3 + Σ increments, tribeLimit)` are not disambiguated by an observed `50`, and both yield the same result under a default tribe cap **unverified**.

The mask applier ultimately sets `MaxZhaoMuCount = base + the triggering tier's stored value`, so stored tier values are cumulative total offsets, not per-click deltas **in-game verified**.
A repaired tier's tooltip reads `+{0} (total number of tribesmen allowed: {1})`, matching this set-to-total behavior; the repair text has one variant per tier.
Community reports of an additive sum (`3 + 10 + 10 + 10 = 33`, or `3 + 10 + 20 + 100 → 103`) match an older build or per-tier previews and do not match the set-to-total applier in the shipping build **inferred**.

## The mask node mechanism

The only effect asset that raises the recruit cap is `Blueprints/MianJu/XiuFu01/BP_Mask_XiuFu01_1012`, named "Connection Enhancement" (in-game "Strong Compatibility Module") **asset-level verified**.
It is a typed `NormalExport` class-default object whose `MJXFNodeConfigList` (a `TArray<FMianJuXiuFuNodeConfig>`) holds exactly three shipped entries, gated at awareness `12`, `18`, and `25`.
Each entry carries one `NeedTeShuShuXingList[0]` with a keyed `TeShuZiType_AddZhaoMuNum` effect **asset-level verified**.

| Tier | `NeedYiShiDengJi` | `TeShuType` | `ShuXingGameXiShuStr` | `MJXGType` | `ZhiOrBiLi` |
| --- | --- | --- | --- | --- | --- |
| 1 | 12 | `TeShuZiType_AddZhaoMuNum` | `GeRenMaxZhaoMuCount` | `MJXG_Max` | `true` |
| 2 | 18 | `TeShuZiType_AddZhaoMuNum` | `GeRenMaxZhaoMuCount_Two` | `MJXG_Max` | `true` |
| 3 | 25 | `TeShuZiType_AddZhaoMuNum` | `GeRenMaxZhaoMuCount_Three` | `MJXG_Max` | `true` |

`TeShuZiType_AddZhaoMuNum` is enum id `3` in `EMJXFTeShuZiType`; ids `10` and `17` are `TeShuZiType_KeLongShangXian` and `TeShuZiType_JiangDiTouBuShangHai` **asset-level verified**.
The effect struct `FMianJuXiuFuTeShuShuXing` places `TeShuType` at `0x0`, `IsShuXingJi` at `0x1`, `ShuXingZhi` at `0x4` (float), `ShuXingGameXiShuStr` at `0x8` (`FString`), and `TeShuShuXingPeiZhi` at `0x18` (`FTeShuAttrDian`: `MJXGType`, `AttrType`, `ZhiOrBiLi`, `Dian` float, `GEClass`) **asset-level verified**.
Every shipped node entry has exactly one special-attribute element, so a ramp is expressed as many `MJXFNodeConfigList` entries, one per gate, not as many elements under one gate.

The three shipped keyed tiers carry disk values `6`, `10`, and `15` in the base and Custom templates, or `50` for the third tier on a named difficulty; the difficulty array for `_Three` is `[50, 50, 50, 50, 50, 15]` **asset-level verified**.
The `_Three` disk value therefore changes with the new-game difficulty and reaches the personal cap through this node alone.

The gate field is `NeedYiShiDengJi` (awareness); `NeedMianJuDengJi` (mask level) is `0` on all three shipped entries and is not the read gate, so the tiers would otherwise unlock from the start **inferred**.
The shipped siblings `BP_Mask_XiuFu01_1021` and `BP_Mask_XiuFu01_1023` show that neither the list length nor the literal-value path is restricted to `1012` **asset-level verified**:

| Sibling asset | Effect | Gate | `ShuXingZhi` | `ShuXingGameXiShuStr` | `MJXGType` | `ZhiOrBiLi` |
| --- | --- | --- | --- | --- | --- | --- |
| `BP_Mask_XiuFu01_1021` | `TeShuZiType_KeLongShangXian` | 35 | `10` | `XiShuWeiLing` | `MJXG_Max` | `true` |
| `BP_Mask_XiuFu01_1023` | `TeShuZiType_JiangDiTouBuShangHai` | 20–40 | `0.05`–`0.45` | `XiShuWeiLing` | `MJXG_Max` | `false` |

`1021` is a clone-limit node whose integer cap `10` comes from `ShuXingZhi`, and `1023` carries nine literal damage-reduction tiers; both prove a fixed-literal path for their own effect types, which is why the structural analogy to `AddZhaoMuNum` fails.
`1023`'s nine-tier list also shows the list length is not limited by the shipped three.

The mask-upgrade (`GaiZhuang`) assets compose the repair nodes but do not carry the effect themselves **asset-level verified**.
A `BP_MJGZ_*` entry holds `DuLiXiuFuNodeList` (object references to `BP_Mask_XiuFu0x_*` repair nodes), `FuZaiShangXianList` (the mask load limits `30, 60, …, 300`), `CurShuXingMap` (per-type mask attribute levels), and `GE_MaskList`.
200 `BP_Mask_XiuFu0x_*` repair-node assets carry `NeedTeShuShuXingList`: `36` in `XiuFu01`, `110` in `XiuFu02`, `14` in `XiuFu03`, and `40` in the DLC `AdditionMap01/BluePrints/Mask/XiuFu`.
All are typed `NormalExport` and UAssetAPI-editable, so an increment can only be reached by editing the referenced repair node, not the upgrade.

## The AddZhaoMuNum value channel

A search of the extracted tree for `AddZhaoMuNum` returns exactly one effect asset, `BP_Mask_XiuFu01_1012`, plus the settings manager `BP_GameXiShu_GuanLiQi` and `BP_GameSingleton`, which carry the enum name only in their `NameMap` **asset-level verified**.
`AddZhaoMuNum` is the only mask effect whose magnitude is a server-tunable count, and it is the only one that names a gameplay-settings key.

The effect list uses a shared struct with a sentinel key and a literal float.
`XiShuWeiLing` is defined in the plaintext schema with `Desc = "系数需要为0"` ("the coefficient must be zero"), `XiShuDefaultValue = 0`, and `IsShow = false`.
For most effect types the literal magnitude lives in `ShuXingZhi`, and those handlers read it: `TeShuZiType_KeLongShangXian` stores its integer cap there and `TeShuZiType_JiangDiTouBuShangHai` stores nine distinct damage-reduction literals there.
`AddZhaoMuNum` does not: it resolves its magnitude from the GameXishu key named by `ShuXingGameXiShuStr`, and `ShuXingZhi` is inert for this effect **in-game verified**.
A node written with `XiShuWeiLing` plus a non-zero `ShuXingZhi` rendered `+0 (total 3)`, while the same node with the named keys rendered its key values, so the literal path belongs to the other effect handlers, not to the shared struct **in-game verified**.

The key channel is the manager default-object maps on `BP_GameXiShu_GuanLiQi` (`Blueprints/ZiYuanGuanLi/BP_GameXiShu_GuanLiQi`), a cooked `NormalExport` CDO that is pak-editable **asset-level verified**:

- `GameXiShuMap` is `TMap<int32 group, TMap<FString key, float value>>` with `287` keys in each of groups `0`, `1`, and `2`.
- `GameXiShuConfigMap` is `TMap<int32 group, TArray<GameXiShuConfigUnit>>` with `282` units; each unit carries `XiShuKey`, `XiShuDefaultValue`, and six `BuTongNanDu_XiShuDefaultValue` entries.

The Blueprint helper `BP_GetGameXiShuBothUse` (native exec thunk at `0x4f427c0`) reads a key plus a default and returns the map value; it returns `1.0` when the key is absent (`.rodata 0x6bfb80`) **asset-level verified**.
The disk files `GameXishuConfig_Template*.json` and `GameXishu.json` seed or override the schema keys, which is how `_Three` becomes `50` on a named difficulty.
Keys that exist only in the default-object maps and not in the disk schema are not touched by `LoadFromJsonFile`; `BP_GameXiShu_GuanLiQi` already ships five map-only keys (`CaiJiDropRatio`, `ChengRenBanKaiGuan`, `DayTimePortion`, `SomeGongZuoTaiNeedWorkerKaiGuan`, `EmptyKey`), which shows the maps tolerate keys outside the schema **asset-level verified**.
A new key added to both maps with no disk counterpart resolves in game **in-game verified**.

## The guild cap

The tribe-wide cap is `GameXishu[GongHuiMaxZhaoMuCount]`, `50` on groups 0 and 2 and `40` on group 1, plus the guild-level `EGongHuiLevelEffect::TribeMemCount` effects **asset-level verified**.
`TribeMemCount = 5` in `DT_GongHuiLevelEffect_2`, `_3`, `_5`, and `_6` (guild levels 2, 3, 5, and 6); the level 1 and level 4 tables carry no such row, for a maximum of `+20`.
`TribeMemCount` is the only `EGongHuiLevelEffect` member that gates tribesmen; the other members are building caps (`BaseCount`, `CampFireCount`, `FarmlandCount`, `PenCount`, `XiuMianCangCount`, and similar), none of which gates tribesman count **asset-level verified**.
The native accumulator is `HGongHuiGuanLiQi.MaxZhaoMuCountExtLimit`, with the base `HGongHuiGuanLiQi.MaxZhaoMuCount` recorded at property offset `0x2b8` (property record `0x1542b48`) and the extension at offset `0x320` (property record `0x1542cc8`) **asset-level verified**.
The per-member views are `GongHuiRenYuanData.MaxZhaoMuCount` and `PlayerGongHuiData.MaxZhaoMuCount`.

```text
tribeCap = GameXishu[GongHuiMaxZhaoMuCount] + Σ guild TribeMemCount   // 50 (or 40) + 0..20
```

Community testing shows this tribe cap bounds the personal total, which is why a player with all three sliders summing above the tribe limit is observed at the limit **inferred**.
Whether the effect raises the tribe *tribesman* cap or the tribe *player* cap is not directly observed at runtime, but the field name and its adjacency to `MaxZhaoMuCountExtLimit` indicate the tribe tribesman cap **inferred**.

## The mod's ramp technique

The shipped game carries only the three keyed tiers of `BP_Mask_XiuFu01_1012`; the 15-tier ladder below is the mod's design and is not shipped content.
The mod rebuilds the node as 15 `TeShuZiType_AddZhaoMuNum` tiers, one every four awareness levels from 4 through 60, each raising the total by `3`, for a native base of `3` to an endgame cap of `48` **in-game verified**.
The delivered ladder is recorded in [`../mod-status.md`](../mod-status.md), where the tier tooltips and the resulting personal cap were read in game.
Each tier stores its cumulative total offset rather than a per-click delta, because the applier sets `MaxZhaoMuCount = base + value`.

| Tier | `NeedYiShiDengJi` | Key | Stored offset | Tooltip | Cap |
| --- | --- | --- | --- | --- | --- |
| 1 | 4 | `ZhaoMuRamp01` | 3 | `+3` | 6 |
| 2 | 8 | `ZhaoMuRamp02` | 6 | `+6` | 9 |
| 3 | 12 | `ZhaoMuRamp03` | 9 | `+9` | 12 |
| 4 | 16 | `ZhaoMuRamp04` | 12 | `+12` | 15 |
| 5 | 20 | `ZhaoMuRamp05` | 15 | `+15` | 18 |
| 6 | 24 | `ZhaoMuRamp06` | 18 | `+18` | 21 |
| 7 | 28 | `ZhaoMuRamp07` | 21 | `+21` | 24 |
| 8 | 32 | `ZhaoMuRamp08` | 24 | `+24` | 27 |
| 9 | 36 | `ZhaoMuRamp09` | 27 | `+27` | 30 |
| 10 | 40 | `ZhaoMuRamp10` | 30 | `+30` | 33 |
| 11 | 44 | `ZhaoMuRamp11` | 33 | `+33` | 36 |
| 12 | 48 | `ZhaoMuRamp12` | 36 | `+36` | 39 |
| 13 | 52 | `ZhaoMuRamp13` | 39 | `+39` | 42 |
| 14 | 56 | `ZhaoMuRamp14` | 42 | `+42` | 45 |
| 15 | 60 | `ZhaoMuRamp15` | 45 | `+45` | 48 |

The technique repoints each tier's `NeedTeShuShuXingList[0]` at a distinct new key (`ZhaoMuRamp01` … `ZhaoMuRamp15`), sets `ShuXingZhi = 0`, and leaves `TeShuShuXingPeiZhi` as `MJXGType = MJXG_Max`, `AttrType = EAttrType::None`, `ZhiOrBiLi = true`, `Dian = 0`, `GEClass = 0` **asset-level verified**.
The 15 keys are added to `BP_GameXiShu_GuanLiQi`'s `GameXiShuMap` and `GameXiShuConfigMap` in all three groups with the cumulative offsets.
The existing `StringTableEntry` keys `1_1012_1`, `1_1012_2`, and `1_1012_3` can be reused cyclically for `MJXFNodeMiaoShu` and `1_1012` for `MJXFNodeName`, since `ShuXingGameXiShuStr` is an `FString` written inline and needs no new `FName`.

Because `BP_Mask_XiuFu01_1012` is the only effect asset that references `GeRenMaxZhaoMuCount{,_Two,_Three}`, repointing all its tiers removes the keyed path entirely, and the disk `GeRenMaxZhaoMuCount_Three = 50` can no longer enter the personal cap **inferred**.
The new ramp keys are absent from the disk schema, so `LoadFromJsonFile` cannot override them and no disk side-file is required.
The binding gate is `NeedYiShiDengJi`: `NeedMianJuDengJi` stays `0` on every tier and is not the read field.
The shipped game reaches `53` on the named difficulties because its third tier stores `50`; this ladder lands at `48`, and the last tier's stored offset can be set to `50` to match `53`.

## Pak-editable versus disk-only

A `_P.pak` carries cooked package assets only; it carries no loose gameplay-settings JSON.
The retail client pak lists the `AwarenessLevel_*` tables, `BP_Mask_XiuFu01_1012`, and all six `DT_GongHuiLevelEffect*` tables as `.uasset`/`.uexp` entries, and no `GameXishu` JSON.
The server binary resolves the gameplay-settings keys through `UHGameXiShuGuanLiQi::LoadFromJsonFile`, which reads `GameXishuConfig_Template.json`, `GameXishuConfig_Template_<difficulty>.json`, `GameXishu.json`, and `GameXishu_<difficulty>.json` from disk.

| Lever | Asset / field | Pak-editable | Effect |
| --- | --- | --- | --- |
| Native personal base `3` | `AHPlayerState` constructor constant at `0x6df880` | No (native) | Fixed unless the binary is patched |
| Awareness-level `ZhaoMuMaxCount` column | `AwarenessLevel_{Survival,Action,Management,PVP}` rows 1–60 | Yes (inert) | Not consumed; a ramp there changes nothing |
| Mask tier gates and effect list | `BP_Mask_XiuFu01_1012` CDO `MJXFNodeConfigList` | Yes | Sets when each tier fires and what effect key it names |
| Mask tier increment values | gameplay-settings `GeRenMaxZhaoMuCount{,_Two,_Three}` | No (disk-only) | Chosen by the new-game difficulty preset |
| Ramp key values | `BP_GameXiShu_GuanLiQi` `GameXiShuMap` / `GameXiShuConfigMap` | Yes | Map-only keys supply the ramp magnitudes |
| Tribe-wide base cap | gameplay-settings `GongHuiMaxZhaoMuCount` | No (disk-only) | `50` or `40`; bounds the personal total |
| Guild-level cap extension | `DT_GongHuiLevelEffect{,_2.._6}` row `TribeMemCount` | Yes | Shipped `+5` at guild levels 2/3/5/6 |
| Deploy cap | gameplay-settings `ManRenChuZhanCount` | No (disk-only) | Independent of the roster |
| Stored cap | gameplay-settings `XinXiLuRu` | No (disk-only) | Resurrectable tribesmen |
| New-game difficulty settings | world `WS/Saved/GameplaySettings/GameXishu.json` plus the chosen template | No (disk-only) | Writes the `GeRenMaxZhaoMuCount*` and `GongHuiMaxZhaoMuCount` values at world creation |

## Foot-guns

- `XiShuWeiLing` plus a literal `ShuXingZhi` does not apply for `TeShuZiType_AddZhaoMuNum`; a probe rendered `+0 (total 3)` even though the float reached disk, so the value must come from the named key.
- Other effect types (`KeLongShangXian`, `JiangDiTouBuShangHai`, `MJNLShangXian`, and others) do read `ShuXingZhi`, so structural analogy to `AddZhaoMuNum` fails.
- The applier is set-to-total/cumulative, so each ramp tier must store its own cumulative total offset (`3, 6, 9, …, 45`), not a per-click delta; an additive assumption reads the wrong cap.
- The `AwarenessLevel_*` `ZhaoMuMaxCount` column is flat `10` and is not read; editing it does nothing.
- The binding gate is `NeedYiShiDengJi` (awareness), not `NeedMianJuDengJi` (mask level, which stays `0`); choosing the wrong gate silently never unlocks.
- Map-only keys can be dropped if the runtime rebuilds the maps from the disk schema (`LoadFromJsonFile`); they must be verified to resolve in game.
- The disk `_Three = 50` is difficulty-driven and can only be neutralized because `BP_Mask_XiuFu01_1012` is its sole consumer; all three tiers must be repointed.
- Clamp placement (`3 + min(Σ, limit)` versus `min(3 + Σ, limit)`) is unresolved; both yield `48` under the default tribe cap but differ at low tribe limits.
- The repair UI may collapse or mislabel 15 tiers that reuse three `StringTableEntry` keys; a locres extension can give each tier unique text.
- Re-applying node effects to an existing save and re-indexing already-repaired tiers is unresolved; a fresh world or a new mask is the safe path.
