import { describe, expect, test } from "bun:test"
import { ASSET_MANIFEST, validateManifest, type ManifestEntry } from "../src/manifest"
import { SURVIVAL_RAMP_TIER_INCREMENT, TRIBAL_RAMP_TIER_INCREMENT } from "../src/pure/ramp"

function entry(overrides: Partial<ManifestEntry>): ManifestEntry {
	return {
		id: "test-entry",
		source: "server",
		assetPath: "Blueprints/DataTable/NaturalGift/SLD_ChuShiLv_ZaGong",
		edit: "defectPool",
		...overrides,
	}
}

describe("asset manifest", () => {
	test("the shipped manifest is valid", () => {
		expect(() => validateManifest(ASSET_MANIFEST)).not.toThrow()
	})

	test("uses every edit kind the pipeline implements", () => {
		const edits = new Set(ASSET_MANIFEST.map((manifestEntry) => manifestEntry.edit))
		expect(edits).toEqual(
			new Set([
				"proficiencyConfig",
				"classTable",
				"startLevelTable",
				"masteryTable",
				"archetypeTable",
				"rampNode",
				"rampManager",
				"originTalentRows",
				"bornRandomConfig",
				"classPoolRows",
				"rarityStarWeight",
				"rarityGrantCadence",
				"preferencePool",
				"defectPool",
				"originLocalization",
			]),
		)
	})

	test("carries the client locres override for the origin text", () => {
		const locresEntries = ASSET_MANIFEST.filter((manifestEntry) => manifestEntry.kind === "locres")
		expect(locresEntries).toEqual([
			{
				id: "localization-origin",
				source: "client",
				assetPath: "Localization/Game/en/Game",
				kind: "locres",
				edit: "originLocalization",
			},
		])
	})

	test("rejects a locres entry carrying a uasset edit id", () => {
		expect(() =>
			validateManifest([
				entry({ id: "loc", source: "client", assetPath: "Localization/Game/en/Game", kind: "locres", edit: "defectPool" }),
			]),
		).toThrow()
	})

	test("rejects an unknown locres edit id", () => {
		expect(() =>
			validateManifest([
				entry({ id: "loc", source: "client", assetPath: "Localization/Game/en/Game", kind: "locres", edit: "notAnEdit" }),
			]),
		).toThrow()
	})

	test("covers the six class-pool classes in both pool tables", () => {
		const poolEntries = ASSET_MANIFEST.filter((manifestEntry) => manifestEntry.edit === "classPoolRows")
		expect(poolEntries.map((manifestEntry) => manifestEntry.id).sort()).toEqual(["talent-class-pool", "talent-class-pool-custom"])
	})

	test("rejects empty manifests", () => {
		expect(() => validateManifest([])).toThrow()
	})

	test("rejects duplicate ids", () => {
		expect(() => validateManifest([entry({ id: "same" }), entry({ id: "same" })])).toThrow()
	})

	test("rejects unknown edit ids", () => {
		expect(() => validateManifest([entry({ edit: "notAnEdit" })])).toThrow()
	})

	test("rejects parameters on edits that take none", () => {
		expect(() => validateManifest([entry({ params: { className: "Hunter" } })])).toThrow()
	})

	test("requires a matching class name for classTable entries", () => {
		expect(() =>
			validateManifest([
				entry({
					id: "class-hunter",
					assetPath: "Blueprints/DataTable/Proficiency/DT_Prof_ZhiYe_ShouLieZhe",
					edit: "classTable",
					params: { className: "Guard" },
				}),
			]),
		).toThrow()
	})

	test("requires a matching class name for startLevelTable entries", () => {
		expect(() =>
			validateManifest([
				entry({
					id: "start-hunter",
					assetPath: "Blueprints/DataTable/NaturalGift/SLD_ChuShiLv_LieShou",
					edit: "startLevelTable",
					params: { className: "Guard" },
				}),
			]),
		).toThrow()
	})

	test("clears the base and Shifting Sands archetype tables", () => {
		const archetypeEntries = ASSET_MANIFEST.filter((manifestEntry) => manifestEntry.edit === "archetypeTable")
		expect(archetypeEntries.map((manifestEntry) => manifestEntry.assetPath).sort()).toEqual(
			[
				"AdditionMap01/BluePrints/DataTable/DT_CustomizeNPC_Egypt",
				"Blueprints/DataTable/CustomProfAndGA/DT_CustomizeNPC",
			].sort(),
		)
	})

	test("rejects asset paths carrying an extension", () => {
		expect(() => validateManifest([entry({ assetPath: "Blueprints/DataTable/NaturalGift/SLD_ChuShiLv_ZaGong.uasset" })])).toThrow()
	})

	test("ships a parameterless ramp node and one manager per game mode", () => {
		const node = ASSET_MANIFEST.filter((manifestEntry) => manifestEntry.edit === "rampNode")
		expect(node).toEqual([
			{
				id: "ramp-node",
				source: "server",
				assetPath: "Blueprints/MianJu/XiuFu01/BP_Mask_XiuFu01_1012",
				edit: "rampNode",
			},
		])

		const managers = ASSET_MANIFEST.filter((manifestEntry) => manifestEntry.edit === "rampManager")
		expect(managers).toEqual([
			{
				id: "ramp-manager-survival",
				source: "server",
				assetPath: "Blueprints/ZiYuanGuanLi/BP_GameXiShu_GuanLiQi",
				edit: "rampManager",
				params: { tierIncrement: String(SURVIVAL_RAMP_TIER_INCREMENT) },
			},
			{
				id: "ramp-manager-tribal",
				source: "server",
				assetPath: "Blueprints/ZiYuanGuanLi/BP_GameXiShu_GuanLiQi_Management",
				edit: "rampManager",
				params: { tierIncrement: String(TRIBAL_RAMP_TIER_INCREMENT) },
			},
		])
	})

	test("rejects a rampNode entry carrying parameters", () => {
		expect(() =>
			validateManifest([
				entry({
					edit: "rampNode",
					assetPath: "Blueprints/MianJu/XiuFu01/BP_Mask_XiuFu01_1012",
					params: { tierIncrement: "3" },
				}),
			]),
		).toThrow()
		expect(() =>
			validateManifest([
				entry({
					edit: "rampNode",
					assetPath: "Blueprints/MianJu/XiuFu01/BP_Mask_XiuFu01_1012",
					params: {},
				}),
			]),
		).toThrow()
	})

	test("rejects a rampManager entry with no parameters", () => {
		expect(() =>
			validateManifest([
				entry({
					edit: "rampManager",
					assetPath: "Blueprints/ZiYuanGuanLi/BP_GameXiShu_GuanLiQi",
				}),
			]),
		).toThrow()
	})

	test("rejects a rampManager entry with an extra parameter", () => {
		expect(() =>
			validateManifest([
				entry({
					edit: "rampManager",
					assetPath: "Blueprints/ZiYuanGuanLi/BP_GameXiShu_GuanLiQi",
					params: { tierIncrement: "3", extra: "x" },
				}),
			]),
		).toThrow()
	})

	test("rejects a rampManager entry with a zero tier increment", () => {
		expect(() =>
			validateManifest([
				entry({
					edit: "rampManager",
					assetPath: "Blueprints/ZiYuanGuanLi/BP_GameXiShu_GuanLiQi",
					params: { tierIncrement: "0" },
				}),
			]),
		).toThrow()
	})
})
