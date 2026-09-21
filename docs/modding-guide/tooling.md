# Tooling

This is the toolchain reference for building a Soulmask mod from cooked Unreal Engine 4.27 assets.
The tools below read, edit, and pack cooked assets into an unsigned `_P.pak`.
The end-to-end extraction, edit, pack, and mount pipeline is described in the [authoring pipeline](authoring-pipeline.md).
The per-asset edit workflow is described in [data editing](data-editing.md).

## Tool reference

| Tool | Version | License | Notable dependencies | Linux-runnable | Capability on cooked UE 4.27 assets | Recommended role |
| --- | --- | --- | --- | --- | --- | --- |
| `repak` (trumank) | `repak_cli` 0.2.3 | MIT OR Apache-2.0 | Rust crates `aes`, `sha1`, `clap`, `rayon`, `glob`; optional Oodle loader | Yes (prebuilt Linux x86_64 CLI release) | Pack, unpack, list, and hash-list classic `.pak` files; the mod pipeline writes uncompressed and unencrypted containers | Unpack the retail pak and pack and inspect the mod `_P.pak` |
| `UAssetAPI` (atenfyr) | 1.1.0 (NuGet) | MIT | .NET runtime; `Newtonsoft.Json` 13.0.3 and `ZstdSharp.Port` 0.8.1; targets `net8.0` | Yes (.NET) | Read and write cooked and uncooked `.uasset` files from about 4.13 to 5.7; JSON export and import that maintains binary equality; reads `.usmap` | The primary asset edit path, driven as a library or a small CLI |
| `UAssetGUI` (atenfyr) | GUI | MIT | Windows .NET/WinForms | With Wine or as a library, not headless | Manual view and edit of uassets and UAssetAPI JSON; the Codex pipeline used its JSON exports | Exploration on Windows or Wine; prefer scripting the API |
| `FModel` (4sval) | latest | GPL-3 | CUE4Parse | Yes but GUI | Read-only archive explorer and asset export or preview; no reserialize | Read-only reference only; GPL-3 concerns if linked |
| `umodel` (Gildor) | 2023 Windows / 2022 Linux builds | "not determined yet" | SDL2, OpenGL | Linux version is CLI-only, no GUI | Read, list, and export meshes, textures, and sounds; cannot reliably repack data assets | Avoid in a dependency-reviewed pipeline because the license is undetermined |
| `UnrealPak` (Epic) | UE 4.27 | Epic EULA | Unreal Engine | Windows binaries; official `--paks` and patch tooling | Create, extract, and patch paks, including `_P` patches; requires the UE install and EULA | Fallback if `repak` fails; not license-clean for CI redistribution |
| Bun | 1.3.9 | MIT | Self-contained binary; uses no npm packages | Yes | Runs the build pipeline and the in-memory test suite; not itself an asset tool | Build orchestration and test runner |
| .NET runtime | 8.0.31 | MIT | .NET 8 shared runtime | Yes | CLR that executes the UAssetAPI wrapper; no asset capability of its own | Required runtime for the wrapper |
| Vendored UAssetAPI C# wrapper (`UAssetToJson`, `roundtrip`) | built against UAssetAPI 1.1.0 | Project code; the linked `UAssetAPI` is MIT | `UAssetAPI` 1.1.0, `Newtonsoft.Json` 13.0.3, .NET 8 | Yes | `UAssetToJson` exports a cooked asset to UAssetAPI JSON; `roundtrip` re-imports JSON to a byte-identical `.uasset` and `.uexp` pair | The two fixed commands for export and round-trip |

`repak`'s workspace `Cargo.toml` declares `license = "MIT OR Apache-2.0"` and version `0.2.3`; the build ledger records it as a self-contained Rust binary under MIT OR Apache-2.0.
`UAssetAPI` documents read/write for a wide variety of cooked and uncooked `.uasset` files from about 4.13 to 5.7, JSON import/export that maintains binary equality, and raw Kismet (Blueprint) bytecode reading and writing.
`FModel` states it is licensed under GPL-3.
`umodel`'s source page says "License is not determined yet" and its Linux build "has no GUI yet".
No standalone, Linux-friendly Blueprint decompiler or editor was found besides the Modkit and UE4SS's Blueprint mod loader.

## Setup

