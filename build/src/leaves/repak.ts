// Leaf factory for the repak CLI.
export interface RepakConfig {
	repakExecutable: string
}

export interface RepakPackRequest {
	version: string
	mountPoint: string
	inputDirectory: string
	outputPakPath: string
}

export interface Repak {
	pack(request: RepakPackRequest): void
	list(pakPath: string): string
	info(pakPath: string): string
}

function runRepak(executable: string, args: string[]): { stdout: string; stderr: string } {
	const result = Bun.spawnSync([executable, ...args], { stdout: "pipe", stderr: "pipe" })
	const stdout = new TextDecoder().decode(result.stdout)
	const stderr = new TextDecoder().decode(result.stderr)
	if (result.exitCode !== 0) throw new Error(`repak ${args.join(" ")} failed (${result.exitCode}): ${stderr}`)
	return { stdout, stderr }
}

export function createRepak(config: RepakConfig): Repak {
	return {
		pack(request) {
			runRepak(config.repakExecutable, [
				"pack",
				"--version",
				request.version,
				"--mount-point",
				request.mountPoint,
				request.inputDirectory,
				request.outputPakPath,
			])
		},
		list(pakPath) {
			return runRepak(config.repakExecutable, ["list", pakPath]).stdout
		},
		info(pakPath) {
			return runRepak(config.repakExecutable, ["info", pakPath]).stdout
		},
	}
}
