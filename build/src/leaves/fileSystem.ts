// Leaf factory for filesystem access and content hashing.
import { createHash } from "node:crypto"
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"

export interface FileSystem {
	ensureDirectory(path: string): void
	removeDirectory(path: string): void
	copyFile(sourcePath: string, targetPath: string): void
	readTextFile(path: string): string
	writeTextFile(path: string, contents: string): void
	readBinaryFile(path: string): Uint8Array
	writeBinaryFile(path: string, contents: Uint8Array): void
	fileExists(path: string): boolean
	filesAreEqual(firstPath: string, secondPath: string): boolean
	sha256(path: string): string
}

export function createFileSystem(): FileSystem {
	return {
		ensureDirectory(path) {
			mkdirSync(path, { recursive: true })
		},
		removeDirectory(path) {
			rmSync(path, { recursive: true, force: true })
		},
		copyFile(sourcePath, targetPath) {
			copyFileSync(sourcePath, targetPath)
		},
		readTextFile(path) {
			return readFileSync(path, "utf8")
		},
		writeTextFile(path, contents) {
			writeFileSync(path, contents)
		},
		readBinaryFile(path) {
			return readFileSync(path)
		},
		writeBinaryFile(path, contents) {
			writeFileSync(path, contents)
		},
		fileExists(path) {
			return existsSync(path)
		},
		filesAreEqual(firstPath, secondPath) {
			return readFileSync(firstPath).equals(readFileSync(secondPath))
		},
		sha256(path) {
			return createHash("sha256").update(readFileSync(path)).digest("hex")
		},
	}
}
