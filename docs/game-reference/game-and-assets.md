# Game and Assets

This is the map of Soulmask's shipped data: the engine and pak format a modder meets first, the cooked-asset model, the `/Game` asset tree, and the named assets that carry the systems mods touch.
It is a reference, not a walkthrough; the mechanics built on these assets are covered by the sibling docs listed at the end.
Confidence tags used throughout: **in-game verified** (confirmed on a running server or client), **asset-level verified** (read directly from a cooked asset), **binary-level verified** (recovered from the shipping binary by disassembly or an embedded resource), **inferred** (derived from structure rather than directly observed), and **unverified** (plausible but not confirmed).

## 1. Game and engine

Soulmask is developed by CampFire Studio and published by Qooland Games.
It runs on Unreal Engine 4.27, confirmed from the shipping executable's Windows version resource (`++UE4+Release-4.27-CL-0`); the official Modkit is UE 4.27.2 **binary-level verified**.
Content is cooked into classic UE `.pak` containers, not IoStore, so there are no `.utoc`/`.ucas` files **asset-level verified**.
The pak format is version V11 (`Fnv64BugFix`) with an encrypted index, an all-zero encryption GUID, and the mount point `../../../` **asset-level verified**.
The retail client pak is `WS/Content/Paks/WS-WindowsNoEditor.pak` and the native Linux dedicated server ships `WS/Content/Paks/WS-LinuxServer.pak` **asset-level verified**.
A key recovered from the unstripped Linux dedicated server binary decrypts both pak indexes, so the cooked assets are extractable on Linux without the Windows Modkit **binary-level verified**.
The retail release includes the free Shifting Sands DLC, cooked under the top-level `/Game/AdditionMap01` tree **asset-level verified**.

## 2. Cooked-asset model

A cooked asset is an `.uasset` header paired with an `.uexp` payload, plus `.ubulk` bulk data on some client assets; a level is a `.umap`.
A package path in the editor (`/Game/...`) maps into the pak as `WS/Content/...`, so `/Game/Blueprints/DataTable/NaturalGift/DT_GiftZongBiao` is stored as `WS/Content/Blueprints/DataTable/NaturalGift/DT_GiftZongBiao.uasset` alongside its `.uexp` **asset-level verified**.
A mod ships as a patch pak named `<Name>_P.pak` placed in `WS/Content/Paks/` or `WS/Content/Paks/~mods/`; the `_P` suffix gives patch priority over the base pak at the same package path **asset-level verified**.

```text
editor package path   /Game/Blueprints/DataTable/NaturalGift/DT_GiftZongBiao
pak entry path        WS/Content/Blueprints/DataTable/NaturalGift/DT_GiftZongBiao.uasset
patch pak location    WS/Content/Paks/<Name>_P.pak   or   WS/Content/Paks/~mods/<Name>_P.pak
```
The engine rejects an unsigned pak with `Couldn't find pak signature file` unless the `-fileopenlog` launch option is present, after which the pak mounts on the Linux dedicated server **asset-level verified**.
A DataTable is one export per asset with its rows under `Exports[0].Table.Data`, so a row edit lands at a known `.uexp` offset **asset-level verified**.
Blueprint behavior and default values live on the class-default object (`Default__<Class>_C`), which UAssetAPI may expose as typed (`NormalExport`) or opaque (`RawExport`) **asset-level verified**.

Systems are split into DataTable-driven and Blueprint-driven families.

- DataTable-driven systems include talents and gifts, per-level proficiency benefits, class cap bonuses, mastery config, star weights, and defect-removal probabilities **asset-level verified**.
- Blueprint-driven systems include the mask tech tree (`BP_KJS_*`), spawners (`BP_SGQ_*`), the proficiency config class default object (`BP_ProficiencyConfig`), tribe identity (`BP_ManRenRandomConfig`), recipes (`BP_PeiFang_*`), and the Training Ground (`BP_JianZhuTrainingGround`) **asset-level verified**.
- Some systems mix both: the tech tree is Blueprint-gated with a `DT_AllTechTreeNode` DataTable index, and the tree is not a single DataTable **asset-level verified**.

The game names its content in Pinyin; the glosses below cover the terms a modder meets in paths and identifiers.

