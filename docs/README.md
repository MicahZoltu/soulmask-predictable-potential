# Soulmask Modding Documentation

This repository documents how to mod Soulmask, a CampFire Studio game built on Unreal Engine 4.27, and it records the specific Consistent Progression mod the documentation was gathered for.
It is the durable result of an extensive reverse-engineering effort, written so a future mod maker can build on the findings instead of repeating the work.

## How to read this

The documentation is organized into three folders, each with its own index:

- `game-reference/` describes the shipped game: what its data is, where it lives, and how each progression system works.
- `modding-guide/` shows how to author, edit, package, load, test, and distribute a mod.
- `reverse-engineering/` records how the findings were obtained and how to reproduce the extraction and analysis.

Each folder's documents define and apply their own confidence labels.

The `game-reference/` documents use these labels:

| Label | Meaning |
| --- | --- |
| **in-game verified** | Observed on a running client or dedicated server. |
| **asset-level verified** | Read directly from a cooked asset or recovered from the shipping binary. |
| **inferred** | Reconstructed from structure or indirect evidence rather than directly observed. |
| **unverified** | Plausible but not yet confirmed. |

Some `game-reference/` documents also use **binary-level verified**, **native-verified**, or **disassembly-verified** for claims recovered from the shipping binary.
The `reverse-engineering/` documents mark claims **asset-level**, **binary-level**, **inferred**, or **unverified**, and `native-binary-analysis.md` rates claims **High**, **Medium**, **Low**, or **Inference**.
The `modding-guide/` documents mark each procedure or claim **proven** or **unverified** in game, and `official-modkit-and-modconfiger.md` rates claims **High**, **Medium**, or **Low**.
When two documents disagree, prefer the claim with the strongest evidence and treat the higher-confidence reading as current.

## game-reference

| File | Description | Audience |
| --- | --- | --- |
| [`game-and-assets.md`](game-reference/game-and-assets.md) | The engine and pak format, the cooked-asset model, the `/Game` asset tree, and the named assets mods touch. | Mod makers and asset dataminers starting from the shipped files. |
| [`proficiencies-and-caps.md`](game-reference/proficiencies-and-caps.md) | The 31 proficiencies, per-level benefit data, and every mechanism that decides or changes a proficiency cap. | Mod makers editing progression values. |
| [`starting-proficiency.md`](game-reference/starting-proficiency.md) | The generated starting skill values and the native selector that rolls them once at recruit generation. | Mod makers editing starting proficiency. |
| [`quality-and-rarity.md`](game-reference/quality-and-rarity.md) | The six-tier `PinZhi` quality roll, its data sources, and how it maps rank to quality. | Mod makers tuning recruitment. |
| [`recruitment-and-spawns.md`](game-reference/recruitment-and-spawns.md) | How a world region's spawner becomes a capturable tribesman and the data-only recruitment levers. | Mod makers changing recruitment. |
| [`talents.md`](game-reference/talents.md) | The natural-gift (talent) effect table, selection pools, assignment pipeline, and its class, tribe, origin, preference, and defect subsystems. | Mod makers changing talents. |
| [`weapon-mastery.md`](game-reference/weapon-mastery.md) | Weapon mastery abilities, their unlock thresholds, and the DataTables that grant them. | Mod makers editing mastery. |
| [`tribes-and-regions.md`](game-reference/tribes-and-regions.md) | Hostile factions, per-tribe identity traits, biome variants, and region tiers. | Mod makers working with tribes and regions. |
| [`roster-limits.md`](game-reference/roster-limits.md) | Every tribesman count-limit setting, the effective personal cap, and the per-mode mask-node ramp technique. | Mod makers changing roster size. |
| [`tech-tree.md`](game-reference/tech-tree.md) | The mask technology tree's Blueprint nodes and how they are stored, gated, and unlocked. | Mod makers editing the tech tree. |
| [`training-ground-and-transfer.md`](game-reference/training-ground-and-transfer.md) | The Training Ground and Mysterious Stone Table systems and what each one actually moves. | Mod makers considering transfer mechanics. |
| [`console-commands.md`](game-reference/console-commands.md) | The in-game console and admin command surface, with native binary literals and test-recruit recipes. | Mod makers testing in game and server admins. |
| [`server-config.md`](game-reference/server-config.md) | The plaintext server and gameplay configuration files that sit outside the pak, with keys, defaults, and ranges. | Server admins and mod makers. |

## modding-guide

