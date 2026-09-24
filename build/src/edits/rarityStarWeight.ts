// DT_PinZhiGoodNGStarWeight: map recruit quality to the class-talent star tier (red III, yellow II, purple I, low none).
import { type AssetFile, findDataTable, parseAssetProperty, readArray, readNumber, rowField, setNumber } from "./assetAccess"
import { qualityStarWeights } from "../pure/talents"

export function applyRarityStarWeight(asset: AssetFile): void {
	const table = findDataTable(asset)
	for (const row of table.rows) {
		const weights = qualityStarWeights(row.Name)
		const starMap = rowField(row, "GoodNGStarPrMap")
		for (const [index, pair] of readArray(starMap, `row ${row.Name}`).entries()) {
			if (!Array.isArray(pair) || pair.length !== 2) throw new Error(`row ${row.Name}: GoodNGStarPrMap[${index}] is not a key/value pair`)
			const key = parseAssetProperty(pair[0], `row ${row.Name}.key`)
			const value = parseAssetProperty(pair[1], `row ${row.Name}.value`)
			const star = readNumber(key, `row ${row.Name}`)
			if (star !== 1 && star !== 2 && star !== 3) throw new Error(`row ${row.Name}: unknown star key ${star}`)
			setNumber(value, weights[star])
		}
	}
}

export function verifyRarityStarWeight(asset: AssetFile): void {
	const table = findDataTable(asset)
	for (const row of table.rows) {
		const weights = qualityStarWeights(row.Name)
		const starMap = rowField(row, "GoodNGStarPrMap")
		const seen = new Set<number>()
		for (const [index, pair] of readArray(starMap, `row ${row.Name}`).entries()) {
			if (!Array.isArray(pair) || pair.length !== 2) throw new Error(`row ${row.Name}: GoodNGStarPrMap[${index}] is not a key/value pair`)
			const key = parseAssetProperty(pair[0], `row ${row.Name}.key`)
			const value = parseAssetProperty(pair[1], `row ${row.Name}.value`)
			const star = readNumber(key, `row ${row.Name}`)
			if (star !== 1 && star !== 2 && star !== 3) throw new Error(`row ${row.Name}: unknown star key ${star}`)
			if (readNumber(value, `row ${row.Name}`) !== weights[star]) {
				throw new Error(`row ${row.Name}: star ${star} weight mismatch`)
			}
			seen.add(star)
		}
		if (seen.size !== 3) throw new Error(`row ${row.Name}: expected stars 1/2/3, saw ${[...seen].join(",")}`)
	}
}
