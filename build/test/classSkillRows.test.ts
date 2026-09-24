import { describe, expect, test } from "bun:test"
import type { AssetFile, JsonObject } from "../src/edits/assetAccess"
import { applyClassSkillSet, verifyClassSkillSet } from "../src/edits/classSkillRows"
import { classDefinition } from "../src/pure/classSets"

const HUNTER = classDefinition("Hunter")
const START_ADDEND = 36

function skillRow(skill: string, minAdd: number, maxAdd: number): JsonObject {
	return {
		Name: skill,
		Value: [
			{ Name: "ProfType", EnumValue: `EProficiency::${skill}` },
			{ Name: "MinAdd", Value: minAdd },
			{ Name: "MaxAdd", Value: maxAdd },
		],
	}
}

function assetWithRows(rows: JsonObject[]): AssetFile {
	return { NameMap: [], Exports: [{ Table: { Data: rows } }] }
}

function skillsOf(asset: AssetFile): string[] {
	const exports = asset.Exports[0]
	const table = exports.Table
	if (typeof table !== "object" || table === null || Array.isArray(table)) throw new Error("test asset has no table")
	const data = table.Data
	if (!Array.isArray(data)) throw new Error("test asset table has no rows")
	return data.map((row) => {
		if (typeof row !== "object" || row === null || Array.isArray(row)) throw new Error("test row is not an object")
		const value = row.Value
		if (!Array.isArray(value)) throw new Error("test row has no fields")
		const profType = value.find((field) => typeof field === "object" && field !== null && !Array.isArray(field) && field.Name === "ProfType")
		if (typeof profType !== "object" || profType === null || Array.isArray(profType)) throw new Error("test row has no ProfType")
		const enumValue = profType.EnumValue
		if (typeof enumValue !== "string") throw new Error("test row ProfType is not an enum")
		return enumValue.replace("EProficiency::", "")
	})
}

describe("class skill set reshape", () => {
	test("drops off-class rows, keeps the class set, and applies the addend to every row", () => {
		const asset = assetWithRows([
			skillRow("Gong", 15, 20),
			skillRow("Bian", 15, 25),
			skillRow("Mao", 15, 20),
			skillRow("Dao", 15, 20),
			skillRow("CaiShou", 15, 20),
			skillRow("FaMu", 15, 20),
		])
		applyClassSkillSet(asset, HUNTER, START_ADDEND)
		expect(skillsOf(asset).sort()).toEqual([...HUNTER.skills].sort())
		expect(() => verifyClassSkillSet(asset, HUNTER, START_ADDEND, "test")).not.toThrow()
	})

	test("rejects a skill outside the class set", () => {
		const asset = assetWithRows([
			skillRow("Mao", START_ADDEND, START_ADDEND),
			skillRow("Dao", START_ADDEND, START_ADDEND),
			skillRow("DunPai", START_ADDEND, START_ADDEND),
			skillRow("Gong", START_ADDEND, START_ADDEND),
			skillRow("CaiShou", START_ADDEND, START_ADDEND),
			skillRow("FaMu", START_ADDEND, START_ADDEND),
			skillRow("Bian", START_ADDEND, START_ADDEND),
		])
		expect(() => verifyClassSkillSet(asset, HUNTER, START_ADDEND, "test")).toThrow()
	})

	test("rejects a missing class skill", () => {
		const asset = assetWithRows([
			skillRow("Mao", START_ADDEND, START_ADDEND),
			skillRow("Dao", START_ADDEND, START_ADDEND),
			skillRow("Gong", START_ADDEND, START_ADDEND),
			skillRow("CaiShou", START_ADDEND, START_ADDEND),
			skillRow("FaMu", START_ADDEND, START_ADDEND),
		])
		expect(() => verifyClassSkillSet(asset, HUNTER, START_ADDEND, "test")).toThrow()
	})

	test("rejects a row carrying an unexpected addend", () => {
		const asset = assetWithRows([
			skillRow("Mao", START_ADDEND, START_ADDEND),
			skillRow("Dao", 40, START_ADDEND),
			skillRow("DunPai", START_ADDEND, START_ADDEND),
			skillRow("Gong", START_ADDEND, START_ADDEND),
			skillRow("CaiShou", START_ADDEND, START_ADDEND),
			skillRow("FaMu", START_ADDEND, START_ADDEND),
		])
		expect(() => verifyClassSkillSet(asset, HUNTER, START_ADDEND, "test")).toThrow()
	})
})
