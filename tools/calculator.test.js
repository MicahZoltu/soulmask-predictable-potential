const { test, expect } = require("bun:test");
const cropData = require("./data.js");
const {
	computePlotDemand,
	cheapestVariantIndex,
	formatPlots,
	findFoodById,
	isValidCropData,
} = require("./calculator.js");

function demandByCropId(demand) {
	const byCropId = new Map();
	for (const entry of demand) byCropId.set(entry.cropId, entry.plots);
	return byCropId;
}

test("computes exact fractional plots for one Pumpkin Salad per hour", () => {
	const demand = computePlotDemand(cropData, [
		{ foodId: "DaoJu_Item_NanGuaShaLa", variantIndex: 0, perHour: 60 },
	]);
	const byCropId = demandByCropId(demand);
	expect(byCropId.get("daoju_item_pumpkin")).toBeCloseTo(8.333333333333334, 9);
	expect(byCropId.get("daoju_item_chili")).toBeCloseTo(9.00900900900901, 9);
	expect(byCropId.get("daoju_item_tomatoes")).toBeCloseTo(6.006006006006006, 9);
	expect(demand.length).toBe(3);
});

test("scales linearly with the requested rate", () => {
	const demand = computePlotDemand(cropData, [
		{ foodId: "DaoJu_Item_NanGuaShaLa", variantIndex: 0, perHour: 30 },
	]);
	const byCropId = demandByCropId(demand);
	expect(byCropId.get("daoju_item_pumpkin")).toBeCloseTo(8.333333333333334 / 2, 9);
});

test("sums shared crops across selected dishes", () => {
	const demand = computePlotDemand(cropData, [
		{ foodId: "DaoJu_Item_NanGuaShaLa", variantIndex: 0, perHour: 60 },
		{ foodId: "DaoJu_Item_NanGuaShaLa", variantIndex: 0, perHour: 60 },
	]);
	const byCropId = demandByCropId(demand);
	expect(byCropId.get("daoju_item_pumpkin")).toBeCloseTo(8.333333333333334 * 2, 9);
});

test("omits crops with zero demand", () => {
	const demand = computePlotDemand(cropData, [
		{ foodId: "DaoJu_Item_KaoHuangChong", variantIndex: 0, perHour: 10 },
	]);
	expect(demand).toEqual([]);
});

test("ignores a zero quantity", () => {
	const demand = computePlotDemand(cropData, [
		{ foodId: "DaoJu_Item_NanGuaShaLa", variantIndex: 0, perHour: 0 },
	]);
	expect(demand).toEqual([]);
});

test("sorts crops by descending plot count", () => {
	const demand = computePlotDemand(cropData, [
		{ foodId: "DaoJu_Item_NanGuaShaLa", variantIndex: 0, perHour: 60 },
	]);
	expect(demand.map((entry) => entry.cropId)).toEqual([
		"daoju_item_chili",
		"daoju_item_pumpkin",
		"daoju_item_tomatoes",
	]);
});

test("reports the crop display name", () => {
	const demand = computePlotDemand(cropData, [
		{ foodId: "DaoJu_Item_NanGuaShaLa", variantIndex: 0, perHour: 60 },
	]);
	const pumpkin = demand.find((entry) => entry.cropId === "daoju_item_pumpkin");
	expect(pumpkin.name).toBe("Pumpkin");
});

test("rejects an unknown food id", () => {
	expect(() =>
		computePlotDemand(cropData, [{ foodId: "DaoJu_Item_DoesNotExist", variantIndex: 0, perHour: 1 }])
	).toThrow();
});

test("rejects an out-of-range variant index", () => {
	expect(() =>
		computePlotDemand(cropData, [{ foodId: "DaoJu_Item_NanGuaShaLa", variantIndex: 7, perHour: 1 }])
	).toThrow();
});

test("rejects a negative quantity", () => {
	expect(() =>
		computePlotDemand(cropData, [{ foodId: "DaoJu_Item_NanGuaShaLa", variantIndex: 0, perHour: -1 }])
	).toThrow();
});

test("picks the cheapest variant by total plots", () => {
	const beer = cropData.foods.find((food) => food.id === "DaoJu_Item_Beer");
	expect(cheapestVariantIndex(beer.variants)).toBe(0);
});

test("breaks variant ties toward the lowest index", () => {
	const variants = [
		{ label: "A", crops: { one: 2 } },
		{ label: "B", crops: { two: 2 } },
	];
	expect(cheapestVariantIndex(variants)).toBe(0);
});

test("finds the cheapest variant when the minimum is not first", () => {
	const variants = [
		{ label: "A", crops: { a: 5 } },
		{ label: "B", crops: { b: 3 } },
		{ label: "C", crops: { c: 1 } },
	];
	expect(cheapestVariantIndex(variants)).toBe(2);
});

