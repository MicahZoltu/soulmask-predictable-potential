# Soulmask — Predictable Potential Mod

**Target game:** Soulmask (CampFire Studio / Qooland Games), Unreal Engine 4.27, including the Shifting Sands DLC.

This mod reshapes Soulmask's tribesman economy so advancement is predictable and earned over time rather than discovered by re-rolling captures.
It keeps the game's structure while removing randomness from proficiency caps, recruit starting skill, and talent tiers.
Quality remains the one meaningful recruitment filter, and the number of tribesmen a player may hold grows gradually across the whole game.

## Goals

- Remove the grind of capturing many tribesmen to find a good stat roll.
- Make progression consistent and smooth, with randomness only where it is the point of play.
- Keep early recruits worth investing in and make deeper, rarer recruits worth pursuing.
- Reward deliberate roster choices and investment over luck.
- Leave the core game intact.

## Proficiency caps

Every recruit's proficiency cap is `global base + class bonus`.
The global base is a fixed constant and each class contributes an exact per-skill bonus, so every recruit of a class shares identical caps.
Class skills cap at 125 and skills outside the class set cap at 85.
A skill that is absent from a class's set receives no class bonus and resolves to the non-class cap.
Caps are independent of level, quality, rarity, rank, and region, so no capture roll can change them.
The per-archetype cap overrides on the `DT_CustomizeNPC` rows are cleared so no archetype seed can alter a cap.

Each class has a defined skill set:

| Class | Skills |
| --- | --- |
| Hunter | Spear, Blade, Shield, Bow, Harvest, Logging |
| Guard | Spear, Blade, Shield, Bow, Great Sword, Mining |
| Warrior | Spear, Blade, Shield, Bow, Dual-Blade, Gauntlets, Great Sword, Hammer, Whip |
| Laborer | Spear, Shield, Logging, Mining, Harvest, Plant |
| Porter | Gauntlets, Weaving, Potting, Wood & Stone, Leatherworking, Kiln |
| Craftsman | Gauntlets, Craftsman, Alchemy, Cooking, Weapon Crafting, Armor Crafting |

## Recruit starting proficiency

Starting proficiency is deterministic and keyed to the recruit's level, so a newly recruited tribesman begins at a predictable point.
Non-class skills follow a shared curve from 1 at level 1 to 76 at level 50.
Class skills add a fixed 36 on top, starting at 37 and reaching 112.
Both end near 90% of their cap, leaving a small amount of training headroom.

## Weapon mastery

Each weapon has mastery thresholds at proficiency 30, 60, 90, and 120.
Every threshold a recruit's cap can reach always grants an unlock, and the ability is chosen randomly from that threshold's pool.
An ability the recruit already knows is never granted again.
Class weapons, capped at 125, reach all four thresholds; weapons outside the class set, capped at 85, reach the first two.
Because each pool holds more abilities than the weapon has slots, the full set becomes visible across recruits over time.
The mod makes the 30/60/90/120 thresholds always grant, but the proficiency-0 masteries inherited from a recruit's random starting loadout remain random and cannot be easily overridden by a pak; the generation-time mechanism and the data-only mitigations are in [docs/game-reference/weapon-mastery.md](docs/game-reference/weapon-mastery.md) ("The proficiency-0 starting mastery row"), with the native detail in [docs/reverse-engineering/native-binary-analysis.md](docs/reverse-engineering/native-binary-analysis.md) (section 9.3).

## Talent composition

Every recruit is assembled from the same slots, so its build is readable at a glance.
A recruit receives one Origin talent, one Battle-Tested talent, one tribal talent, one class talent, and a few preference talents.

