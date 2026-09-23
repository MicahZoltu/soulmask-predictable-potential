# Talents and Natural Gifts

This is the authoritative reference for Soulmask's natural-gift (talent) system as it is shipped.
It covers the effect table, the selection pools, the assignment pipeline, the counts and counters, and the class, tribe, origin, title, archetype-seed, preference, and defect subsystems.
Confidence tags are used throughout: **asset-level verified** means read directly from a cooked asset or recovered from the shipping binary, **in-game verified** means observed in a running game, **inferred** means reconstructed from structure or indirect evidence, and **unverified** means the evidence is incomplete.
The mod's chosen talent composition is a design choice documented in [`../../DESIGN.md`](../../DESIGN.md) and [`../mod-status.md`](../mod-status.md); this reference states the shipped behavior it edits.

Related references: [quality and rarity](quality-and-rarity.md), [proficiencies and caps](proficiencies-and-caps.md), [weapon mastery](weapon-mastery.md).

## 1. Overview

A natural gift, called a talent in the UI, is a persistent effect attached to a tribesman.
Gifts come from an effect table, `DT_GiftZongBiao`, and are handed out by several independent subsystems: the general positive pool, the class-origin pool, the birth-tribe pool, the title pool, the personality pool, the experience pool, and the preference pool.
Every gift family has up to three star tiers, I, II, and III.
A family is a base id whose three star rows are `<family><star>`; the family key is `floor(id / 10)` and the star is the last digit, so family `16039` is rows `160391`, `160392`, `160393` (**asset-level verified**).

The shipping census of `DT_GiftZongBiao` (**asset-level verified**):

| Metric | Value |
| --- | --- |
| Effect rows | 1319 |
| Families | 442 |
| Star 1 / 2 / 3 rows | 427 / 434 / 458 |
| Source `Normal` | 808 |
| Source `XiHao` (preference) | 288 |
| Source `BornBuLuoCiTiao` (birth tribe) | 130 |
| Source `BornChuShen` (origin) | 42 |
| Source `ChengHao` (title) | 30 |
| Source `XingGe` (personality) | 18 |
| Source `JingLi` (experience) | 3 |
| Learnable rows (`LearnedNGID != 0`) | 676 |
| Upgradable rows (`UpgradeNGID != 0`) | 450 |
| Learnable families | 226 |

The parsed `clan` field distributes the 1319 rows across tribes as `claw` / `flint` / `fang` / `wolf` / `horn` / `exile` / `dlc` / none = `42 / 47 / 52 / 39 / 42 / 15 / 317 / 765` (**asset-level verified**, computed from `Game/Parsed/traits.json`).

Origin (`500xxx`, `510xxx`), birth-tribe (`4xxxxx`), title (`600xxx`), personality (`300xxx`), experience (`700xxx`), and preference (`8xxxxx`/`9xxxxx`) rows are not learnable and carry `LearnedNGID = 0` and `UpgradeNGID = 0`; learnable rows carry a `LearnedNGID` and an `UpgradeNGID` chain.
The census is a mix of selection categories and fixed identity categories; only the `Normal` category draws from the main positive pool and only it consumes the positive-talent budget (see section 6).

## 2. `DT_GiftZongBiao` row schema

`DT_GiftZongBiao` lives at `/Game/Blueprints/DataTable/NaturalGift/DT_GiftZongBiao` and uses struct `NaturalGiftEffectConfig`, one row per star tier of every family (**asset-level verified**).

| Field | Meaning |
| --- | --- |
| `Name` | Row label; the DataTable row name carries the real numeric id (`ID` is `0` on every row) |
| `Star` | Star tier `1`/`2`/`3` |
| `Title` | Localization `TextKey` (32-hex) for the talent name |
| `Desc` | Localization `TextKey` for the effect description |
| `MoHuDesc` | Localization `TextKey` for the vague/obscured description |
| `NGEffectSource` | Source category: `Normal`, `BornBuLuoCiTiao`, `BornChuShen`, `ChengHao`, `XiHao`, `XingGe`, `JingLi` |
| `NGEffect` | Effect discriminator, `ENaturalGiftEffect::*` |
| `NGEffectAttrType` | Affected attribute, `EAttrType::*`, `None` for special effects |
| `NGEffectVal` | Effect magnitude, float |
| `NGEffectAttrValOrPer` | Bool, value versus percentage |
| `NGEffectPr` | Proc probability, float |
| `NGEffectCD` | Cooldown, float |
| `NGEffectWeiSuiJiPr` | Accumulated PRD probability, float |
| `NGGESelf` | Bool, apply to self versus target |
| `NeedClearGE` | Bool, remove the previous gameplay effect |
| `NGNeedTimer` | Bool, needs a timer |
| `TryActiveAfterAdd` | Bool, activate immediately on add |
| `CanBeClearCD` | Bool, cooldown clearable |
| `bYuCeNGEffectPrRes` | Bool, predict the proc result |
| `NGProfTypeList` | `EProficiency::*` array, the proficiencies the effect targets or requires |
| `WeaponDemand` | `EWuQiLeiXing::*` map, required weapon |
| `TiaoJianBaoList` | Condition-bag Blueprint class array (`BP_Gift_*_C`) |
| `NGGEClassList` | Gameplay-effect classes applied |
| `LearnedNGID` | Id this row registers as learned under, `0` for none |
| `UpgradeNGID` | Next star tier in the family, `0` for terminal |
| `BaseWeight` | Selection weight, uniformly `100` across all 1319 rows |
| `Pic` | Icon object reference |
| `ID` | Int, `0` on every row; the row name is the real id |

