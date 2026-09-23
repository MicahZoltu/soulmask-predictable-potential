# Weapon Mastery (ZhuanJing)

This reference describes how a Soulmask weapon grants permanent mastery abilities as a character's proficiency with that weapon rises.
It is written for a mod maker who wants to read or edit mastery data.
Related progression topics live in [proficiencies-and-caps.md](proficiencies-and-caps.md) and [talents.md](talents.md).

Confidence labels used below: **in-game verified** means observed on a running server or client; **asset-level verified** means read from the cooked asset; **disassembly-verified** means read from the shipping Linux server binary; **inferred** means derived from structure rather than directly observed; **unverified** means plausible but not confirmed.

## 1. Overview

Weapon mastery covers nine weapons: Blade, Spear, Bow, Hammer, Shield, Gauntlets, Dual Blades, Greatsword, and Whip.
Each weapon has a pool of mastery abilities and four unlock thresholds at weapon proficiency 30, 60, 90, and 120.
A character that reaches a threshold has a chance to learn one ability drawn from that threshold's pool, and each threshold grants at most one ability.
The fixed initial sequence and the per-threshold random draw are described in section 4.
The later thresholds (60/90/120) are the golden tiers; the strongest capstone ability enters the level-60 pool and grows more likely at 90 and 120.
The community description (one starting ability, then a new ability every 30 levels, randomized with a per-level chance to learn) matches the data in outline: the data is threshold-keyed at 30/60/90/120, not rolled per level. (Asset-level verified)

## 2. Data model

The mastery input is three DataTables. (Asset-level verified)

| Asset | Game path | Row struct | Rows |
| --- | --- | --- | --- |
| `DT_ZhuanJingSLD` | `/Game/Blueprints/ZiYuanGuanLi/DT_ZhuanJingSLD` | `ZhuanJingShuLianDuTable` | 9 |
| `DT_SpecializedSkill` | `/Game/Data/DataTables/DT_SpecializedSkill` | `ZhuanJingJiNeng` | 88 |
| `DT_GuDingZhuanJing` | `/Game/Blueprints/ZiYuanGuanLi/DT_GuDingZhuanJing` | `GuDingZhuanJing` | 27 |

The manager `BP_ZiYuanGuanLiQi` resolves the tables through its class-default object: `ZJJNBiao → DT_ZhuanJingSLD` (import `-4092`), `ZhuanJingArray → DT_SpecializedSkill` (import `-4100`), and `GuDingZJAbilityMap → DT_GuDingZhuanJing` (import `-4075`). (Asset-level verified)

### 2.1 DT_ZhuanJingSLD

`DT_ZhuanJingSLD` has one row per weapon.
The row name is an unrelated decimal (`21` for Blade through `30` for Whip); the weapon identity is the `UseWuQiLeiXing` field, not the row name. (Asset-level verified)

| Field | Serialized type | Meaning |
| --- | --- | --- |
| `ShuLianDuType` | `ByteProperty` over `EProficiency` | Proficiency this row drives (`EProficiency::Dao`, …) |
| `UseWuQiLeiXing` | `EnumProperty` over `EWuQiLeiXing` | Weapon (`EWuQiLeiXing::WUQI_LEIXING_DAO`, …) |
| `PinZhiGaiLv` | `MapProperty<int, float>` | Character quality 0-5 → chance; uniformly `0.5` in every shipped row |
| `SLDGaiLv` | `MapProperty<int, ZJGaiLvHeJiNengChi>` | Threshold `30/60/90/120` → `{GaiLv, JiNengChi}` |

Each `ZJGaiLvHeJiNengChi` value is a struct with `GaiLv` (`FloatProperty`, the chance to learn at that threshold, uniformly `0.5` shipped) and `JiNengChi` (`MapProperty<int, int>`, ability index → selection weight). (Asset-level verified)
The `SLDGaiLv` map is keyed exactly `30/60/90/120` in all nine rows. (Asset-level verified)

A concrete `DT_ZhuanJingSLD` row (`Dao`) decoded from the cooked asset:

```json
{ "ShuLianDuType": "EProficiency::Dao", "UseWuQiLeiXing": "EWuQiLeiXing::WUQI_LEIXING_DAO",
  "PinZhiGaiLv": {"0":0.5,"1":0.5,"2":0.5,"3":0.5,"4":0.5,"5":0.5},
  "SLDGaiLv": {
    "30":  { "GaiLv": 0.5, "JiNengChi": {"101":20,"102":20,"103":20,"104":20,"105":20,"197":20,"198":20} },
    "60":  { "GaiLv": 0.5, "JiNengChi": {"101":20,"102":20,"103":20,"104":20,"105":20,"106":5, "197":20,"198":20} },
    "90":  { "GaiLv": 0.5, "JiNengChi": {"101":20,"102":20,"103":20,"104":20,"105":20,"106":10,"197":20,"198":20} },
    "120": { "GaiLv": 0.5, "JiNengChi": {"101":20,"102":20,"103":20,"104":20,"105":20,"106":20,"197":20,"198":20} }
  } }
```

