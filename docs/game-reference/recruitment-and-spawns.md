# Recruitment and Spawns

How a world region becomes a captured tribesman: the spawner assets that place barbarians, the recruitment random rolls that shape them, the rank→quality→cap chain, the archetype table that seeds per-proficiency caps for some recruits, and the data-only levers a mod maker can turn.
It also records what does **not** vary with region depth today, so a mod is not built on an assumed depth gradient.

Confidence labels used throughout:

| Label | Meaning |
| --- | --- |
| **in-game verified** | Confirmed by a mounted mod/pak read in a running client or server. |
| **asset-verified** | Read directly from cooked `.uasset`/`.uexp` content. |
| **native-verified** | Recovered from the shipping binary's disassembly or string pool. |
| **inferred** | A reasonable reading of indirect evidence; not directly read. |
| **unverified** | Stated by a source but not reproduced. |

Region/asset names and numeric values are exact unless labelled inferred.
Related references: `quality-and-rarity.md`, `talents.md`, `starting-proficiency.md`, `weapon-mastery.md`, `tribes-and-regions.md`.

## How a region becomes a recruit

A region is a folder of `BP_SGQ_*` spawner Blueprints.
Each spawner is a Blueprint subclass of `BP_SGQ_BuLuo_Base` and carries a role suffix in its name, most importantly `_ShouWei` (guard), `_JingYing` (elite), and `_Boss`.
Only the guard role is recruitable; elites spawn `BP_SuiJi_BuLuo_UnTamed_JingYing_C` and bosses use boss character classes plus per-region boss gift pools, and neither is capturable.

The shipped recruit chain is:

```text
region folder -> BP_SGQ_* spawner CDO
  -> SCGInfoList[].SGBList[] entry (GuaiWuClass, QuanZhongBiLi, SCGZuiXiaoDengJi/SCGZuiDaDengJi)
  -> random barbarian Blueprint (BP_SuiJi_BuLuo_C / _Nv_C, or a BP_*Cus_Gift_* archetype)
  -> native HCharacterRen roll (level, rank, quality, profession, cap)
  -> BP_ManRenRandomConfig (tribe, origin, title, experience identity pools)
  -> talent and proficiency DataTables
```

The recruit's generated attributes are decided by these spawner-CDO fields:

| Spawner CDO field | Decides |
| --- | --- |
| `SCGInfoList[].SGBList[].SCGZuiXiaoDengJi` / `SCGZuiDaDengJi` | Spawn level band, and therefore the recruit's starting current-proficiency band and invested level-ups. |
| `SCGInfoList[].SGBList[].GuaiWuClass` | Which character Blueprint spawns, and therefore whether an archetype is applied. |
| `SCGInfoList[].SGBList[].QuanZhongBiLi` | Male/female and normal/elite/boss mix. |
| `SCGInfoList[].SGBList[].SCGShangXianCount` | Concurrent spawn cap; **not** a recruited-count counter. |
| `DiWeiQuanZhong` | Clan-rank distribution `LOW`/`MIDDLE`/`HIGH`. |
| `DiWeiAndPinZhi` | Rank → recruit-quality (0–5) distribution, else inherited from `BP_SGQ_BuLuo_Base`. |
| `ZhiYeQuanZhong` | Combat-profession mix over `ZHIYE_TYPE_WUWEI`/`SHOULIE`/`SHOUHU`. |
| `ClanType` | Tribe `A`/`B`/`C` = Claw/Flint/Fang, plus DLC `F`/`E` and `NONE`. |
| `ClanArea`, `ZhenYingTag` | Location id and faction (`YeMan`/`ZhiHui`/`ShenMi`) used by talent condition bags. |
| `DiWeiAndZhuangBeiDataTable` / `DiWeiAndWuQiDataTable` | Starting gear and weapon per rank (points at per-region DataTables). |
| `PinZhiRateAndZhuangBeiQz` / `PinZhiAndWuQiQz` | Quality → equipment/weapon count weights. |

## Region → level → quality → cap chain

The chain that turns depth into a recruit runs through level and rank, not through quality or caps:

1. **Spawn level band** (`SCGZuiXiaoDengJi`/`SCGZuiDaDengJi`) sets the recruit's `JueSeLvl` at generation.
2. **Rank** (`DiWeiQuanZhong`) picks `LOW`/`MIDDLE`/`HIGH`.
3. **Quality** (`DiWeiAndPinZhi`, with the global `ManRenPinZhiRatio` multiplier) is fully determined by rank: `LOW → 0/1`, `MIDDLE → 2/3`, `HIGH → 4/5`.
4. **Starting current proficiency** is set by level and rank, plus a class bonus: `BP_ProficiencyConfig.JueSeLvlProfLvlList` (0–20 → 1–5, 21–40 → 5–15, 41–80 → 15–25), `BP_ProficiencyConfig.ClanDiWeiProfInitLvlMap` (`LOW` 1–5, `MIDDLE` 5–15, `HIGH` 15–25), and `BP_ProficiencyConfig.ZhiYeProfLvlMap` → `SLD_ChuShiLv_*` (+15–20 on the class primary set; Hunter whip `Bian` +15–25).
5. **Proficiency cap** is baked at generation from a native base roll plus the class table, clamped, and optionally overridden by an archetype row.

The cap formula, its shipped constants, the clamp bounds, and the native selector branch are documented in `proficiencies-and-caps.md`.
The cap is fixed at recruitment and is not re-rolled on level-up.
See `starting-proficiency.md` for the starting-value selector and `quality-and-rarity.md` for how quality feeds the other systems.

### What actually varies with depth today

Only two things move monotonically with region depth (asset-verified):

1. **Spawn level band**: `11-20` at the shallowest regions up to `46-50` at the deepest.
2. **Gear tier**, weakly: the per-region `DT_DiWeiAndZhuangBeiLv_*` tables move roughly Lv1 → Lv2 → Lv3, so a deeper recruit can arrive in a higher material tier.

Everything else is flat:

- **Quality distribution** is region-independent; the rank→quality mapping is one base-class default.
- **Rank distribution** for guards is `15/35/50` in every region; elites and bosses are always `HIGH`.
- **Class composition** is region-independent and combat-only: `ZhiYeQuanZhong` is `100/100/100` over Warrior/Hunter/Guard; only bosses specialize.
- **Caps** are region-independent and level-independent; every recruit uses the same base-plus-class roll unless an archetype row overrides it.

Named camps top out at spawn level `50`; the `51-65` tiers in community region tables are reached through elite and dungeon content, not named-camp spawners.
The player's current motivation to go deep is therefore gear and enemy level, not recruit ceiling.

## Recruitment RNG sources

Every random attribute and the asset that decides it (asset-verified unless noted):

