# Packaging and Loading a Mod

This guide shows how to turn edited cooked assets into a Soulmask mod pak and how to make the game load it.
It covers the pak container format, the on-disk layout a mod must mirror, where the engine scans for paks, the signature gate, and the server and client launch procedures.
The Linux dedicated-server path is proven directly by server logs; the Windows client path is community-reported and shares the same engine pak layer.
See `authoring-pipeline.md` for how the edited `.uasset`/`.uexp` files are produced and `testing.md` for how to verify a change end to end.

## Pak format facts

Soulmask ships classic Unreal Engine 4.27 `.pak` containers, not IoStore `.utoc`/`.ucas`.
The retail shared-content pak is `WS-WindowsNoEditor.pak` on the client and `WS-LinuxServer.pak` on the dedicated server.
Both retail paks and a correct mod pak use the same container properties.

| Property | Value |
| --- | --- |
| Mount point | `../../../` |
| Version | `V11` |
| Version major | `Fnv64BugFix` |
| Path hash seed | `Some(63419044)` |
| Entry paths | engine-root-relative, e.g. `Engine/...` and `WS/...` |
| Encryption | mod paks are written unencrypted (encrypted index `false`) |
| Compression | `None` for a minimal mod pak |

A pak sits physically in `<root>/WS/Content/Paks/`, so the mount point `../../../` resolves to `<root>/`.
An entry stored as `WS/Content/Blueprints/DataTable/NaturalGift/DT_GiftZongBiao.uasset` therefore resolves to `<root>/WS/Content/Blueprints/DataTable/NaturalGift/DT_GiftZongBiao.uasset`, exactly matching the extracted retail tree.
Override resolution is a property of the package path under `/Game/...`, so a mod entry that mirrors the retail path replaces the base asset.

The `_P` suffix (for example `<Name>_P.pak`) marks the pak as a patch pak.
Unreal Engine adds `+1000` to the startup mount priority of any pak whose filename ends in `_P`, so same-path assets inside it override those from a lower-priority pak.
Epic's 4.27 patching guidance is explicit that the filename may be renamed but must keep the `_p.pak` ending; `TestStruct_P.pak` is a working example.

## Mod layout

A mod pak must mirror the retail directory tree under the pak root, using the same `WS/Content/...` paths the base pak uses.
The minimal layout for one overridden DataTable is:

```
<pak root>/
└── WS/Content/Blueprints/DataTable/NaturalGift/
    ├── DT_GiftZongBiao.uasset
    └── DT_GiftZongBiao.uexp
```

For multiple overridden assets, reproduce each retail path under `<pak root>/WS/Content/...` exactly, for example `WS/Content/Blueprints/ZiYuanGuanLi/BP_ProficiencyConfig.uasset` and its `.uexp`.
Always ship the `.uasset` and its sibling `.uexp` together; a cooked asset is not loadable from the `.uasset` alone.
[`authoring-pipeline.md`](authoring-pipeline.md) builds this tree from the round-tripped files and packs it with `repak` at the retail `V11` version and mount point.
A correctly packed tree reports the expected shape when inspected:

```sh
/tmp/repak/repak info /tmp/pipeline-scratch/TestStruct_P.pak
```

```
mount point: ../../../
version: V11
encrypted index: false
compression: None
2 file entries
WS/Content/Blueprints/DataTable/NaturalGift/DT_GiftZongBiao.uasset
WS/Content/Blueprints/DataTable/NaturalGift/DT_GiftZongBiao.uexp
```

## Where the engine looks for paks

The engine (`FPakPlatformFile`) recursively scans the `Paks` directory tree, so both of these locations are found:

| Location | Notes |
| --- | --- |
| `WS/Content/Paks/<Name>_P.pak` | flat alongside the retail pak |
| `WS/Content/Paks/~mods/<Name>_P.pak` | the common community `~mods` convention |

`~mods` is not a game-specific convention; it works simply because the scanner walks the whole `Paks` tree.
The `_P` suffix is what grants the patch priority, so the filename ending matters more than the subdirectory.

