# Quality and Rarity (`PinZhi`)

Quality (`PinZhi`) is the six-tier rarity rolled when a barbarian is generated, and it is the game's main "is this recruit worth the trouble" filter.
It is independent of proficiency, which is covered in [proficiencies-and-caps](proficiencies-and-caps.md), and it is the input the talent layer keys on, covered in [talents](talents.md); the spawn-side details live in [recruitment-and-spawns](recruitment-and-spawns.md).

Confidence labels used below: **in-game verified** (confirmed on a running server), **asset-level verified** (read from cooked assets), **inferred** (read from disassembly or collateral evidence), **community** (external guides, not confirmed in data), and **unverified**.

## The six tiers

Quality is a 0-5 integer shown as a colored icon.

| Value | Color |
| --- | --- |
| 0 | White |
| 1 | Green |
| 2 | Blue |
| 3 | Purple |
| 4 | Yellow |
| 5 | Red |

The coloring is community-sourced; the 0-5 integer and the display of a colored quality icon are in-game verified.

Most shipped data keys on a band rather than the exact value, and the rank-to-quality mapping is the load-bearing one (asset-level verified):

| Clan rank | Quality band |
| --- | --- |
| `LOW` | 0/1 |
| `MIDDLE` | 2/3 |
| `HIGH` | 4/5 |

Ordinary guards spawn with rank weights `15/35/50` (`DiWeiQuanZhong`) across `LOW`/`MIDDLE`/`HIGH`; elites and bosses override `DiWeiAndPinZhi` to `HIGH=100` (asset-level verified).
`HIGH` elites and bosses therefore show quality 4/5, while ordinary guards are mostly 0-3.

## Where quality lives and what it feeds

Quality is rolled at recruitment from the spawner CDO: `DiWeiQuanZhong` picks the clan rank, then `DiWeiAndPinZhi.PZRate` maps that rank to a quality distribution (asset-level verified).
`BP_SGQ_BuLuo_Base` ships `HIGH [0:5,1:5,2:5,3:5,4:100,5:100]`, `MIDDLE [2:100,3:100]`, `LOW [0:100]`.
`GameXishu.json ManRenPinZhiRatio` is a global multiplier applied on top (default 1.0; 1.5/2.0 in harder difficulty templates).
The rolled value is stored on the tribesman and copied by the deep-copy/transfer struct as `AttrPinZhiCoef`.

Quality feeds the following systems:

| System | Asset / field | Effect |
| --- | --- | --- |
| Talent star tier | `DT_PinZhiGoodNGStarWeight` | Weights which star tier (`I`/`II`/`III`) a granted positive talent receives. |
| Advantage (talent) add cadence | `DT_PinZhiGoodNGAddPr` | Per-level probability and count for gaining a new positive talent. |
| Defect removal | `DT_PinZhiBadNGRemovePr` | Probability a negative talent is removed at each 5-level check. |
| Personality chance | `PinZhiXingGePrMap` (manager `RawExport`) | Chance to roll a personality; not UAssetAPI-editable. |
| Starting gear quality | spawner CDO `PinZhiRateAndZhuangBeiQz` | Weights which quality tier of armor parts spawns. |
| Starting weapon count/quality | spawner CDO `PinZhiAndWuQiQz` | Weights weapon count and quality. |
| Title chance | `BP_ManRenRandomConfig.BornGetChengHaoRateMap` | Per-quality title roll (`10/10/15/15/35/35`). |
| Mastery learning gate | `DT_ZhuanJingSLD.PinZhiGaiLv` | Per-quality mastery-unlock chance. |
| Training Ground speed | `BP_JianZhuTrainingGround.TraningExpAddMap.*.QualityAndExpRate` | Per-quality training multiplier; quality 5 ships at rate 0. |
| Quality-gated talent pool | `BP_Gift_IsPinZhi_4+_C` | A pool condition that tests quality >= 4. |
| Class-scoped quality-gated talent pool | `BP_Gift_IsZDZhiYe_PinZhi` | The only class-scoped quality condition bag; couples the combat-class gate with the quality test. |