`BaseWeight` is uniformly `100`, so it carries no shipped differentiation.
The talent's display text is resolved from the localization `TextKey`; the inline string in the asset is not authoritative at runtime (see section 16).
Progression-relevant effects are driven by `NGEffect`, `NGEffectVal`, and `NGProfTypeList`; see section 3.

## 3. Effect enums

`ENaturalGiftEffect` is the effect discriminator on every row.
Its numeric values run `0..133` and the sentinel `ENaturalGiftEffect::Max = 133`.
The binary name/value table puts `ProfExpInc` at file offset `0x14ec6c0`, `ProfMaxLevelInc` at `0x14ec6d0`, and `Max` at `0x14ecbe0`, and the `ProfMaxLevelInc` name pointer is at `0xc329bb` (**inferred**).
The cooked DataTables use 125 of the 134 values, and two values matter for progression:

| Enum | Value | Behavior |
| --- | --- | --- |
| `ENaturalGiftEffect::ProfExpInc` | 51 | Growth-rate multiplier on proficiency XP; never writes a cap field |
| `ENaturalGiftEffect::ProfMaxLevelInc` | 52 | Flat proficiency-cap add; writes and clamps the effective cap |
| `ENaturalGiftEffect::Max` | 133 | Enum sentinel, not an effect |

The shipping census of `DT_GiftZongBiao` is exactly **47** `ProfExpInc` rows and **zero** `ProfMaxLevelInc` rows (**asset-level verified**).
The 47 effect-51 rows are the class origins and the growth titles; none of them is a shipped cap modifier.
Other named effects found in the shipped data include `AttrInc`, `DaoDamageInc`, `DamageDecWithTiaoJian`, `QieShiSuDu` (stone-cutting speed), and the `ChangTaiXiaoGuo` mood family used by preferences.

The handler addresses, the `FProficiencyData` offsets, the recompute loop, the sum helper, and the self-exclusion rule for effect 51/52 belong to the cap reference; see [proficiencies and caps](proficiencies-and-caps.md) "Other cap modifiers".
The talent-side consequences are that effect 51 changes a growth rate while effect 52 changes a cap, and that applying any gift, including an effect-51 row, still runs the shared cap recompute loop over that gift's own `NGProfTypeList`.
An effect-51 row therefore never writes a cap value of its own but can re-expose a stored `ProfMaxLvl_Init` on its target proficiencies; the observed per-recruit cap deviations correlate with effect-51 talent lists because those lists select which proficiencies are recomputed, not because the growth value reaches the cap (**inferred**).
The quality-keyed cap channel that effect 52 makes possible is documented in [quality and rarity](quality-and-rarity.md) "The quality-to-cap gift channel (`ProfMaxLevelInc`)".

## 4. Selection pools and gates

The positive, custom, negative, and preference pools use struct `NaturalGiftConfig`, which has exactly four fields: `TiaoJianBaoList` (condition gate for the pool row), `NGDetailList` (candidate gifts), `ClanDemand` (tribe demand), and `ZhiYeDemand` (profession demand).
`ClanDemand` and `ZhiYeDemand` are empty in every shipped pool row, so pool membership is not weighted through those fields; class and tribe gating is bytecode inside the condition-bag Blueprints referenced by `TiaoJianBaoList` (**asset-level verified**).
`NGDetailList` entries use struct `NaturalGiftDetail` with `ID` (the `DT_GiftZongBiao` row name), `Type` (the family id), `NoteStr` (a Chinese label), and `IsGood`.
A pool row lists all three star rows of each family, so family selection is one draw and star selection is separate (section 7).
The effect rows and the pool rows together reference 125 distinct condition bags (**asset-level verified**).

Shipped pool tables (**asset-level verified**):

| Asset | Rows | Detail entries | Role |
| --- | --- | --- | --- |
| `DT_GiftZhengMian` | 30 | 680 | Global positive pool, the manager default |
| `DT_GiftZhengMian_Custom` | 12 | 253 | Positive override pool, per-character `ChengZhangComponent.DT_GoodNGConfig` (read proven; write unproven on Linux) |
| `DT_GiftFuMiann` | 42 | 126 | Negative defect pool, double `n` in the shipped build |
| `DT_GiftXiHaoBiao` | 49 | 294 | Preference pool, likes and aversions |
| `DT_GiftFuMian_Boss` | 0 | 0 | Empty |
| `DT_GiftLengLuoBiao` | 150 | — | Deprivation/neglect reactions, struct `NaturalGiftEffectConfig` |
| `DT_XiHaoBiaoXian` | 204 | — | Preference text and reaction montages, struct `XiHaoConfig` with `XiHaoTextList` / `LengLuoTextList` |