| Random attribute | Asset / field | Notes |
| --- | --- | --- |
| Spawn level | `BP_SGQ_*` CDO `SCGInfoList.SGBList.SCGZuiXiaoDengJi` / `SCGZuiDaDengJi` | Random in the printed band; band is per spawn group. |
| Which body spawns | `SCGInfoList.SGBList.GuaiWuClass`, `QuanZhongBiLi` | `BP_SuiJi_BuLuo_C` / `_Nv_C`, elite/boss variants. |
| Spawn concurrency | `SCGInfoList.SGBList.SCGShangXianCount` | Concurrent cap, not a recruit counter. |
| Tribe (`EClanType`) | `BP_SGQ_*` CDO `ClanType`; then `BP_ManRenRandomConfig.BornBuLuoCiTiaoMap` by region condition | Per-spawner tribe; biome-resist variant selected by `BP_Gift_QuYu_3_HY/4_HS/5_XS`. |
| Rank (`DiWei`) | `BP_SGQ_*` CDO `DiWeiQuanZhong` | LOW/MIDDLE/HIGH weights; guards `15/35/50`, elite and boss `HIGH=100`. |
| Quality (`PinZhi` 0–5) | `BP_SGQ_*` CDO `DiWeiAndPinZhi`; global multiplier `ManRenPinZhiRatio` in `GameXishu.json` | Rank fully determines the band: `LOW→0/1`, `MIDDLE→2/3`, `HIGH→4/5`; elites/most bosses override to `HIGH→5`. |
| Combat profession (`ZHIYE_TYPE_*`) | `BP_SGQ_*` CDO `ZhiYeQuanZhong` | Only `WUWEI`/`SHOULIE`/`SHOUHU` keys ship; production classes are not in this map. |
| Archetype (per-proficiency cap seed) | Character `CustomizeRowName` at `character+0x3378` → `DT_CustomizeNPC` row | Only present on `BP_*Cus_Gift_*` recruit and intrusion Blueprints; wild/camp barbarians have none. |
| Class cap-eligible skill set | `BP_ProficiencyConfig.ZhiYeProfMaxLvlMap` → `DT_Prof_ZhiYe_*` | Determines which skills can exceed 100. |
| Starting current proficiency | `BP_ProficiencyConfig.JueSeLvlProfLvlList`, `ClanDiWeiProfInitLvlMap`, `ZhiYeProfLvlMap` → `SLD_ChuShiLv_*`; global `CurProfInitRatio` | Bands as listed above. |
| Proficiency cap | Native base roll `rand(75..100)` + `DT_Prof_ZhiYe_*.MinAdd/MaxAdd` `rand(15..25)`, clamped `50/150` | Fixed at recruitment; archetype row can replace `ProfMaxLvl_Init`. |
| Initial mastery abilities | `BP_SGQ_*` / `BP_BuLuo_Base` `WuQiAndJiNeng`; fixed start `DT_GuDingZhuanJing` | See `weapon-mastery.md`. |
| Positive talents | `BP_ManRenRandomConfig` (origin/tribe/title/experience pools) + base `DT_GiftZhengMian` / `_Custom` + per-region boss pools `DT_GiftZhengMian_<camp>_Boss` | See `talents.md`. |
| Number of positive talents | `BP_ZiYuanGuanLiQi.GoodNGMaxNum = 6`; cadence `DT_PinZhiGoodNGAddPr` | `+1` advantage every 10 levels, `Pr = 1.0`. |
| Talent star tier | `DT_PinZhiGoodNGStarWeight` keyed by quality | q0/1 `{1:80,2:10,3:10}`, q2/3 `{1:10,2:80,3:10}`, q4/5 `{1:0,2:15,3:85}`. |
| Negative talents (defects) | `DT_GiftFuMiann`; removal `DT_PinZhiBadNGRemovePr` | 0–5 defects at recruit; removal per 5 levels `0.30/0.35/0.40` by quality. |
| Titles | `BP_ManRenRandomConfig.BornCommonChengHaoList` / `BornTiaoJianChengHaoList`; chance `BornGetChengHaoRateMap` | Quality 0/1→10, 2/3→15, 4/5→35 per-cent. |
| Starting gear and weapon | `DiWeiAndZhuangBeiDataTable` / `DiWeiAndWuQiDataTable`; quality→equipment `PinZhiRateAndZhuangBeiQz`, `PinZhiAndWuQiQz` | Per-region `DT_DiWeiAndZhuangBeiLv_*` (74 tables) and `DT_DiWeiWuQi_*` (75). |
| Appearance | `BP_SGQ_*` / `BP_BuLuo_Base` `ManRenTeZhengMap`, `LianXingConfig`, `CaiZhiSuJi`, `FaXingMap` | Cosmetic; `BP_PinchFaceConfig` / `DT_FaXing`. |
| Recognition→recruit threshold | `HGameSingleton.RenKeDuZhaoMuConf` / `RenKeDuArray`, per-NPC `HCharacterRen.RenKeDu` | `RenKeDuConf` has `MinVal`/`MaxVal`; the decoded thresholds are unverified. |

## Rank, quality, and ratio config keys

Rank and quality are the two recruitment filters that ship. `DiWeiQuanZhong` weights the three ranks, and `DiWeiAndPinZhi` maps each rank to a quality band:

| Rank | Guard rank weight | Elites / bosses | Quality band |
| --- | --- | --- | --- |
| `LOW` | 50 | — | 0 / 1 |
| `MIDDLE` | 35 | — | 2 / 3 |
| `HIGH` | 15 | 100 | 4 / 5 |

The rank weights are `HIGH:MIDDLE:LOW = 15:35:50` for guards in every region, and `HIGH = 100` for elites and bosses everywhere.
Elites and most bosses override `DiWeiAndPinZhi` so `HIGH → 5`.

`GameXishu.json` carries the global multipliers and limits that touch recruitment.

| Key | Meaning | Shipped value |
| --- | --- | --- |
| `ManRenPinZhiRatio` | Global recruit-quality multiplier; applies everywhere, so it is blunt rather than depth-targeted. | `1.0` default; hard presets `1.5` / `2.0` (config range 0–5). |
| `CurProfInitRatio` | Lerp at recruitment between initial current proficiency and cap (`value + (cap − value) * ratio`), read only when `CharacterType != 0`. | `0` in base modes (range 0–1). |
| `MaRenBeiDongYiJiShuXingRatio` | Passive first-tier attribute multiplier for recruits. | global, range ≥1. |
| `MaRenZhuDongYiJiShuXingRatio` | Active first-tier attribute multiplier for recruits. | global, range ≥1. |
| `MaRenErJiShuXingRatio` | Second-tier attribute multiplier for recruits. | global, range ≥1. |
| `GeRenMaxZhaoMuCount` / `_Two` / `_Three` | Personal roster caps at Connection Enhancement 1/2/3. | `6` / `10` / `15` (ranges 1–10, 1–20, 1–1000). |
| `GongHuiMaxZhaoMuCount` | Guild roster cap. | `50` (base preset group 1 = `40`; `BP_GongHuiGuangLiQi.MaxZhaoMuCount` CDO `40`). |
| `ManRenChuZhanCount` | Deployed tribesmen cap. | `3` (native `ConfigMaxChuZhanCount`). |

`PlayerLevelConfig.ZhaoMuMaxCount` in `AwarenessLevel_*` is a flat `10` at every character level 1–60 (60 rows).
There is no per-location recruit counter anywhere in the shipping content: the only `ZhaoMu`-named properties are the roster caps, the per-NPC `bCanZhaoMu` flags, the recognition config, the mask `TeShuZiType_AddZhaoMuNum` value, and UI/gameplay-effect names.
`SCGShangXianCount` is a concurrency limit, not a recruited tally.

