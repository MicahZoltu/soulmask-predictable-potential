import { describe, expect, test } from "bun:test"
import { CLASS_DEFINITIONS, classDefinition, classDefinitionFromParams } from "../src/pure/classSets"

describe("class skill sets", () => {
	test("define the six settled classes", () => {
		expect(CLASS_DEFINITIONS.map((definition) => definition.name).sort()).toEqual(
			["Craftsman", "Guard", "Hunter", "Laborer", "Porter", "Warrior"].sort(),
		)
	})

	test("use the cooked table names under the proficiency folder", () => {
		for (const definition of CLASS_DEFINITIONS) {
			expect(definition.tableAssetName.startsWith("DT_Prof_ZhiYe_")).toBe(true)
		}
	})

	test("point each class at a distinct starting table under the natural-gift folder", () => {
		const startNames = CLASS_DEFINITIONS.map((definition) => definition.startTableAssetName)
		for (const startName of startNames) expect(startName.startsWith("SLD_ChuShiLv_")).toBe(true)
		expect(new Set(startNames).size).toBe(startNames.length)
	})

	test("each class has a distinct skill set with no duplicate skills", () => {
		const seen = new Set<string>()
		for (const definition of CLASS_DEFINITIONS) {
			expect(definition.skills.length).toBeGreaterThan(0)
			expect(new Set(definition.skills).size).toBe(definition.skills.length)
			for (const skill of definition.skills) {
				expect(seen.has(`${definition.name}:${skill}`)).toBe(false)
				seen.add(`${definition.name}:${skill}`)
			}
		}
	})

	test("lookup rejects an unknown class", () => {
		expect(() => classDefinition("Alchemist")).toThrow()
	})

	test("class parameters require a class name", () => {
		expect(classDefinitionFromParams({ className: "Warrior" }).name).toBe("Warrior")
		expect(() => classDefinitionFromParams({})).toThrow()
	})
})