The 30-row global positive pool splits into roughly 14 class-gated rows and 16 generic rows; a large DLC block of 72 families is gated by `BP_Gift_IsDLCNpc_ZD_C` and is excluded from base-map play.
The region boss pools are 23 separate `DT_GiftZhengMian_<camp>_Boss` tables holding curated unconditional star-III-only details, for example `PingDingShan` grants `130093`, `160023`, `160473`, `160623`; they bypass the star table because `CustomBossNaturalGiftStarWeight` maps every quality to `{1:0, 2:0, 3:100}` (**asset-level verified**).
The count of 23 is the direct asset census; an older region/camp list that implies 15 is not the boss-table count and should not be used (**inferred** for the camp-to-table correspondence).
The negative pool's detail `Type` is the linked positive family, not the negative row's own family, so `floor(id / 10)` is the reliable family key for negatives.
No condition bags gate any negative row.

Class condition bags in the positive pool include `BP_Gift_IsZDZhiYe_C` (any combat), `BP_Gift_IsSHZhiYe_C` (any production), `BP_Gift_IsZDZhiYeZhanShi_C` (Warrior), `BP_Gift_IsZDZhiYeLieShou_C` (Hunter), `BP_Gift_IsZDZhiYeWeiShi_C` (Guard), `BP_Gift_IsZDZhiYe_LiZhua_C`, `BP_Gift_IsZDZhiYe_HuoShi_C`, `BP_Gift_IsZDZhiYe_DuYa_C` (production sub-roles), and `BP_Gift_IsZhiYeKuLi_C` / `BP_Gift_IsSHZhiYeZaGong_C` / `BP_Gift_IsSHZhiYeJiangRen_C` (origins).
Other pool-level gates include `BP_Gift_IsPinZhi_4+_C` (numeric quality), `BP_Gift_IsRandom_C`, `BP_Gift_IsYuFenPeiDengJi_C`, the Wolf/Horn/DLC tribe gates, and body-type and level gates (**asset-level verified**).

## 5. Assignment pipeline and timing

Gifts are assigned during character generation at spawn, not at recruitment (**inferred**, high confidence).
The one-time barbarian initialization is `0x41b7410`, guarded by bit 0 of the byte at `0xb0(%rdi)` so it runs once and by character type `3` at `0xf8`.
Within it, the proficiency cap initializer `0x41b7730` runs first, then `0x41b8150`, `0x41b83c0`, and finally the positive-gift catch-up roller `0x41b8ee0`.
Because cap initialization precedes the gifts, a granted cap gift is not wiped by cap initialization.

The level catch-up roller `0x41b8ee0` loops a level counter from `1` to the character's current level and calls the positive roller `0x41ca960` for each eligible level.
A recruit spawned at level 11..20 therefore receives rolls for every level up to 20 at spawn, including the level-10 roll.
The same function is invoked from the level-up path at `0x41b8dc9` for levels gained after recruitment.

The positive roller `0x41ca960(character, level)` requires a barbarian target, chooses the pool table from the character component at `0x6a0(%r13)` when present and otherwise from the manager at `0xa88` (`DT_GoodNGConfig`), uses the effect table at `0xa78`, and uses the cadence table `DT_PinZhiGoodNGAddPr` at `0xa98`.
It looks up the per-level probability, compares it with a native RNG value, counts the character's existing positive gifts against `GoodNGMaxNum` at `0xa90`, collects candidate pool rows with `0x41c8140`, tests each row's condition bags with `0x43a2360`, and grants the selected detail through `0x41c8ba0`.

The cadence table `DT_PinZhiGoodNGAddPr` is keyed by quality `0..5` and its rows are identical: levels `10,20,30,40,50,60` map to `{Pr = 1.0, Count = 1}`.
The level-10 grant is therefore guaranteed once the character reaches level 10, whether at spawn through the catch-up loop or by leveling afterward.

An ordinary guard is `BP_SuiJi_BuLuo_C`; its `ChengZhangComponent` does not serialize `DT_GoodNGConfig`, so it falls through to the manager's global `DT_GiftZhengMian`.
Region bosses instead serialize `DT_GoodNGConfig` on the component and use `DT_GiftZhengMian_<camp>_Boss`.

Testing consequences follow directly: a freshly spawned tribesman must be used per test, because an already-recruited tribesman keeps the gifts and cap it already has.
The pak affects only barbarians generated after it is installed, and a location not yet visited in the session must be used so the spawner runs under the modified assets.
`CreateSpecifiedMan` and `CreateSWByClass` do not receive natural gifts, so natural camp recruits are the correct test subject.
The runtime command `AddNG <DT_GiftZongBiao row name>` applies a gift to the selected character directly and exercises the apply path.

## 6. Talent-count budget

`GoodNGMaxNum` is the cap on positive natural gifts.
It is `6` in the cooked manager `Default__BP_ZiYuanGuanLiQi_C`, serialized as an `IntProperty` at raw manager offset `40312`, with the native constructor default `5` at object offset `0xa90` (**asset-level verified** for the cooked value, **inferred** for the native default).
The manager is a `RawExport`, so this counter cannot be edited with a typed UAssetAPI value edit; changing it requires a raw byte patch.

