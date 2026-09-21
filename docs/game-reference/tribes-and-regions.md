# Tribes and Regions

This document describes the hostile factions, the per-tribe identity traits and tribe-exclusive talents, the biome variants, the region tiers and their level bands, the region-to-gear-tier progression, and how tribe identity is keyed in cooked data.
Talent mechanics (pools, star tiers, defects, the assignment pipeline) live in [talents.md](talents.md); the recruitment and spawner machinery lives in [recruitment-and-spawns.md](recruitment-and-spawns.md); quality tiers and their effects live in [quality-and-rarity.md](quality-and-rarity.md).

Confidence labels used below: **in-game verified** (confirmed on a running server), **asset-level verified** (read from cooked assets), **inferred** (read from disassembly or collateral evidence), **community** (external guides, not confirmed in data), and **unverified**.

## Hostile factions

There are five hostile factions, of which four can be recruited.

| Faction | Recruitable | Notes |
| --- | --- | --- |
| Claw | Yes | Combat / crit identity. |
| Flint | Yes | Defense and crafting identity. |
| Fang | Yes | Poison and gathering identity. |
| Outcasts | Yes | Neutral environmental-resist filler; the base-map Exile/Outcast faction. |
| Plunderers | No | Plunderers, Elites, Scouts, and Leaders cannot be deterred or recruited. |

The faction list and the recruitability rule are community-sourced.
At the data layer the wild-camp NPCs are tagged by `ZhenYingTag` `YeMan` / `ZhiHui` / `ShenMi`; the capture spawner (`BP_SGQ_..._ZhuaBu`) spawns only `BP_SuiJi_BuLuo_UnTamed`.
Plunderer-type NPCs never appear in a capturable spawner, which is the cooked-data basis for the non-recruitable rule.

## Per-tribe identity and base traits

The base traits are community-sourced; each tribe's identity family is a three-entry I/II/III star family in `DT_GiftZongBiao`.

| Tribe | Base traits | Role identity |
| --- | --- | --- |
| Claw | Crit Rate +2%; Crit DMG +6%; _Power of Erosion_ (+DMG vs Flint/Fang/Outcast/Plunderers) | Combat / crit DPS; the game's strongest warriors. |
| Flint | DEF +3%; Crit Resist +3%; Max Resilience +15 | Defense and the best crafters (Flint-exclusive `Weapon Enhancement`, `Refined Armor`). |
| Fang | Poison Resist +20; Poison DMG taken −15% | Poison/ranged and gathering (Fang-exclusive `Logging Pro`, `Vein Protection`, `Planting Pro`). |
| Outcast | Environmental resists only (Heat/Cold/Radiation) | Neutral filler. |

## Tribe-exclusive talents

Two authoring surfaces grant tribe exclusives: the `BornBuLuoCiTiao` birth-tribe pool in `DT_GiftZongBiao`, granted through `BP_ManRenRandomConfig.BornBuLuoCiTiaoMap`, and the `Normal` pool talents whose description carries a `[Claw/Flint/Fang Exclusive]` tag.
The row ids and I→II→III effect values below are asset-level verified.

| Tribe | Talent | Row ids | Effect (I → II → III) | Gate |
| --- | --- | --- | --- | --- |
| Claw | Getting Braver | `160081/2/3` | Hitting an enemy within 5m has a 15% chance to stack Crit +2/3/4%, Crit Resist +2/3/4%, Crit DMG +2/3/4%, Move Speed +2/3/4% for 30s (×5) | `[Claw Exclusive]` |
| Claw | Fatal Rhythm | `160581/2/3` | Attacking above 70% Stamina stacks ATK +2/3/4% and Attack Speed +2/3/4% for 10s (×5) | `[Claw Exclusive]` |
| Flint | Refined Armor | `160711/2/3` | High-quality armor forging chance +5/7.5/10% | `[Flint Exclusive]` |
| Flint | Weapon Enhancement | `160721/2/3` | High-quality weapon forging chance +5/7.5/10% | `[Flint Exclusive]` |
| Fang | Planting Pro | `160411/2/3` | Planted/harvested crop output +10/15/20% | `[Fang Exclusive]` |
| Fang | Poisoned Body | `160621/2/3` | Each attack 5/10/15% chance to inflict a 10s poison stack (DoT, Stamina loss, weak spirit, ×5) | `[Fang Exclusive]` |
| Fang | Logging Pro | `160391/2/3` | Tree regrow −20/30/40% | `[Fang Exclusive]` |
| Fang | Vein Protection | `160401/2/3` | Mine regen −20/30/40% | `[Fang Exclusive]` |
| Outcast | Outcast climate-resist family | `420401/2/3` (Cold), `420411/2/3` (Radiation), `420421/2/3` (Scorching Heat) | Biome resist +5/10/15 | Outcast/exile only, region-conditional |

