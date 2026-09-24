// Declarative list of asset edits: the id, source tree, retail-relative path, edit kind, and any class parameter.
// The build orchestration dispatches on the edit's registered kind.
import { EDIT_REGISTRY, LOCRES_EDIT_REGISTRY } from "./edits/registry"
import { CLASS_DEFINITIONS, classDefinitionFromParams, type ClassDefinition } from "./pure/classSets"
import { parseRampTierIncrement, SURVIVAL_RAMP_TIER_INCREMENT, TRIBAL_RAMP_TIER_INCREMENT } from "./pure/ramp"

export type AssetSource = "client" | "server"
export type AssetKind = "uasset" | "locres"

export interface ManifestEntry {
	id: string
	source: AssetSource
	assetPath: string
	kind?: AssetKind
	edit: string
	params?: Record<string, string>
}

export const ASSET_MANIFEST: readonly ManifestEntry[] = [
	{ id: "BP_ProficiencyConfig", source: "server", assetPath: "Blueprints/ZiYuanGuanLi/BP_ProficiencyConfig", edit: "proficiencyConfig" },
	{ id: "class-hunter", source: "server", assetPath: "Blueprints/DataTable/Proficiency/DT_Prof_ZhiYe_ShouLieZhe", edit: "classTable", params: { className: "Hunter" } },
	{ id: "class-guard", source: "server", assetPath: "Blueprints/DataTable/Proficiency/DT_Prof_ZhiYe_ShouHuZhe", edit: "classTable", params: { className: "Guard" } },
	{ id: "class-warrior", source: "server", assetPath: "Blueprints/DataTable/Proficiency/DT_Prof_ZhiYe_WuWeiZhe", edit: "classTable", params: { className: "Warrior" } },
	{ id: "class-laborer", source: "server", assetPath: "Blueprints/DataTable/Proficiency/DT_Prof_ZhiYe_KuLi", edit: "classTable", params: { className: "Laborer" } },
	{ id: "class-porter", source: "server", assetPath: "Blueprints/DataTable/Proficiency/DT_Prof_ZhiYe_ZaGong", edit: "classTable", params: { className: "Porter" } },
	{ id: "class-craftsman", source: "server", assetPath: "Blueprints/DataTable/Proficiency/DT_Prof_ZhiYe_ZongJiang", edit: "classTable", params: { className: "Craftsman" } },
	{ id: "start-warrior", source: "server", assetPath: "Blueprints/DataTable/NaturalGift/SLD_ChuShiLv_ZhanShi", edit: "startLevelTable", params: { className: "Warrior" } },
	{ id: "start-hunter", source: "server", assetPath: "Blueprints/DataTable/NaturalGift/SLD_ChuShiLv_LieShou", edit: "startLevelTable", params: { className: "Hunter" } },
	{ id: "start-guard", source: "server", assetPath: "Blueprints/DataTable/NaturalGift/SLD_ChuShiLv_WeiShi", edit: "startLevelTable", params: { className: "Guard" } },
	{ id: "start-laborer", source: "server", assetPath: "Blueprints/DataTable/NaturalGift/SLD_ChuShiLv_LiGong", edit: "startLevelTable", params: { className: "Laborer" } },
	{ id: "start-porter", source: "server", assetPath: "Blueprints/DataTable/NaturalGift/SLD_ChuShiLv_ZaGong", edit: "startLevelTable", params: { className: "Porter" } },
	{ id: "start-craftsman", source: "server", assetPath: "Blueprints/DataTable/NaturalGift/SLD_ChuShiLv_JiangRen", edit: "startLevelTable", params: { className: "Craftsman" } },
	{ id: "mastery", source: "server", assetPath: "Blueprints/ZiYuanGuanLi/DT_ZhuanJingSLD", edit: "masteryTable" },
	{ id: "archetype", source: "server", assetPath: "Blueprints/DataTable/CustomProfAndGA/DT_CustomizeNPC", edit: "archetypeTable" },
	{ id: "archetype-egypt", source: "server", assetPath: "AdditionMap01/BluePrints/DataTable/DT_CustomizeNPC_Egypt", edit: "archetypeTable" },
	{ id: "ramp-node", source: "server", assetPath: "Blueprints/MianJu/XiuFu01/BP_Mask_XiuFu01_1012", edit: "rampNode" },
	{ id: "ramp-manager-survival", source: "server", assetPath: "Blueprints/ZiYuanGuanLi/BP_GameXiShu_GuanLiQi", edit: "rampManager", params: { tierIncrement: String(SURVIVAL_RAMP_TIER_INCREMENT) } },
	{ id: "ramp-manager-tribal", source: "server", assetPath: "Blueprints/ZiYuanGuanLi/BP_GameXiShu_GuanLiQi_Management", edit: "rampManager", params: { tierIncrement: String(TRIBAL_RAMP_TIER_INCREMENT) } },
	{ id: "talent-origin-rows", source: "server", assetPath: "Blueprints/DataTable/NaturalGift/DT_GiftZongBiao", edit: "originTalentRows" },
	{ id: "talent-born-config", source: "server", assetPath: "Blueprints/ZiYuanGuanLi/BP_ManRenRandomConfig", edit: "bornRandomConfig" },
	{ id: "talent-class-pool", source: "server", assetPath: "Blueprints/DataTable/NaturalGift/DT_GiftZhengMian", edit: "classPoolRows" },
	{ id: "talent-class-pool-custom", source: "server", assetPath: "Blueprints/DataTable/NaturalGift/DT_GiftZhengMian_Custom", edit: "classPoolRows" },
	{ id: "talent-rarity-star", source: "server", assetPath: "Blueprints/DataTable/NaturalGift/DT_PinZhiGoodNGStarWeight", edit: "rarityStarWeight" },
	{ id: "talent-rarity-cadence", source: "server", assetPath: "Blueprints/DataTable/NaturalGift/DT_PinZhiGoodNGAddPr", edit: "rarityGrantCadence" },
	{ id: "talent-preferences", source: "server", assetPath: "Blueprints/DataTable/NaturalGift/DT_GiftXiHaoBiao", edit: "preferencePool" },
	{ id: "talent-defects", source: "server", assetPath: "Blueprints/DataTable/NaturalGift/DT_GiftFuMiann", edit: "defectPool" },
	{ id: "localization-origin", source: "client", assetPath: "Localization/Game/en/Game", kind: "locres", edit: "originLocalization" },
]

