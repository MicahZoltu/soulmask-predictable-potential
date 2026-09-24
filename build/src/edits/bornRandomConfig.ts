// BP_ManRenRandomConfig: guarantee each class its star-III origin, grant one settled tribal talent per tribe, and make Battle-Tested universal at star III.
import {
	type AssetFile,
	type AssetProperty,
	type JsonValue,
	type MapEntry,
	exportData,
	findAssetProperty,
	findClassDefaultExport,
	importObjectName,
	parseAssetProperty,
	parseMapEntries,
	readArray,
	readBoolean,
	readNumber,
	readObjectIndex,
	readString,
	setBoolean,
	setNumber,
	structField,
} from "./assetAccess"
import { cloneJson } from "./propertyFactory"
import {
	BATTLE_TESTED_PINNED_WEIGHT,
	BATTLE_TESTED_STAR_III,
	ORIGIN_CLASS_DEFINITIONS,
	TRIBE_DEFINITIONS,
	TRIBE_PINNED_WEIGHT,
	TRIBE_REGION_GATE_BLUEPRINT,
	TRIBE_REGION_GATE_PREFIX,
	type TribeDefinition,
	familyForRowId,
	isStarThreeRowId,
	originClassForGate,
	starRowIdsForFamily,
	tribeStarThreeRowIds,
} from "../pure/talents"

const LABEL = "BP_ManRenRandomConfig"
const CLASS_DEFAULT_OBJECT = "Default__BP_ManRenRandomConfig_C"
const ORIGIN_WEIGHT = 100
const BATTLE_TESTED_UNPINNED_WEIGHT = 0
const TITLE_LISTS = ["BornCommonChengHaoList", "BornTiaoJianChengHaoList"] as const

function conditionBlueprints(asset: AssetFile, entry: AssetProperty, label: string): readonly string[] {
	const conditions = structField(entry, "TiaoJianList", label)
	return readArray(conditions, label).map((candidate, index) => {
		const property = parseAssetProperty(candidate, `${label}.TiaoJianList[${index}]`)
		return importObjectName(asset, readObjectIndex(property, label), label)
	})
}

interface RandomNg {
	id: number
	weight: number
	isGood: boolean
}

function readRandomNg(struct: AssetProperty, label: string): RandomNg {
	return {
		id: readNumber(structField(struct, "NGID", label), label),
		weight: readNumber(structField(struct, "NGQuanZhong", label), label),
		isGood: readBoolean(structField(struct, "IsGoodNG", label), label),
	}
}

function writeRandomNg(templateValue: JsonValue, id: number, weight: number): JsonValue {
	const struct = parseAssetProperty(cloneJson(templateValue), LABEL)
	setNumber(structField(struct, "NGID", LABEL), id)
	setNumber(structField(struct, "NGQuanZhong", LABEL), weight)
	setBoolean(structField(struct, "IsGoodNG", LABEL), true)
	return struct
}

function randomNgList(entry: AssetProperty, label: string): JsonValue[] {
	return readArray(structField(entry, "NGIDList", label), label)
}

function applyOriginGrants(asset: AssetFile, data: JsonValue[]): void {
	const list = findAssetProperty(data, "BornChuShenCiTiaoList", LABEL)
	for (const [index, candidate] of readArray(list, LABEL).entries()) {
		const entry = parseAssetProperty(candidate, `${LABEL}.BornChuShenCiTiaoList[${index}]`)
		const gates = conditionBlueprints(asset, entry, LABEL)
		const definition = ORIGIN_CLASS_DEFINITIONS.find((origin) => gates.includes(origin.gateBlueprint))
		if (definition === undefined) {
			throw new Error(`origin entry ${index}: no class gate among ${gates.join(", ")}`)
		}
		const template = randomNgList(entry, LABEL)[0]
		if (template === undefined) throw new Error(`origin entry ${index}: empty NGIDList`)
		const starThree = starRowIdsForFamily(definition.family)[2]
		structField(entry, "NGIDList", LABEL).Value = [writeRandomNg(template, starThree, ORIGIN_WEIGHT)]
	}
}

