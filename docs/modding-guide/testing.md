# Testing a Mod in Game

This guide is about confirming that a mod or change actually took effect in a running Soulmask world: that the `_P.pak` mounts and that the game serves the overridden data at runtime.
It covers the two testing channels, how to reach a controllable recruit quickly, how to check a specific change, and the caveats that make a check read as a false negative.
The console command surface that reaches a recruitable recruit is owned by [`../game-reference/console-commands.md`](../game-reference/console-commands.md); this guide references it instead of repeating its tables.
The technique of using probes to answer an unknown research question belongs to [`../reverse-engineering/probe-methodology.md`](../reverse-engineering/probe-methodology.md); this guide confirms a change you already understand.
The pak mechanics and the mount procedure are in [`packaging-and-loading.md`](packaging-and-loading.md), and the asset edit workflow is in [`authoring-pipeline.md`](authoring-pipeline.md).
For the full pass/fail script against the shipped design, work through [`../../final-mod-verification-checklist.md`](../../final-mod-verification-checklist.md).

## The testing goal

The single most valuable unobserved step in the pipeline is confirming that a `_P.pak` mounts and that its overridden data is actually served at runtime.
A byte-identical `UAssetAPI` round-trip and a clean re-parse prove the edited asset is structurally valid, but they do not prove the shipping game reads it.
Closing that gap needs two separate observations: the engine logs the mount, and the in-game UI or a fresh spawn reflects the overridden value.

Treat those as two questions with separate evidence.
The mount question is answered from a log line.
The read question is answered from a character panel, a tooltip, or a spawn, and only a fresh subject answers it because the relevant values are stored on the character at generation.

## Fast test setup

The goal is a fresh, controllable recruit of a chosen class, level, and quality in a new world without grinding the early progression.
The command-by-command recipe, with confidence labels, is owned by [`../game-reference/console-commands.md`](../game-reference/console-commands.md): it covers the console key, the admin gate, the class- and preset-spawn commands, the deterministic level/quality/talent/mastery controls, and the Telnet and RCON equivalents.
Use a naturally spawned recruit for any gift or talent check, because command-spawned humans do not receive natural gifts.

## Testing channels

There is no single channel that observes everything, because the proficiency values are drawn in the UI and the mount is drawn in the log.

| Channel | Launch | Can observe | Cannot observe |
| --- | --- | --- | --- |
| Linux dedicated server (headless) | `-nullrhi -fileopenlog` | pak mount and priority from `WS/Saved/Logs/WS.log`; server-side spawn and state effects | any panel, tooltip, or localized text, because there is no renderer or client UI |
| Windows retail client | `-fileopenlog` in Steam Launch Options | proficiency page values, talent list, mastery track, roster tooltip, quality icon, defect list, localized text | nothing beyond what a normal client shows; the client binary is Themida-packed so it offers no extra introspection |
| Client joined to a local server | both | client UI reads against server-side state | the same limits as the client alone |

### Linux dedicated server

The server proves the mount.
Launch through `WSServer.sh` with `-nullrhi -fileopenlog`:

```sh
./WSServer.sh Level01_Main -server -log -UTF8Output -MULTIHOME=0.0.0.0 -EchoPort=18888 -forcepassthrough -nullrhi -fileopenlog
```

A successful mount appears in `WS/Saved/Logs/WS.log` (or the server output) as:

```text
LogPakFile: Display: Mounting pak file ../../../WS/Content/Paks/<Name>_P.pak.
LogShaderLibrary: Display: PakFile '../../../WS/Content/Paks/<Name>_P.pak' (chunk index -1, root '../../../') mounted
```

A missing signature looks like `Couldn't find pak signature file`, `Unable to create pak ... handle`, and `Failed to mount ... pak is invalid`, which means `-fileopenlog` is not active.
`-nullrhi` removes the renderer so the server starts without a GPU, and it also removes any possibility of reading a client panel.
A mount proves the pak is structurally valid and prioritized; it does not prove the game read the overridden row.

### Windows client

The client proves the read.
Add `-fileopenlog` in Steam under **Properties → Launch Options**, launch, and start or load a private session.
The client log is under `%LOCALAPPDATA%\WS\Saved\Logs\WS.log` (or beside the install); the same mount lines appear there.
Client acceptance of `-fileopenlog` is community-reported, because the client executable is Themida-packed and no engine string survives a static scan.

## Verifying a specific change

Run one check at a time against a freshly generated subject.
For every check, record the recruit's level and quality (the potential-icon border colour) before opening any panel, and name the class explicitly, because every cap and class-talent check is per class.
The concrete expected value and failure signature for each system are the acceptance checklist at [`../../final-mod-verification-checklist.md`](../../final-mod-verification-checklist.md); [`../mod-status.md`](../mod-status.md) is authoritative for the current build status and open items.

