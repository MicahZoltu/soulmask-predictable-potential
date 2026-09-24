// DT_Prof_ZhiYe_*: set every eligible class-skill row to the settled cap addend and reshape the row set to the class's DESIGN.md skill list.
import type { AssetFile } from "./assetAccess"
import { applyClassSkillSet, verifyClassSkillSet } from "./classSkillRows"
import { classDefinitionFromParams } from "../pure/classSets"
import { CLASS_SKILL_ADDEND } from "../pure/proficiency"

export function applyClassTable(asset: AssetFile, params: Record<string, string>): void {
	applyClassSkillSet(asset, classDefinitionFromParams(params), CLASS_SKILL_ADDEND)
}

export function verifyClassTable(asset: AssetFile, params: Record<string, string>): void {
	verifyClassSkillSet(asset, classDefinitionFromParams(params), CLASS_SKILL_ADDEND, "class table")
}
