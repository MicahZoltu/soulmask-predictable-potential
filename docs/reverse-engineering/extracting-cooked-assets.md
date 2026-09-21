# Extracting Cooked Assets from the Soulmask Paks

This document is the reproducible method for decrypting and unpacking the retail Soulmask cooked assets on Linux.
It is written for a mod maker or dataminer who has the retail client or the Linux dedicated server installed and wants the shipped `.uasset`/`.uexp` content.
The extraction uses the retail AES key recovered from the shipping Linux dedicated server binary, so no Windows client and no Modkit are needed to obtain or decrypt the paks.

Once extracted, what the assets contain is described in [`asset-analysis.md`](asset-analysis.md), the binary that yields the key is described in [`native-binary-analysis.md`](native-binary-analysis.md), and the edit-and-repack step is described in [`../modding-guide/authoring-pipeline.md`](../modding-guide/authoring-pipeline.md).

## Why extraction is possible

Both retail paks have an encrypted index, so the pak container cannot be listed or unpacked without the project AES-256 key.
The key is not stored in the install tree, but the Linux dedicated server leaks it at startup.

- `WS/Binaries/Linux/WSServer-Linux-Shipping` is a 145 MB non-PIE (`ET_EXEC`) ELF with no `.symtab` but a dynamic symbol table of 30,229 function symbols, so method names must come from vtables and reflection records while its addresses are fixed.
- The Windows client `WS-Win64-Shipping.exe` is Themida/WinLicense-packed, so an equivalent static scan of the client does not work.
- The server's AES implementation is the classic table-driven Rijndael variant, so decryption reads 32-bit words from fixed `.rodata` T-tables.
- The server must decrypt the pak index during startup, which loads the 32-byte `FAESKey` onto its call stack at a stable location.
- The client and server paks use the same project key, so one key recovered from the server opens both.

The method is proven, not inferred: the key is captured from the live process, it is a 256-bit value whose random collision with the pak key has probability `2^-256`, and it independently decrypts two paks (131,858 and 145,821 entries) whose indexes contain structurally valid mount points and entry tables.

## Capturing the pak AES key

The capture uses a hardware read watchpoint on the inverse AES T-table `Td0` and reads the key off the call frame at the trap.

1. The inverse AES T-table `Td0` (`Td0[0] = 0x51f4a750`) sits at virtual address `0x1725be0` in `.rodata`.
2. The disassembly references the AES tables at `0x1725a60`, `0x1725e60`, `0x1726260`, and `0x1726660`, which anchors the table region.
3. Running the server under `gdb` with a hardware read watchpoint on `0x1725be0` (`rwatch *(unsigned int*)0x1725be0`) traps the software AES decrypt routine at `rip=0x52acb5d` while the pak index is being decrypted.
4. At the trap, frame 1's `rbp` points directly at the 32 raw key bytes.

The depot ships a 32-bit `steamclient.so` stub at the install root and the real 64-bit library under `linux64/`, so link the 64-bit one into Steam's SDK path or the server will not start under `gdb`:

```sh
mkdir -p /home/coder/.steam/sdk64
ln -sf /tmp/soulmask-server/linux64/steamclient.so /home/coder/.steam/sdk64/steamclient.so
```

Create the capture working directory:

```sh
mkdir -p /tmp/verify
```

Run from the server install root with the engine library path set:

```sh
cd /tmp/soulmask-server
LD_LIBRARY_PATH=/tmp/soulmask-server/linux64 gdb -q -batch -x /tmp/verify/capture_key_min.gdb \
  /tmp/soulmask-server/WS/Binaries/Linux/WSServer-Linux-Shipping
```

The minimal gdb script `/tmp/verify/capture_key_min.gdb` is:

```
set pagination off
set confirm off
set breakpoint pending on
handle SIGSEGV nostop noprint pass
rwatch *(unsigned int*)0x1725be0
run WS Level01_Main -server -log -UTF8Output -MULTIHOME=0.0.0.0 -EchoPort=18888 -forcepassthrough -nullrhi
frame 1
printf "FAESKey at rbp=%p:\n", $rbp
x/32xb $rbp
quit
```

The output ends with the `FAESKey` bytes, for example:

