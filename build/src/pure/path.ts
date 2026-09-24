// Pure path helpers shared by the build and pack pipelines.
export function directoryOf(path: string): string {
	const separator = path.lastIndexOf("/")
	if (separator < 0) throw new Error(`path has no directory: ${path}`)
	return path.slice(0, separator)
}
