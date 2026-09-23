# Console and Admin Commands

This is the authoritative reference for the Soulmask in-game console and admin command surface as a mod maker uses it: how to open the console, how privilege is granted, and every command that inspects or forces character, proficiency, talent, mastery, and recruit state.
It covers single-player and client-hosted worlds, a local Linux dedicated server, and remote administration over Telnet/RCON.
It also records the exact `Exec` command literals recovered from the shipping Linux dedicated-server binary and the corrections to the community spellings.
The commands here reach a recruitable tribesman for testing cap and talent behavior; the testing workflow itself is owned by `../modding-guide/testing.md`, and the underlying systems are owned by `proficiencies-and-caps.md`, `recruitment-and-spawns.md`, `talents.md`, and `weapon-mastery.md`.

Confidence labels used throughout:

| Label | Meaning |
| --- | --- |
| **native-literal** | The command name is an exact string in the shipping Linux dedicated-server binary. |
| **community** | Documented by community command databases but not confirmed as an exact binary literal. |
| **inferred** | Parameter type or order reconstructed from the argument space; the exact reflection signature was not recovered. |

## Opening the console

The retail Windows client ships the Unreal command console.
The engine `ConsoleKeys` input setting and `bShowConsoleOnFourFingerTap` exist in the shipping binary, and there is no `bAllowConsole`/`AllowConsole` gate string.
No `-console`, `-allowconsole`, or `-ExecCmds` literal exists in the binary, so no launch flag is required to enable it (**native-literal**).

