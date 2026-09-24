// Orchestrates extract -> edit -> verify -> stage for every manifest entry, dispatching on the entry's asset kind.
import type { AssetFile, JsonValue } from "../edits/assetAccess"
import { parseAssetFile } from "../edits/assetAccess"
import { editDefinition, locresEditDefinition } from "../edits/registry"
import type { FileSystem } from "../leaves/fileSystem"
import type { UassetWrapper } from "../leaves/uassetWrapper"
import { type AssetSource, type ManifestEntry, assetKind, internalBasePath, internalLocresPath, internalUassetPath, internalUexpPath } from "../manifest"
import { parseLocres, serializeLocres } from "../pure/locres"
import { directoryOf } from "../pure/path"

export interface BuildConfig {
	contentRoots: Record<AssetSource, string>
	scratchDir: string
	pakRootDir: string
	outputPakPath: string
	pakMountPoint: string
	pakVersion: string
}

export interface BuiltAsset {
	id: string
	edit: string
	internalPaths: readonly string[]
}

export interface BuildAssetsDependencies {
	fileSystem: FileSystem
	uassetWrapper: UassetWrapper
}

function parseJsonFile(fileSystem: FileSystem, path: string): JsonValue {
	return JSON.parse(fileSystem.readTextFile(path))
}

function assertByteIdentical(fileSystem: FileSystem, firstPath: string, secondPath: string, label: string): void {
	if (!fileSystem.filesAreEqual(firstPath, secondPath)) {
		throw new Error(`${label}: ${firstPath} and ${secondPath} differ`)
	}
}

function buildUassetOne(
	dependencies: BuildAssetsDependencies,
	config: BuildConfig,
	entry: ManifestEntry,
): BuiltAsset {
	const { fileSystem, uassetWrapper } = dependencies
	const sourceBase = `${config.contentRoots[entry.source]}/${entry.assetPath}`
	if (!fileSystem.fileExists(`${sourceBase}.uasset`)) throw new Error(`${entry.id}: missing source asset ${sourceBase}.uasset`)
	if (!fileSystem.fileExists(`${sourceBase}.uexp`)) throw new Error(`${entry.id}: missing source package ${sourceBase}.uexp`)

	const workBase = `${config.scratchDir}/export/${entry.id}`
	fileSystem.ensureDirectory(`${config.scratchDir}/export`)
	// A no-change export and write must reproduce the shipped package bytes; this proves the wrapper is lossless before any edit.
	uassetWrapper.exportAsset(`${sourceBase}.uasset`, workBase)
	assertByteIdentical(fileSystem, `${workBase}.uasset`, `${sourceBase}.uasset`, `${entry.id} no-change uasset`)
	assertByteIdentical(fileSystem, `${workBase}.uexp`, `${sourceBase}.uexp`, `${entry.id} no-change uexp`)

	const asset: AssetFile = parseAssetFile(parseJsonFile(fileSystem, `${workBase}.export.json`))
	editDefinition(entry.edit).apply(asset, entry.params ?? {})

	const editedBase = `${config.scratchDir}/edited/${entry.id}`
	fileSystem.ensureDirectory(`${config.scratchDir}/edited`)
	const editJsonPath = `${editedBase}.edit.json`
	fileSystem.writeTextFile(editJsonPath, JSON.stringify(asset))
	uassetWrapper.writeEdited(`${sourceBase}.uasset`, editedBase, editJsonPath)
	uassetWrapper.reparseToJson(`${editedBase}.uasset`, `${editedBase}.reparse.json`)
	const reparsed = parseAssetFile(parseJsonFile(fileSystem, `${editedBase}.reparse.json`))
	editDefinition(entry.edit).verify(reparsed, entry.params ?? {})

	// A second no-change pass must reproduce the edited bytes exactly, proving the serialized edit is stable.
	const stabilityBase = `${editedBase}.stability`
	uassetWrapper.exportAsset(`${editedBase}.uasset`, stabilityBase)
	assertByteIdentical(fileSystem, `${stabilityBase}.uasset`, `${editedBase}.uasset`, `${entry.id} edited uasset stability`)
	assertByteIdentical(fileSystem, `${stabilityBase}.uexp`, `${editedBase}.uexp`, `${entry.id} edited uexp stability`)

	const stageBase = `${config.pakRootDir}/${internalBasePath(entry)}`
	fileSystem.ensureDirectory(directoryOf(stageBase))
	fileSystem.copyFile(`${editedBase}.uasset`, `${stageBase}.uasset`)
	fileSystem.copyFile(`${editedBase}.uexp`, `${stageBase}.uexp`)

	return {
		id: entry.id,
		edit: entry.edit,
		internalPaths: [internalUassetPath(entry), internalUexpPath(entry)],
	}
}

function buildLocresOne(dependencies: BuildAssetsDependencies, config: BuildConfig, entry: ManifestEntry): BuiltAsset {
	const { fileSystem } = dependencies
	const sourcePath = `${config.contentRoots[entry.source]}/${entry.assetPath}.locres`
	if (!fileSystem.fileExists(sourcePath)) throw new Error(`${entry.id}: missing source locres ${sourcePath}`)

	// A no-change parse and serialize must reproduce the shipped bytes; this proves the locres reader/writer is lossless before any edit.
	const originalBytes = fileSystem.readBinaryFile(sourcePath)
	const originalDocument = parseLocres(originalBytes)
	if (!bytesAreEqual(serializeLocres(originalDocument), originalBytes)) {
		throw new Error(`${entry.id}: no-change locres round-trip differs from ${sourcePath}`)
	}

	const edit = locresEditDefinition(entry.edit)
	edit.apply(originalDocument, entry.params ?? {})
	const editedBytes = serializeLocres(originalDocument)
	// The edited file must re-parse and read back the settled text, and a second serialize must reproduce the edited bytes exactly.
	const reparsed = parseLocres(editedBytes)
	edit.verify(reparsed, entry.params ?? {})
	if (!bytesAreEqual(serializeLocres(reparsed), editedBytes)) {
		throw new Error(`${entry.id}: edited locres is not serialization-stable`)
	}

	const stagePath = `${config.pakRootDir}/${internalLocresPath(entry)}`
	fileSystem.ensureDirectory(directoryOf(stagePath))
	fileSystem.writeBinaryFile(stagePath, editedBytes)

	return { id: entry.id, edit: entry.edit, internalPaths: [internalLocresPath(entry)] }
}

function bytesAreEqual(first: Uint8Array, second: Uint8Array): boolean {
	if (first.length !== second.length) return false
	for (let index = 0; index < first.length; index += 1) {
		if (first[index] !== second[index]) return false
	}
	return true
}

function buildOne(dependencies: BuildAssetsDependencies, config: BuildConfig, entry: ManifestEntry): BuiltAsset {
	if (assetKind(entry) === "locres") return buildLocresOne(dependencies, config, entry)
	return buildUassetOne(dependencies, config, entry)
}

export function buildAssets(dependencies: BuildAssetsDependencies, config: BuildConfig, manifest: readonly ManifestEntry[]): BuiltAsset[] {
	return manifest.map((entry) => buildOne(dependencies, config, entry))
}
