# Cooked-Asset Analysis and Editing

This document records how Soulmask cooked `.uasset`/`.uexp` pairs were parsed, inspected, edited, and re-serialized reproducibly on Linux with UAssetAPI.
The input assets are UE 4.27 cooked pairs extracted from the retail client pak or the Linux dedicated-server pak; the extraction procedure is in `extracting-cooked-assets.md`.
Address-level and native-binary findings are in `native-binary-analysis.md`.
The authoring workflow that packages these edited assets into a `_P.pak` is in [`../modding-guide/packaging-and-loading.md`](../modding-guide/packaging-and-loading.md).
Asset-level edits are proven by binary round-trip and re-parse; whether the shipping game reads the edited value at runtime is unverified and is called out per claim.

## 1. UAssetAPI wrapper and environment

UAssetAPI 1.1.0 is a `net8.0` library used through two small console programs, `UAssetToJson` for export and `roundtrip` for re-import.
It targets .NET 8 and was run with the .NET SDK version 8.0.425 installed under `/tmp/dotnet`.

The environment is required exactly as follows:

```sh
export DOTNET_ROOT=/tmp/dotnet
export PATH=/tmp/dotnet:$PATH
export DOTNET_SYSTEM_GLOBALIZATION_INVARIANT=1
```

`DOTNET_SYSTEM_GLOBALIZATION_INVARIANT=1` is mandatory on this image because no `libicu` package is installed; without it the .NET host aborts before running with `Couldn't find a valid ICU package`.

The UAssetAPI NuGet closure is exactly two packages: `Newtonsoft.Json 13.0.3` and `ZstdSharp.Port 0.8.1`.
These were used only in research tooling and were never added to the project.

Both tools are created and built once:

```sh
# one-time .NET install
curl -sSL https://dot.net/v1/dotnet-install.sh -o dotnet-install.sh
chmod +x dotnet-install.sh
./dotnet-install.sh --channel 8.0 --install-dir /tmp/dotnet --no-path

# one-time UAssetToJson project (replace Program.cs with the source below)
mkdir -p /tmp/uasset2json && cd /tmp/uasset2json
dotnet new console -n UAssetToJson
cd UAssetToJson
dotnet add package UAssetAPI --version 1.1.0
dotnet build -c Release

# one-time roundtrip project (replace Program.cs with the source in "Round-trip proof")
mkdir -p /tmp/pipeline-scratch && cd /tmp/pipeline-scratch
dotnet new console -n roundtrip
cd roundtrip
dotnet add package UAssetAPI --version 1.1.0
dotnet build -c Release

# read one cooked asset to JSON (run from /tmp/uasset2json/UAssetToJson)
dotnet run -c Release --no-build -- <input.uasset> <output.json>
```

The `UAssetToJson` wrapper source is:

```csharp
using UAssetAPI;
using UAssetAPI.UnrealTypes;
using Newtonsoft.Json;

if (args.Length < 2)
{
	Console.Error.WriteLine("usage: UAssetToJson <input.uasset> <output.json> [engineMajorMinor]");
	return 2;
}

string inputPath = args[0];
string outputPath = args[1];

EngineVersion engineVersion = EngineVersion.VER_UE4_27;
if (args.Length >= 3)
{
	string spec = args[2];
	string[] parts = spec.Split('.');
	int major = int.Parse(parts[0]);
	int minor = int.Parse(parts[1]);
	int numeric = major * 10 + minor;
	engineVersion = (EngineVersion)numeric;
}

UAsset asset = new UAsset(inputPath, engineVersion);
string json = asset.SerializeJson(Formatting.Indented);
File.WriteAllText(outputPath, json);
Console.WriteLine($"wrote {outputPath}");
return 0;
```

The wrapper constructs `new UAsset(path, EngineVersion.VER_UE4_27)` and writes `asset.SerializeJson(Formatting.Indented)`.
The constructor auto-loads the sibling `.uexp`, so the `.uasset` path alone addresses the pair.
UAssetGUI v1.1.0 is the same engine wrapped in WinForms and would need Wine on Linux, which is why the library route was used.

