# Proficiencies and Caps

This is the authoritative reference for Soulmask proficiency values, the per-level benefit data, and every mechanism that decides or changes a proficiency cap.
It reads from the cooked shipping assets and the Linux dedicated-server binary `WSServer-Linux-Shipping`.
Each claim is marked in-game verified (observed on a running server), asset-level verified (parsed and round-tripped with UAssetAPI), inferred (read from disassembly or reconstructed), or unverified.

## The 31 proficiencies

`EProficiency` has 31 members, and the character's per-proficiency array `FProficiencyData` (`component+0x518`, count `component+0x520`, stride `0x28`) carries one record per member.
The scale runs from 0 to 150; each configured proficiency has 150 per-level rows, and the milestone bonus levels are 30, 60, 90, and 120.

| `EProficiency` | Display label | Group | Has per-level table |
| --- | --- | --- | --- |
| `Dao` | Single Blade | Combat | yes |
| `ShuangDao` | Dual-blade | Combat | yes |
| `Mao` | Spear | Combat | yes |
| `Chui` | Hammer | Combat | yes |
| `QuanTao` | Gauntlets | Combat | yes |
| `Gong` | Bow | Combat | yes |
| `DaJian` | Great Sword | Combat | yes |
| `DunPai` | Shield | Combat | yes |
| `Bian` | Spiked Whip | Combat | yes |
| `FaMu` | Logging | Gathering | yes |
| `CaiKuang` | Mining | Gathering | yes |
| `CaiShou` | Collect / Harvest | Gathering | yes |
| `ZhongZhi` | Plant | Gathering | yes |
| `PaoMu` | Woodworking | Crafting | yes |
| `RongLian` | Smelting | Crafting | yes |
| `RouPi` | Leatherworking | Crafting | yes |
| `FangZhi` | Weaving | Crafting | yes |
| `ZhiTao` | Potting | Crafting | yes |
| `QiJu` | Craftsman (Tools) | Crafting | yes |
| `WuQi` | Weapon Crafting | Crafting | yes |
| `JiaZhou` | Armor Crafting | Crafting | yes |
| `LianJin` | Alchemy | Crafting | yes |
| `PengRen` | Cooking | Crafting | yes |
| `BuZhuo` | Trapping | Crafting | no |
| `YangZhi` | Breeding | Crafting | no |
| `TuZai` | Butchering | Crafting | no |
| `QieShi` | Stonecutting | Crafting | no |
| `YanMo` | Grinding | Crafting | no |
| `ZhuBao` | Jewelcrafting | Crafting | no |
| `JianZhu` | Construction | Crafting | no |
| `PouJie` | Dissecting | Crafting | no |

The enum name is authoritative; display labels are the English localization where it exists and the game's standard term otherwise.
The packed native array order is `FaMu, CaiKuang, ZhongZhi, BuZhuo, CaiShou, YangZhi, TuZai, PaoMu, QieShi, RongLian, RouPi, FangZhi, ZhiTao, YanMo, QiJu, WuQi, JiaZhou, ZhuBao, JianZhu, LianJin, PengRen, Dao, ShuangDao, Mao, Chui, QuanTao, Gong, DaJian, PouJie, DunPai, Bian`.

### Per-level benefit tables (`DT_ProficiencyConfig_*`)

The per-level tables live under `/Game/Blueprints/DataTable/Proficiency/{CaiJi,JiaGong,WuQi,ZhiZuo}/`.
There are 23 tables, one per configured proficiency, each with 150 rows keyed `1`..`150`.
The row struct is `ProficiencyConfig` (`FProficiencyConfig`), and one row describes what one proficiency level grants.

