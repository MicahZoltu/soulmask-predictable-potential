(function () {
	"use strict";

	const cropData = globalThis.CROP_DATA;
	const calculator = globalThis.CropCalculator;
	if (cropData === undefined || calculator === undefined) {
		showFatalError("Failed to load crop data or the calculator.");
		return;
	}
	if (!calculator.isValidCropData(cropData)) {
		showFatalError("Crop data is malformed.");
		return;
	}

	const selectedDishes = [];
	const dishListItemsByFoodId = new Map();
	const selectedRowsByFoodId = new Map();
	const openBreakdowns = new Set();

	const dishSearchInput = requireElement("dish-search");
	const dishCatalog = requireElement("dish-catalog");
	const catalogCount = requireElement("catalog-count");
	const catalogEmpty = requireElement("catalog-empty");
	const selectedList = requireElement("selected-dishes");
	const selectedEmpty = requireElement("selected-empty");
	const resultsContainer = requireElement("plot-results");
	const breakdownContainer = requireElement("dish-breakdown");

	function requireElement(id) {
		const element = document.getElementById(id);
		if (element === null) throw new Error(`Missing required element #${id}`);
		return element;
	}

	function showFatalError(message) {
		document.body.textContent = "";
		const alert = document.createElement("p");
		alert.setAttribute("role", "alert");
		alert.textContent = message;
		document.body.appendChild(alert);
	}

	function requireFood(foodId) {
		const food = calculator.findFoodById(cropData, foodId);
		if (food === null) throw new Error(`Unknown food id: ${foodId}`);
		return food;
	}

	function findSelection(foodId) {
		for (const entry of selectedDishes) {
			if (entry.foodId === foodId) return entry;
		}
		return null;
	}

	function buildDishList() {
		const foodsSortedByName = [...cropData.foods].sort((left, right) => left.name.localeCompare(right.name));
		for (const food of foodsSortedByName) {
			const item = document.createElement("li");
			const button = document.createElement("button");
			button.type = "button";
			button.className = "dish-button";
			button.textContent = food.name;
			button.setAttribute("aria-pressed", "false");
			button.addEventListener("click", () => addDish(food.id));
			item.appendChild(button);
			dishCatalog.appendChild(item);
			dishListItemsByFoodId.set(food.id, item);
		}
	}

	function setDishButtonSelected(foodId, isSelected) {
		const item = dishListItemsByFoodId.get(foodId);
		if (item === undefined) return;
		const button = item.querySelector("button");
		if (button === null) return;
		button.setAttribute("aria-pressed", isSelected ? "true" : "false");
	}

	function addDish(foodId) {
		if (findSelection(foodId) !== null) {
			focusSelectedQuantity(foodId);
			return;
		}
		const food = requireFood(foodId);
		const variantIndex = calculator.cheapestVariantIndex(food.variants);
		selectedDishes.push({ foodId, variantIndex, perHour: 1 });
		renderSelectedRow(food);
		setDishButtonSelected(foodId, true);
		updateSelectedEmptyState();
		recompute();
	}

	function removeDish(foodId) {
		const index = selectedDishes.findIndex((entry) => entry.foodId === foodId);
		if (index === -1) return;
		selectedDishes.splice(index, 1);
		const row = selectedRowsByFoodId.get(foodId);
		if (row !== undefined) row.remove();
		selectedRowsByFoodId.delete(foodId);
		setDishButtonSelected(foodId, false);
		updateSelectedEmptyState();
		recompute();
		focusCatalogButton(foodId);
	}

	function focusCatalogButton(foodId) {
		const item = dishListItemsByFoodId.get(foodId);
		if (item === undefined) return;
		if (item.hidden) {
			dishSearchInput.focus();
			return;
		}
		const button = item.querySelector("button");
		if (button === null) return;
		button.focus();
	}

	function updateSelection(foodId, changes) {
		const entry = findSelection(foodId);
		if (entry === null) return;
		Object.assign(entry, changes);
	}

	function readQuantity(input) {
		const parsed = Number(input.value);
		return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
	}

	function focusSelectedQuantity(foodId) {
		const row = selectedRowsByFoodId.get(foodId);
		if (row === undefined) return;
		const input = row.querySelector('input[type="number"]');
		if (input !== null) input.focus();
	}

	function renderSelectedRow(food) {
		const entry = findSelection(food.id);
		if (entry === null) throw new Error(`Missing selection for ${food.id}`);
		const row = document.createElement("li");
		row.className = "selected-row";

		const name = document.createElement("span");
		name.className = "selected-name";
		name.textContent = food.name;

		const fields = document.createElement("div");
		fields.className = "selected-fields";
		fields.appendChild(createQuantityField(food, entry));
		if (food.variants.length > 1) fields.appendChild(createVariantField(food, entry));

		const removeButton = document.createElement("button");
		removeButton.type = "button";
		removeButton.className = "remove-button";
		removeButton.textContent = "Remove";
		removeButton.setAttribute("aria-label", `Remove ${food.name}`);
		removeButton.addEventListener("click", () => removeDish(food.id));

		row.append(name, removeButton, fields);
		selectedList.appendChild(row);
		selectedRowsByFoodId.set(food.id, row);
	}

	function createQuantityField(food, entry) {
		const label = document.createElement("label");
		label.className = "field";
		const labelText = document.createElement("span");
		labelText.textContent = "Units per hour";
		const quantityInput = document.createElement("input");
		quantityInput.type = "number";
		quantityInput.min = "0";
		quantityInput.step = "any";
		quantityInput.value = String(entry.perHour);
		quantityInput.setAttribute("aria-label", `Units per hour of ${food.name}`);
		quantityInput.addEventListener("input", () => {
			updateSelection(food.id, { perHour: readQuantity(quantityInput) });
		});
		quantityInput.addEventListener("change", () => {
			const quantity = readQuantity(quantityInput);
			quantityInput.value = String(quantity);
			updateSelection(food.id, { perHour: quantity });
			recompute();
		});
		label.append(labelText, quantityInput);
		return label;
	}

	function createVariantField(food, entry) {
		const label = document.createElement("label");
		label.className = "field field-variant";
		const labelText = document.createElement("span");
		labelText.textContent = "Variant";
		const select = document.createElement("select");
		select.setAttribute("aria-label", `Variant for ${food.name}`);
		food.variants.forEach((variant, variantIndex) => {
			const option = document.createElement("option");
			option.value = String(variantIndex);
			option.textContent = variant.label;
			select.appendChild(option);
		});
		select.value = String(entry.variantIndex);
		select.addEventListener("change", () => {
			updateSelection(food.id, { variantIndex: Number(select.value) });
			recompute();
		});
		label.append(labelText, select);
		return label;
	}

	function updateSelectedEmptyState() {
		selectedEmpty.hidden = selectedDishes.length > 0;
	}

	function currentSelection() {
		return selectedDishes.map((entry) => ({
			foodId: entry.foodId,
			variantIndex: entry.variantIndex,
			perHour: entry.perHour,
		}));
	}

	function recompute() {
		const selection = currentSelection();
		renderResults(calculator.computePlotDemand(cropData, selection));
		renderBreakdown(selection);
	}

	function renderResults(demand) {
		resultsContainer.textContent = "";
		if (demand.length === 0) {
			const empty = document.createElement("p");
			empty.className = "empty-state";
			empty.setAttribute("role", "status");
			empty.textContent = selectedDishes.length === 0
				? "Select one or more dishes to see how many farm plots are needed."
				: "The current selection needs no farm plots.";
			resultsContainer.appendChild(empty);
			return;
		}
		const largestPlots = demand[0].plots;
		const list = document.createElement("ul");
		list.className = "results-list";
		let totalPlots = 0;
		for (const entry of demand) {
			totalPlots += entry.plots;
			const item = document.createElement("li");
			item.className = "crop-row";

			const cropName = document.createElement("span");
			cropName.className = "crop-name";
			cropName.textContent = entry.name;

			const plots = document.createElement("span");
			plots.className = "crop-plots";
			plots.textContent = calculator.formatPlots(entry.plots);

			const bar = document.createElement("span");
			bar.className = "crop-bar";
			bar.setAttribute("aria-hidden", "true");
			const fill = document.createElement("span");
			fill.className = "crop-bar-fill";
			const fraction = largestPlots > 0 ? Math.min(1, entry.plots / largestPlots) : 0;
			fill.style.setProperty("--bar-fill", `${(fraction * 100).toFixed(1)}%`);
			bar.appendChild(fill);

			item.append(cropName, plots, bar);
			list.appendChild(item);
		}
		resultsContainer.appendChild(list);

		const total = document.createElement("div");
		total.className = "grand-total";
		total.setAttribute("role", "status");
		const totalLabel = document.createElement("span");
		totalLabel.className = "grand-total-label";
		totalLabel.textContent = "Total large plots";
		const totalValue = document.createElement("span");
		totalValue.className = "grand-total-value";
		totalValue.textContent = calculator.formatPlots(totalPlots);
		total.append(totalLabel, totalValue);
		resultsContainer.appendChild(total);
	}

	function renderBreakdown(selection) {
		breakdownContainer.textContent = "";
		for (const entry of selection) {
			const food = requireFood(entry.foodId);
			const demand = calculator.computePlotDemand(cropData, [entry]);
			const details = document.createElement("details");
			details.className = "breakdown-item";
			details.open = openBreakdowns.has(entry.foodId);
			details.addEventListener("toggle", () => {
				if (details.open) openBreakdowns.add(entry.foodId);
				else openBreakdowns.delete(entry.foodId);
			});
			const summary = document.createElement("summary");
			summary.textContent = `${food.name} at ${calculator.formatPlots(entry.perHour)} per hour`;
			details.appendChild(summary);
			if (demand.length === 0) {
				const none = document.createElement("p");
				none.className = "empty-state";
				none.textContent = "No farm plots needed.";
				details.appendChild(none);
			} else {
				const list = document.createElement("ul");
				list.className = "breakdown-list";
				for (const crop of demand) {
					const item = document.createElement("li");
					const cropName = document.createElement("span");
					cropName.textContent = crop.name;
					const cropPlots = document.createElement("span");
					cropPlots.className = "crop-plots";
					cropPlots.textContent = calculator.formatPlots(crop.plots);
					item.append(cropName, cropPlots);
					list.appendChild(item);
				}
				details.appendChild(list);
			}
			breakdownContainer.appendChild(details);
		}
	}

	function applySearchFilter() {
		const query = dishSearchInput.value.trim().toLowerCase();
		let visibleCount = 0;
		for (const [foodId, item] of dishListItemsByFoodId) {
			const food = requireFood(foodId);
			const isVisible = query === "" || food.name.toLowerCase().includes(query);
			item.hidden = !isVisible;
			if (isVisible) visibleCount += 1;
		}
		catalogEmpty.hidden = visibleCount > 0;
		catalogCount.textContent = query === ""
			? `${visibleCount} dishes`
			: `${visibleCount} ${visibleCount === 1 ? "match" : "matches"}`;
	}

	dishSearchInput.addEventListener("input", applySearchFilter);
	buildDishList();
	applySearchFilter();
	updateSelectedEmptyState();
	recompute();
})();
