# Consistent Progression — mod status

## Overview

Consistent Progression is a Soulmask (Unreal Engine 4.27, including the Shifting Sands DLC) mod that makes recruit proficiency caps, starting skill, talent tiers, mastery unlocks, and roster growth deterministic, keeping quality as the one meaningful recruitment filter.
The design is specified in [`../DESIGN.md`](../DESIGN.md).
The game data it edits is documented under [`game-reference/`](game-reference/), for example [`game-reference/proficiencies-and-caps.md`](game-reference/proficiencies-and-caps.md), [`game-reference/starting-proficiency.md`](game-reference/starting-proficiency.md), [`game-reference/weapon-mastery.md`](game-reference/weapon-mastery.md), [`game-reference/talents.md`](game-reference/talents.md), [`game-reference/quality-and-rarity.md`](game-reference/quality-and-rarity.md), and [`game-reference/recruitment-and-spawns.md`](game-reference/recruitment-and-spawns.md).
It ships as one unsigned pak, `ConsistentProgression_P.pak`, built by the pipeline under [`../build/`](../build/) entirely from the retail cooked assets, with mount point `../../../` and an unencrypted index.
The pak is produced by [`build.sh`](../build/build.sh), and its content is verified asset by asset.
The container hash is not byte-reproducible, because `repak` does not emit a deterministic container even when the staged content is fixed, so a specific container hash is not a stable identity and is not pinned here.
The build and pak workflow is described in [`../build/README.md`](../build/README.md) and the modding guide under `modding-guide/`.
The pak is installed where the game loads local paks (`WS/Content/Paks/` or `WS/Content/Paks/~mods/` on the dedicated server) and loaded with `-fileopenlog`, which the engine requires for an unsigned pak.

## What the delivered pak changes

The global base cap is 85 and the native clamp is 50/150, so a class skill at addend 40 caps at 125 and every off-class skill resolves to 85.
Class skills add 36 to starting proficiency on top of the shared non-class curve.

| Asset | Edit | Verified result |
| --- | --- | --- |
| `BP_ProficiencyConfig` class default `Default__BP_ProficiencyConfig_C` | Sets `ProfInitMaxLvlMin = ProfInitMaxLvlMax = 85`, `ProfMaxLvlLowerLimit = 50`, `ProfMaxLvlUpperLimit = 150`, and zeroes `ProfInitLvlMin`/`ProfInitLvlMax` on every `ClanDiWeiProfInitLvlMap` rank | Frozen global base cap 85, clamp 50/150, clan-rank addends 0. |
| `BP_ProficiencyConfig.JueSeLvlProfLvlList` | Replaces the list with 52 degenerate `ProfInitLvlMin = ProfInitLvlMax` bands, a guard band `0–0 → 1`, and a plateau `51–200 → 76` | Non-class starting proficiency is `round(1 + 75·(L − 1)/49)`, which is 1 at level 1, 39 at level 26, and 76 at level 50 and above. |
| Six `DT_Prof_ZhiYe_*` | Reshapes each class table to its DESIGN class skill set at `MinAdd = MaxAdd = 40` | Class skills cap at 125 (`85 + 40`); every other skill caps at the non-class 85. |
| Six `SLD_ChuShiLv_*` | Reshapes each starting table to the same class skill set at `MinAdd = MaxAdd = 36` | A class skill's starting value is the shared curve plus 36, so 37 at level 1 and 112 at level 50. |
| `DT_ZhuanJingSLD` | Sets every `SLDGaiLv[*].GaiLv` and `PinZhiGaiLv` to `1.0` and keeps every multi-entry `JiNengChi` pool | 9 weapon rows with thresholds 30/60/90/120; each threshold a cap can reach grants an unlock on the first attempt, the ability stays a random draw from its 7–11 entry pool, and a known ability is not repeated; class weapons (cap 125) reach all four thresholds, non-class weapons (cap 85) reach 30 and 60. |
| `DT_CustomizeNPC` | Clears `CustomizeProfMaxLv` on all 56 rows | No base archetype can seed a cap. |
| `DT_CustomizeNPC_Egypt` (Shifting Sands) | Clears `CustomizeProfMaxLv` on all 96 rows | No DLC archetype can seed a cap; an Egypt archetype's `CustomizeNGMap` origin gift is not cleared, so the DLC origin-gift gap remains. |
| `BP_Mask_XiuFu01_1012` | Rebuilds the mask node with 15 `AddZhaoMuNum` tiers gated at awareness 4,8,…,60 under keys `ZhaoMuRamp01`–`ZhaoMuRamp15`, with name key `1_1012` and cycling description keys `1_1012_1..3` | The roster cap opens in 15 steps. |
| `BP_GameXiShu_GuanLiQi` | Adds all 15 keys to both default-object maps with cumulative offsets 3,6,…,45 | The applier sets `base + value`, so the personal tribesman cap climbs from native 3 to 48 and the disk `_Three = 50` cannot enter it. |
| `DT_GiftZongBiao` | Sets every star row of families 50001–50006 to its class skill list | One Origin talent per class at tier III: Origin - Laborer, Origin - Porter, Origin - Craftsman, Origin - Fighting, Origin - Hunting, Origin - Guard. |
| `BP_ManRenRandomConfig` | `BornChuShenCiTiaoList` keeps only each class's star-III origin at weight 100; `BornJingLiCiTiaoMap` clears its conditions and pins `700013` at weight 100 zeroing all other rows; `BornBuLuoCiTiaoMap` sets each tribe's `QuYu_0` to its settled families and appends the Outcast entry | One Origin, one Battle-Tested Experience, and one tribal talent are assembled per recruit. |
| `DT_GiftZhengMian` and `DT_GiftZhengMian_Custom` | Gives each of the six classes one gated row with its settled family set and drops tribal families from every other row | One class talent is drawn from the class set on a qualifying recruit. |
| `DT_PinZhiGoodNGStarWeight` | Quality 5/4/3 maps to star III/II/I at weight 100; qualities 0–2 weight nothing | Rarity gates the class-talent tier. |
| `DT_PinZhiGoodNGAddPr` | Qualities 3–5 carry a level-1 `Pr=1, Count=1`; qualities 0–2 carry a level-1 `Pr=0, Count=0` | Class talents are granted only to quality 3–5; quality 0–2 grant nothing while the cadence loop still runs. |
| `DT_GiftXiHaoBiao` | Removes the 12 gear preference rows | The remaining 37 rows are permanent mood-only flavor with no stat, combat, or production effect. |
| `DT_GiftFuMiann` | Removes every defect row | No defects are granted. |
| `WS/Content/Localization/Game/en/Game.locres` | Writes the six Origin talent `Title` and `Desc` keys | Origin tooltips name the class skill set, for example the Warrior reads `Raised in a clan that has produced many famous warriors. Proficiency growth rate for spear, blade, shield, bow, dual-blade, gauntlets, great sword, hammer, and whip +75%.` |