### 2.2 DT_SpecializedSkill

`DT_SpecializedSkill` holds the complete ability catalogue: 88 rows, one per `JiNengIndex` across all weapons. (Asset-level verified)
Each row carries `JiNengIndex`, `SkillName` (null in every shipped row), `UseWuQiLeiXing`, and `ZJJN` (struct `HSuperAbilitySet_GameplayAbility`) with `Ability` (the `GA_*_C` gameplay-ability class), `AbilityLevel` (always `1`), and `InputTag` (always `Ability.WuQi.F`). (Asset-level verified)
Some catalogue abilities are never listed in any threshold pool, for example `GA_Dun_ZJ_JiNeng02_C` (index `599`), `GA_Fist_Attack_titui_C` (`699`), and `GA_GongJian_ZJ_CheBu_C` (`399`), so the catalogue is larger than the union of the pools. (Asset-level verified)

The complete index → ability-class catalogue, grouped by weapon:

| Weapon | Proficiency | Index → ability class |
| --- | --- | --- |
| Blade | `Dao` | `101` `GA_Dao_ZJ_JiNeng01_C`, `102` `GA_Dao_ZJ_JiNeng02_C`, `103` `GA_Dao_ZJ_JiNeng03_C`, `104` `GA_Dao_ZJ_JiNeng04_C`, `105` `GA_Dao_ZJ_JiNeng05_C`, `106` `GA_Dao_ZJ_JiNeng06_C`, `197` `GA_Blade_Skill02_C`, `198` `GA_Blade_Skill01_C`, `199` `GA_Blade_VAttack_2_C` |
| Spear | `Mao` | `201` `GA_Mao_ZJ_JiNeng01_C`, `202` `GA_Mao_ZJ_JiNeng02_C`, `203` `GA_Mao_ZJ_JiNeng03_C`, `204` `GA_Mao_ZJ_JiNeng04_C`, `205` `GA_Mao_ZJ_JiNeng05_C`, `206` `GA_Mao_ZJ_JiNeng06_C`, `295` `GA_Spear_Skill05_C`, `296` `GA_Spear_Skill03_weiyong_C`, `297` `GA_Spear_Skill02_C`, `298` `GA_Spear_Skill01_C`, `299` `GA_Shooter_C` |
| Bow | `Gong` | `301` `GA_GongJian_ZJ_03_C`, `302` `GA_GongJian_ZJ_02_C`, `303` `GA_SheJian_KaiZhanJi_New_C`, `304` `GA_GongJian_ZJ_04_C`, `305` `GA_GongJian_ZJ_05_C`, `396` `GA_Bow_Skill04_C`, `397` `GA_Bow_Skill03_C`, `398` `GA_Bow_Skill01_C`, `399` `GA_GongJian_ZJ_CheBu_C` |
| Hammer | `Chui` | `401` `GA_Chui_ZJ_JiNeng01_C`, `402` `GA_Chui_ZJ_JiNeng02_C`, `403` `GA_Chui_ZJ_JiNeng03_C`, `404` `GA_Chui_ZJ_JiNeng04_C`, `405` `GA_Chui_ZJ_JiNeng05_C`, `406` `GA_Chui_ZJ_JiNeng06_C`, `497` `GA_Hammer_Skill02_C`, `498` `GA_Hammer_Skill01_C`, `499` `GA_Hammer_Buff_C` |
| Shield | `DunPai` | `501` `GA_Dun_ZJ_JiNeng01_C`, `503` `GA_Dun_ZJ_JiNeng03_C`, `504` `GA_Dun_ZJ_JiNeng04_C`, `505` `GA_Dun_ZJ_JiNeng05_C`, `506` `GA_Dun_ZJ_JiNeng06_C`, `507` `GA_Dun_ZJ_JiNeng07_C`, `508` `GA_Dun_ZJ_JiNeng08_C`, `597` `GA_Shield_Skill02_C`, `598` `GA_Shield_Skill01_C`, `599` `GA_Dun_ZJ_JiNeng02_C` |
| Gauntlets | `QuanTao` | `601` `GA_QuanTao_ZJ_JiNeng01_C`, `602` `GA_QuanTao_ZJ_JiNeng02_C`, `603` `GA_QuanTao_ZJ_JiNeng03_C`, `604` `GA_QuanTao_ZJ_JiNeng04_C`, `605` `GA_QuanTao_ZJ_JiNeng05_C`, `606` `GA_QuanTao_ZJ_JiNeng06_C`, `607` `GA_QuanTao_ZJ_JiNeng07_C`, `608` `GA_QuanTao_ZJ_JiNeng08_C`, `696` `GA_Fist_Skill03_C`, `697` `GA_Fist_Skill02_C`, `698` `GA_Fist_Skill01_C`, `699` `GA_Fist_Attack_titui_C` |
| Dual Blades | `ShuangDao` | `701` `GA_ShuangDao_ZJ_JiNeng01_C`, `702` `GA_ShuangDao_ZJ_JiNeng02_C`, `703` `GA_ShuangDao_ZJ_JiNeng03_C`, `704` `GA_ShuangDao_ZJ_JiNeng04_C`, `705` `GA_ShuangDao_ZJ_JiNeng05_C`, `706` `GA_ShuangDao_ZJ_JiNeng06_C`, `707` `GA_ShuangDao_ZJ_JiNeng08_buff_C`, `797` `GA_ShuangDao_Skill02_C`, `798` `GA_DualBlade_Skill01_C`, `799` `GA_Shuangdao_VAttack01_C` |
| Greatsword | `DaJian` | `801` `GA_DaJian_ZJ_JiNeng01_C`, `802` `GA_DaJian_ZJ_JiNeng02_C`, `803` `GA_DaJian_ZJ_JiNeng03_C`, `804` `GA_DaJian_ZJ_JiNeng04_C`, `805` `GA_DaJian_ZJ_JiNeng05_C`, `806` `GA_DaJian_ZJ_JiNeng06_C`, `897` `GA_BigSword_Skill02_3_C`, `898` `GA_BigSword_Skill01_C`, `899` `GA_BigSword_VAttack_C` |
| Whip | `Bian` | `901` `GA_Bian_ZJ_JiNeng01_C`, `902` `GA_Bian_ZJ_JiNeng02_C`, `903` `GA_Bian_ZJ_JiNeng03_C`, `904` `GA_Bian_ZJ_JiNeng04_C`, `905` `GA_Bian_ZJ_JiNeng05_C`, `906` `GA_Bian_ZJ_JiNeng06_C`, `907` `GA_Bian_ZJ_JiNeng07_C`, `908` `GA_Bian_ZJ_JiNeng08_C`, `999` `GA_Bian_VAttack02_C` |