export const CONTENT_ROOT = "WS/Content"

const RAMP_TIER_INCREMENT_PARAMETER = "tierIncrement" as const

export function assetKind(entry: ManifestEntry): AssetKind {
	return entry.kind ?? "uasset"
}

export function internalBasePath(entry: ManifestEntry): string {
	return `${CONTENT_ROOT}/${entry.assetPath}`
}

export function internalUassetPath(entry: ManifestEntry): string {
	return `${internalBasePath(entry)}.uasset`
}

export function internalUexpPath(entry: ManifestEntry): string {
	return `${internalBasePath(entry)}.uexp`
}

export function internalLocresPath(entry: ManifestEntry): string {
	return `${internalBasePath(entry)}.locres`
}

export function validateManifest(entries: readonly ManifestEntry[]): void {
	if (entries.length === 0) throw new Error("manifest is empty")
	const ids = new Set<string>()
	const uassetEditIds = new Set(Object.keys(EDIT_REGISTRY))
	const locresEditIds = new Set(Object.keys(LOCRES_EDIT_REGISTRY))
	for (const [index, entry] of entries.entries()) {
		const label = `manifest[${index}]`
		if (entry.id.length === 0) throw new Error(`${label}: id is empty`)
		if (ids.has(entry.id)) throw new Error(`${label}: duplicate id ${entry.id}`)
		ids.add(entry.id)
		if (entry.source !== "client" && entry.source !== "server") throw new Error(`${label}: unknown source ${entry.source}`)
		validateAssetPath(entry.assetPath, label)
		if (assetKind(entry) === "locres") validateLocresEntry(entry, label, locresEditIds)
		else validateUassetEntry(entry, label, uassetEditIds)
	}
	validateClassCoverage(entries)
}