function regionEntries(asset: AssetFile, value: AssetProperty, label: string): AssetProperty[] {
	const ciTiaoList = structField(value, "CiTiaoList", label)
	return readArray(ciTiaoList, label)
		.map((candidate, index) => parseAssetProperty(candidate, `${label}.CiTiaoList[${index}]`))
		.filter((entry) => conditionBlueprints(asset, entry, label).some((gate) => gate.startsWith(TRIBE_REGION_GATE_PREFIX)))
}

function findRegionEntry(asset: AssetFile, value: AssetProperty, blueprint: string, label: string): AssetProperty | undefined {
	return regionEntries(asset, value, label).find((entry) => conditionBlueprints(asset, entry, label).includes(blueprint))
}

function regionNgids(entry: AssetProperty, label: string): RandomNg[] {
	return randomNgList(entry, label).map((value, index) => readRandomNg(parseAssetProperty(value, `${label}[${index}]`), label))
}

function buildTribeNgidList(templateValue: JsonValue, families: readonly number[]): JsonValue[] {
	return tribeStarThreeRowIds(families).map((id) => writeRandomNg(templateValue, id, TRIBE_PINNED_WEIGHT))
}

function buildPinnedNgidList(templateValue: JsonValue, existingIds: readonly number[], label: string): JsonValue[] {
	const families: number[] = []
	for (const id of existingIds) {
		const family = familyForRowId(id)
		if (!families.includes(family)) families.push(family)
	}
	if (families.length === 0) throw new Error(`${label}: no family among ${existingIds.join(", ")}`)
	return families.map((family) => writeRandomNg(templateValue, starRowIdsForFamily(family)[2], TRIBE_PINNED_WEIGHT))
}

function titleList(data: JsonValue[], name: string): AssetProperty {
	return structField(findAssetProperty(data, name, LABEL), "ChengHaoList", LABEL)
}

function applyTitleSuppression(data: JsonValue[]): void {
	const rateMap = findAssetProperty(data, "BornGetChengHaoRateMap", LABEL)
	for (const entry of parseMapEntries(rateMap, LABEL)) {
		setNumber(entry.value, 0)
	}
	for (const name of TITLE_LISTS) {
		const list = titleList(data, name)
		const entries = readArray(list, LABEL)
		// UAssetAPI cannot serialize an empty struct array without a recorded element type, so the shipped first element is kept only as DummyStruct.
		const template = entries[0]
		if (template !== undefined) list.DummyStruct = cloneJson(template)
		list.Value = []
	}
}

function writeHomeRegion(definition: TribeDefinition, home: AssetProperty, label: string): void {
	const template = randomNgList(home, label)[0]
	if (template === undefined) throw new Error(`${label}: empty QuYu_0 NGIDList`)
	structField(home, "NGIDList", label).Value = buildTribeNgidList(template, definition.families)
}

// Each design tribe draws its settled families from the `QuYu_0` home entry; Outcast ships without one, so a previously seen design tribe's entry is cloned and appended for it.
function applyHomeRegions(asset: AssetFile, mapEntries: readonly MapEntry[]): void {
	let regionTemplate: AssetProperty | undefined
	for (const definition of TRIBE_DEFINITIONS) {
		const entry = mapEntries.find((candidate) => readString(candidate.key, LABEL) === definition.clanType)
		if (entry === undefined) throw new Error(`BornBuLuoCiTiaoMap: missing clan type ${definition.clanType}`)
		const home = findRegionEntry(asset, entry.value, TRIBE_REGION_GATE_BLUEPRINT, definition.clanType)
		if (home !== undefined) {
			writeHomeRegion(definition, home, definition.clanType)
			regionTemplate = home
			continue
		}
		if (regionTemplate === undefined) throw new Error(`BornBuLuoCiTiaoMap ${definition.clanType}: no QuYu_0 entry and no design entry to clone`)
		const cloned = parseAssetProperty(cloneJson(regionTemplate), `${definition.clanType}.QuYu_0`)
		readArray(structField(entry.value, "CiTiaoList", LABEL), LABEL).push(cloned)
		writeHomeRegion(definition, cloned, definition.clanType)
	}
}