`WS/Mods/` is not scanned as a raw pak directory.
A server started with a pak present at `WS/Mods/LinearProgressionTest_P.pak` never logged it at all.
`WS/Mods/` is the game's own `ProjectModsDir`, driven by the custom `NeedMods` mod manager (`LoadNeedMods`, `ApplyNeedMods`, `NeedMods.json`, `ModeInfo.json`, `currentmodinfo`, `dumpmodlist`), not by the generic pak scanner, and no `NeedMods.json` or mod entry exists on the dedicated server to drive it.
Put hand-built paks in `WS/Content/Paks/` or `WS/Content/Paks/~mods/`.

## The signature gate and `-fileopenlog`

The engine performs a UE4 pak signature check and refuses unsigned paks.
Starting the server with a test pak in `WS/Content/Paks/~mods/` and without `-fileopenlog` produces:

```
LogPakFile: Display: Found Pak file ../../../WS/Content/Paks/~mods/LinearProgressionTest_P.pak attempting to mount.
LogPakFile: Display: Mounting pak file ../../../WS/Content/Paks/~mods/LinearProgressionTest_P.pak.
LogPakFile: Warning: Couldn't find pak signature file '../../../WS/Content/Paks/~mods/LinearProgressionTest_P.pak'
LogPakFile: Warning: Unable to create pak "../../../WS/Content/Paks/~mods/LinearProgressionTest_P.pak" handle
LogPakFile: Warning: Failed to mount pak "../../../WS/Content/Paks/~mods/LinearProgressionTest_P.pak", pak is invalid.
```

The `.sig` file is an RSA signature over per-128 KB chunk hashes, and the private signing key is not public, so a `.sig` cannot be produced outside the Modkit.
On the Linux server, `-fileopenlog` is the required and sufficient bypass; the same pak bytes mount when the flag is present:

```
LogPakFile: Display: Found Pak file ../../../WS/Content/Paks/~mods/LinearProgressionTest_P.pak attempting to mount.
LogPakFile: Display: Mounting pak file ../../../WS/Content/Paks/~mods/LinearProgressionTest_P.pak.
LogShaderLibrary: Display: PakFile '../../../WS/Content/Paks/~mods/LinearProgressionTest_P.pak' (chunk index -1, root '../../../') mounted
```

There is no signature warning with the flag, and the engine also logs `Disabled pak precacher to get an accurate load order.`, which is expected.
This is the decisive comparison: the same bytes are rejected without the flag and accepted with it.
The string `fileopenlog` is present in `WSServer-Linux-Shipping` only as a UTF-16 literal, so an ASCII `strings` pass misses it; search it with `strings -e l`.

The signed path avoids the flag entirely: a Modkit-built, Workshop-distributed mod is registered by the game's own Mod Manager rather than mounted as a loose unsigned pak.
Signed Workshop distribution is the low-risk shipping channel; see `distribution-and-anticheat.md` for the anti-cheat and official-server considerations.

## Server and client load procedures

### Linux dedicated server (proven)

1. Build `<Name>_P.pak` as described above.
2. Copy it to `WS/Content/Paks/<Name>_P.pak` or `WS/Content/Paks/~mods/<Name>_P.pak`.
3. Launch through `WSServer.sh` with `-fileopenlog` appended to the command line:

```sh
./WSServer.sh Level01_Main -server -log -UTF8Output -MULTIHOME=0.0.0.0 -EchoPort=18888 -forcepassthrough -fileopenlog
```

A headless smoke test adds `-nullrhi`:

```sh
timeout 45 ./WSServer.sh Level01_Main -server -log -UTF8Output -MULTIHOME=0.0.0.0 -EchoPort=18888 -forcepassthrough -nullrhi -fileopenlog
```

4. Confirm the mount in the server output or in `WS/Saved/Logs/WS.log` (`Found Pak file`, then `mounted`).

No `.sig` file is needed on the server when `-fileopenlog` is present.

### Windows client (community-reported)

The client uses the same engine pak layer and the same signature gate, so a hand-built unsigned `_P.pak` in `WS/Content/Paks/` or `~mods/` is reported to require `-fileopenlog` as well.
Add the flag in Steam at **Properties → Launch Options**, as the community documents for the `levelcap_P.pak` and `Stack_100_P.pak` mods.
The client executable `WS/Binaries/Win64/WS-Win64-Shipping.exe` is Themida-packed, so no engine string (including `fileopenlog`) survives a static scan; the absence proves nothing and the behavior is not directly observed here.
A signed, Modkit-built, Workshop-distributed mod avoids the flag.