Bow is a naming exception in the catalogue: index `301` is `GA_GongJian_ZJ_03_C` and index `302` is `GA_GongJian_ZJ_02_C`, so the numeric suffix does not rise with the index. (Asset-level verified)

### 2.3 Threshold pools per weapon

Each weapon has exactly four threshold slots, but its pool union holds more abilities, so a selection decision is required: choose which four of the pool to grant, and assign them to the four thresholds. (Asset-level verified)

| Weapon | Proficiency | Pool indices (union) | Pool size | Full catalogue | Fixed 30/60/90 | Golden capstone |
| --- | --- | --- | --- | --- | --- | --- |
| Blade | `Dao` | `101-106,197,198` | 8 | 9 | 102/103/105 | 106 |
| Spear | `Mao` | `201-206,295,297,298` | 9 | 11 | 201/203/298 | 206 |
| Bow | `Gong` | `301,302,304,305,396,397,398` | 7 | 9 | 301/304/302 | 303 |
| Hammer | `Chui` | `401-406,497,498` | 8 | 9 | 401/402/404 | 406 |
| Shield | `DunPai` | `501,503-508,597,598` | 9 | 10 | 505/501/506 | 508 |
| Gauntlets | `QuanTao` | `601-608,696,697,698` | 11 | 12 | 601/604/603 | 606 |
| Dual Blades | `ShuangDao` | `701-707,797,798` | 9 | 10 | 703/704/702 | 707 |
| Greatsword | `DaJian` | `801-806,897,898` | 8 | 9 | 804/801/803 | 806 |
| Whip | `Bian` | `901-908` | 8 | 9 | 902/903/904 | 908 |

### 2.4 Shipped JiNengChi weights per threshold

Each threshold's `JiNengChi` map is the candidate pool for the weighted-random draw, and the integer value is a relative selection weight, not a probability. (Asset-level verified)
The shipped entries below are exact index → weight pairs.