// Biome and DLC entries keep whatever families they ship; only the star tier is collapsed to III at the pinned weight.
function applyRegionTiers(asset: AssetFile, mapEntries: readonly MapEntry[]): void {
	for (const entry of mapEntries) {
		const clanType = readString(entry.key, LABEL)
		const regions = regionEntries(asset, entry.value, clanType)
		if (regions.length === 0) throw new Error(`BornBuLuoCiTiaoMap ${clanType}: no region entry`)
		for (const [index, region] of regions.entries()) {
			const label = `${clanType} region ${index}`
			const template = randomNgList(region, LABEL)[0]
			if (template === undefined) throw new Error(`${label}: empty NGIDList`)
			const existingIds = regionNgids(region, label).map((ng) => ng.id)
			structField(region, "NGIDList", LABEL).Value = buildPinnedNgidList(template, existingIds, label)
		}
	}
}

function applyTribeGrants(asset: AssetFile, data: JsonValue[]): void {
	const map = findAssetProperty(data, "BornBuLuoCiTiaoMap", LABEL)
	const mapEntries = parseMapEntries(map, LABEL)
	applyHomeRegions(asset, mapEntries)
	applyRegionTiers(asset, mapEntries)
}

function applyBattleTested(asset: AssetFile, data: JsonValue[]): void {
	const map = findAssetProperty(data, "BornJingLiCiTiaoMap", LABEL)
	for (const entry of parseMapEntries(map, LABEL)) {
		structField(entry.value, "TiaoJianList", LABEL).Value = []
		const ngidList = structField(entry.value, "NGIDList", LABEL)
		for (const [index, candidate] of readArray(ngidList, LABEL).entries()) {
			const struct = parseAssetProperty(candidate, `${LABEL}.BornJingLiCiTiaoMap[${index}]`)
			const { id } = readRandomNg(struct, LABEL)
			setNumber(structField(struct, "NGQuanZhong", LABEL), id === BATTLE_TESTED_STAR_III ? BATTLE_TESTED_PINNED_WEIGHT : BATTLE_TESTED_UNPINNED_WEIGHT)
		}
	}
}

export function applyBornRandomConfig(asset: AssetFile): void {
	const classDefaultObject = findClassDefaultExport(asset, CLASS_DEFAULT_OBJECT)
	const data = exportData(classDefaultObject, CLASS_DEFAULT_OBJECT)
	applyOriginGrants(asset, data)
	applyTribeGrants(asset, data)
	applyBattleTested(asset, data)
	applyTitleSuppression(data)
}

function verifyOriginGrants(asset: AssetFile, data: JsonValue[]): void {
	const list = findAssetProperty(data, "BornChuShenCiTiaoList", LABEL)
	const seen = new Set<string>()
	for (const [index, candidate] of readArray(list, LABEL).entries()) {
		const entry = parseAssetProperty(candidate, `${LABEL}.BornChuShenCiTiaoList[${index}]`)
		const gates = conditionBlueprints(asset, entry, LABEL)
		const gate = gates.find((name) => ORIGIN_CLASS_DEFINITIONS.some((origin) => origin.gateBlueprint === name))
		if (gate === undefined) throw new Error(`origin entry ${index}: no class gate`)
		const definition = originClassForGate(gate)
		if (seen.has(definition.name)) throw new Error(`origin entry ${index}: duplicate class ${definition.name}`)
		seen.add(definition.name)
		const entries = randomNgList(entry, LABEL).map((value, itemIndex) => parseAssetProperty(value, `${LABEL}.origin[${itemIndex}]`))
		if (entries.length !== 1) throw new Error(`origin entry ${index}: ${entries.length} candidates, expected 1`)
		const expected = starRowIdsForFamily(definition.family)[2]
		const actual = entries[0]
		const { id, weight, isGood } = readRandomNg(actual, LABEL)
		if (id !== expected || weight !== ORIGIN_WEIGHT || !isGood) {
			throw new Error(`origin entry ${index}: ${id}/${weight}/${isGood}, expected ${expected}/${ORIGIN_WEIGHT}/true`)
		}
	}
	if (seen.size !== ORIGIN_CLASS_DEFINITIONS.length) throw new Error(`origin list covers ${seen.size} classes`)
}