| Field | Type | Meaning |
| --- | --- | --- |
| `ProfConsumeExp` | `IntProperty` | Experience needed to reach that level; row 1 = 12, row 30 = 242, row 60 = 710, row 90 = 1350, row 120 = 2132, row 150 = 3044 |
| `ProfBenefitConfigList` | array of benefit structs | Per-level stat benefit; each entry carries `ProfBenefit` (`EProficiencyBenefit`), `ProfBenefitVal`, `IsPct`, `TeShuProfBenefitVal`, `Pic`, and `DescText` |
| `UnlockProfBenefitConfigList` | array of benefit structs | Multi-choice unlock benefits presented at the milestone rows |

`EProficiencyBenefit` has 128 members and none of them is a cap or maximum-level member; every member is a speed, output, material-cost, durability (`*MaxNaiJiu`), craft-quality (`*PinZhiInc`), or damage benefit.
A representative craft skill (`DT_ProficiencyConfig_WuQi`) unlocks only `WuQiSpeed`, `WuQiMaxNaiJiu`, and `WuQiPinZhiInc` at 30/60/90/120.
No milestone raises a cap.

The cumulative `ProfConsumeExp` totals for `DT_ProficiencyConfig_Dao` are `3,110` at level 30, `17,158` at 60, `48,004` at 90, `100,296` at 120, `111,390` at 125, and `178,086` at 150; the other 22 tables share the same shape.

## Which proficiencies are initialized

The recruitment initializer `UHChengZhangComponent::InitProficiency` at `0x41b7730` iterates `profType` from 0 to 30 (`cmp $0x1f,%ebx` at `0x41b8123`) but skips every `profType` absent from `ProfConfigDTList`.
`ProfConfigDTList` is a 23-entry array at `config+0xf8`/`config+0x100` (byte `ProfType` at `+0`, DataTable pointer at `+8`, stride `0x10`), matching the 23 `DT_ProficiencyConfig_*` tables.
Only those 23 proficiencies are ever initialized, given a cap entry, and given a class-table entry.

The eight excluded skills, which have no `DT_ProficiencyConfig_*` table and no row in any `DT_Prof_ZhiYe_*` class table, are:

`BuZhuo`, `YangZhi`, `TuZai`, `QieShi`, `YanMo`, `ZhuBao`, `JianZhu`, `PouJie`.

Some of these (for example `QieShi`, `JianZhu`, `PouJie`, `ZhuBao`, `YanMo`) still appear in the `SLD_ChuShiLv_*` starting-value tables, so they can receive a starting current value without ever receiving a cap.

## The cap algorithm

A recruitment-time cap is written once, when the proficiency entry is first created, and is stored on the character.
For a cap-eligible class skill of a normal recruit the composition is:

```text
cap = clamp( rand(ProfInitMaxLvlMin .. ProfInitMaxLvlMax)   // native 75..100
           + rand(row.MinAdd .. row.MaxAdd),                 // class table, native 15..25
             ProfMaxLvlLowerLimit,                           // native 50
             ProfMaxLvlUpperLimit )                          // native 150
```

The full create path, including the two non-class branches, is:

```text
for each profType p in 0..30:
    if p is not in ProfConfigDTList:                         # 23-entry gate
        skip
    if FProficiencyData already holds an entry for p:
        ProfMaxLvl = clamp(stored + ProfMaxLvl_Init + helper, 0xe8, 0xec)   # refresh branch; never writes Init
        continue
    if character+0x3378 is set and its DT_CustomizeNPC row lists p:
        cap = row.CustomizeProfMaxLv[p] - existingAdd        # archetype seed bypasses base and class
    else if blank/initial body (bit 0 of character+0x26c8):
        cap = BaiBanProfMaxLvlList.get(p, config.ProfInitChuShiBodyMaxLvl)
    else:
        base  = rand(config.ProfInitMaxLvlMin .. config.ProfInitMaxLvlMax)   # 75..100
        bonus = class_table[p]                                # rand(MinAdd..MaxAdd), 15..25 shipped
        cap   = base + bonus
    ProfMaxLvl_Init = clamp(cap, config.ProfMaxLvlLowerLimit, config.ProfMaxLvlUpperLimit)   # 50..150
    ProfMaxLvl      = ProfMaxLvl_Init
    ProfMaxLvl_Add  = 0
```

