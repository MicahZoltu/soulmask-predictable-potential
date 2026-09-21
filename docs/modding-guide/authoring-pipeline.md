# Authoring a Soulmask Data Mod End to End

This guide takes a data-only Soulmask mod from the retail cooked assets to a loadable unsigned `_P.pak`, using tools that run on Linux.
It is written for a mod maker who wants to change DataTable rows and test the result on the Linux dedicated server.
The retail AES key is available on Linux, recovered from the unstripped Linux dedicated server binary, so extraction, editing, repacking, and the server load test need no Windows at all.
Windows is required only for the client visual test, Blueprint or ModConfiger authoring, a signed Workshop upload, and re-cooking assets from source.
Extraction detail lives in [`../reverse-engineering/extracting-cooked-assets.md`](../reverse-engineering/extracting-cooked-assets.md), the per-asset edit workflow in [`data-editing.md`](data-editing.md), the pak and load mechanics in [`packaging-and-loading.md`](packaging-and-loading.md), and the tool catalog in [`tooling.md`](tooling.md).

## The pipeline at a glance

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

Extraction, editing, repacking, and the server load test are all authorable on Linux.
The Windows client is needed only to see the change with your own eyes, to author Blueprint or ModConfiger logic, to upload a signed mod to Steam Workshop, and to re-cook assets from source.

## Extract the retail cooked assets

The key recovery and `repak unpack` procedure are documented in [`../reverse-engineering/extracting-cooked-assets.md`](../reverse-engineering/extracting-cooked-assets.md).
The key is recovered from the unstripped Linux dedicated server binary and decrypts both the server pak and the retail client pak, so the cooked `.uasset`/`.uexp` tree is available on Linux.
Never edit the extracted tree in place; copy the target pair into scratch first.

```sh
mkdir -p /tmp/pipeline-scratch/proof
cp /tmp/soulmask-server/extracted/WS/Content/Blueprints/DataTable/NaturalGift/DT_GiftZongBiao.uasset /tmp/pipeline-scratch/proof/orig.uasset
cp /tmp/soulmask-server/extracted/WS/Content/Blueprints/DataTable/NaturalGift/DT_GiftZongBiao.uexp   /tmp/pipeline-scratch/proof/orig.uexp
cp /tmp/soulmask-server/extracted/WS/Content/AdditionMap01/BluePrints/DataTable/Drop/DT_Tribe.uasset /tmp/pipeline-scratch/proof/orig_tribe.uasset
cp /tmp/soulmask-server/extracted/WS/Content/AdditionMap01/BluePrints/DataTable/Drop/DT_Tribe.uexp   /tmp/pipeline-scratch/proof/orig_tribe.uexp
```

A cooked asset is not loadable from the `.uasset` alone, so always carry the sibling `.uexp` with it.

## Export, edit, and import a DataTable

### The round-trip wrapper

`UAssetAPI` 1.1.0 exposes `UAsset.SerializeJson(Formatting)` and `static UAsset DeserializeJson(string)`, so a JSON round-trip is a direct read, serialize, deserialize, and write.
The wrapper is a small console program; the source below is the one used for the validated round-trip, and a vendored copy lives under `build/tools/uasset-wrapper/`.
The constructor auto-loads the sibling `.uexp`, and `Write(base + ".uasset")` writes both the `.uasset` and its `.uexp`.

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

### A no-change round trip is byte-identical

Export each pair and compare the re-imported files against the originals.

```sh
cd /tmp/pipeline-scratch/roundtrip
dotnet run -c Release --no-build -- /tmp/pipeline-scratch/proof/orig.uasset       /tmp/pipeline-scratch/proof/rt
dotnet run -c Release --no-build -- /tmp/pipeline-scratch/proof/orig_tribe.uasset /tmp/pipeline-scratch/proof/rt_tribe
sha256sum /tmp/pipeline-scratch/proof/orig.uasset /tmp/pipeline-scratch/proof/rt.uasset
sha256sum /tmp/pipeline-scratch/proof/orig.uexp   /tmp/pipeline-scratch/proof/rt.uexp
```

