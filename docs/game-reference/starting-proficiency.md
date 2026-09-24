# Starting Proficiency

Starting proficiency is the **current** proficiency value a freshly generated recruit carries in each skill before any training.
It is the initial value stored in the skill's `FProficiencyData` entry, not the skill's cap; the cap is a separate surface documented in `proficiencies-and-caps.md`.
The value is rolled and written once at generation by the native selector at `0x41bb000`, and the selector sets the once-only guard bit 0 of `obj+0x528` (`bCurProfLvlInit`) so it never runs again (`0x41bb00e`).
The game does not rewrite a stored current value on level-up; level-ups advance the value only through normal proficiency XP, and a stored start survives on an existing recruit forever.
The per-level XP cost and cumulative progression that raise a stored start come from the `DT_ProficiencyConfig_*` tables, documented in `proficiencies-and-caps.md`; the training surfaces that also raise current proficiency, including the practice-dummy interval `IncreaseProfInterval = 10`, are documented in `training-ground-and-transfer.md`.
Selector evidence is asset-level verified by disassembly of the shipping Linux dedicated server binary.

Confidence labels used below: **in-game verified** (observed on a running server), **asset-level verified** (read from a cooked asset or disassembled from the shipping binary), **inferred** (derived from structure), and **unverified** (plausible but not confirmed).

## 1. Where the selector runs

The recruit character initializer at `0x41b7410` calls the cap initializer at `0x41b7730` (`0x41b7481`) and then the starting-current-proficiency initializer at `0x41bb000` (`0x41b7689`).
`0x41bb000` returns immediately if bit 0 of `*(component+0x26c8)` is set (`0x41bb05f`), because the blank body has its own initializer at `0x41bb8f0`.
The selector resolves the live config object through the game singleton: `singleton = 4430280()`, then `config = *(singleton+0x9d0)` (`0x41bb06d`-`0x41bb088`).
`config` is the runtime `UHProficiencyConfig` / `BP_ProficiencyConfig_C_0`.

## 2. Selector inputs and formula

The selector reads three independent roll sources and coarsely sums them, one roll per proficiency; each of the three `RandRange` calls is inside the per-skill loop, so skills roll independently.

```text
sum  = max(levelRoll, 0) + max(clanRoll, 0) + max(classRoll, 0)
value = (levelRoll > 0 or clanRoll > 0 or classRoll > 0) ? sum : nativeRoll
```

`nativeRoll` is a `RandRange(ProfInitLvlMin, ProfInitLvlMax)` fallback, used only when all three data rolls are non-positive.
All shipped ranges are positive, so in the retail data the native fallback never survives; overriding `ProfInitLvlMin`/`ProfInitLvlMax` changes normal recruits almost never.
A negative roll cannot reduce a start, because each term is clamped to zero by `max(roll, 0)`.
`RandRange` is the native RNG at `0x41c4af0`; the class-table row fetch is `0x41c4bc0`.

Config field offsets in `UHProficiencyConfig` (asset-level verified from property records):

| Field | Offset | Role |
| --- | --- | --- |
| `ProfInitLvlMin` | `0x28` | native fallback floor |
| `ProfInitLvlMax` | `0x2c` | native fallback ceiling |
| `ClanDiWeiProfInitLvlMap` | `0x30` | clan rank → `{min,max}` table |
| `ZhiYeProfLvlMap` | `0x80` | class → `SLD_ChuShiLv_*` table |
| `JueSeLvlProfLvlList` | `0xd0` | level band → `{min,max}` array |
| `ProfConfigDTList` | `0xf8` | per-skill eligibility gate |
| `ZhiYeProfMaxLvlMap` | `0x108` | class → cap table (cap side, not start) |
| `BaiBanProfMaxLvlList` | `0x1f8` | blank-body caps |

Character data offsets (asset-level verified):