## Archetypes

An **archetype** is a row in a `CustomizeProficiencyAndGA` DataTable, keyed by the recruit's `CustomizeRowName`.
The row bundles four things together: a per-proficiency cap seed, a weapon-mastery list, an origin title class, and an origin natural-gift map.

| Asset | Path | Rows |
| --- | --- | --- |
| Base archetype table | `/Game/Blueprints/DataTable/CustomProfAndGA/DT_CustomizeNPC` | 56 |
| Egypt DLC archetype table | `/Game/AdditionMap01/BluePrints/DataTable/DT_CustomizeNPC_Egypt` | 96 |

Row struct fields (asset-verified):

| Field | Type | Meaning |
| --- | --- | --- |
| `CustomizeProfMaxLv` | `TMap<EProficiency,int32>` | Per-proficiency cap seed; when the map contains the current proficiency, the initializer sets `ProfMaxLvl_Init = rowValue − existingAdd`, bypassing the base roll and class bonus. |
| `CustomizeZhuanJing` | `TArray<{WeaponType:EWuQiLeiXing, ProfLv:int32, GANo:int32}>` | Weapon-mastery grants. |
| `CustomizeChengHaoClass` | `ObjectProperty` (`BP_CH_*_C`) | Origin title class. |
| `CustomizeNGMap` | `TMap<int32,NaturalGift>` | Origin natural-gift slots; keys are slot indices (`10`, `20`, `30`, …), and the `ClanDemand`/`ZhiYeDemand` sub-maps are empty in every base row. |

`CustomizeRowName` is not a table row field; it is the `NameProperty` stored on the character Blueprint's class default object and read at `character+0x3378`.
The native seed branch that consumes `CustomizeProfMaxLv` is documented in `proficiencies-and-caps.md`.

The base table has 56 rows: 43 `Intrusion_*` rows whose cap entries are a flat `125`, and 13 `Newbee_Gift_*` recruit rows whose cap entries vary from `90` to `119`.
Because the recruit rows carry varied sub-125 values, an archetype-bearing recruit can show caps outside the base-plus-class band.
The Egypt table has 96 rows: 29 `Newbee_Gift_Egypt_*` recruit rows and 67 `Intrusion_Egypt_*` rows, none of which exist in the base table; it also adds a whip (`Bian`) line.

### The full 56-row base table

`Cap map` is `CustomizeProfMaxLv`; `Mastery` is `CustomizeZhuanJing` as `WEAPON:level/GA`; `NG gifts` is the `NGDetailList` id set from `CustomizeNGMap`; `Title` is `CustomizeChengHaoClass` (asset-verified).