A normal recruit therefore receives `90..125` for a class skill and `75..100` for a non-class skill, with a hard ceiling of 150; no RNG draw reaches the clamp floor.
The blank/initial-body path instead reads `BaiBanProfMaxLvlList`, which gives `40` to the nine combat skills and `10` to every gathering/crafting skill, with `ProfInitChuShiBodyMaxLvl` (`50`) as the default for a skill with no entry.
The blank-body list is gated on the same `character+0x26c8 & 3 == 1` condition as the attribute term, so it applies to the starter/blank body and not to a recruited tribesman.

The stored value has three parts in `FProficiencyData` (`stride 0x28`):

| Offset | Field | Meaning |
| --- | --- | --- |
| `+0x4` | `ProfLvl` | current proficiency level |
| `+0x8` | `ProfMaxLvl` | effective cap, `clamp(ProfMaxLvl_Init + ProfMaxLvl_Add + blank/attribute term)` |
| `+0xc` | `ProfMaxLvl_Init` | the cap fixed at generation |
| `+0x10` | `ProfMaxLvl_Add` | accumulated additive cap bonus |
| `+0x14` | `ProfExp` | proficiency experience |
| `+0x18` | `UnlockBenefitList` | chosen milestone unlocks |

Caps are fixed at recruitment and are not re-rolled on level-up: `ProfInitMaxLvlMin/Max` read no character level, `JueSeLvlProfLvlList` feeds only the starting current value, and level-up advances `ProfLvl` while the recompute reads `ProfMaxLvl_Init` without rewriting it.
Confidence: the native constants, the clamp bounds, and the class-bonus range are high; the exact order of operations and whether the base roll is one roll per character or one roll per proficiency are medium.
The `+0xc` writers are the create branch (`0x41b8103`), the setter/copy `0x41c7cb0` (`0x41c7dc8`, reached from the field deserializer `0x4f0ee0b`), the mentor increment `0x4603f32` (`addl $0x1`), and the forced re-init `0x4879a50` (which calls the initializer with flag 1).

The native `ProfInitLvlMin`/`ProfInitLvlMax` roll is the fallback for the starting current value, applied by the selector `0x41bb000` for recruits and `0x41bb8f0` for the blank body.
That selector applies the `GameXishu` `CurProfInitRatio` lerp toward the cap only when `CharacterType` (`character+0xa41`) is non-zero.
`ECharacterType` members are `CHARACTER_PUTONG`, `CHARACTER_JINGYING`, `CHARACTER_BOSS`, `CHARACTER_GIANTBOSS`, `CHARACTER_SANDSHIP`, `CHARACTER_PYRAMID_BOSS`, and `MAX`; the enum's numeric order was not recovered.

## Native constants (owning class `UHProficiencyConfig`)

The cap constants are properties of the native class `UHProficiencyConfig`, the parent of `/Game/Blueprints/ZiYuanGuanLi/BP_ProficiencyConfig`, not of `UHZiYuanGuanLiQi`.

| Field | Offset | Value | Meaning | Confidence |
| --- | --- | --- | --- | --- |
| `ProfInitLvlMin` | `0x28` | 1 | initial current-value roll floor | high |
| `ProfInitLvlMax` | `0x2c` | 50 | initial current-value roll ceiling | high |
| `ProfInitMaxLvlMin` | `0xe0` | 75 | base cap roll floor | high |
| `ProfInitMaxLvlMax` | `0xe4` | 100 | base cap roll ceiling | high |
| `ProfMaxLvlLowerLimit` | `0xe8` | 50 | cap clamp floor | high |
| `ProfMaxLvlUpperLimit` | `0xec` | 150 | cap clamp ceiling | high |
| `ProfInitChuShiBodyMaxLvl` | `0xf0` | 50 | blank/initial-body cap default | high |