| Field | Offset | Owning side |
| --- | --- | --- |
| `Level` | `0x410` | proficiency component |
| `ClanDiWei` (clan rank) | `0x3390` | source component `*(obj+0xa0)` |
| `ClanZhiYe` (class) | `0x3391` | source component |
| `CharacterType` | `0xa41` | source component; gates `CurProfInitRatio` |
| `ProfDataList` | `0x518`/`0x520`/`0x524` | proficiency component |
| `bCurProfLvlInit` (bit 0) | `0x528` | proficiency component; once-guard |
| `FProficiencyData` current | element `+0x4` | per-skill stored value |
| `FProficiencyData` cap | element `+0x8` | per-skill cap (clamp target) |
| `FProficiencyData` cap base | element `+0xc` | cap base |

### 2.1 The clamped level band

The level band is resolved once per character, before the per-skill loop (`0x41bb105`-`0x41bb15c`).
`JueSeLvlProfLvlList` is an array of `FJueSeLvlProfInitLvl` with stride `0x10` and fields `{JueSeLvlMin, JueSeLvlMax, ProfInitLvlMin, ProfInitLvlMax}`.
A band matches when `JueSeLvlMin <= Level <= JueSeLvlMax`; the matched `ProfInitLvlMin`/`ProfInitLvlMax` pair is then consumed by the per-skill level `RandRange` at `0x41bb850`.
If no band matches, both values stay `0`, so the level term contributes nothing.

## 3. The three tables (retail shipped)

Only one of the three tables is per-skill; the level and clan tables are shared across every proficiency.

### 3.1 `BP_ProficiencyConfig.JueSeLvlProfLvlList` — shared per character level

`JueSeLvlProfLvlList` is an `ArrayProperty` of `JueSeLvlProfInitLvl` structs with four `IntProperty` fields (`JueSeLvlMin`, `JueSeLvlMax`, `ProfInitLvlMin`, `ProfInitLvlMax`).
The array carries no `ProfType` or skill key, so one band's range applies identically to every proficiency.
Shipped values (asset-level verified):

| `JueSeLvlMin` | `JueSeLvlMax` | `ProfInitLvlMin` | `ProfInitLvlMax` |
| --- | --- | --- | --- |
| 0 | 20 | 1 | 5 |
| 21 | 40 | 5 | 15 |
| 41 | 80 | 15 | 25 |

### 3.2 `BP_ProficiencyConfig.ClanDiWeiProfInitLvlMap` — shared per clan rank

The map has three rank keys, each mapping to one generic `{ProfInitLvlMin, ProfInitLvlMax}` pair.
It is keyed only by rank and has no skill, class, or level dimension, so one range is shared by every proficiency.
Shipped values (asset-level verified):

| Key | `ProfInitLvlMin` | `ProfInitLvlMax` |
| --- | --- | --- |
| `CLAN_DIWEI_HIGH` | 15 | 25 |
| `CLAN_DIWEI_MIDDLE` | 5 | 15 |
| `CLAN_DIWEI_LOW` | 1 | 5 |

### 3.3 `SLD_ChuShiLv_*` — one flat addend per class skill

`BP_ProficiencyConfig.ZhiYeProfLvlMap` resolves six class keys to six DataTables under `/Game/Blueprints/DataTable/NaturalGift/`.
Each row is `{ProfType, MinAdd, MaxAdd}`; the selector matches the row against the current proficiency, so a listed skill gets `rand(MinAdd, MaxAdd)` and an unlisted skill gets a class roll of zero.
The addend is a flat constant that never reads character level, clan rank, or quality, so it can only shift a skill's curve vertically.