### Proficiency caps

Read the maximum of a class skill and a non-class skill on a fresh recruit's Proficiency page.
The cap is composed at recruitment from the `BP_ProficiencyConfig` constants (`ProfInitMaxLvlMin`, `ProfInitMaxLvlMax`, `ProfMaxLvlLowerLimit`, `ProfMaxLvlUpperLimit`) plus the class addend in `DT_Prof_ZhiYe_*`, then fixed for the character's life, so a fresh recruit is required per read.
An override that forces all four constants to one value produces a uniform cap across every skill; the shipped game scatters `50–150`.

### Starting proficiency

Read a fresh recruit's current proficiency values at its generated level.
The value is the `JueSeLvlProfLvlList` level-to-current curve plus the class addend in `SLD_ChuShiLv_*`; the clan-rank addends in `ClanDiWeiProfInitLvlMap` are zeroed, so raising clan rank must not move the values.
Starting values live in `FProficiencyData` and are written once by the starting-value initializer; an existing tribesman keeps its stored value forever.

### Talent list

Open the talent list of a fresh recruit.
The Origin, Battle-Tested Experience, tribal, and qualifying class talents are assembled by the edits to `DT_GiftZongBiao`, `BP_ManRenRandomConfig`, `DT_GiftZhengMian`, `DT_PinZhiGoodNGStarWeight`, and `DT_PinZhiGoodNGAddPr`.
Command-spawned recruits miss the natural-gift grant, so talent checks must use a natural spawn.

### Mastery unlocks

Train a fresh recruit's class weapon and watch the mastery track at each threshold its cap can reach.
`DT_ZhuanJingSLD` holds the thresholds and the per-threshold `JiNengChi` pools; `gm RefreshZJ` recomputes mastery the character's proficiency permits, and `gm AddZJ <index>` sets one ability directly, which can separate a data problem from a threshold problem.

### Roster tooltip

Open the mask Connection Enhancement module and read each tier's tooltip.
The roster total is composed by native `AHPlayerState` state rather than stored per character, so on an existing save it may need one awareness-level gain or a session restart before it recomputes.
The `GameXishu` keys `GeRenMaxZhaoMuCount`, `GeRenMaxZhaoMuCount_Two`, and `GeRenMaxZhaoMuCount_Three` are plaintext disk config and cannot ship in the pak; the pak-side lever is `AwarenessLevel_*.ZhaoMuMaxCount`.

### Quality and tier

Quality is a 0–5 tier baked at recruitment and shown as a six-step colored potential icon: white is `0`, and the ramp runs through to red at `5`.
Before recruitment at Awareness Strength 15+, the Mask's Quality Assessment function (`素质评估`) assesses a deterred barbarian so candidates can be screened.
The quality-to-star selector is `DT_PinZhiGoodNGStarWeight`, and the level-up talent cadence is `DT_PinZhiGoodNGAddPr`; a quality-driven cap gift is a `ProfMaxLevelInc` (`ENaturalGiftEffect` effect 52) row whose value is a flat cap add.

### Defects

Open the defect list of freshly generated recruits of several qualities.
Defect removal is read from `DT_PinZhiBadNGRemovePr` at each 5-level check and has no stored per-character copy, so an edited table applies to any existing tribesman below level 60 at its next crossing.
A tribesman already past level 60 has no further checks.

### Localized text

Hover the Origin talent of each class and read its name and description.
Displayed text can come from the DataTable `CultureInvariantString` or from the cooked `Game.locres` keyed by the text's FText key; an existing locres entry wins for display, so a locstring change needs the locres edit, not only the table edit.

## Critical caveats

These are the reasons a correct mod can appear not to work, and the reasons a stale subject can appear to work.

- Values are written once at generation.
  `ProfMaxLvl_Init` and the starting current value are rolled once per character by native initializers, and an archetype seed from `DT_CustomizeNPC` also bakes a `ProfMaxLvl_Init` at generation.
  An existing recruit never changes, so always generate a fresh recruit or start a fresh world for a cap or starting-value check.
- Every cap and class-talent check is per class.
  A Craftsman and a Warrior of the same level and quality do not share a class skill set, so reading one tells you nothing about the other.