| Proficiency | Threshold | `JiNengChi` entries (index:weight) |
| --- | --- | --- |
| `Dao` | 30 | `101:20, 102:20, 103:20, 104:20, 105:20, 197:20, 198:20` |
| `Dao` | 60 | `101:20, 102:20, 103:20, 104:20, 105:20, 106:5, 197:20, 198:20` |
| `Dao` | 90 | `101:20, 102:20, 103:20, 104:20, 105:20, 106:10, 197:20, 198:20` |
| `Dao` | 120 | `101:20, 102:20, 103:20, 104:20, 105:20, 106:20, 197:20, 198:20` |
| `Mao` | 30 | `201:20, 202:20, 203:20, 204:20, 205:20, 295:20, 297:20, 298:20` |
| `Mao` | 60 | `201:20, 202:20, 203:20, 204:20, 205:20, 206:5, 295:20, 297:20, 298:20` |
| `Mao` | 90 | `201:20, 202:20, 203:20, 204:20, 205:20, 206:10, 295:20, 297:20, 298:20` |
| `Mao` | 120 | `201:20, 202:20, 203:20, 204:20, 205:20, 206:20, 295:20, 297:20, 298:20` |
| `Gong` | 30 | `301:20, 302:20, 304:20, 305:20, 396:20, 397:20, 398:20` |
| `Gong` | 60 | `301:20, 302:20, 303:5, 304:20, 305:20, 396:20, 397:20, 398:20` |
| `Gong` | 90 | `301:20, 302:20, 303:10, 304:20, 305:20, 396:20, 397:10, 398:20` |
| `Gong` | 120 | `301:20, 302:20, 303:20, 304:20, 305:20, 396:20, 397:20, 398:20` |
| `Chui` | 30 | `401:20, 402:20, 403:20, 404:20, 405:20, 497:20, 498:20` |
| `Chui` | 60 | `401:20, 402:20, 403:20, 404:20, 405:20, 406:5, 497:20, 498:20` |
| `Chui` | 90 | `401:20, 402:20, 403:20, 404:20, 405:20, 406:10, 497:20, 498:20` |
| `Chui` | 120 | `401:20, 402:20, 403:20, 404:20, 405:20, 406:20, 497:20, 498:20` |
| `DunPai` | 30 | `501:20, 503:20, 504:20, 505:20, 506:20, 507:20, 597:20, 598:20` |
| `DunPai` | 60 | `501:20, 503:20, 504:20, 505:20, 506:20, 507:20, 508:5, 597:20, 598:20` |
| `DunPai` | 90 | `501:20, 503:20, 504:20, 505:20, 506:20, 507:20, 508:10, 597:20, 598:20` |
| `DunPai` | 120 | `501:20, 503:20, 504:20, 505:20, 506:20, 507:20, 508:20, 597:20, 598:20` |
| `QuanTao` | 30 | `601:20, 602:20, 603:20, 604:20, 605:20, 607:20, 608:20, 696:20, 697:20, 698:20` |
| `QuanTao` | 60 | `601:20, 602:20, 603:20, 604:20, 605:20, 606:5, 607:20, 608:20, 696:20, 697:20, 698:20` |
| `QuanTao` | 90 | `601:20, 602:20, 603:20, 604:20, 605:20, 606:10, 607:20, 608:20, 696:20, 697:20, 698:20` |
| `QuanTao` | 120 | `601:20, 602:20, 603:20, 604:20, 605:20, 606:20, 607:20, 608:20, 696:20, 697:20, 698:20` |
| `ShuangDao` | 30 | `701:20, 702:20, 703:20, 704:20, 705:20, 706:20, 797:20, 798:20` |
| `ShuangDao` | 60 | `701:20, 702:20, 703:20, 704:20, 705:20, 706:20, 707:5, 797:20, 798:20` |
| `ShuangDao` | 90 | `701:20, 702:20, 703:20, 704:20, 705:20, 706:20, 707:10, 797:20, 798:20` |
| `ShuangDao` | 120 | `701:20, 702:20, 703:20, 704:20, 705:20, 706:20, 707:20, 797:20, 798:20` |
| `DaJian` | 30 | `801:20, 802:20, 803:20, 804:20, 805:20, 897:20, 898:20` |
| `DaJian` | 60 | `801:20, 802:20, 803:20, 804:20, 805:20, 806:5, 897:20, 898:20` |
| `DaJian` | 90 | `801:20, 802:20, 803:20, 804:20, 805:20, 806:10, 897:20, 898:20` |
| `DaJian` | 120 | `801:20, 802:20, 803:20, 804:20, 805:20, 806:20, 897:20, 898:20` |
| `Bian` | 30 | `901:20, 902:20, 903:20, 904:20, 905:20, 906:20, 907:20, 908:0` |
| `Bian` | 60 | `901:20, 902:20, 903:20, 904:20, 905:20, 906:20, 907:20, 908:5` |
| `Bian` | 90 | `901:20, 902:20, 903:20, 904:20, 905:20, 906:20, 907:20, 908:10` |
| `Bian` | 120 | `901:20, 902:20, 903:20, 904:20, 905:20, 906:20, 907:20, 908:20` |