| Class key | Table | Rows | Class skills |
| --- | --- | --- | --- |
| `ZHIYE_TYPE_WUWEI` | `SLD_ChuShiLv_ZhanShi` | 5 | ShuangDao, Chui, DaJian, Dao, QuanTao |
| `ZHIYE_TYPE_SHOULIE` | `SLD_ChuShiLv_LieShou` | 6 | Gong, ShuangDao, Dao, QuanTao, Mao, Bian |
| `ZHIYE_TYPE_SHOUHU` | `SLD_ChuShiLv_WeiShi` | 5 | DunPai, Gong, Dao, DaJian, Mao |
| `ZHIYE_TYPE_KULI` | `SLD_ChuShiLv_LiGong` | 4 | FaMu, CaiKuang, ZhongZhi, CaiShou |
| `ZHIYE_TYPE_ZAGONG` | `SLD_ChuShiLv_ZaGong` | 8 | FangZhi, ZhiTao, PaoMu, QieShi, JianZhu, RouPi, PouJie, RongLian |
| `ZHIYE_TYPE_ZONGJIANG` | `SLD_ChuShiLv_JiangRen` | 7 | QiJu, WuQi, JiaZhou, LianJin, ZhuBao, PengRen, YanMo |

Every shipped row is `MinAdd = 15`, `MaxAdd = 20`, except Hunter `Bian`, which is `15-25` (asset-level verified).
The English class label attached to `ZHIYE_TYPE_KULI` and `ZHIYE_TYPE_ZAGONG` is reported inconsistently across sources; the class key and the table name are the authoritative identifiers.
The class **cap** bonus comes from the separate `ZhiYeProfMaxLvlMap` → `DT_Prof_ZhiYe_*` tables, not from `SLD_ChuShiLv_*`; see `proficiencies-and-caps.md`.

## 4. Level-band mapping and maximum recruitable level

The maximum recruitable level is **50** for every spawn group that emits a recruitable `BP_SuiJi_BuLuo*` (asset-level verified by scanning 1,149 `BP_SGQ_*` spawner CDOs for `SCGZuiXiaoDengJi`/`SCGZuiDaDengJi` and `GuaiWuClass`).
The ruins elite `BP_SuiJi_YiJi_JingYing` in `BP_SGQ_YiJi_T10_LFZ_Elite` reaches level 55 but is not recruitable (in-game verified).
Arena challenge groups (`BP_BuLuo_Arena*`, levels 55-65) are challenge-mode spawns, not standard recruitment, and event spawners mix recruitable barbarians at 46-50 with animals up to 65.
The highest non-recruitable spawners reach 70 (`BP_SGQ_CallJiXieNpc`, `BP_SGQ_JFJ`, `BP_SGQ_MMX`), but none emits a barbarian `BP_SuiJi_BuLuo*`.

Mapping the recruit level onto the shipped level bands:

| Level | Matched band | Level roll |
| --- | --- | --- |
| 0-20 | 0-20 | 1-5 |
| 21-40 | 21-40 | 5-15 |
| 41-80 | 41-80 | 15-25 |

Every recruit at the level-50 maximum falls in the `41-80` band, so the entire deep-level range saturates on the same `15-25` level roll; the retail curve has no band above 80.

## 5. `CurProfInitRatio` and the clamp to cap

Before the per-skill loop, the selector reads the `GameXishu` key `CurProfInitRatio` only when `CharacterType != 0` (`0x41bb164`-`0x41bb210`).
The key string is built from the wide literals at `0x6d7aa0` (`CurProfI`) and `0x6c9290` (`nitRatio`).
The value is a scalar in `[0,1]` documented as `0 = initial value`, `1 = maximum`; its default is `0` in every shipped preset except Action (see `server-config.md`).

```text
if ratio > 0:
    value = value + (cap - value) * ratio   ; 0x41bb8bf
value = min(value, cap)                      ; 0x41bb21b
```

`0x6c014c` is `0.0f`, so the default `CurProfInitRatio = 0` skips the lerp entirely.
A nonzero ratio lerps the computed starting value toward the already-computed per-skill cap, and the final clamp guarantees `value <= cap` regardless.
Because the lerp erodes the level/rank depth signal, the settled mod keeps `CurProfInitRatio = 0` (a design decision, not shipped game data).

## 6. The blank-body path

