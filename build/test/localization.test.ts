import { describe, expect, test } from "bun:test"
import {
	ORIGIN_GROWTH_SUFFIX,
	ORIGIN_LOCALIZATION,
	buildOriginDescription,
	formatSkillList,
	originLocalizationTexts,
} from "../src/pure/localization"
import { encodeLocresString, locresKeyText, parseLocres, serializeLocres, type LocresDocument } from "../src/pure/locres"
import { applyOriginLocalization, verifyOriginLocalization } from "../src/edits/locresText"

describe("skill list formatting", () => {
	test("joins one, two, and many skills", () => {
		expect(formatSkillList(["spear"])).toBe("spear")
		expect(formatSkillList(["spear", "shield"])).toBe("spear and shield")
		expect(formatSkillList(["spear", "shield", "bow"])).toBe("spear, shield, and bow")
	})

	test("rejects an empty list", () => {
		expect(() => formatSkillList([])).toThrow()
	})
})

describe("origin localization definitions", () => {
	test("carry the six exact titles and keys", () => {
		expect(ORIGIN_LOCALIZATION.map((definition) => definition.title)).toEqual([
			"Origin - Laborer",
			"Origin - Porter",
			"Origin - Craftsman",
			"Origin - Fighting",
			"Origin - Hunting",
			"Origin - Guard",
		])
		expect(ORIGIN_LOCALIZATION.map((definition) => definition.titleKey)).toEqual([
			"8FF5EB0E4C5C501C2AEB64949C6B94A2",
			"A063C2114020D58E463FE1BEBDD25BA7",
			"822E6FBA474FCC411D1007AFA36FBE3E",
			"F95A8D9247CEDE8E45D730B272707611",
			"D422BA5C48C8D54657F1A1B22C72DF0E",
			"0A19099A4FC4000FEE3B8E852624F6F6",
		])
	})

	test("build the settled description for every class", () => {
		const descriptions = Object.fromEntries(ORIGIN_LOCALIZATION.map((definition) => [definition.className, buildOriginDescription(definition)]))
		expect(descriptions.Laborer).toBe("Mastered extensive and useful craftsmanship skills while doing heavy labor. Proficiency growth rate for spear, shield, logging, mining, harvesting, and planting +75%.")
		expect(descriptions.Porter).toBe("Demonstrates exceptional versatility and agility in various tasks Proficiency growth rate for learning gauntlets, weaving, potting, wood & stone, leatherworking, and kilning +75%.")
		expect(descriptions.Craftsman).toBe("Showed an extraordinary manufacturing talent from a young age and was highly anticipated since then. The proficiency growth rate for learning gauntlets, craftsmanship, alchemy, cooking, weapon crafting, and armor crafting +75%.")
		expect(descriptions.Warrior).toBe("Raised in a clan that has produced many famous warriors. Proficiency growth rate for spear, blade, shield, bow, dual-blade, gauntlets, great sword, hammer, and whip +75%.")
		expect(descriptions.Hunter).toBe("Raised in a clan that has produced numerous legendary hunters. Proficiency growth rate for spear, blade, shield, bow, harvesting, and logging +75%.")
		expect(descriptions.Guard).toBe("Once promoted to a high position as a temple guard for exceptional martial arts. Proficiency growth rate for spear, blade, shield, bow, great sword, and mining +75%.")
	})

	test("every description keeps the flavor sentence and the +75% suffix", () => {
		for (const definition of ORIGIN_LOCALIZATION) {
			const description = buildOriginDescription(definition)
			expect(description.startsWith(definition.flavorSentence)).toBe(true)
			expect(description.endsWith(ORIGIN_GROWTH_SUFFIX)).toBe(true)
		}
	})

	test("map every title and description key exactly once", () => {
		const texts = originLocalizationTexts()
		expect(texts.size).toBe(12)
		for (const definition of ORIGIN_LOCALIZATION) {
			expect(texts.get(definition.titleKey)).toBe(definition.title)
			expect(texts.get(definition.descKey)).toBe(buildOriginDescription(definition))
		}
	})
})

function localizedDocument(): LocresDocument {
	const keys = ORIGIN_LOCALIZATION.flatMap((definition) => [definition.titleKey, definition.descKey])
	return {
		magic: Uint8Array.from([0x0e, 0x14, 0x74, 0x75, 0x67, 0x4a, 0x03, 0xfc, 0x4a, 0x15, 0x90, 0x9d, 0xc3, 0x37, 0x7f, 0x1b]),
		version: 3,
		namespaces: [
			{
				namespaceHash: 0,
				name: encodeLocresString(""),
				keys: keys.map((value, index) => ({ keyHash: 0, key: encodeLocresString(value), sourceHash: 0, stringIndex: index })),
			},
		],
		stringTable: keys.map((value) => ({ text: encodeLocresString(`shipped ${value}`), refCount: 1 })),
		entryCount: keys.length,
	}
}

describe("origin localization edit", () => {
	test("writes every key and verifies the reparsed document", () => {
		const document = localizedDocument()
		applyOriginLocalization(document)
		const reparsed = parseLocres(serializeLocres(document))
		expect(() => verifyOriginLocalization(reparsed)).not.toThrow()
		for (const [key, expected] of originLocalizationTexts()) {
			expect(locresKeyText(reparsed, key)).toBe(expected)
		}
	})

	test("fails fast when a key is absent", () => {
		const document = localizedDocument()
		const first = document.namespaces[0].keys.shift()
		expect(first).toBeDefined()
		expect(() => applyOriginLocalization(document)).toThrow()
	})
})