```
FAESKey at rbp=0x7ffe1d39b1a0:
0x7ffe1d39b1a0:	0xc5	0x4d	0xb0	0xb4	0x9c	0xcc	0x34	0xde
0x7ffe1d39b1a8:	0x99	0xdf	0x9a	0x0b	0x9e	0x60	0x07	0x3f
0x7ffe1d39b1b0:	0x4c	0x88	0xd9	0xa1	0x22	0xaa	0x9b	0x2a
0x7ffe1d39b1b8:	0x5e	0x1e	0x76	0x67	0xe7	0xbb	0xa9	0x95
```

The observed 32-byte key is:

```
c54db0b49ccc34de99df9a0b9e60073f4c88d9a122aa9b2a5e1e7667e7bba995
```

> **The key is a secret.** Treat it exactly like a private signing key.
> Never ship it inside a mod, embed it in a pak, write it to a log that leaves your machine, commit it to a published artifact, or paste it into a public issue.
> Anything a mod ships can be downloaded and audited by anyone; the key must live only on the machine that extracted it.

The key is the loaded value, not a fixed artifact: re-running the capture reproduces the same bytes at a different stack address.
It is validated by the fact that `repak info` accepts it against both retail paks; a wrong key cannot produce a valid entry count.

## Installing the Linux dedicated server

The server is a free Steam tool and installs through SteamCMD anonymous login; no license prompt is needed.

| Property | Value |
| --- | --- |
| App id | `3017300` |
| Name | Soulmask Dedicated Server For Linux |
| Type | Tool (parent app `2646460`) |
| Launch executable | `WSServer.sh` |
| Windows server app id | `3017310` (related, not used) |
| Linux depot | `1006` (111,284,048 bytes), shares content from depot `1007` |
| Main depot | `3017301` (2,080,140,759 bytes) |
| Install size | about 2.2 GB |

```sh
curl -sSL -o steamcmd_linux.tar.gz https://steamcdn-a.akamaihd.net/client/installer/steamcmd_linux.tar.gz
tar xzf steamcmd_linux.tar.gz
./steamcmd.sh +force_install_dir /tmp/soulmask-server +login anonymous +app_update 3017300 validate +quit
```

On Debian the install requires `lib32gcc-s1` and `lib32stdc++6`.
The default install location is under the `Soulmask Dedicated Server For Linux` Steam library directory; the examples here use `/tmp/soulmask-server`.

## Decrypting, listing, and unpacking with repak

`repak` 0.2.3 (trumank) lists, unpacks, and packs classic UE paks and accepts the AES key through the global `-a`/`--aes-key` option, which must precede the subcommand.

Install the official Linux x86_64 release and verify the published checksum (`xz-utils` 5.8.1 is needed to extract the tarball):

```sh
curl -sL -o repak.tar.xz https://github.com/trumank/repak/releases/download/v0.2.3/repak_cli-x86_64-unknown-linux-gnu.tar.xz
tar xf repak.tar.xz
sudo install -m 0755 repak_cli-x86_64-unknown-linux-gnu/repak /usr/local/bin/repak
sha256sum repak.tar.xz   # 933bdb8e26f34e8fd70ea50201efca39df041de58aa83b1cd6eb83da124a2046
```

`/soulmask` is the retail Windows-client install root used here; the client pak lives under its `WS/Content/Paks/`.

### The repak copy and the Oodle runtime

`repak` fetches its Oodle runtime `liboo2corelinux64.so.9` beside its own executable on first use.
That self-fetch fails when `repak` lives in the read-only `/usr/local/bin`, so keep a writable copy with the Oodle library next to it.

```sh
mkdir -p /tmp/repak
cp /usr/local/bin/repak /tmp/repak/repak
curl -sSL -o /tmp/repak/liboo2corelinux64.so.9 \
  https://github.com/WorkingRobot/OodleUE/raw/refs/heads/main/Engine/Source/Programs/Shared/EpicGames.Oodle/Sdk/2.9.10/linux/lib/liboo2corelinux64.so.9
```

The Oodle runtime SHA-256 is `ed7e98f70be1254a80644efd3ae442ff61f854a2fe9debb0b978b95289884e9c`.
The `repak` copy is byte-identical to `/usr/local/bin/repak`, SHA-256 `fce30661c951ce56fd2507a44a1e03637e3ea06a1b7cc8035bd62c0b37dd9457`.