`0x41bb8f0` is the blank-body (initial-flesh) variant and requires bit 0 of `*(component+0x26c8)` (`0x41bb954`).
It does not read `JueSeLvlProfLvlList`, `ClanDiWeiProfInitLvlMap`, or `SLD_ChuShiLv_*`, so it is irrelevant to recruit starting values.
It works from a different source: a ratio at object `+0x128` (`0x41bb9ff`), the sum of per-level values returned by `41bc640(obj, level)` for levels `1..Level` (`0x41bba47`), plus a sum over `obj+0x428` entries and `obj+0x438` (`0x41bbab2`).

## 7. Advancing a stored value

Once generated, a stored current value rises only through proficiency XP.
The cost to reach a proficiency level is the `ProfConsumeExp` field of that skill's `DT_ProficiencyConfig_*` table; the 23 tables each carry 150 rows keyed `1`..`150`.
Cumulative XP from level 1 is `3,110` at level 30, `17,158` at 60, `48,004` at 90, `100,296` at 120, `111,390` at 125, and `178,086` at 150 (asset-level verified).
The practice dummy carries 108 `WeaponTrainData` entries with `AddProficiencyPerSecond` `0.2-1.4` and `TrainMeetMaxLevel = 130`, and it raises current proficiency on its own timer at `IncreaseProfInterval = 10` (asset-level verified).
The `DT_ProficiencyConfig_*` per-level tables are documented in `proficiencies-and-caps.md`; the training surfaces are documented in `training-ground-and-transfer.md`.

## 8. The mod's settled starting curve

The sections above document the shipped selector and shipped tables.
This section documents the mod's settled starting curve, which is a design decision recorded in `../../DESIGN.md` "Recruit starting proficiency" and implemented by the build, not shipped game data.
`../../DESIGN.md` states that non-class skills follow a shared curve from `1` at level 1 to `76` at level 50, and that class skills add a fixed `36` on top, starting at `37` and reaching `112`.

```text
shared(L)  = round( 1 + 75 * (L - 1) / 49 )   ; shared(1) = 1,  shared(50) = 76
class(L)   = shared(L) + 36                    ; class(1) = 37,  class(50) = 112
```

The two curves can differ only by a constant offset because the level dependence lives in the shared `JueSeLvlProfLvlList` and the class addend is flat.
It is impossible to have both curves start at 1 and reach different maxima; the class level-1 anchor of 37 is accepted as the price of a class advantage.
The build stores `JueSeLvlProfLvlList` as 52 degenerate `ProfInitLvlMin = ProfInitLvlMax` bands: a `0-0` guard band at 1, one band per level 1-50, and a terminal `51-200` plateau at 76.
Every `SLD_ChuShiLv_*` row is `MinAdd = MaxAdd = 36` (35 rows across six tables), all three clan ranks are `0/0`, and the native fallback is `1/1`.
The build shapes the class rows to the `DESIGN.md` class sets through the same shared class-skill-set helper it uses for caps (see `../mod-status.md`).

| Level | Non-class | Class | Level | Non-class | Class | Level | Non-class | Class | Level | Non-class | Class | Level | Non-class | Class |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 1 | 37 | 11 | 16 | 52 | 21 | 32 | 68 | 31 | 47 | 83 | 41 | 62 | 98 |
| 2 | 3 | 39 | 12 | 18 | 54 | 22 | 33 | 69 | 32 | 48 | 84 | 42 | 64 | 100 |
| 3 | 4 | 40 | 13 | 19 | 55 | 23 | 35 | 71 | 33 | 50 | 86 | 43 | 65 | 101 |
| 4 | 6 | 42 | 14 | 21 | 57 | 24 | 36 | 72 | 34 | 52 | 88 | 44 | 67 | 103 |
| 5 | 7 | 43 | 15 | 22 | 58 | 25 | 38 | 74 | 35 | 53 | 89 | 45 | 68 | 104 |
| 6 | 9 | 45 | 16 | 24 | 60 | 26 | 39 | 75 | 36 | 55 | 91 | 46 | 70 | 106 |
| 7 | 10 | 46 | 17 | 25 | 61 | 27 | 41 | 77 | 37 | 56 | 92 | 47 | 71 | 107 |
| 8 | 12 | 48 | 18 | 27 | 63 | 28 | 42 | 78 | 38 | 58 | 94 | 48 | 73 | 109 |
| 9 | 13 | 49 | 19 | 29 | 65 | 29 | 44 | 80 | 39 | 59 | 95 | 49 | 74 | 110 |
| 10 | 15 | 51 | 20 | 30 | 66 | 30 | 45 | 81 | 40 | 61 | 97 | 50 | 76 | 112 |

