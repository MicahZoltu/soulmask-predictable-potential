// Pure reader and serializer for the UE4 cooked .locres string table (version 3, CityHash64 UTF-16).
// Every string keeps its original encoded bytes so an unchanged serialize is byte-identical; a replacement appends a fresh string-table entry so an entry shared by several keys is never clobbered.

export const LOCRES_VERSION = 3

export const LOCRES_MAGIC: Uint8Array = Uint8Array.from([0x0e, 0x14, 0x74, 0x75, 0x67, 0x4a, 0x03, 0xfc, 0x4a, 0x15, 0x90, 0x9d, 0xc3, 0x37, 0x7f, 0x1b])

export interface LocresString {
	value: string
	raw: Uint8Array
}

export interface LocresKey {
	keyHash: number
	key: LocresString
	sourceHash: number
	stringIndex: number
}

export interface LocresNamespace {
	namespaceHash: number
	name: LocresString
	keys: LocresKey[]
}

export interface LocresStringEntry {
	text: LocresString
	refCount: number
}

export interface LocresDocument {
	magic: Uint8Array
	version: number
	namespaces: LocresNamespace[]
	stringTable: LocresStringEntry[]
	entryCount: number
}

interface LocresCursor {
	offset: number
}

function requireBytes(bytes: Uint8Array, cursor: LocresCursor, count: number, label: string): void {
	if (cursor.offset + count > bytes.length) throw new Error(`locres: ${label} is truncated`)
}

function readInt32(view: DataView, bytes: Uint8Array, cursor: LocresCursor, label: string): number {
	requireBytes(bytes, cursor, 4, label)
	const value = view.getInt32(cursor.offset, true)
	cursor.offset += 4
	return value
}

function readUint32(view: DataView, bytes: Uint8Array, cursor: LocresCursor, label: string): number {
	requireBytes(bytes, cursor, 4, label)
	const value = view.getUint32(cursor.offset, true)
	cursor.offset += 4
	return value
}

function readByte(view: DataView, bytes: Uint8Array, cursor: LocresCursor, label: string): number {
	requireBytes(bytes, cursor, 1, label)
	const value = view.getUint8(cursor.offset)
	cursor.offset += 1
	return value
}

function readBigInt64(view: DataView, bytes: Uint8Array, cursor: LocresCursor, label: string): bigint {
	requireBytes(bytes, cursor, 8, label)
	const value = view.getBigInt64(cursor.offset, true)
	cursor.offset += 8
	return value
}

function readString(view: DataView, bytes: Uint8Array, cursor: LocresCursor, label: string): LocresString {
	const length = readInt32(view, bytes, cursor, `${label} length`)
	const start = cursor.offset - 4
	if (length === 0) return { value: "", raw: bytes.slice(start, cursor.offset) }
	const count = Math.abs(length)
	if (length < 0) {
		requireBytes(bytes, cursor, count * 2, label)
		const value = new TextDecoder("utf-16le").decode(bytes.subarray(cursor.offset, cursor.offset + (count - 1) * 2))
		cursor.offset += count * 2
		return { value, raw: bytes.slice(start, cursor.offset) }
	}
	requireBytes(bytes, cursor, count, label)
	const value = decodeLatin1(bytes, cursor.offset, count - 1)
	cursor.offset += count
	return { value, raw: bytes.slice(start, cursor.offset) }
}

function decodeLatin1(bytes: Uint8Array, start: number, length: number): string {
	let value = ""
	for (let index = 0; index < length; index += 4096) {
		const end = Math.min(index + 4096, length)
		value += String.fromCharCode(...bytes.subarray(start + index, start + end))
	}
	return value
}

function isAscii(value: string): boolean {
	for (let index = 0; index < value.length; index += 1) {
		if (value.charCodeAt(index) > 0x7f) return false
	}
	return true
}

export function encodeLocresString(value: string): LocresString {
	if (isAscii(value)) {
		const raw = new Uint8Array(4 + value.length + 1)
		new DataView(raw.buffer).setInt32(0, value.length + 1, true)
		for (let index = 0; index < value.length; index += 1) raw[4 + index] = value.charCodeAt(index)
		return { value, raw }
	}
	const raw = new Uint8Array(4 + (value.length + 1) * 2)
	const view = new DataView(raw.buffer)
	view.setInt32(0, -(value.length + 1), true)
	for (let index = 0; index < value.length; index += 1) view.setUint16(4 + index * 2, value.charCodeAt(index), true)
	return { value, raw }
}