| Row | Cap map | Title | Mastery | NG gifts |
| --- | --- | --- | --- | --- |
| `Intrusion_Spear` | Mao=125 | BP_CH_PuTong_LZTF_C | MAO:120/206 MAO:90/297 | 130023,160643 |
| `Intrusion_Blade` | Dao=125 | BP_CH_DXZ_C | DAO:120/106 DAO:90/104 | 130013,150053 |
| `Intrusion_DualBlade` | ShuangDao=125 | BP_CH_PuTong_SZZ_C | SHUANGDAO:120/707 SHUANGDAO:90/798 | 130073,160053 |
| `Intrusion_Fist` | QuanTao=125 | BP_CH_YXZ_C | QUANTAO:120/606 QUANTAO:90/605 | 130053,150053 |
| `Intrusion_Hammer` | Chui=125 | BP_CH_PuTong_BFZ_C | CHUI:120/406 CHUI:90/497 | 130043,160643 |
| `Intrusion_Bow` | Gong=125 | BP_CH_JSDS_C | GONG:120/303 GONG:90/398 | 130033,150063 |
| `Intrusion_GreatSword` | DaJian=125 | BP_CH_PuTong_XYZ_C | JIAN:120/806 JIAN:90/898 | 130063,160123 |
| `Intrusion_Shield` | DunPai=125 | BP_CH_PuTong_BFZ_C | DUN:120/508 DUN:90/597 | 160293,160513 |
| `Intrusion_ShieldSpear` | DunPai=125 Mao=125 | — | DUN:120/508 MAO:120/206 DUN:90/597 MAO:90/297 | 160293,130023,160303 |
| `Intrusion_ShieldBlade` | DunPai=125 Dao=125 | — | DUN:120/508 DAO:120/106 DUN:90/507 DAO:90/198 | 160293,130013,160513 |
| `Intrusion_ShieldBow` | DunPai=125 Gong=125 | BP_CH_JSDS_C | DUN:120/508 GONG:120/303 GONG:90/397 | 160293,130033,150063 |
| `Intrusion_ShieldGreatSword` | DunPai=125 DaJian=125 | — | DUN:120/508 JIAN:120/806 JIAN:90/898 | 160493,130063,100053 |
| `Intrusion_ShieldSpearBlade` | DunPai=125 Mao=125 Dao=125 | BP_CH_PuTong_BFZ_C | DUN:120/508 MAO:120/206 DAO:120/106 DUN:90/597 MAO:90/297 DAO:90/103 | 100103,100053,100043,150053,160333,160293 |
| `Intrusion_ShieldSpearBladeBow` | DunPai=125 Gong=125 Mao=125 Dao=125 | BP_CH_WQDS_C | DUN:120/508 GONG:120/303 MAO:120/206 DAO:120/106 DUN:90/597 MAO:90/297 DAO:90/104 GONG:90/398 | 160293,130033,160513,100053,150063,160573 |
| `Intrusion_DualBladeFist` | ShuangDao=125 QuanTao=125 | — | SHUANGDAO:120/707 QUANTAO:120/606 QUANTAO:90/605 SHUANGDAO:90/798 | 130073,130053,150043 |
| `Intrusion_DualBladHammer` | ShuangDao=125 Chui=125 | — | SHUANGDAO:120/707 CHUI:120/406 CHUI:90/497 | 130073,130043,120013 |
| `Intrusion_DualBladeBow` | ShuangDao=125 Gong=125 | — | SHUANGDAO:120/707 GONG:120/303 SHUANGDAO:90/798 GONG:90/397 | 130073,130033,150063 |
| `Intrusion_DualBladeGreatSword` | ShuangDao=125 DaJian=125 | — | SHUANGDAO:120/707 JIAN:120/806 JIAN:90/898 SHUANGDAO:90/798 | 130073,130063,160463 |
| `Intrusion_DualBladeSpear` | ShuangDao=125 Dao=125 | — | SHUANGDAO:120/707 MAO:120/206 MAO:90/297 SHUANGDAO:90/798 | 130073,130023,160663 |
| `Intrusion_DualBladeBlade` | ShuangDao=125 Dao=125 | — | SHUANGDAO:120/707 DAO:120/106 DAO:90/198 SHUANGDAO:90/798 | 130073,130013,100033 |
| `Intrusion_DualBladeFistGreatSword` | ShuangDao=125 QuanTao=125 DaJian=125 | BP_CH_WQDS_C | SHUANGDAO:120/707 QUANTAO:120/606 JIAN:120/806 JIAN:90/898 QUANTAO:90/602 SHUANGDAO:90/798 | 130073,130053,130063,150043 |
| `Intrusion_DualBladeFistHammer` | ShuangDao=125 QuanTao=125 Chui=125 | BP_CH_WQDS_C | SHUANGDAO:120/707 QUANTAO:120/606 QUANTAO:90/605 CHUI:90/497 SHUANGDAO:90/798 CHUI:120/406 | 130073,130053,130043,160673 |
| `Intrusion_DualBladeHammerGreatSword` | ShuangDao=125 DaJian=125 Chui=125 | BP_CH_WQDS_C | SHUANGDAO:120/707 CHUI:120/406 JIAN:120/806 JIAN:90/898 CHUI:90/497 SHUANGDAO:90/798 | 130073,130063,130043,100033,160333 |
| `Intrusion_DualBladeSpearBladeBow` | ShuangDao=125 Mao=125 Dao=125 Gong=125 | BP_CH_WQDS_C | SHUANGDAO:120/707 SHUANGDAO:90/798 MAO:120/206 MAO:90/297 DAO:120/106 DAO:90/198 GONG:120/303 GONG:90/398 | 100033,160643,130023,130013,130033,160673 |
| `Intrusion_GreatSwordSpear` | DaJian=125 Mao=125 | — | JIAN:120/806 JIAN:90/898 MAO:120/206 MAO:90/297 | 130063,130023,150053 |
| `Intrusion_GreatSwordBlade` | DaJian=125 Dao=125 | — | JIAN:120/806 DAO:120/106 JIAN:90/898 DAO:90/103 | 130063,130013,160333 |
| `Intrusion_GreatSwordHammer` | DaJian=125 Chui=125 | — | JIAN:120/806 CHUI:120/406 JIAN:90/898 CHUI:90/497 | 130063,130043,160343 |
| `Intrusion_GreatSwordFist` | DaJian=125 QuanTao=125 | — | JIAN:120/806 QUANTAO:120/606 JIAN:90/898 QUANTAO:90/602 | 130063,130053,160543 |
| `Intrusion_GreatSwordBow` | DaJian=125 Gong=125 | — | JIAN:120/806 GONG:120/303 JIAN:90/898 GONG:90/398 | 130063,130033,160263 |
| `Intrusion_GreatSwordHammerDualBladeFist` | DaJian=125 Chui=125 ShuangDao=125 QuanTao=125 | BP_CH_WQDS_C | JIAN:120/806 CHUI:120/406 SHUANGDAO:120/707 QUANTAO:120/606 JIAN:90/898 QUANTAO:90/605 CHUI:90/497 SHUANGDAO:90/798 | 130063,130043,130073,130053,100033,160123 |
| `Intrusion_SpearBladeBow` | Mao=125 Dao=125 Gong=125 | — | MAO:120/206 MAO:90/297 DAO:120/106 DAO:90/104 GONG:120/303 GONG:90/398 | 100033,160643,130023,130013,130033 |
| `Intrusion_LoggerMiner` | CaiKuang=125 FaMu=125 | BP_CH_TSKL_C | — | 110013 |
| `Intrusion_FarmerCollector` | CaiShou=125 ZhongZhi=125 | BP_CH_TSJN_C | — | 120052 |
| `Intrusion_WeaponArmor` | WuQi=125 JiaZhou=125 | BP_CH_JZDS_C | — | 150072 |
| `Intrusion_CookerCrafter` | PengRen=125 QiJu=125 | BP_CH_SGDS_C | — | 120052 |
| `Intrusion_CookerCrafterAlchemist` | PengRen=125 QiJu=125 LianJin=125 | BP_CH_SGDS_C | — | 120053 |
| `Intrusion_CobblerWeaver` | FangZhi=125 RouPi=125 | BP_CH_XHNS_C | — | 120052 |
| `Intrusion_CarpenterSmelter` | PaoMu=125 RongLian=125 | BP_CH_CHNS_C | — | 120052 |
| `Intrusion_CarpenterSmelterCobbler` | PaoMu=125 RongLian=125 ZhiTao=125 | BP_CH_CHNS_C | — | 120053 |
| `Intrusion_PotterWeaver` | FangZhi=125 ZhiTao=125 | BP_CH_XHNS_C | — | 120052 |
| `Intrusion_WeaponAlchemist` | WuQi=125 LianJin=125 | BP_CH_JZDS_C | — | 150073 |
| `Intrusion_WeaponArmorAlchemist` | WuQi=125 LianJin=125 JiaZhou=125 | BP_CH_JZDS_C | — | 150073 |
| `Intrusion_PotterWeaverCobbler` | FangZhi=125 ZhiTao=125 RouPi=125 | BP_CH_XHNS_C | — | 120053 |
| `Newbee_Gift_CookerCrafter` | PengRen=101 QiJu=109 | BP_CH_SGDS_C | — | — |
| `Newbee_Gift_CookerCrafterAlchemist` | PengRen=94 QiJu=103 LianJin=114 | BP_CH_SGDS_C | — | — |
| `Newbee_Gift_WeaponAlchemist` | WuQi=119 LianJin=91 | BP_CH_JZDS_C | — | — |
| `Newbee_Gift_WeaponArmor` | WuQi=99 JiaZhou=116 | BP_CH_JZDS_C | — | — |
| `Newbee_Gift_WeaponArmorAlchemist` | WuQi=93 LianJin=102 JiaZhou=98 | BP_CH_JZDS_C | — | — |
| `Newbee_Gift_Guard_ShieldSpearBladeBow` | DunPai=115 Gong=119 Mao=92 Dao=97 | BP_CH_WQDS_C | DUN:90/597 MAO:90/297 DAO:90/198 GONG:90/398 | 150063 |
| `Newbee_Gift_Guard_ShieldSpearBlade` | DunPai=119 Mao=115 Dao=104 | BP_CH_WQDS_C | DUN:90/597 MAO:90/297 DAO:90/103 | 150053 |
| `Newbee_Gift_Guard_SpearBladeBow` | Mao=97 Dao=119 Gong=108 | BP_CH_WQDS_C | MAO:90/297 DAO:90/104 GONG:90/397 | 160643 |
| `Newbee_Gift_Hunter_DualBladeSpearBladeBow` | ShuangDao=90 Mao=110 Dao=102 Gong=117 | BP_CH_WQDS_C | SHUANGDAO:90/798 MAO:90/297 DAO:90/198 GONG:90/398 | 130023 |
| `Newbee_Gift_Hunter_DualBladeFistBow` | ShuangDao=106 QuanTao=112 Gong=117 | BP_CH_WQDS_C | QUANTAO:90/605 SHUANGDAO:90/798 GONG:90/398 | 130073 |
| `Newbee_Gift_Warrior_GreatSwordHammerDualBladeFist` | DaJian=118 Chui=112 ShuangDao=104 QuanTao=91 | BP_CH_WQDS_C | JIAN:90/898 QUANTAO:90/602 CHUI:90/497 SHUANGDAO:90/798 | 130063 |
| `Newbee_Gift_Warrior_DualBladeFistGreatSword` | ShuangDao=119 QuanTao=116 DaJian=110 | BP_CH_WQDS_C | JIAN:90/898 QUANTAO:90/602 SHUANGDAO:90/798 | 130073 |
| `Newbee_Gift_Warrior_FistGreatSwordHammer` | DaJian=99 Chui=118 QuanTao=117 | BP_CH_WQDS_C | JIAN:90/898 CHUI:90/497 QUANTAO:90/605 | 160633 |