| Asset | File | Original SHA-256 | Re-imported SHA-256 | Equal |
| --- | --- | --- | --- | --- |
| `DT_GiftZongBiao` | `.uasset` | `942a4228c2e48bff264471e9b747e1a38f18fa80cce4580f1082e2c962008af3` | same | yes |
| `DT_GiftZongBiao` | `.uexp` | `dfa74484cdcbdd9098b4b4aaa29817759026c5d0121a41a8412ebc1f39190b46` | same | yes |
| `DT_Tribe` | `.uasset` | `f8342955ae0408279306febebe15265373b047fc99a93365f3e9555d88a26faa` | same | yes |
| `DT_Tribe` | `.uexp` | `9ac2a74204b2691b939a1e4d213c6255b1a6e32dbacc4b67c518090ba9896fbc` | same | yes |

Binary equality holds for both a large full talent table (about 20 MB of JSON, 1.37 MB `.uexp`) and a smaller drop table.

### Apply a value edit

To edit a row, export the clean asset to JSON, mutate the JSON, and re-import it as the replacement.
The worked edit — locating the row and property, mutating the JSON, and the minimal one-byte `.uexp` diff a value change produces — is in [`data-editing.md`](data-editing.md).
The replacement JSON must live under a base name distinct from `outputBase`, because the wrapper writes `<outputBase>.export.json` before it reads the replacement.

## Lay out the pak root

The required pak-root layout — the retail `WS/Content/...` paths a mod pak must mirror, and shipping the `.uasset` with its sibling `.uexp` — is documented in [`packaging-and-loading.md`](packaging-and-loading.md).
Build the tree from the round-tripped files:

```sh
cd /tmp/pipeline-scratch
mkdir -p pakroot/WS/Content/Blueprints/DataTable/NaturalGift
cp proof/rt.uasset pakroot/WS/Content/Blueprints/DataTable/NaturalGift/DT_GiftZongBiao.uasset
cp proof/rt.uexp   pakroot/WS/Content/Blueprints/DataTable/NaturalGift/DT_GiftZongBiao.uexp
```

## Pack the patch pak

Pack with the retail container properties: version `V11` and mount point `../../../`.

```sh
/tmp/repak/repak pack --version V11 --mount-point ../../../ pakroot /tmp/pipeline-scratch/TestStruct_P.pak
```

`TestStruct_P.pak` SHA-256: `d50ba6e16868b4c6df2103a3bcc5787e8376d450b9e229b382dfa0e7726e0bf0`.
The `_P` suffix grants the pak `+1000` startup priority, so its assets override the base pak at the same package path.
The full container-property list and how to confirm a packed tree with `repak info` are in [`packaging-and-loading.md`](packaging-and-loading.md).

## Place and load the pak

Where the engine scans for paks, the signature gate, the server and client load commands, and the negative control that confirms the gate are documented in [`packaging-and-loading.md`](packaging-and-loading.md).

## The Linux and Windows boundary

| Task | Linux | Windows / Modkit |
| --- | --- | --- |
| Extract retail cooked assets | Yes | — |
| Export, edit, and import DataTable JSON | Yes | — |
| Repack the `_P.pak` | Yes | — |
| Server functional test | Yes | — |
| Client visual test | — | Yes |
| Blueprint / ModConfiger authoring | — | Yes |
| Signed Workshop upload | — | Yes |
| Re-cook assets from source | — | Yes |

## Environment setup

Set the .NET root and flag once per shell:

```sh
export DOTNET_ROOT=/tmp/dotnet PATH=/tmp/dotnet:$PATH DOTNET_SYSTEM_GLOBALIZATION_INVARIANT=1
```

`DOTNET_SYSTEM_GLOBALIZATION_INVARIANT=1` is required because the image has no ICU package; without it the .NET host aborts before running.

`repak` 0.2.3 fetches its Oodle runtime `liboo2corelinux64.so.9` beside its own binary on first use.
That self-fetch fails when `repak` lives in the read-only `/usr/local/bin`, so keep a writable copy with the Oodle library next to it.