The per-region gear and weapon tables sit behind the spawner CDO fields `DiWeiAndZhuangBeiDataTable` and `DiWeiAndWuQiDataTable` (asset-level verified).
`DT_DiWeiAndZhuangBeiLv_<camp>` (74 tables) maps clan rank to a gear Blueprint and `DT_DiWeiWuQi_<camp>` (75 tables) maps rank to a weapon Blueprint; the spread rises only approximately with tier (roughly Lv1 at T2, Lv2 across T3–T9, Lv3 from the late T8 regions onward), and individual regions straddle two bands rather than stepping through them, for example Table Mountain and Great Prairie ship both Lv1 and Lv2 (asset-level verified).
Quality does **not** feed starting proficiency or the proficiency cap directly.
The starting-value selector reads level (`JueSeLvlProfLvlList`), clan rank (`ClanDiWeiProfInitLvlMap`), and class (`SLD_ChuShiLv_*`), and the cap selector reads class alone; only rank correlates with quality in those paths (inferred).

## Quality does not reach the cap selector

The recruitment cap initializer `UHChengZhangComponent::InitProficiency` (`0x41b7730`) reads only the `UHProficiencyConfig` native constants and the class-bonus maps (inferred).
It never reads quality, clan rank, character level, or the spawner.
Neither the six class cap tables `DT_Prof_ZhiYe_*` nor any other cooked cap table has a per-quality variant or a quality key.
The full selector arithmetic is documented in [proficiencies-and-caps](proficiencies-and-caps.md) "The cap algorithm"; the quality-specific result is that a quality value cannot change a cap through any table the selector reads.

## Cap-raising effects are a mod design option

`ENaturalGiftEffect::ProfMaxLevelInc` is enum value **52** (inferred).
Its shipped tooltip reads "Maximum proficiency level increase (proficiency type is configured in the effect) (value)" (asset-level verified), and it is a flat value add, unlike `ProfExpInc` (value 51), which is a percentage.
No shipped `DT_GiftZongBiao` row uses effect 52: the 47 proficiency-targeted gift rows are all effect 51, so the shipped game has no quality-keyed cap grant.
The effect-52 handler and its write to `FProficiencyData.ProfMaxLvl_Add` (`+0x10`) and `ProfMaxLvl` (`+0x8`) are documented in [talents](talents.md) "Effect enums" and [proficiencies-and-caps](proficiencies-and-caps.md) "Other cap modifiers".

A quality-keyed cap is therefore not shipped behavior.
A mod can only reach it by repurposing an unused gift family to carry effect 52 and gating that grant by quality, because a gift is the sole cap channel a data-only edit can drive.
The delivered mod drops the quality cap gift entirely and fixes the non-class cap at 85 with a class addend of 40; the design rationale and the delivered values are in [`../../DESIGN.md`](../../DESIGN.md) and [`../mod-status.md`](../mod-status.md).

## Quality and talent tier

At grant time the game picks a talent family from a pool, then picks a star tier for that family from `DT_PinZhiGoodNGStarWeight`, keyed by recruit quality.
The shipped weights are (asset-level verified):

| Quality rows | Star I weight | Star II weight | Star III weight |
| --- | --- | --- | --- |
| q0/q1 | 80 | 10 | 10 |
| q2/q3 | 10 | 80 | 10 |
| q4/q5 | 0 | 15 | 85 |

`DT_PinZhiGoodNGAddPr` is the grant cadence: it is keyed by level and gives one new positive talent at levels `10,20,30,40,50,60` with `{Pr=1.0, Count=1}` (asset-level verified).
All six quality rows ship identical, so quality does not change the shipped cadence.
The cadence adds a new gift; it never raises an existing gift's star. Per-level star upgrading is only the Training Ground `NGLevelTraining` track.