Open it with the grave/tilde key (`` ` `` or `~`).
On some keyboard layouts the numpad minus (`-`) key works instead.
If neither works, switch the OS keyboard layout to English (UK/US); the failure is tied to layout, not to a disabled console (**community**).

The `gm` keyword routes a command to the native `UHCheatManager` (`_ZTV14UHCheatManager` is present in the server binary).
Most commands must be prefixed with `gm`; a few run without it but may execute on the client instead of the server (**native-literal**).

## Admin and privilege model

### Single-player or client-hosted world

1. Open the console with `~` (or numpad `-`).
2. Enter `gm key <password>`, choosing any password.
3. In the GM panel, type the same password and click "Become the Admin".
4. Close the panel; admin is retained for the session.
5. Reopen the console and enter commands with the `gm` prefix.

Single-player admin was added in the "Fantastic Chieftains" update.
If step 3 does nothing, add the Steam launch option `-adminpsw=\"<password>\"`, restart, and repeat steps 1–3 (**community**).
This is the primary path for a local test world.

### Local dedicated server

1. Start the server with `-adminpsw="<password>"` in the launch line (`StartServer.sh` forwards extra arguments to `WSServer-Linux-Shipping`).
2. In-game, open the console and run `gm key <password>`, then confirm in the GM panel.
3. The same `-adminpsw` is what the in-game `Key` command checks, so a self-hosted server is the most robust admin path.

### Remote administration without the client console

- Telnet binds to loopback only on the `-EchoPort` port (default 18888) and is reachable from the server host itself.
- RCON needs `-rconpsw=<password>`, `-rconport=<port>` (default 19000), and a whitelisted IP under `[Server.SafeIP]` in `WS/Saved/Config/LinuxServer/Engine.ini`.
- RCON runs the remote command set, not the full in-game `gm` set; the remote equivalents are listed under "Spawning and recruitment commands" and "Foot-guns".

## Command table

The command target matters: "self" is the controlled character, "target" is what the camera points at, and "selected" is set by the `gm Select` command.
Pass only the parameter values, not the parameter names.
The `gm` prefix is shown for in-game use; the bare name is the `Exec` literal.

### Admin, privilege, and utility

| Command | Arguments | Effect | Confidence |
| --- | --- | --- | --- |
| `gm key` | `<password>` | Grants admin privileges when the password matches the server password (or sets it in solo). | native-literal |
| `gm` | `<command>` | Runs a command as admin, on the server rather than the client. | native-literal |
| `gm ShowMap` | none | Unlocks the entire map. | native-literal |
| `gm GPS` | none | Prints the controlled character's coordinates. | native-literal |
| `gm Go` | `<X> <Y> <Z>` | Teleports the controlled character to world coordinates. | community |
| `gm GoF` | `<dis> <Z>` | Teleports forward a distance onto the highest surface. | native-literal |
| `gm GhostMode` | none | Toggles ghost mode (flight plus clipping). | native-literal |
| `gm FlyMode` | none | Toggles flight. | native-literal |
| `gm SetAttr` | `<Attr> <Value>` | Sets one attribute on the controlled character. | native-literal |
| `gm AddDaoJuByClass` | `<class> <params...>` | Spawns items into the inventory; the exact parameter order was not recovered. | native-literal |
| `gm AddGameWorldTime` | `<seconds>` | Advances the world clock by seconds. | native-literal |
| `gm Set24hTime` | `<HH:mm>` | Sets the world time of day. | native-literal |
| `gm SetTimePower` | `<value>` | Sets the day-length multiplier. | native-literal |
| `gm ClearAllNpc` | none | Removes all non-owned NPCs (they respawn shortly). | native-literal |

### Mask, awareness, and technology

| Command | Arguments | Effect | Confidence |
| --- | --- | --- | --- |
| `gm AddMJExp` | `<value>` | Adds mask/awareness experience to the player. | native-literal |
| `gm AddExp` | `<value>` | Adds character experience (character level and awareness). | native-literal |
| `gm JSMJ` | none | Unlocks all mask nodes whose mask-level requirement the player already meets. | native-literal |
| `gm UnLock_Techs` | none | Unlocks all technology/recipes regardless of tech points. | native-literal |
| `gm UnLockAllMaskAndParts` | none | Unlocks all masks and their parts. | native-literal |

### Character level, quality, and proficiency

| Command | Arguments | Effect | Confidence |
| --- | --- | --- | --- |
| `gm DengJi` | `<level>` | Sets the controlled character's level. | native-literal |
| `gm PinZhi` | `<0-5>` | Sets the controlled/target character's quality. | native-literal |
| `gm SLDDengJi` | `<ProfType> <level>` | Sets one proficiency's current value (never above its cap). | native-literal |
| `gm SLDDengJiAll` | `<level>` | Sets all proficiency current values. | native-literal |
| `gm SLDJingYan` | `<ProfType> <exp>` | Adds proficiency experience. | native-literal |
| `gm SetShuLianDuMaxVal` | `<LeiXing> <CurVal> <MaxVal>` | Sets current and max proficiency on the target; the max value does not always take. | native-literal |

`ProfType` in `SLDDengJi` and `SLDJingYan`, and `LeiXing` in `SetShuLianDuMaxVal`, are the `EProficiency` integer index listed under "The EProficiency index".
Parameter types and order are inferred; see "Foot-guns".

### Talents and mastery

| Command | Arguments | Effect | Confidence |
| --- | --- | --- | --- |
| `gm AddNG` | `<NGId> <bGood> <InLvl>` | Adds a natural gift to the selected character. | native-literal |
| `gm RemoveNG` | `<NGId> <bGood>` | Removes a natural gift from the selected character. | native-literal |
| `gm ClearNG` | none | Removes all natural gifts from the selected character. | native-literal |
| `gm AddZJ` | `<index>` | Sets one weapon mastery ability. | native-literal |
| `gm RefreshZJ` | none | Unlocks all masteries the character's proficiency permits. | native-literal |

`NGId` is a row id in the 1319-row `DT_GiftZongBiao` natural-gift table; `AddZJ` indices span 88 abilities across the nine weapons (the recovered id space is 101–999); see `talents.md` and `weapon-mastery.md`.

### Recruitment and spawning

| Command | Arguments | Effect | Confidence |
| --- | --- | --- | --- |
| `gm ZhaoMu` | none | Instantly recruits the targeted human NPC into the clan. | native-literal |
| `gm ZhuaBu` | none | Instantly deters (knocks out) the targeted human NPC. | native-literal |
| `gm Select` | none | Selects the targeted character for commands that use "selected". | native-literal |
| `gm ClearSelect` | none | Clears the selected character. | native-literal |
| `gm CreateSpecifiedMan` | `<CreateNo> <Sex>` | Spawns a preconfigured tribesman as a clan member; `Sex` 0 male, 1 female. | native-literal |
| `gm CreateSWByClass` | `<SWClass> <isBaby> <DengJi> <bGuiShu> <Num> <PinZhi> <Uid>` | Spawns NPCs in front of the player with chosen class, level, ownership, count, and quality. | native-literal |
| `gm ChaZhaoSCGWeiZhi` | `<SWClass>` | Marks all wild NPCs of a class on the map. | native-literal |
| `gm FindSCGLoc` | `<NGIndex> <PinZ>` | Marks wild NPCs with a gift and minimum quality on the map. | native-literal |
| `gm Find120` | `<NGIndex> <Lv> <PinZ>` | Variant locator (documented as broken since `Lv` was added). | native-literal (name); community (behavior) |
| `gm TameDongWu` | none | Tames the targeted animal. | native-literal |

## Corrected command names and verified Exec literals

Several spellings circulating in older sources are wrong; the direct binary evidence wins:

- `AddNG` and `RemoveNG` are the shipped literals; `AddNg`/`RemoveNg` are misspellings.
- `UnLock_Techs` is the technology command; `KeJiShu` is **not** a command, despite being listed by some community sources and older notes.
- `WanMeiChongSu` and `ZuRenFuZhi` are **not** console commands; both are `GameXishu` server-config toggles, shipped as `1`, that govern perfect remodel (deep copy) and tribesman duplication.
- `MaxLevel` is likewise a `GameXishu` setting, not a native command.

The following names are literal `Exec` command strings in the shipping Linux dedicated-server binary (`WSServer-Linux-Shipping`).
The string virtual addresses and argument spaces are recovered from the binary; the parameter types are inferred.

| Literal | String vaddr | Argument space | Verified notes |
| --- | --- | --- | --- |
| `SLDDengJi` | `0xc4ebda` | `EProficiency` type + level | Set one proficiency value. |
| `SLDDengJiAll` | `0xc859d8` | level | Set all proficiency values. |
| `SLDJingYan` | `0xc782b4` | `EProficiency` + exp | Add proficiency experience. |
| `SetShuLianDuMaxVal` | `0xc782a1` | `EProficiency` + cap | Set one proficiency cap at runtime. |
| `AddNG` | `0xc5d05d` | natural-gift id | Add a talent; community syntax adds `bGood` and `InLvl`. |
| `RemoveNG` | `0xb08262` | natural-gift id | Remove a talent; community syntax adds `bGood`. |
| `AddZJ` | `0xb4ea80` | mastery ability index | Set a mastery ability. |
| `ClearNG` | `0xb4ea86` | none | Clear all talents. |
| `RefreshZJ` | `0xca2a98` | none | Recompute mastery. |
| `JSMJ` | `0xbdd604` | none | Unlock all mask nodes. |
| `UnLock_Techs` | `0xca2ab6` | none | Unlock all technologies. |

## The EProficiency index

`EProficiency` has 31 members (0–30), and the runtime per-proficiency array `FProficiencyData` carries one record per member.
`SLDDengJi` and `SLDJingYan` take this integer index as their first argument; `SetShuLianDuMaxVal` takes the same index as `LeiXing`.
The packed native array order is authoritative for the index; the community `ProfType` list matches it for every proficiency it names.

| Index | Enum | Display label |
| --- | --- | --- |
| 0 | `FaMu` | Logging |
| 1 | `CaiKuang` | Mining |
| 2 | `ZhongZhi` | Plant |
| 3 | `BuZhuo` | Trapping |
| 4 | `CaiShou` | Collect / Harvest |
| 5 | `YangZhi` | Breeding |
| 6 | `TuZai` | Butchering |
| 7 | `PaoMu` | Woodworking (Wood & Stone) |
| 8 | `QieShi` | Stonecutting |
| 9 | `RongLian` | Smelting |
| 10 | `RouPi` | Leatherworking |
| 11 | `FangZhi` | Weaving |
| 12 | `ZhiTao` | Potting |
| 13 | `YanMo` | Grinding |
| 14 | `QiJu` | Craftsman (Tools) |
| 15 | `WuQi` | Weapon Crafting |
| 16 | `JiaZhou` | Armor Crafting |
| 17 | `ZhuBao` | Jewelcrafting |
| 18 | `JianZhu` | Construction |
| 19 | `LianJin` | Alchemy |
| 20 | `PengRen` | Cooking |
| 21 | `Dao` | Single Blade |
| 22 | `ShuangDao` | Dual-blade |
| 23 | `Mao` | Spear |
| 24 | `Chui` | Hammer |
| 25 | `QuanTao` | Gauntlets |
| 26 | `Gong` | Bow |
| 27 | `DaJian` | Great Sword |
| 28 | `PouJie` | Dissecting |
| 29 | `DunPai` | Shield |
| 30 | `Bian` | Spiked Whip |

The per-level benefit and cap arithmetic that these values feed are documented in `proficiencies-and-caps.md`.

## Spawning and recruitment commands

The normal gate to recruiting is the early-dungeon quest: repair the Mask's `[族人招募]` (Tribesmen Recruitment) ability at the Mysterious Stone Table with the recipe `BP_PeiFang_YiJiMianJuXiuFu_000`.
The console routes below bypass that grind; `tech-tree.md` covers the mask-node side.

### `CreateSpecifiedMan` fixed presets

`gm CreateSpecifiedMan <CreateNo> <Sex>` spawns a fixed, preconfigured quality-5 Master tribesman directly into the clan.
This is the fastest route, but the body is predefined, so its proficiencies and caps are not a fresh native cap roll and must not be used to verify cap generation.

| CreateNo | Name | Tribe | Quality | Rank | Notable guaranteed data | Level band |
| --- | --- | --- | --- | --- | --- | --- |
| 0 | Flint Tribe Barbarian | Flint | 5 | Master | Armor Crafting 99/120; Refined Armor III | 46–50 |
| 1 | Flint Tribe Barbarian | Flint | 5 | Master | Weapon Crafting 90/120; Weapon Enhancement III | 46–50 |
| 2 | Claw Tribe Barbarian | Claw | 5 | Master | Spear 90/120, Dual-blade 91/122, Blade 90/121 | 6–10 |
| 3 | Claw Tribe Barbarian | Claw | 5 | Master | Hammer 90/120, Great Sword 90/122 | 6–10 |
| 4 | Flint Tribe Barbarian | Flint | 5 | Master | random other than the above | 11–20 |
| 5 | Fang Tribe Barbarian | Fang | 5 | Master | random | 31–40 |
| 6 | Claw Tribe Barbarian | Claw | 5 | Master | random | 46–50 |
| 7 | Savagehorn Tribe Barbarian | Savagehorn | 5 | Master | random | 46–50 |
| 8 | Savagehorn Tribe Barbarian | Savagehorn | 5 | Master | random | 11–20 |

### `CreateSWByClass` parameters

`gm CreateSWByClass <SWClass> <isBaby> <DengJi> <bGuiShu> <Num> <PinZhi> <Uid>`

| Argument | Meaning |
| --- | --- |
| `SWClass` | NPC blueprint name, for example `BP_BuLuo_Base_C` (barbarian base), `BP_BuLuo_Nv_Base_C`, `BP_BuLuo_JingYing_Base_C`, or an animal class. |
| `isBaby` | 0 adult, 1 baby. |
| `DengJi` | Spawn level; recruitable barbarians top out at 50. |
| `bGuiShu` | 0 wild, 1 owned by the player. |
| `Num` | Number of copies. |
| `PinZhi` | Quality 0–5. |
| `Uid` | 32 zeroes. |

Example:

```text
gm CreateSWByClass BP_BuLuo_Base_C 0 50 0 1 5 00000000000000000000000000000000
```

This spawns one wild, level-50, quality-5 barbarian in front of the player.
Then look at it and run `gm ZhaoMu` to recruit it, or set `bGuiShu=1` to own it directly.
Command-spawned humans do not receive natural gifts, so this route is suitable for testing the cap formula but not for testing quality-gift grants.

### Controlled recruit spawning routes

- **Route A — preconfigured tribesman, owned immediately.** `gm CreateSpecifiedMan <CreateNo> <Sex>` per the table above.
- **Route B — controlled class, level, and quality.** `gm CreateSWByClass` per the parameter table above; use a natural spawn if the probe depends on gifts or talents.
- **Route C — recruit a naturally spawned barbarian.** `gm ChaZhaoSCGWeiZhi BP_BuLuo_Base_C` marks all wild barbarians on the map, travel or `gm Go`/`gm GoF` to a marked camp, then look at a barbarian and run `gm ZhuaBu` (deter) then `gm ZhaoMu` (recruit). This preserves natural generation (talents and gifts) and is the correct control for gift probes.

### Remote spawn equivalents

Over Telnet/RCON the same spawns are available:

| Remote command | Arguments | Effect |
| --- | --- | --- |
| `22cnpc` | `<SteamID> <CreateNo> <Sex>` | Preconfigured owned tribesman. |
| `23create` | `<SteamID> <CreatureClass> <isBaby> <DengJi> <Num> <PinZhi>` | Owned NPC of chosen class/level/quality. |
| `20go` | `<SteamID> <X> <Y> <Z>` | Teleport a player. |
| `19lcc` | `<substring>` | List matching NPC class names. |
| `38run` | `<ScriptFileName>` | Run all commands in a text file placed in the server's `WS/Saved` directory. |
| `24fly` | `<player> <0/1>` | Remote flight toggle. |
| `39can` | none | Remote `ClearAllNpc`. |

## World setup, presets, and maps

The fast-test workflow that reaches a fresh recruitable tribesman — starting a world, becoming admin, clearing progression gates, and generating a recruit — is owned by `../modding-guide/testing.md`; this reference keeps the command surface that workflow calls.
The `GameXishu` world coefficients it sets are owned by `server-config.md`, whose focus-key and Linux-lever tables hold the keys, ranges, and per-preset values, including the `InitialDefaultAwarenessLevel` and `CurProfInitRatio` semantics.

All presets share the same 282 `GameXishu` keys.
The five full families are `Template` (whose `ECustomGameMode` enum is `Survival`), `_Action` (Warrior), `_Creative` (Creative), `_Management` (Tribe), and `_PVP`; the game exposes `ECustomGameMode::{Survival, Creative, Action, Management, PVP}`.
Each `ECustomGameMode` loads its own coefficient manager through `BP_CustomGameModeManager.GameXiShuGuanLiQiClassMap`: `Survival` uses the base `BP_GameXiShu_GuanLiQi`, `Management` uses `BP_GameXiShu_GuanLiQi_Management`, and `Action`, `Creative`, and `PVP` use their `_Action`, `_Creative`, and `_PVP` siblings.
Each sibling serializes its own `GameXiShuMap` and `GameXiShuConfigMap`, so a map key present in only one mode's manager is shadowed in the others and `BP_GetGameXiShuBothUse` returns its `1.0` fallback there.

### Maps

The playable maps are `Level01_Main` (Cloud Mist Forest) and `DLC_Level01_Main` (Shifting Sands, the `AdditionMap01` content).
`ZhanChang01` is the battlefield and `StartMenu`/`DemoMap` are not gameplay worlds.
There is no shipped debug or test map to load; a normal new world is required.

### Starting-awareness shortcut

`InitialDefaultAwarenessLevel` is the single strongest world-setup lever: setting it to 60 in a new world starts the player at the maximum awareness strength, so `gm JSMJ` can then unlock the whole mask tree without leveling.
It is **native-literal** that the key exists and is settable; it is **inferred** whether awareness 60 alone satisfies every mask gate.

## Verification and fallbacks

### Verify the command literals

```sh
SERVER_ROOT=/path/to/soulmask
BIN="$SERVER_ROOT/WS/Binaries/Linux/WSServer-Linux-Shipping"
for c in AddExp DengJi PinZhi SLDDengJi SLDDengJiAll SLDJingYan SetShuLianDuMaxVal \
         AddNG RemoveNG ClearNG AddZJ RefreshZJ JSMJ UnLock_Techs \
         UnLockAllMaskAndParts CreateSpecifiedMan CreateSWByClass ZhaoMu ZhuaBu \
         ChaZhaoSCGWeiZhi FindSCGLoc GhostMode FlyMode SetAttr AddDaoJuByClass; do
  printf '%-24s %s\n' "$c" "$(strings -n 3 "$BIN" | grep -cx -- "$c")"
done
```

A result of `1` means the name is an exact literal; `0` means it was not found as an exact string.

Verify the console and cheat-manager surface:

```sh
strings -n 4 "$BIN" | grep -xE 'ConsoleKey|ConsoleKeys|bShowConsoleOnFourFingerTap'
strings -n 6 "$BIN" | grep -E '_ZTV14UHCheatManager|CheatClass|CheatManagerExtensions'
strings -n 5 "$BIN" | grep -E 'ECustomGameMode::(Survival|Creative|Action|Management|PVP)'
strings -n 5 "$BIN" | grep -E 'SpecifiedTribeMan|Create_SpecifiedMan|CreateSpecifiedMan_ByConfig'
```

Verify the preset values and the Creative-mode localization:

```sh
cd /soulmask/WS/Config/GameplaySettings
bun -e 'const fs=require("fs");for(const f of ["GameXishu_Template.json","GameXishu_Template_Creative.json"]){const o=JSON.parse(fs.readFileSync(f,"utf8"));console.log(f,o["1"].InitialDefaultAwarenessLevel,o["1"].AddRenKeDuRatio,o["1"].OpenEscMenuInfJianZao,o["1"].MaxLevel)}'
grep -aB3 -A1 'msgid "创造者菜单"' /path/to/extracted/Game_en.po
```

### Fallbacks when the client console is unavailable

- **Local Linux dedicated server with Telnet.** Start `StartServer.sh` (adds `-server`, `-EchoPort=18888`), connect `telnet 127.0.0.1 18888` from the host, and run the remote commands.
- **RCON.** Add `-rconpsw=<password> -rconport=19000` and whitelist your IP in `WS/Saved/Config/LinuxServer/Engine.ini` under `[Server.SafeIP]`, then use any RCON client.
- **Scripted batch.** RCON/Telnet `38run <ScriptFileName>` runs all commands listed in a text file placed in the server's `WS/Saved` directory, which is convenient for repeating a spawn sequence.
- **Config-only.** With no console at all, the reachable levers are the world coefficients (`InitialDefaultAwarenessLevel`, `AddRenKeDuRatio`, `GeRenMaxZhaoMuCount`, `ManRenChuZhanCount`, `ShuLianDuExpRatio`, `ExpRatio`, `CurProfInitRatio`) and loading a naturally generated camp recruit by hand.

The end-to-end mod verification flow that mounts a `_P.pak` and exercises these commands is in `../modding-guide/testing.md`.

## Foot-guns

- **Parameter order is not verified.** The exact reflection signatures of the `Exec` commands were not recovered statically, because the `exec` thunks are not exported and their `FName` parameters live in runtime-constructed reflection objects.
  The argument spaces come from the binary and community documentation, and the parameter types (`FIntProperty`/`FByteProperty` order) are inferred; confirm a command empirically before depending on it.
- **Remote console is a different command set.** Telnet/RCON runs the remote commands (`22cnpc`, `23create`, `20go`, `19lcc`, `38run`, `24fly`, `39can`), not the full in-game `gm` set.
  `CreateSpecifiedMan_ByConfig <InOpPlayer> <Key>` exists but its accepted config keys are unknown.
- **Some commands need admin.** Commands run without the `gm` prefix may execute on the client instead of the server; use `gm` and hold admin for reliable server-side effects.
- **`gm Go` is community-only.** It is listed by community sources but was not found as an exact literal in the shipping Linux server binary; the remote teleport is `GotoPostion` over RCON.
- **`gm ZhaoMu` behavior is unverified.** Whether it works before the Mask's `[族人招募]` ability is repaired at the Mysterious Stone Table, or bypasses the ability check, is unresolved.
- **`gm JSMJ` scope is unclear.** Whether it unlocks the `[族人招募]` repair ability is unverified; that ability appears in `String_Mask_XiuFu_Table` and the recipe `BP_PeiFang_YiJiMianJuXiuFu_000`, not in the parsed tech tree.
- **Command-spawned humans miss natural gifts.** `CreateSWByClass` and `CreateSpecifiedMan` produce bodies without the natural gifts a naturally spawned recruit receives, so gift/talent probes must use a natural spawn (Route C).
- **`CreateSpecifiedMan` bodies are predefined.** They are not a fresh native cap roll, so they cannot be used to verify cap generation.
- **The console is keyboard-layout-sensitive.** If `~`/`` ` `` does not open it, try numpad `-` or switch the OS layout to English (UK/US).
- **`-adminpsw` escaping varies.** Community reports give both `-adminpsw=<password>` and the escaped `-adminpsw=\"<password>\"` form; whether the launch option is still needed in the current build conflicts across updates.
- **Some max-value sets do not take.** `SetShuLianDuMaxVal` reliably sets the current value but the max value does not always stick.

## Related references

- `proficiencies-and-caps.md` — the 31 proficiencies, per-level tables, and the cap formula.
- `recruitment-and-spawns.md` — spawner assets, rank→quality→cap chain, and recruitable roles.
- `talents.md` and `weapon-mastery.md` — natural gifts and mastery abilities behind `AddNG`/`AddZJ`.
- `tech-tree.md` — the mask tree unlocked by `JSMJ` and the tech tree unlocked by `UnLock_Techs`.
- `training-ground-and-transfer.md` — the Training Ground mechanics that `TrainingExpRatio` scales.
- `../modding-guide/testing.md` — mounting a mod pak and verifying it against a running world.
