// Leaf factory for the .NET UAssetAPI wrapper. Requires a .NET 8 runtime and the prebuilt wrapper projects.
export interface UassetWrapperConfig {
	dotnetExecutable: string
	roundtripDll: string
	assetToJsonDll: string
	environment: Record<string, string | undefined>
}

export interface UassetWrapper {
	// Emits <outputBase>.export.json plus <outputBase>.uasset and .uexp.
	exportAsset(inputUassetPath: string, outputBasePath: string): void
	// Writes <outputBase>.uasset and .uexp from the source asset and a replacement export JSON.
	writeEdited(inputUassetPath: string, outputBasePath: string, replacementJsonPath: string): void
	// Writes a fresh export JSON from a written asset.
	reparseToJson(inputUassetPath: string, outputJsonPath: string): void
}

function runDotnet(config: UassetWrapperConfig, args: string[]): void {
	const result = Bun.spawnSync([config.dotnetExecutable, ...args], {
		env: config.environment,
		stdout: "pipe",
		stderr: "pipe",
	})
	if (result.exitCode !== 0) {
		const stderr = new TextDecoder().decode(result.stderr)
		throw new Error(`dotnet ${args.join(" ")} failed (${result.exitCode}): ${stderr}`)
	}
}

export function createUassetWrapper(config: UassetWrapperConfig): UassetWrapper {
	return {
		exportAsset(inputUassetPath, outputBasePath) {
			runDotnet(config, [config.roundtripDll, inputUassetPath, outputBasePath])
		},
		writeEdited(inputUassetPath, outputBasePath, replacementJsonPath) {
			runDotnet(config, [config.roundtripDll, inputUassetPath, outputBasePath, replacementJsonPath])
		},
		reparseToJson(inputUassetPath, outputJsonPath) {
			runDotnet(config, [config.assetToJsonDll, inputUassetPath, outputJsonPath])
		},
	}
}
