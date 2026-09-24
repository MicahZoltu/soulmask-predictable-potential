import { describe, expect, test } from "bun:test"
import { LOCRES_MAGIC, encodeLocresString, locresKeyText, parseLocres, replaceLocresKeys, serializeLocres, type LocresDocument } from "../src/pure/locres"

function stringEntry(text: string): { text: ReturnType<typeof encodeLocresString>; refCount: number } {
	return { text: encodeLocresString(text), refCount: 1 }
}

function key(name: string, stringIndex: number) {
	return { keyHash: 0, key: encodeLocresString(name), sourceHash: 0, stringIndex }
}

function syntheticDocument(): LocresDocument {
	return {
		magic: LOCRES_MAGIC.slice(),
		version: 3,
		namespaces: [{ namespaceHash: 0, name: encodeLocresString(""), keys: [key("AAA", 0), key("BBB", 1)] }],
		stringTable: [stringEntry("old a"), stringEntry("old b")],
		entryCount: 2,
	}
}

describe("locres round-trip", () => {
	test("an unchanged serialize re-parses byte-identically", () => {
		const document = syntheticDocument()
		const bytes = serializeLocres(document)
		const reparsed = parseLocres(bytes)
		expect(Array.from(serializeLocres(reparsed))).toEqual(Array.from(bytes))
	})

	test("reads the text a key points at", () => {
		const document = parseLocres(serializeLocres(syntheticDocument()))
		expect(locresKeyText(document, "AAA")).toBe("old a")
		expect(locresKeyText(document, "BBB")).toBe("old b")
		expect(locresKeyText(document, "CCC")).toBeUndefined()
	})

	test("encodes non-ASCII text as UTF-16 and still round-trips", () => {
		const document = syntheticDocument()
		document.stringTable[0] = stringEntry("经历·贤者")
		const reparsed = parseLocres(serializeLocres(document))
		expect(locresKeyText(reparsed, "AAA")).toBe("经历·贤者")
	})
})

describe("key replacement", () => {
	test("appends a fresh string entry and repoints every matching key", () => {
		const document = syntheticDocument()
		const replaced = replaceLocresKeys(document, new Map([["AAA", "new a"]]))
		expect(replaced).toBe(1)
		expect(document.stringTable.length).toBe(3)
		expect(locresKeyText(document, "AAA")).toBe("new a")
		expect(locresKeyText(document, "BBB")).toBe("old b")
		const reparsed = parseLocres(serializeLocres(document))
		expect(locresKeyText(reparsed, "AAA")).toBe("new a")
	})

	test("fails fast when a requested key is absent", () => {
		const document = syntheticDocument()
		expect(() => replaceLocresKeys(document, new Map([["CCC", "new c"]]))).toThrow()
	})
})

describe("format validation", () => {
	test("rejects unexpected magic", () => {
		const document = syntheticDocument()
		document.magic[0] = 0xff
		expect(() => parseLocres(serializeLocres(document))).toThrow()
	})

	test("rejects an unsupported version", () => {
		const document = syntheticDocument()
		document.version = 4
		expect(() => parseLocres(serializeLocres(document))).toThrow()
	})

	test("rejects trailing bytes", () => {
		const bytes = serializeLocres(syntheticDocument())
		const extended = new Uint8Array(bytes.length + 1)
		extended.set(bytes)
		expect(() => parseLocres(extended)).toThrow()
	})

	test("rejects a string index outside the table", () => {
		const document = syntheticDocument()
		document.namespaces[0].keys[0].stringIndex = 9
		expect(() => parseLocres(serializeLocres(document))).toThrow()
	})
})
