# The Official Modkit, ModConfiger, and Your Authoring Options

Soulmask ships an official mod toolchain, and it is good at exactly the things a Linux-side data edit cannot do.
This guide explains what the official Soulmask Modkit and its `ModConfiger` asset are, when a data-only `_P.pak` override lets you skip them entirely, and where the community alternatives stand.
It is written for someone about to make a Soulmask mod who needs to choose a route before downloading a very large editor or committing to a Windows machine.
Confidence is marked High, Medium, or Low, matching the source research.

## 1. The official Soulmask Modkit

The Soulmask Modkit is a free modding kit built on **Unreal Engine 4.27** (reported 4.27.2), made by the Soulmask developers.
It can modify existing assets or create new props, equipment, creatures, and maps, then emit `.pak` mod files.
It is distributed through the **Epic Games Store** at <https://store.epicgames.com/p/soulmask-modkit> and requires an Epic account and the Epic EULA, a recurring community complaint.
It is **Windows-only**, requires Windows 10 64-bit, and lists 16 GB RAM minimum (24 GB recommended).
The observed builds are **1.4** and **1.3**; build 1.3 is **133.57 GB** download / **156.05 GB** installed, and build 0.10 is **70.69 GB** download / **85.9 GB** installed.
The `soulmask-codex` project documents the installed path as `C:\Program Files\Epic Games\SoulMaskModkit` and the project content as `C:\Program Files\Epic Games\SoulMaskModkit\Projects\WS\Content`.
The kit ships Python 3.7 with the DataTable assets.
Building runs through `Engine\Binaries\Win64\UE4Editor-Cmd.exe`.
Confidence: High.

### What it can Replace / Create / Produce

The official wiki's capability matrix lists supported operations for these content types:

| Content type | Replace | Create | Produce |
| --- | --- | --- | --- |
| Character | Yes | Yes | Yes |
| Construction | Yes | Yes | Yes |
| Item | Yes | Yes | Yes |
| Spawn Data (not spawner) | Yes | Yes | Yes |
| Recipe | Yes | Yes | Yes |
| Map | Yes | Yes | Yes |

Spawn Data is supported; spawner changes go through `ModConfiger` sub-level attachment instead.

### The build workflow

```text
Create UGC            generates a mod resource path
  -> edit assets      DataTables, Blueprints, recipes, maps
  -> Package UGC
  -> fill in metadata
  -> Build Mod        cooks and produces a .pak
  -> Upload built mod to Steam
```

`Build Mod` is the cook-and-pack step, and it is the only route that produces a signed `.sig` and a Steam Workshop item.
The game's own mod manager reads `ModeInfo.json`, which `Build Mod` generates.
Major game updates can break mods, so pin your target build.
An Epic-client install cannot use most Steam Workshop mods.
Confidence: High.

### Loading a mod

Clients apply subscribed mods through the in-game **Mod Manager**.
Dedicated servers load mods one of two ways:

- Pass `-mod="<ModID1>,<ModID2>"` on the command line, or
- Copy the mod folder into `WindowsServer\WS\Mods\` or `LinuxServer\WS\Mods\`.

Foot-gun: a raw hand-built `_P.pak` dropped into `WS/Mods/` is ignored.
That directory is driven by the signed Modkit mod path (`NeedMods` / `ModeInfo.json`).
Unsigned hand-built paks go in `WS/Content/Paks/` or `WS/Content/Paks/~mods/`; see [distribution-and-anticheat.md](distribution-and-anticheat.md) and [authoring-pipeline.md](authoring-pipeline.md) for the mount mechanics.

## 2. ModConfiger

`ModConfiger` is a **Blueprint class** you create inside your Modkit mod folder.
In the Modkit you use "Create Blueprint Class", search for "ModConfiger", and rename it.
It is the tool for the operations the normal asset system does not cover.
Confidence: High for the operations.

`ModConfiger` has **no text, JSON, or CSV format**.
Its "config" is a set of serialized Blueprint property values edited in the Modkit Details panel.
There is no public specification of a text `ModConfiger` file, so a hand-built pak cannot obviously reproduce one in a maintainable way.
The community source confirms it is an asset: `JerakorConsumableRebalance/Content/ModConfiger_ConsumablesRebalance.uasset`.
Hand-editing a cooked `ModConfiger` Blueprint with `UAssetAPI` is theoretically possible but unproven and brittle.
Confidence: High that it is a Blueprint asset; Medium that it could ever be authored without the editor.

### Documented operations

- **Merging DataTable rows.** You select an original table (red box) and one or more new tables (blue box); rows absent from the original are added and existing rows are replaced.
- **Deleting DataTable rows.** A separate deletion table holds copies of the rows to remove.
- **Attaching ActorComponents.** You name the target actor Blueprint, the component to attach, and the run rules.
- **Blueprint addition and replacement.**
- **Attaching extra Sub Levels** to a main level, currently limited to adding Spawners.

The merge step can also perform an **interface replacement**: copy `DTUIMap` into the mod folder, swap the Blueprint reference in the row without changing the row number, then merge the table in `ModConfiger`.

### Component attachment targets

| Target |
| --- |
| All character Blueprints |
| All construction Blueprints |
| `BP_GameModeBase` |
| `BP_GameState` |
| `BP_HHUD` |
| `BP_PlayerController` |
| `HPlayerState` |

### Load order

When multiple mods modify the same data, "the most recently loaded mod will override the previous one."
This is last-loaded-wins, and it applies to all mods touching the same asset, not only `ModConfiger`.

### Why it needs the Windows editor

`ModConfiger` is itself a `.uasset` Blueprint, so authoring it is a Windows-editor task.
Its generated output, however, is an ordinary `_P.pak`, so the artifact is portable once built.

## 3. When you do not need ModConfiger

A same-path `_P.pak` override reaches most data edits without `ModConfiger` at all.
Unreal Engine gives any pak whose filename ends in `_P` a priority of **+1000** at startup, so its same-path files override the base pak.
Epic's 4.27 patching guide states the filename "can be renamed, but you need to include the `_p.pak` at the end".
Confidence: High.

| Goal | ModConfiger needed? | Why |
| --- | --- | --- |
| Replace row X field Y in a DataTable | No | A DataTable asset containing row X, shipped as a same-path `_P.pak` override of the whole table, achieves the same row replacement |
| Delete row Z | Yes | Deletion lives in `ModConfiger`'s serialized properties, not expressible as text today |
| Attach component C to an actor Blueprint | Yes | Component attachment is a `ModConfiger` operation |
| Add or replace a Blueprint | Yes | Blueprint addition/replacement is a `ModConfiger` operation |
| Add new condition Blueprints | Yes | New Blueprint assets are `ModConfiger`/Modkit work |
| Value edits to an existing cooked DataTable or `NormalExport` Blueprint CDO | No | A `_P.pak` override of those cooked assets works |

The community evidence agrees: `FreeBuildNoSnapSupport` / `FreeBuildNoCollision` patch serialized Blueprint CDO defaults and install as `WS-WindowsNoEditor_1_P.pak` and `WS-WindowsNoEditor_2_P.pak` in `Content\Paks`, never overwriting the base `WS-WindowsNoEditor.pak`.
Unsigned paks need the `-fileopenlog` launch option unless built and signed through the Modkit.
See [data-editing.md](data-editing.md) for the row- and value-editing mechanics.

## 4. What the official mods cannot change

The developers stated these limits directly.

- Mods **cannot modify or replace** `BP_ManRenRandomConfig`.
- Mods **cannot modify most of** `BP_ZiYuanGuanLiQi` (talent-entry/preference selection, positive/negative pools, unlock logic, and mastery-skill logic).
- The explicit exception is **`ProficiencyConfigClass`**, which "supports full replacement".
- No async or runtime mod API is documented.

The practical implication: you cannot rewrite the spawn roll, so you change the data the roll draws from, attach components or replace Blueprints, or use fixed spawn templates.
Confidence: High.

## 5. UE4SS

UE4SS (RE-UE4SS) is an injectable Lua/C++ scripting system for UE4/UE5 games whose stated target range is **UE 4.7 to 5.8**, which includes 4.27.
It provides a Lua API over the UObject system that can find objects, read and write `UPROPERTY` fields, call native and Blueprint `UFUNCTION`s, register pre/post hooks (including on BP-only functions), and run code on the game thread.
It also ships a Live Property Viewer/Editor and dumpers that emit `.usmap`/`.jmap` reflection maps.
The current stable release is **v3.0.1**, with experimental builds adding newer engine versions.
Confidence: High for the generic capability.

Lua mods are plain text (`Mods/<Name>/scripts/main.lua` plus a `mods.txt` entry) and are hot-reloadable, so **authoring** can be done on Linux.
The loader itself is Windows-only; Linux support is documented only for cross-compiling the Windows DLL with xwin or msvc-wine.

Soulmask-specific status is **Unproven and likely blocked**.
There is no Soulmask custom game config in the RE-UE4SS repository (a search for "Soulmask" returns zero matches), and no working Soulmask UE4SS mod was found.
The project itself warns it "is not a plug-n-play solution that always works with every game" and may require updating AOB scans.
Two observations raise the risk further:

- `WS-Win64-Shipping.exe` is Themida-packed: the binary contains an `@.themida` marker and no `/Script/`, `UnrealEngine`, or `fileopenlog` strings survive a `strings` pass, which can defeat UE4SS's proxy-DLL loading and address scans.
- The Windows client ships an anti-cheat surface under `WS/Plugins/AntiGS/ThirdParty/Binaries/x64/` (`LXGSService.exe`, version 1.4.0.5) plus `WS/Binaries/ThirdParty/Tencent/Win64/rail_api64.dll`, reported by the community as kernel-level and installed with a UAC prompt when joining official servers, not during offline/single-player start.

Treat UE4SS as unproven and likely blocked until someone confirms the proxy DLL loads and the address scans resolve.
Do not depend on it for a shipping mod.

## 6. Community prior art

The public record gives several working shapes to copy from.

| Project | What it is | Why it matters to you |
| --- | --- | --- |
| `rubensayshi/soulmask-codex` | Reverse-engineers Modkit `.uasset` files into JSON | The richest public source; its committed `Game/Parsed/*.json` and `Game/Exports/*.json` are fully usable on Linux today |
| `Jerakor/JerakorSoulmaskMods` | Modkit **source** for several released mods | Shows the authoring file layout: per-mod folders with `.uasset` DataTables/Blueprints, a `ModConfiger_*.uasset`, a `NeverAssetList.txt`, a `.uplugin`, and an icon |
| `chlghksgml01/FreeBuildNoSnapSupport` and `FreeBuildNoCollision` | Blueprint-CDO overlays shipped as `_P.pak` | The clearest prior art for patching serialized Blueprint defaults from a Modkit Python script, then cooking a narrow directory into a `_P.pak` |
| Level Cap 100 (Nexus mod 85) | Data mod for the mask level cap | Ships a hand-built `levelcap_P.pak` into `WS\Content\Paks\~mods` and instructs users to add `-fileopenlog` |
| Soulmask Stack (Nexus mod 46, mod 53) | Stack-size mods | The hand-built `Stack_100_P.pak` needs `-fileopenlog`; a later Modkit-built version avoids the flag and appears in the in-game Mod option |
| `Tasty Framework` (Workshop 3330908154) | Blueprint framework mod | RBAC, searchable log, per-player/per-thrall variable store, and an API for other mods |
| `Tasty Admin` (Workshop 3332634339) | Extension of `Tasty Framework` | Lists "Edit tribesmen proficiencies"; requires `Tasty Framework` |

`soulmask-codex` also documents the Modkit export pipeline: Modkit `UE4Editor-Cmd` exports DataTables, UAssetGUI exports Blueprints to gzipped UAssetAPI JSON, then dependency-free Python parses everything.
It names DataTable row structs (`DT_Gift*`), Blueprint-based recipes (`BP_PeiFang`), the Blueprint-based tech tree (`BP_KJS`), item Blueprints (`BP_DaoJu`), and spawner Blueprints (`BP_SGQ_*`).
`FreeBuildNoCollision`'s `docs/LESSONS.md` records that `_P` overlays can change serialized Blueprint defaults but "cannot rewrite native function bodies", that a bad default baked across ~1800 assets bricked building placement, and that recovery is deleting the offending `_P` pak.
Confidence: High for the repositories and artifacts.

Foot-gun: the `Soulmask-Mods` GitHub org advertises "External mods suite ... unlimited resources, max skills" with a download pointing at a `github.io` page, no source, and a profile claiming future updates.
This matches a scam/malware pattern; avoid it.

## 7. The authoring spectrum

Ordered from most to least Linux-friendly.

1. **`GameXishu.json` server config (text).** Fully Linux-authorable and the Linux dedicated server reads it directly.
   It exposes only tuning knobs (`MaxLevel`, `ExpRatio`, `TrainingExpRatio`, `ManRenPinZhiRatio`, `CurProfInitRatio`, and others), not arbitrary DataTable rows.
   It is a plaintext disk config, not a pak asset, so it cannot ship inside a mod pak.
2. **Cooked DataTable override inside an unencrypted `_P.pak`.** Author and edit rows as `UAssetAPI` JSON on Linux, repack with `repak`, and test with `-fileopenlog`.
   This requires a cooked DataTable seed from the Modkit or from extraction of the retail table.
   It is the most capable Linux-authorable data path that actually loads in this game.
3. **UE4SS Lua (text, runtime).** The best authoring ergonomics on Linux, but loader viability on Soulmask is unproven and likely hampered by the packer and anti-cheat.
4. **Modkit source mod + `ModConfiger` (binary `.uasset`).** Canonical, signed, Workshop-shippable, and the only route to Blueprint-class replacement, row deletion, and component attachment.
   It requires the Windows UE 4.27.2 Modkit and an Epic account.
5. **Blueprint class/logic replacement.** The least Linux-friendly; editor-only, with no standalone Linux cooker for Soulmask's native row structs.

## 8. Row-addition and new-asset blockers

Some edits that look data-only are not, and a few require a Windows cook.

| Blocker | What needs it | Why | Alternative |
| --- | --- | --- | --- |
| New asset creation | New region gift pools; new guard/elite character Blueprints | `UAssetAPI` edits existing assets only; it cannot create a `.uasset`/`.uexp` pair | Reuse shipped pools already wired into the game, or gate talents in the global pool with an existing condition bag |
| `RawExport` CDO | `BP_ZiYuanGuanLiQi` (owns `GoodNGMaxNum`, `DT_GoodNGConfig`, and the `DT_PinZhi*` references) | `UAssetAPI` leaves the `Default__BP_ZiYuanGuanLiQi_C` object opaque (a 176,472-character base64 blob) | Keep the in-place `BP_ProficiencyConfig` path unchanged so no repoint is needed |
| New Blueprint logic | Runtime value transfer, continuous quality floors, level-to-cap formulas | No cookable Linux pipeline exists for Blueprint bytecode | Ship the data knobs only; treat logic as Windows/native or out of scope |
| Row additions to existing tables | New talent effect rows, new star-weight or pool rows | `UAssetAPI` cannot add a row unless the new row name is appended to the table's `NameMap` | Row addition works with a `NameMap` append (structural only; whether the shipping game loads a hand-added row is unverified); use `ModConfiger` on Windows for guaranteed engine support |

What requires a Windows cook or editor:

- A signed Workshop build, including a valid `.sig` (no public signing key exists).
- `ModConfiger` row deletion, row addition, component attachment, and Blueprint-class replacement.
- Any new asset.
- Blueprint bytecode changes, because there is no standalone Linux cooker for them.

What can go in a hand-built pak: any cooked `.uasset`/`.uexp` override, including DataTable rows, typed `NormalExport` Blueprint CDOs, and (as proven structurally) CDO array element additions, in-row map edits, and existing-table row additions with a `NameMap` append.
What cannot go in a pak: `GameXishu*.json`, any new asset, any Blueprint logic, and a valid `.sig`.
Confidence: High for the blockers; Medium for the row-addition path because the engine's in-game read of a hand-added row is unverified.

## 9. Choosing a route

- For **data-only edits** (row value changes, CDO value changes), target the cooked DataTable override in a `_P.pak` and keep the Modkit as the only Windows dependency.
- For **row deletion, component attachment, or Blueprint replacement**, you need the Windows Modkit and `ModConfiger`.
- For **public distribution**, rebuild in the Modkit and ship through Workshop; see [distribution-and-anticheat.md](distribution-and-anticheat.md).
- Do not build on UE4SS for a shipping mod; treat it as an experimental fallback only.
- When in doubt about whether an edit is expressible as data, check [data-editing.md](data-editing.md) before opening the Modkit.
