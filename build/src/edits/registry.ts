// Maps a manifest edit id to its apply and verify functions, split by asset kind: uasset edits run over the parsed UAssetAPI JSON, locres edits over the parsed locres document.
import type { AssetFile } from "./assetAccess"
import type { LocresDocument } from "../pure/locres"
import { applyOriginLocalization, verifyOriginLocalization } from "./locresText"
import { applyProficiencyConfig, verifyProficiencyConfig } from "./proficiencyConfig"
import { applyClassTable, verifyClassTable } from "./classTable"
import { applyStartLevelTable, verifyStartLevelTable } from "./startLevelTable"
import { applyMasteryTable, verifyMasteryTable } from "./masteryTable"
import { applyArchetypeTable, verifyArchetypeTable } from "./archetypeTable"
import { applyRampNode, verifyRampNode } from "./rampNode"
import { applyRampManager, verifyRampManager } from "./rampManager"
import { applyOriginTalentRows, verifyOriginTalentRows } from "./originTalentRows"
import { applyBornRandomConfig, verifyBornRandomConfig } from "./bornRandomConfig"
import { applyClassPoolRows, verifyClassPoolRows } from "./classPoolRows"
import { applyRarityStarWeight, verifyRarityStarWeight } from "./rarityStarWeight"
import { applyRarityGrantCadence, verifyRarityGrantCadence } from "./rarityGrantCadence"
import { applyPreferencePool, verifyPreferencePool } from "./preferencePool"
import { applyDefectPool, verifyDefectPool } from "./defectPool"

export interface EditDefinition {
	apply: (asset: AssetFile, params: Record<string, string>) => void
	verify: (asset: AssetFile, params: Record<string, string>) => void
}

export const EDIT_REGISTRY: Record<string, EditDefinition> = {
	proficiencyConfig: { apply: applyProficiencyConfig, verify: verifyProficiencyConfig },
	classTable: { apply: applyClassTable, verify: verifyClassTable },
	startLevelTable: { apply: applyStartLevelTable, verify: verifyStartLevelTable },
	masteryTable: { apply: applyMasteryTable, verify: verifyMasteryTable },
	archetypeTable: { apply: applyArchetypeTable, verify: verifyArchetypeTable },
	rampNode: { apply: applyRampNode, verify: verifyRampNode },
	rampManager: { apply: applyRampManager, verify: verifyRampManager },
	originTalentRows: { apply: applyOriginTalentRows, verify: verifyOriginTalentRows },
	bornRandomConfig: { apply: applyBornRandomConfig, verify: verifyBornRandomConfig },
	classPoolRows: { apply: applyClassPoolRows, verify: verifyClassPoolRows },
	rarityStarWeight: { apply: applyRarityStarWeight, verify: verifyRarityStarWeight },
	rarityGrantCadence: { apply: applyRarityGrantCadence, verify: verifyRarityGrantCadence },
	preferencePool: { apply: applyPreferencePool, verify: verifyPreferencePool },
	defectPool: { apply: applyDefectPool, verify: verifyDefectPool },
}

export interface LocresEditDefinition {
	apply: (document: LocresDocument, params: Record<string, string>) => void
	verify: (document: LocresDocument, params: Record<string, string>) => void
}

export const LOCRES_EDIT_REGISTRY: Record<string, LocresEditDefinition> = {
	originLocalization: { apply: applyOriginLocalization, verify: verifyOriginLocalization },
}

export function editDefinition(id: string): EditDefinition {
	const definition = EDIT_REGISTRY[id]
	if (definition === undefined) throw new Error(`unknown edit id ${id}`)
	return definition
}

export function locresEditDefinition(id: string): LocresEditDefinition {
	const definition = LOCRES_EDIT_REGISTRY[id]
	if (definition === undefined) throw new Error(`unknown locres edit id ${id}`)
	return definition
}