| Term | Gloss |
| --- | --- |
| `YiFu` | clothing |
| `JianZhu` | building |
| `DongWu` | animal |
| `ZiYuanGuanLi` | resource and proficiency management |
| `KeJiShu` | mask tech tree |
| `PeiFang` | recipe |
| `ShuaGuaiQi` | enemy/tribe spawner |
| `DaoJu` | item |
| `MianJu` | mask |
| `BuLuo` | tribe |
| `Ren` | people/NPCs |
| `WuQi` | weapon |
| `PinZhi` | quality |
| `ShuLianDu` | proficiency level |
| `ZhuanJing` | weapon mastery |
| `ZhiYe` | class/profession |

## 3. Asset tree map

The counts below are occurrences among 71,492 `/Game/...` path references in a community localization dump, not unique file counts, so they indicate relative weight rather than exact inventory size **inferred**.

Top level under `/Game/`:

| Directory | Reference count |
| --- | --- |
| `Blueprints` | 57,714 |
| `AdditionMap01` (Shifting Sands DLC) | 8,542 |
| `Data` | 4,214 |
| `Maps` | 616 |
| `Marketplace` | 332 |
| `Characters` | 68 |
| `Loading` | 6 |

Second level under `/Game/Blueprints/`:

| Directory | Reference count |
| --- | --- |
| `UI` | 15,920 |
| `DaoJu` (items) | 8,360 |
| `DataTable` | 8,328 |
| `ZiYuanGuanLi` | 4,988 |
| `KeJiShu` (tech tree) | 3,330 |
| `JianZhu` (building) | 3,152 |
| `GAS` | 3,122 |
| `PeiFang` (recipes) | 2,710 |
| `RenWu` | 1,824 |
| `ShuaGuaiQi` (spawners) | 1,398 |
| `ChengJiu` | 1,048 |
| `AI` | 888 |
| `DongWu` (animals) | 666 |
| `Shop` | 462 |
| `BaoXiang` (chests) | 392 |
| `MianJu` (masks) | 208 |

The gameplay-relevant subtrees a modder works in are:

- `/Game/Blueprints/DataTable/` holds proficiency, talent, drop, gear, and skill tables, with the subfolders `NaturalGift/`, `Proficiency/`, `CaiJiBao/`, `TechTree/`, and `CustomProfAndGA/`.
- `/Game/Blueprints/ZiYuanGuanLi/` holds the proficiency and recruitment managers (`BP_ProficiencyConfig`, `BP_ZiYuanGuanLiQi`, `BP_ManRenRandomConfig`, `BP_GameXiShu_GuanLiQi`) and the mastery tables `DT_ZhuanJingSLD` and `DT_GuDingZhuanJing`.
- `/Game/Blueprints/AI/Ren/` holds the tribesman character Blueprints (`BP_BuLuo_Base` and boss variants).
- `/Game/Blueprints/ShuaGuaiQi/` holds the spawner Blueprints (`BP_SGQ_*` families).
- `/Game/Blueprints/KeJiShu/` holds the mask tech-tree Blueprint nodes (`BP_KJS_*`).
- `/Game/Blueprints/PeiFang/` holds the recipe Blueprints (`BP_PeiFang_*`), whose native parent class is `HPeiFangBase` (`/Script/WS`).
- `/Game/Blueprints/DaoJu/` holds the item Blueprints.
- `/Game/Blueprints/GAS/` holds gameplay effects and abilities (`GE_*`, `GA_*`).
- `/Game/Data/DataTables/` holds standalone tables such as `DT_SpecializedSkill` and `DT_TalentToBeBanned`.
- `/Game/AdditionMap01/` holds the Shifting Sands DLC content, including `BluePrints/DataTable/Drop/`.
- Localization is not under `/Game/`; the cooked English strings live at `WS/Content/Localization/Game/en/Game.locres`.

## 4. Named-asset inventory

These are the assets a modder will touch, with their package path and role.

