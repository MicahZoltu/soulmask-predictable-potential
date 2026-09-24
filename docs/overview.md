# Soulmask Modding — Documentation Overview

This document orients a new Soulmask mod maker to the project's documentation set.
It answers three questions: what each folder is for, what is known about the game, and what it is actually possible to build.
It is a clean reference: it records conclusions and concrete asset, field, and value names, not the research that produced them.

## How the documentation set is organised

The set is split into three folders by purpose, plus a status document for the delivered mod.

| Folder or file | Question it answers | Starting document |
| --- | --- | --- |
| `game-reference/` | What is known: the shipped systems, assets, fields, and values. | `game-reference/game-and-assets.md` |
| `modding-guide/` | How to build: extract, edit, pack, load, tool, distribute. | `modding-guide/authoring-pipeline.md` |
| `reverse-engineering/` | How it was discovered: decrypting paks and reading the native binary. | `reverse-engineering/extracting-cooked-assets.md` |
| `mod-status.md` | The state of the delivered `ConsistentProgression_P.pak`. | `mod-status.md` |

- **`game-reference/` is the authority on what the game contains.**
  It is the folder to read when you want to understand a system before changing it.
  It holds `game-and-assets.md` (the asset map), `proficiencies-and-caps.md`, `starting-proficiency.md`, `weapon-mastery.md`, `talents.md`, `quality-and-rarity.md`, `recruitment-and-spawns.md`, `roster-limits.md`, `tech-tree.md`, `training-ground-and-transfer.md`, `tribes-and-regions.md`, `server-config.md`, and `console-commands.md`.
- **`modding-guide/` is the authority on how to make a change.**
  It holds `authoring-pipeline.md` (end to end), `data-editing.md` (UAssetAPI operations), `packaging-and-loading.md`, `tooling.md`, `official-modkit-and-modconfiger.md`, `testing.md`, and `distribution-and-anticheat.md`.
- **`reverse-engineering/` is the authority on provenance.**
  It holds `extracting-cooked-assets.md` (the AES key recovery and `repak unpack`), `asset-analysis.md` (parsing and re-serializing cooked assets with UAssetAPI), `native-binary-analysis.md` (reading the shipping binary), and `probe-methodology.md` (temporary probe paks that make one uncertain behavior observable).
- Where two documents conflicted, the direct-evidence winner is used: the retail client pak is authoritative over the server pak, the tech tree has 778 `BP_KJS_*` nodes, the cap constants belong to `UHProficiencyConfig`, and the retail AES key is available on Linux.

## Game and engine in brief

Soulmask is developed by CampFire Studio and published by Qooland Games.
The retail release includes the free Shifting Sands DLC, cooked under the top-level `/Game/AdditionMap01` tree.
The engine is Unreal Engine 4.27, confirmed from the shipping executable's version resource (`++UE4+Release-4.27-CL-0`).
Content ships as classic UE `.pak` containers, not IoStore, so there are no `.utoc`/`.ucas` files.
The pak format is version V11 (`Fnv64BugFix`) with an encrypted index and the mount point `../../../`.
The retail client pak is `WS/Content/Paks/WS-WindowsNoEditor.pak`; the native Linux dedicated server ships `WS/Content/Paks/WS-LinuxServer.pak`.
The official Soulmask Modkit is free on the Epic Games Store and runs on Unreal Engine 4.27.2; it is a Windows toolchain.
Its `ModConfiger` asset is a Blueprint class with no text or JSON format, used for DataTable merge/delete, ActorComponent attachment, Blueprint replacement, and spawner sub-levels.
The game names its content in Pinyin: `YiFu` clothing, `JianZhu` building, `DongWu` animal, `ZiYuanGuanLi` proficiency and resource management, `KeJiShu` mask tech tree, `PeiFang` recipe, `ShuaGuaiQi` spawner, `DaoJu` item, `MianJu` mask, `PinZhi` quality, `ShuLianDu` proficiency level, `ZhuanJing` weapon mastery, `ZhiYe` class.