Two anomalies beyond the standard capstone ramp: the Bow non-capstone index `397` carries weight `10` at threshold `90` rather than its `20` at `30`/`60`/`120`, so Bow/90 lists two weight-`10` entries, the capstone `303` on its standard ramp and `397`; and the Whip capstone `908` is present at threshold `30` with weight `0`, so it cannot be selected there, whereas every other weapon's capstone is absent from its level-30 pool. (Asset-level verified)

### 2.5 DT_GuDingZhuanJing

`DT_GuDingZhuanJing` maps `JiNengIndex` → `JiNengLv` and is the fixed sequence for the blank body: one ability at level 30, one at 60, and one at 90 per weapon (27 rows). (Asset-level verified)
The complete mapping is:

| Weapon | Level 30 | Level 60 | Level 90 |
| --- | --- | --- | --- |
| Blade (`Dao`) | `102` | `103` | `105` |
| Spear (`Mao`) | `201` | `203` | `298` |
| Bow (`Gong`) | `301` | `304` | `302` |
| Hammer (`Chui`) | `401` | `402` | `404` |
| Shield (`DunPai`) | `505` | `501` | `506` |
| Gauntlets (`QuanTao`) | `601` | `604` | `603` |
| Dual Blades (`ShuangDao`) | `703` | `704` | `702` |
| Greatsword (`DaJian`) | `804` | `801` | `803` |
| Whip (`Bian`) | `902` | `903` | `904` |

It is already deterministic and is separately data-editable; it does not require any selector change.

### 2.6 Golden tiers

The golden capstone family is `_ZJ_JiNeng06`/`_ZJ_JiNeng07`/`_ZJ_JiNeng08`, plus the special cases `GA_SheJian_KaiZhanJi_New_C` (Bow, index `303`) and `GA_ShuangDao_ZJ_JiNeng08_buff_C` (Dual Blades, index `707`). (Asset-level verified)
For every weapon the capstone is absent from the level-30 pool and enters at level 60 with weight `5`, then `10` at 90 and `20` at 120, so it grows progressively more likely. (Asset-level verified)
Whip is the exception: index `908` is listed in the level-30 pool with weight `0`, so it stays unselectable at that threshold. (Asset-level verified)

## 3. Selection semantics

The native selector is `UHZiYuanGuanLiQi::GetZhuanJingAbilityByShuLianDu` at `0x4453ac0` in the shipping Linux server binary `WSServer-Linux-Shipping`. (Disassembly-verified)

The important behaviours are:

- **Owned-ability exclusion.** Candidate indices are collected from `JiNengChi` only after each is compared against the character's owned mastery array stored at `0x33f8` (count at `0x3400`, stride `0xc`); a match skips that candidate (`0x44541e6`-`0x4454220`). (Disassembly-verified)
- **Already-satisfied threshold early-out.** A separate scan of the same owned array returns `-1` when a matching (weapon, threshold-level) pair is already present, so a threshold is not spent twice (`0x4453de5`-`0x4453e26`). (Disassembly-verified)
- **Blank-body flag.** `testb $0x1,0x26c8(%r8)` selects the fixed `DT_GuDingZhuanJing` path (`0x4453b76`); the same owned array is checked there so fixed picks are not re-granted. (Disassembly-verified)
- **Chance composition.** The routine reads the quality-keyed map (`PinZhiGaiLv`) and the matched threshold entry's `GaiLv`, then forms a success threshold by summing two floats (`movss 0x4(%rdi),%xmm0` then `addss 0x8(%rbx,%r15,1),%xmm0`, stored at `0xc(%rsp)`; `0x4453f18`-`0x4453f24`). A per-thread xorshift stream produces a uniform fraction in `[0,1)`, and `ucomiss`/`ja` (`0x4454078`-`0x4454082`) fails the roll and returns `eax = -1`, granting and recording nothing. (Disassembly-verified)

**Duplicate-ability verdict:** duplicates are prevented natively. (Disassembly-verified)
A multi-entry `JiNengChi` pool with `GaiLv = 1.0` therefore grants a random un-owned ability at each threshold.
A threshold can only be wasted if every entry in its pool is already owned, in which case the candidate list is empty and the routine returns `-1`; the shipped pools are large enough (7-11 entries per weapon) that this does not occur in normal play.

