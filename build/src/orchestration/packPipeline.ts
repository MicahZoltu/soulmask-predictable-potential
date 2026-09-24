// Orchestrates pak staging, packing, listing, and hashing.
import type { FileSystem } from "../leaves/fileSystem"
import type { Repak } from "../leaves/repak"
import { directoryOf } from "../pure/path"

export interface PackConfig {
	pakRootDir: string
	outputPakPath: string
	pakMountPoint: string
	pakVersion: string
}

export interface PackedPak {
	outputPakPath: string
	sha256: string
	listing: string
	info: string
}

export interface PackDependencies {
	fileSystem: FileSystem
	repak: Repak
}

export function packPak(dependencies: PackDependencies, config: PackConfig): PackedPak {
	const { fileSystem, repak } = dependencies
	fileSystem.ensureDirectory(directoryOf(config.outputPakPath))
	repak.pack({
		version: config.pakVersion,
		mountPoint: config.pakMountPoint,
		inputDirectory: config.pakRootDir,
		outputPakPath: config.outputPakPath,
	})
	return {
		outputPakPath: config.outputPakPath,
		sha256: fileSystem.sha256(config.outputPakPath),
		listing: repak.list(config.outputPakPath),
		info: repak.info(config.outputPakPath),
	}
}