| Asset | Package path | Role | Verification |
| --- | --- | --- | --- |
| `DT_GiftZongBiao` | `/Game/Blueprints/DataTable/NaturalGift/DT_GiftZongBiao` | 1,319-row talent effect table, one row per star tier of every gift family; row struct `NaturalGiftEffectConfig` | asset-level verified |
| `DT_GiftZhengMian` | `/Game/Blueprints/DataTable/NaturalGift/DT_GiftZhengMian` | positive talent pool rows (30); struct `NaturalGiftConfig` | asset-level verified |
| `DT_GiftZhengMian_Custom` | `/Game/Blueprints/DataTable/NaturalGift/DT_GiftZhengMian_Custom` | custom positive pool rows (12) | asset-level verified |
| `DT_GiftFuMiann` | `/Game/Blueprints/DataTable/NaturalGift/DT_GiftFuMiann` | negative (defect) pool rows (42); the shipped name has a double `n` and `DT_GiftFuMian` does not exist | asset-level verified |
| `DT_GiftXiHaoBiao` | `/Game/Blueprints/DataTable/NaturalGift/DT_GiftXiHaoBiao` | preference (like/aversion) pool rows (49) | asset-level verified |
| `DT_PinZhiGoodNGStarWeight` | `/Game/Blueprints/DataTable/NaturalGift/DT_PinZhiGoodNGStarWeight` | recruit quality to good-talent star weights (6 rows) | asset-level verified |
| `DT_PinZhiGoodNGAddPr` | `/Game/Blueprints/DataTable/NaturalGift/DT_PinZhiGoodNGAddPr` | recruit quality to +1 good-talent grant probability per level band (6 rows) | asset-level verified |
| `DT_PinZhiBadNGRemovePr` | `/Game/Blueprints/DataTable/NaturalGift/DT_PinZhiBadNGRemovePr` | recruit quality to defect-removal probability per 5-level check (6 rows) | asset-level verified |
| 23 `DT_ProficiencyConfig_*` | `/Game/Blueprints/DataTable/Proficiency/DT_ProficiencyConfig_<Prof>` | per-level proficiency XP cost and milestone benefits, 150 rows each | asset-level verified |
| six `DT_Prof_ZhiYe_*` | `/Game/Blueprints/DataTable/Proficiency/DT_Prof_ZhiYe_{WuWeiZhe,ShouLieZhe,ShouHuZhe,KuLi,ZaGong,ZongJiang}` | per-class cap bonus rows of `{ProfType, MinAdd, MaxAdd}` | asset-level verified |
| `SLD_ChuShiLv_*` | `/Game/Blueprints/DataTable/NaturalGift/SLD_ChuShiLv_{ZhanShi,LieShou,WeiShi,LiGong,ZaGong,JiangRen}` | per-class starting-proficiency bonus tables | asset-level verified |
| `DT_ZhuanJingSLD` | `/Game/Blueprints/ZiYuanGuanLi/DT_ZhuanJingSLD` | per-weapon mastery thresholds (9 rows): learn chance and ability pool by proficiency level | asset-level verified |
| `DT_SpecializedSkill` | `/Game/Data/DataTables/DT_SpecializedSkill` | 88 mastery abilities across 9 weapons (`ZhuanJingJiNeng` rows) | asset-level verified |
| `DT_TalentToBeBanned` | `/Game/Data/DataTables/DT_TalentToBeBanned` | talent ban list (struct `TalentToBanned`, 71 rows / 211 banned ids) that does not block curated boss-pool grants: 33 of the 43 boss-pool ids are banned yet still granted | asset-level verified |
| `DT_GuDingZhuanJing` | `/Game/Blueprints/ZiYuanGuanLi/DT_GuDingZhuanJing` | fixed starting mastery sequence for the blank body (27 rows) | asset-level verified |
| `DT_ZhiZuo` | `/Game/Blueprints/DataTable/CaiJiBao/DT_ZhiZuo` | crafted-item drop-bag table (struct `CaiJiDaoJuBaoDataTable`, 43 rows), not the recipe quality table | asset-level verified |
| `DT_CustomizeNPC` | `/Game/Blueprints/DataTable/CustomProfAndGA/DT_CustomizeNPC` | 56 archetype-seed rows carrying per-row `CustomizeProfMaxLv` cap overrides | asset-level verified |
| `DT_CustomizeNPC_Egypt` | `/Game/AdditionMap01/BluePrints/DataTable/DT_CustomizeNPC_Egypt` | Shifting Sands archetype seeds, 96 rows | asset-level verified |
| `DT_ManRenConfig` | `/Game/Data/DataTables/DT_ManRenConfig` | behaviour/emote table (1 row, 21 fields, no proficiency map); bound by the manager CDO `ManRenConfigTable` at object offset `0x16a0`, not the archetype cap seed | asset-level verified |
| `DT_XingGeConfig` | not cooked (reflected member `HZiYuanGuanLiQi:DT_XingGeConfig` at object offset `0xae0`) | personality config of row struct `FNaturalGiftConfig`; absent from the server and retail client paks, so the personality branch has no row map | asset-level verified |
| `BP_ProficiencyConfig` | `/Game/Blueprints/ZiYuanGuanLi/BP_ProficiencyConfig` | proficiency config CDO (base caps, starting-value ranges, class-table references); native parent is `UHProficiencyConfig` | asset-level verified |
| `BP_ZiYuanGuanLiQi` | `/Game/Blueprints/ZiYuanGuanLi/BP_ZiYuanGuanLiQi` | resource/proficiency manager Blueprint with an opaque `RawExport` CDO; variants `_Action`, `_Creative`, `_Management`, `_PVP` | asset-level verified |
| `BP_ManRenRandomConfig` | `/Game/Blueprints/ZiYuanGuanLi/BP_ManRenRandomConfig` | tribe, origin, and experience random-gift config (`BornBuLuoCiTiaoMap`, `BornChuShenCiTiaoList`, `BornJingLiCiTiaoMap`) | asset-level verified |
| `BP_CH_*` title classes | `/Game/Blueprints/ChengHao/Character/BornTiaoJian/BP_CH_<name>` (e.g. `BP_CH_SGDS`, `BP_CH_JZDS`) | title-class CDOs whose `NaturalGiftList` grants a `ChengHao`-source row (`BP_CH_SGDS` → `[600021]`, `BP_CH_JZDS` → `[600022]`); fields `ChengHaoName`, `OnlyForCharacter`, `NaturalGiftList`, `TiaoJianList` | asset-level verified |
| `BP_Mask_XiuFu01_1012` | `/Game/Blueprints/MianJu/XiuFu01/BP_Mask_XiuFu01_1012` | mask repair node that grants the personal recruitment-cap increments | asset-level verified |
| `BP_GameXiShu_GuanLiQi` | `/Game/Blueprints/ZiYuanGuanLi/BP_GameXiShu_GuanLiQi` | manager holding default-object maps for game-coefficient and recruitment-cap keys | asset-level verified |
| `BP_JianZhuTrainingGround` | `/Game/Blueprints/JianZhu/QiTa/BP_JianZhuTrainingGround` | Training Ground building CDO (training tracks, coach level required, seat count) | asset-level verified |
| `BP_SGQ_*` spawners | `/Game/Blueprints/ShuaGuaiQi/...` | spawner Blueprints (families `BP_SGQ_BuLuo_*`, `BP_SGQ_Guild_*`, `BP_SGQ_Elite_*`) carrying spawn level bands and rank/profession weights | asset-level verified |
| `DT_DiWeiAndZhuangBeiLv_*` | `/Game/Blueprints/ShuaGuaiQi/SGQ_BuLuo/<camp>/DT_DiWeiAndZhuangBeiLv_<camp>` | per-region rank to starting-gear quality table (74 assets), referenced by the spawner CDO `DiWeiAndZhuangBeiDataTable` | asset-level verified |
| `DT_DiWeiWuQi_*` | `/Game/Blueprints/ShuaGuaiQi/SGQ_BuLuo/<camp>/DT_DiWeiWuQi_<camp>` | per-region rank to starting-weapon quality table (75 assets), referenced by the spawner CDO `DiWeiAndWuQiDataTable` | asset-level verified |
| `BP_KJS_*` tech tree | `/Game/Blueprints/KeJiShu/Node/BP_KJS_*` | 778 Blueprint tech nodes (main and sub) with gate data on their CDOs | asset-level verified |
| `DT_AllTechTreeNode` | `/Game/Blueprints/DataTable/TechTree/DT_AllTechTreeNode` | 102-row DataTable index mapping numeric rows to main tech-node Blueprints, with `_Action`/`_Management` variants | asset-level verified |
| `DT_GiftZongBiao` effect classes | `/Game/Blueprints/GAS/GE/GE_TianFu_*` | gameplay-effect classes applied by gift rows through `NGGEClassList` | asset-level verified |
| `DT_NGEffectConfig` / `DT_NGEffectConfigDongWu` | manager members of `Default__BP_ZiYuanGuanLiQi_C` at `+0xa78` / `+0xa80` | effect-table pointers: the human pointer resolves to `DT_GiftZongBiao`, the animal pointer to the animal gift table | binary-level verified |
| `BP_Gift_IsZDZhiYe_PinZhi` | `/Game/Blueprints/GAS/TiaoJianBao/BP_Gift_IsZDZhiYe_PinZhi` | combat-class-scoped quality gate, the single class variant of the quality condition `BP_Gift_IsPinZhi_4+_C` | asset-level verified |
| `Game.locres` | `WS/Content/Localization/Game/en/Game.locres` | cooked English localization keyed by the 32-hex `TextKey` values in `Title`/`Desc` fields | asset-level verified |
| `GameXishu.json` | `WS/Config/GameplaySettings/GameXishu_Template.json` (shipped templates); `WS/Saved/GameplaySettings/GameXishu.json` (live server) | plaintext server gameplay coefficients; not a pak asset | asset-level verified |