The `Intrusion_*` mastery levels are `120` and `90`, and every listed cap value is `125`.
Every `Newbee_Gift_*` mastery is `90`; the five crafting `Newbee_Gift_*` rows carry no mastery and no natural gift, and the eight weapon rows carry mastery and one natural gift each.
The title class is coarse: the crafting rows use `BP_CH_SGDS_C` (cooker) or `BP_CH_JZDS_C` (weapon/armor), and all eight weapon rows use `BP_CH_WQDS_C`.

### Archetype diversity

The rows were parsed from both tables and the four axes counted independently (asset-verified).

| Metric | Base `DT_CustomizeNPC` | Recruit `Newbee_Gift_*` | Invasion `Intrusion_*` | Egypt table | Egypt recruits |
| --- | --- | --- | --- | --- | --- |
| Rows | 56 | 13 | 43 | 96 | 29 |
| Distinct cap maps | 55 | 13 | 42 | 95 | 29 |
| Distinct NG bundles | 45 | 8 | 37 | 82 | 26 |
| Distinct mastery bundles | 40 | 9 | 32 | 79 | 25 |
| Distinct title classes | 15 | 3 | 15 | 15 | 3 |

The recruit family gives **13 distinct cap profiles** on 13 rows, so every recruit archetype has a unique cap signature; caps range from `90` to `119`.
The invasion family has 42 distinct cap maps, but every listed value is `125`, so its variation is only in which skills the flat `125` applies to.
Caps and talents are separate fields (`CustomizeProfMaxLv` and `CustomizeNGMap`) but correlated in the shipped recruit bundles: the five crafting rows have a cap map and an empty NG map, and the eight weapon rows have a cap map and exactly one NG slot.
Across the 13 recruit rows there are 8 distinct NG bundles: the five crafting rows share the empty bundle, `Hunter_DualBladeFistBow` and `Warrior_DualBladeFistGreatSword` share `130073`, and the other six weapon rows each have a unique id.
Mastery is likewise correlated: only the eight weapon rows carry it, one distinct bundle each.
The title classes add little separation: 3 classes across 13 rows.

The Egypt recruit family is authored independently of the base family.
For example `Newbee_Gift_Egypt_WeaponAlchemist` is `WuQi=116 LianJin=93`, versus the base `Newbee_Gift_WeaponAlchemist` `WuQi=119 LianJin=91`.

### Resolution from character to table

The lookup is native-verified:

```text
character+0x3378                          # CustomizeRowName (FName row key)
  -> UHChengZhangComponent::InitProficiency (0x41b7730)
  -> resolve(), then [resolve()+0x1b0]     # property CustomizeProfAndGA -> UDataTable
  -> UDataTable::FindRow(table, rowName, ...) (0x41eeba0)
  -> DT_CustomizeNPC (base map) / DT_CustomizeNPC_Egypt (DLC map)
```

On the base map the `[resolve()+0x1b0]` pointer is the `BP_RuQinGuanLiQi` CDO reference to `DT_CustomizeNPC`.
The Egypt managers `BP_Intrusion_Manager_Egypt` and `BP_IntrusionManager_MangerMode_Egypt` point at `DT_CustomizeNPC_Egypt`, so the active row set is chosen by the map manager, not by the individual NPC.
When the row, the table, or the key is missing, the code falls through to the base-plus-class roll.

### Which recruits use archetypes

Four families set `CustomizeRowName` (asset-verified; a tree-wide byte scan finds exactly 298 such assets):

| Family | Path | Assets | Rows |
| --- | --- | --- | --- |
| Base recruit archetypes | `/Game/Blueprints/ShuaGuaiQi/SGQ_Custom/` | 26 (`BP_*Cus_Gift_*`, male/female pairs) | `Newbee_Gift_*` |
| Base invasion archetypes | `/Game/Blueprints/ShuaGuaiQi/SGQ_BuLuo/CharacterBluePrint/IntrusionCustomize/` | 86 | `Intrusion_*` |
| Egypt recruit archetypes | `/Game/AdditionMap01/BluePrints/NPC/Human/Exiles/GiftCustom/` | 58 | `Newbee_Gift_Egypt_*` |
| Egypt invasion archetypes | `/Game/AdditionMap01/BluePrints/NPC/Intrusion/CustomizeNPC/` | 128 | `Intrusion_Egypt_*` |

- **Recruitable Outcasts** use archetypes. The base family is `ZhenYing.ManRen.LiuFang`, displayed as `Outcast` (`流放者`).
- **Hostile invasion forces** use archetypes. The 43 base `Intrusion_*` rows are spawned by the 18 classes `BP_SGQ_Intrusion_{SM,YM,ZH}_Cus_{Artisan,Guard,Hunter,Labor,Warrior,Worker}` under the invasion manager `BP_RuQinGuanLiQi` (`SM` = ShenMi, `YM` = YeMan, `ZH` = ZhiHui); all three tribes draw from the same rows.
- **Camp, barrack, and fortress barbarians do not use archetypes.** Every domestic spawner family spawns `BP_SuiJi_BuLuo` / `BP_SuiJi_BuLuo_Nv`, whose class default object sets no `CustomizeRowName`; they take the base-plus-class cap roll and the global identity/talent pools. There is no barbarian archetype table under another name — `DT_CustomizeNPC` and `DT_CustomizeNPC_Egypt` are the only assets carrying the schema.

### How an archetype is selected

The four base recruit spawner classes `BP_SGQ_NewbeeGift_Exile_Cus_{Artisan,Guard,Hunter,Warrior}` are instantiated by nine `BP_HShuaGuaiQiRandNPC_C` spawn-point actors in `Maps/Level01/Level01_Hub/Level01_GamePlay.umap` (actor names `SGQ_XinShou_LFZ_{Guard,Hunter,Warrior}` and `SGQ_YiJi_T1_LFZ_{Artisan1,Artisan2,Artisan3,Guard,Hunter,Warrior}`).
Their placements span `X -327368..343827` and `Y 5567..202367`, against a world extent of roughly `X [-373000, 378000]`, `Y [-369000, 394000]`, so they are not confined to one starter cluster.
The Egypt map `DLC_Level01_GamePlay.umap` assigns the four `BP_Egypt_SGQ_NewbeeGift_Exiles_Cus_*` classes to ten placed `NPC_{Camp,Ruins}_NO01_Exiles_*` actors.
No other cooked map references the base outcast archetype spawners.

Each spawner pins one profession through `ZhiYeQuanZhong` and offers a small set of archetype Blueprints; the `SGBList` weights are equal (`10` each), and each row appears twice (male and female), so sex and archetype are drawn with uniform weight.
The chosen Blueprint's `CustomizeRowName` then selects the row.