## The Linux-authorable data pipeline

A full data-only mod pipeline is validated end to end on Linux: extract, edit, repack, and mount.
The retail AES key is recovered from the Linux dedicated server binary, which ships without a static symbol table (`.symtab`) but retains a dynamic symbol table (`.dynsym`), as documented in [`reverse-engineering/native-binary-analysis.md`](reverse-engineering/native-binary-analysis.md), so the cooked assets open without Windows.

```
retail cooked assets (.uasset/.uexp)
        |  repak unpack with the recovered AES key
        v
UAssetAPI JSON round-trip  (export -> edit -> import)
        |  repak pack --version V11 --mount-point ../../../
        v
<Name>_P.pak  with the same internal WS/... paths as retail
        |  place in WS/Content/Paks/ or WS/Content/Paks/~mods/
        v
load with -fileopenlog
```

- The key decrypts both `WS-LinuxServer.pak` (131,858 entries) and `WS-WindowsNoEditor.pak` (145,821 entries).
- A no-change UAssetAPI round-trip reproduces a cooked DataTable `.uasset` and `.uexp` with identical SHA-256, and a one-field edit changes a known `.uexp` byte.
- `repak pack --version V11 --mount-point ../../../` produces an unencrypted patch pak, and the `_P` suffix gives it startup priority over the base pak at the same package path.
- An unsigned pak is rejected with `Couldn't find pak signature file`; with `-fileopenlog` it mounts and reaches the precacher on the Linux dedicated server.

Windows is needed only for four things: Blueprint or `ModConfiger` authoring, client visual and UI checks, a signed Steam Workshop upload, and re-cooking assets from source.
Data authoring itself needs no Windows.

## Capability matrix

Every common mod goal, mapped to the game-reference document that covers it, the editable asset or data, the mechanism, Linux authorability, and confidence.
Confidence reflects what has actually been observed: **in-game verified** means read in a running game, **asset-level verified** means parsed and round-tripped from the cooked asset, and **native-verified** means recovered from the shipping binary.

