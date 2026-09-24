// Builders for the exact UAssetAPI property JSON shape the .NET wrapper expects on deserialization.
import type { JsonObject, JsonValue } from "./assetAccess"

const UASSETAPI = "UAssetAPI.PropertyTypes.Objects"

function baseProperty(typeName: string, name: string): JsonObject {
	return {
		$type: `${UASSETAPI}.${typeName}, UAssetAPI`,
		Name: name,
		ArrayIndex: 0,
		PropertyGuid: null,
		IsZero: false,
		PropertyTagFlags: "None",
		PropertyTypeName: null,
		PropertyTagExtensions: "NoExtension",
	}
}

export function intProperty(name: string, value: number): JsonObject {
	return { ...baseProperty("IntPropertyData", name), Value: value }
}

export function floatProperty(name: string, value: number): JsonObject {
	return { ...baseProperty("FloatPropertyData", name), Value: value }
}

export function byteEnumProperty(name: string, enumType: string, value: string): JsonObject {
	return {
		...baseProperty("BytePropertyData", name),
		ByteType: "FName",
		EnumType: enumType,
		EnumValue: value,
	}
}

export function fnameByteProperty(name: string, value: string): JsonObject {
	return {
		...baseProperty("BytePropertyData", name),
		ByteType: "FName",
		EnumType: null,
		EnumValue: value,
	}
}

export function structProperty(name: string, structType: string, fields: JsonObject[]): JsonObject {
	return {
		$type: "UAssetAPI.PropertyTypes.Structs.StructPropertyData, UAssetAPI",
		StructType: structType,
		SerializeNone: true,
		StructGUID: "{00000000-0000-0000-0000-000000000000}",
		SerializationControl: "NoExtension",
		Operation: "None",
		Name: name,
		ArrayIndex: 0,
		PropertyGuid: null,
		IsZero: false,
		PropertyTagFlags: "None",
		PropertyTypeName: null,
		PropertyTagExtensions: "NoExtension",
		Value: fields,
	}
}

export function cloneJson(value: JsonValue): JsonValue {
	return structuredClone(value)
}
