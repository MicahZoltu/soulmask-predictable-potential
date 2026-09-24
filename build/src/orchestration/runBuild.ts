// Top-level build orchestration: validate the manifest, build every asset, then pack and hash the result.
import type { FileSystem } from "../leaves/fileSystem"
import type { Repak } from "../leaves/repak"
import type { UassetWrapper } from "../leaves/uassetWrapper"
import { validateManifest, type ManifestEntry } from "../manifest"
import { buildAssets, type BuildConfig, type BuiltAsset } from "./buildPipeline"
import { packPak, type PackedPak } from "./packPipeline"

export interface BuildDependencies {
	fileSystem: FileSystem
	uassetWrapper: UassetWrapper
	repak: Repak
}

export interface BuildResult {
	assets: BuiltAsset[]
	pak: PackedPak
}

export function runBuild(dependencies: BuildDependencies, config: BuildConfig, manifest: readonly ManifestEntry[]): BuildResult {
	validateManifest(manifest)
	dependencies.fileSystem.removeDirectory(config.pakRootDir)
	dependencies.fileSystem.ensureDirectory(config.pakRootDir)
	const assets = buildAssets(dependencies, config, manifest)
	const pak = packPak(dependencies, config)
	for (const asset of assets) {
		for (const internalPath of asset.internalPaths) {
			if (!pak.listing.includes(internalPath)) throw new Error(`pak is missing ${internalPath}`)
		}
	}
	return { assets, pak }
}