The 23 proficiency identifiers with a `DT_ProficiencyConfig_*` table are `FaMu`, `CaiKuang`, `CaiShou`, `ZhongZhi`, `FangZhi`, `ZhiTao`, `PaoMu`, `RouPi`, `RongLian`, `QiJu`, `LianJin`, `PengRen`, `WuQi`, `JiaZhou`, `Mao`, `Dao`, `DunPai`, `Gong`, `ShuangDao`, `QuanTao`, `DaJian`, `Chui`, `Bian`.
Table suffix names can alias the proficiency enum (for example `Dao`/`DanDao`, `Chui`/`DaChui`, `Mao`/`ChangMao`, `DunPai`/`Dun`), and the `Proficiency/` folder also contains suffix names such as `JianZhu`, `TuZai`, `YanMo`, and `ZhuBao` **inferred**.

## 5. Public-codex snapshot

The public `rubensayshi/soulmask-codex` repository commits a Modkit-derived snapshot in which `Game/Exports/` holds raw DataTable JSON and `Game/Parsed/` holds pipeline-parsed datasets.
The snapshot predates the direct extraction and is a community source, so its counts are **unverified** against the cooked paks except where the direct extraction confirms them.
The clearest conflict is the tech tree: `Game/Parsed/tech_tree.json` holds 777 nodes while the direct extraction finds 778 `BP_KJS_*` assets, and the direct count wins.
The pipeline, its environment limits, and the community localization dump are covered by [../reverse-engineering/asset-analysis.md](../reverse-engineering/asset-analysis.md) "Public community assets".