The round-trip program reads an asset, serializes it to JSON, optionally reads a replacement JSON, deserializes it with `UAsset.DeserializeJson(string)`, and writes the pair with `imported.Write(outputBase + ".uasset")`.
`Write` produces both the `.uasset` and its `.uexp`.

```csharp
using System;
using System.IO;
using System.Text;
using UAssetAPI;
using UAssetAPI.UnrealTypes;
using Newtonsoft.Json;

// usage: roundtrip <input.uasset> <outputBase> [replacementJson]
if (args.Length < 2)
{
    Console.Error.WriteLine("usage: roundtrip <input.uasset> <outputBase> [replacementJson]");
    return 2;
}
string inputPath = args[0];
string outputBase = args[1];

UAsset asset = new UAsset(inputPath, EngineVersion.VER_UE4_27);
string json = asset.SerializeJson(Formatting.Indented);
File.WriteAllText(outputBase + ".export.json", json);

string importJson = json;
if (args.Length >= 3) importJson = File.ReadAllText(args[2], Encoding.UTF8);

UAsset imported = UAsset.DeserializeJson(importJson);
imported.Write(outputBase + ".uasset");
Console.WriteLine($"wrote {outputBase}.uasset (+ .uexp if separate)");
return 0;
```

The tool writes `<outputBase>.export.json` before reading the replacement, so the replacement file must live under a different name; passing the tool's own output path silently produces an unchanged copy.

## 2. Round-trip proof

A no-change export/re-import reproduces genuine cooked DataTables byte-for-byte.

| Asset | File | Original SHA-256 | Re-imported SHA-256 | Equal |
| --- | --- | --- | --- | --- |
| `DT_GiftZongBiao` | `.uasset` | `942a4228c2e48bff264471e9b747e1a38f18fa80cce4580f1082e2c962008af3` | same | yes |
| `DT_GiftZongBiao` | `.uexp` | `dfa74484cdcbdd9098b4b4aaa29817759026c5d0121a41a8412ebc1f39190b46` | same | yes |
| `DT_Tribe` | `.uasset` | `f8342955ae0408279306febebe15265373b047fc99a93365f3e9555d88a26faa` | same | yes |
| `DT_Tribe` | `.uexp` | `9ac2a74204b2691b939a1e4d213c6255b1a6e32dbacc4b67c518090ba9896fbc` | same | yes |

Equality holds for both the large full talent table (about 20 MB of JSON, 1.37 MB `.uexp`) and the smaller drop table.
Re-parsing the retail server `DT_GiftZongBiao` reproduces its UAssetAPI JSON byte for byte (SHA-256 `3321898680e3d258e7c7b32fa89f60bc485512fef83b11f0022b909da21da97f`).
The source assets were copied out of the extracted tree before editing so the originals were never written.

Commands:

```sh
# no-change round-trip (run from /tmp/pipeline-scratch/roundtrip)
dotnet run -c Release --no-build -- /tmp/pipeline-scratch/proof/orig.uasset       /tmp/pipeline-scratch/proof/rt
dotnet run -c Release --no-build -- /tmp/pipeline-scratch/proof/orig_tribe.uasset /tmp/pipeline-scratch/proof/rt_tribe
sha256sum /tmp/pipeline-scratch/proof/orig.uasset /tmp/pipeline-scratch/proof/rt.uasset
sha256sum /tmp/pipeline-scratch/proof/orig.uexp   /tmp/pipeline-scratch/proof/rt.uexp
```

A single integer edit produces a minimal, structurally valid diff.
`DT_Tribe` is a single `DataTableExport` whose rows are structs of type `CaiJiDaoJuBaoDataTable`.
Row 0 (`Box_Tribe_Middle`) contains a `DaoJuBaoContent` array whose entry 0 has an `IntPropertyData` named `SelectedRandomProbability`, originally `100`.
Setting it to `101` changes exactly one byte of the `.uexp` at offset 198 (octal `144` to `145`) and leaves the `.uasset` byte-identical.