Claw's alternative exclusives include `Raging Inferno 160031/2/3`, `Overwhelming Force 160481/2/3`, `Tit for Tat 160901/2/3`, and `Morale Dampener 160651/2/3`.
Flint's defensive alternatives include `Endurance Burst 160501/2/3`, `Firm Will 160131/2/3`, `Insight DEF 160521/2/3`, and `Tactical Dodge 160351/2/3`.
`Tribe - Survivor` (`100113`, Max Load +20%) is the one untagged tribe talent and is the cleanest generic Outcast pick; its `EClanType` key was not resolved, so treat it as unverified.

## Biome variants

Each named tribe has Snow Mountain / Volcano / Wasteland subtypes that combine the primary stat with an environmental resist (for example _Claw — Volcano: Heat Resist +5, Crit +2%_).
The variant follows the **region**, not the tribe: any tribe present in a biome gets that biome's resist entry.
The region conditions are carried by the condition bags `BP_Gift_QuYu_3_HY` (radiation), `BP_Gift_QuYu_4_HS` (hot), and `BP_Gift_QuYu_5_XS` (cold).
Faction condition bags are also present (`BP_Gift_IsWolf_ZD`, `BP_Gift_IsHorn_ZD`, `BP_Gift_IsNanShenMi`), selected per region.

## Tribe talent counts

The community count is **30 Tribe talents** (base + biome + Outcast variants), each with I/II/III star tiers; this is a community tally, not a cooked row count.
At the cooked-data layer the identity families are keyed by `EClanType` through `BornBuLuoCiTiaoMap`; each `CiTiaoList` entry carries an `NGIDList` of families weighted 50 per star.
The table below enumerates the cooked families: 43 in total (Claw 3 base + 6 biome, Flint 3 + 6, Fang 2 + 6, Wolf 6, Horn 6, Outcast 3 + 2).
The community tally and the cooked family count are different axes and do not correspond one-to-one: the community number counts named talents that community sources group across tiers, while the family list counts `CiTiaoList` identity families.

| `EClanType` | Tribe | Base `QuYu_0` families | Biome / DLC families |
| --- | --- | --- | --- |
| `A` | Claw (利爪) | `40001`, `40002`, `40003` | `42009/10` radiation, `42015/16` heat, `42003/04` cold |
| `B` | Flint (燧石) | `41001`, `41002`, `41003` | `42011/12`, `42017/18`, `42005/06` |
| `C` | Fang (毒牙) | `42001`, `42002` | `42013/14`, `42019/20`, `42007/08` |
| `F` | Wolf / Desert Wolf (荒狼), DLC | none | `42050`–`42055` |
| `E` | Horn / Savage Horn (蛮角), DLC | none | `42060`–`42065` |
| `NONE` | Exile / Outcast (流放者) | none | `42040` cold, `42041` radiation, `42042` heat, `42070/71` DLC |

Tribe family meanings: Claw = Power of Erosion / Wild Power / Crit; Flint = Defense / Tenacity / Crit Resist; Fang = Poison Resist / Poison Immunity; Outcast = biome resistances; Wolf/Horn = DLC endurance/damage/stamina/immunity.
Outcast has no `QuYu_0` entry, so a base-map Outcast exclusive requires appending a `CiTiaoList` entry.

## Region tiers

The 12-tier / 26-region table below is community-sourced (fextralife); the notable-region tribe labels are consistent with the cooked spawner `ClanType` values.