The class constructor `UHProficiencyConfig::UHProficiencyConfig(FObjectInitializer const&)` is at `0x5164260`.
It writes `movabs $0x3200000001` at `0x5164276` (setting `0x28 = 1`, `0x2c = 50`), loads the 16-byte constant at `0x6c9770` with `movaps` at `0x51642e2`/`movups` into `0xe0` at `0x51642e9`, and writes `movl $0x32,0xf0` at `0x51642f0`.
The bytes at `0x6c9770` are `4b 00 00 00 64 00 00 00 32 00 00 00 96 00 00 00`, i.e. `75, 100, 50, 150`.
The constant table is referenced only by the constructor; the runtime selector reads the live object's fields through the pointer at `manager+0x9d0`, not the immediates.
The property records that prove the offsets sit in `.rodata` at `0x16fcf40` (`ProfInitLvlMin`), `0x16fcf68` (`ProfInitLvlMax`), `0x16fd110` (`ProfInitMaxLvlMin`), `0x16fd138` (`ProfInitMaxLvlMax`), `0x16fd160` (`ProfMaxLvlLowerLimit`), `0x16fd188` (`ProfMaxLvlUpperLimit`), and `0x16fd1b0` (`ProfInitChuShiBodyMaxLvl`).
See [native-binary-analysis.md](../reverse-engineering/native-binary-analysis.md) for the property-record walk and the runtime read.

## The six class cap tables (`DT_Prof_ZhiYe_*`)

Each table lives under `/Game/Blueprints/DataTable/Proficiency/` and uses row struct `ProficiencyZhiYeLvl` (`ProfType`, `MinAdd`, `MaxAdd`).
Every row in every table ships as `MinAdd = 15`, `MaxAdd = 25`.

| Class | Table | Rows | Cap-eligible skills | `MinAdd` / `MaxAdd` |
| --- | --- | --- | --- | --- |
| Warrior | `DT_Prof_ZhiYe_WuWeiZhe` | 5 | `ShuangDao`, `Chui`, `Dao`, `DaJian`, `QuanTao` | 15 / 25 |
| Hunter | `DT_Prof_ZhiYe_ShouLieZhe` | 6 | `Gong`, `ShuangDao`, `Dao`, `Mao`, `QuanTao`, `Bian` | 15 / 25 |
| Guard | `DT_Prof_ZhiYe_ShouHuZhe` | 5 | `DunPai`, `Gong`, `Dao`, `DaJian`, `Mao` | 15 / 25 |
| Laborer | `DT_Prof_ZhiYe_KuLi` | 4 | `FaMu`, `CaiKuang`, `CaiShou`, `ZhongZhi` | 15 / 25 |
| Porter | `DT_Prof_ZhiYe_ZaGong` | 5 | `PaoMu`, `RongLian`, `RouPi`, `FangZhi`, `ZhiTao` | 15 / 25 |
| Craftsman | `DT_Prof_ZhiYe_ZongJiang` | 5 | `QiJu`, `WuQi`, `JiaZhou`, `LianJin`, `PengRen` | 15 / 25 |

The class is selected by the `ZhiYe` key at `character+0x3391`, resolved through `ZhiYeProfMaxLvlMap` (`config+0x108`).
The class bonus is therefore a per-skill `rand(15..25)` addend on top of the base roll, and a class sets cap-eligibility simply by listing the skill.
There is no primary/secondary/off tier in the config; every listed skill gets the same random range, so per-skill determinism is obtained by setting each row's `MinAdd = MaxAdd`.

### Starting-value tables (`SLD_ChuShiLv_*`)

The class starting-value tables use the same `ProficiencyZhiYeLvl` row struct but feed the starting current value, not the cap, and are reached through `ZhiYeProfLvlMap` (`config+0x80`).
They ship as `MinAdd = 15`, `MaxAdd = 20` on every row except Hunter's `Bian`, which is `15..25`.
Their skill sets are broader than the cap tables: Porter adds `QieShi`, `JianZhu`, `PouJie`, and Craftsman adds `ZhuBao`, `YanMo`.