| File | Description | Audience |
| --- | --- | --- |
| [`authoring-pipeline.md`](modding-guide/authoring-pipeline.md) | The end-to-end, data-only workflow from retail assets to a loadable unsigned `_P.pak` on Linux. | Mod makers building their first mod. |
| [`data-editing.md`](modding-guide/data-editing.md) | The concrete UAssetAPI edit operations on cooked `.uasset`/`.uexp` pairs, from DataTable rows to Blueprint defaults. | Mod makers editing assets. |
| [`tooling.md`](modding-guide/tooling.md) | The toolchain reference for reading, editing, and packing cooked UE 4.27 assets. | Mod makers assembling a toolchain. |
| [`packaging-and-loading.md`](modding-guide/packaging-and-loading.md) | The pak container format, the on-disk layout a mod must mirror, engine scan paths, and the signature gate. | Mod makers packaging and loading a mod. |
| [`distribution-and-anticheat.md`](modding-guide/distribution-and-anticheat.md) | The two shipping channels, what the engine signature check enforces, and the anti-cheat components the game ships. | Mod makers distributing a mod and server operators. |
| [`official-modkit-and-modconfiger.md`](modding-guide/official-modkit-and-modconfiger.md) | What the official Modkit and `ModConfiger` do and when a data-only pak lets you skip them. | Mod makers choosing an authoring route. |
| [`testing.md`](modding-guide/testing.md) | How to confirm a mod mounts and that its overridden data is actually served at runtime in a running world. | Mod makers verifying a change in game. |

## reverse-engineering

| File | Description | Audience |
| --- | --- | --- |
| [`extracting-cooked-assets.md`](reverse-engineering/extracting-cooked-assets.md) | The reproducible method for recovering the retail AES key and unpacking the retail paks on Linux. | Dataminers and mod makers extracting assets. |
| [`asset-analysis.md`](reverse-engineering/asset-analysis.md) | How cooked assets were parsed, inspected, edited, and re-serialized reproducibly with UAssetAPI. | Dataminers and tool developers. |
| [`native-binary-analysis.md`](reverse-engineering/native-binary-analysis.md) | How to read gameplay hard-coded in the shipping Linux dedicated-server binary. | Reverse engineers assessing native patches. |
| [`probe-methodology.md`](reverse-engineering/probe-methodology.md) | The technique of using temporary probe paks to make one uncertain game behavior observable. | Reverse engineers researching open questions. |

## Root documents

| Path | Description |
| --- | --- |
| [`../DESIGN.md`](../DESIGN.md) | The design of the Consistent Progression mod: what it changes and why. |
| [`../AGENTS.md`](../AGENTS.md) | The repository's conventions for code, testing, dependencies, and documentation. |
| [`../build/`](../build/) | The mod build pipeline that produces the unsigned `_P.pak`, with its own `README.md` and dependency ledger. |

## Provenance

The findings come from two sources: the shipping cooked assets in the retail client and dedicated-server paks, and the Linux dedicated-server binary, which has no static symbol table (`.symtab`) but retains a dynamic symbol table (`.dynsym`) as described in [`reverse-engineering/native-binary-analysis.md`](reverse-engineering/native-binary-analysis.md).
The AES key that decrypts the retail pak indexes is a public, game-wide project constant, not a per-user secret; it is kept in [`reverse-engineering/extracting-cooked-assets.md`](reverse-engineering/extracting-cooked-assets.md) as the canonical copy to avoid needless duplication, but it is not sensitive and may be copied or committed freely.
The transient probe scaffolding used during discovery has been removed; the durable findings and the reproducible methods are captured in this set, and the productionized editing code lives under [`../build/`](../build/).

## Where to start by task

- Understand the mod being documented: read [`../DESIGN.md`](../DESIGN.md).
- Make a first data-only mod: follow [`modding-guide/authoring-pipeline.md`](modding-guide/authoring-pipeline.md) and set up the tools from [`modding-guide/tooling.md`](modding-guide/tooling.md).
- Change a specific game value: find the system in `game-reference/`, then apply the edit with [`modding-guide/data-editing.md`](modding-guide/data-editing.md).
- Get assets out of the game: start with [`reverse-engineering/extracting-cooked-assets.md`](reverse-engineering/extracting-cooked-assets.md).
- Confirm a change worked: use [`modding-guide/testing.md`](modding-guide/testing.md).
- Distribute what you built: read [`modding-guide/distribution-and-anticheat.md`](modding-guide/distribution-and-anticheat.md).