| Tier | Levels | Regions (notable) |
| --- | --- | --- |
| 1 | 1–10 | **Eastern Rainforest** (start; Outcasts) |
| 2 | 11–20 | Western Rainforest (Flint), Northern Rainforest (Claw) |
| 3 | 16–25 | Mangrove (Flint), River Valley, Rift Valley |
| 4 | 21–30 | Rocky Bottomland, **Pit Hill (Fang)**, The Wild |
| 5 | 26–35 | Wetland, Lakeside Forest, Jungle Cave |
| 6 | 31–40 | **Table Mountain (Fang)**, Plateau Woodland (Flint) |
| 7 | 36–45 | Great Prairie (Flint), Giant Wood Forest (Claw) |
| 8 | 41–50 | Southern Wasteland, Northern Wasteland (Radiation), Giant Crater (Fang) |
| 9 | 41–50 | Barren Meadow, Volcanic Forest (Claw) |
| 10 | 46–55 | Scorching Volcano (Claw) |
| 11 | 51–60 | Frostleaf Grove (Flint), Dark Forest (Claw) |
| 12 | 56–65 | Alpine Land, Frost Canyon (Fang; Central Core) |

The cooked spawner level bands are narrower than the tier table: they run from 11–20 at T2 to 46–50 at the T11–T12 camps, and named camps top out at level 50.
The 51–65 range in the tier table is elite and dungeon content, not a wild-camp spawn band, so a mod should treat the tier level ranges as community orientation and the spawner `SCGZuiXiaoDengJi`/`SCGZuiDaDengJi` bands as the authoritative per-camp values.

## Region folder → English name

The region folders under `Blueprints/ShuaGuaiQi/SGQ_BuLuo` and the public region names are an inferred mapping, not a cooked field.
Each row below is a `ZhongXingBuLuo_*` (medium camp) or `DaXingBuLuo_*` (large camp) region folder; guard level is the random band, elite and boss are single levels.

| Region folder | Label (tier) | Guard lv | Elite lv | Boss lv | Tribe |
| --- | --- | --- | --- | --- | --- |
| `ZhongXingBuLuo_XiBuYuLin_ZhiHui` | Western Rainforest (T2) | 11–20 | 20 | 20 | Flint |
| `ZhongXingBuLuo_BeiBuYuLin_YeMan` | Northern Rainforest (T2) | 11–20 | 20 | 20 | Claw |
| `ZhongXingBuLuo_HongShuLin_ZhiHui` | Mangrove (T3) | 16–25 | 25 | 25 | Flint |
| `ZhongXingBuLuo_KengDongQiuLing_ShenMi` | Pit Hill (T4) | 21–30 | 30 | 30 | Fang |
| `ZhongXingBuLuo_PingDingShan_ShenMi` | Table Mountain (T6) | 31–40 | 40 | 40 | Fang |
| `ZhongXingBuLuo_DaCaoYuan_ZhiHui` | Great Prairie (T7) | 36–45 | 45 | 45 | Flint |
| `ZhongXingBuLuo_JuMuLin_YeMan` | Giant Wood Forest (T7) | 36–45 | 45 | 45 | Claw |
| `ZhongXingBuLuo_KuHuangYuanYe_YeMan` | Barren Meadow (T9) | 41–50 | 50 | 50 | Claw |
| `ZhongXingBuLuo_HanYeLin_ZhiHui` | Frostleaf Grove (T11) | 46–50 | 50 | 50 | Flint |
| `ZhongXingBuLuo_GaoHanDi_ShenMi` | Alpine Land (T12) | 46–50 | 50 | 50 | Fang |
| `DaXingBuLuo_HeiSenLin_YeMan` | Dark Forest (T11) | 46–50 | 50 | 50 | Claw |
| `DaXingBuLuo_HuAnSenLin_ZhiHui` | Lakeside Forest (T10) | 46–50 | 50 | 50 | Flint |
| `DaXingBuLuo_NanBuHuangYuan_ShenMi` | Southern Wasteland (T8) | 46–50 | 50 | 50 | Fang |