The roller's count loop tests the gift row's `NGEffectSource` byte at row offset `0xd` and increments the count only when the source byte is `0`, `Normal` (**inferred**).
The enum value table at `0x14ecc30` declares the sources in this order:

```text
ENaturalGiftSource::Normal          0
ENaturalGiftSource::BornChuShen     1
ENaturalGiftSource::BornBuLuoCiTiao 2
ENaturalGiftSource::ChengHao        3
ENaturalGiftSource::JingLi          4
ENaturalGiftSource::XiHao           5
ENaturalGiftSource::XingGe          6
ENaturalGiftSource::GuanXi          7
```

Only `Normal` gifts consume a `GoodNGMaxNum` slot.
Origin (`BornChuShen`), birth-tribe (`BornBuLuoCiTiao`), title (`ChengHao`), experience (`JingLi`), personality (`XingGe`), and preference (`XiHao`) gifts do not count against the cap.
The `+1` talent per 10 levels cadence comes from `DT_PinZhiGoodNGAddPr` and is already guaranteed (`Pr = 1.0`, `Count = 1`) at levels 10 through 60.

A recruit can display at most **12** talents: up to 6 `Normal` source gifts from the cadence, 1 Origin, 1 tribal, 1 Battle-Tested, and up to 3 preferences.
It rises to **14** only if a title and a personality talent both also land.
Because Battle-Tested reaches only the combat classes by default (section 11), a production-class recruit's shipped maximum is one lower.
The class talent is drawn from the `Normal` positive pool, so it is one of the six, not an addition.

## 7. Star tiers

Star selection is separate from family selection and is keyed by recruit quality through `DT_PinZhiGoodNGStarWeight` (struct `GoodNaturalGiftStarWeightMap`), which has six rows keyed by quality `0..5` (**asset-level verified**):

| Quality band | Star weights |
| --- | --- |
| q0 / q1 | `{1: 80, 2: 10, 3: 10}` |
| q2 / q3 | `{1: 10, 2: 80, 3: 10}` |
| q4 / q5 | `{1: 0, 2: 15, 3: 85}` |

The star is fixed at the moment the gift is granted and never advances with character level.
Character level grants a new talent, never a tier-up; the only shipped tier-up path is the Training Ground's `ETrainingType::NGLevelTraining` track.
That track is configured on `BP_JianZhuTrainingGround.TraningExpAddMap` with `UpgradeExpConfig` of `[{UpgradeLvMin: 0, UpgradeLvMax: 2, UpgradeExp: 7200}, {UpgradeLvMin: 2, UpgradeLvMax: 3, UpgradeExp: 14400}]`, gated by `CoachLvRequired = 50` and `HoldCharacterCount = 2`.
The native replicated state is `CurUpgradeNGID` / `CurUpgradeLevel` / `OnRep_CurUpgradeLevel` and the guild log literal is `EGongHuiRiZhi::TrainingUpgradeNG`.
The `UpgradeNGID` chain links I→II→III and the terminal star-III row has `UpgradeNGID = 0`; 226 learnable families carry the chain.
Boss pools bypass the star table entirely and always grant star III.
The born origin and birth-tribe selectors also draw the literal star rows listed in their own `NGIDList` entries and never consult `DT_PinZhiGoodNGStarWeight`, so a per-quality tier for an origin or a tribal talent is not data-possible; its tier is whatever star row the entry names (**asset-level verified**).

The shipped star table has only three magnitude tiers, so a no-grant outcome for the lowest qualities cannot come from a fourth star row; the only data surface for it is zeroing the per-quality gift cadence in `DT_PinZhiGoodNGAddPr`.
The mod's quality-to-class-talent-tier mapping and its no-grant outcome are design choices covered in [`../../DESIGN.md`](../../DESIGN.md) and [`../mod-status.md`](../mod-status.md).
The only numeric quality condition bag is `BP_Gift_IsPinZhi_4+_C`; no `IsPinZhi_0..3` or `IsPinZhi_5` bag exists.

## 8. Origins

Origins are the class-identity gifts from source `BornChuShen`; the census is 42 rows over 14 families.
Seven are positive and seven are negative penalties.

| Entry | Positive family | Star rows | Shipped target list shape |
| --- | --- | --- | --- |
| Laborer | `50001` | `500011/2/3` | `FaMu, CaiKuang, ZhongZhi, CaiShou, BuZhuo, YangZhi, TuZai` |
| Porter | `50002` | `500021/2/3` | `FangZhi, ZhiTao, PaoMu, QieShi, JianZhu, RouPi, PouJie, RongLian` |
| Craftsman | `50003` | `500031/2/3` | `QiJu, WuQi, JiaZhou, LianJin, ZhuBao, PengRen, YanMo` |
| Fighting (Warrior) | `50004` | `500041/2/3` | `Dao, Chui, QuanTao, ShuangDao, DaJian` |
| Hunting (Hunter) | `50005` | `500051/2/3` | `Gong, Mao, Dao, ShuangDao, QuanTao` |
| Guard | `50006` | `500061/2/3` | `DaJian, Dao, Mao, Gong, DunPai` |
| Survival | `50007` | `500071/2/3` | empty `NGProfTypeList`, unused in play |