| Goal | Reference | Editable asset / data | Mechanism | Linux-authorable? | Confidence |
| --- | --- | --- | --- | --- | --- |
| Deterministic caps | [proficiencies-and-caps.md](game-reference/proficiencies-and-caps.md) | `BP_ProficiencyConfig` CDO (`ProfInitMaxLvlMin`/`ProfInitMaxLvlMax`, `ProfMaxLvlLowerLimit`/`ProfMaxLvlUpperLimit`, `BaiBanProfMaxLvlList`, `ZhiYeProfMaxLvlMap`, `ZhiYeProfLvlMap`, `JueSeLvlProfLvlList`, `ClanDiWeiProfInitLvlMap`, `ProfConfigDTList`); `DT_Prof_ZhiYe_*.MinAdd`/`.MaxAdd`; `DT_CustomizeNPC.CustomizeProfMaxLv`; `DT_CustomizeNPC_Egypt.CustomizeProfMaxLv` | Freeze the base by setting `ProfInitMaxLvlMin = ProfInitMaxLvlMax`, set each class row to `MinAdd = MaxAdd`, and clear every archetype `CustomizeProfMaxLv` map; the native parent `UHProficiencyConfig` holds the shipped roll `rand(75..100)` and clamp `50`/`150` | Yes for data and CDO value edits | In-game verified for the base/clamp override; asset-level for the class tables; the base roll itself is native-only |
| Starting proficiency | [starting-proficiency.md](game-reference/starting-proficiency.md) | `BP_ProficiencyConfig` CDO (`JueSeLvlProfLvlList`, `ClanDiWeiProfInitLvlMap`, `ZhiYeProfLvlMap`); `SLD_ChuShiLv_*.MinAdd`/`.MaxAdd` | Replace the level band list with degenerate `ProfInitLvlMin = ProfInitLvlMax` bands plus a plateau, and reshape each `SLD_ChuShiLv_*` row to the class skill set that matches the class caps at `MinAdd = MaxAdd = 36`, so a class skill's starting value is the shared level curve plus 36; [`mod-status.md`](mod-status.md) records the delivered values | Yes | Asset-level verified |
| Mastery unlocks | [weapon-mastery.md](game-reference/weapon-mastery.md) | `DT_ZhuanJingSLD` (`SLDGaiLv[*].GaiLv` and `PinZhiGaiLv`), `DT_SpecializedSkill`, `DT_GuDingZhuanJing` | Set every `GaiLv` and `PinZhiGaiLv` to `1.0` and keep every multi-entry `JiNengChi` pool, so each reachable threshold grants a random non-duplicate draw | Yes | Asset-level verified |
| Talent pools and tiers | [talents.md](game-reference/talents.md) | `DT_GiftZhengMian`, `DT_GiftZhengMian_Custom`, `DT_GiftFuMiann`, `DT_GiftZongBiao` `BaseWeight`; `BP_ManRenRandomConfig` (`BornChuShenCiTiaoList`, `BornJingLiCiTiaoMap`, `BornBuLuoCiTiaoMap`, `BornGetChengHaoRateMap`, `BornCommonChengHaoList`, `BornTiaoJianChengHaoList`); `DT_CustomizeNPC` / `DT_CustomizeNPC_Egypt` (`CustomizeNGMap`, `CustomizeChengHaoClass`); `DT_PinZhiGoodNGStarWeight`, `DT_PinZhiGoodNGAddPr` | Replace pool memberships, pin the origin, tribal, and experience rows to star III, clear archetype-seeded gifts and titles, and force the class-talent tier through the quality star weights | Yes | High membership, medium weights |
| Defects | [talents.md](game-reference/talents.md) | `DT_PinZhiBadNGRemovePr`, `DT_GiftFuMiann` | Set every removal `Pr` to `1.0` so a defect clears at each 5-level check, and/or empty the negative pool | Yes | High |
| Preferences | [talents.md](game-reference/talents.md) | `DT_GiftXiHaoBiao`, `DT_GiftZongBiao` `XiHao`-source rows | Retire the loadout-tied gear rows and keep the rest as mood-only likes and aversions | Partial: rows yes, the native count roll of 0–3 is not data-editable | Medium |
| Roster ramp | [roster-limits.md](game-reference/roster-limits.md) | `BP_Mask_XiuFu01_1012` (`AddZhaoMuNum` tiers); `BP_GameXiShu_GuanLiQi` (Survival) and `BP_GameXiShu_GuanLiQi_Management` (Tribe Mode) default-object maps; `GongHuiMaxZhaoMuCount` only as the world tribe cap clamp | Rebuild the shared mask node with 15 `AddZhaoMuNum` tiers gated every four awareness levels and add the matching per-mode keys to each covered mode's manager maps (`+3`/tier in Survival, `+6`/tier in Tribe Mode) | Yes | In-game verified for Survival (3 → 48); Tribe Mode pending; both bounded by the world tribe cap |
| Item quality | [quality-and-rarity.md](game-reference/quality-and-rarity.md) | Spawner CDO `DiWeiQuanZhong`, `DiWeiAndPinZhi`, `PinZhiRateAndZhuangBeiQz`, `PinZhiAndWuQiQz`; recipe CDO `MakeRandPinZhiData`; `SLDShuaiJianData`; `DT_PinZhiGoodNGStarWeight`, `DT_PinZhiGoodNGAddPr` | Shift spawner band weights, recipe quality bands, and decay; a smooth proficiency-driven quality floor needs Blueprint or native logic | Partial | Medium |
| Tech-tree node moves | [tech-tree.md](game-reference/tech-tree.md) | `BP_KJS_*` node CDOs (`NeedMaskLevel`, `PreMainNodeList`, `PreSubNodeList`), `DT_AllTechTreeNode` index | Edit the node Blueprint's class-default object; the tree is Blueprint-driven, not a single DataTable | Windows Blueprint authoring (in-place CDO value read is asset-level) | High read |
| Spawn and level control | [recruitment-and-spawns.md](game-reference/recruitment-and-spawns.md) | `BP_SGQ_*` spawner CDOs (`SCGZuiXiaoDengJi`, `SCGZuiDaDengJi`, `GuaiWuClass`, `QuanZhongBiLi`, `ZhiYeQuanZhong`, `DiWeiQuanZhong`, `DiWeiAndPinZhi`, `ClanType`) | Edit spawn level bands, character class, and profession/rank/quality weights on the spawner default object | Windows Blueprint authoring (in-place CDO value read is asset-level) | High read |
| Server config | [server-config.md](game-reference/server-config.md) | `GameXishu.json` keys such as `ManRenPinZhiRatio`, `CurProfInitRatio`, `ExpRatio`, `ShuLianDuExpRatio`, `TrainingExpRatio`, `GeRenMaxZhaoMuCount*`, `GongHuiMaxZhaoMuCount`, `ManRenChuZhanCount`, `ShiWuXiaoHaoRatio`, `MaxLevel` | Edit the plaintext values within their schema ranges; this is a disk file, not a pak asset | Yes | High |