**Failed-unlock retry:** a failed roll is not permanently latched on every path, but the two callers differ. (Disassembly-verified)
`UHChengZhangComponent::InitProficiency` (`0x4879bf0`-`0x4879c3a`) loops every 30-level band up to the current level (`r15d = level / 30`, starting at `30`, stepping by `30`), so it re-evaluates ungranted bands.
`UHChengZhangComponent::UpgradeProficiency` (`0x41c5ed3`-`0x41c5ef7`) passes only the largest multiple of `30` not exceeding the current level (`r8d = 30 * (level / 30)`), so it evaluates the current band only.
Whether every failed band is revisited by a later `UpgradeProficiency` call was not conclusively traced; setting `GaiLv = 1.0` makes the first attempt succeed and removes the dependency on retry.

**Chance-composition caveat:** the disassembly sums the quality float and the threshold `GaiLv`. (Disassembly-verified)
With every shipped value at `0.5` that sum is `1.0`, so under the verified additive composition every shipped roll succeeds. (Disassembly-verified)
The exact native struct offsets behind `PinZhiGaiLv` versus `SLDGaiLv` were inferred from the map layouts rather than annotated, so the addition is disassembly-verified while the identity of the two summed floats remains inferred. (Disassembly-verified for the addition; the addend identity inferred)

## 4. Starting ability and the per-threshold draw

The blank body's first three mastery picks come from the fixed `DT_GuDingZhuanJing` sequence, which grants one ability at proficiency 30, 60, and 90 per weapon and is deterministic. (Asset-level verified)
Recruited tribesmen instead draw from the per-threshold `SLDGaiLv` pool. (Asset-level verified)
Whether the blank body also runs the random `SLDGaiLv` path in addition to its fixed picks is unverified. (Unverified)

Each threshold's `JiNengChi` is the candidate pool for a weighted-random draw; the integer values are relative selection weights, not probabilities. (Asset-level verified)
The shipped weights are uniformly `20` for the common abilities and ramp `5 → 10 → 20` at thresholds `60 → 90 → 120` for the golden capstone.
Because the pool is a multi-entry map, the granted ability stays random among the candidates the character does not already own.
Initial mastery can also be seeded by spawn data (`WuQiAndJiNeng` on `BP_SGQ_*`/`BP_BuLuo_Base`) and by an archetype row's `CustomizeZhuanJing` (weapon type, target proficiency level, and GA id); this is the proficiency-0 row detailed in section 5. (Asset-level verified)

## 5. The proficiency-0 starting mastery row

The mastery UI shows two unrelated things, and conflating them makes the 0 row look editable when it is not. (Disassembly-verified)

**Inherent Comprehension** (`先天领悟`) is a separate UI line that every character carries from generation, is identical on every character, and is always granted.
Its data is the manager default object `BP_ZiYuanGuanLiQi.Default__BP_ZiYuanGuanLiQi_C.ZhuanJingAbilitySets`, a serialized `TArray<int32>` holding the per-weapon `*99` catalogue abilities `{199, 299, 399, 499, 599, 699, 799, 899, 999}`. (Asset-level verified)
The native apply `0x480da60` appends each index to the character's mastery array at `character+0x33f8` with level `0xffffffff`, which is the row the UI labels Inherent Comprehension. (Disassembly-verified)
The manager class default object is a `RawExport`, so UAssetAPI cannot typed-edit its `ZhuanJingAbilitySets`; the row works as shipped and is not the subject of the limitation below. (Asset-level verified)

The **proficiency slot** row displays a `0/30/60/90/120` row. (Disassembly-verified)
The 30/60/90/120 slots are the `DT_ZhuanJingSLD` threshold rolls described in section 3; the shipped thresholds are fixed at multiples of 30, `SLDGaiLv` is keyed exactly `30/60/90/120`, there is no key `0`, and no caller of the selector requests threshold `0`. (Disassembly-verified)
`DT_ZhuanJingSLD` therefore cannot control the 0 row, and setting `SLDGaiLv` — including adding a `0` key — cannot make the 0 row deterministic or universal. (Disassembly-verified)

The 0 row is a **generation-time starting-mastery grant**, not a threshold roll. (Disassembly-verified)
The native function `0x48790e0`, called from the character-generation function `0x4872d70` at call sites `0x4873a52` and `0x4874068`, reads the spawner-data `HShuaGuaiQiData.WuQiAndJiNeng` map at offset `0x2d0`/`0x2d8`, keyed by each generated starting weapon's type byte. (Disassembly-verified)
For each starting weapon it copies that weapon's `ZJJNIndexArray`, filters out indices the character already owns, draws one index with an RNG, and appends a mastery record at level `0`. (Disassembly-verified)
A character therefore gets exactly one proficiency-0 row per starting weapon, the granted ability is a random draw from that weapon's starting pool, and the row exists only for the weapons in the random starting loadout. (Disassembly-verified)

