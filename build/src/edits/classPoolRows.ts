// DT_GiftZhengMian and DT_GiftZhengMian_Custom: leave only one gated pool row per class, so a recruit can draw its own class family and nothing else.
import {
	type AssetFile,
	type AssetProperty,
	type AssetRow,
	type JsonValue,
	ensureNameMapEntry,
	findDataTable,
	findRow,
	findStructField,
	parseAssetProperty,
	parseJsonObject,
	readArray,
	readNumber,
	readString,
	replaceRows,
	rowField,
	setBoolean,
	setNumber,
	setString,
} from "./assetAccess"
import { cloneJson } from "./propertyFactory"
import { classGateBlueprint, classPoolDetailIds, classPoolFamilies, type GiftDetailId } from "../pure/talents"

// Each table names its class rows differently, so the row for each class is pinned explicitly.
const TABLE_CLASS_ROWS: Readonly<Record<string, Readonly<Record<string, string>>>> = {
	DT_GiftZhengMian: {
		Warrior: "130011-130041-130051-130061-130071-16069",
		Hunter: "15002-15008-15009-15011",
		Guard: "130011-130021-130031-130061-16089",
		Laborer: "16039-16040-16041",
		Porter: "16074-16076-16077-16078-16079",
		Craftsman: "16081-16082-16083-16086-16087-16073",
	},
	DT_GiftZhengMian_Custom: {
		Warrior: "130011-130041-130051-130061-130071",
		Hunter: "15002-15008-15009",
		Guard: "130011-130021-130031-130061",
		Porter: "130011-130021-130031-130051-130071",
		Craftsman: "16050-16052-16060-16013-16094",
		Laborer: "16008-16048-16058-16090-16065",
	},
}

function tableObjectName(asset: AssetFile): string {
	for (const [index, assetExport] of asset.Exports.entries()) {
		if (assetExport.Table === undefined) continue
		const objectName = assetExport.ObjectName
		if (typeof objectName !== "string") throw new Error(`asset.Exports[${index}]: table has no ObjectName`)
		return objectName
	}
	throw new Error("asset: no DataTable export found")
}

function classRowsFor(asset: AssetFile): Readonly<Record<string, string>> {
	const name = tableObjectName(asset)
	const rows = TABLE_CLASS_ROWS[name]
	if (rows === undefined) throw new Error(`class pool edit does not know table ${name}`)
	return rows
}

function ensureGateImport(asset: AssetFile, gateBlueprint: string): number {
	const imports = asset.Imports
	if (!Array.isArray(imports)) throw new Error("asset: Imports is not an array")
	for (const [index, candidate] of imports.entries()) {
		const parsed = parseJsonObject(candidate, `asset.Imports[${index}]`)
		if (parsed.ClassName !== "BlueprintGeneratedClass") continue
		if (parsed.ObjectName !== gateBlueprint) continue
		return -(index + 1)
	}
	if (!gateBlueprint.endsWith("_C")) throw new Error(`gate blueprint ${gateBlueprint} does not end in _C`)
	const packagePath = `/Game/Blueprints/GAS/TiaoJianBao/${gateBlueprint.slice(0, -2)}`
	for (const name of [gateBlueprint, `Default__${gateBlueprint}`, packagePath]) ensureNameMapEntry(asset, name)
	const base = imports.length
	const classIndex = base + 1
	const packageIndex = base + 3
	imports.push(
		{ $type: "UAssetAPI.Import, UAssetAPI", ObjectName: gateBlueprint, OuterIndex: -packageIndex, ClassPackage: "/Script/Engine", ClassName: "BlueprintGeneratedClass", PackageName: null, bImportOptional: false },
		{ $type: "UAssetAPI.Import, UAssetAPI", ObjectName: `Default__${gateBlueprint}`, OuterIndex: -classIndex, ClassPackage: packagePath, ClassName: gateBlueprint, PackageName: null, bImportOptional: false },
		{ $type: "UAssetAPI.Import, UAssetAPI", ObjectName: packagePath, OuterIndex: 0, ClassPackage: "/Script/CoreUObject", ClassName: "Package", PackageName: null, bImportOptional: false },
	)
	return -classIndex
}

function buildObjectCondition(importIndex: number): JsonValue {
	return {
		$type: "UAssetAPI.PropertyTypes.Objects.ObjectPropertyData, UAssetAPI",
		Name: "0",
		ArrayIndex: 0,
		PropertyGuid: null,
		IsZero: false,
		PropertyTagFlags: "None",
		PropertyTypeName: null,
		PropertyTagExtensions: "NoExtension",
		Value: importIndex,
	}
}

function setClassGate(asset: AssetFile, row: AssetRow, gateBlueprint: string): void {
	const gate = rowField(row, "TiaoJianBaoList")
	const importIndex = ensureGateImport(asset, gateBlueprint)
	gate.Value = [buildObjectCondition(importIndex)]
}

function detailField(detail: AssetProperty, name: string): AssetProperty {
	return findStructField(detail.Value, name, `detail ${detail.Name}`)
}

