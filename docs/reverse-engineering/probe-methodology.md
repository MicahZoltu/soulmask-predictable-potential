# Probe Methodology — Answering Unknown Questions with Probe Paks

A probe is a temporary mod pak built for the sole purpose of making one uncertain game behavior observable, then discarded.
It is a research instrument, not a deliverable: it overrides one asset (or one class-default object) with a conspicuous value, and the in-game read-back either confirms or refutes a single hypothesis.
This document describes the technique and the lessons it forced; it is not a log of individual probes.
How to test a finished mod belongs in [`../modding-guide/testing.md`](../modding-guide/testing.md), the pak layout and signature gate are in [`../modding-guide/packaging-and-loading.md`](../modding-guide/packaging-and-loading.md), and the concrete edit operations a probe relies on are in [`../modding-guide/data-editing.md`](../modding-guide/data-editing.md).
The asset-level analysis that identifies what to override is in [`asset-analysis.md`](asset-analysis.md), and the binary-level analysis that identifies the native reader is in [`native-binary-analysis.md`](native-binary-analysis.md).

## What a probe is

A probe overrides a specific cooked asset with a value that cannot occur in shipped data, so a successful read is unmistakable.
It ships as an unsigned `_P.pak` mounted on the Windows client or the Linux dedicated server depending on where the questioned value is displayed; the pak format, mount point, install paths, and `-fileopenlog` signature gate are in [`../modding-guide/packaging-and-loading.md`](../modding-guide/packaging-and-loading.md).
Because the `_P` suffix gives the override priority over the base pak at the same package path, the probe replaces the shipped asset without touching the game install.

A probe is the smallest edit that separates two hypotheses.
It may be a value edit to a DataTable row, a value edit to a family of rows, a class-default-object (CDO) override, or a map/list entry change.
The only reliable rule is that the override must be read by the code path under test; proving what reads it is the experiment.

## Probe design

Design starts from one falsifiable question: "is the cap produced by native constant `X` or by table `Y`?" or "does effect `Z` alter the stored field?".
Then pick the smallest asset edit that forces a different result under each hypothesis and produces a value the shipped game never emits.

The edit must be conspicuous.
A shipped cap scatters across `50–150`, so a forced uniform `100` can only come from the override, and a value the code path never reads produces no change at all.
For a probe that tests whether a CDO override is read at all, force a point the arithmetic cannot disguise: pinning `ProfMaxLvlLowerLimit` and `ProfMaxLvlUpperLimit` to the same value makes every class-path cap exactly that value regardless of the base roll and class bonus.
Pinning a range assumes the native `RandRange(min==max)` degenerate case returns `min`; that branch was not isolated, so pair the pinned probe with a positive control that reads the same value without the pin, and treat a non-`min` result as a re-roll or rejection rather than confirmation.

Keep the probe minimal and reversible.
Prefer a pure value edit to an existing serialized property, and grow a structure only when the growth itself is the question, because cooked CDO array growth and map growth both round-trip.

Build from a clean cooked seed.
Export the asset from the retail or extracted cooked tree, not from a previously modified asset, or edits compound and a contaminated input silently poisons the read-back.

Verify the edit before mounting it.
Re-import the JSON, re-parse the modified asset, and read the intended values back; then round-trip the modified bytes and require the second pass to reproduce them exactly.
An asset that re-parses and round-trips byte-identically is structurally valid, but whether the shipping game reads it is a separate question that only the mount can answer.

Mount exactly one probe, following the isolation and log checks in [`../modding-guide/testing.md`](../modding-guide/testing.md) "Mount isolation" and [`../modding-guide/packaging-and-loading.md`](../modding-guide/packaging-and-loading.md) "Testing the mount".

## The read-back requirement

Several of the values a probe targets are written once, at generation, and then persist per character; a probe can only be read on a character generated under it.
`ProfMaxLvl_Init` (at `FProficiencyData+0xc`) is written on the create branch of `UHChengZhangComponent::InitProficiency` (`0x41b7730`), which runs under a one-shot guard at `component+0xb0`, and the cap recompute reads it but never rewrites it.
The starting current value (at `+0x4`) is written once by the selector `0x41bb000`, guarded by bit 0 of `bCurProfLvlInit` at `+0x528`.
The archetype seed is baked at generation from `DT_CustomizeNPC.CustomizeProfMaxLv`, keyed by the row name at `character+0x3378`.