## Verification status

In-game verified surfaces are the two cap default-object constants and the roster ramp.
An overridden global base and clamp were read in game on a level-3 warrior and a level-5 guard, and the delivered pak sets base 85 with clamp 50/150.
The 15 roster-ramp tiers rendered the expected tooltips and the actual personal cap matched the tooltip `max`, climbing 3 → 48.

Asset-level verified surfaces are proven only by re-parse and byte-identical round-trip of the edited asset, not by a live game read.
Every edited `.uasset`/`.uexp` pair and the locres pass a no-change round-trip, an apply, and a second re-export that must reproduce the edited bytes, and each `verify` re-reads the settled value.
This covers the six class cap tables and six starting tables (including the reshaped class sets), the base and Egypt archetype clears, the starting curve bands, the mastery values, the origin and class-pool rows, the rarity weight and cadence, the preference and defect tables, and the locres origin text; the shipped locres confirms each key belongs to the intended class.

Pending in-game verification covers the mastery unlock at each reachable threshold with its random non-duplicate draw, a live recruit read of the added class rows and the new origin and class-pool families, the frozen class/base boundary on fresh spawns including a Craftsman archetype, the uniform Battle-Tested grant after the gate clear, the `Normal`-source tribal family grant, the preference draw and like/aversion mix, the rarity bands per quality on fresh recruits, the locres override priority over the base pak, the DLC Egypt caps and origin gifts, and the Training Ground cap-track disable.

The Training Ground cap-track disable is designed-not-edited: it specifies the `BP_JianZhuTrainingGround` `TraningExpAddMap[ShuLianDuTraining].BaseExpPerSeconds` edit, but the asset is not in `ASSET_MANIFEST` and no pak artifact exists.

## How to build and test

Run the build from the repository root or the build directory:

```sh
./build.sh
```

`build.sh` reads the extracted retail content trees and tool paths from environment variables, each with a `/tmp` default:

- `SOULMASK_SERVER_CONTENT`: the authoritative extracted tree, for example `/tmp/soulmask-server/extracted/WS/Content`.
- `SOULMASK_CLIENT_CONTENT`: the client tree; the localization edit reads `Localization/Game/en/Game.locres` from it.
- `DOTNET_ROOT`, `REPAK_PATH`, `UASSET_TO_JSON_DLL`, `ROUNDTRIP_DLL`.

The build writes its scratch under `build/.work/`, stages the pak root, and emits `build/dist/ConsistentProgression_P.pak`.

Run the in-memory test suite:

```sh
bun test
```

The in-memory suite passes and covers the pure helpers and the shared class-skill reshape; every test runs in memory and touches no filesystem, network, or subprocess.

The pak container hash is not byte-reproducible.
Three clean rebuilds produce identical staged asset content and different pak container bytes, because `repak`'s index and body layout is non-deterministic even when the staged content is fixed.
The delivered asset contents are reproducible; a specific container hash cannot be regenerated byte-for-byte and should not be treated as a stable identity.