```sh
mkdir -p /tmp/repak
install -m 0755 /usr/local/bin/repak /tmp/repak/repak
curl -sL -o /tmp/repak/liboo2corelinux64.so.9 \
  https://github.com/WorkingRobot/OodleUE/raw/refs/heads/main/Engine/Source/Programs/Shared/EpicGames.Oodle/Sdk/2.9.10/linux/lib/liboo2corelinux64.so.9
sha256sum /tmp/repak/liboo2corelinux64.so.9   # ed7e98f70be1254a80644efd3ae442ff61f854a2fe9debb0b978b95289884e9c
```

Use the writable copy, `/tmp/repak/repak`, for every pack and inspect command in this guide.
UAssetAPI 1.1.0 and its wrapper are built against .NET 8; the validated build locations are `/tmp/uasset2json/UAssetToJson/bin/Release/net8.0/` and `/tmp/pipeline-scratch/roundtrip/bin/Release/net8.0/`.
See [`tooling.md`](tooling.md) for the full install and dependency-review record.

## Proven and unverified

Proven:

- A no-change `UAssetAPI` JSON round-trip reproduces both the `.uasset` and the `.uexp` with identical SHA-256 for genuine cooked DataTables.
- A one-field edit changes exactly one byte of the `.uexp`, leaves the `.uasset` byte-identical, re-parses cleanly, and itself round-trips back to binary equality.
- The Linux dedicated server mounts an unsigned `_P.pak` with `-fileopenlog` and rejects the same bytes without it.

Unverified:

- That the in-game reader actually serves the overridden row from the `_P.pak`; the pak mounts and `_P` grants priority, but a runtime data read was not observed.
- That the Windows client accepts `-fileopenlog`; the client binary is Themida-packed, so no engine string survives a static scan and the behavior is community-reported rather than directly observed.
- That a `UAssetAPI`-reserialized asset survives a live game read; structural validity and byte-minimal diffs are proven, but no in-client load was performed.
- That a valid `.sig` can be produced outside the Modkit, because no public signing key exists.

## Foot-guns

- The replacement JSON must not be the tool's own `<outputBase>.export.json`, or the edit silently no-ops.
- `repak` cannot self-fetch Oodle under the read-only `/usr/local/bin`; use a writable copy beside `liboo2corelinux64.so.9`.
- An ASCII `strings` search misses the UTF-16 `fileopenlog` literal; use `strings -e l`.
- A DataTable row addition needs the new row name appended to `NameMap` first, or UAssetAPI aborts with `FName+DummyFNameSerializationException`.
- UAssetAPI cannot create a new asset and cannot edit a Blueprint left as a `RawExport` (for example `BP_ZiYuanGuanLiQi`, a 176,472-character base64 blob).
- `GameXishu*.json` is a disk server config under `WS/Config/GameplaySettings/`, not a pak asset, so it cannot ship inside a `_P.pak`.
- No `.sig` can be produced without the Modkit signing key; the signature is an RSA signature over per-128 KB chunk hashes and the private key is not public.
- `-fileopenlog` is a game-build-specific mechanism, so pin the mod to a known Soulmask build and re-test after every patch.
- `WS/Mods/` is not scanned as a raw pak directory; use `WS/Content/Paks/` or `~mods/`.
- `repak`'s `-a`/`--aes-key` option is global and must precede the subcommand.
- Server extraction differs from the client for a few assets (`DT_GiftZongBiao`, `BP_ZiYuanGuanLiQi`, `BP_BuLuo_Base`); use the retail client pak as authoritative.
- Treat the retail AES key like a private signing key; never ship it in a pak, log it off-machine, or commit it to a published artifact.

## Related documents

- [`packaging-and-loading.md`](packaging-and-loading.md) — pak format, mount layout, signature gate, and load precedence.
- [`data-editing.md`](data-editing.md) — the per-asset JSON edit workflow.
- [`tooling.md`](tooling.md) — tool versions, setup, and dependency review.
- [`distribution-and-anticheat.md`](distribution-and-anticheat.md) — shipping channel and anti-cheat considerations.
- [`../reverse-engineering/extracting-cooked-assets.md`](../reverse-engineering/extracting-cooked-assets.md) — decryption and extraction of the retail paks.
