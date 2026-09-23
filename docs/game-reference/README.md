# Game Reference

This folder is the authoritative reference for the shipped Soulmask game: the assets it is built from and the progression systems a mod can observe or change.
It records what the game data is, not how to modify it.
Each document marks its claims as in-game verified, asset-level verified, inferred, or unverified.

| File | Covers |
| --- | --- |
| [`game-and-assets.md`](game-and-assets.md) | Engine, pak format, cooked-asset model, and the `/Game` asset tree. |
| [`proficiencies-and-caps.md`](proficiencies-and-caps.md) | The 31 proficiencies and every mechanism that sets a proficiency cap. |
| [`starting-proficiency.md`](starting-proficiency.md) | The initial skill values a recruit generates with. |
| [`quality-and-rarity.md`](quality-and-rarity.md) | The `PinZhi` quality roll and its data sources. |
| [`recruitment-and-spawns.md`](recruitment-and-spawns.md) | How spawners produce capturable tribesmen and which levers are data-only. |
| [`talents.md`](talents.md) | The natural-gift table, selection pools, and assignment pipeline. |
| [`weapon-mastery.md`](weapon-mastery.md) | Mastery abilities, thresholds, and their DataTables. |
| [`tribes-and-regions.md`](tribes-and-regions.md) | Factions, tribe identities, biomes, and region tiers. |
| [`roster-limits.md`](roster-limits.md) | Tribesman count limits and the per-mode mask-node ramp mechanism. |
| [`tech-tree.md`](tech-tree.md) | The mask technology tree's Blueprint nodes and gates. |
| [`training-ground-and-transfer.md`](training-ground-and-transfer.md) | What the Training Ground and Mysterious Stone Table move. |
| [`console-commands.md`](console-commands.md) | The console and admin command surface for inspecting and forcing state. |
| [`server-config.md`](server-config.md) | The plaintext server and gameplay settings outside the pak. |

To edit a value once you have found it, continue to [`../modding-guide/data-editing.md`](../modding-guide/data-editing.md); for the full index of the documentation, see [`../README.md`](../README.md).