The consequence is decisive: an existing recruit keeps its stored `ProfMaxLvl_Init`, starting value, and archetype seed, and proves nothing about a probe.
A save, replication, or prototype carrying an already-seeded `FProficiencyData` is re-persisted by the deserialize setter `0x41c7cb0`; no pak can rewrite a stored seed.
Read generation-time effects only on a freshly generated recruit, and use a fresh world or a newly visited camp rather than an existing character.

Not every probe target is generation-baked, and the design must know which it is.
`DT_PinZhiBadNGRemovePr` is read live at each 5-level check and has no stored per-character copy, so its edit applies at the next check for any character up to and including level 60.
The effective roster cap is not table-driven: `AHPlayerState` seeds its base of `3` from the native constant at `0x6df880` in its constructor, no post-construction writer exists, and the `AwarenessLevel_*` `ZhaoMuMaxCount` column is inert, so no awareness change or session restart makes a table value appear; the base rises only through the mask Connection-Enhancement increments (see [`../game-reference/roster-limits.md`](../game-reference/roster-limits.md)).
A negative result from a generation-baked probe is therefore not necessarily a failed mount; it may be an old character.

## Worked examples of the method

### Isolating which native constant or table drives a cap

Question: is the recruit cap produced by the native base-roll constants or by a per-class table?
Edit the `BP_ProficiencyConfig` CDO (`Default__BP_ProficiencyConfig_C`) to pin the clamp bounds `ProfMaxLvlLowerLimit` and `ProfMaxLvlUpperLimit` to one conspicuous value and, in a second variant, pin the class rows `DT_Prof_ZhiYe_*.MinAdd`/`MaxAdd`.
Read several class and non-class skill caps on one fresh recruit.
A uniform value proves the native code reads the overridden object fields; the shipped scatter proves it does not.

To separate the contributions rather than just the read, freeze the base roll with equal `ProfInitMaxLvlMin`/`ProfInitMaxLvlMax` and pin the class row `MinAdd`/`MaxAdd`.
The cap on the class path is then `base + classBonus + gift`; the difference between a class skill and a non-class skill of the same recruit is exactly the class bonus, and the remaining offset is the base or the gift.

### Confirming an effect enum's handler by watching a stored field

Question: does `ENaturalGiftEffect::ProfMaxLevelInc` (effect 52) actually raise the cap, or only something adjacent?
Repurpose an unused `DT_GiftZongBiao` row to `ENaturalGiftEffect::ProfMaxLevelInc` with a distinct `NGEffectVal`, make it grantable, and read the character's `ProfMaxLvl_Add` (`FProficiencyData+0x10`) and displayed cap on a fresh recruit.
The stored add is the direct evidence: effect 52 writes `ProfMaxLvl_Add`, while `ENaturalGiftEffect::ProfExpInc` (effect 51) writes only `ProfExp` (`+0x14`).
Watching the stored field rather than the displayed number avoids confusing the seed with the modifier.

The apply routine `0x41c8ba0` runs the cap recompute over the applied gift's own `NGProfTypeList`, so an effect-52 value lands only on the proficiencies that list names.
Reading one listed skill and one unlisted skill distinguishes "the effect works" from "the effect works only where the list points".

### Determining the class/bonus split

Question: is a per-skill cap difference a class bonus, a secondary profession, or an archetype seed?
Force the candidates one at a time.
Pin the six `DT_Prof_ZhiYe_*` tables to a flat `MinAdd = MaxAdd`, then read class and non-class skills.
If the difference persists on a skill the class table does not list, the difference is not the class table.
A surviving per-skill deviation that does not track the class table may instead track the archetype seed `DT_CustomizeNPC.CustomizeProfMaxLv`; the secondary map `FuZhiYeProfMaxLvlMap` at `config+0x158` is empty at runtime and contributes nothing.

### Distinguishing a gift-pool/gate problem from a target-list problem

Question: a gift that "does nothing" can fail because it was never granted, or because it was granted but its target list excluded the measured skill.
These have opposite fixes, so probe them apart.
Widen or remove the pool/gate in one variant and widen the target list in another.
When the target list is the problem, the moved set equals the union of the applied rows' `NGProfTypeList`s; when the pool is the problem, no field changes at all.
The measured gift's own apply is self-excluded by gift id at `(*(character+0xa8)+0x120)+0x3f0`, so its own list is not part of the moved set.

## Decisive failure modes

### Wrong pointer or property attribution

A probe can be built perfectly and still test the wrong thing if it edits a property the reader never consults.
A pointer that looks like the right table can bind a similar asset with no relevant map while the reader consults a different property on a different object: for example, a null at `ManRenConfigTable` (object offset `0x16a0`, binding `DT_ManRenConfig`, a behaviour table with no proficiency map) is a no-op for caps, whereas the cap initializer reads `[resolve()+0x1b0]`, whose property is `CustomizeProfAndGA`, holding the cooked `DT_CustomizeNPC` (56 rows).
`DT_XingGeConfig` is not the table read either.