The negative families are `51001` (work warm-up), `51002` (chore warm-up), `51003` (manual warm-up), `51004`/`51005`/`51006` (obsessed with fighting/hunting/guarding), and `51007` (poor survival); their values are negative and they target the corresponding growth proficiencies.
Every origin row uses `ENaturalGiftEffect::ProfExpInc` (51) with positive magnitudes `+0.50 / +0.60 / +0.75` for stars I/II/III and negative magnitudes `-0.25 / -0.35 / -0.50`.
Origins grant a proficiency growth-rate bonus, and the `NGProfTypeList` field carries the exact target proficiencies; origins do not write a proficiency cap.

Origins are assigned through `Default__BP_ManRenRandomConfig_C.BornChuShenCiTiaoList`, a six-entry array with one entry per class.
Each entry is condition-gated by its class bag and lists the matching positive family at `NGQuanZhong = 70` per star row plus every foreign negative family at `10` per star row.
The matching origin therefore carries `3 × 70 = 210` weight against `15 × 10 = 150` for the fifteen rival star rows, so the positive class origin wins about 58% of draws (**asset-level verified** for the weights, inferred for the effective probability).
The `RandomNG` struct used by the entries carries `NGID`, `NGQuanZhong`, and `IsGoodNG`.

The class origin gates are:

| Class | Condition bag |
| --- | --- |
| Laborer | `BP_Gift_IsZhiYeKuLi_C` |
| Porter | `BP_Gift_IsSHZhiYeZaGong_C` |
| Craftsman | `BP_Gift_IsSHZhiYeJiangRen_C` |
| Warrior | `BP_Gift_IsZDZhiYeZhanShi_C` |
| Hunter | `BP_Gift_IsZDZhiYeLieShou_C` |
| Guard | `BP_Gift_IsZDZhiYeWeiShi_C` |

Setting every `510xxx` weight to `0` in each entry forces the positive class origin deterministically; pinning the positive family's star-III row to `100` and the other two to `0` forces star III.

## 9. Titles (`ChengHao`)

Titles are the `ChengHao`-source gifts, 30 rows over title families `600xxx`.
Each title row is a single star-III, non-learnable `ProfExpInc` row that raises the growth rate of a small proficiency set, and a recruit receives at most one (**inferred**).
The observed title rows (**asset-level verified** for the rows and values, the two granters, and the rate map; **inferred** for the title-class membership of the three unnamed rows):

| Row | Name | Effect | `NGProfTypeList` | Granter |
| --- | --- | --- | --- | --- |
| `600021` | Expert Craftsman (手工能人) | 51, `+0.50` | `PengRen, QiJu` | `Default__BP_CH_SGDS_C.NaturalGiftList = [600021]` |
| `600022` | Skilled Hand (精造巧手) | 51, `+0.50` | `WuQi, JiaZhou, LianJin, ZhuBao, YanMo` | `Default__BP_CH_JZDS_C.NaturalGiftList = [600022]` |
| `600061` | Skilled Work Expert | 51, `+0.50` | `FangZhi, ZhiTao, RouPi, PouJie` | a `BP_CH_*` title class |
| `600062` | Manual Labor Expert | 51, `+0.00` | `PaoMu, QieShi, JianZhu, RongLian` | a `BP_CH_*` title class |
| `600071` | unnamed | 51, `+0.50` | `FaMu, CaiKuang` | a `BP_CH_*` title class |

Titles are drawn from two CDO pools on `Default__BP_ManRenRandomConfig_C`: `BornCommonChengHaoList`, which holds at least 8 title Blueprints at weight `10` each, and `BornTiaoJianChengHaoList`, which holds 22 condition-gated entries.
Both use struct `ChengHaoUnit` (a `ChengHaoClass` plus a `ChengHaoQuanZhong`).
The grant chance is the quality-keyed `BornGetChengHaoRateMap`, which ships `10/10/15/15/35/35` for quality `0..5` (**asset-level verified** for the map; **inferred** for the list contents and counts).
The chosen `ChengHaoClass` then grants its `NaturalGiftList` row.
A title's `NaturalGiftList` can name any `ChengHao`-source `DT_GiftZongBiao` row, not only the prof-growth rows in the table above; for example the common title `BP_CH_PuTong_FTSS` grants row `600015` (Axe Killer) (**asset-level verified**).
The shipped `ChengHao` families also include `60001`–`60007`, which are not drawn from the `ProfExpInc` title granters; `60005` is Famous Trash (`AttrInc`, Max Morale `-50%`) (**asset-level verified**).
A title does not consume a `GoodNGMaxNum` slot, because its source byte is `ChengHao` (3).

## 10. Tribe exclusives and class exclusives

