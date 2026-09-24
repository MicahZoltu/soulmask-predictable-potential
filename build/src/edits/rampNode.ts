// BP_Mask_XiuFu01_1012: rebuild the Connection Enhancement node as the 15-tier roster ramp from DESIGN.md.
import {
	type AssetFile,
	type AssetProperty,
	type JsonValue,
	exportData,
	findAssetProperty,
	findFirstClassDefaultExport,
	parseAssetProperty,
	readNumber,
	readNumeric,
	readString,
	readStructFields,
	setBoolean,
	setNumber,
	setString,
	structField,
} from "./assetAccess"
import { cloneJson } from "./propertyFactory"
import {
	RAMP_NODE_DESCRIPTION_KEYS,
	RAMP_NODE_NAME_KEY,
	RAMP_STRING_TABLE,
	RAMP_TIER_COUNT,
	rampGateAwareness,
	rampKey,
} from "../pure/ramp"

const NODE_LABEL = "mask node"
const ADD_ZHAO_MU_TYPE = "EMJXFTeShuZiType::TeShuZiType_AddZhaoMuNum"

function setStringTableText(property: AssetProperty, key: string): void {
	property.HistoryType = "StringTableEntry"
	property.TableId = RAMP_STRING_TABLE
	property.CultureInvariantString = null
	property.Value = key
}

function rampNodeList(asset: AssetFile): JsonValue[] {
	const classDefaultObject = findFirstClassDefaultExport(asset)
	const data = exportData(classDefaultObject, NODE_LABEL)
	const list = findAssetProperty(data, "MJXFNodeConfigList", NODE_LABEL)
	const listValue = list.Value
	if (!Array.isArray(listValue) || listValue.length === 0) throw new Error("mask node has no MJXFNodeConfigList entries")
	return listValue
}

function buildTier(template: AssetProperty, index: number): JsonValue {
	const entry = parseAssetProperty(cloneJson(template), `ramp tier ${index}`)
	const label = `ramp tier ${index}`
	setStringTableText(structField(entry, "MJXFNodeName", label), RAMP_NODE_NAME_KEY)
	setStringTableText(structField(entry, "MJXFNodeMiaoShu", label), RAMP_NODE_DESCRIPTION_KEYS[index % RAMP_NODE_DESCRIPTION_KEYS.length])
	setNumber(structField(entry, "NeedYiShiDengJi", label), rampGateAwareness(index))

	const demandList = readStructFields(structField(entry, "NeedJieSuoDaoJu", label), label)
	const demand = parseAssetProperty(demandList[0], `${label}.NeedJieSuoDaoJu[0]`)
	setNumber(structField(demand, "DemandCount", label), 1)

	const effectList = readStructFields(structField(entry, "NeedTeShuShuXingList", label), label)
	const effect = parseAssetProperty(effectList[0], `${label}.NeedTeShuShuXingList[0]`)
	setString(structField(effect, "TeShuType", label), ADD_ZHAO_MU_TYPE)
	setBoolean(structField(effect, "IsShuXingJi", label), false)
	setNumber(structField(effect, "ShuXingZhi", label), 0)
	setString(structField(effect, "ShuXingGameXiShuStr", label), rampKey(index))

	const config = structField(effect, "TeShuShuXingPeiZhi", label)
	setString(structField(config, "MJXGType", label), "EMianJuShiYongXiaoGuoType::MJXG_Max")
	setString(structField(config, "AttrType", label), "EAttrType::None")
	setBoolean(structField(config, "ZhiOrBiLi", label), true)
	setNumber(structField(config, "Dian", label), 0)
	setNumber(structField(config, "GEClass", label), 0)
	return entry
}

export function applyRampNode(asset: AssetFile): void {
	const listValue = rampNodeList(asset)
	const template = parseAssetProperty(listValue[0], "mask node template")
	const tiers: JsonValue[] = []
	for (let index = 0; index < RAMP_TIER_COUNT; index += 1) {
		tiers.push(buildTier(template, index))
	}
	listValue.splice(0, listValue.length, ...tiers)
}

export function verifyRampNode(asset: AssetFile): void {
	const listValue = rampNodeList(asset)
	if (listValue.length !== RAMP_TIER_COUNT) throw new Error(`mask node has ${listValue.length} tiers, expected ${RAMP_TIER_COUNT}`)
	for (let index = 0; index < RAMP_TIER_COUNT; index += 1) {
		const entry = parseAssetProperty(listValue[index], `ramp tier ${index}`)
		const label = `ramp tier ${index}`
		if (readNumber(structField(entry, "NeedYiShiDengJi", label), label) !== rampGateAwareness(index)) {
			throw new Error(`${label}: awareness gate mismatch`)
		}
		if (readNumber(structField(entry, "NeedMianJuDengJi", label), label) !== 0) throw new Error(`${label}: NeedMianJuDengJi should stay 0`)
		const effectList = readStructFields(structField(entry, "NeedTeShuShuXingList", label), label)
		const effect = parseAssetProperty(effectList[0], `${label}.effect`)
		if (readString(structField(effect, "TeShuType", label), label) !== ADD_ZHAO_MU_TYPE) throw new Error(`${label}: TeShuType mismatch`)
		if (readString(structField(effect, "ShuXingGameXiShuStr", label), label) !== rampKey(index)) throw new Error(`${label}: key mismatch`)
		if (readNumeric(structField(effect, "ShuXingZhi", label), label) !== 0) throw new Error(`${label}: ShuXingZhi should be zero`)
	}
	const serialized = JSON.stringify(listValue)
	for (const schemaKey of ["GeRenMaxZhaoMuCount", "GeRenMaxZhaoMuCount_Two", "GeRenMaxZhaoMuCount_Three"]) {
		if (serialized.includes(schemaKey)) throw new Error(`mask node still references disk schema key ${schemaKey}`)
	}
}