| Spawner family | `ZhiYeQuanZhong` profession | Archetype rows offered |
| --- | --- | --- |
| `..._Cus_Artisan` | `ZONGJIANG` (Craftsman) only | 5 crafting rows |
| `..._Cus_Guard` | `SHOUHU` (Guard) only | 3 shield/spear/blade/bow rows |
| `..._Cus_Hunter` | `SHOULIE` (Hunter) only | 3 bow/dual-blade/guard rows |
| `..._Cus_Warrior` | `WUWEI` (Warrior) only | 3 greatsword/hammer/fist rows |
| `..._Cus_Labor` (intrusion) | `KULI` + `ZAGONG` + `ZONGJIANG` | 7–10 crafting/gathering rows |
| `..._Cus_Worker` (intrusion) | `ZAGONG` only | 5 crafting rows |

`SHOULIE` is Hunter, `SHOUHU` Guard, `WUWEI` Warrior, and `ZONGJIANG` Craftsman; the English labels attached to `KULI` and `ZAGONG` are reported inconsistently across sources, so the enum keys and their class tables are the authoritative identifiers.
The mapping is not perfectly clean: the Hunter recruit spawner also offers the `Newbee_Gift_Guard_SpearBladeBow` archetype, so a row can be shared across class spawners.
No recruit spawner exists for the `KULI` or `ZAGONG` classes in the Exile family; those two appear only in the intrusion `Labor`/`Worker` spawners.

Consequently the archetype is a **role variant within a profession**, not a class selector: `DT_CustomizeNPC` has no profession field, and quality neither gates nor is gated by archetype.
Selecting an archetype selects the whole bundle (caps + mastery + title + origin gift) together.

## Spawners

Every camp is a Blueprint subclass of `BP_SGQ_BuLuo_Base`; 247 `BP_SGQ_*` assets live under `/Game/Blueprints/ShuaGuaiQi/SGQ_BuLuo` (asset-verified).
A separate asset census of the same directory reports 554 assets; the two figures count different sets and were not reconciled, so treat 247 as the `BP_SGQ_*`-named spawner count.
Their class default objects parse as typed `NormalExport` objects, so the recruit-shaping fields are directly readable and editable in principle.

| Field | Meaning |
| --- | --- |
| `SCGInfoList` | List of spawn groups; each holds `SGBList` entries. |
| `SGBList[].SCGZuiXiaoDengJi` / `SCGZuiDaDengJi` | Minimum / maximum spawn level. |
| `SGBList[].GuaiWuClass` | Spawned character Blueprint. |
| `SGBList[].QuanZhongBiLi` | Selection weight. |
| `SGBList[].SCGShangXianCount` | Concurrent cap. |
| `ZhiYeQuanZhong` | Combat-profession weights over `WUWEI`/`SHOULIE`/`SHOUHU`, each with `QuanZhong` and `ShangXian`. |
| `DiWeiQuanZhong` | Clan-rank weights `LOW`/`MIDDLE`/`HIGH`. |
| `DiWeiAndPinZhi` | Rank → recruit-quality rates 0–5. |
| `ClanType`, `ClanSize`, `ClanArea`, `ZhenYingTag` | Tribe, camp size, location id, faction. |
| `DiWeiAndZhuangBeiDataTable`, `DiWeiAndWuQiDataTable` | Rank → gear / weapon tables. |
| `PinZhiRateAndZhuangBeiQz`, `PinZhiAndWuQiQz` | Quality → equipment / weapon weights. |
| `ManRenTeZhengMap`, `TiXingGuGeDataTable`, `FaXingMap`, `LianXingConfig`, `CaiZhiSuiJi`, `WenShen`, `TouGuScale`, `GuaJian` | Appearance defaults. |

`BP_SGQ_BuLuo_Base` itself defaults to level `10-20` with a 100% `MIDDLE` rank weight.

### Spawn points and public spawn data

Public spawn data is a placement dump, not a spawner configuration: `spawns.json` holds 12,555 raw actor placements with fields `map`, `map_path`, `pos_x`, `pos_y`, `pos_z`, `rotation_yaw`, `spawner_class`, `scg_class`, and `actor_name`.
It has **no** enemy level, profession, or tribe field.
The `scg_class` path encodes region and type (for example a `T10` tier token) but not level, and the derived `spawn_locations.json` carries a `level` field that is always an empty string.

The 12 `spawner_class` values and their placement counts:

| `spawner_class` | Placements | Role |
| --- | --- | --- |
| `HShuaGuaiQiBase` | 6650 | Base creature spawner. |
| `BP_HShuaGuaiQiRandNPC_C` | 5100 | Random-NPC spawner (recruitable barbarians). |
| `HShuaGuaiQiDiXiaCheng` | 356 | Underground-city spawner. |
| `HShuaGuaiQiVolumeChuFaQi` | 138 | Volume trigger. |
| `BP_HShuaGuaiQi_ShouLong_C` | 137 | Special (ShouLong). |
| `BP_HShuaGuaiQi_JuanShe_C` | 73 | Special (JuanShe). |
| `BP_RuQinSGQ_C` | 37 | Invasion spawner. |
| `HShuaGuaiQiSplinePath` | 22 | Patrol path. |
| `BP_HShuaGuaiQi_TuoNiao_C` | 20 | Special (TuoNiao). |
| `BP_HShuaGuaiQi_XiangGui_Egg_C` | 11 | Egg. |
| `BP_HShuaGuaiQi_JiaoDiao_Egg_C` | 7 | Egg. |
| `BP_ShuaGuaiQiBase_C` | 4 | Base. |

The nine archetype recruit spawn-point actors are a separate, much smaller set: they are `BP_HShuaGuaiQiRandNPC_C` wrappers whose `SCGClass` is one of the four Exile recruit spawner classes.
No other cooked map references the base outcast archetype spawners; the Egypt map `DLC_Level01_GamePlay.umap` assigns the four `BP_Egypt_SGQ_NewbeeGift_Exiles_Cus_*` classes to ten placed actors.

## Region → recruit map

Guard levels are the random band; elite and boss levels are single levels (equal min/max in their `SCGInfoList`).
All guard rank weights are `15/35/50` (`HIGH:MIDDLE:LOW`) and the quality band is rank-determined, so those columns are identical in every region and are omitted below.
Region folder names are exact; the English labels and tier numbers are inferred from community region tables plus the level bands, not read from cooked data.