The `-fileopenlog` column above is about authoring, not shipping: an in-place typed CDO value edit can be authored on Linux, but a new Blueprint or a rewritten function body cannot.

## What is possible, what needs Windows, what is unproven

### Definitively possible

These are proven with direct cooked-asset or server-log evidence and are authorable on Linux today.

- Extract every retail DataTable and Blueprint from the encrypted paks with `repak` and the recovered AES key.
- Round-trip genuine cooked DataTables through UAssetAPI JSON with binary equality, and apply single-field value edits that produce minimal diffs.
- Build an unsigned `_P.pak` with the retail mount point and load it on the Linux dedicated server with `-fileopenlog`.
- Value-edit mastery pools (`DT_ZhuanJingSLD`), talent and defect pools and star weights (`DT_Gift*`, `DT_PinZhi*`), per-level proficiency benefit tables (`DT_ProficiencyConfig_*`, 23 tables of 150 rows), per-class cap and starting bonuses (`DT_Prof_ZhiYe_*`, `SLD_ChuShiLv_*`), recipe quality bands (`MakeRandPinZhiData`, `SLDShuaiJianData`), and all plaintext `GameXishu.json` knobs.
- Override the six typed `BP_ProficiencyConfig` CDO properties and append inherited `IntProperty` values (for example `ProfInitMaxLvlMin`/`ProfInitMaxLvlMax`) because `Default__BP_ProficiencyConfig_C` is a `NormalExport`.
- Clear the archetype cap seeds on all 56 `DT_CustomizeNPC` rows and all 96 `DT_CustomizeNPC_Egypt` rows.
- Edit the cooked English localization `WS/Content/Localization/Game/en/Game.locres`.
- Grow the personal roster cap through the 15-tier mask ramp: Survival was verified in game from native base 3 to 48, Tribe Mode uses the same node with `+6`/tier toward 93 and is pending verification, and both targets are min-bounded by the world tribe cap.

### Needs Windows or the Modkit

These require the Windows UE 4.27.2 Modkit editor because the behavior lives in Blueprint bytecode or serialized Blueprint defaults that cannot be cooked on Linux.

- Blueprint CDO edits whose default object UAssetAPI leaves as a `RawExport`, including repointing `ProficiencyConfigClass`; `Default__BP_ZiYuanGuanLiQi_C` is a `RawExport` and cannot be typed-edited.
- Replacing or rewriting Blueprint logic, including any change to Training Ground transfer semantics and any continuous item-quality floor.
- Row deletion, ActorComponent attachment, and Blueprint replacement, which are `ModConfiger` operations with no text format.
- Tech-tree node moves and spawner value edits that are not already serialized as typed properties.
- Client-side visual and UI verification, and a signed Steam Workshop upload.
- Re-cooking assets from source; there is no standalone Linux cooker.

### Infeasible or unproven

