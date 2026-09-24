// DT_ZhuanJingSLD: every mastery threshold grants on the first attempt while each JiNengChi pool keeps its shipped entries.
import {
	type AssetFile,
	type AssetProperty,
	findAssetProperty,
	findDataTable,
	parseMapEntries,
	rowField,
	setNumber,
} from "./assetAccess"

const MASTERY_RATE = 1.0

function setMapFloatValues(property: AssetProperty, label: string): number {
	let count = 0
	for (const entry of parseMapEntries(property, label)) {
		setNumber(entry.value, MASTERY_RATE)
		count += 1
	}
	return count
}

function setSldRates(property: AssetProperty, label: string): number {
	let count = 0
	for (const entry of parseMapEntries(property, label)) {
		const fields = entry.value.Value
		if (!Array.isArray(fields)) throw new Error(`${label}.SLDGaiLv entry is not a struct`)
		setNumber(findAssetProperty(fields, "GaiLv", label), MASTERY_RATE)
		count += 1
	}
	return count
}

export function applyMasteryTable(asset: AssetFile): void {
	const table = findDataTable(asset)
	for (const row of table.rows) {
		setMapFloatValues(rowField(row, "PinZhiGaiLv"), `row ${row.Name}`)
		setSldRates(rowField(row, "SLDGaiLv"), `row ${row.Name}`)
	}
}

export function verifyMasteryTable(asset: AssetFile): void {
	const table = findDataTable(asset)
	for (const row of table.rows) {
		for (const entry of parseMapEntries(rowField(row, "PinZhiGaiLv"), `row ${row.Name}`)) {
			if (entry.value.Value !== MASTERY_RATE) {
				throw new Error(`mastery row ${row.Name}: PinZhiGaiLv value ${String(entry.value.Value)}`)
			}
		}
		for (const entry of parseMapEntries(rowField(row, "SLDGaiLv"), `row ${row.Name}`)) {
			const fields = entry.value.Value
			if (!Array.isArray(fields)) throw new Error(`mastery row ${row.Name}: SLDGaiLv entry is not a struct`)
			const gaiLv = findAssetProperty(fields, "GaiLv", `row ${row.Name}`)
			if (gaiLv.Value !== MASTERY_RATE) throw new Error(`mastery row ${row.Name}: GaiLv value ${String(gaiLv.Value)}`)
			const pool = findAssetProperty(fields, "JiNengChi", `row ${row.Name}`)
			if (!Array.isArray(pool.Value) || pool.Value.length === 0) {
				throw new Error(`mastery row ${row.Name}: JiNengChi pool was emptied`)
			}
		}
	}
}
