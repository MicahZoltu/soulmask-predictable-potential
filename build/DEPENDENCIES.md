# Build toolchain dependency ledger

The mod itself has no runtime dependency: the shipped `.pak` is game data built entirely from the retail cooked assets, and the TypeScript under `src/` uses only the Bun runtime and web-standard APIs.
The tools below are build-only.
They are never packed into the mod, never imported by runtime content, and never reach a player.
They were reviewed under the `AGENTS.md` "Very limited dependencies" policy, and the operator approved installing them for the build.

No npm package is installed for the pipeline; `build/package.json` declares no dependencies.
The only third-party code the build links is the `UAssetAPI` NuGet package restored into the vendored C# wrapper, plus the packages that package's own NuGet closure brings in.

| Tool | Role | Why it is used | Alternatives considered | Closure and license | Pinned version |
| --- | --- | --- | --- | --- | --- |
| Bun | TypeScript runtime and test runner | Runs `src/main.ts` and the in-memory `bun test` suite with no npm packages | Node.js plus a bundler and test runner | Self-contained binary, MIT | 1.3.9 |
| repak | Pak packer and inspector | Writes the UE V11 `.pak` and lists its entries for the post-pack check | UnrealPak, which needs the Windows engine build | Self-contained Rust binary, MIT | repak_cli 0.2.3 |
| .NET runtime | CLR for the UAssetAPI wrapper | Runs the wrapper that reads and writes the cooked `uasset`/`uexp` assets | A hand-written UE4 package parser | .NET 8 shared runtime, MIT | 8.0.31 |
| UAssetAPI | Cooked UE4 asset read/write library | The wrapper needs lossless asset reads and byte-identical round-trips before and after an edit | Reimplementing the UE4 package serializer | NuGet restore into the wrapper build only; MIT | 1.1.0 |
| Newtonsoft.Json | JSON (de)serialization used directly by the wrapper `Program.cs` files | UAssetAPI's `SerializeJson`/`DeserializeJson` expose Newtonsoft's `Formatting` type, so the wrapper imports the namespace directly | `System.Text.Json`, which UAssetAPI does not expose for its JSON format | Transitive via UAssetAPI 1.1.0 (declares `>= 13.0.3`); MIT | Not named in the `.csproj` files and no lock file pins the closure, so NuGet restore resolves it within UAssetAPI's range |

`UAssetAPI` 1.1.0 also declares `ZstdSharp.Port >= 0.8.1`, so that package arrives through the same closure.

The .NET runtime and the wrapper binaries live under `/tmp` and are not committed.
The wrapper sources are vendored in `tools/uasset-wrapper/`, and `README.md` "Toolchain" records the one-time rebuild command.
`repak` is expected on `PATH` or at `REPAK_PATH`, and the extracted retail trees live outside the repository.