function detailNotes(rows: readonly AssetRow[]): ReadonlyMap<number, string> {
	const notes = new Map<number, string>()
	for (const row of rows) {
		for (const candidate of readArray(rowField(row, "NGDetailList"), row.Name)) {
			const detail = parseAssetProperty(candidate, `row ${row.Name}`)
			const type = readNumber(detailField(detail, "Type"), `row ${row.Name}`)
			if (notes.has(type)) continue
			notes.set(type, readString(detailField(detail, "NoteStr"), `row ${row.Name}`))
		}
	}
	return notes
}

function detailTemplate(rows: readonly AssetRow[]): JsonValue {
	for (const row of rows) {
		const details = readArray(rowField(row, "NGDetailList"), row.Name)
		if (details.length > 0) return details[0]
	}
	throw new Error("no existing gift detail to use as a template")
}

function buildDetail(template: JsonValue, detail: GiftDetailId, note: string): JsonValue {
	const struct = parseAssetProperty(cloneJson(template), `detail ${detail.id}`)
	setNumber(detailField(struct, "ID"), detail.id)
	setNumber(detailField(struct, "Type"), detail.type)
	setString(detailField(struct, "NoteStr"), note)
	setBoolean(detailField(struct, "IsGood"), true)
	return struct
}

function readDetailIds(row: AssetRow): readonly GiftDetailId[] {
	return readArray(rowField(row, "NGDetailList"), row.Name).map((candidate) => {
		const detail = parseAssetProperty(candidate, `row ${row.Name}`)
		return {
			type: readNumber(detailField(detail, "Type"), `row ${row.Name}`),
			id: readNumber(detailField(detail, "ID"), `row ${row.Name}`),
		}
	})
}

function detailEquals(actual: GiftDetailId, expected: GiftDetailId): boolean {
	return actual.type === expected.type && actual.id === expected.id
}

function readGateBlueprints(asset: AssetFile, row: AssetRow): readonly string[] {
	const gate = readArray(rowField(row, "TiaoJianBaoList"), row.Name)
	return gate.map((candidate, index) => {
		const condition = parseAssetProperty(candidate, `row ${row.Name}.TiaoJianBaoList[${index}]`)
		const importIndex = readNumber(condition, `row ${row.Name}`)
		if (importIndex >= 0) throw new Error(`row ${row.Name}: condition is not an import`)
		const imports = asset.Imports
		if (!Array.isArray(imports)) throw new Error("asset: Imports is not an array")
		const importEntry = imports[-importIndex - 1]
		if (importEntry === undefined) throw new Error(`row ${row.Name}: condition import is missing`)
		const parsed = parseJsonObject(importEntry, `row ${row.Name}.Imports`)
		const objectName = parsed.ObjectName
		if (typeof objectName !== "string") throw new Error(`row ${row.Name}: condition import has no ObjectName`)
		return objectName
	})
}

export function applyClassPoolRows(asset: AssetFile): void {
	const classRows = classRowsFor(asset)
	const table = findDataTable(asset)
	const notes = detailNotes(table.rows)
	const template = detailTemplate(table.rows)
	const kept: AssetRow[] = []
	for (const [className, rowName] of Object.entries(classRows)) {
		const row = findRow(table, rowName)
		setClassGate(asset, row, classGateBlueprint(className))
		rowField(row, "NGDetailList").Value = classPoolDetailIds(classPoolFamilies(className)).map((detail) => buildDetail(template, detail, notes.get(detail.type) ?? ""))
		kept.push(row)
	}
	replaceRows(table, kept)
}

export function verifyClassPoolRows(asset: AssetFile): void {
	const classRows = classRowsFor(asset)
	const table = findDataTable(asset)
	const byName = new Map(table.rows.map((row) => [row.Name, row]))
	if (byName.size !== table.rows.length) throw new Error("class pool: duplicate row names")
	if (table.rows.length !== Object.keys(classRows).length) throw new Error(`class pool: ${table.rows.length} rows, expected ${Object.keys(classRows).length}`)
	for (const [className, rowName] of Object.entries(classRows)) {
		const row = byName.get(rowName)
		if (row === undefined) throw new Error(`class pool: missing ${className} row ${rowName}`)
		const expectedGate = classGateBlueprint(className)
		const actualGates = readGateBlueprints(asset, row)
		if (actualGates.length !== 1 || actualGates[0] !== expectedGate) {
			throw new Error(`class pool ${className}: gate ${actualGates.join(",") || "none"}, expected ${expectedGate}`)
		}
		const expectedDetails = classPoolDetailIds(classPoolFamilies(className))
		const actualDetails = readDetailIds(row)
		if (actualDetails.length !== expectedDetails.length) {
			throw new Error(`class pool ${className}: ${actualDetails.length} details, expected ${expectedDetails.length}`)
		}
		for (const [index, expected] of expectedDetails.entries()) {
			if (!detailEquals(actualDetails[index], expected)) {
				throw new Error(`class pool ${className}[${index}]: ${actualDetails[index].type}/${actualDetails[index].id}, expected ${expected.type}/${expected.id}`)
			}
		}
	}
}
