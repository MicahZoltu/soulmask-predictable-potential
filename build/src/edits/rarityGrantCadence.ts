// DT_PinZhiGoodNGAddPr: quality 3-5 grant exactly one level-1 class talent, quality 0-2 keep the cadence loop running at level 1 but grant nothing.
import { type AssetFile, type AssetProperty, type JsonValue, findDataTable, parseAssetProperty, readArray, readNumber, readNumeric, rowField } from "./assetAccess"
import { floatProperty, intProperty, structProperty } from "./propertyFactory"
import {
	GRANT_COUNT,
	GRANT_LEVEL_KEY,
	GRANT_PR,
	NO_GRANT_COUNT,
	NO_GRANT_PR,
	qualityGrantsClassTalent,
} from "../pure/talents"

function cadencePair(level: number, pr: number, count: number): JsonValue {
	return [
		intProperty("LevelGoodNGPrMap", level),
		structProperty("LevelGoodNGPrMap", "Generic", [floatProperty("Pr", pr), intProperty("Count", count)]),
	]
}

function readPrCount(value: JsonValue, label: string): { pr: number; count: number } {
	const struct = parseAssetProperty(value, label)
	const fields = struct.Value
	if (!Array.isArray(fields)) throw new Error(`${label}: expected a struct value`)
	const pr = parseAssetProperty(fields.find((candidate) => isNamed(candidate, "Pr")), `${label}.Pr`)
	const count = parseAssetProperty(fields.find((candidate) => isNamed(candidate, "Count")), `${label}.Count`)
	return { pr: readNumeric(pr, label), count: readNumber(count, label) }
}

function isNamed(candidate: unknown, name: string): boolean {
	return typeof candidate === "object" && candidate !== null && "Name" in candidate && candidate.Name === name
}

// A settled cadence is a single level-1 entry, so verification reads the one pair rather than tolerating a longer map.
function readSingleCadence(cadence: AssetProperty, label: string): { level: number; pr: number; count: number } {
	const pairs = readArray(cadence, label)
	if (pairs.length !== 1) throw new Error(`${label}: ${pairs.length} cadence entries, expected 1`)
	const pair = pairs[0]
	if (!Array.isArray(pair) || pair.length !== 2) throw new Error(`${label}: expected a key/value pair`)
	const level = readNumber(parseAssetProperty(pair[0], `${label}.key`), label)
	return { level, ...readPrCount(pair[1], label) }
}

export function applyRarityGrantCadence(asset: AssetFile): void {
	const table = findDataTable(asset)
	for (const row of table.rows) {
		const cadence = rowField(row, "LevelGoodNGPrMap")
		if (qualityGrantsClassTalent(row.Name)) {
			cadence.Value = [cadencePair(GRANT_LEVEL_KEY, GRANT_PR, GRANT_COUNT)]
			continue
		}
		cadence.Value = [cadencePair(GRANT_LEVEL_KEY, NO_GRANT_PR, NO_GRANT_COUNT)]
	}
}

export function verifyRarityGrantCadence(asset: AssetFile): void {
	const table = findDataTable(asset)
	for (const row of table.rows) {
		const label = `row ${row.Name}`
		const { level, pr, count } = readSingleCadence(rowField(row, "LevelGoodNGPrMap"), label)
		if (level !== GRANT_LEVEL_KEY) throw new Error(`${label}: level ${level} entry, expected level ${GRANT_LEVEL_KEY}`)
		if (qualityGrantsClassTalent(row.Name)) {
			if (pr !== GRANT_PR || count !== GRANT_COUNT) throw new Error(`${label}: level-1 grant ${pr}/${count}`)
			continue
		}
		if (pr !== NO_GRANT_PR || count !== NO_GRANT_COUNT) throw new Error(`${label}: level-1 no-grant ${pr}/${count}`)
	}
}
