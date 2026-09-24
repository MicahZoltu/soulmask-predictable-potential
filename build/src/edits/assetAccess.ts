// Typed, validating accessors over the JSON that the UAssetAPI .NET wrapper emits.
// The parsed asset is external data, so every field this pipeline relies on is checked before use and a mismatch fails fast with a path.

export type JsonPrimitive = string | number | boolean | null
export type JsonValue = JsonPrimitive | JsonObject | JsonValue[]
export interface JsonObject {
	[key: string]: JsonValue
}

export function isJsonObject(value: unknown): value is JsonObject {
	return typeof value === "object" && value !== null && !Array.isArray(value)
}

export function parseJsonObject(value: unknown, label: string): JsonObject {
	if (!isJsonObject(value)) throw new Error(`${label}: expected an object`)
	return value
}

export interface AssetFile {
	NameMap: string[]
	Exports: JsonObject[]
	[key: string]: JsonValue
}

function parseNameMap(value: unknown): string[] {
	if (!Array.isArray(value)) throw new Error("asset: NameMap is not an array")
	return value.map((entry, index) => {
		if (typeof entry !== "string") throw new Error(`asset: NameMap[${index}] is not a string`)
		return entry
	})
}

function parseExports(value: unknown): JsonObject[] {
	if (!Array.isArray(value)) throw new Error("asset: Exports is not an array")
	return value.map((entry, index) => parseJsonObject(entry, `asset.Exports[${index}]`))
}

export function parseAssetFile(value: unknown): AssetFile {
	const object = parseJsonObject(value, "asset")
	return {
		...object,
		NameMap: parseNameMap(object.NameMap),
		Exports: parseExports(object.Exports),
	}
}

export function ensureNameMapEntry(asset: AssetFile, name: string): void {
	if (!asset.NameMap.includes(name)) asset.NameMap.push(name)
}

export interface AssetProperty extends JsonObject {
	Name: string
}

export function isAssetProperty(value: unknown): value is AssetProperty {
	return isJsonObject(value) && typeof value.Name === "string"
}

export function parseAssetProperty(value: unknown, label: string): AssetProperty {
	if (!isAssetProperty(value)) throw new Error(`${label}: expected a property with a string Name`)
	return value
}

export interface AssetRow extends JsonObject {
	Name: string
	Value: JsonValue[]
}

export function isAssetRow(value: unknown): value is AssetRow {
	return isJsonObject(value) && typeof value.Name === "string" && Array.isArray(value.Value)
}

export function parseAssetRow(value: unknown, label: string): AssetRow {
	if (!isAssetRow(value)) throw new Error(`${label}: expected a row with a string Name and an array Value`)
	return value
}

export function findAssetProperty(properties: JsonValue[], name: string, label: string): AssetProperty {
	for (const candidate of properties) {
		const property = parseAssetProperty(candidate, `${label}.${name}`)
		if (property.Name === name) return property
	}
	throw new Error(`${label}: missing property ${name}`)
}

export function findOptionalAssetProperty(properties: JsonValue[], name: string, label: string): AssetProperty | undefined {
	for (const candidate of properties) {
		if (!isAssetProperty(candidate)) continue
		if (candidate.Name === name) return candidate
	}
	return undefined
}

export function rowField(row: AssetRow, name: string): AssetProperty {
	return findAssetProperty(row.Value, name, `row ${row.Name}`)
}

// A struct-valued property carries its fields as a Name-keyed array in Value; the gift detail structs share this shape, so the lookup lives here rather than in each gift table edit.
export function findStructField(value: JsonValue, name: string, label: string): AssetProperty {
	if (!Array.isArray(value)) throw new Error(`${label}: expected a struct value`)
	for (const candidate of value) {
		if (isJsonObject(candidate) && candidate.Name === name) return parseAssetProperty(candidate, `${label}.${name}`)
	}
	throw new Error(`${label}: missing struct field ${name}`)
}

export function readStructFields(struct: AssetProperty, label: string): JsonValue[] {
	const value = struct.Value
	if (!Array.isArray(value)) throw new Error(`${label}: expected a struct value`)
	return value
}

export function structField(struct: AssetProperty, name: string, label: string): AssetProperty {
	return findAssetProperty(readStructFields(struct, label), name, label)
}

export function readNumber(property: AssetProperty, label: string): number {
	const value = property.Value
	if (typeof value !== "number") throw new Error(`${label}.${property.Name}: expected a number`)
	return value
}

// The round-trip wrapper emits float values as numbers, but the reparsing wrapper emits them as strings, so a float reader must accept both.
export function readNumeric(property: AssetProperty, label: string): number {
	const value = property.Value
	if (typeof value === "number") return value
	if (typeof value === "string") {
		const parsed = Number(value)
		if (Number.isFinite(parsed)) return parsed
	}
	throw new Error(`${label}.${property.Name}: expected a number`)
}

