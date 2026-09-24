// DT_CustomizeNPC and its Shifting Sands mirror DT_CustomizeNPC_Egypt: clear the archetype caps, seeded talents, and seeded title so no personality seed, base or DLC, can change a recruit.
import { type AssetFile, findDataTable, readNumber, rowField } from "./assetAccess"

export function applyArchetypeTable(asset: AssetFile): void {
	const table = findDataTable(asset)
	for (const row of table.rows) {
		rowField(row, "CustomizeProfMaxLv").Value = []
		rowField(row, "CustomizeNGMap").Value = []
		rowField(row, "CustomizeChengHaoClass").Value = 0
	}
}

export function verifyArchetypeTable(asset: AssetFile): void {
	const table = findDataTable(asset)
	for (const row of table.rows) {
		const capMap = rowField(row, "CustomizeProfMaxLv")
		if (!Array.isArray(capMap.Value) || capMap.Value.length !== 0) {
			throw new Error(`archetype row ${row.Name}: CustomizeProfMaxLv is not empty`)
		}
		const giftMap = rowField(row, "CustomizeNGMap")
		if (!Array.isArray(giftMap.Value) || giftMap.Value.length !== 0) {
			throw new Error(`archetype row ${row.Name}: CustomizeNGMap is not empty`)
		}
		const title = rowField(row, "CustomizeChengHaoClass")
		if (readNumber(title, `archetype row ${row.Name}`) !== 0) {
			throw new Error(`archetype row ${row.Name}: CustomizeChengHaoClass is not null`)
		}
	}
}