function verifyTribeGrants(asset: AssetFile, data: JsonValue[]): void {
	const map = findAssetProperty(data, "BornBuLuoCiTiaoMap", LABEL)
	for (const entry of parseMapEntries(map, LABEL)) {
		const clanType = readString(entry.key, LABEL)
		const regions = regionEntries(asset, entry.value, clanType)
		if (regions.length === 0) throw new Error(`BornBuLuoCiTiaoMap ${clanType}: no region entry`)
		const definition = TRIBE_DEFINITIONS.find((candidate) => candidate.clanType === clanType)
		let sawHomeRegion = false
		for (const [regionIndex, region] of regions.entries()) {
			const label = `${clanType} region ${regionIndex}`
			const gates = conditionBlueprints(asset, region, label)
			const actual = regionNgids(region, label)
			if (actual.length === 0) throw new Error(`${label}: empty NGIDList`)
			for (const [index, candidate] of actual.entries()) {
				if (!isStarThreeRowId(candidate.id) || candidate.weight !== TRIBE_PINNED_WEIGHT || !candidate.isGood) {
					throw new Error(`${label}[${index}]: id ${candidate.id} weight ${candidate.weight} good ${candidate.isGood}, expected a star-III id at ${TRIBE_PINNED_WEIGHT}/true`)
				}
			}
			if (!gates.includes(TRIBE_REGION_GATE_BLUEPRINT)) continue
			sawHomeRegion = true
			if (definition === undefined) continue
			const expectedIds = tribeStarThreeRowIds(definition.families)
			if (actual.length !== expectedIds.length) throw new Error(`${label}: ${actual.length} tribal candidates, expected ${expectedIds.length}`)
			for (const [index, expected] of expectedIds.entries()) {
				const candidate = actual[index]
				if (candidate.id !== expected) throw new Error(`${label}[${index}]: id ${candidate.id}, expected ${expected}`)
			}
		}
		if (definition !== undefined && !sawHomeRegion) throw new Error(`BornBuLuoCiTiaoMap ${clanType}: no QuYu_0 entry`)
	}
}

function verifyBattleTested(asset: AssetFile, data: JsonValue[]): void {
	const map = findAssetProperty(data, "BornJingLiCiTiaoMap", LABEL)
	const entries = parseMapEntries(map, LABEL)
	if (entries.length === 0) throw new Error("BornJingLiCiTiaoMap is empty")
	for (const entry of entries) {
		const conditions = readArray(structField(entry.value, "TiaoJianList", LABEL), LABEL)
		if (conditions.length !== 0) throw new Error(`BornJingLiCiTiaoMap ${readString(entry.key, LABEL)}: TiaoJianList is not empty`)
		const ngidList = randomNgList(entry.value, LABEL).map((value, index) => readRandomNg(parseAssetProperty(value, `${LABEL}.battleTested[${index}]`), LABEL))
		if (ngidList.length === 0) throw new Error(`BornJingLiCiTiaoMap ${readString(entry.key, LABEL)}: empty NGIDList`)
		for (const candidate of ngidList) {
			const expected = candidate.id === BATTLE_TESTED_STAR_III ? BATTLE_TESTED_PINNED_WEIGHT : BATTLE_TESTED_UNPINNED_WEIGHT
			if (candidate.weight !== expected) {
				throw new Error(`BornJingLiCiTiaoMap ${readString(entry.key, LABEL)}: id ${candidate.id} weight ${candidate.weight}, expected ${expected}`)
			}
		}
	}
}

function verifyTitleSuppression(data: JsonValue[]): void {
	const rateMap = findAssetProperty(data, "BornGetChengHaoRateMap", LABEL)
	for (const entry of parseMapEntries(rateMap, LABEL)) {
		const rate = readNumber(entry.value, LABEL)
		if (rate !== 0) throw new Error(`BornGetChengHaoRateMap ${readNumber(entry.key, LABEL)}: rate ${rate}, expected 0`)
	}
	for (const name of TITLE_LISTS) {
		const list = titleList(data, name)
		if (readArray(list, LABEL).length !== 0) throw new Error(`${name}: title list is not empty`)
	}
}

export function verifyBornRandomConfig(asset: AssetFile): void {
	const classDefaultObject = findClassDefaultExport(asset, CLASS_DEFAULT_OBJECT)
	const data = exportData(classDefaultObject, CLASS_DEFAULT_OBJECT)
	verifyOriginGrants(asset, data)
	verifyTribeGrants(asset, data)
	verifyBattleTested(asset, data)
	verifyTitleSuppression(data)
}