| Region folder | Label (tier) | Guard lv | Elite lv | Boss lv | Gear tier | Tribe | Curated boss talent pool |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `ZhongXingBuLuo_XiBuYuLin_ZhiHui` | Western Rainforest (T2) | 11-20 | 20 | 20 | Lv1 | Flint | hard-skin vs slash, Second Wind |
| `ZhongXingBuLuo_BeiBuYuLin_YeMan` | Northern Rainforest (T2) | 11-20 | 20 | 20 | (not sampled) | Claw | Wound Relief, Hammer DMG |
| `ZhongXingBuLuo_HongShuLin_ZhiHui` | Mangrove (T3) | 16-25 | 25 | 25 | Lv2 | Flint | Agility, Technique Recovery |
| `ZhongXingBuLuo_KengDongQiuLing_ShenMi` | Pit Hill (T4) | 21-30 | 30 | 30 | Lv2 | Fang | hard-skin vs slash, Melee Adept, Bloodthirst |
| `ZhongXingBuLuo_PingDingShan_ShenMi` | Table Mountain (T6) | 31-40 | 40 | 40 | Lv1–Lv2 | Fang | hard-skin vs slash, Wild Awakening, Mutual Destruction, Poison Body |
| `ZhongXingBuLuo_DaCaoYuan_ZhiHui` | Great Prairie (T7) | 36-45 | 45 | 45 | Lv1–Lv2 | Flint | hard-skin vs pierce, Head Stress, Torso Stress, Weakpoint |
| `ZhongXingBuLuo_JuMuLin_YeMan` | Giant Wood Forest (T7) | 36-45 | 45 | 45 | Lv2 | Claw | hard-skin vs blunt, Agility, Dual-blade DMG, Tearing Wound |
| `ZhongXingBuLuo_KuHuangYuanYe_YeMan` | Barren Meadow (T9) | 41-50 | 50 | 50 | Lv2 | Claw | hard-skin vs blunt, Ever Stronger, Deadly, Head Destruction, Mutual Destruction |
| `ZhongXingBuLuo_HanYeLin_ZhiHui` | Frostleaf Grove (T11) | 46-50 | 50 | 50 | Lv3 (cold) | Flint | Insight Defense, Iron Body, Suppress Violence, Avoid Vital, Rapid Fire |
| `ZhongXingBuLuo_GaoHanDi_ShenMi` | Alpine Land (T12) | 46-50 | 50 | 50 | Lv3 (cold) | Fang | Poison Body, Mind-Body Unity, Armor Pierce, Malice, Tearing Wound |
| `DaXingBuLuo_HeiSenLin_YeMan` | Dark Forest (T11) | 46-50 | 50 | 50 | Lv3 (cold) | Claw | Break Spirit, Strike Unready, Tit-for-Tat, Ever Stronger, Bloodthirst |
| `DaXingBuLuo_HuAnSenLin_ZhiHui` | Lakeside Forest (T10) | 46-50 | 50 | 50 | Lv3 | Flint | hard-skin vs pierce, Agility, Turn Defense to Offense, Hit the Weak, Endurance |
| `DaXingBuLuo_NanBuHuangYuan_ShenMi` | Southern Wasteland (T8) | 46-50 | 50 | 50 | Lv3 | Fang | hard-skin vs slash, Gauntlet DMG, Stress Acceleration, Blood Healing, Poison Body |

The boss-talent column is the only per-region recruit differentiator that ships: each region boss character Blueprint points its `ChengZhangComponent.DT_GoodNGConfig` at that region's `DT_GiftZhengMian_<camp>_Boss` pool, which is a small curated set of unconditional star-III talents.
Guards and elites do not use those pools; they spawn as generic `BP_SuiJi_BuLuo_C` / `_Nv_C` (or `BP_SuiJi_DaBuLuo_*` in the three big-camp regions) and draw from the shared global `DT_GiftZhengMian` pool.

## Region-exclusive and non-learnable talents and recruits

A talent can be made region-exclusive through two routes (asset-verified mechanisms):

- **Region boss pool route (already wired).** Add a star-III detail to `DT_GiftZhengMian_<camp>_Boss` for the region; the boss Blueprint already references it.
- **Guard/elite route.** Either duplicate a guard character Blueprint, set its `ChengZhangComponent.DT_GoodNGConfig` to a new `DT_GiftZhengMian_<camp>` pool, and point the spawner's `SCGInfoList[].SGBList[].GuaiWuClass` at it; or gate a talent in the global pool with the existing `BP_Gift_IsPinZhi_4+_C` condition bag and make deep regions `HIGH`-rank-heavy through `DiWeiQuanZhong`.
  The quality-gated route keeps the edit to DataTables and the spawner, at the cost of expressing depth through quality rather than region identity.

Making a pool-granted talent **non-learnable** (both are data levers, best used together):

- Set `LearnedNGID = 0` and `UpgradeNGID = 0` on the new effect rows; the shipped data uses these to separate born-with identity talents from the transferable/upgradable set.
- Add the family's effect-row ids to `DT_TalentToBeBanned` (71 rows, 211 ids). Adding to the ban list is the load-bearing edit; `LearnedNGID = 0` reinforces it.

Caveat (native, medium confidence): `DT_TalentToBeBanned` does not block curated pool grants — 33 of the 43 distinct region-boss talents are already on the list and are still granted — and it is unverified whether `LearnedNGID = 0` alone blocks Training Ground transfer.

A **recruit** is made region-specific at the spawner level, through `GuaiWuClass`, `SCGInfoList[].SGBList[].QuanZhongBiLi`, `ClanType`, and — on the archetype route — `CustomizeRowName`.

Editable fields for shaping depth, by edit class:

| Depth axis | Asset / field | Edit class |
| --- | --- | --- |
| Enemy/recruit level | `BP_SGQ_*` CDO `SCGZuiXiaoDengJi` / `SCGZuiDaDengJi` | Spawner CDO |
| Rank distribution | `BP_SGQ_*` CDO `DiWeiQuanZhong` | Spawner CDO |
| Quality distribution | `BP_SGQ_*` CDO `DiWeiAndPinZhi` | Spawner CDO |
| Class mix (combat) | `BP_SGQ_*` CDO `ZhiYeQuanZhong` | Spawner CDO |
| Tribe identity | `BP_SGQ_*` CDO `ClanType` | Spawner CDO |
| Starting current proficiency | `BP_ProficiencyConfig.JueSeLvlProfLvlList`, `ClanDiWeiProfInitLvlMap` | `BP_ProficiencyConfig` CDO |
| Class starting bonus | `SLD_ChuShiLv_*` | DataTable |
| Class cap bonus | `DT_Prof_ZhiYe_*` `MinAdd`/`MaxAdd` | DataTable |
| Starting gear / weapon | `DT_DiWeiAndZhuangBeiLv_<camp>` / `DT_DiWeiWuQi_<camp>` | DataTable |
| Positive talent cadence | `BP_ZiYuanGuanLiQi.GoodNGMaxNum`, `DT_PinZhiGoodNGAddPr` | BP CDO / DataTable |
| Talent star tier | `DT_PinZhiGoodNGStarWeight` | DataTable |
| Defect removal | `DT_PinZhiBadNGRemovePr` | DataTable |
| Region talent pool | `DT_GiftZhengMian_<camp>_Boss`; global `DT_GiftZhengMian` / `_Custom` | DataTable + character BP |
| Archetype cap seed | `DT_CustomizeNPC` `CustomizeProfMaxLv` | DataTable |

## Class-composition lever and its limit

`ZhiYeQuanZhong` is the only spawner-level class lever, and it carries only the three combat roles `WUWEI`/`SHOULIE`/`SHOUHU`.
Setting one combat profession to `0` and leaving the others positive specializes the spawner's combat recruits, which is how boss spawners already work (for example `BP_SGQ_DaXingBuLuo_HeiSenLin_YeMan_Boss` is `WUWEI:100` with the other two `0`).
The three production classes (`KULI`, `ZAGONG`, and `ZONGJIANG` Craftsman) are assigned by native logic through `ZhuFuZhiYeQuanZhongMap` and `FuZhiYeQuanZhong`, which exist only as native property names in the shipping binary and are not serialized in any cooked asset.