### info and list

Set `KEY` to the recovered key and run `info` against each pak.
Reproducing the two `info` entry counts is the authoritative correctness test.

```sh
KEY=<recovered-32-byte-key>
/tmp/repak/repak -a "$KEY" info /tmp/soulmask-server/WS/Content/Paks/WS-LinuxServer.pak   # 131858 file entries
/tmp/repak/repak -a "$KEY" info /soulmask/WS/Content/Paks/WS-WindowsNoEditor.pak           # 145821 file entries
/tmp/repak/repak -a "$KEY" list /soulmask/WS/Content/Paks/WS-WindowsNoEditor.pak > /tmp/verify/client_listing.txt
```

### Full server extraction versus focused client extraction

The server pak is small enough to unpack in full and is the convenient gameplay mirror; the client pak carries the full content set and is the authority for any asset that differs.

```sh
/tmp/repak/repak -a "$KEY" unpack -o /tmp/soulmask-server/extracted \
  /tmp/soulmask-server/WS/Content/Paks/WS-LinuxServer.pak
```

The full server extraction is 131,858 files, 6.3 GB.
For the client, extract a focused set by repeating `-i` with the paths of interest rather than the whole 18.6 GiB pak:

```sh
/tmp/repak/repak -a "$KEY" unpack -o /tmp/soulmask-client/extracted \
  -i "WS/Content/Blueprints/DataTable/NaturalGift/" \
  -i "WS/Content/Blueprints/DataTable/Proficiency/" \
  -i "WS/Content/Blueprints/ZiYuanGuanLi/" \
  -i "WS/Content/Data/DataTables/" \
  -i "WS/Content/Blueprints/AI/Ren/BP_BuLuo_Base.uasset" \
  -i "WS/Content/Blueprints/AI/Ren/BP_BuLuo_Base.uexp" \
  -i "WS/Content/Blueprints/AI/Ren/BP_BuLuo_Nv_Base.uasset" \
  -i "WS/Content/Blueprints/AI/Ren/BP_BuLuo_Nv_Base.uexp" \
  -i "WS/Content/Blueprints/ShuaGuaiQi/SGQ_BuLuo/BP_SGQ_BuLuo_Base.uasset" \
  -i "WS/Content/Blueprints/ShuaGuaiQi/SGQ_BuLuo/BP_SGQ_BuLuo_Base.uexp" \
  /soulmask/WS/Content/Paks/WS-WindowsNoEditor.pak
```

The focused client extraction produces 414 files, 25 MB, at `/tmp/soulmask-client/extracted`.
The extracted tree mirrors the retail internal layout and keeps the `WS/Content/...` paths, for example `WS/Content/Blueprints/DataTable/NaturalGift/DT_GiftZongBiao.uasset` and its sibling `.uexp`.

| Metric | Server pak | Client pak |
| --- | --- | --- |
| Entries | 131,858 | 145,821 |
| `.uasset` | 63,429 | 63,889 |
| `.uexp` | 63,936 | 64,407 |
| `.ubulk` | 0 | 7,938 |
| `.umap` | 507 | 518 |
| `.wem` (audio) | 0 | 3,859 |
| `.bnk` (audio) | 0 | 1,193 |
| Extracted size | 6.3 GB | not extracted in full |

The server pak contains the full cooked gameplay asset set minus bulk and audio payloads, which is sufficient for data, Blueprint, and world inspection.

## Pak internals

Soulmask ships classic UE 4.27 `.pak` containers, not IoStore `.utoc`/`.ucas`.

| Property | Server pak | Client pak |
| --- | --- | --- |
| Path | `WS/Content/Paks/WS-LinuxServer.pak` | `WS/Content/Paks/WS-WindowsNoEditor.pak` |
| Size (bytes) | 1,787,008,743 | 19,938,369,222 (about 18.6 GiB) |
| Signature file | `WS-LinuxServer.sig` (109,600 bytes) | `WS-WindowsNoEditor.sig` (1,217,472 bytes) |
| Version | `V11` | `V11` |
| Version major | `Fnv64BugFix` | `Fnv64BugFix` |
| Mount point | `../../../` | `../../../` |
| Encrypted index | yes | yes |
| Encryption GUID | `Some(00000000000000000000000000000000)` | all zeros |
| Compression | `Oodle ,Zlib` | `Zlib ,Oodle` |
| Entries | 131,858 | 145,821 |