`Game/Parsed/` (13 files):

| File | Bytes | Records | Contents |
| --- | --- | --- | --- |
| `drops.json` | 6,801,116 | 1,292 | Weighted loot tables from the 11 drop DataTables (`CaiJiDaoJuBaoDataTable`). |
| `farm_plots.json` | 129,161 | 681 | Barracks farm-plot locations and their weighted crop pools. |
| `items.json` | 1,601,034 | 2,354 | Item catalogue from `BP_DaoJu_*` Blueprints. |
| `ore_deposits.json` | 6,162,295 | 20,589 | Ore deposit locations from streaming `*_Near` tile umaps. |
| `ore_spawns.json` | 45,572 | 147 | Large Mineral Vein node locations. |
| `prop_packs.json` | 155,427 | 315 | Attribute packs from `DT_ZhuangBeiPropTable`. |
| `recipes.json` | 1,644,061 | 1,109 | Crafting recipes with inputs, output, station, time, proficiency, XP, and quality levels. |
| `seed_sources.json` | 15,724 | 21 | Seed item sources. |
| `spawn_locations.json` | 518,665 | 3,816 | Base-map animal spawn points; `level` is always empty. |
| `spawn_locations_dlc.json` | 346,063 | 2,562 | DLC-map animal spawn points. |
| `spawns.json` | 5,711,843 | 12,555 | Raw actor placements (map, position, spawner class, spawn blueprint class). |
| `tech_tree.json` | 484,190 | 777 | Tech-tree nodes with prerequisites, mask-level gates, point costs, and recipe unlocks. |
| `traits.json` | 1,041,074 | 1,319 | Parsed natural gifts, defects, titles, origins, and preferences with effects, restrictions, and clan tags. |