Starting weapons come from `BP_SGQ_BuLuo_Base.PinZhiAndWuQiQz`, which selects a quality-weighted count of 2–4 weapons per NPC from the per-region `DT_DiWeiWuQi_<camp>` tables. (Asset-level verified)
The base spawner's `WuQiAndJiNeng` map holds 8 weapon keys (no Whip); the Shifting Sands (Egypt) spawner holds Whip only. (Asset-level verified)
The starting pools, read from `WuQiAndJiNeng.ZJJNIndexArray`, are: (Asset-level verified)

| Weapon | Starting `ZJJNIndexArray` |
| --- | --- |
| Blade (`Dao`) | `101–105` |
| Spear (`Mao`) | `201–205` |
| Bow (`Gong`) | `301, 302, 304, 305` |
| Hammer (`Chui`) | `401–405` |
| Shield (`DunPai`) | `501, 503–507` |
| Gauntlets (`QuanTao`) | `601–605, 607, 608` |
| Dual Blades (`ShuangDao`) | `701–706` |
| Greatsword (`DaJian`) | `801–805` |
| Whip (`Bian`) | no base entry |

The 0 row cannot be easily overridden by a pak: the grant is native, and its only data inputs are the per-weapon, per-region starting pools rather than a single table. (Disassembly-verified)
The recovered addresses and record layouts behind these claims are in [../reverse-engineering/native-binary-analysis.md](../reverse-engineering/native-binary-analysis.md) section 9.3.

### 5.1 Data-only mitigations and their limits

- Collapsing each weapon's `WuQiAndJiNeng.ZJJNIndexArray` to a single index makes the proficiency-0 ability deterministic for whatever weapons a character starts with, but does not add rows for weapons the character did not start with. (Asset-level verified for the edit shape)
- Adding `ProfLv = 0` entries to `DT_CustomizeNPC.CustomizeZhuanJing` (struct `CustomizeZJGA`, fields `{WeaponType, ProfLv, GANo}`) seeds proficiency-0 masteries **without weapons**, because the native copy `0x480d7c0` applies no `ProfLv` filter. (Disassembly-verified)
  It applies only to characters that carry a `CustomizeRowName` — Outcast recruits and invasion forces in the base game and the Egypt DLC, a small fraction of world spawns — and wild or camp spawners such as `BP_SuiJi_BuLuo` have no archetype; the exact coverage fraction is not measured. (Inferred)
  It also applies only when the character has no mastery records yet (`character+0x3400 <= 0`), so ordering against other generation grants is unconfirmed. (Disassembly-verified for the condition; ordering inferred)
- The broad alternative, giving every NPC every weapon type, requires editing `PinZhiAndWuQiQz` plus roughly 75 per-region `DT_DiWeiWuQi_*` tables, caps at 8 weapons (no base Whip), and floods NPCs with gear, with loot, equipment, AI, and replication side effects. (Inferred)

A universal, clean fix for the 0 row is native-only.

## 6. Edit recipe: making unlocks reliable

This section is a mod edit recipe, not shipped behavior; the generic DataTable edit mechanics (row/value edits, map edits, and repacking) are in [../modding-guide/data-editing.md](../modding-guide/data-editing.md). (Asset-level verified for the edit shape; mechanism in-game unverified)

To make every reachable threshold grant a mastery while keeping the granted ability random, edit only `DT_ZhuanJingSLD`.

For every one of the nine weapon rows:

1. Set every value under `PinZhiGaiLv` to `1.0`.
2. For each of the four `SLDGaiLv` thresholds set `GaiLv` to `1.0`.
3. Leave `JiNengChi` as the shipped multi-entry pool. (Asset-level verified for the edit shape; in-game unverified)

Setting both `GaiLv` and `PinZhiGaiLv` to `1.0` guarantees success regardless of the exact composition, so the additive detail does not matter.
Leaving `JiNengChi` multi-entry keeps the unlock random among un-owned abilities.
No Blueprint or native work is required; the whole input is data, and the selector's other details are bypassed by the `1.0` chances.

Optional variants: (Asset-level verified as data edits)

- To guarantee the capstone, set only threshold `120`'s `JiNengChi` to the single capstone index (`106/206/303/406/508/606/707/806/908`), leaving 30/60/90 as multi-entry random pools.
- To guard against pool exhaustion, remove from each threshold's pool the indices guaranteed to be owned earlier (the `DT_GuDingZhuanJing` fixed picks at 30/60/90); each remaining entry is then un-owned and the grant is guaranteed regardless of the native filter.