- Making the Training Ground transfer current proficiency values from a mentor to a trainee: `BP_JianZhuTrainingGround` has zero `FunctionExport`s and the behavior is native with no donor-to-recipient transfer function.
- Producing a deterministic cap as a function of character level by data edits alone: character level feeds only the starting current value (`JueSeLvlProfLvlList`), while the cap is the native `rand(75..100)` base plus the class bonus `rand(15..25)`, clamped `50..150` and fixed at recruitment.
- A generic UE4SS Lua runtime route on the Windows client: there is no Soulmask game config, no working Soulmask UE4SS mod, the client is Themida-packed, and it ships an anti-cheat surface.
- Confirming that the in-game reader actually serves an overridden row from the `_P.pak`: the pak mounts and `_P` grants priority, but the runtime data read is the one remaining unobserved step.
- Producing a valid `.sig` outside the Modkit: no public signing key exists, so hand-built paks depend on `-fileopenlog`.

## Key risks and blockers

### `-fileopenlog` signature-bypass durability

The bypass is game-build-specific: another UE 4.27 title, SCUM, patched it out.
Pin a mod to a known Soulmask build and re-test after every patch, because a patch that closes the bypass invalidates the unsigned-pak load path until a signed Modkit build exists.

### Anti-cheat distribution risk

The Windows client ships `WS/Plugins/AntiGS/` (`gs.dll`, `LXGSService.exe`, encrypted config blobs), an `AntiGS.uplugin` self-described as an "alibaba anti GS system", and Tencent's `rail_api64.dll`.
No kernel driver ships in the install, and the Linux dedicated server ships no AntiGS binaries at all, so Linux datamining, pak extraction, and server-side modding are unaffected.
Using `-fileopenlog` while connected to official servers is the uncertain case and is discouraged.

### Native-only constants

The base cap roll, clamp, and blank-body default (`ProfInitMaxLvlMin = 75`, `ProfInitMaxLvlMax = 100`, `ProfMaxLvlLowerLimit = 50`, `ProfMaxLvlUpperLimit = 150`, `ProfInitChuShiBodyMaxLvl = 50`) live on `UHProficiencyConfig` and are not exposed by any serialized asset.
The positive-talent cap `GoodNGMaxNum = 6`, the preference count of 0–3, the starting defect count, and the personal recruit base of 3 are likewise native and not data-editable.
Closing these gaps needs a raw byte patch or new logic; no data edit can add a talent family, a condition Blueprint, or Blueprint logic, and no new asset can be cooked on Linux.

### Stored values on existing saves

The initializer writes `ProfMaxLvl_Init` and the starting current value once, when a proficiency entry is first created, and a save load only re-persists what it reads.
No pak can rewrite a stored `ProfMaxLvl_Init`, a stored current proficiency, or an archetype seed already written into an existing recruit.
A change is visible only on recruits generated after installation, and a fresh world or the native forced re-init is the migration path.

### Blueprint cooking

Blueprint logic and CDO changes cannot be cooked on Linux, because there is no standalone Linux cooker for Soulmask's native row structs.
`ModConfiger` has no text or JSON format; it is a Blueprint asset authored in the Windows editor.
This is why the capability matrix distinguishes Linux-authorable data edits from Windows Blueprint authoring.

## The one unobserved step

The single most valuable unobserved step is an in-game read proving that the game serves an overridden row from the loaded `_P.pak`.
The pak mounting and `_P` priority are proven from server logs, but a live read of the overridden value has not been observed.
`mod-status.md` tracks this by separating three verification levels: **in-game verified** (the cap default-object constants and the Survival roster ramp), **asset-level verified** (re-parse and byte-identical round-trip only), and **pending in-game verification** (the Tribe Mode roster ramp, mastery draws, added class and pool rows, the frozen class/base boundary, the DLC caps, and the localization override priority).
`game-reference/console-commands.md` describes the `gm` commands used to stand up a test recruit for that read.

## Start here by task

The master index at [`README.md`](README.md) lists a task-oriented starting point for each common goal.
