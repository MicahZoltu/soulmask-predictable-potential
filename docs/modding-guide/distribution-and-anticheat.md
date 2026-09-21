# Distribution and Anti-Cheat

Soulmask accepts a mod in one of two shipping shapes: an unsigned `_P.pak` that requires the `-fileopenlog` launch flag, or a signed Modkit-built mod distributed through Steam Workshop and registered by the in-game Mod Manager.
This page explains what each channel is, what the engine's signature check actually enforces, what anti-cheat components the game ships, and how to judge the risk of distributing your mod.
It assumes you have already built a pak; see [packaging-and-loading.md](packaging-and-loading.md) for the build and mount mechanics and [official-modkit-and-modconfiger.md](official-modkit-and-modconfiger.md) for the signed Modkit path.

## 1. The two shipping channels

| Channel | Artifact | Launch requirement | Registration | Intended use |
| --- | --- | --- | --- | --- |
| Unsigned patch pak | `<Name>_P.pak` (unencrypted V11, mount point `../../../`) | `-fileopenlog` on the client or server command line | None; mounted as a loose pak | Local, offline, and player-hosted dedicated-server play |
| Signed Modkit mod | Modkit-built mod folder / Steam Workshop item (`ModeInfo.json`) | None | In-game Mod Manager and the dedicated server's `-mod="<ModID1>,<ModID2>"` | Low-risk public distribution |

The unsigned channel is the one a Linux author can iterate on directly.
Build the pak with `repak pack --version V11 --mount-point ../../../`, place it at `WS/Content/Paks/<Name>_P.pak` or `WS/Content/Paks/~mods/<Name>_P.pak`, and append `-fileopenlog` to the launch command.
On a dedicated server that means editing the `WSServer.sh` invocation; `StartServer.sh` does not pass the flag by default.
The `_P` suffix gives the pak a patch priority of +1000, so its same-path assets override the base pak.

The signed channel is the low-risk distribution route.
It is produced only by the Windows UE 4.27.2 Modkit through Package UGC, then Build Mod, then Upload built mod to Steam.
The in-game Mod Manager applies it, and no launch flag is needed.

Foot-gun: `WS/Mods/` is not auto-scanned as a raw pak directory, so a hand-built pak dropped there is ignored.
The game's own mod directory is driven by the custom `NeedMods` / `ModeInfo.json` path, which expects signed Modkit input.

## 2. The signature reality

The engine performs a UE4 pak signature check and refuses an unsigned pak.
Starting the dedicated server with an unsigned test pak and no flag produces:

```
LogPakFile: Warning: Couldn't find pak signature file '../../../WS/Content/Paks/~mods/LinearProgressionTest_P.pak'
LogPakFile: Warning: Unable to create pak "../../../WS/Content/Paks/~mods/LinearProgressionTest_P.pak" handle
LogPakFile: Warning: Failed to mount pak "../../../WS/Content/Paks/~mods/LinearProgressionTest_P.pak", pak is invalid.
```

Adding `-fileopenlog` makes the same bytes mount:

```
LogShaderLibrary: Display: PakFile '../../../WS/Content/Paks/~mods/LinearProgressionTest_P.pak' (chunk index -1, root '../../../') mounted
```

The following facts govern what you can and cannot do about that check.

- A Soulmask `.sig` is an RSA signature over the pak's per-128 KB chunk hashes.
- The signing private key is not public, so a `.sig` cannot be produced outside the Modkit.
- `-fileopenlog` bypasses the signature check entirely, which is why the unsigned channel works at all.
- The flag is present in the shipping server binary only as a UTF-16 literal; an ASCII `strings` pass misses it, so its apparent absence proves nothing.

There is one unresolved contradiction here.
`FreeBuildNoSnapSupport` distributes a signed `_1_P.pak` with a `.sig` and notes that it is signed "with the project's crypto keys", which would imply a signing key outside the Modkit.
No public signing key has been found, and whether the Modkit can sign mods or that `.sig` was produced another way is unverified.
Treat hand-built paks as unsigned and plan on `-fileopenlog` until the Modkit path is confirmed.

## 3. What anti-cheat actually ships

The claim that Soulmask has "no anti-cheat" is inaccurate for the Windows client and must not be repeated.
The install does contain vendor security components, but they are not local mod-pak scanners.

What the Windows client ships:

| Component | Path | Notes |
| --- | --- | --- |
| `AntiGS.uplugin` | `WS/Plugins/AntiGS/AntiGS.uplugin` | Self-described "alibaba anti GS system", a Runtime module; the pak contains only this descriptor |
| `PacketCheckHandlerComponent` descriptor | `WS/Plugins/PacketCheckHandlerComponent/` | Sibling plugin self-described as "alibaba PacketCheck system" |
| `gs.dll` | `WS/Plugins/AntiGS/ThirdParty/Binaries/x64/gs.dll` | About 13.7 MB; links gRPC, OpenSSL, and Envoy |
| `LXGSService.exe` | `WS/Plugins/AntiGS/ThirdParty/Binaries/x64/LXGSService.exe` (x64) and `.../x86/LXGSService.exe` | x64 about 11.2 MB, x86 about 9.3 MB; version reported as 1.4.0.5 |
| `gsccn.dat` / `gsc.dat` | `WS/Plugins/AntiGS/ThirdParty/Binaries/x64/` | Small encrypted config blobs |
| `rail_api64.dll` | `WS/Binaries/ThirdParty/Tencent/Win64/rail_api64.dll` | About 17.5 MB; Tencent's RAIL online-services SDK |

"GS" here refers to the gold-seller / real-money-trading abuse domain.
The plugin binaries embed gRPC, protobuf, and Envoy strings and an `AntiDebug Switch:0` marker, consistent with a network-backed security and telemetry service.
No EasyAntiCheat or BattlEye binary is present.

Two things bound how much this should worry a mod distributor.

- No `.sys`, `.ko`, or other kernel driver binary ships anywhere in the client or server install tree.
- The Linux dedicated server ships only the `.uplugin` descriptors under `WS/Plugins/AntiGS/` and `WS/Plugins/PacketCheckHandlerComponent/`, with no third-party binaries, plus an inert `FAntiGSModule` symbol in the server binary.

Community reports describe `LXGSService` as a kernel-level anti-cheat that installs a driver with a UAC prompt.
Those reports concern joining official servers, not offline or private play, and the driver itself is not shipped in the install.
This means the observed anti-cheat surface is Windows-client-only: it plausibly obstructs Windows-client memory reading and DLL injection, but it does not block Linux datamining, pak extraction, server-side modding, or the server's own mod-loader symbols (`LoadNeedMods`, `ApplyNeedMods`, `NeedMods.json`, `ModeInfo.json`).

## 4. The integrity gate over local mods

The only observed integrity gate over paks is Unreal Engine's own signature check, and `-fileopenlog` bypasses it.
No evidence was found that AntiGS, LXGS, or Tencent RAIL hash or scan local mod pak files.

Some integrity-looking strings live in the server binary, but they are not a runtime mod scan:

```
EVerifyMode::ShaVerifyAllFiles
FileSizeCheckAllFiles
BuildDataGenerator: ERROR VerifyFile cannot open
HashCheckFailed
```

These belong to UE's BuildPatchServices and patch-generation machinery.
Treat the pak signature check as the real gate and do not infer a pak scanner from these strings.

## 5. Risk guidance

Use this to decide how you distribute.

| Scenario | Risk | Rationale |
| --- | --- | --- |
| Private, offline, or player-hosted dedicated server with an unsigned `_P.pak` and `-fileopenlog` | Low | Matches every working community data mod |
| Unsigned `_P.pak` with `-fileopenlog` while connected to official servers | Uncertain, discouraged | A kernel anti-cheat could in principle treat the unusual flag or an unsigned mount as suspicious, though no file-hashing behavior is documented |
| Modkit-built Workshop mod via the in-game Mod Manager | Low | Signed and registered; avoids the flag entirely |

The pattern in the community is clear: hand-built data mods such as `levelcap_P.pak` (Level Cap 100) and `Stack_100_P.pak` (Soulmask Stack) ship into `~mods` and ask users to add `-fileopenlog`, while Modkit-rebuilt versions avoid the requirement and appear in the in-game mod option.
For anything public, prefer the signed channel.

## 6. Build and key fragility

Do not treat a working mod as permanent.

- The `-fileopenlog` bypass is game-build-specific; SCUM patched the same bypass out of a later build, so this is a caution rather than a guarantee.
- The AES key that decrypts the retail paks can rotate on a future build; treat rotation as a watch item.
- A `UAssetAPI`-reserialized retail cooked DataTable is structurally valid, but whether the shipping game loads it in-game is unverified.

Pin your mod to a known Soulmask build and re-test it after every game patch.
If a future build removes the bypass, the signed Modkit channel becomes the only shipping route.

## 7. Checklist before distributing a mod

- [ ] The pak is a V11 `_P.pak` with mount point `../../../` and engine-root-relative paths (`WS/...`, `Engine/...`).
- [ ] It is placed in `WS/Content/Paks/` or `WS/Content/Paks/~mods/`, not `WS/Mods/`.
- [ ] The mod is tested on the exact game build you are targeting.
- [ ] On a dedicated server, `-fileopenlog` is present in the `WSServer.sh` command line.
- [ ] On a client, users are told to add `-fileopenlog` to the Steam launch options.
- [ ] No AES key material is shipped inside the mod, embedded in the pak, or written to any distributed log.
- [ ] Users are warned that the mod is for private, offline, or player-hosted play, not official-server play.
- [ ] A note records the known-good game build and that a patch may break the mod.
- [ ] For public release, the mod is rebuilt in the Modkit and distributed through Workshop instead.
