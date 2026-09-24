import { describe, expect, test } from "bun:test"
import {
	buildStartingBands,
	CLASS_SKILL_ADDEND,
	CLASS_SKILL_CAP,
	CLASS_STARTING_ADDEND,
	NON_CLASS_SKILL_CAP,
	PROFICIENCY_CAP_BASE,
	startingCurveValue,
	STARTING_CURVE_LEVEL_MAX,
	STARTING_PLATEAU_LEVEL_MIN,
} from "../src/pure/proficiency"

describe("starting curve", () => {
	test("anchors match the settled design", () => {
		expect(startingCurveValue(1)).toBe(1)
		expect(startingCurveValue(50)).toBe(76)
	})

	test("follows round(1 + 75*(L-1)/49) across the level range", () => {
		for (let level = 1; level <= 50; level += 1) {
			expect(startingCurveValue(level)).toBe(Math.round(1 + 75 * (level - 1) / 49))
		}
	})

	test("is monotonically non-decreasing", () => {
		for (let level = 2; level <= 50; level += 1) {
			expect(startingCurveValue(level)).toBeGreaterThanOrEqual(startingCurveValue(level - 1))
		}
	})

	test("class start at level 50 lands on 112", () => {
		expect(startingCurveValue(50) + CLASS_STARTING_ADDEND).toBe(112)
	})
})

describe("starting bands", () => {
	const bands = buildStartingBands()

	test("one guard band, one band per level, and one terminal plateau", () => {
		expect(bands.length).toBe(1 + STARTING_CURVE_LEVEL_MAX + 1)
	})

	test("guard band catches level zero at the native fallback", () => {
		expect(bands[0]).toEqual({ minLevel: 0, maxLevel: 0, value: 1 })
	})

	test("per-level bands are degenerate and match the curve", () => {
		for (let level = 1; level <= 50; level += 1) {
			const band = bands[level]
			expect(band.minLevel).toBe(level)
			expect(band.maxLevel).toBe(level)
			expect(band.value).toBe(startingCurveValue(level))
		}
	})

	test("terminal band plateaus at 76", () => {
		const terminal = bands[bands.length - 1]
		expect(terminal.minLevel).toBe(STARTING_PLATEAU_LEVEL_MIN)
		expect(terminal.value).toBe(76)
		expect(terminal.maxLevel).toBeGreaterThanOrEqual(terminal.minLevel)
	})
})

describe("cap arithmetic", () => {
	test("non-class and class caps match DESIGN.md", () => {
		expect(NON_CLASS_SKILL_CAP).toBe(85)
		expect(CLASS_SKILL_CAP).toBe(125)
		expect(PROFICIENCY_CAP_BASE + CLASS_SKILL_ADDEND).toBe(CLASS_SKILL_CAP)
	})

	test("class starting skill reaches 112 and stays under the class cap", () => {
		expect(CLASS_STARTING_ADDEND).toBe(36)
	})
})
