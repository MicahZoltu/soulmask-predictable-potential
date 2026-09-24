// BP_GameXiShu_GuanLiQi: add the ramp keys to both default-object maps so the mask node's keys resolve to the cumulative offsets.
import {
	type AssetFile,
	type JsonValue,
	exportData,
	findAssetProperty,
	findFirstClassDefaultExport,
	parseAssetProperty,
	parseMapEntries,
	readNumeric,
	readString,
	readStructFields,
	setNumber,
	setString,
	structField,
} from "./assetAccess"
import { cloneJson } from "./propertyFactory"
import { buildRampTiers, rampTierIncrementFromParams, rampValueCeiling } from "../pure/ramp"

const MANAGER_LABEL = "game constant manager"
const TEMPLATE_KEY = "GeRenMaxZhaoMuCount"
const DIFFICULTY_FIELD = "BuTongNanDu_XiShuDefaultValue"

export function applyRampManager(asset: AssetFile, params: Record<string, string>): void {
	const classDefaultObject = findFirstClassDefaultExport(asset)
	const data = exportData(classDefaultObject, MANAGER_LABEL)
	const tierIncrement = rampTierIncrementFromParams(params)
	const ceiling = rampValueCeiling(tierIncrement)
	const tiers = buildRampTiers(tierIncrement)

	const flatMap = findAssetProperty(data, "GameXiShuMap", MANAGER_LABEL)
	for (const group of parseMapEntries(flatMap, MANAGER_LABEL)) {
		const inner = parseAssetProperty(readStructFields(group.value, MANAGER_LABEL)[0], `${MANAGER_LABEL}.GameXiShuMap`)
		const entries = parseMapEntries(inner, `${MANAGER_LABEL}.GameXiShuMap.inner`)
		if (entries.length === 0) throw new Error("GameXiShuMap group has no entries to use as a template")
		for (const tier of tiers) {
			const key = parseAssetProperty(cloneJson(entries[0].key), `${MANAGER_LABEL}.GameXiShuMap.key`)
			const value = parseAssetProperty(cloneJson(entries[0].value), `${MANAGER_LABEL}.GameXiShuMap.value`)
			setString(key, tier.key)
			setNumber(value, tier.cumulativeOffset)
			inner.Value = appendPair(inner.Value, [key, value])
		}
	}

	const configMap = findAssetProperty(data, "GameXiShuConfigMap", MANAGER_LABEL)
	for (const group of parseMapEntries(configMap, MANAGER_LABEL)) {
		const configList = parseAssetProperty(readStructFields(group.value, MANAGER_LABEL)[0], `${MANAGER_LABEL}.GameXiShuConfigMap`)
		const units = configList.Value
		if (!Array.isArray(units)) throw new Error("GameXiShuConfigMap group has no unit list")
		const template = units
			.map((unit) => parseAssetProperty(unit, `${MANAGER_LABEL}.GameXiShuConfigMap.unit`))
			.find((unit) => readString(structField(unit, "XiShuKey", MANAGER_LABEL), MANAGER_LABEL) === TEMPLATE_KEY)
		if (template === undefined) throw new Error(`GameXiShuConfigMap has no ${TEMPLATE_KEY} unit to clone`)
		for (const tier of tiers) {
			const unit = parseAssetProperty(cloneJson(template), `${MANAGER_LABEL}.GameXiShuConfigMap.${tier.key}`)
			setString(structField(unit, "XiShuKey", MANAGER_LABEL), tier.key)
			setNumber(structField(unit, "XiShuDefaultValue", MANAGER_LABEL), tier.cumulativeOffset)
			setNumber(structField(unit, "XiShuMinValue", MANAGER_LABEL), 0)
			setNumber(structField(unit, "XiShuMaxValue", MANAGER_LABEL), ceiling)
			for (const candidate of readStructFields(unit, MANAGER_LABEL)) {
				if (candidate.Name !== DIFFICULTY_FIELD) continue
				setNumber(parseAssetProperty(candidate, `${MANAGER_LABEL}.${tier.key}`), tier.cumulativeOffset)
			}
			units.push(unit)
		}
	}
}