Before trusting any probe that touches a pointer or an indirectly-read property, prove the attribution.
Read the FProperty `Offset_Internal` in the binary, and confirm the pointer's runtime value or row count matches the table you believe it is.
A negative probe result means only "this edit did not change the behavior"; it does not identify the real cause.

### Competing-pak mount

A duplicate or stale `_P.pak` at the same package path can win the mount and invalidate the entire read-back.
UE 4.27 processes equal-order paks in mount order with first match winning, so another override of the same asset silently supplies its values.
Install exactly one probe and remove or rename every other `_P.pak` that shares its package paths before launching, then verify which override loaded as described in [`../modding-guide/testing.md`](../modding-guide/testing.md) "Mount isolation".

## Additional pitfalls

A CDO whose property is a `RawExport` cannot be value-edited or repointed with UAssetAPI.
`Default__BP_ZiYuanGuanLiQi_C` is a `RawExport` and owns `GoodNGMaxNum` and the `DT_PinZhi*` references, so a probe must avoid it or use a raw byte patch; prefer a `NormalExport` CDO such as `BP_ProficiencyConfig`.

Do not assume a Blueprint node is the cause when the behavior is native.
A title talent that correlates with a high cap may still be effect 51 writing only experience, while the actual cause is the archetype seed read by native `InitProficiency`.
Correlation with a Blueprint-granted effect is a marker, not a mechanism.

Widening a target list can make a contaminated save worse, not better.
Broadening every effect-51 `NGProfTypeList` to all proficiencies makes a stored native `ProfMaxLvl_Init` surface across the whole set instead of the drawn-talent subset.
Widening is not a repair for characters that already carry a seed; only clean generation or the native forced re-init removes one.

Expect platform-specific asset sourcing to be a risk.
When an asset is absent from one tree (for example `AwarenessLevel_*` is missing from the extracted client subset and the client pak is Oodle-compressed), the probe ships bytes from the other tree and the platform-neutrality of the value is an unverified assumption, not a proven one.

## Rigorous probe checklist

- State one falsifiable hypothesis and name the single edit that separates it from its alternative.
- Choose a value the shipped game cannot emit, and include a negative control.
- Confirm the target is a `NormalExport` and the property is value-editable; do not rely on a `RawExport`.
- Export from a clean cooked asset; apply the edit; re-import.
- Re-parse the modified asset and read the intended values back; round-trip and require byte-stable output.
- Build one `_P.pak`, V11, mount `../../../`, unencrypted index.
- Install exactly one probe; remove or rename any other `_P.pak` at the same package paths.
- Launch with `-fileopenlog`; confirm the `Mounting pak file` line and the shader-library `mounted` callback.
- Read the value on the platform that displays it: the client for character-panel values, the server for host-only behavior.
- Use a fresh world or a newly generated recruit for generation-baked values; classify each target as baked or live before reading.
- Record the observation against both hypotheses, and treat a clean negative result as evidence once the mount and the pointer attribution are proven.

## Provenance of the game-reference findings and how to extend the method

Most of the tables in [`../game-reference/`](../game-reference/) were confirmed with this technique: the recruit cap arithmetic, the starting-proficiency inputs, the archetype seed, the defect-removal cadence, the roster base and mask increments, and the training-track rates.
The pattern that made those confirmations possible is the same each time: locate the native reader first (see [`native-binary-analysis.md`](native-binary-analysis.md)), identify the asset or constant it reads (see [`asset-analysis.md`](asset-analysis.md)), then force that value with a probe and read it back.

To extend the method to a new unknown, follow the same order.
Find the reader in the shipping binary and the field it consumes; that tells you whether the value is data-editable at all.
If it is data-editable, override the smallest controlling field and read the dependent stored field, not just the displayed result.
If it is not data-editable, the probe can still refute a hypothesis by showing the behavior is unchanged, but it cannot prove a data path that does not exist.

## Related documents

- [`../modding-guide/testing.md`](../modding-guide/testing.md)
- [`../modding-guide/packaging-and-loading.md`](../modding-guide/packaging-and-loading.md)
- [`../modding-guide/data-editing.md`](../modding-guide/data-editing.md)
- [`asset-analysis.md`](asset-analysis.md)
- [`native-binary-analysis.md`](native-binary-analysis.md)
- [`../game-reference/console-commands.md`](../game-reference/console-commands.md)