`Game/Exports/` (12 files):

All share the row struct `CaiJiDaoJuBaoDataTable` except `DT_GiftZongBiao`.

| File | Bytes | Records | Contents |
| --- | --- | --- | --- |
| `DT_BuLuoDiaoLuoBao.json` | 563,351 | 70 | Tribe-camp drop bags. |
| `DT_DiXiaCheng.json` | 305,506 | 19 | Underground-city drop bags. |
| `DT_Dungeon.json` | 220,995 | 14 | DLC dungeon drop bags. |
| `DT_GiftZongBiao.json` | 1,611,301 | 1,319 | Raw natural-gift effect table (24 columns). |
| `DT_NpcDrop_AdditionMap01.json` | 2,177,206 | 184 | DLC NPC drop bags. |
| `DT_NPCDrop.json` | 3,059,288 | 280 | Base NPC drop bags. |
| `DT_Relic.json` | 778,282 | 161 | DLC relic drop bags. |
| `DT_ShengWuCaiJiBao.json` | 649,096 | 252 | Creature-body harvest bags. |
| `DT_Tribe.json` | 452,624 | 53 | DLC tribe drop bags. |
| `DT_YiJi.json` | 644,150 | 116 | Ruins drop bags. |
| `DT_ZhiBeiCaiJiBao.json` | 172,470 | 101 | Plant-gathering bags. |
| `DT_ZhiZuo.json` | 187,350 | 43 | Crafted item-bag drops. |

`Game/Parsed/traits.json` carries these fields per row **unverified**:
`id`, `star`, `name_zh`, `description_zh`, `description_vague_zh`, `source`, `effect`, `effect_attr`, `effect_value`, `effect_is_percentage`, `effect_probability`, `effect_cooldown`, `learned_id`, `upgrade_id`, `base_weight`, `is_dlc`, `is_negative`, `proficiency_requirements`, `weapon_requirements`, `conditions`, `icon_ref`, `icon_name`, `clan`.

## 6. Verified reference counts

| Quantity | Value | Verification |
| --- | --- | --- |
| `BP_KJS_*` tech-tree assets | 778 (180 main + 598 sub) | asset-level verified |
| `DT_GiftZongBiao` effect rows | 1,319 | asset-level verified |
| `DT_GiftZongBiao` star tiers I / II / III | 427 / 434 / 458 | asset-level verified |
| `DT_ProficiencyConfig_*` tables | 23, each 150 rows | asset-level verified |
| Mastery abilities / weapons | 88 abilities across 9 weapons | asset-level verified |
| `DT_SpecializedSkill` rows | 88 | asset-level verified |
| `DT_ZhuanJingSLD` rows (weapons) | 9 | asset-level verified |
| `DT_GuDingZhuanJing` rows | 27 | asset-level verified |
| Six class cap tables `DT_Prof_ZhiYe_*` | every row `MinAdd = 15`, `MaxAdd = 25` | asset-level verified |
| `DT_GiftZhengMian` / `_Custom` / `DT_GiftFuMiann` / `DT_GiftXiHaoBiao` rows | 30 / 12 / 42 / 49 | asset-level verified |
| `DT_PinZhiGoodNGStarWeight` / `DT_PinZhiGoodNGAddPr` / `DT_PinZhiBadNGRemovePr` rows | 6 / 6 / 6 | asset-level verified |
| `DT_CustomizeNPC` / `DT_CustomizeNPC_Egypt` rows | 56 / 96 | asset-level verified |
| `DT_AllTechTreeNode` rows | 102 | asset-level verified |
| Server pak entries | 131,858 | asset-level verified |
| Retail client pak entries | 145,821 | asset-level verified |

The public Codex snapshot count of 777 tech nodes is superseded by the direct extraction of 778.
The `~1560` figure that appears in older notes is not a node count at all: a raw `repak list` or `grep` for `BP_KJS_*` matches each asset's `.uasset` and `.uexp` entries separately, so it is roughly double the real 778.

