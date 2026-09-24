// Game.locres: write the Origin talent titles and descriptions for the six classes.
import { locresKeyText, replaceLocresKeys, type LocresDocument } from "../pure/locres"
import { originLocalizationTexts } from "../pure/localization"

export function applyOriginLocalization(document: LocresDocument): void {
	replaceLocresKeys(document, originLocalizationTexts())
}

export function verifyOriginLocalization(document: LocresDocument): void {
	for (const [key, expected] of originLocalizationTexts()) {
		const actual = locresKeyText(document, key)
		if (actual === undefined) throw new Error(`origin localization: key ${key} is missing`)
		if (actual !== expected) throw new Error(`origin localization: key ${key} = ${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`)
	}
}