| Class | Table | Skill set |
| --- | --- | --- |
| Warrior | `SLD_ChuShiLv_ZhanShi` | `ShuangDao`, `Chui`, `DaJian`, `Dao`, `QuanTao` |
| Guard | `SLD_ChuShiLv_WeiShi` | `DunPai`, `Gong`, `Dao`, `DaJian`, `Mao` |
| Hunter | `SLD_ChuShiLv_LieShou` | `Gong`, `ShuangDao`, `Dao`, `QuanTao`, `Mao`, `Bian` (15/25) |
| Laborer | `SLD_ChuShiLv_LiGong` | `FaMu`, `CaiKuang`, `ZhongZhi`, `CaiShou` |
| Porter | `SLD_ChuShiLv_ZaGong` | `FangZhi`, `ZhiTao`, `PaoMu`, `QieShi`, `JianZhu`, `RouPi`, `PouJie`, `RongLian` |
| Craftsman | `SLD_ChuShiLv_JiangRen` | `QiJu`, `WuQi`, `JiaZhou`, `LianJin`, `ZhuBao`, `PengRen`, `YanMo` |

### Native read semantics

The class table is enumerated, not indexed by a fixed position or a fixed row-name list.
In `InitProficiency` the per-skill block at `0x41b7d24` calls a helper (`0x41c4bc0`) that returns the resolved table's row array, iterates the entries, matches the row's struct `ProfType` byte at entry `+0x8`, and reads `MinAdd` at `+0xc` and `MaxAdd` at `+0x10` before calling the range helper `0x41c4af0`.
Because the match key is the row's `ProfType`, an appended well-formed row is expected to be read as long as its skill is inside the `0..30` loop and the character already holds that `profType`; live-recruit behavior of an appended row is unverified.
The row keys themselves use shipping aliases (`Dun`, `DanDao`, `DaChui`, `ChangMao`), which is why a consumer must match `ProfType` and never the row name.

## The archetype cap seed

Independently of class and base roll, the initializer can seed `ProfMaxLvl_Init` directly from the recruit's archetype row.
The branch at `0x41b79d9` tests `character+0x3378`, which is the native `CustomizeRowName`; when it is non-zero the code resolves a DataTable through `[resolve()+0x1b0]` (the property `CustomizeProfAndGA`), looks the row name up with `UDataTable::FindRow`, and, when the row's `CustomizeProfMaxLv` map contains the current `profType`, sets `ProfMaxLvl_Init = rowValue - existingAdd`, bypassing the base roll and the class bonus.
On the base map `[resolve()+0x1b0]` is the `BP_RuQinGuanLiQi` CDO reference to `DT_CustomizeNPC`; the DLC map uses `DT_CustomizeNPC_Egypt`.

| Asset | Path | Rows |
| --- | --- | --- |
| Base archetype table | `/Game/Blueprints/DataTable/CustomProfAndGA/DT_CustomizeNPC` | 56 |
| Egypt DLC archetype table | `/Game/AdditionMap01/BluePrints/DataTable/DT_CustomizeNPC_Egypt` | 96 |

A `DT_CustomizeNPC` row is a `CustomizeProficiencyAndGA` struct with four fields: `CustomizeProfMaxLv` (`TMap<EProficiency,int32>`, the cap seed), `CustomizeZhuanJing` (weapon-mastery grants), `CustomizeChengHaoClass` (origin title class), and `CustomizeNGMap` (origin natural-gift slots).
The 56 base rows are the Newbee-Gift recruit family plus the Intrusion invasion family; the Intrusion rows set a flat `125` on the weapon/support skills of their loadout, while the Newbee-Gift rows carry the varied sub-125 values.
The Newbee-Gift cap maps are:

| Row | `CustomizeProfMaxLv` |
| --- | --- |
| `Newbee_Gift_CookerCrafter` | `QiJu=109`, `PengRen=101` |
| `Newbee_Gift_CookerCrafterAlchemist` | `QiJu=103`, `LianJin=114`, `PengRen=94` |
| `Newbee_Gift_WeaponArmor` | `WuQi=99`, `JiaZhou=116` |
| `Newbee_Gift_WeaponAlchemist` | `WuQi=119`, `LianJin=91` |
| `Newbee_Gift_WeaponArmorAlchemist` | `WuQi=93`, `JiaZhou=98`, `LianJin=102` |
| `Newbee_Gift_Guard_ShieldSpearBladeBow` | `DunPai=115`, `Gong=119`, `Mao=92`, `Dao=97` |
| `Newbee_Gift_Guard_ShieldSpearBlade` | `DunPai=119`, `Mao=115`, `Dao=104` |
| `Newbee_Gift_Guard_SpearBladeBow` | `Mao=97`, `Dao=119`, `Gong=108` |
| `Newbee_Gift_Hunter_DualBladeSpearBladeBow` | `ShuangDao=90`, `Mao=110`, `Dao=102`, `Gong=117` |
| `Newbee_Gift_Hunter_DualBladeFistBow` | `ShuangDao=106`, `QuanTao=112`, `Gong=117` |
| `Newbee_Gift_Warrior_GreatSwordHammerDualBladeFist` | `DaJian=118`, `Chui=112`, `ShuangDao=104`, `QuanTao=91` |
| `Newbee_Gift_Warrior_DualBladeFistGreatSword` | `ShuangDao=119`, `QuanTao=116`, `DaJian=110` |
| `Newbee_Gift_Warrior_FistGreatSwordHammer` | `DaJian=99`, `Chui=118`, `QuanTao=117` |

When a row lists a proficiency, the seed makes the effective cap (once the active gift add is applied) `clamp(rowValue + activeEffect52Add, lower, upper)`, independent of the class layer.
To clear the seed from data, empty each row's `CustomizeProfMaxLv` map: the initializer still finds the row but every per-`profType` lookup returns absent, so the create branch falls through to the base+class path.
Clearing all 56 rows makes caps uniform for invading enemies as well as recruits; clearing only the Newbee-Gift rows limits the change to recruitable tribesmen while preserving the archetype's mastery, title, and talent fields (which are separate fields in the same row).

## Other cap modifiers

| Mechanism | Where | What it does | Data-editable |
| --- | --- | --- | --- |
| Gift effect `ENaturalGiftEffect::ProfMaxLevelInc` = 52 | `DT_GiftZongBiao` `NGEffect` | Writes `ProfMaxLvl_Add` (`+0x10`) and recomputes `ProfMaxLvl`; the recompute is `0x41c4f30` | yes, but no shipped row uses it |
| Gift effect `ENaturalGiftEffect::ProfExpInc` = 51 | `DT_GiftZongBiao` `NGEffect` | Writes `ProfExp` (`+0x14`) only and never a cap field | yes |
| Milestone benefits `UnlockProfBenefitConfigList` | `DT_ProficiencyConfig_*` rows 30/60/90/120 | Stat benefits, no cap member | yes |
| Training Ground `ShuLianDuTraining` track | native `AHJianZhuTrainingGround`/`UHTrainingGroundManager`; pacing on `BP_JianZhuTrainingGround` | Raises a weapon's cap toward the mentor's, never above it, incrementing `ProfMaxLvl_Init` one point at a time at `0x4603f32` | pacing yes, increment native |
| Mentor/mastery/talent tracks | `ETrainingType::{NGTraining,NGLevelTraining,ZhuanJingTraining}` | Talents and mastery, never a proficiency cap | pacing yes |
| Mastery, items, buildings, mask, clan rank, spawner | full cooked `WS/Content` tree | None writes a cap; mastery condition bags only read `ProfMaxLvl` through `K2_Check` | n/a |
| Console `SetShuLianDuMaxVal <EProficiency> <cap>` | native exec `0xc782a1` | Sets one proficiency cap directly | no, runtime only |
| `FuZhiYeProfMaxLvlMap` | `UHProficiencyConfig` at `config+0x158` | A second class-bonus map keyed by `EClanFuZhiYe`; zero-initialized by the constructor and empty at runtime | yes, but inert |

