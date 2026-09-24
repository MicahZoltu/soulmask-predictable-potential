# Predictable Potential build pipeline

This directory builds the combined, unsigned `PredictablePotential_P.pak` (UE V11, mount point `../../../`) for local `-fileopenlog` play.
It applies the core progression edits, the talent edits, the ramp edits, and the localization override to the retail cooked assets, and packs one pak.

## Talent edits

The talent edits append these `ASSET_MANIFEST` entries; every asset re-parses through the wrapper and round-trips byte-identically.

| Manifest id | Asset | Edit | What it does |
| --- | --- | --- | --- |
| `talent-origin-rows` | `DT_GiftZongBiao` | `originTalentRows` | Sets every star row of families `50001`-`50006` to its class skill set from `DESIGN.md`. |
| `talent-born-config` | `BP_ManRenRandomConfig` | `bornRandomConfig` | Keeps only each class's star-III origin at weight 100, pins every tribe's `BornBuLuoCiTiaoMap` region entries to their families' star III at weight 100, zeroes `BornGetChengHaoRateMap`, empties both `Born*ChengHaoList` title lists, and clears/pins the Battle-Tested `BornJingLiCiTiaoMap`. |
| `talent-class-pool` | `DT_GiftZhengMian` | `classPoolRows` | Leaves only one class-gated row per class with its settled family set, so a recruit has one eligible class row. |
| `talent-class-pool-custom` | `DT_GiftZhengMian_Custom` | `classPoolRows` | The same one-class-row-per-class plan on the custom override pool. |
| `talent-rarity-star` | `DT_PinZhiGoodNGStarWeight` | `rarityStarWeight` | Quality 5/4/3 map to star III/II/I; quality 0-2 weight nothing. |
| `talent-rarity-cadence` | `DT_PinZhiGoodNGAddPr` | `rarityGrantCadence` | Quality 3-5 carry a single level-1 `Pr=1, Count=1` grant instead of the shipped 10–60 grants; quality 0-2 carry a single level-1 `Pr=0, Count=0`. |
| `talent-preferences` | `DT_GiftXiHaoBiao` | `preferencePool` | Retires the 12 loadout-tied gear rows and keeps every other row, so the pool holds mood-only likes and aversions. |
| `talent-defects` | `DT_GiftFuMiann` | `defectPool` | Removes every defect row. |

The class pool plan names one row per class per table.
The global table reuses its shipped Porter, Craftsman, Hunter, Guard, and Warrior rows and re-purposes the `16039-16040-16041` row for the Laborer.
The custom table reuses its Hunter, Guard, and Warrior rows and re-purposes three tribe rows for Porter, Craftsman, and Laborer.
The Laborer, Porter, and Craftsman class gates are not imported by the pool tables, so `classPoolRows` appends the missing `BlueprintGeneratedClass` imports (with their package imports) to each asset.

## Ramp edits

The ramp edits append these `ASSET_MANIFEST` entries. One rebuilt mask node stores the keys and gates and serves both modes; each mode's coefficient manager carries that mode's increment, and both manager assets ship in the one pak.

| Manifest id | Asset | Edit | What it does |
| --- | --- | --- | --- |
| `ramp-node` | `BP_Mask_XiuFu01_1012` | `rampNode` | Rebuilds the shared mask node with 15 `AddZhaoMuNum` tiers gated every four awareness levels from 4 to 60 under keys `ZhaoMuRamp01`-`ZhaoMuRamp15`; the node stores only keys and gates. |
| `ramp-manager-survival` | `BP_GameXiShu_GuanLiQi` | `rampManager` | Adds the 15 keys to both default-object maps in all three groups with the Survival cumulative offsets 3,6,…,45 (`tierIncrement` 3); each cloned config unit sets `XiShuMinValue = 0` and `XiShuMaxValue = 45`. |
| `ramp-manager-tribal` | `BP_GameXiShu_GuanLiQi_Management` | `rampManager` | Adds the 15 keys to both default-object maps in all three groups with the Tribe Mode cumulative offsets 6,12,…,90 (`tierIncrement` 6); each cloned config unit sets `XiShuMinValue = 0` and `XiShuMaxValue = 90`. |

The game selects the manager per mode through `BP_CustomGameModeManager.GameXiShuGuanLiQiClassMap`, so a key present in only one manager is shadowed in the other modes.
Each appended `GameXiShuConfigUnit` needs its own range because a cloned unit inherits the template's `1`/`10` `XiShuMinValue`/`XiShuMaxValue`, and the runtime clamps every larger cumulative offset down to that inherited maximum.

## Localization edit

The localization edit adds one `locres` manifest entry. A `locres` entry names a single asset file instead of a `.uasset`/`.uexp` pair, so `buildOne` dispatches on `assetKind`; the rest of the pipeline is unchanged.

