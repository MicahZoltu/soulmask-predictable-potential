// Entry point. Assembles the leaf dependencies and runs the build from environment-supplied tool and asset paths.
import { ASSET_MANIFEST } from "./manifest"
import { createFileSystem } from "./leaves/fileSystem"
import { createRepak } from "./leaves/repak"
import { createUassetWrapper } from "./leaves/uassetWrapper"
import { runBuild } from "./orchestration/runBuild"

const PAK_VERSION = "V11"
const PAK_MOUNT_POINT = "../../../"

function requireEnvironment(name: string): string {
	const value = process.env[name]
	if (value === undefined || value.length === 0) throw new Error(`missing required environment variable ${name}`)
	return value
}

const buildRoot = import.meta.dir.replace(/\/src$/, "")
const scratchDir = `${buildRoot}/.work`
const config = {
	contentRoots: {
		client: requireEnvironment("SOULMASK_CLIENT_CONTENT"),
		server: requireEnvironment("SOULMASK_SERVER_CONTENT"),
	},
	scratchDir,
	pakRootDir: `${scratchDir}/pakroot`,
	outputPakPath: `${buildRoot}/dist/PredictablePotential_P.pak`,
	pakMountPoint: PAK_MOUNT_POINT,
	pakVersion: PAK_VERSION,
}

const dotnetRoot = requireEnvironment("DOTNET_ROOT")
const dependencies = {
	fileSystem: createFileSystem(),
	uassetWrapper: createUassetWrapper({
		dotnetExecutable: `${dotnetRoot}/dotnet`,
		roundtripDll: requireEnvironment("ROUNDTRIP_DLL"),
		assetToJsonDll: requireEnvironment("UASSET_TO_JSON_DLL"),
		environment: {
			...process.env,
			DOTNET_ROOT: dotnetRoot,
			DOTNET_SYSTEM_GLOBALIZATION_INVARIANT: "1",
			PATH: `${dotnetRoot}:${process.env.PATH ?? ""}`,
		},
	}),
	repak: createRepak({ repakExecutable: requireEnvironment("REPAK_PATH") }),
}

const result = runBuild(dependencies, config, ASSET_MANIFEST)
console.log(`built ${result.assets.length} assets`)
console.log(result.pak.info.trim())
console.log(result.pak.listing.trim())
console.log(`output: ${result.pak.outputPakPath}`)
console.log(`sha256: ${result.pak.sha256}`)
