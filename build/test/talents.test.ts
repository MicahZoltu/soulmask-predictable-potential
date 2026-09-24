import { describe, expect, test } from "bun:test"
import {
	CLASS_POOL_FAMILIES,
	GEAR_PREFERENCE_ROWS,
	NON_GRANTING_QUALITIES,
	ORIGIN_CLASS_DEFINITIONS,
	TRIBE_DEFINITIONS,
	TRIBE_PINNED_WEIGHT,
	classPoolDetailIds,
	familyForRowId,
	isStarThreeRowId,
	originClassForFamily,
	originClassForGate,
	qualityGrantsClassTalent,
	qualityStarWeights,
	starRowIdsForFamily,
	tribeStarThreeRowIds,
} from "../src/pure/talents"

describe("star rows", () => {
	test("expand a family into its three star rows", () => {
		expect(starRowIdsForFamily(16039)).toEqual([160391, 160392, 160393])
		expect(starRowIdsForFamily(50004)).toEqual([500041, 500042, 500043])
	})

	test("build alternating type/id detail pairs for a family list", () => {
		expect(classPoolDetailIds([16069])).toEqual([
			{ type: 16069, id: 160691 },
			{ type: 16069, id: 160692 },
			{ type: 16069, id: 160693 },
		])
	})

	test("pin every tribal family to its star III row at the fixed weight", () => {
		expect(tribeStarThreeRowIds([16039, 16040])).toEqual([160393, 160403])
		expect(tribeStarThreeRowIds([])).toEqual([])
		expect(TRIBE_PINNED_WEIGHT).toBe(100)
	})

	test("recognize only the third row of a family as star III", () => {
		expect(isStarThreeRowId(420503)).toBe(true)
		expect(isStarThreeRowId(420501)).toBe(false)
		expect(isStarThreeRowId(420502)).toBe(false)
	})

	test("recover the family from any star row of it", () => {
		expect(familyForRowId(420501)).toBe(42050)
		expect(familyForRowId(420502)).toBe(42050)
		expect(familyForRowId(420503)).toBe(42050)
	})
})

describe("origin classes", () => {
	test("are the six settled families with the class gates", () => {
		expect(ORIGIN_CLASS_DEFINITIONS.map((definition) => definition.family)).toEqual([50001, 50002, 50003, 50004, 50005, 50006])
		expect(originClassForFamily(50004).name).toBe("Warrior")
		expect(originClassForGate("BP_Gift_IsZhiYeKuLi_C").name).toBe("Laborer")
	})

	test("reject an unknown family or gate", () => {
		expect(() => originClassForFamily(50099)).toThrow()
		expect(() => originClassForGate("BP_Gift_Nope_C")).toThrow()
	})
})

describe("tribe sets", () => {
	test("match the settled families per tribe", () => {
		expect(TRIBE_DEFINITIONS.map((definition) => definition.families)).toEqual([
			[16008, 16058],
			[16071, 16072],
			[16039, 16040, 16041],
			[42040, 42041, 42042],
		])
	})
})

describe("class pool families", () => {
	test("define a distinct non-empty set for every class", () => {
		expect(Object.keys(CLASS_POOL_FAMILIES).sort()).toEqual(["Craftsman", "Guard", "Hunter", "Laborer", "Porter", "Warrior"].sort())
		for (const families of Object.values(CLASS_POOL_FAMILIES)) {
			expect(families.length).toBeGreaterThan(0)
			expect(new Set(families).size).toBe(families.length)
		}
	})
})

describe("rarity weights", () => {
	test("map quality 5/4/3 to star III/II/I and low qualities to nothing", () => {
		expect(qualityStarWeights("5")).toEqual({ 1: 0, 2: 0, 3: 100 })
		expect(qualityStarWeights("4")).toEqual({ 1: 0, 2: 100, 3: 0 })
		expect(qualityStarWeights("3")).toEqual({ 1: 100, 2: 0, 3: 0 })
		for (const quality of NON_GRANTING_QUALITIES) {
			expect(qualityStarWeights(quality)).toEqual({ 1: 0, 2: 0, 3: 0 })
		}
	})

	test("grant the class talent only for quality 3-5", () => {
		expect(qualityGrantsClassTalent("5")).toBe(true)
		expect(qualityGrantsClassTalent("3")).toBe(true)
		expect(qualityGrantsClassTalent("2")).toBe(false)
		expect(qualityGrantsClassTalent("0")).toBe(false)
	})

	test("reject an unknown quality", () => {
		expect(() => qualityStarWeights("9")).toThrow()
		expect(() => qualityGrantsClassTalent("9")).toThrow()
	})
})

describe("preference gear rows", () => {
	test("list six like and six aversion rows", () => {
		expect(GEAR_PREFERENCE_ROWS.length).toBe(12)
		expect(GEAR_PREFERENCE_ROWS.filter((name) => name.startsWith("8")).length).toBe(6)
		expect(GEAR_PREFERENCE_ROWS.filter((name) => name.startsWith("9")).length).toBe(6)
	})
})