export function parseLocres(bytes: Uint8Array): LocresDocument {
	if (bytes.length < 33) throw new Error(`locres: file too small (${bytes.length} bytes)`)
	const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
	const magic = bytes.slice(0, 16)
	for (let index = 0; index < 16; index += 1) {
		if (magic[index] !== LOCRES_MAGIC[index]) throw new Error("locres: unexpected file magic")
	}
	const cursor: LocresCursor = { offset: 16 }
	const version = readByte(view, bytes, cursor, "version")
	if (version !== LOCRES_VERSION) throw new Error(`locres: unsupported version ${version}, expected ${LOCRES_VERSION}`)
	const tableOffset = Number(readBigInt64(view, bytes, cursor, "string-table offset"))
	const entryCount = readInt32(view, bytes, cursor, "entry count")
	const namespaceCount = readInt32(view, bytes, cursor, "namespace count")
	if (entryCount < 0) throw new Error(`locres: negative entry count ${entryCount}`)
	if (namespaceCount < 0) throw new Error(`locres: negative namespace count ${namespaceCount}`)
	const namespaces: LocresNamespace[] = []
	for (let namespaceIndex = 0; namespaceIndex < namespaceCount; namespaceIndex += 1) {
		const namespaceHash = readUint32(view, bytes, cursor, `namespace ${namespaceIndex} hash`)
		const name = readString(view, bytes, cursor, `namespace ${namespaceIndex} name`)
		const keyCount = readInt32(view, bytes, cursor, `namespace ${namespaceIndex} key count`)
		if (keyCount < 0) throw new Error(`locres: negative key count ${keyCount} in namespace ${namespaceIndex}`)
		const keys: LocresKey[] = []
		for (let keyIndex = 0; keyIndex < keyCount; keyIndex += 1) {
			const keyHash = readUint32(view, bytes, cursor, `namespace ${namespaceIndex} key ${keyIndex} hash`)
			const key = readString(view, bytes, cursor, `namespace ${namespaceIndex} key ${keyIndex}`)
			const sourceHash = readUint32(view, bytes, cursor, `namespace ${namespaceIndex} key ${keyIndex} source hash`)
			const stringIndex = readInt32(view, bytes, cursor, `namespace ${namespaceIndex} key ${keyIndex} string index`)
			keys.push({ keyHash, key, sourceHash, stringIndex })
		}
		namespaces.push({ namespaceHash, name, keys })
	}
	if (cursor.offset !== tableOffset) throw new Error(`locres: string-table offset ${tableOffset} does not match key data end ${cursor.offset}`)
	const stringCount = readInt32(view, bytes, cursor, "string count")
	if (stringCount < 0) throw new Error(`locres: negative string count ${stringCount}`)
	const stringTable: LocresStringEntry[] = []
	for (let stringIndex = 0; stringIndex < stringCount; stringIndex += 1) {
		const text = readString(view, bytes, cursor, `string ${stringIndex}`)
		const refCount = readInt32(view, bytes, cursor, `string ${stringIndex} reference count`)
		stringTable.push({ text, refCount })
	}
	if (cursor.offset !== bytes.length) throw new Error(`locres: ${bytes.length - cursor.offset} trailing bytes`)
	for (const namespace of namespaces) {
		for (const key of namespace.keys) {
			if (key.stringIndex < 0 || key.stringIndex >= stringTable.length) {
				throw new Error(`locres: key ${key.key.value} references string ${key.stringIndex} outside the table`)
			}
		}
	}
	return { magic, version, namespaces, stringTable, entryCount }
}

function int32(value: number): Uint8Array {
	const bytes = new Uint8Array(4)
	new DataView(bytes.buffer).setInt32(0, value, true)
	return bytes
}

function uint32(value: number): Uint8Array {
	const bytes = new Uint8Array(4)
	new DataView(bytes.buffer).setUint32(0, value, true)
	return bytes
}

export function serializeLocres(document: LocresDocument): Uint8Array {
	const chunks: Uint8Array[] = []
	let length = 0
	function push(chunk: Uint8Array): void {
		chunks.push(chunk)
		length += chunk.length
	}
	push(document.magic)
	push(Uint8Array.from([document.version]))
	push(new Uint8Array(8))
	push(int32(document.entryCount))
	push(int32(document.namespaces.length))
	for (const namespace of document.namespaces) {
		push(uint32(namespace.namespaceHash))
		push(namespace.name.raw)
		push(int32(namespace.keys.length))
		for (const key of namespace.keys) {
			push(uint32(key.keyHash))
			push(key.key.raw)
			push(uint32(key.sourceHash))
			push(int32(key.stringIndex))
		}
	}
	const tableOffset = length
	push(int32(document.stringTable.length))
	for (const entry of document.stringTable) {
		push(entry.text.raw)
		push(int32(entry.refCount))
	}
	const output = new Uint8Array(length)
	let offset = 0
	for (const chunk of chunks) {
		output.set(chunk, offset)
		offset += chunk.length
	}
	new DataView(output.buffer).setBigInt64(17, BigInt(tableOffset), true)
	return output
}

export function replaceLocresKeys(document: LocresDocument, replacements: ReadonlyMap<string, string>): number {
	const replaced = new Set<string>()
	for (const namespace of document.namespaces) {
		for (const key of namespace.keys) {
			const replacement = replacements.get(key.key.value)
			if (replacement === undefined) continue
			key.stringIndex = document.stringTable.length
			document.stringTable.push({ text: encodeLocresString(replacement), refCount: 1 })
			replaced.add(key.key.value)
		}
	}
	const missing = [...replacements.keys()].filter((key) => !replaced.has(key))
	if (missing.length > 0) throw new Error(`locres: keys not found: ${missing.join(", ")}`)
	return replaced.size
}

export function locresKeyText(document: LocresDocument, key: string): string | undefined {
	for (const namespace of document.namespaces) {
		for (const candidate of namespace.keys) {
			if (candidate.key.value !== key) continue
			const entry = document.stringTable[candidate.stringIndex]
			if (entry === undefined) throw new Error(`locres: key ${key} references string ${candidate.stringIndex} outside the table`)
			return entry.text.value
		}
	}
	return undefined
}