Class exclusives are shipped `DT_GiftZhengMian` pool rows that are already gated by a class condition bag, including Warrior `130011-130041-130051-130061-130071-16069`, Hunter `130011-130021-130031-130051-130071` and `15002-15008-15009-15011`, Guard `130011-130021-130031-130061-16089`, Laborer `16008-16048-16058-16090-16065-16003`, Porter `16037-16044-16092-16093-16062-16095-16097`, and Craftsman `16050-16052-16060-16013-16094-16035`.
The mod's chosen per-class and per-tribe family sets are design choices specified in [`../../DESIGN.md`](../../DESIGN.md) and reflected in [`../mod-status.md`](../mod-status.md); the shipped facts a modder edits are the pool rows and gates below.
Class gating is a function of `EClanZhiYe`, whose exact enum mapping is (`inferred`):

| `EClanZhiYe` | Class |
| --- | --- |
| `1` | Warrior |
| `2` | Hunter |
| `3` | Guard |
| `4` | Laborer |
| `5` | Porter |
| `6` | Craftsman |

`BP_Gift_IsZDZhiYe_C` is the combat set `{1, 2, 3}` and `BP_Gift_IsSHZhiYe_C` is the production set `{4, 5, 6}`.
The mapping is load-bearing: `ZDZhiYe` means combat profession and `SHZhiYe` means production profession, so a gate that looks universal may in fact cover only the combat classes.

The Porter and Craftsman class rows carry the crafting-speed families, and each family targets one proficiency (**asset-level verified**):

| Family | Name | Target proficiency | Magnitude |
| --- | --- | --- | --- |
| `16074` | Accelerate Wood & Stone | Wood & Stone (`PaoMu`) | `-10/20/30%` |
| `16076` | Accelerate Kiln | Kiln (`RongLian`) | `-10/20/30%` |
| `16077` | Accelerate Leatherworking | Leatherworking (`RouPi`) | `-10/20/30%` |
| `16078` | Accelerate Weaving | Weaving (`FangZhi`) | `-10/20/30%` |
| `16079` | Accelerate Potting | Potting (`ZhiTao`) | `-10/20/30%` |
| `16081` | Crafting Speed Up | Tools (`QiJu`) | `-11/25/43%` |
| `16082` | Accelerate Weapon Crafting | Weapon Crafting (`WuQi`) | `-10/20/30%` |
| `16083` | Accelerate Armor Crafting | Armor Crafting (`JiaZhou`) | `-10/20/30%` |
| `16086` | Accelerate Alchemy | Alchemy (`LianJin`) | `-10/20/30%` |
| `16087` | Accelerate Cooking | Cooking (`PengRen`) | `-10/20/30%` |

The magnitudes are the star I/II/III values on the effect row's `NGEffectVal`.

Tribe exclusives are not in the positive pool at all.
They are assigned at birth from `BP_ManRenRandomConfig.BornBuLuoCiTiaoMap`, which is keyed by `EClanType` and holds a `CiTiaoList` of region-conditioned `NGIDList` families, each weighted 50 per star.
The tribal selector draws those listed star rows directly and does not consult `DT_PinZhiGoodNGStarWeight`, so each region entry's tier is whatever star row its `NGIDList` names (**asset-level verified**).
Tribe identity is `EClanType`; there is no identity `DT_Tribe` table (the `DT_Tribe` under `/Game/AdditionMap01` is a DLC drop-bag).

| `EClanType` | Tribe | Base families | Biome / DLC families |
| --- | --- | --- | --- |
| `A` | Claw (利爪) | `40001`, `40002`, `40003` | `42009/10` radiation, `42015/16` heat, `42003/04` cold |
| `B` | Flint (燧石) | `41001`, `41002`, `41003` | `42011/12`, `42017/18`, `42005/06` |
| `C` | Fang (毒牙) | `42001`, `42002` | `42013/14`, `42019/20`, `42007/08` |
| `F` | Wolf / Desert Wolf (荒狼), DLC | none | `42050`–`42055` |
| `E` | Horn / Savage Horn (蛮角), DLC | none | `42060`–`42065` |
| `NONE` | Exile / Outcast (流放者) | none | `42040` cold, `42041` radiation, `42042` heat, `42070/71` DLC |

The `QuYu_0` base entry is conditioned on the home region; biome variants use region conditions `QuYu_3_HY` radiation, `QuYu_4_HS` hot, and `QuYu_5_XS` cold.
Outcast has no `QuYu_0` entry, so a base-map Outcast exclusive requires appending a `CiTiaoList` entry.
Class and tribe gating is bytecode in the condition bags, not pool weights; editing which existing bag a row references is a value edit, but changing what a bag tests is a Blueprint edit.

## 11. Battle-Tested (Experience)

Battle-Tested is family `70001`, rows `700011`/`700012`/`700013`, source `ENaturalGiftSource::JingLi`, effect `ENaturalGiftEffect::DamageDecWithTiaoJian`, values `0.4 / 0.5 / 0.6`, and condition `BP_Gift_IsChuZhan_C` (it reduces damage taken while deployed).
It is assigned through `BP_ManRenRandomConfig.BornJingLiCiTiaoMap`, a map with one entry per `EClanType`.
Every entry gates on `BP_Gift_IsZDZhiYe_C`, lists `700011/12/13` at `NGQuanZhong = 50`, and is enabled by `JingLiCiTiaoGaiLv = 1`.