The mount point is `../../../`, not `../../../WS/`, and the decrypted index begins with the `FString` mount point.
Both paks carry an all-zero encryption GUID and a V11 `FPakInfo` footer whose `footerBytesAfterMagic` is `204`, matching a V11 footer without serialized encryption fields.
The client pak's index offset is `19,927,101,993`, index size `3,915,344` bytes, and index hash `e124a2c10f96fc0c32b7625986bd214616a20087`.
The raw footer can be dumped and parsed against the UE4 `FPakInfo` layout with:

```sh
tail -c 221 "$PAK" | od -A d -t x1
```

Compression is per-entry and can be either Zlib or Oodle; that is why the Oodle runtime must be available beside `repak`.
The V11 `Fnv64BugFix` version also implies a path hash seed, reported by `repak` as `Some(63419044)`.

## Server and client parity

Twelve key target assets were compared by hashing the concatenated `.uasset` plus `.uexp`.
Nine are byte-identical and three differ.

| Asset | Server vs client |
| --- | --- |
| `DT_GiftZhengMian` | identical |
| `DT_GiftFuMiann` | identical |
| `DT_ProficiencyConfig_Dao` | identical |
| `DT_Prof_ZhiYe_ZongJiang` | identical |
| `DT_ZhuanJingSLD` | identical |
| `DT_FaXing` | identical |
| `DT_WenShenTable` | identical |
| `BP_SGQ_BuLuo_Base` | identical |
| `DT_SpecializedSkill` | identical |
| `DT_GiftZongBiao` | differ |
| `BP_ZiYuanGuanLiQi` | differ |
| `BP_BuLuo_Base` | differ |

For `DT_GiftZongBiao` the difference is understood: the client `.uasset` `NameMap` has 3,499 names and the server has 3,498, the client carrying one extra client-only reference named `HGEUIDataBuffXinXi`.
The row count (1,319) and every row name are identical, so the gameplay table is structurally the same, but the payload bytes differ from the shifted name indices and the differing build.
The same client-side extra-name pattern is the likely cause for the two Blueprints.

Use the retail **client** pak as the authoritative source for any asset that differs, because it is the build players run and it carries the full content set (145,821 entries including `.ubulk` and audio).
Use the **server** extraction as a convenient, complete gameplay mirror: it is already fully unpacked, it is 6.3 GB instead of 18.6 GiB, and for nine of twelve sampled assets it is byte-identical.

## Still not extracted and watch items

- The remainder of the 18.6 GiB retail client pak: only the 414-file focused set has been unpacked.
- Client `.ubulk` payloads (7,938 files) and audio (`.wem` 3,859, `.bnk` 1,193).
- Whether the key changes on a future game build; key rotation is a watch item, and every capture should be re-validated against `repak info` before reuse.
- Whether a `UAssetAPI`-reserialized retail cooked DataTable remains loadable by the shipping game; structural validity and byte-minimal diffs are proven, but no in-client load has been observed.

## Reproduction summary