| Manifest id | Asset | Edit | What it does |
| --- | --- | --- | --- |
| `localization-origin` | `WS/Content/Localization/Game/en/Game.locres` (client) | `originLocalization` | Writes the six Origin talent `Title` and `Desc` keys from `DESIGN.md` ("Talent composition"): the exact title and a description matching the class skill set, keeping the shipped flavor sentence and the `+75%` growth-rate phrasing. |

The pure locres reader/writer (`src/pure/locres.ts`) parses UE4 version 3 CityHash64 UTF-16, keeps each string's original encoded bytes for a byte-identical unchanged round-trip, and appends a fresh string-table entry per replacement so a shared entry is never clobbered.
`buildLocresOne` proves a no-change parse/serialize reproduces the shipped bytes, fails fast when a requested key is absent or the file format is unexpected, re-parses the edited file and reads the settled text back through `verify`, and requires a second serialize to reproduce the edited bytes.
The edited file is staged at its retail path so the pak overrides the base pak's locres.

## Toolchain

- [Bun](https://bun.sh) runs the TypeScript pipeline and the in-memory tests; no npm dependencies are used.
- [repak](https://github.com/trumank/repak) packs and inspects the pak.
- A .NET 8 runtime runs the `UAssetAPI` wrapper that reads and writes the cooked `DataTable`/Blueprint assets.
- The wrapper sources are vendored under `tools/uasset-wrapper/` and target `UAssetAPI` 1.1.0.
- The wrapper binaries are not committed; build them once into a scratch directory.

The build-only dependency choices and their review are recorded in [`DEPENDENCIES.md`](DEPENDENCIES.md).

The pipeline is TypeScript transpiled by Bun and deliberately has no compiler or typecheck gate.
The mod ships as a binary cooked-asset pak, and this code is build-only tooling that never runs with the game.
The tooling still follows the AGENTS.md coding standards, including the prohibition on typecasts and non-null assertions.

Rebuild the wrapper binaries:

```sh
export DOTNET_ROOT=/tmp/dotnet PATH=/tmp/dotnet:$PATH DOTNET_SYSTEM_GLOBALIZATION_INVARIANT=1
dotnet build -c Release tools/uasset-wrapper/UAssetToJson/UAssetToJson.csproj
dotnet build -c Release tools/uasset-wrapper/roundtrip/roundtrip.csproj
```

## Run the build

```sh
./build.sh
```

`build.sh` reads the extracted retail content trees and tool paths from these environment variables, each with a `/tmp` default:

- `SOULMASK_SERVER_CONTENT`: the authoritative extracted tree, for example `/tmp/soulmask-server/extracted/WS/Content`.
- `SOULMASK_CLIENT_CONTENT`: the client tree; the localization edit reads `Localization/Game/en/Game.locres` from it (byte-identical to the retail client pak entry).
- `DOTNET_ROOT`, `REPAK_PATH`, `UASSET_TO_JSON_DLL`, `ROUNDTRIP_DLL`.

The build writes its scratch under `build/.work/`, stages the pak root, and emits `build/dist/PredictablePotential_P.pak`.
It prints the pak info, the entry listing, and the SHA-256.

## Tests

```sh
bun test
```

The tests cover the pure helpers only: the starting curve and bands, the roster-ramp gate/offset/key math, the class skill sets, the talent mappings (origin families, class/tribe pool families, rarity weights, preference gear rows), the locres reader/writer and key replacement, the origin localization text mapping, and manifest validation.
They run in memory and touch no filesystem, network, or subprocess.

## Layout

- `src/pure/`: pure helpers imported directly (curve, ramp math, class sets, talent mappings).
- `src/edits/`: per-asset declarative transformations, each with an `apply` and a `verify`, plus the validating asset accessors.
- `src/leaves/`: leaf factories for the filesystem, `repak`, and the .NET wrapper.
- `src/orchestration/`: the extract -> edit -> verify -> pack sequencing.
- `src/manifest.ts`: the data-driven list of asset edits.
- `src/main.ts`: the only place that assembles real dependencies.

## Verification

Every edited asset must re-parse through the wrapper and must round-trip byte-identically when unchanged.
The build also re-exports each edited asset and requires the second pass to reproduce the edited bytes exactly.
Each new edit's `verify` re-reads the reparsed asset and checks the settled value, so a silent serialization loss fails the build.
The final pak must list every staged asset at its retail `WS/Content/...` path.

## Adding an asset edit

To add a `.uasset`/`.uexp` asset, append a `ManifestEntry` to `ASSET_MANIFEST` with an edit id from `EDIT_REGISTRY` in `src/edits/registry.ts`; a new edit kind is a module exporting `apply` and `verify` over the parsed asset JSON, registered there.
To add a `locres` asset, set `kind: "locres"` on the entry and use an edit id from `LOCRES_EDIT_REGISTRY`; a new locres edit kind is a module exporting `apply` and `verify` over the parsed locres document.