### repak and the Oodle runtime

Install the official Linux x86_64 release of `repak` 0.2.3 and verify the published checksum.
`xz-utils` 5.8.1 is needed to extract the tarball.

```sh
curl -sL -o repak.tar.xz https://github.com/trumank/repak/releases/download/v0.2.3/repak_cli-x86_64-unknown-linux-gnu.tar.xz
tar xf repak.tar.xz
sudo install -m 0755 repak_cli-x86_64-unknown-linux-gnu/repak /usr/local/bin/repak
repak --version   # repak_cli 0.2.3
sha256sum repak.tar.xz   # 933bdb8e26f34e8fd70ea50201efca39df041de58aa83b1cd6eb83da124a2046
```

The retail paks use Oodle compression, and `repak` fetches `liboo2corelinux64.so.9` beside its own binary on first use.
That self-fetch fails when `repak` lives in a read-only location, so keep a writable copy with the Oodle library next to it and point `REPAK_PATH` at that copy.

```sh
mkdir -p /tmp/repak
install -m 0755 /usr/local/bin/repak /tmp/repak/repak
curl -sL -o /tmp/repak/liboo2corelinux64.so.9 \
  https://github.com/WorkingRobot/OodleUE/raw/refs/heads/main/Engine/Source/Programs/Shared/EpicGames.Oodle/Sdk/2.9.10/linux/lib/liboo2corelinux64.so.9
sha256sum /tmp/repak/liboo2corelinux64.so.9   # ed7e98f70be1254a80644efd3ae442ff61f854a2fe9debb0b978b95289884e9c
```

### .NET runtime

Install the .NET 8 SDK to `/tmp/dotnet` with the official install script.
The runtime needs `DOTNET_SYSTEM_GLOBALIZATION_INVARIANT=1` because the image has no ICU package; without it the .NET host aborts before running.

```sh
curl -sSL https://dot.net/v1/dotnet-install.sh -o dotnet-install.sh
chmod +x dotnet-install.sh
./dotnet-install.sh --channel 8.0 --install-dir /tmp/dotnet --no-path
DOTNET_SYSTEM_GLOBALIZATION_INVARIANT=1 /tmp/dotnet/dotnet --version   # 8.0.425 at install time
```

### Vendored wrapper

The wrapper sources are vendored under `build/tools/uasset-wrapper/` and target `UAssetAPI` 1.1.0.
Build both console programs once into a scratch directory.

```sh
export DOTNET_ROOT=/tmp/dotnet PATH=/tmp/dotnet:$PATH DOTNET_SYSTEM_GLOBALIZATION_INVARIANT=1
dotnet build -c Release build/tools/uasset-wrapper/UAssetToJson/UAssetToJson.csproj
dotnet build -c Release build/tools/uasset-wrapper/roundtrip/roundtrip.csproj
```

### Environment variables

These variables configure the build toolchain; the defaults are the ones used by `build.sh`.

| Variable | Purpose | Default |
| --- | --- | --- |
| `DOTNET_ROOT` | .NET installation root | `/tmp/dotnet` |
| `DOTNET_SYSTEM_GLOBALIZATION_INVARIANT` | Set to `1` to run without ICU | `1` |
| `SOULMASK_SERVER_CONTENT` | Authoritative extracted server content tree | `/tmp/soulmask-server/extracted/WS/Content` |
| `SOULMASK_CLIENT_CONTENT` | Client tree; the localization edit reads its locres | `/tmp/soulmask-client/extracted/WS/Content` |
| `REPAK_PATH` | `repak` binary (point this at the writable copy that can load Oodle) | `/usr/local/bin/repak` (the non-Oodle install location; use `/tmp/repak/repak` for extraction and packing) |
| `UASSET_TO_JSON_DLL` | Built `UAssetToJson.dll` | `/tmp/uasset2json/UAssetToJson/bin/Release/net8.0/UAssetToJson.dll` |
| `ROUNDTRIP_DLL` | Built `roundtrip.dll` | `/tmp/pipeline-scratch/roundtrip/bin/Release/net8.0/roundtrip.dll` |

The two DLL defaults point at the older scratch build locations, so a rebuild from the vendored sources must redirect them to the new build output.

## Dependency-review posture