| Artifact | SHA-256 |
| --- | --- |
| edited `.uexp` | `37d4b1f8fb3a2566402f067191f9bf8e253305c9113bcf7f336fe21720931358` |
| edited `.uasset` | `f8342955ae0408279306febebe15265373b047fc99a93365f3e9555d88a26faa` (identical to original) |

The editor used Bun because no `jq`/`python3` was installed:

```sh
bun -e '
const d = await Bun.file("rt_tribe.export.json").json();
const row0 = d.Exports[0].Table.Data[0];
const props = Object.values(row0.Value);
const p = props.find(x => x.Name === "DaoJuBaoContent");
const inner = Object.values(p.Value[0].Value).find(x => x.Name === "SelectedRandomProbability");
inner.Value = 101;
await Bun.write("changed.export.json", JSON.stringify(d, null, 2));
'
```

Re-import with an `outputBase` distinct from the replacement path, then compare:

```sh
dotnet run -c Release --no-build -- /tmp/pipeline-scratch/proof/orig_tribe.uasset \
  /tmp/pipeline-scratch/proof/mod2 /tmp/pipeline-scratch/proof/changed.export.json
cmp -l /tmp/pipeline-scratch/proof/orig_tribe.uexp /tmp/pipeline-scratch/proof/mod2.uexp
# 198 144 145
```

The modified asset was re-exported and the field read back (`reparsed value: 101 OK`, `row count: 54`), and the modified asset was round-tripped once more to binary equality:

```sh
dotnet run -c Release --no-build -- /tmp/pipeline-scratch/proof/mod2.uasset /tmp/pipeline-scratch/proof/verify_mod2.json
dotnet run -c Release --no-build -- /tmp/pipeline-scratch/proof/mod2.uasset /tmp/pipeline-scratch/proof/mod2_rt
# mod2.uasset == mod2_rt.uasset and mod2.uexp == mod2_rt.uexp
```

The one-byte edit is proven at the serialization layer; the in-game effect of the overridden row is unverified.

## 3. Cooked asset structure

A cooked asset is a `.uasset` header paired with a separate `.uexp` payload, or self-contained for uncooked Modkit assets.
UAssetAPI reads the pair through the `.uasset` path and needs no extra handling for the tested assets.

The top-level object arrays are `NameMap`, `Imports`, and `Exports`.
Negative object references in an export resolve through the `Imports` table to the referenced class name.
A DataTable asset exposes a `DataTableExport` whose rows live under `Exports[0].Table.Data`, each row keyed by name and holding typed struct fields.
A Blueprint asset exposes a class-default-object export named `Default__<Class>_C` whose `Data` array holds the default properties.

Representative parsed tables and their `RowStruct` names:

| Asset | Row struct | Rows | Path |
| --- | --- | --- | --- |
| `DT_GiftZongBiao` | `NaturalGiftEffectConfig` | 1319 | `/Game/Blueprints/DataTable/NaturalGift/DT_GiftZongBiao` |
| `DT_ProficiencyConfig_Dao` | `ProficiencyConfig` | 150 (rows `1`..`150`) | `/Game/Blueprints/DataTable/Proficiency/DT_ProficiencyConfig_Dao` |
| `DT_SpecializedSkill` | `ZhuanJingJiNeng` | 88 | `/Game/Data/DataTables/DT_SpecializedSkill` |
| `DT_ZhuanJingSLD` | `ZhuanJingShuLianDuTable` | 9 | `/Game/Blueprints/ZiYuanGuanLi/DT_ZhuanJingSLD` |

`DT_ProficiencyConfig_Dao` rows are keyed by proficiency level `1`..`150` and expose `ProfConsumeExp`, `ProfBenefitConfigList`, and `UnlockProfBenefitConfigList`.
An uncooked Modkit DataTable parsed early in the toolchain showed row `NewRow`, struct `DaoJuDTRow`, and fields `DaoJuClass`, `bShowInManRenAutoCollect`, `DlcKey`.