## 7. Server versus client parity

Twelve key target assets were compared by hashing the concatenated `.uasset` and `.uexp`; nine are byte-identical and three differ **asset-level verified**.
The nine identical assets are `DT_GiftZhengMian`, `DT_GiftFuMiann`, `DT_ProficiencyConfig_Dao`, `DT_Prof_ZhiYe_ZongJiang`, `DT_ZhuanJingSLD`, `DT_FaXing`, `DT_WenShenTable`, `BP_SGQ_BuLuo_Base`, and `DT_SpecializedSkill`.
The three differing assets are `DT_GiftZongBiao`, `BP_ZiYuanGuanLiQi`, and `BP_BuLuo_Base`.
For `DT_GiftZongBiao` the client `NameMap` has 3,499 names against the server's 3,498, the client carrying the extra reference `HGEUIDataBuffXinXi`; the row count and every row name are identical.
Use the retail client pak as the authority whenever an asset differs, because it is the build players run and it carries the full content set.
The server extraction remains a convenient complete gameplay mirror: it is already unpacked, about 6.3 GB against the client's 18.6 GiB, and nine of the twelve sampled assets are byte-identical.
The two paks break down as follows **asset-level verified**.

| Entry type | Server pak | Client pak |
| --- | --- | --- |
| Entries | 131,858 | 145,821 |
| `.uasset` | 63,429 | 63,889 |
| `.uexp` | 63,936 | 64,407 |
| `.ubulk` | 0 | 7,938 |
| `.umap` | 507 | 518 |
| `.wem` (audio) | 0 | 3,859 |
| `.bnk` (audio) | 0 | 1,193 |

The Linux dedicated server ships no anti-cheat binaries, only the `AntiGS.uplugin` descriptor and an inert `FAntiGSModule` symbol; the Windows client ships the `WS/Plugins/AntiGS/` components and Tencent's `rail_api64.dll` **asset-level verified**.
The observed anti-cheat surface is a Windows-client distribution concern and does not block Linux pak extraction, datamining, or server-side modding.

## 8. Foot-guns

- Do not search for `DT_GiftFuMian`; the shipped negative pool is `DT_GiftFuMiann` with a double `n`.
- Do not use the `~1560` `BP_KJS_*` tech-node figure from a raw listing or `grep`: it counts each asset's `.uasset` and `.uexp` entry separately, so it is roughly double the real 778 assets.
- Do not trust the server extraction blindly for `DT_GiftZongBiao`, `BP_ZiYuanGuanLiQi`, or `BP_BuLuo_Base`; use the retail client copy for those.
- A pak override must store the `WS/Content/...` path, not the editor `/Game/...` path.
- An ASCII `strings` search misses UTF-16 `TEXT()` literals, so absence from an ASCII search is not evidence of absence; `fileopenlog` is present only as a wide-character literal.
- `WS/Mods/` is not a scanned pak directory; place paks in `WS/Content/Paks/` or `WS/Content/Paks/~mods/`.
- `GameXishu.json` is a plaintext disk config and cannot be shipped inside a `_P.pak`.
- The native cap constants (`ProfInitMaxLvlMin/Max`, `ProfMaxLvlLowerLimit/UpperLimit`, `ProfInitChuShiBodyMaxLvl`) are properties of `UHProficiencyConfig`, the native parent of `BP_ProficiencyConfig`, not of `BP_ZiYuanGuanLiQi`.

## 9. Where to start

This document maps the assets; the systems built on them are covered by the sibling reference docs:

- [proficiencies-and-caps.md](proficiencies-and-caps.md) covers proficiency caps, class skill sets, and the cap data on `BP_ProficiencyConfig`.
- [starting-proficiency.md](starting-proficiency.md) covers the current proficiency a fresh recruit starts with.
- [talents.md](talents.md) covers the gift effect table, selection pools, star tiers, defects, preferences, and origin.
- [quality-and-rarity.md](quality-and-rarity.md) covers the six-tier quality roll.
- [weapon-mastery.md](weapon-mastery.md) covers the mastery thresholds and ability pools.
- [recruitment-and-spawns.md](recruitment-and-spawns.md) covers spawner CDOs, region level bands, recruit generation, and the recruitment/roster caps.