The 47 shipped proficiency-targeted gift rows are all effect 51 and zero effect-52 rows ship; no shipped talent is a direct cap writer.
Effect 52 is written into `ProfMaxLvl_Add` by `0x41c4f30`: it sums the active effect-52 values with `0x41c5000`, rounds (`floor((2s+1)/2)`), then adds `ProfMaxLvl_Add`, the blank/class term, and the stored `ProfMaxLvl_Init` before clamping into `ProfMaxLvl` (`+0x8`).
The gift-side effect semantics, the selection pools, the recompute trigger, and the self-exclusion rule are documented in [talents.md](talents.md) §3 and [quality-and-rarity.md](quality-and-rarity.md) §"The quality-to-cap gift channel".

The practice dummy `BP_JianZhu_WeaponTrain_Base` grants practice proficiency on `IncreaseProfInterval = 10`, its tick interval; it advances the current value (`ProfLvl`), not the cap.

The secondary-profession cap layer is dead on retail data.
`FuZhiYeProfMaxLvlMap` is read at `config+0x158` with key `character+0x3392` (`ClanFuZhiYe`), but its rows are keyed by `EClanFuZhiYe`, and its value rows use the same `{ProfType +0x8, MinAdd +0xc, MaxAdd +0x10}` layout as `DT_Prof_ZhiYe_*`.
`EClanFuZhiYe::None` is `0` and `FuZhiYe0`..`FuZhiYe15` are `1`..`16`.
`ClanFuZhiYe` is assigned at `0x48716b8` from a weighted pick at `0x48716ac` that reads `ZhuFuZhiYeQuanZhongMap` at `config+0x1a8`, which the native constructor zeroes at `0x516437b` and no cooked asset serializes.
Every recruit therefore keeps key `EClanFuZhiYe::None` (0), so clan sub-profession caps are never assigned and the map contributes nothing.

## Edit surfaces and feasibility

All `BP_ProficiencyConfig` CDO overrides and DataTable value edits are UAssetAPI-editable on Linux and pack as a same-path `_P.pak`; the class and CDO round-trip byte-identically.

| Cap knob | Location | Edit class |
| --- | --- | --- |
| `DT_Prof_ZhiYe_*.MinAdd` / `.MaxAdd` | `/Game/Blueprints/DataTable/Proficiency/` | cooked DataTable value |
| `BaiBanProfMaxLvlList` | `BP_ProficiencyConfig` CDO | typed array value |
| `JueSeLvlProfLvlList` | `BP_ProficiencyConfig` CDO | typed array value |
| `ClanDiWeiProfInitLvlMap` | `BP_ProficiencyConfig` CDO | typed map value |
| `ZhiYeProfMaxLvlMap`, `ZhiYeProfLvlMap`, `ProfConfigDTList` | `BP_ProficiencyConfig` CDO | typed object-reference value |
| `SLD_ChuShiLv_*.MinAdd` / `.MaxAdd` | `/Game/Blueprints/DataTable/NaturalGift/` | cooked DataTable value |
| `DT_CustomizeNPC.CustomizeProfMaxLv` | `/Game/Blueprints/DataTable/CustomProfAndGA/` | cooked DataTable map value |
| `ProfInitMaxLvlMin/Max`, `ProfMaxLvlLowerLimit/UpperLimit`, `ProfInitLvlMin/Max`, `ProfInitChuShiBodyMaxLvl` | native `UHProficiencyConfig` | native-only; override by appending the inherited `IntProperty` to the `BP_ProficiencyConfig` CDO |
| Base roll and clamp formula | native C++ | native-only |

