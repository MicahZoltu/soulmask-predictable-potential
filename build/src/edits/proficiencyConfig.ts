// BP_ProficiencyConfig: the settled cap base, clamp, starting curve, and clan-rank zeroing from DESIGN.md.
import {
	type AssetFile,
	type AssetProperty,
	type JsonValue,
	ensureNameMapEntry,
	exportData,
	findAssetProperty,
	findClassDefaultExport,
	findOptionalAssetProperty,
	parseAssetProperty,
	parseMapEntries,
	readNumber,
	setNumber,
} from "./assetAccess"
import { intProperty, structProperty } from "./propertyFactory"
import {
	buildStartingBands,
	NATIVE_START_FALLBACK,
	PROFICIENCY_CAP_BASE,
	PROFICIENCY_CAP_LOWER_LIMIT,
	PROFICIENCY_CAP_UPPER_LIMIT,
	type StartingBand,
} from "../pure/proficiency"

const CLASS_DEFAULT_OBJECT = "Default__BP_ProficiencyConfig_C"
const CAP_FIELDS = {
	ProfInitMaxLvlMin: PROFICIENCY_CAP_BASE,
	ProfInitMaxLvlMax: PROFICIENCY_CAP_BASE,
	ProfMaxLvlLowerLimit: PROFICIENCY_CAP_LOWER_LIMIT,
	ProfMaxLvlUpperLimit: PROFICIENCY_CAP_UPPER_LIMIT,
} as const
const NATIVE_FALLBACK_FIELDS = ["ProfInitLvlMin", "ProfInitLvlMax"] as const

function upsertInt(data: JsonValue[], name: string, value: number): void {
	const existing = findOptionalAssetProperty(data, name, "proficiency config")
	if (existing !== undefined) {
		setNumber(existing, value)
		return
	}
	data.push(intProperty(name, value))
}

function clanRangeFields(property: AssetProperty): JsonValue[] {
	const value = property.Value
	if (!Array.isArray(value)) throw new Error("ClanDiWeiProfInitLvlMap: rank value is not a struct")
	return value
}

export function applyProficiencyConfig(asset: AssetFile): void {
	for (const name of [...Object.keys(CAP_FIELDS), ...NATIVE_FALLBACK_FIELDS]) ensureNameMapEntry(asset, name)
	const classDefaultObject = findClassDefaultExport(asset, CLASS_DEFAULT_OBJECT)
	const data = exportData(classDefaultObject, CLASS_DEFAULT_OBJECT)

	for (const [name, value] of Object.entries(CAP_FIELDS)) upsertInt(data, name, value)
	for (const name of NATIVE_FALLBACK_FIELDS) upsertInt(data, name, NATIVE_START_FALLBACK)

	const levelList = findAssetProperty(data, "JueSeLvlProfLvlList", CLASS_DEFAULT_OBJECT)
	levelList.Value = buildStartingBands().map((band) => startingBandProperty(band))

	const clanMap = findAssetProperty(data, "ClanDiWeiProfInitLvlMap", CLASS_DEFAULT_OBJECT)
	for (const entry of parseMapEntries(clanMap, CLASS_DEFAULT_OBJECT)) {
		for (const fieldName of NATIVE_FALLBACK_FIELDS) {
			const field = findAssetProperty(clanRangeFields(entry.value), fieldName, CLASS_DEFAULT_OBJECT)
			setNumber(field, 0)
		}
	}
}

function startingBandProperty(band: StartingBand): JsonValue {
	return structProperty("JueSeLvlProfLvlList", "JueSeLvlProfInitLvl", [
		intProperty("JueSeLvlMin", band.minLevel),
		intProperty("JueSeLvlMax", band.maxLevel),
		intProperty("ProfInitLvlMin", band.value),
		intProperty("ProfInitLvlMax", band.value),
	])
}

export function verifyProficiencyConfig(asset: AssetFile): void {
	for (const name of [...Object.keys(CAP_FIELDS), ...NATIVE_FALLBACK_FIELDS]) {
		if (!asset.NameMap.includes(name)) throw new Error(`proficiency config NameMap is missing ${name}`)
	}
	const classDefaultObject = findClassDefaultExport(asset, CLASS_DEFAULT_OBJECT)
	const data = exportData(classDefaultObject, CLASS_DEFAULT_OBJECT)

	for (const [name, expected] of Object.entries(CAP_FIELDS)) {
		const actual = readNumber(findAssetProperty(data, name, CLASS_DEFAULT_OBJECT), CLASS_DEFAULT_OBJECT)
		if (actual !== expected) throw new Error(`proficiency config ${name} = ${actual}, expected ${expected}`)
	}
	for (const name of NATIVE_FALLBACK_FIELDS) {
		const actual = readNumber(findAssetProperty(data, name, CLASS_DEFAULT_OBJECT), CLASS_DEFAULT_OBJECT)
		if (actual !== NATIVE_START_FALLBACK) throw new Error(`proficiency config ${name} = ${actual}, expected ${NATIVE_START_FALLBACK}`)
	}

	const expectedBands = buildStartingBands()
	const levelList = findAssetProperty(data, "JueSeLvlProfLvlList", CLASS_DEFAULT_OBJECT)
	const levelValue = levelList.Value
	if (!Array.isArray(levelValue)) throw new Error("proficiency config JueSeLvlProfLvlList is not an array")
	if (levelValue.length !== expectedBands.length) {
		throw new Error(`proficiency config has ${levelValue.length} starting bands, expected ${expectedBands.length}`)
	}
	for (const [index, expected] of expectedBands.entries()) {
		const band = parseAssetProperty(levelValue[index], `band ${index}`)
		const fields = band.Value
		if (!Array.isArray(fields)) throw new Error(`proficiency config band ${index} is not a struct`)
		const read = (name: string): number => readNumber(findAssetProperty(fields, name, `band ${index}`), `band ${index}`)
		if (read("JueSeLvlMin") !== expected.minLevel || read("JueSeLvlMax") !== expected.maxLevel) {
			throw new Error(`proficiency config band ${index} level range mismatch`)
		}
		if (read("ProfInitLvlMin") !== expected.value || read("ProfInitLvlMax") !== expected.value) {
			throw new Error(`proficiency config band ${index} value mismatch`)
		}
	}

	const clanMap = findAssetProperty(data, "ClanDiWeiProfInitLvlMap", CLASS_DEFAULT_OBJECT)
	for (const entry of parseMapEntries(clanMap, CLASS_DEFAULT_OBJECT)) {
		for (const fieldName of NATIVE_FALLBACK_FIELDS) {
			const field = findAssetProperty(clanRangeFields(entry.value), fieldName, CLASS_DEFAULT_OBJECT)
			if (readNumber(field, CLASS_DEFAULT_OBJECT) !== 0) throw new Error(`clan rank ${entry.key.EnumValue} has a nonzero ${fieldName}`)
		}
	}
}