Because `BP_Gift_IsZDZhiYe_C` is the combat set `{1, 2, 3}`, Battle-Tested is **not** universal: it reaches Warrior, Hunter, and Guard only, and the production classes get none by default.
The map key is `EClanType`, not class, so its entries cannot give different classes different tiers, and each `RandomNG` struct carries only `ID`/`NGQuanZhong`/`IsGoodNG`.

## 12. Preferences

Preferences are mood-only flavour traits from source `XiHao`, stored in the single mixed pool `DT_GiftXiHaoBiao` (49 rows, 294 detail entries).
Preference families number 96 across `DT_GiftZongBiao`: 50 like families with ids `80xxxx` (`IsGood = true`) and 46 aversion families with ids `90xxxx` (`IsGood = false`).
Every `XiHao` effect row has `NGEffectVal = +0` with `ChangTaiXiaoGuo`-family effects, so no preference touches combat, production, caps, or proficiency (**asset-level verified**).
`DT_XiHaoBiaoXian` (204 rows, struct `XiHaoConfig`) maps a preference id to its `XiHaoTextList` / `LengLuoTextList` and reaction montages, and `DT_GiftLengLuoBiao` (150 rows) holds deprivation/neglect reactions.
Concrete preference ids (**asset-level verified**): like rows `80001`–`80671` and aversion rows `90001`–`90601`, each carrying a `BP_Gift_XiHao_*` condition bag; the like set covers food (`80001`–`80007`), gear (`80411`–`80461`), weather (`80081`/`80091`/`80101`), activity (`80111`, `80301`, `80511`), herds and leaders (`80521`, `80531`–`80611`), water and temperature (`80551`, `80561`–`80601`), and animals and waste (`80541`–`80651`, `80661`, `80671`), and the aversion set mirrors it.
Two shipped oddities: the sauced-meat like `80005` duplicates `80003`, and aversion `90005` (fruits and vegetables, `BP_Gift_XiHao_GuoShu_C`) has no like counterpart.

The count is native, not asset-configured: `HZiYuanGuanLiQi` holds `XiHaoRandomMinNum = 0` at object offset `0xad0` and `XiHaoRandomMaxNum = 3` at `0xad4`, both native fields absent from the cooked manager `NameMap`.
The roll is `0x44576e0(manager, character)`, called once from the character-initialization sequence at `0x487a163`.
It reads the count pair, resolves the pool through `manager+0xac0` (`DT_XiHaoConfig` → `DT_GiftXiHaoBiao`), collects eligible rows, draws `N` with a weighted selector (`0x4104a50`), and applies each through `0x41c8760`, de-duplicating against already-held preferences by family.
There is one pool pointer and one count pair: likes and aversions are distinct rows in the same pool, selected by the same draw, with no per-polarity count and no guarantee that a roll returns at least one like and one aversion.

Preferences do not consume a `GoodNGMaxNum` slot, because the count loop increments only for `Normal`-source gifts.
The maximum of three preferences is independent of the six positive slots.
Changing the count or forcing a polarity split requires a mechanism change or a raw patch of `0xad0`/`0xad4`, not a value edit.

## 13. Defects and the ban list

Defects are the negative pool `DT_GiftFuMiann` (42 rows, 126 detail entries, double `n`).
Each of the 42 rows carries one effect family's three star rows, and no condition bags gate any negative row.
A defect row uses the linked positive family as its detail `Type`, so defect family `20001` contains rows `200011/12/13`; row `200011` is "Slow Pace", effect `AttrInc`, value `-0.05` (move speed) (**asset-level verified**).
The starting defect count is native: `BadNGRandomMinNum = 0` and `BadNGRandomMaxNum = 5` at object offsets `0xab8`/`0xabc`, initialized by the manager constructor, so a recruit rolls 0 to 5 defects at generation.

Defect removal is driven by `DT_PinZhiBadNGRemovePr`, a six-row table keyed by quality `0..5`.
Each row maps character levels `5, 10, 15, …, 60` to `{Pr, Count}`, with `Pr = 0.30` for quality 0/1, `0.35` for quality 2/3, and `0.40` for quality 4/5.
The resulting defect burden, computed from the native count range and this removal table (**inferred**):

| Level | Worst-case remaining/removed (start 5) | Expected remaining (q0/1) |
| --- | --- | --- |
| 5 | 4/0 | 3.50 |
| 10 | 3/0 | 2.45 |
| 15 | 2/0 | 1.71 |
| 20 | 1/0 | 1.20 |
| 25 | 0/0 | 0.84 |
| 30 | 0/0 | 0.59 |
| 35 | — | 0.41 |
| 40 | — | 0.29 |
| 50 | — | 0.14 |
| 60 | — | 0.07 |

Because the defect count and the removal table are native manager fields or counters, they are not typed-editable through UAssetAPI; the manager is a `RawExport`.
Retiring the defect pool by deleting the rows of `DT_GiftFuMiann` is the value-edit alternative to a raw patch of `BadNGRandomMaxNum`.

