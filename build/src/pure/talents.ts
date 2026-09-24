// The settlement mappings from DESIGN.md and the talent evidence docs: origin families and gates, class and tribe pool families, rarity weights, and the preference gear rows to retire.
// Every mapping here is data the edit modules consume; the modules own the asset-shape construction.

export interface OriginClassDefinition {
	name: string
	family: number
	gateBlueprint: string
}

export const ORIGIN_CLASS_DEFINITIONS: readonly OriginClassDefinition[] = [
	{ name: "Laborer", family: 50001, gateBlueprint: "BP_Gift_IsZhiYeKuLi_C" },
	{ name: "Porter", family: 50002, gateBlueprint: "BP_Gift_IsSHZhiYeZaGong_C" },
	{ name: "Craftsman", family: 50003, gateBlueprint: "BP_Gift_IsSHZhiYeJiangRen_C" },
	{ name: "Warrior", family: 50004, gateBlueprint: "BP_Gift_IsZDZhiYeZhanShi_C" },
	{ name: "Hunter", family: 50005, gateBlueprint: "BP_Gift_IsZDZhiYeLieShou_C" },
	{ name: "Guard", family: 50006, gateBlueprint: "BP_Gift_IsZDZhiYeWeiShi_C" },
]

export function originClassForFamily(family: number): OriginClassDefinition {
	const definition = ORIGIN_CLASS_DEFINITIONS.find((candidate) => candidate.family === family)
	if (definition === undefined) throw new Error(`no origin class for family ${family}`)
	return definition
}

export function originClassForGate(gateBlueprint: string): OriginClassDefinition {
	const definition = ORIGIN_CLASS_DEFINITIONS.find((candidate) => candidate.gateBlueprint === gateBlueprint)
	if (definition === undefined) throw new Error(`no origin class for gate ${gateBlueprint}`)
	return definition
}

// The settled class-pool family sets from DESIGN.md ("Talent composition").
export const CLASS_POOL_FAMILIES: Readonly<Record<string, readonly number[]>> = {
	Hunter: [15008, 15009, 15011],
	Guard: [16089, 16029, 16049],
	Warrior: [16069, 10003, 16005],
	Laborer: [11001, 15004, 16028],
	Porter: [16074, 16076, 16077, 16078, 16079],
	Craftsman: [16073, 16082, 16083, 16086, 16087],
}

export function classPoolFamilies(className: string): readonly number[] {
	const families = CLASS_POOL_FAMILIES[className]
	if (families === undefined) throw new Error(`no class pool families for ${className}`)
	return families
}

export function classGateBlueprint(className: string): string {
	const definition = ORIGIN_CLASS_DEFINITIONS.find((candidate) => candidate.name === className)
	if (definition === undefined) throw new Error(`no class gate for ${className}`)
	return definition.gateBlueprint
}

export interface TribeDefinition {
	name: string
	clanType: string
	families: readonly number[]
}

// The settled tribal pool families from DESIGN.md ("Talent composition").
export const TRIBE_DEFINITIONS: readonly TribeDefinition[] = [
	{ name: "Claw", clanType: "EClanType::CLAN_TYPE_A", families: [16008, 16058] },
	{ name: "Flint", clanType: "EClanType::CLAN_TYPE_B", families: [16071, 16072] },
	{ name: "Fang", clanType: "EClanType::CLAN_TYPE_C", families: [16039, 16040, 16041] },
	{ name: "Outcast", clanType: "EClanType::CLAN_TYPE_NONE", families: [42040, 42041, 42042] },
]

// The home-region condition every design tribe draws its settled families from; Outcast ships without it and needs a cloned entry.
export const TRIBE_REGION_GATE_BLUEPRINT = "BP_Gift_QuYu_0_C"

// DLC region conditions extend the base `_0_` gate with numbered region names, so a region entry is recognized by the shared `BP_Gift_QuYu_` prefix rather than one exact gate.
export const TRIBE_REGION_GATE_PREFIX = "BP_Gift_QuYu_"

// The shipped uniform draw made the tribal tier random, so the tier is pinned to star III at a fixed weight.
export const TRIBE_PINNED_WEIGHT = 100

export interface GiftDetailId {
	type: number
	id: number
}

export function starRowIdsForFamily(family: number): readonly number[] {
	return [family * 10 + 1, family * 10 + 2, family * 10 + 3]
}

export function tribeStarThreeRowIds(families: readonly number[]): readonly number[] {
	return families.map((family) => starRowIdsForFamily(family)[2])
}

// Every family's rows are `family * 10 + 1..3`, so a row id ending in `3` is the family's star-III gift.
export function isStarThreeRowId(id: number): boolean {
	return id % 10 === 3
}

// A gift row id encodes its family in the digits above the star, so a biome entry's family survives the tier collapse even when only its star-I row was granted.
export function familyForRowId(rowId: number): number {
	return (rowId - (rowId % 10)) / 10
}

export function classPoolDetailIds(families: readonly number[]): readonly GiftDetailId[] {
	return families.flatMap((family) => starRowIdsForFamily(family).map((id) => ({ type: family, id })))
}

// Values shipped as `Star` 1/2/3 are keyed here as 1/2/3 weights; quality 0-2 weight nothing because their grant cadence is zeroed.
export const QUALITY_STAR_WEIGHTS: Readonly<Record<string, Readonly<Record<1 | 2 | 3, number>>>> = {
	"5": { 1: 0, 2: 0, 3: 100 },
	"4": { 1: 0, 2: 100, 3: 0 },
	"3": { 1: 100, 2: 0, 3: 0 },
	"2": { 1: 0, 2: 0, 3: 0 },
	"1": { 1: 0, 2: 0, 3: 0 },
	"0": { 1: 0, 2: 0, 3: 0 },
}

export function qualityStarWeights(quality: string): Readonly<Record<1 | 2 | 3, number>> {
	const weights = QUALITY_STAR_WEIGHTS[quality]
	if (weights === undefined) throw new Error(`no star weights for quality ${quality}`)
	return weights
}

// Quality 3-5 may draw a class talent; quality 0-2 keep the cadence loop running at level 1 but grant nothing.
export const GRANTING_QUALITIES: readonly string[] = ["5", "4", "3"]
export const NON_GRANTING_QUALITIES: readonly string[] = ["2", "1", "0"]
export const GRANT_LEVEL_KEY = 1
export const GRANT_PR = 1
export const GRANT_COUNT = 1
export const NO_GRANT_PR = 0
export const NO_GRANT_COUNT = 0

export function qualityGrantsClassTalent(quality: string): boolean {
	if (NON_GRANTING_QUALITIES.includes(quality)) return false
	if (GRANTING_QUALITIES.includes(quality)) return true
	throw new Error(`unknown quality ${quality}`)
}

// The like/aversion gear families tie a permanent mood to an issued loadout, so their rows are retired.
export const GEAR_PREFERENCE_ROWS: readonly string[] = [
	"800411-3",
	"800421-3",
	"800431-3",
	"800441-3",
	"800451-3",
	"800461-3",
	"900411-3",
	"900421-3",
	"900431-3",
	"900441-3",
	"900451-3",
	"900461-3",
]

// Battle-Tested is the sole Experience family; pinning row 700013 guarantees tier III for every class.
export const BATTLE_TESTED_STAR_III = 700013
export const BATTLE_TESTED_PINNED_WEIGHT = 100