The limit: a region can be made to emphasize **combat** professions, but a data-only edit cannot reliably force a region to spawn economy classes.
Production identity must instead come from tribe (`ClanType` plus tribe-exclusive talents) and class-gated condition bags on the talent pools.

## Data-only levers to make depth desirable without raising caps

None of these require new native logic; all are existing data fields.

1. **Per-region boss talent pools** (`DT_GiftZhengMian_<camp>_Boss`): seed each depth with a curated, unconditional set of exclusive talents, as the shipped boss pools already do.
2. **Starting current proficiency by level and rank** (`BP_ProficiencyConfig.JueSeLvlProfLvlList`, `ClanDiWeiProfInitLvlMap`): raise the deep bands so late recruits start closer to cap.
3. **Elite/boss starting-value lerp** (`CurProfInitRatio`, 0–1): set to `1` so elite/boss recruits start at their maximum current proficiency.
4. **Guarantee talent star tiers by depth** (`DT_PinZhiGoodNGStarWeight`): force star-III weights in high-quality bands.
5. **Talent slots and cadence** (`BP_ZiYuanGuanLiQi.GoodNGMaxNum`, `DT_PinZhiGoodNGAddPr`): `GoodNGMaxNum = 6` today; raising it gives deeper recruits more trait slots.
6. **Per-region gear tiers** (`DT_DiWeiAndZhuangBeiLv_<camp>`, `DT_DiWeiWuQi_<camp>`): steepen the region spread so a deep recruit arrives in the next material tier.
7. **Defect removal determinism** (`DT_PinZhiBadNGRemovePr` → `Pr = 1.0`): clear defects deterministically so depth is upside rather than damage control.
8. **Per-recruit attribute growth** (`MaRenBeiDongYiJiShuXingRatio`, `MaRenZhuDongYiJiShuXingRatio`, `MaRenErJiShuXingRatio`): global pacing knobs, not depth-keyed.
9. **Quality multiplier** (`ManRenPinZhiRatio`): a global shift of the quality distribution; blunt because it applies everywhere, so avoid using it for depth shaping.
10. **Class/tribe weighting per spawner** (`ZhiYeQuanZhong`, `ClanType`): deep camps can be weighted toward a tribe identity, but only across the three combat roles.

The clean depth curve uses the level band as the spine, `DiWeiQuanZhong` + `DiWeiAndPinZhi` as the quality spine, `JueSeLvlProfLvlList`/`ClanDiWeiProfInitLvlMap` as the starting-value spine, per-region gear tables as the equipment spine, and per-region talent pools as the identity spine.
Because caps are uniform by design, do **not** try to express depth through `DT_Prof_ZhiYe_*`.

## Foot-guns

- **Archetype table misattribution.** The historical error attributed the per-proficiency seed branch to a `ManRenConfigTable`/`DT_XingGeConfig` personality table; the correct table is `DT_CustomizeNPC`, reached through `CustomizeProfAndGA` at `[resolve()+0x1b0]` and keyed by `character+0x3378`. `ManRenConfigTable` sits at object offset `0x16a0`, binds the behaviour table `DT_ManRenConfig`, and is unrelated to caps; nulling its pointer is inert for caps. `DT_ManRenConfig` has one row (`1`) and 21 fields (`TiaoWuDataArray`, `TiaoWuJieShuAniArray`, `XiHaoTiaoWuArray`, `YanWuTiaoWuArray`, `ZhanLiPosDataArray`, `DunZiPosDataArray`, `ZhanLiDengDaiJiShiTimeConf`, `NaWuQiMontageGaiLvConf`, `NaWuQiMontageJianGeConf`, `LengReMontageGaiLvConf`, `LengReMontageJianGeConf`, `YiBanLenMontageArray`, `FeiChangLenMontageArray`, `YiBanReMontageArray`, `FeiChangReMontageArray`, `TiaoJianMontageGaiLvConf`, `TiaoJianMontageArray`, `ZhouWeiFanYingCDTimeConf`, `ZhouWeiFanYingJuLi`, `MAPAnimMontageFanYing`, `MAPDaoJuUseFanYing`) and no proficiency map, and the manager CDO binds it through the raw `FPackageIndex -4098`; the reflected `DT_XingGeConfig` name exists only in the server binary's `FName` pool at file offset `0x8ED0A5`, with its Modkit tooltip at `Tips.locres` offset `264215`. A mod maker following the old attribution patches the wrong pointer.
- **The archetype seed affects only archetype-driven recruits.** Recruitable Outcasts and hostile invasion forces carry `CustomizeRowName`; wild and camp barbarians (`BP_SuiJi_BuLuo` / `_UnTamed`) do not, so camp recruits always take the base-plus-class roll. Editing `DT_CustomizeNPC` cannot change a camp recruit that never reads it.
- **DLC coverage is separate.** `DT_CustomizeNPC_Egypt` is a distinct table selected by the Egypt managers; the base table's rows do not apply on the DLC map. One DLC data anomaly exists: `BP_Egypt_F_Cus_Gift_WhipFistSpear` sets `CustomizeRowName = Intrusion_Egypt_WhipFistSpear` instead of the matching `Newbee_Gift_Egypt_WhipFistSpear`.
- **Spawner CDO writes are medium confidence on Linux.** The read path is proven, but a spawner- or guard-character Blueprint write round-trip has not been exercised; only value edits on `BP_ProficiencyConfig` are proven.
- **There is no per-location recruit counter.** No `WeiYi`/`Unique`/per-spawner tally exists; `SCGShangXianCount` is concurrency only. A per-location cap needs new runtime logic.
- **Quality does not touch caps or starting proficiency.** No `ENaturalGiftEffect` sets a cap or starting value from quality; the starting-value selector reads level, rank, and class, while the cap selector reads the native base roll and the class table (plus the archetype seed). Do not add a quality term to class tables.
- **Caps are baked at generation.** Existing recruits keep their stored cap; a cap or starting-value change is only visible on freshly generated tribesmen (or a new world).
- **The Training Ground can raise a cap.** The `NGLevelTraining`/cap-raise path changes a cap fixed at recruitment, so any "caps never rise" statement in downstream design is not a game invariant; disable it at the station, not with the global `TrainingExpRatio`.
- **`ManRenPinZhiRatio` is region-independent and blunt**, and it interacts with the native quality roll in a way that has not been observed at runtime.
- **Production classes cannot be forced by data.** `ZhiYeQuanZhong` carries only the three combat roles; production assignment is native.
- **`DT_TalentToBeBanned` and `LearnedNGID = 0` are not guarantees.** The ban list does not block curated pool grants, and `LearnedNGID = 0` does not provably block Training Ground transfer, so region exclusivity is not fully guaranteed by those edits alone.
- **The guard character Blueprint does not serialize `DT_GoodNGConfig`.** It falls through to the manager's global pool; a per-character override write is unproven on Linux.
- **Named camps cap at spawn level 50.** The `51-65` region tiers are elite and dungeon content, not named-camp spawners.
- **Region folder → public name is inferred.** The level numbers are read directly, but the English region labels are a community mapping.
- **`DT_GiftFuMiann` is spelled with a double `n`.** `DT_GiftFuMian` does not exist; the wrong name silently misses the defect pool.