## Load precedence and collisions

The `_P` suffix raises a pak's mount priority by `+1000`, which is what makes its entries override the base pak.
When two paks provide the same `/Game/...` package path, the last one loaded at the deciding priority wins, and the Modkit documentation states the rule as "the most recently loaded mod will override the previous one".
This means a competing `_P.pak` loaded after yours can silently take the mount and replace your asset, and there is no per-asset arbitration beyond load order.
Never assume your pak wins because it is named `_P`; test with one mod installed at a time, and give rival paks distinct asset paths instead of fighting over the same one.

## What cannot be loaded from a pak

`GameXishu` tuning config is disk-side configuration, not a pak asset.
`GameXishu*.json` is absent from the pak index and from the extracted tree; the retail copy lives on disk at `/soulmask/WS/Config/GameplaySettings/GameXishu_Template.json`, and the server loads presets through `-coef=<Name>`.
Do not try to ship a `GameXishu` change inside a `_P.pak`; edit the JSON on disk instead.

The live `NeedMods` manager files cannot be shipped inside a pak either.
`NeedMods.json` and `ModeInfo.json` drive the game's own mod manager at runtime and are not pak entries; a raw pak dropped into `WS/Mods/` is ignored because that directory is not scanned as a pak root.
Hand-built paks are loaded from `WS/Content/Paks/` or `~mods/` via the generic scanner, not through the `NeedMods` manager.

## Testing the mount

Confirm what a pak contains before installing it:

```sh
/tmp/repak/repak info /tmp/pipeline-scratch/TestStruct_P.pak
/tmp/repak/repak list /tmp/pipeline-scratch/TestStruct_P.pak
```

After starting the server, grep the log for the pak name:

```sh
grep -a "TestStruct_P" WS/Saved/Logs/WS.log
# expected: Found Pak file ... / Mounting pak ... / mounted
```

Run the negative control to confirm the signature gate is the only thing standing between the pak and the engine:

```sh
timeout 45 ./WSServer.sh Level01_Main -server -log -UTF8Output -MULTIHOME=0.0.0.0 -EchoPort=18888 -forcepassthrough -nullrhi
grep -a "TestStruct_P" WS/Saved/Logs/WS.log
# expected: Couldn't find pak signature file / Failed to mount ... pak is invalid
```

A successful mount proves the pak is structurally valid and prioritized; it does not by itself prove the game reads the overridden row at runtime.
See `testing.md` for the full verification workflow.

## Foot-guns

- `-fileopenlog` is a game-build-specific mechanism; another UE 4.27 title removed the bypass, so pin the mod to a known Soulmask build and re-test after every patch.
- Unsigned paks plus `-fileopenlog` on official servers are an uncertain risk; a kernel-level client anti-cheat could treat the unusual flag or an unsigned mount as suspicious, so avoid official-server play with the mod.
- An ASCII `strings` search misses the UTF-16 `fileopenlog` literal; use `strings -e l` or you will wrongly conclude the flag is unsupported.
- `repak`'s `-a`/`--aes-key` option is global and must precede the subcommand.
- `WS/Mods/` is not scanned for paks; place hand-built paks in `WS/Content/Paks/` or `~mods/`.
- The round-trip replacement JSON must not be the tool's own `<outputBase>.export.json` path, or the edit silently no-ops.
- UAssetAPI cannot create new assets, and `RawExport` Blueprints stay opaque; a pak can only override assets you can reserialize.
- Server extraction differs from the client for a few assets (`DT_GiftZongBiao`, `BP_ZiYuanGuanLiQi`, `BP_BuLuo_Base`); use the retail client pak as authoritative.

## Related documents

- `authoring-pipeline.md` — extracting, editing, and repacking cooked assets.
- `distribution-and-anticheat.md` — shipping channel and anti-cheat considerations.
- `testing.md` — verifying a change end to end.
- `../reverse-engineering/extracting-cooked-assets.md` — decryption and extraction of the retail paks.