test("prefers an empty-crops variant over any non-empty variant", () => {
	const variants = [
		{ label: "A", crops: { a: 5 } },
		{ label: "B", crops: {} },
	];
	expect(cheapestVariantIndex(variants)).toBe(1);
});

test("rejects an empty variant list", () => {
	expect(() => cheapestVariantIndex([])).toThrow();
});

test("formats plot counts with trimmed decimals", () => {
	expect(formatPlots(8.333333333333334)).toBe("8.3333");
	expect(formatPlots(9.00900900900901)).toBe("9.009");
	expect(formatPlots(12)).toBe("12");
	expect(formatPlots(0)).toBe("0");
});

test("keeps very small non-zero values visible", () => {
	expect(formatPlots(0.00001)).toBe("0.00001");
});

test("never emits exponential notation for tiny non-zero values", () => {
	const formatted = formatPlots(4e-7);
	expect(formatted).toBe("0.0000004");
	expect(formatted).not.toContain("e");
});

test("falls back to a comparison string when a value is below the printable resolution", () => {
	const formatted = formatPlots(1e-30);
	expect(formatted).toBe("<0.0001");
	expect(formatted).not.toContain("e");
});

test("finds a food by id and returns null when it is absent", () => {
	expect(findFoodById(cropData, "DaoJu_Item_Beer").name).toBe("Beer");
	expect(findFoodById(cropData, "DaoJu_Item_DoesNotExist")).toBeNull();
});

test("accepts the bundled crop data", () => {
	expect(isValidCropData(cropData)).toBe(true);
});

test("rejects crop data whose variant plot values are not finite numbers", () => {
	expect(isValidCropData({
		crops: {},
		foods: [{ id: "a", name: "A", variants: [{ label: "x", crops: { a: "nope" } }] }],
	})).toBe(false);
	expect(isValidCropData({
		crops: {},
		foods: [{ id: "a", name: "A", variants: [{ label: "x", crops: { a: Number.NaN } }] }],
	})).toBe(false);
});

test("rejects crop data with malformed food or variant structure", () => {
	expect(isValidCropData(null)).toBe(false);
	expect(isValidCropData({ crops: {}, foods: [{ id: "a", name: "A", variants: [] }] })).toBe(false);
	expect(isValidCropData({
		crops: {},
		foods: [{ id: "a", name: "A", variants: [{ label: "x" }] }],
	})).toBe(false);
});

test("computes demand for a non-first variant", () => {
	const demand = computePlotDemand(cropData, [
		{ foodId: "DaoJu_Item_Beer", variantIndex: 1, perHour: 60 },
	]);
	const byCropId = demandByCropId(demand);
	expect(byCropId.get("daoju_item_grape")).toBe(8.565310492505352);
	expect(byCropId.get("daoju_item_wheat")).toBeCloseTo(8.565310492505352, 9);
});

test("sums a shared crop across two distinct dishes", () => {
	const demand = computePlotDemand(cropData, [
		{ foodId: "DaoJu_Item_NanGuaShaLa", variantIndex: 0, perHour: 60 },
		{ foodId: "DaoJu_Item_KaoNanGua", variantIndex: 0, perHour: 60 },
	]);
	const byCropId = demandByCropId(demand);
	expect(byCropId.get("daoju_item_pumpkin")).toBeCloseTo(12.5, 9);
});

test("merges crops across dishes and variants sorted descending", () => {
	const demand = computePlotDemand(cropData, [
		{ foodId: "DaoJu_Item_Beer", variantIndex: 1, perHour: 60 },
		{ foodId: "DaoJu_Item_Wine", variantIndex: 0, perHour: 60 },
	]);
	expect(demand.map((entry) => entry.cropId)).toEqual([
		"daoju_item_date",
		"daoju_item_grape",
		"daoju_item_wheat",
	]);
	const byCropId = demandByCropId(demand);
	expect(byCropId.get("daoju_item_grape")).toBeCloseTo(8.565310492505352 + 10.70663811563169, 9);
});

test("rejects a non-numeric quantity", () => {
	expect(() =>
		computePlotDemand(cropData, [{ foodId: "DaoJu_Item_Beer", variantIndex: 0, perHour: "x" }])
	).toThrow();
	expect(() =>
		computePlotDemand(cropData, [{ foodId: "DaoJu_Item_Beer", variantIndex: 0, perHour: Number.NaN }])
	).toThrow();
});

test("rejects malformed crop data", () => {
	expect(() => computePlotDemand({}, [])).toThrow();
	expect(() => computePlotDemand({ crops: {}, foods: "nope" }, [])).toThrow();
});