## 7. Threshold reachability at design caps

The cap figures in this section are mod design targets, not shipped caps. (Inferred)
Mastery thresholds are fixed at `30/60/90/120`, and a threshold grants its unlock only when proficiency reaches it; the selection path excludes abilities already owned. (Asset-level verified for the thresholds; reachability follows from the caps.)

| Weapon role | Cap | 30 | 60 | 90 | 120 | Unlocks |
| --- | --- | --- | --- | --- | --- | --- |
| Class weapon (primary) | 125 | yes | yes | yes | yes | 4 |
| Non-class weapon (settled) | 85 | yes | yes | no | no | 2 |
| Non-class weapon (native model) | 100 | yes | yes | yes | no | 3 |
| Blank-body combat (`BaiBanProfMaxLvlList`) | 40 | yes | no | no | no | 1 |

The class ceiling is `ProfInitMaxLvlMax (100) + class MaxAdd (25) = 125`. (Asset-level verified)
The settled non-class cap is 85 per [../../DESIGN.md](../../DESIGN.md); any non-class cap below `90` reaches only the first two thresholds, so the exact non-class value does not change the unlock count.
A Training Ground cap-raise can lift a non-class weapon above its cap toward a mentor's cap (up to the class `125`), which re-opens `90/120`; see [training-ground-and-transfer.md](training-ground-and-transfer.md).
The weapon-proficiency cap composition itself is covered in [proficiencies-and-caps.md](proficiencies-and-caps.md).

## 8. Console commands

The command names are literal `Exec` strings in the shipping server binary. (Asset-level verified)

| Command | Argument | Effect |
| --- | --- | --- |
| `AddZJ` | mastery ability index (`DT_SpecializedSkill.JiNengIndex`, `101`-`999`) | Grants one mastery ability |
| `RefreshZJ` | none | Recomputes mastery from the current character state |

`AddZJ` and `RefreshZJ` are corroborated by the adjacent Blueprint function names `K2_AddNG`/`K2_RemoveNG` in the same binary.
The argument spaces are high confidence; the exact reflection signature (parameter order and property types) was not recovered statically.
Proficiency-side commands (`SLDDengJi`, `SLDDengJiAll`, `SLDJingYan`, `SetShuLianDuMaxVal`) move the proficiency value that reaches the thresholds; they are listed in [console-commands.md](console-commands.md).

## 9. Foot-guns

- **Chance composition is additive.** The selector sums `PinZhiGaiLv` and `GaiLv` (disassembly-verified), so the shipped `0.5 + 0.5 = 1.0` always succeeds; set both to `1.0` so a lowered value on either side still cannot gate.
- **Duplicate handling is native and already correct.** The owned-array filter prevents a repeated grant and stops a threshold being spent on an already-held ability, so overlapping pools across thresholds are harmless. Do not delete pool entries to avoid repeats.
- **"Reliable unlock" is not "fixed ability".** Setting the chances to `1.0` makes the grant reliable but keeps it random. Collapsing `JiNengChi` to a single entry makes the ability deterministic; use that only when a fixed sequence is actually wanted.
- **Native-only versus data-editable boundary.** All three mastery assets are DataTables and are fully editable. The `GaiLv` roll, the weighted `JiNengChi` draw, and the owned-ability exclusion are native C++ in `WSServer-Linux-Shipping`; the `1.0` edit makes those details irrelevant to the outcome rather than editing them.
- **No mastery edit has been observed in game.** The selector is disassembled, the edits re-parse, and the mechanism is asset-level verified, but no mastery pak was built and no unlock was observed on a running server; the reliable-unlock behaviour is in-game unverified.
- **Whip is a data exception.** Index `908` is present in the level-30 pool at weight `0`; a collapse that assumed the capstone is absent at 30 would mis-handle Whip.
- **The fixed blank-body picks and the archetype seed are separate.** `DT_GuDingZhuanJing` is already deterministic; initial mastery can also arrive through spawn data (`WuQiAndJiNeng`) and archetype rows (`CustomizeZhuanJing`), so an unlock that looks wrong may come from a starting grant rather than the threshold selector.
- **The 0 row is native, not a threshold.** The proficiency-0 row is a generation-time random draw over each starting weapon's `ZJJNIndexArray` (section 5); no `DT_ZhuanJingSLD` edit, including a `SLDGaiLv` key `0`, reaches it, and a pak can only make it deterministic for the weapons a character already starts with.