The mild-defect and exclusion guidance is a mod-curation choice rather than shipped behavior, and the delivered mod retires the defect pool entirely (see [`../mod-status.md`](../mod-status.md)).
For reference, the low-magnitude, non-behavioural defect families used by that curation are `20001` (Slow Pace, move speed −5%), `20002` (Weak Attack, attack −5%), `20005` (Injury Worsening, injury reduction −3%), `20006` (Poor Health, max HP −3%), `21001` (No Load Wanted, load −20%), and `25004` (Clumsy, stamina cost −10%).
The families to avoid or globally exclude are the leveling and proficiency-growth penalties `22005` (Slow Growth, EXP −20%) and `51001`/`51002`/`51003` (origin work/chore/manual warm-ups, growth −25%), the harsh combat defects `22001`, `25007`, `25010`, and the class-matched weapon damage reductions `23001`–`23010`; the choices are a judgment about playability, not a game rule.

`DT_TalentToBeBanned` lives at `/Game/Data/DataTables/DT_TalentToBeBanned` with struct `TalentToBanned`, 71 rows and 211 banned ids (**asset-level verified**).
A ban entry names a star id of a family.
The ban does not stop a curated pool grant: 33 of the 43 distinct ids used by the region boss pools are on the ban list, and those pools still grant them.
The exact consumer of the table (which of its `BannedTalentID` / `BannedTrueTalentID` fields the runtime reads, and whether it blocks random grants, learn/transfer, or both) was not isolated (**inferred**, medium confidence).

## 14. Personality rows

Personality talents are source `XingGe` (`300xxx`, 18 rows) and are normally absent from retail content because the `DT_XingGeConfig` table is not cooked.
A personality row carries a `ChangTaiXiaoGuo`-family effect with value `+0`, so it contributes no proficiency cap and no growth bonus.
The six personality candidate families are `30001` Gentle, `30002` Cautious, `30003` Aggressive, `30004` Manic, `30005` Lazy, and `30006` Coward, each contributing three non-learnable `+0` star rows across the 18 `300011`–`300063` rows (**asset-level verified** for the ids and names; the table is not cooked on retail).

## 15. Archetype seeds

A `DT_CustomizeNPC` row, and its Shifting Sands mirror `DT_CustomizeNPC_Egypt`, can seed a fixed natural gift and a fixed title at character generation, independent of the random talent pools.
`CustomizeNGMap` is a `TMap<int32,NaturalGift>` whose detail entries name `DT_GiftZongBiao` rows directly, and `CustomizeChengHaoClass` names a `BP_CH_*_C` title class whose `NaturalGiftList` grants a `ChengHao`-source row (**asset-level verified**).
These are literal values rather than pool draws, so an archetype-seeded gift or title appears in addition to anything the random subsystems assign, and clearing `CustomizeNGMap` and nulling `CustomizeChengHaoClass` removes them.
The per-row field layout and the shipped row contents are catalogued in [recruitment and spawns](recruitment-and-spawns.md) and [proficiencies and caps](proficiencies-and-caps.md).

## 16. Foot-guns

These are the concrete traps that will silently waste an attempt if forgotten.

- The negative table is `DT_GiftFuMiann` with a double `n`; `DT_GiftFuMian` does not exist, so a wrong name silently misses the defect pool.
- Gifts are baked at spawn, not at recruitment; an already-recruited tribesman never changes, and each test needs a freshly spawned recruit from a location the session has not visited.
- UAssetAPI cannot re-serialize an empty `NaturalGiftDetail` struct array, so prune a pool by deleting rows or details, never by emptying `NGDetailList`.
- A family present in only some pool rows is drawn probabilistically; the resilient guaranteed draw is to prune the target row's `NGDetailList` to the single intended detail, because `BaseWeight` is not confirmed to drive per-detail selection.
- The localization file is display-authoritative over the DataTable inline text; editing `CultureInvariantString` alone will not change an existing displayed translation, and a repurposed row keeps its shipped title in game.
- The Training Ground can upgrade and transfer talents; flag repurposed rows with `LearnedNGID = 0`, `UpgradeNGID = 0`, and a `DT_TalentToBeBanned` entry, and note that the ban list does not block curated boss-pool grants.
- The manager `Default__BP_ZiYuanGuanLiQi_C` is a `RawExport`, so `GoodNGMaxNum`, `XiHaoRandomMinNum`/`MaxNum`, and `BadNGRandomMinNum`/`MaxNum` are raw-patch only.
- The star table carries only three magnitude tiers, so a mod that wants a no-grant outcome for low qualities must supply it from the `DT_PinZhiGoodNGAddPr` cadence rather than from a fourth star row.
- Battle-Tested reaches only the combat classes because `BP_Gift_IsZDZhiYe_C` is `{1, 2, 3}`; do not treat it as universal.
- Identity, title, and preference talents do not consume `GoodNGMaxNum`, so do not budget against them.
- The `_LiZhua` / `_HuoShi` / `_DuYa` bag-to-class naming is ambiguous across the source documents; verify the intended class per row before relying on it.
- A per-character `ChengZhangComponent.DT_GoodNGConfig` override read is proven; the write is unproven on Linux, so prefer pool pruning.