```sh
# 1. install the Linux dedicated server (app 3017300)
curl -sSL -o steamcmd_linux.tar.gz https://steamcdn-a.akamaihd.net/client/installer/steamcmd_linux.tar.gz
tar xzf steamcmd_linux.tar.gz
./steamcmd.sh +force_install_dir /tmp/soulmask-server +login anonymous +app_update 3017300 validate +quit

# 2. link the 64-bit steamclient so the server starts under gdb
mkdir -p /home/coder/.steam/sdk64
ln -sf /tmp/soulmask-server/linux64/steamclient.so /home/coder/.steam/sdk64/steamclient.so

# 3. create the capture directory and capture the AES key with the gdb watchpoint script (see "Capturing the pak AES key")
mkdir -p /tmp/verify

# 4. install repak, then set up a writable copy and the Oodle runtime
curl -sL -o repak.tar.xz https://github.com/trumank/repak/releases/download/v0.2.3/repak_cli-x86_64-unknown-linux-gnu.tar.xz
tar xf repak.tar.xz
sudo install -m 0755 repak_cli-x86_64-unknown-linux-gnu/repak /usr/local/bin/repak
mkdir -p /tmp/repak
cp /usr/local/bin/repak /tmp/repak/repak
curl -sSL -o /tmp/repak/liboo2corelinux64.so.9 \
  https://github.com/WorkingRobot/OodleUE/raw/refs/heads/main/Engine/Source/Programs/Shared/EpicGames.Oodle/Sdk/2.9.10/linux/lib/liboo2corelinux64.so.9

# 5. validate the key, list, and unpack
KEY=<recovered-32-byte-key>
/tmp/repak/repak -a "$KEY" info /tmp/soulmask-server/WS/Content/Paks/WS-LinuxServer.pak
/tmp/repak/repak -a "$KEY" info /soulmask/WS/Content/Paks/WS-WindowsNoEditor.pak
/tmp/repak/repak -a "$KEY" list /soulmask/WS/Content/Paks/WS-WindowsNoEditor.pak
/tmp/repak/repak -a "$KEY" unpack -o /tmp/soulmask-server/extracted \
  /tmp/soulmask-server/WS/Content/Paks/WS-LinuxServer.pak

# 6. focused client extraction for the assets that differ from the server
/tmp/repak/repak -a "$KEY" unpack -o /tmp/soulmask-client/extracted \
  -i "WS/Content/Blueprints/DataTable/NaturalGift/" \
  -i "WS/Content/Blueprints/DataTable/Proficiency/" \
  -i "WS/Content/Blueprints/ZiYuanGuanLi/" \
  -i "WS/Content/Data/DataTables/" \
  -i "WS/Content/Blueprints/AI/Ren/BP_BuLuo_Base.uasset" \
  -i "WS/Content/Blueprints/AI/Ren/BP_BuLuo_Base.uexp" \
  -i "WS/Content/Blueprints/ShuaGuaiQi/SGQ_BuLuo/BP_SGQ_BuLuo_Base.uasset" \
  -i "WS/Content/Blueprints/ShuaGuaiQi/SGQ_BuLuo/BP_SGQ_BuLuo_Base.uexp" \
  /soulmask/WS/Content/Paks/WS-WindowsNoEditor.pak
```

## Foot-guns

- **The AES key is a secret.** Treat it like a private signing key; never ship it in a mod, embed it in a pak, log it off-machine, commit it to a published artifact, or paste it into a public issue.
- **Static scanning of the Windows client fails.** `WS-Win64-Shipping.exe` is Themida/WinLicense-packed (`.themida` and `.boot` sections; no Unreal strings survive), so an absence of key material in a client string dump proves nothing.
- **An ASCII `strings` search misses UTF-16 UE4 string literals.** Engine option names such as `fileopenlog` are stored as wide characters; use `strings -e l` and never conclude a feature is absent from an ASCII-only pass.
- **`repak` cannot self-fetch Oodle under the read-only `/usr/local/bin`.** Copy `repak` to a writable directory and place `liboo2corelinux64.so.9` beside it, or extraction of Oodle-compressed entries fails.
- **A wrong key has a distinct error signature.** Without a key the error is `pak is encrypted but no key was provided` (or `version unsupported or is encrypted (possibly missing --aes-key?)`); with an arbitrary wrong key it becomes `V11 failed: io error: failed to fill whole buffer`. A valid key instead yields an entry count.
- **Key rotation is a watch item.** If a future build re-keys the paks, the captured key stops decrypting and the index error returns; re-run the capture and re-validate before trusting a cached key.
- **`repak`'s `-a`/`--aes-key` option is global.** It must precede the subcommand, or it is parsed as an argument to the subcommand.
- **Do not trust the server copy for a differing asset.** `DT_GiftZongBiao`, `BP_ZiYuanGuanLiQi`, and `BP_BuLuo_Base` differ between the server and client paks; extract the client copy.

## Related documents

- [`asset-analysis.md`](asset-analysis.md) — what the extracted DataTables and Blueprints contain.
- [`native-binary-analysis.md`](native-binary-analysis.md) — the server binary symbols and native constants behind this method.
- [`../modding-guide/authoring-pipeline.md`](../modding-guide/authoring-pipeline.md) — editing extracted assets and repacking a `_P.pak`.