The client and server paks are not byte-identical for every asset; see [`extracting-cooked-assets.md`](extracting-cooked-assets.md) "Server and client parity" for the authoritative parity result and `NameMap` counts.

## 4. Export-type inventory and editability

UAssetAPI classifies each export, and the class determines editable vs opaque.
`DataTableExport` rows and `NormalExport` typed `Data` property lists are readable and writable.
`RawExport` is an opaque base64 blob that UAssetAPI 1.1.0 does not parse.

The inventory is produced by exporting an asset to JSON and reading each export's `$type`:

```sh
TOOL=/tmp/uasset2json/UAssetToJson/bin/Release/net8.0/UAssetToJson.dll
dotnet "$TOOL" "$SRC/Blueprints/JianZhu/QiTa/BP_JianZhuTrainingGround.uasset" /tmp/feasaudit-scratch/json/tg.json
bun -e 'const a=require("/tmp/feasaudit-scratch/json/tg.json");for(const e of a.Exports)console.log(e.ObjectName,(e["$type"]||"").split(",")[0],Array.isArray(e.Data)?e.Data.length:"raw")'
```

Verified export types and typed property counts:

| Asset | CDO export type | Typed CDO props | Editable with UAssetAPI |
| --- | --- | --- | --- |
| `BP_ProficiencyConfig` | `NormalExport` | 6 | Yes |
| `BP_ZiYuanGuanLiQi` | `RawExport` | opaque base64 | No |
| `BP_ManRenRandomConfig` | `NormalExport` | 7 | Yes |
| `BP_SGQ_BuLuo_Base` | `NormalExport` | 20 | Yes |
| `BP_SGQ_ZhongXingBuLuo_XiBuYuLin_ZhiHui_ShouWei` | `NormalExport` | 12 | Yes |
| `BP_JianZhuTrainingGround` | `NormalExport` | 62 | Yes |
| `BP_JianZhu_WeaponTrain_Base` | `NormalExport` | 56 | Yes |
| `BP_PeiFang_*` (recipe, e.g. `BP_PeiFang_Dao_4`) | `NormalExport` | 15 | Yes |
| `BP_SuiJi_BuLuo` (guard character) | `NormalExport` | 12 | Yes |
| `BP_SuiJi_BuLuo_UnTamed_Boss` (boss character) | `NormalExport` | 15 | Yes |
| `BP_Mask_XiuFu01_1012` | `NormalExport` | 10 | Yes |
| `BP_KJS_SubNode_JZ_TuShi_QiTa` | `NormalExport` | 7 | Yes |
| `BP_GongHuiGuangLiQi` | `NormalExport` | 3 | Yes |
| Every `DT_*` target table | `DataTableExport` | rows in `Exports[0].Table.Data` | Yes |

`BP_BaiBan…` does not exist as a Blueprint; the only `*BaiBan*` matches are an icon (`baibanrenwu.uasset`) and a condition bag (`BP_XianLiao_BaiBanFuHuo.uasset`), and the blank-body cap list is the `BaiBanProfMaxLvlList` property on the `BP_ProficiencyConfig` CDO.

`BP_ZiYuanGuanLiQi` is the one hard Blueprint boundary.
Its `Default__BP_ZiYuanGuanLiQi_C` export is `RawExport`, so its `GoodNGMaxNum`, `DT_GoodNGConfig`, `ProficiencyConfigClass`, and the `DT_PinZhi*` references cannot be repointed or value-edited.
The reported `176,472` figure for that export is the base64 character count; the serialized size is `132,353` bytes.

`BP_ManRenRandomConfig` is `NormalExport` and editable; its `Data` array has seven entries (`BornBuLuoCiTiaoMap`, `JingLiCiTiaoGaiLv`, `BornJingLiCiTiaoMap`, `BornChuShenCiTiaoList`, `BornCommonChengHaoList`, `BornTiaoJianChengHaoList`, `BornGetChengHaoRateMap`).