The delivered mod reshapes the star table so quality 5/4/3 maps to star III/II/I and reshapes the cadence so quality 3-5 carry a level-1 `Pr=1, Count=1` while quality 0-2 carry `Pr=0, Count=0`; this gates the class-talent tier by rarity and is mod design, not shipped behavior (see [`../../DESIGN.md`](../../DESIGN.md) and [`../mod-status.md`](../mod-status.md)).
Because the star table has only three magnitude tiers and the only numeric quality condition bag is `BP_Gift_IsPinZhi_4+_C`, shipped data cannot distinguish more than three quality-keyed magnitudes or any quality below 4.

## Item quality and crafting

Crafted and dropped items use the same six color tiers.
The item-quality tables are separate from recruit quality: a craft has its own random-quality bands and a proficiency decay curve.

### Crafting proficiency brackets

The community-documented bracket values (community, not confirmed in cooked data) are Bone/Hide **30**, Bronze **60**, Iron **90**, Steel **120**, and are the same for Weapon Crafting, Armor Crafting, and Craftsman.
Quality scaling is about **100% of a tier's quality at "halfway to the next tier"**, giving **45** for bone, **75** for bronze, and **105** for iron.
Flint's rarity trait adds **+10%**, which reaches 100% of a tier at tier parity (30/60/90).
Reliable Gold/Red Iron is reported to need about **90** plus the level-90 quality milestone perk.
These bracket and scaling numbers are community guidance; the recipe fields below are asset-level verified.

### Recipe quality fields

Recipes are Blueprints with native parent `HPeiFangBase`, under `/Game/Blueprints/PeiFang/**`.
`DT_ZhiZuo` (`/Game/Blueprints/DataTable/CaiJiBao/DT_ZhiZuo`, struct `CaiJiDaoJuBaoDataTable`, 43 rows) is a crafted-item drop-bag table, not the recipe-quality table.
The recipe-quality field is the CDO property `MakeRandPinZhiData`, and the proficiency decay is `SLDShuaiJianData`, whose struct `PeiFangSLDShuaiJianData` carries the proficiency-level band `SLDLvRange` and the decay coefficient `ShuaiJianRatio`.

`MakeRandPinZhiData.DaoJuRandPinZhiData` is an array of tiers, each `{DaoJuPinZhi, RandomBoundary {LowerBound, UpperBound}}`.
Common craftable recipes use cumulative boundaries `0-40 / 40-70 / 70-85 / 85-95 / 95-99 / 99-100`, mapping to `EDJPZ_Level1` through `EDJPZ_Level6`.
The recipe JSON field `quality_levels` is populated for 125 recipes and is always the full set `[1,2,3,4,5,6]`; recipes without random quality have `null`.

`SLDShuaiJianData` maps a `SLDLvRange` proficiency-level band to a `ShuaiJianRatio` decay coefficient, suppressing quality for crafters below the recipe tier.
Examples (asset-level verified):

```text
BP_PeiFang_WQ_Chui_3     20-30: 1.0, 30-40: 0.1, 40+: 0
BP_PeiFang_WQ_ChangGong_3  1.0 through 110-120, then 0.5, then 0.1
```

### Shifting the quality floor

A pure data edit cannot make the item-quality floor a smooth function of crafter proficiency, because the band boundaries are fixed per recipe and the only proficiency link is the decay ratio.
Two partial data-only options exist:

1. Shift the lowest band boundaries up so the worst roll is already an acceptable tier (a global floor, independent of proficiency).
2. Set every `ShuaiJianRatio` to `1.0` so proficiency no longer suppresses quality, then shift the bands.

A floor that rises smoothly with proficiency needs per-proficiency recipe variants or native/Blueprint logic.

## Related schema