Guard rank weights are `HIGH:MIDDLE:LOW` = `15:35:50` in every region; elites and bosses are `HIGH:100`.
Quality follows rank: `LOW → 0/1`, `MIDDLE → 2/3`, `HIGH → 4/5` for guards, and `HIGH → 5` for elites and most bosses.

## Tribe × tier spread

No tribe is "always newbie": every tier is reachable by at least one tribe plus Outcast filler.
This table is community-sourced.

| Tier | Flint | Claw | Fang | Outcast |
| --- | --- | --- | --- | --- |
| T1 (1–10) | — | — | — | ✔ |
| T2 (11–20) | ✔ | ✔ | — | ✔ |
| T3 (16–25) | ✔ | ✔ | — | ✔ |
| T4 (21–30) | — | — | ✔ | ✔ |
| T5 (26–35) | ✔ | — | — | ✔ |
| T6 (31–40) | ✔ | — | ✔ | ✔ |
| T7 (36–45) | ✔ | ✔ | — | ✔ |
| T8 (41–50) | — | — | ✔ | ✔ |
| T9 (41–50) | — | ✔ | — | ✔ |
| T10 (46–55) | — | ✔ | — | ✔ |
| T11 (51–60) | ✔ | ✔ | — | ✔ |
| T12 (56–65) | — | — | ✔ | ✔ |

Flint is front-loaded in the southern jungle (T2, 3, 5, 6, 7) but returns at T11; Claw starts beside Flint and ends in volcano/dark forest; Fang starts later and ends highest.
Outcasts are recruitable filler at every tier.
The conclusion is that tribes map to **biomes, not difficulty**: tribe is the horizontal identity axis and region tier / spawn level is the vertical axis.

## Region tier → barbarian gear tier

Gear progression is Linen → Leather/Hide → Bone → Bronze → Iron → Steel → (Fine Steel/Enhancement).
The awareness-level gates for the gear nodes are community-sourced.

| Gear node | Awareness Lv |
| --- | --- |
| Linen Gear | 5 |
| Beast Bone Tools / Weapon | ~10 / 12 |
| **Leather Gear** (Armor Forging Table) | **15** |
| Bronze Tool / Weapon / Gear | 20 / 22 / **25** |
| Iron Tools / Weapon / Gear | 35 / 35 / **36** |
| Steel Tools / Weapon / Gear | 50 / 50 / **51** |
| Tool/Weapon/Gear **Enhancement** | 60 |

Crafting proficiency brackets are Bone/Hide **30**, Bronze **60**, Iron **90**, Steel **120**.
Barbarians in a region carry the region's gear tier: Flint in Mangrove and Fang in Pit Hill carry bronze; Table Mountain and Great Prairie carry bronze–iron; late zones (Volcano, Frostleaf, Alpine) carry iron–steel.
The cooked per-region gear tables (`DT_DiWeiAndZhuangBeiLv_<camp>`, 74 assets; `DT_DiWeiWuQi_<camp>`, 75 assets) rise only approximately with tier (roughly Lv1 at T2, Lv2 across T3–T9, Lv3 from the late T8 regions onward), and individual regions can straddle two bands rather than stepping through them; the Frostleaf, Alpine, and Dark Forest regions carry a cold variant.

## Barbarian camps and bosses

Barbarian progression runs Camp → Barrack → Fortress.
Camps are the region folders described above; the three sizes are wild camp (`SGQ_YeWaiYingDi/<Region>_<Tribe>/`), medium camp (`ZhongXingBuLuo_<Region>_<Tribe>/`), and large camp (`DaXingBuLuo_<Region>_<Tribe>/`).
The English markers `Barbarian Camp` (蛮人营地), `Barbarian Barrack` (蛮人营寨), and `Barbarian Fortress` (蛮人城寨) are defined in `BP_MapQingBaoConfig`.
Each camp folder exposes role spawners suffixed `_ShouWei` (guard), `_JingYing` (elite), `_Boss` (boss), plus `_ZaYi`, `_Beauty`, `_ZhiYuan`, `_JiSi`, `_DaJiSi`, `_ZhuaBu`, and `_RuQin`.

Named and region bosses with community-reported levels:

| Boss | Level |
| --- | --- |
| Retroreflector | 20 |
| Rock Breaker | 20 |
| Observer | 25 |
| Blood Drinker | 30 |
| Snake Heart | 40 |
| Hardbone / Bloodletter / Slayer / Frostleaf Guardian / Alpine Poison King | not reported |

The cooked region boss spawners sit at level 20 (Western/Northern Rainforest), 25 (Mangrove), 30 (Pit Hill), 40 (Table Mountain), 45 (Great Prairie, Giant Wood Forest), and 50 (Barren Meadow, Frostleaf Grove, Alpine Land, Dark Forest, Lakeside Forest, Southern Wasteland).
Each region boss character overrides `ChengZhangComponent.DT_GoodNGConfig` with its own `DT_GiftZhengMian_<camp>_Boss` pool, so a captured boss carries region-specific star-III talents.

## How tribe identity is keyed in data

Tribe identity is `EClanType`, assigned per spawner and then expanded by `BP_ManRenRandomConfig.BornBuLuoCiTiaoMap`.
There is no identity `DT_Tribe` table; the shipped `DT_Tribe` under `/Game/AdditionMap01/BluePrints/DataTable/Drop/DT_Tribe` is a DLC drop-bag table.
`BP_ManRenRandomConfig` is a typed CDO with seven properties: `BornBuLuoCiTiaoMap`, `JingLiCiTiaoGaiLv`, `BornJingLiCiTiaoMap`, `BornChuShenCiTiaoList`, `BornCommonChengHaoList`, `BornTiaoJianChengHaoList`, and `BornGetChengHaoRateMap`.

| `EClanType` | Tribe |
| --- | --- |
| `A` | Claw |
| `B` | Flint |
| `C` | Fang |
| `F` | Wolf / Desert Wolf (DLC) |
| `E` | Horn / Savage Horn (DLC) |
| `NONE` | Exile / Outcast |

Class is a separate axis, `EClanZhiYe`; the exact enum mapping is inferred.

| `EClanZhiYe` | Class |
| --- | --- |
| `1` | Warrior |
| `2` | Hunter |
| `3` | Guard |
| `4` | Laborer |
| `5` | Porter |
| `6` | Craftsman |

`BP_Gift_IsZDZhiYe_C` is the combat set `{1, 2, 3}` and `BP_Gift_IsSHZhiYe_C` is the production set `{4, 5, 6}`; the class gate is bytecode in the condition bags, not a pool weight.
Tribe talents are selected at birth from the `BornBuLuoCiTiaoMap` entry for the recruit's `EClanType`, not from a `DT_GiftZhengMian` positive pool.
The spawner pins the class through `ZhiYeQuanZhong`, and the character Blueprint supplies the archetype row through `CustomizeRowName`; see [recruitment-and-spawns.md](recruitment-and-spawns.md) for the archetype machinery.

## Foot-guns

- The region folder → English name mapping is **inferred**, not cooked; no asset stores the public region label, so a mod that keys on the English name must key on the folder token instead.
- The DLC tribes **Wolf** (`F`) and **Horn** (`E`) are real `EClanType` values with their own identity families, not biome variants of Claw/Flint/Fang; community sources that describe them as biome variants are wrong.
- The five-faction list (Claw/Flint/Fang/Plunderers/Outcasts) and the data-layer camp tags (`ZhenYingTag` `YeMan`/`ZhiHui`/`ShenMi`) are different axes; neither is the identity `EClanType`.
- The 12-tier level ranges are community-sourced and top out at 56–65, while the cooked wild-camp spawn bands top out at 46–50; use the spawner bands for real camp levels.
- Outcast has no `QuYu_0` base entry, so an Outcast exclusive on the base map requires appending a `CiTiaoList` entry; it will not appear through the shipped map.
- Tribe identity is expanded from `BornBuLuoCiTiaoMap`, not from the positive pool, so adding a tribe talent to `DT_GiftZhengMian` does not make it tribe-exclusive.
- `BP_ManRenRandomConfig` is a Blueprint CDO; the read is asset-level verified but the cooked-BP write path is not proven on Linux, so tribe-pool edits are unverified.