- **Origin.** One class-identity talent, fixed at the top tier, whose growth target list matches the class skill set.
- **Battle-Tested III.** The Experience talent that reduces damage taken by the recruit while deployed as a companion, granted to every class at a uniform tier.
- **Tribal.** One talent fixed at star III, drawn from a small set specific to the recruit's tribe, independent of class. Per-quality tribal tiers are not data-possible: the tribal selector draws literal listed star rows and never consults the quality star table, so every tribe's region entries are pinned to star III.
- **Class.** One talent drawn from a small set specific to the recruit's class.
- **Preferences.** A few permanent, mood-only likes and aversions, drawn at the native random count of 0–3 per recruit. They carry no stat, combat, or production penalty; only the loadout-tied gear rows are retired, so no permanent mood is bound to an issued weapon or armor.

Quality sets the tier of the class talent:

| Quality | Class-talent tier |
| --- | --- |
| red | III |
| yellow | II |
| purple | I |
| white, green, blue | none |

The Origin talent is granted to every class:

| Class | Origin talent | Family | Star-III row |
| --- | --- | --- | --- |
| Laborer | Origin - Laborer | `50001` | `500013` |
| Porter | Origin - Porter | `50002` | `500023` |
| Craftsman | Origin - Craftsman | `50003` | `500033` |
| Warrior | Origin - Fighting | `50004` | `500043` |
| Hunter | Origin - Hunting | `50005` | `500053` |
| Guard | Origin - Guard | `50006` | `500063` |

The in-game description shown on each Origin talent must also be rewritten to match the class's new skill set, because the shipped text still names the original skills.

The tribal talent is drawn from a small set per tribe:

| Tribe | Talents |
| --- | --- |
| Claw | Getting Braver, Fatal Rhythm |
| Flint | Refined Armor, Weapon Enhancement |
| Fang | Planting Pro, Logging Pro, Vein Protection |
| Outcast | Cold Resist, Radiation Resist, Heat Resist |

The class talent is drawn from a small set per class:

| Class | Talents |
| --- | --- |
| Hunter | Marksman Footstep, Rapid Fire, Bone-gnawing Wound |
| Guard | Rock-like Resolve, Endurance, Shield Bash |
| Warrior | Onslaught, Powerful Attack, Fatal |
| Laborer | Camel Cow, Trick Force, Loaded Raid |
| Porter | Accelerate Kiln, Accelerate Leatherworking, Accelerate Potting, Accelerate Weaving, Accelerate Wood & Stone |
| Craftsman | Refined Tool, Accelerate Alchemy, Accelerate Armor Crafting, Accelerate Cooking, Accelerate Weapon Crafting |

## Quality and rarity

Quality stays random in order to make the set of "good recruits" smaller than the set of "all enemies".
It sets the class-talent tier and the recruit's starting gear.
It does not affect caps or starting proficiency.

## Tribesman cap growth

The number of tribesmen a player may hold grows gradually with awareness strength instead of jumping at a few milestones.
The personal cap begins at a native base of 3 and gains a 15-step ladder from the mask Connection Enhancement module, one step every four awareness levels from 4 to 60.
The ladder is shared between game modes, but the per-tier step is mode-aware: Survival adds 3 per tier for a personal cap of 48, and Tribe Mode (Management) adds 6 per tier for a personal cap of 93.
One rebuilt mask node, `BP_Mask_XiuFu01_1012`, stores the keys and gates and serves both modes; the per-mode magnitudes live in each mode's coefficient manager, `BP_GameXiShu_GuanLiQi` for Survival and `BP_GameXiShu_GuanLiQi_Management` for Tribe Mode, and all of it ships in the one pak.
The effective personal cap is min-bounded by the world's tribe-wide cap, `GongHuiMaxZhaoMuCount` plus guild-level `TribeMemCount`, so the 48 and 93 targets hold only where that cap allows; a restricted or dedicated group-1 world sets `GongHuiMaxZhaoMuCount` to 40 and bounds the total lower.
Action, Creative, and PVP are not covered, and there the keys are shadowed by their own managers so those modes fall back to 1 per tier.
This keeps new slots arriving throughout the game, so there is a continuing reason to recruit later in the game since you cannot fill every slot early.