## 5. Row manipulation proofs

Three import experiments establish what UAssetAPI can do beyond value replacement; all were re-parsed after import, and none was loaded in the shipping game.

### 5.1 CDO array growth

Cloning a `JueSeLvlProfLvlList` element on `BP_ProficiencyConfig`, mutating its `JueSeLvlMin`/`JueSeLvlMax` and `ProfInitLvlMin`/`ProfInitLvlMax`, and appending it produced a 4-element array that re-parsed as 4 elements (from 3 shipped bands).
The technique therefore supports growing a typed CDO array, which the multi-band starting curve needs.

### 5.2 In-row map shrink

`DT_ZhuanJingSLD` row 21 was edited by setting `SLDGaiLv[0].GaiLv = 1.0` and shrinking its nested `JiNengChi` map from 7 entries to 1.
The asset imported and re-parsed at 9 rows with 1 `JiNengChi` entry, so a nested map can be shrunk in place.

### 5.3 DataTable row addition

Cloning a `DT_PinZhiGoodNGStarWeight` row, naming it `6`, and appending `6` to the asset `NameMap` imported and re-parsed at 7 rows.
Without the `NameMap` append, UAssetAPI aborts with `FName+DummyFNameSerializationException`, which is the dummy-FName failure mode.
Row addition at the UAssetAPI level is therefore not ModConfiger-only; whether the shipping game loads a hand-added row is unverified.

### 5.4 One-byte CDO value edits

A value change inside a serialized CDO array or map rewrites a single integer byte and leaves the `.uasset` byte-identical, so the edit is minimal and auditable.
Two edits to `BP_ProficiencyConfig` prove it:

| Edit | `.uexp` offset | Change |
| --- | --- | --- |
| `BaiBanProfMaxLvlList[0].MaxLvl` `40 → 45` | `3084` | octal `050` → `055` |
| `JueSeLvlProfLvlList[2].ProfInitLvlMax` `25 → 30` | `919` | octal `031` → `036` |

The second edit was applied on top of the first, and the asset re-parsed with `DunPai MaxLvl = 45`, `FaMu MaxLvl = 10`, and `JueSeLvl[2] = [41, 80, 15, 30]`, so the edits compose and round-trip.
The retail `BP_ProficiencyConfig` source hashes are `.uasset` `c4000c5fbdb995e4449a425bb3201c4fe121f92ee205ee93a8aea9b1c222a2a8` and `.uexp` `a0ede044f2d5b461fe46438015264ce316ad5dd0cb70b6f9501a79f5f5bd76aa`; the client and server copies are byte-identical, so one edit serves both.

## 6. Locres analysis

Localized `Title`/`Desc` text is display-authoritative in the cooked locres, not in the DataTable's inline source string.
The DataTable row carries a `TextPropertyData` with a `CultureInvariantString` (the baked source, Chinese in the shipping asset), an empty `Namespace`, and a `Value` that is the 32-hex `FText` key.
The displayed text is the cooked locres entry for `(Namespace, Value)`.

Origin and Battle-Tested text keys were located this way.
For row `700012`: `Title.Value = 48E1BCB740B0BA80D60715AE47BCDC82`, `Title.CultureInvariantString = 经历·能征善战`, `Desc.Value = AFD79A944A7EDE319AEEC19D47843286`.
The three Battle-Tested title keys `48E1BCB7…`, `8C62A5F9…`, and `C922A5EB…` all reference the shared text `Experience - Battle-tested`.