| Asset | Struct | Rows | Key field | Value |
| --- | --- | --- | --- | --- |
| `DT_PinZhiGoodNGStarWeight` | `GoodNaturalGiftStarWeightMap` | 6 (q0-5) | `GoodNGStarPrMap` | star index -> weight |
| `DT_PinZhiGoodNGAddPr` | `LevelGoodNaturalGiftPrMap` | 6 (q0-5) | `LevelGoodNGPrMap` | level -> `{Pr, Count}` |
| `DT_PinZhiBadNGRemovePr` | `LevelBadNaturalGiftPrMap` | 6 (q0-5) | `LevelBadNGPrMap` | level -> `{Pr, Count}` |
| `CustomBossNaturalGiftStarWeight` | — | — | — | every quality -> `{3:100}`; referenced by `BP_BuLuo_Boss_Base` |
| `DT_PinZhiGoodNGStarWeight` etc. | — | — | — | path prefix `/Game/Blueprints/DataTable/NaturalGift/` |

All three `DT_PinZhi*` tables are path-rooted at `/Game/Blueprints/DataTable/NaturalGift/` (asset-level verified).
`DT_PinZhiBadNGRemovePr` ships `Pr` `0.30` (q0/1), `0.35` (q2/3), `0.40` (q4/5) with `Count=1`, keyed at levels `5,10,15,...,60`.

The only numeric per-quality condition bag in the shipped data is `BP_Gift_IsPinZhi_4+_C` (quality >= 4), used by the shipped `DT_GiftZhengMian` row `16012-16064-16068`.
There is no `BP_Gift_IsPinZhi_0`, `_1`, `_2`, `_3`, or `_5` bag, so shipped condition data cannot distinguish qualities below 4.
The main positive pool's condition set also lists `BP_Gift_IsZDZhiYe_PinZhi`, the only class-scoped quality condition bag; it combines the combat-class test with the quality gate rather than exposing a separate numeric threshold (asset-level verified).
The manager (`BP_ZiYuanGuanLiQi`) holds the quality tables and is a `RawExport`, so its native counters (`GoodNGMaxNum`, `PinZhiXingGePrMap`, defect min/max) are not UAssetAPI-editable.

## Foot-guns and limits

- **Quality-driven caps are only reachable through the gift mechanism.** No cap table is quality-keyed, so a quality cap is a grant, not a determined value; the grant can be probabilistic or absent, and the capture-time grant count is native and not fully measured.
- **A smooth quality-to-cap function is not expressible by data alone.** Magnitude comes only from the three star tiers in `DT_PinZhiGoodNGStarWeight`; a true six-step or continuous ladder needs new quality condition bags (`BP_Gift_IsPinZhi_0..5` Blueprint bytecode).
- **A no-grant outcome must come from the cadence.** The star table has only three tiers, so a "no gift" quality state is delivered by zeroing `DT_PinZhiGoodNGAddPr`, not by a fourth star row.
- **Item-quality floors are not smoothly proficiency-driven by data.** Only the global band shift and the `ShuaiJianRatio` decay are editable; a proficiency-rising floor needs native/Blueprint work.
- **An archetype table can seed a cap.** `DT_CustomizeNPC.CustomizeProfMaxLv` seeds `ProfMaxLvl_Init` on generation, bypassing the base roll and the class bonus; see [proficiencies-and-caps](proficiencies-and-caps.md) "The archetype cap seed" for the mechanism and the DLC table.
- **Existing saves keep stored caps.** The deserializer setter `0x41c7cb0` re-persists an already-seeded `Init` on load, so only recruits generated after a change reflect it.
- **Quality 4+ is the only threshold data can test.** There is no condition bag for qualities 0-3, so quality cannot be discriminated below 4 by pool conditions.
- **A repeated effect-52 grant de-duplicates by gift id** (`0x41c8e50`), so granting the same family twice does not reliably stack the cap bonus (unverified).
- **The archetype-seed and `Skilled Hand`/`Expert Craftsman` correlation is not a cap cause.** Those titles are `ProfExpInc` (value 51) and write only `ProfExp`, not the cap; their apparent correlation with higher caps is that the archetype, origins, and titles are drawn in one generation pass (inferred).
- **Repurposing a gift row needs `NameMap` surgery.** Reusing an unused family such as `160751`/`160752`/`160753` and adding `ENaturalGiftEffect::ProfMaxLevelInc` requires appending the enum `FName` to the asset `NameMap`; without it UAssetAPI fails to re-parse.