This project keeps its dependency closure deliberately small, under the `AGENTS.md` "Very limited dependencies" policy.
The mod itself has no runtime dependency: the shipped `.pak` is game data built entirely from the retail cooked assets, and the TypeScript under `src/` uses only the Bun runtime and web-standard APIs.
Every tool below is build-only: it is never packed into the mod, never imported by runtime content, and never reaches a player.
No npm package is installed for the pipeline, and `build/package.json` declares no dependencies.
The only third-party code the build links is the `UAssetAPI` NuGet package restored into the vendored C# wrapper.

| Tool | Role | Why it is used | Alternatives considered | Closure and license | Pinned version |
| --- | --- | --- | --- | --- | --- |
| Bun | TypeScript runtime and test runner | Runs `src/main.ts` and the in-memory `bun test` suite with no npm packages | Node.js plus a bundler and test runner | Self-contained binary, MIT | 1.3.9 |
| repak | Pak packer and inspector | Writes the UE V11 `.pak` and lists its entries for the post-pack check | UnrealPak, which needs the Windows engine build | Self-contained Rust binary, MIT OR Apache-2.0 | `repak_cli` 0.2.3 |
| .NET runtime | CLR for the UAssetAPI wrapper | Runs the wrapper that reads and writes the cooked `uasset`/`uexp` assets | A hand-written UE4 package parser | .NET 8 shared runtime, MIT | 8.0.31 |
| UAssetAPI | Cooked UE4 asset read/write library | The wrapper needs lossless asset reads and byte-identical round-trips before and after an edit | Reimplementing the UE4 package serializer | NuGet restore into the wrapper build only; MIT | 1.1.0 |

The wrapper sources are vendored in `build/tools/uasset-wrapper/`; the .NET runtime and the built wrapper binaries live under `/tmp` and are not committed.
`repak` is expected on `PATH` or at `REPAK_PATH`, and the extracted retail trees live outside the repository.

## Candidate tools not recommended

| Tool | Version | License | Why it is not recommended |
| --- | --- | --- | --- |
| `retoc` | 0.1.5 | MIT | Soulmask uses classic `.pak` containers, not IoStore `.utoc`/`.ucas`, so it is not needed; its closure is large (`repak`, Archengius asset conversion, `serde`, `zstd`) |
| `umodel` | 2023 Windows / 2022 Linux | "not determined yet" | The undetermined license rules it out of a dependency-reviewed pipeline |
| `FModel` | latest | GPL-3 | Read-only with no reserialize, and GPL-3 is a concern if linked |
| `UnrealPak` | UE 4.27 | Epic EULA | Requires the UE install and the Epic EULA, and is not license-clean for CI redistribution |

## Choosing a tool by task

| Task | Tool |
| --- | --- |
| Pack a mod | `repak` (`repak pack --version V11 --mount-point ../../../`) |
| Inspect assets read-only | `FModel`, or `UAssetGUI` on Windows or Wine; use `repak info` and `repak list` for pak contents |
| Edit a DataTable | `UAssetToJson` to export JSON, an editor for the value, then `roundtrip` to re-import |
| Edit a Blueprint CDO | The same wrapper path when the CDO export is a `NormalExport`; a `RawExport` CDO cannot be edited |
| Parse a locres | The build's own locres reader/writer in `src/pure/locres.ts`; no external tool |

A Blueprint CDO that UAssetAPI leaves as an opaque `RawExport` (for example `BP_ZiYuanGuanLiQi`, a 176,472-character base64 blob) cannot be repointed or value-edited by the wrapper.

## Foot-guns

- **UAssetAPI does not cook and cannot create assets.** It edits existing `.uasset`/`.uexp` pairs only; it cannot create a new asset, and Blueprint cooking remains a Windows Modkit task.
- **The GUI tools need Wine and are not headless.** Aside from the UAssetAPI wrapper, the available tools are `UAssetGUI` (WinForms) and `FModel` (GUI); no standalone, Linux-friendly Blueprint decompiler or editor was found.
- **The `repak` container hash is not deterministic.** Three clean rebuilds produced byte-identical pak entries each time but three different container hashes (`a1bc4da6...`, `b86a9263...`, `401ec586...`), because the index and body layout differ even when the staged content is fixed; a container hash identifies one artifact and is not a reproducible build.