function validateUassetEntry(entry: ManifestEntry, label: string, editIds: ReadonlySet<string>): void {
	if (!editIds.has(entry.edit)) throw new Error(`${label}: unknown edit id ${entry.edit}`)
	if (entry.edit === "classTable") validateClassSkillEntry(entry, label, (definition) => definition.tableAssetName)
	else if (entry.edit === "startLevelTable") validateClassSkillEntry(entry, label, (definition) => definition.startTableAssetName)
	else if (entry.edit === "rampNode") validateRampNodeEntry(entry, label)
	else if (entry.edit === "rampManager") validateRampManagerEntry(entry, label)
	else if (entry.params !== undefined && Object.keys(entry.params).length > 0) {
		throw new Error(`${label}: edit ${entry.edit} does not accept parameters`)
	}
}

function validateRampNodeEntry(entry: ManifestEntry, label: string): void {
	if (entry.params !== undefined) {
		throw new Error(`${label}: edit ${entry.edit} does not accept parameters`)
	}
}

function validateRampManagerEntry(entry: ManifestEntry, label: string): void {
	const params = entry.params
	if (params === undefined) throw new Error(`${label}: edit ${entry.edit} requires a ${RAMP_TIER_INCREMENT_PARAMETER} parameter`)
	const keys = Object.keys(params)
	if (keys.length !== 1 || !keys.includes(RAMP_TIER_INCREMENT_PARAMETER)) {
		throw new Error(`${label}: edit ${entry.edit} accepts only the ${RAMP_TIER_INCREMENT_PARAMETER} parameter`)
	}
	const raw = params[RAMP_TIER_INCREMENT_PARAMETER]
	if (raw === undefined) throw new Error(`${label}: edit ${entry.edit} requires a ${RAMP_TIER_INCREMENT_PARAMETER} parameter`)
	parseRampTierIncrement(raw)
}

function validateLocresEntry(entry: ManifestEntry, label: string, editIds: ReadonlySet<string>): void {
	if (!editIds.has(entry.edit)) throw new Error(`${label}: unknown locres edit id ${entry.edit}`)
	if (entry.params !== undefined && Object.keys(entry.params).length > 0) {
		throw new Error(`${label}: edit ${entry.edit} does not accept parameters`)
	}
}

function validateAssetPath(assetPath: string, label: string): void {
	if (assetPath.length === 0) throw new Error(`${label}: assetPath is empty`)
	if (assetPath.startsWith("/")) throw new Error(`${label}: assetPath must be relative`)
	if (assetPath.includes("\\")) throw new Error(`${label}: assetPath must use forward slashes`)
	if (assetPath.includes("..")) throw new Error(`${label}: assetPath must not contain ..`)
	if (assetPath.endsWith(".uasset") || assetPath.endsWith(".uexp") || assetPath.endsWith(".locres")) throw new Error(`${label}: assetPath must omit the extension`)
}

function validateClassSkillEntry(entry: ManifestEntry, label: string, expectedAssetName: (definition: ClassDefinition) => string): void {
	const definition = classDefinitionFromParams(entry.params ?? {})
	if (!entry.assetPath.endsWith(expectedAssetName(definition))) {
		throw new Error(`${label}: assetPath does not match ${expectedAssetName(definition)} for class ${definition.name}`)
	}
}

function validateClassCoverage(entries: readonly ManifestEntry[]): void {
	validateEditClassCoverage(entries, "classTable", (definition) => definition.tableAssetName)
	validateEditClassCoverage(entries, "startLevelTable", (definition) => definition.startTableAssetName)
}

function validateEditClassCoverage(entries: readonly ManifestEntry[], edit: string, expectedAssetName: (definition: ClassDefinition) => string): void {
	const names = entries
		.filter((entry) => entry.edit === edit)
		.map((entry) => entry.params?.className)
	if (new Set(names).size !== names.length) throw new Error(`manifest has duplicate ${edit} class names`)
	const present = new Set(names)
	for (const definition of CLASS_DEFINITIONS) {
		if (!present.has(definition.name)) throw new Error(`manifest is missing a ${edit} entry for ${definition.name}`)
	}
}
