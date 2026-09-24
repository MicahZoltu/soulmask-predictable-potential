// DT_GiftZongBiao: rewrite each class origin family's NGProfTypeList to the class skill set from DESIGN.md.
import { type AssetFile, ensureNameMapEntry, findDataTable, findRow, parseAssetProperty, readArray, readEnum, rowField } from "./assetAccess"
import { fnameByteProperty } from "./propertyFactory"
import { classDefinition } from "../pure/classSets"
import { ORIGIN_CLASS_DEFINITIONS, starRowIdsForFamily } from "../pure/talents"

const PROFICIENCY_PREFIX = "EProficiency::"

function expectedEnumNames(className: string): readonly string[] {
	return classDefinition(className).skills.map((skill) => `${PROFICIENCY_PREFIX}${skill}`)
}

function actualEnumNames(asset: AssetFile, rowName: string): readonly string[] {
	const table = findDataTable(asset)
	const row = findRow(table, rowName)
	return readArray(rowField(row, "NGProfTypeList"), `row ${rowName}`).map((entry, index) => {
		const property = parseAssetProperty(entry, `row ${rowName}.NGProfTypeList[${index}]`)
		return readEnum(property, `row ${rowName}`)
	})
}

export function applyOriginTalentRows(asset: AssetFile): void {
	const table = findDataTable(asset)
	for (const definition of ORIGIN_CLASS_DEFINITIONS) {
		const expected = expectedEnumNames(definition.name)
		for (const starRowId of starRowIdsForFamily(definition.family)) {
			const row = findRow(table, String(starRowId))
			const list = rowField(row, "NGProfTypeList")
			list.Value = expected.map((enumValue, index) => {
				ensureNameMapEntry(asset, enumValue)
				return fnameByteProperty(String(index), enumValue)
			})
		}
	}
}

export function verifyOriginTalentRows(asset: AssetFile): void {
	for (const definition of ORIGIN_CLASS_DEFINITIONS) {
		const expected = expectedEnumNames(definition.name)
		for (const starRowId of starRowIdsForFamily(definition.family)) {
			const actual = actualEnumNames(asset, String(starRowId))
			if (actual.length !== expected.length) {
				throw new Error(`origin row ${starRowId}: ${actual.length} proficiencies, expected ${expected.length}`)
			}
			for (const [index, enumValue] of actual.entries()) {
				if (enumValue !== expected[index]) {
					throw new Error(`origin row ${starRowId}[${index}] = ${enumValue}, expected ${expected[index]}`)
				}
			}
		}
	}
}