`Default__BP_ProficiencyConfig_C` is a `NormalExport`, so UAssetAPI can add or change an inherited native `IntProperty` on it in place; each appended property adds a 29-byte property tag to the `.uexp`.
`Default__BP_ZiYuanGuanLiQi_C` is a `RawExport` (serialized size 132,353 bytes) whose property tags UAssetAPI cannot parse, so the manager cannot be repointed by the typed API; because the manager already points at `BP_ProficiencyConfig_C`, the correct vector is the in-place same-path override of `BP_ProficiencyConfig`, not a new Blueprint subclass.
The `ProficiencyConfig` instance inside `BP_ZiYuanGuanLiQi` serializes zero property overrides, so it fully inherits the class defaults.
`GoodNGMaxNum` and the defect-count defaults also live on the `RawExport` manager and are not typed-editable.
See [data-editing.md](../modding-guide/data-editing.md) for the CDO override flow and [native-binary-analysis.md](../reverse-engineering/native-binary-analysis.md) for the native field records and runtime reads.

## Reading a cap in game and stored values

The number shown as a proficiency's cap is `ProfMaxLvl` (`+0x8`), which is `clamp(ProfMaxLvl_Init + ProfMaxLvl_Add, lower, upper)` for a recruit.
`ProfMaxLvl_Init` is the value fixed at generation, and no cooked-asset edit rewrites it: the deserializer setter `0x41c7cb0` copies a serialized `ProfMaxLvl_Init` into the live entry on save-load or replication, so an existing tribesman keeps its stored cap for life.
A mod that freezes the base roll and class bonus, zeroes the alternate `Init` lists, pins `BaiBanProfMaxLvlList`, and clears the archetype map changes caps only for entries created after the change.
To see the new boundary, the operator must recruit a freshly generated tribesman or start a new world; the native forced re-init `0x4879a50` (flag 1, which clears the array first) is the only way to recreate existing entries, and it is a session/native action, not a pak edit.
`CreateSpecifiedMan` and `CreateSWByClass` do not run the natural generation path and must not be used to judge cap changes.

## Foot-guns

- `config+0x158` is `FuZhiYeProfMaxLvlMap`, not `ZhiYeProfLvlMap`; `ZhiYeProfLvlMap` is at `config+0x80` and `ZhiYeProfMaxLvlMap` at `config+0x108`. Mistaking the offset misattributes the whole secondary-profession layer.
- The archetype seed is `DT_CustomizeNPC` through `CustomizeProfAndGA` at `[resolve()+0x1b0]`; `DT_XingGeConfig`/`ManRenConfigTable` is not a cap source, and nulling `ManRenConfigTable` at `0x16a0` is a no-op for caps.
- The base roll, clamp, and blank-body default are native fields that appear in no `.uasset`/`.uexp`; they can only be overridden through the `BP_ProficiencyConfig` CDO (a `NormalExport`) or a binary patch, never a DataTable.
- A competing override in `~mods` can take precedence and silently replace the base roll; ship exactly one proficiency config pak.
- Only 23 of the 31 proficiencies are initialized; the eight without a `ProfConfigDTList` entry never get a cap, so a "fix" for them cannot be expressed by class or gift data.
- Widening effect-51 `NGProfTypeList`s to all 31 proficiencies makes a stored native `ProfMaxLvl_Init` surface everywhere instead of on the talent subset, which worsens contaminated saves rather than fixing them.
- An effect-52 cap gift is self-excluded on its own apply, so it needs a separate always-granted effect-51 trigger to land; and repeated draws of the same gift id overwrite rather than stack.
- Row keys in `DT_Prof_ZhiYe_*` use shipping aliases (`Dun`, `DanDao`, `DaChui`, `ChangMao`) while `ProfType` is the canonical `EProficiency`; always match `ProfType`.
- UAssetAPI throws `FName+DummyFNameSerializationException: Attempt to serialize dummy FName` when a property or enum key is absent from `NameMap`; append the name first.
- The manager CDO is a `RawExport`, so `ProficiencyConfigClass`, `GoodNGMaxNum`, and the defect counts cannot be typed-edited; and no symbols ship, so addresses must be re-derived for each build.
