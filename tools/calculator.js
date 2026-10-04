(function (root, factory) {
	if (typeof module === "object" && module.exports) module.exports = factory();
	else root.CropCalculator = factory();
})(typeof self !== "undefined" ? self : this, function () {
	"use strict";

	const NEAR_ZERO_THRESHOLD = 1e-9;
	const DISPLAY_DECIMAL_PLACES = 4;

	function isFiniteNumber(value) {
		return typeof value === "number" && Number.isFinite(value);
	}

	function isRecord(value) {
		return typeof value === "object" && value !== null && !Array.isArray(value);
	}

	function isValidCropData(cropData) {
		if (!isRecord(cropData)) return false;
		if (!isRecord(cropData.crops)) return false;
		if (!Array.isArray(cropData.foods)) return false;
		for (const food of cropData.foods) {
			if (!isRecord(food)) return false;
			if (typeof food.id !== "string" || typeof food.name !== "string") return false;
			if (!Array.isArray(food.variants) || food.variants.length === 0) return false;
			for (const variant of food.variants) {
				if (!isRecord(variant)) return false;
				if (!isRecord(variant.crops)) return false;
				for (const plotsPerMinute of Object.values(variant.crops)) {
					if (!isFiniteNumber(plotsPerMinute)) return false;
				}
			}
		}
		return true;
	}

	function findFoodById(cropData, foodId) {
		for (const food of cropData.foods) {
			if (food.id === foodId) return food;
		}
		return null;
	}

	function variantTotalPlots(variant) {
		if (!isRecord(variant) || !isRecord(variant.crops)) {
			throw new Error("A variant must be an object with a crops record.");
		}
		let total = 0;
		for (const plotsPerMinute of Object.values(variant.crops)) {
			if (!isFiniteNumber(plotsPerMinute)) {
				throw new Error(`Variant "${variant.label}" has a non-numeric plot value.`);
			}
			total += plotsPerMinute;
		}
		return total;
	}

	function cheapestVariantIndex(variants) {
		if (!Array.isArray(variants) || variants.length === 0) {
			throw new Error("cheapestVariantIndex requires at least one variant.");
		}
		let cheapestIndex = 0;
		let cheapestTotal = variantTotalPlots(variants[0]);
		for (let index = 1; index < variants.length; index += 1) {
			const total = variantTotalPlots(variants[index]);
			if (total < cheapestTotal) {
				cheapestTotal = total;
				cheapestIndex = index;
			}
		}
		return cheapestIndex;
	}

	function formatPlots(value) {
		if (!isFiniteNumber(value)) {
			throw new Error("formatPlots requires a finite number.");
		}
		if (value === 0) return "0";
		const scale = 10 ** DISPLAY_DECIMAL_PLACES;
		const rounded = Math.round(value * scale) / scale;
		if (rounded !== 0) return String(rounded);
		// Below the display resolution String(value) switches to exponential notation, so expand the value to a plain decimal instead.
		const trimmed = value.toFixed(20).replace(/0+$/, "").replace(/\.$/, "");
		if (!/[1-9]/.test(trimmed)) return `<${1 / scale}`;
		return trimmed;
	}

	function compareByPlotsDescending(left, right) {
		if (right.plots !== left.plots) return right.plots - left.plots;
		return left.name.localeCompare(right.name);
	}

	function computePlotDemand(cropData, selection) {
		if (!isRecord(cropData) || !isRecord(cropData.crops) || !Array.isArray(cropData.foods)) {
			throw new Error("computePlotDemand requires cropData with crops and foods.");
		}
		if (!Array.isArray(selection)) {
			throw new Error("computePlotDemand requires a selection array.");
		}
		const plotsByCropId = new Map();
		for (const entry of selection) {
			if (!isRecord(entry)) {
				throw new Error("Each selection entry must be an object.");
			}
			const food = findFoodById(cropData, entry.foodId);
			if (food === null) {
				throw new Error(`Unknown food id: ${entry.foodId}`);
			}
			if (!isFiniteNumber(entry.perHour) || entry.perHour < 0) {
				throw new Error(`Invalid perHour for ${food.name}: ${entry.perHour}`);
			}
			const variant = food.variants[entry.variantIndex];
			if (variant === undefined) {
				throw new Error(`Variant index ${entry.variantIndex} is out of range for ${food.name}.`);
			}
			if (entry.perHour === 0) continue;
			const unitsPerMinute = entry.perHour / 60;
			for (const [cropId, plotsPerMinute] of Object.entries(variant.crops)) {
				if (!isFiniteNumber(plotsPerMinute)) {
					throw new Error(`Variant "${variant.label}" has a non-numeric plot value for ${cropId}.`);
				}
				const previous = plotsByCropId.get(cropId) ?? 0;
				plotsByCropId.set(cropId, previous + unitsPerMinute * plotsPerMinute);
			}
		}
		const demand = [];
		for (const [cropId, plots] of plotsByCropId) {
			if (Math.abs(plots) < NEAR_ZERO_THRESHOLD) continue;
			const crop = cropData.crops[cropId];
			const name = crop !== undefined ? crop.name : cropId;
			demand.push({ cropId, name, plots });
		}
		demand.sort(compareByPlotsDescending);
		return demand;
	}

	return { computePlotDemand, cheapestVariantIndex, formatPlots, findFoodById, isValidCropData };
});