export function readString(property: AssetProperty, label: string): string {
	const value = property.Value
	if (typeof value !== "string") throw new Error(`${label}.${property.Name}: expected a string`)
	return value
}

export function readEnum(property: AssetProperty, label: string): string {
	const value = property.EnumValue
	if (typeof value !== "string") throw new Error(`${label}.${property.Name}: expected an enum value`)
	return value
}

export function readBoolean(property: AssetProperty, label: string): boolean {
	const value = property.Value
	if (typeof value !== "boolean") throw new Error(`${label}.${property.Name}: expected a boolean`)
	return value
}

export function readArray(property: AssetProperty, label: string): JsonValue[] {
	const value = property.Value
	if (!Array.isArray(value)) throw new Error(`${label}.${property.Name}: expected an array`)
	return value
}

export function readObjectIndex(property: AssetProperty, label: string): number {
	const value = property.Value
	if (typeof value !== "number") throw new Error(`${label}.${property.Name}: expected an object index`)
	return value
}

// A condition bag is referenced by its import index, so the readable identity is the import's ObjectName.
export function importObjectName(asset: AssetFile, objectIndex: number, label: string): string {
	if (objectIndex >= 0) throw new Error(`${label}: expected an import index, got export index ${objectIndex}`)
	const imports = asset.Imports
	if (!Array.isArray(imports)) throw new Error("asset: Imports is not an array")
	const importIndex = -objectIndex - 1
	const importEntry = imports[importIndex]
	if (importEntry === undefined) throw new Error(`${label}: no import at index ${objectIndex}`)
	const parsed = parseJsonObject(importEntry, `${label}.Imports[${importIndex}]`)
	const objectName = parsed.ObjectName
	if (typeof objectName !== "string") throw new Error(`${label}: import ${importIndex} has no ObjectName`)
	return objectName
}

export function setNumber(property: AssetProperty, value: number): void {
	property.Value = value
}

export function setString(property: AssetProperty, value: string): void {
	property.Value = value
}

export function setBoolean(property: AssetProperty, value: boolean): void {
	property.Value = value
}

export interface DataTable {
	data: JsonValue[]
	rows: AssetRow[]
}

export function findDataTable(asset: AssetFile): DataTable {
	for (const [index, assetExport] of asset.Exports.entries()) {
		const table = assetExport.Table
		if (table === undefined) continue
		const tableObject = parseJsonObject(table, `asset.Exports[${index}].Table`)
		const rowsValue = tableObject.Data
		if (!Array.isArray(rowsValue)) throw new Error(`asset.Exports[${index}].Table.Data is not an array`)
		const rows = rowsValue.map((row, rowIndex) => parseAssetRow(row, `asset.Exports[${index}].Table.Data[${rowIndex}]`))
		return { data: rowsValue, rows }
	}
	throw new Error("asset: no DataTable export found")
}

export function replaceRows(table: DataTable, rows: JsonValue[]): void {
	table.data.splice(0, table.data.length, ...rows)
}

export function findRow(table: DataTable, name: string): AssetRow {
	const row = table.rows.find((candidate) => candidate.Name === name)
	if (row === undefined) throw new Error(`no row named ${name}`)
	return row
}

export function findClassDefaultExport(asset: AssetFile, objectName: string): JsonObject {
	const assetExport = asset.Exports.find((candidate) => candidate.ObjectName === objectName)
	if (assetExport === undefined) throw new Error(`missing export ${objectName}`)
	const data = assetExport.Data
	if (!Array.isArray(data)) throw new Error(`export ${objectName} has no typed Data array`)
	return assetExport
}

export function exportData(assetExport: JsonObject, label: string): JsonValue[] {
	const data = assetExport.Data
	if (!Array.isArray(data)) throw new Error(`${label}: expected a typed Data array`)
	return data
}

export function findFirstClassDefaultExport(asset: AssetFile): JsonObject {
	const assetExport = asset.Exports.find((candidate) => {
		const objectName = candidate.ObjectName
		return typeof objectName === "string" && objectName.startsWith("Default__") && Array.isArray(candidate.Data)
	})
	if (assetExport === undefined) throw new Error("asset: no class-default export with typed Data")
	return assetExport
}

export interface MapEntry {
	key: AssetProperty
	value: AssetProperty
}

export function parseMapEntries(property: AssetProperty, label: string): MapEntry[] {
	const value = property.Value
	if (!Array.isArray(value)) throw new Error(`${label}.${property.Name}: expected a map array`)
	return value.map((pair, index) => {
		if (!Array.isArray(pair) || pair.length !== 2) throw new Error(`${label}.${property.Name}[${index}]: expected a key/value pair`)
		return {
			key: parseAssetProperty(pair[0], `${label}.${property.Name}[${index}].key`),
			value: parseAssetProperty(pair[1], `${label}.${property.Name}[${index}].value`),
		}
	})
}