`WS/Content/Localization/Game/en/Game.locres` parses as UE4 version 3 (CityHash64 UTF-16).
The layout is a 16-byte magic, one version byte (`3`), an `int64` string-table offset, an `int32` total entry count, an `int32` namespace count, then per namespace a `uint32` namespace hash, an `FString` name, an `int32` key count, and per key a `uint32` key hash, an `FString` key, a `uint32` source hash and an `int32` string-table index, followed by the string table of `FString` text plus an `int32` ref count.
A positive string length means one-byte (ASCII/Latin-1) content and a negative length means UTF-16.
The file exposes an empty namespace and 40,068 keys and is 3,503,072 bytes.

A self-contained Bun reader/writer (`locres-edit.mjs`, driven by `locres-apply.mjs`) re-serializes the file byte-identically (`cmp` clean) and can replace a key's text while appending a fresh string-table entry so shared entries are not clobbered.
A 36-entry key-to-text map covering all six origin families' titles and descriptions was applied and re-parsed successfully.
The retail client file is byte-identical to the extracted server copy (SHA-256 `7d6699e0…`), and a `repak pack --version V11 --mount-point ../../../` override ships the edited file back to the same internal path.
Locres override priority over the base pak at runtime is unverified.

## 7. Public community assets

`soulmask-codex` publishes Modkit DataTable and Blueprint JSON exports that can be used without extracting the retail pak and without the AES key.
The exports include `DT_GiftZongBiao.json` (1,611,301 bytes), `DT_Tribe.json` (452,624 bytes), and `DT_ZhiZuo.json` (187,350 bytes), plus parsed projections such as `items.json` (2,015), `recipes.json` (1,109), `tech_tree.json` (777), and `drops.json` (1,292).

A community localization dump (`Kheeman/SoulmaskDB` `Game_en.po`, 17,069,772 bytes) records 38,300 `SourceLocation` records and 10,575 unique `/Game/...` package paths, which is useful for path discovery without the key.

Limitations of the community exports:

- They are Modkit source-format JSON, not cooked `.uasset`/`.uexp`, so they cannot be substituted for a cooked asset in a `_P.pak`; they are reference data only.
- The export pipeline runs under the Modkit's UE 4.27.2 Python surface, where `unreal.FieldIterator` is absent, `EditorAssetLibrary.export_asset()` is absent, and `AssetExportTask` csv/json silently returns `False`; only `DataTableFunctionLibrary.get_data_table_column_as_string` works reliably, so the exports carry only the fields that surface exposes.
- The tech-tree export counts 777 nodes while the extracted cooked content has 778 `BP_KJS_*` assets (180 main + 598 sub), so counts from the community export should be reconciled against a cooked parse.

## 8. Foot-guns

- **`RawExport`** — `BP_ZiYuanGuanLiQi` is opaque; its `GoodNGMaxNum`, `DT_GoodNGConfig`, and `DT_PinZhi*` references cannot be typed-edited, so changes there need a raw byte patch or Windows/Modkit work.
- **Empty-array serialization** — UAssetAPI cannot re-serialize an empty `NaturalGiftDetail` array; delete pool rows instead of emptying `NGDetailList`.
- **Dummy FName** — adding a DataTable row without appending its name to `NameMap` throws `FName+DummyFNameSerializationException`.
- **No asset creation or cooking** — UAssetAPI edits existing assets only; it cannot create a `.uasset`/`.uexp` pair, and there is no Linux cooker for new Blueprint or asset content.
- **Themida-packed client** — a static scan of `WS-Win64-Shipping.exe` proves nothing; the packaging details and the UTF-16 `strings` caveat are in [`extracting-cooked-assets.md`](extracting-cooked-assets.md) "Foot-guns".
- **Replacement path collision** — the round-trip tool writes `<outputBase>.export.json` before reading the replacement, so the replacement must use a different filename or the edit silently no-ops.
- **Invariant globalization** — `DOTNET_SYSTEM_GLOBALIZATION_INVARIANT=1` is required; without it the .NET host aborts before running.
- **Runtime effect unverified** — binary round-trip and re-parse are proven here, but whether the shipping game reads an overridden value is not; see [`extracting-cooked-assets.md`](extracting-cooked-assets.md) "Still not extracted and watch items".
