// DT_GiftXiHaoBiao: retire the gear-preference rows so no permanent mood is tied to an issued loadout, and keep every remaining row's mood-only likes and aversions.
import { type AssetFile, findDataTable, readArray, replaceRows, rowField } from "./assetAccess"
import { GEAR_PREFERENCE_ROWS } from "../pure/talents"

export function applyPreferencePool(asset: AssetFile): void {
	const table = findDataTable(asset)
	const present = new Set(table.rows.map((row) => row.Name))
	for (const rowName of GEAR_PREFERENCE_ROWS) {
		if (!present.has(rowName)) throw new Error(`preference pool: missing gear row ${rowName}`)
	}
	const removed = new Set<string>(GEAR_PREFERENCE_ROWS)
	replaceRows(table, table.rows.filter((row) => !removed.has(row.Name)))
}

export function verifyPreferencePool(asset: AssetFile): void {
	const table = findDataTable(asset)
	if (table.rows.length === 0) throw new Error("preference pool: no preference rows remain")
	const removed = new Set<string>(GEAR_PREFERENCE_ROWS)
	for (const row of table.rows) {
		if (removed.has(row.Name)) throw new Error(`preference pool: gear row ${row.Name} was not removed`)
		const details = readArray(rowField(row, "NGDetailList"), row.Name)
		if (details.length === 0) throw new Error(`preference pool: row ${row.Name} has no details`)
	}
}