The in-game acceptance checklist is at the repository root: [`../final-mod-verification-checklist.md`](../final-mod-verification-checklist.md).

## Current deviations and open items

- **Starting addend class set.** The delivered `SLD_ChuShiLv_*` tables are reshaped to the DESIGN class set through the shared `classSkillRows.ts` `applyClassSkillSet`, so the `+36` follows the DESIGN class set rather than the shipped retail row sets; the built Warrior start table carries exactly the nine DESIGN Warrior skills at 36. The in-game recruit read of the class addend is still pending.
- **Shifting Sands archetype.** `DT_CustomizeNPC_Egypt` (96 rows) is in `ASSET_MANIFEST` at `AdditionMap01/BluePrints/DataTable/DT_CustomizeNPC_Egypt` and has `CustomizeProfMaxLv` cleared on all 96 rows, so a DLC archetype cannot seed a cap. Its `CustomizeNGMap` origin gift is not cleared, so the DLC archetype origin-gift gap remains open, and the DLC in-game check is pending.
- **UAssetAPI dependency.** `build/DEPENDENCIES.md` records the build-only tools (Bun 1.3.9, `repak` 0.2.3, .NET 8, `UAssetAPI` 1.1.0) with role, rationale, alternatives, closure and license, and pinned version; the mod itself has no runtime dependency and `build/package.json` declares none.
- **Typecheck gate.** There is no `tsconfig.json` and no typecheck gate, so `bun test` exercises runtime behaviour but never type-checks and a type error can pass the suite.
- **Per-asset edit modules.** The per-asset edit modules are not unit-tested directly; the shared class-skill reshape and the pure helpers are covered, and the integration build's apply/verify pair is the only guard for the remaining modules, so a wrong constant shared by both apply and verify would go unnoticed.

Open decisions and unknowns:

- The exact per-skill class cap numbers are not frozen, including whether any class receives a signature tier above the uniform addend of 40.
- Whether a raw patch should pin the preference count and force a like/aversion split, because the native roll of 0–3 cannot guarantee either polarity.
- Whether to raw-patch `GoodNGMaxNum` (cooked 6), the preference count, and the starting defect count, and what the existing-save migration policy is.
- Whether the shipped `ProfExpInc` origin and title growth talents stay intact; they do not write caps and carry growth-rate differentiation either way.
- The ramp endgame is 48; the shipped game reaches 53 on the named difficulties, and the last tier could store 50 to match.
- The repair cost per tier is a placeholder of one `DaoJu_Item_Mask_CaiLiao01`.
- Whether the guild-rank `TribeMemCount` stays at the shipped `+5` steps; it is non-binding at the ramp target.
- The generation code that assigns the archetype row name at `character+0x3378` has not been located.
- The Egyptian talent rows are outside every edit, and the DLC archetype origin gift is not cleared.
- The repair UI may need unique locres text for 15 tiers that reuse three `StringTableEntry` keys.
- Whether an existing save re-applies the node effects on load and how it maps already-repaired tier indices onto the longer list.
- Whether an empty `DT_GiftFuMiann` is handled gracefully by the native defect selector.
- Whether a natural recruit can fail to draw a `ProfExpInc` trigger talent, which would drop the cap add for a quality 3–5 recruit.
- Whether the tribe cap clamps the increments (`3 + min(Σ, limit)`) or the finished total (`min(3 + Σ, limit)`).
- Whether a normal save load invokes the forced re-init that would refresh stored caps.
- The locres override priority over the base pak is unobserved.

## Risks

- Stored values on existing saves are the largest risk.
  No pak can rewrite a stored `ProfMaxLvl_Init`, a stored current proficiency, or the archetype seed already written into an existing recruit, because the deserializer setter only re-persists what it reads.
  The change is visible only on recruits generated after installation, and a fresh world or the native forced re-init is the migration path.
- The unsigned-pak load path depends on `-fileopenlog`.
  The engine rejects an unsigned pak without it, the flag is game-build-specific, a bypass can be closed by a patch, and the mod must be pinned to a known Soulmask build and re-tested after every patch; the signed Modkit path avoids the dependency.
- Anti-cheat is a distribution risk rather than a local one.
  The Linux dedicated server ships no anti-cheat binaries, but the Windows client ships the AntiGS components, `LXGSService.exe`, and Tencent's `rail_api64.dll`; using `-fileopenlog` while connected to official servers is discouraged, and mounting an unsigned pak is unverified with the bypass.
- Several levers are native and cannot be moved pak-only.
  The positive-talent cap `GoodNGMaxNum = 6`, the preference count of 0–3, the starting defect count, the personal recruit base of 3, and the Training Ground behaviour need a raw byte patch or new logic; no data edit can add a talent family, a condition Blueprint, or Blueprint logic, and no new asset can be cooked on Linux.