function appendPair(list: JsonValue[], pair: JsonValue[]): JsonValue[] {
	const next = list.slice()
	next.push(pair)
	return next
}

export function verifyRampManager(asset: AssetFile, params: Record<string, string>): void {
	const classDefaultObject = findFirstClassDefaultExport(asset)
	const data = exportData(classDefaultObject, MANAGER_LABEL)
	const tierIncrement = rampTierIncrementFromParams(params)
	const ceiling = rampValueCeiling(tierIncrement)
	const tiers = buildRampTiers(tierIncrement)

	const flatMap = findAssetProperty(data, "GameXiShuMap", MANAGER_LABEL)
	for (const group of parseMapEntries(flatMap, MANAGER_LABEL)) {
		const inner = parseAssetProperty(readStructFields(group.value, MANAGER_LABEL)[0], `${MANAGER_LABEL}.GameXiShuMap`)
		const entries = parseMapEntries(inner, `${MANAGER_LABEL}.GameXiShuMap.inner`)
		for (const tier of tiers) {
			const match = entries.find((entry) => entry.key.Value === tier.key)
			if (match === undefined) throw new Error(`GameXiShuMap missing ${tier.key}`)
			if (match.value.Value !== tier.cumulativeOffset) throw new Error(`GameXiShuMap ${tier.key} = ${String(match.value.Value)}`)
		}
	}

	const configMap = findAssetProperty(data, "GameXiShuConfigMap", MANAGER_LABEL)
	for (const group of parseMapEntries(configMap, MANAGER_LABEL)) {
		const configList = parseAssetProperty(readStructFields(group.value, MANAGER_LABEL)[0], `${MANAGER_LABEL}.GameXiShuConfigMap`)
		const units = configList.Value
		if (!Array.isArray(units)) throw new Error("GameXiShuConfigMap group has no unit list")
		const parsed = units.map((unit) => parseAssetProperty(unit, `${MANAGER_LABEL}.GameXiShuConfigMap.unit`))
		for (const tier of tiers) {
			const match = parsed.find((unit) => structField(unit, "XiShuKey", MANAGER_LABEL).Value === tier.key)
			if (match === undefined) throw new Error(`GameXiShuConfigMap missing ${tier.key}`)
			const defaultValue = structField(match, "XiShuDefaultValue", MANAGER_LABEL).Value
			if (defaultValue !== tier.cumulativeOffset) throw new Error(`GameXiShuConfigMap ${tier.key} default = ${String(defaultValue)}`)
			const minValue = readNumeric(structField(match, "XiShuMinValue", MANAGER_LABEL), `${MANAGER_LABEL}.${tier.key}`)
			const maxValue = readNumeric(structField(match, "XiShuMaxValue", MANAGER_LABEL), `${MANAGER_LABEL}.${tier.key}`)
			if (tier.cumulativeOffset < minValue || tier.cumulativeOffset > maxValue) {
				throw new Error(`GameXiShuConfigMap ${tier.key} offset ${tier.cumulativeOffset} outside range ${minValue}..${maxValue}`)
			}
			if (maxValue < ceiling) throw new Error(`GameXiShuConfigMap ${tier.key} max ${maxValue} cannot hold ramp ceiling ${ceiling}`)
			const difficulties = readStructFields(match, MANAGER_LABEL).filter((candidate) => candidate.Name === DIFFICULTY_FIELD)
			if (difficulties.length === 0) throw new Error(`GameXiShuConfigMap ${tier.key} has no difficulty values`)
			for (const difficulty of difficulties) {
				const property = parseAssetProperty(difficulty, `${MANAGER_LABEL}.${tier.key}`)
				if (property.Value !== tier.cumulativeOffset) {
					throw new Error(`GameXiShuConfigMap ${tier.key} difficulty = ${String(property.Value)}`)
				}
			}
		}
	}
}
