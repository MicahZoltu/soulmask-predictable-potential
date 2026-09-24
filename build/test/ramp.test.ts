import { describe, expect, test } from "bun:test"
import {
	buildRampTiers,
	NATIVE_RECRUIT_BASE,
	parseRampTierIncrement,
	rampCumulativeOffset,
	rampGateAwareness,
	rampKey,
	RAMP_TIER_COUNT,
	rampTierIncrementFromParams,
	rampValueCeiling,
	SURVIVAL_RAMP_TIER_INCREMENT,
	TRIBAL_RAMP_TIER_INCREMENT,
} from "../src/pure/ramp"

describe("ramp tiers", () => {
	test("have one tier every four awareness levels from 4 to 60", () => {
		expect(rampGateAwareness(0)).toBe(4)
		expect(rampGateAwareness(14)).toBe(60)
		for (let index = 1; index < 15; index += 1) {
			expect(rampGateAwareness(index) - rampGateAwareness(index - 1)).toBe(4)
		}
	})

	test("store Survival cumulative totals 3, 6, ... 45", () => {
		expect(SURVIVAL_RAMP_TIER_INCREMENT).toBe(3)
		expect(rampCumulativeOffset(0, SURVIVAL_RAMP_TIER_INCREMENT)).toBe(3)
		expect(rampCumulativeOffset(14, SURVIVAL_RAMP_TIER_INCREMENT)).toBe(45)
		for (let index = 0; index < 15; index += 1) {
			expect(rampCumulativeOffset(index, SURVIVAL_RAMP_TIER_INCREMENT)).toBe(3 * (index + 1))
		}
	})

	test("store Tribe Mode cumulative totals 6, 12, ... 90", () => {
		expect(TRIBAL_RAMP_TIER_INCREMENT).toBe(6)
		expect(rampCumulativeOffset(0, TRIBAL_RAMP_TIER_INCREMENT)).toBe(6)
		expect(rampCumulativeOffset(14, TRIBAL_RAMP_TIER_INCREMENT)).toBe(90)
		for (let index = 0; index < 15; index += 1) {
			expect(rampCumulativeOffset(index, TRIBAL_RAMP_TIER_INCREMENT)).toBe(6 * (index + 1))
		}
	})

	test("bound the manager validation range by the top tier's cumulative offset", () => {
		expect(rampValueCeiling(SURVIVAL_RAMP_TIER_INCREMENT)).toBe(45)
		expect(rampValueCeiling(TRIBAL_RAMP_TIER_INCREMENT)).toBe(90)
		expect(rampValueCeiling(SURVIVAL_RAMP_TIER_INCREMENT)).toBe(rampCumulativeOffset(RAMP_TIER_COUNT - 1, SURVIVAL_RAMP_TIER_INCREMENT))
		expect(() => rampValueCeiling(0)).toThrow()
	})

	test("name distinct keys ZhaoMuRamp01 through ZhaoMuRamp15", () => {
		expect(rampKey(0)).toBe("ZhaoMuRamp01")
		expect(rampKey(14)).toBe("ZhaoMuRamp15")
		const keys = buildRampTiers(SURVIVAL_RAMP_TIER_INCREMENT).map((tier) => tier.key)
		expect(new Set(keys).size).toBe(15)
	})

	test("final cap is native base plus the last cumulative offset: 48 in Survival and 93 in Tribe Mode", () => {
		expect(NATIVE_RECRUIT_BASE + rampCumulativeOffset(RAMP_TIER_COUNT - 1, SURVIVAL_RAMP_TIER_INCREMENT)).toBe(48)
		expect(NATIVE_RECRUIT_BASE + rampCumulativeOffset(RAMP_TIER_COUNT - 1, TRIBAL_RAMP_TIER_INCREMENT)).toBe(93)
	})

	test("rejects out-of-range indices", () => {
		expect(() => rampGateAwareness(15)).toThrow()
		expect(() => rampCumulativeOffset(-1, SURVIVAL_RAMP_TIER_INCREMENT)).toThrow()
		expect(() => rampKey(1.5)).toThrow()
	})

	test("rejects non-positive or non-integer increments", () => {
		expect(() => rampCumulativeOffset(0, 0)).toThrow()
		expect(() => rampCumulativeOffset(0, -1)).toThrow()
		expect(() => rampCumulativeOffset(0, 1.5)).toThrow()
		expect(() => buildRampTiers(2.5)).toThrow()
	})

	test("parses a positive integer increment from raw text", () => {
		expect(parseRampTierIncrement("6")).toBe(6)
		expect(() => parseRampTierIncrement("0")).toThrow()
		expect(() => parseRampTierIncrement("-3")).toThrow()
		expect(() => parseRampTierIncrement("1.5")).toThrow()
		expect(() => parseRampTierIncrement("three")).toThrow()
	})

	test("rejects raw text that is not a canonical decimal digit string", () => {
		expect(() => parseRampTierIncrement("")).toThrow()
		expect(() => parseRampTierIncrement(" 6 ")).toThrow()
		expect(() => parseRampTierIncrement("6e0")).toThrow()
		expect(() => parseRampTierIncrement("0x10")).toThrow()
		expect(() => parseRampTierIncrement("6.0")).toThrow()
		expect(() => parseRampTierIncrement("+6")).toThrow()
	})

	test("reads the increment from params and rejects a missing key", () => {
		expect(rampTierIncrementFromParams({ tierIncrement: "6" })).toBe(6)
		expect(() => rampTierIncrementFromParams({})).toThrow()
		expect(() => rampTierIncrementFromParams({ tierIncrement: "0" })).toThrow()
	})
})