- Record the level and quality (the potential-icon border colour) before opening any panel, because both change what the expected value is.
- The DLC Shifting Sands map seeds archetypes from `DT_CustomizeNPC_Egypt` rather than `DT_CustomizeNPC`, so a cap or talent check there must confirm the DLC table is the one being read; the delivered pak clears both tables and the DLC origin-gift gap is tracked in [`../mod-status.md`](../mod-status.md).
- The cap is fixed at recruitment, so one recruit is one draw; collect several recruits of the same class to distinguish a real override from a lucky roll.
- A class default object is deserialized when the class loads, and paks mount before game classes load, so the override must be installed before launch; there is no runtime re-read on a later mount.
- Defect removal has no stored per-character copy and is read at the 5-level bands, so it applies to an existing below-60 tribesman; the cap and starting value do not.
- The roster total lives in native player state and may recompute only at player-state init or an awareness-level change, so an existing save may need a level-up or restart before the new value shows.
- Only the client can display proficiency, talent, mastery, roster, and text values; a headless server cannot show them at all.

## Mount isolation

Test with one mod at a time.
The `_P` suffix grants `+1000` mount priority, and when two paks provide the same `/Game/...` package path there is no per-asset arbitration: the last pak loaded at the deciding priority wins, as the Modkit rule states, "the most recently loaded mod will override the previous one".
A competing or duplicate `_P.pak` can silently win the mount and replace your asset.

Before a test, remove every other `_P.pak` from both scan locations:

- `WS/Content/Paks/`
- `WS/Content/Paks/~mods/`

Confirm in the log which pak mounted before you interpret any in-game reading.
If a value reads as shipped data rather than the override, the first two suspects are a competing pak and a missing `-fileopenlog`.

## What is verified versus unverified

Keep the two evidence levels separate when reporting a result.

| Claim | Evidence level |
| --- | --- |
| The edited asset re-parses cleanly and a value edit round-trips byte-stably | Proven at the asset level |
| An unsigned `_P.pak` mounts on the Linux dedicated server with `-fileopenlog` and is rejected without it | Proven from server logs |
| `_P` grants mount priority and overridden package paths replace the base asset | Proven at the mount layer |
| The Windows client accepts `-fileopenlog` | Community-reported; the client is Themida-packed and not directly observed |
| The in-game reader serves the overridden value at runtime | The subject of this guide; read it from the client and record the result |

A mount is not a read, and a re-parse is not a read.
Only an in-game observation on a fresh subject moves a runtime claim from unverified to verified.

## Foot-guns

- **Stored-value immutability.** A cap (`FProficiencyData` cap field, seeded by `ProfMaxLvl_Init`) and a starting value are written once per character; testing them on an existing recruit always shows the old value and looks like a failed mod.
- **Archetype seed.** A `DT_CustomizeNPC` row, or `DT_CustomizeNPC_Egypt` on the Shifting Sands map, seeds `ProfMaxLvl_Init` at generation, so an archetype recruit can carry a cap the class tables never produce; do not read a cap check on one.
- **Competing paks.** A rival `_P.pak` that shares your package path can win the mount; remove other paks from `WS/Content/Paks/` and `~mods/` and confirm the mounted filename in the log.
- **Client-only UI unreachable headless.** Proficiency, talent, mastery, roster, and text values exist only in the client UI; `-nullrhi` gives you the mount line and nothing else.
- **Remote-console differences.** Telnet and RCON run a reduced remote command set rather than the full in-game `gm` set, so a command that works at the client console may not exist remotely; the console reference records the differences.
- **`-fileopenlog` is build-specific.** A title that removed the bypass is precedent; pin the mod to a known Soulmask build and re-test after every patch.
- **No property-dump shortcut.** No object-property-dump console command exists in this build, and the client executable is Themida-packed, so there is no shortcut around reading the value in the UI.
- **`SetShuLianDuMaxVal` is partial.** It sets the current value but the max value does not always take; use it as a corollary check, not as proof.
- **`gm KeJiShu` is not a command.** The shipped technology literal is `UnLock_Techs`, and the corrected command names are in the console reference.
- **Mounted but unread.** A clean mount line proves only that the pak mounted; do not report a runtime effect from the log alone.

## Related documents

- [`../game-reference/console-commands.md`](../game-reference/console-commands.md) — the authoritative command surface and the fast-test recipe.
- [`packaging-and-loading.md`](packaging-and-loading.md) — pak format, mount layout, the signature gate, and load precedence.
- [`authoring-pipeline.md`](authoring-pipeline.md) — extracting, editing, and repacking cooked assets.
- [`../reverse-engineering/probe-methodology.md`](../reverse-engineering/probe-methodology.md) — using probes to answer an unknown research question.
- [`../../final-mod-verification-checklist.md`](../../final-mod-verification-checklist.md) — the full pass/fail script for the shipped design.
