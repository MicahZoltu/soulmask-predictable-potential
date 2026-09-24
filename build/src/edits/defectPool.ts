// DT_GiftFuMiann: remove every defect row so the defect selector has no family to draw.
import { type AssetFile, findDataTable, replaceRows } from "./assetAccess"

export function applyDefectPool(asset: AssetFile): void {
	const table = findDataTable(asset)
	if (table.rows.length === 0) throw new Error("defect pool: table is already empty")
	replaceRows(table, [])
}

export function verifyDefectPool(asset: AssetFile): void {
	const table = findDataTable(asset)
	if (table.rows.length !== 0) throw new Error(`defect pool: ${table.rows.length} rows remain`)
}