The terminal `50+` plateau is 76 for non-class and 112 for class.
A lower-quality cap clamps the start with `min(value, cap)`, so a start above a lower cap lands exactly on that cap.
The built assets are asset-level verified; a live recruit read of the curve is unverified.

## 9. Exact fields to edit and their locations

| Surface | Location | Field |
| --- | --- | --- |
| Shared level curve | `/Game/Blueprints/ZiYuanGuanLi/BP_ProficiencyConfig` CDO (`Default__BP_ProficiencyConfig_C.Data`) | `JueSeLvlProfLvlList` array entries |
| Shared clan curve | same `BP_ProficiencyConfig` CDO | `ClanDiWeiProfInitLvlMap` entries |
| Class → table map | same `BP_ProficiencyConfig` CDO | `ZhiYeProfLvlMap` |
| Native fallback | same `BP_ProficiencyConfig` CDO | `ProfInitLvlMin`, `ProfInitLvlMax` |
| Class flat addend | `/Game/Blueprints/DataTable/NaturalGift/SLD_ChuShiLv_ZhanShi`, `_LieShou`, `_WeiShi`, `_LiGong`, `_ZaGong`, `_JiangRen` | every row's `MinAdd`/`MaxAdd` |
| Global lerp fraction | `WS/Config/GameplaySettings/GameXishu_Template*.json` | `CurProfInitRatio` |
| Spawn level (indirect) | `BP_SGQ_*` spawner CDOs | `SCGInfoList.SGBList.SCGZuiXiaoDengJi` / `SCGZuiDaDengJi` |

For a deterministic start, set `ProfInitLvlMin = ProfInitLvlMax` in each level band and each `MinAdd = MaxAdd` in each class row; the degenerate `RandRange(min==max)` returns the single value (in-game verified).
Setting a band or class range to degenerate removes the RNG without removing the axis.
`BP_ProficiencyConfig` CDO property edits are UAssetAPI-editable on Linux; `SLD_ChuShiLv_*` rows are plain DataTable value edits.

## 10. Foot-guns

- The level table and the clan table are **shared across every skill**, not per-skill; only `SLD_ChuShiLv_*` is per-skill, and its addend is flat (level-independent).
- A class and non-class skill can differ only by a constant offset; a level-dependent class/non-class split is impossible with these tables.
- Stored starting values are baked at generation and are never rewritten on level-up; a change is visible only on a **freshly generated** recruit, not on an existing save's tribesman.
- The native `ProfInitLvlMin`/`ProfInitLvlMax` roll is a fallback only; it is discarded whenever any level/clan/class roll is positive, which is always in shipped data.
- A negative class addend cannot lower a start; the selector applies `max(classRoll, 0)` before summing.
- A nonzero `CurProfInitRatio` lerps the start toward the cap and erodes the level/rank depth signal; keep it at `0`.
- The retail level curve saturates at `41-80`, so all deep regions collapse onto the same `15-25` level band unless the table is rewritten.
- The 52-band `JueSeLvlProfLvlList` in the build is asset-level verified; the live loader read of the grown array is unverified.
- `ClanZhiYe` may take production-class values (`KULI`/`ZAGONG`/`ZONGJIANG`) at recruit time rather than only the six `ZHIYE_TYPE_*`; the class map has six entries and a non-matching class receives a zero class roll.
- Selecting an archetype is a separate cap surface; it does not write starting proficiency, and the `DT_CustomizeNPC` seed is documented in `proficiencies-and-caps.md`.
