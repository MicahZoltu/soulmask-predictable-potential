// The reshape shared by the two ProficiencyZhiYeLvl skill tables: the class cap tables (DT_Prof_ZhiYe_*) and the starting addend tables (SLD_ChuShiLv_*).
// Both must list exactly the class skill set from DESIGN.md ("Proficiency caps"), so the per-skill addend applies to class skills only and never to an off-class skill.
import {
	type AssetFile,
	type AssetRow,
	type JsonValue,
	ensureNameMapEntry,
	findDataTable,
	readEnum,
	readNumber,
	replaceRows,
	rowField,
	setNumber,
} from "./assetAccess"
import { byteEnumProperty, intProperty, structProperty } from "./propertyFactory"
import type { ClassDefinition } from "../pure/classSets"

export const PROFICIENCY_ENUM = "EProficiency"

export function rowSkill(row: AssetRow): string {
	const enumValue = readEnum(rowField(row, "ProfType"), `row ${row.Name}`)
	const prefix = `${PROFICIENCY_ENUM}::`
	if (!enumValue.startsWith(prefix)) throw new Error(`row ${row.Name}: unexpected ProfType ${enumValue}`)
	return enumValue.slice(prefix.length)
}

function setAddend(row: AssetRow, addend: number): void {
	setNumber(rowField(row, "MinAdd"), addend)
	setNumber(rowField(row, "MaxAdd"), addend)
}

function buildSkillRow(skill: string, addend: number): JsonValue {
	return structProperty(skill, "ProficiencyZhiYeLvl", [
		byteEnumProperty("ProfType", PROFICIENCY_ENUM, `${PROFICIENCY_ENUM}::${skill}`),
		intProperty("MinAdd", addend),
		intProperty("MaxAdd", addend),
	])
}

export function applyClassSkillSet(asset: AssetFile, definition: ClassDefinition, addend: number): void {
	const target = new Set(definition.skills)
	const table = findDataTable(asset)
	const kept: JsonValue[] = []
	const present = new Set<string>()
	for (const row of table.rows) {
		const skill = rowSkill(row)
		if (!target.has(skill)) continue
		setAddend(row, addend)
		kept.push(row)
		present.add(skill)
	}
	for (const skill of definition.skills) {
		if (present.has(skill)) continue
		ensureNameMapEntry(asset, skill)
		ensureNameMapEntry(asset, `${PROFICIENCY_ENUM}::${skill}`)
		ensureNameMapEntry(asset, PROFICIENCY_ENUM)
		kept.push(buildSkillRow(skill, addend))
	}
	replaceRows(table, kept)
}

export function verifyClassSkillSet(asset: AssetFile, definition: ClassDefinition, addend: number, label: string): void {
	const expected = new Set(definition.skills)
	const table = findDataTable(asset)
	const actual = new Set<string>()
	for (const row of table.rows) {
		const skill = rowSkill(row)
		actual.add(skill)
		if (!expected.has(skill)) throw new Error(`${label} ${definition.name}: unexpected skill row ${skill}`)
		const minValue = readNumber(rowField(row, "MinAdd"), `row ${row.Name}`)
		const maxValue = readNumber(rowField(row, "MaxAdd"), `row ${row.Name}`)
		if (minValue !== addend || maxValue !== addend) {
			throw new Error(`${label} ${definition.name} row ${skill}: addend ${minValue}/${maxValue}`)
		}
	}
	if (actual.size !== expected.size) {
		throw new Error(`${label} ${definition.name}: ${actual.size} skill rows, expected ${expected.size}`)
	}
	for (const skill of expected) {
		if (!actual.has(skill)) throw new Error(`${label} ${definition.name}: missing skill row ${skill}`)
	}
}
