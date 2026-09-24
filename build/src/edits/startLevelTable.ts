// SLD_ChuShiLv_*: reshape each starting table to the class's DESIGN.md skill set and give those class skills the settled flat starting addend.
import type { AssetFile } from "./assetAccess"
import { applyClassSkillSet, verifyClassSkillSet } from "./classSkillRows"
import { classDefinitionFromParams } from "../pure/classSets"
import { CLASS_STARTING_ADDEND } from "../pure/proficiency"

export function applyStartLevelTable(asset: AssetFile, params: Record<string, string>): void {
	applyClassSkillSet(asset, classDefinitionFromParams(params), CLASS_STARTING_ADDEND)
}

export function verifyStartLevelTable(asset: AssetFile, params: Record<string, string>): void {
	verifyClassSkillSet(asset, classDefinitionFromParams(params), CLASS_STARTING_ADDEND, "start-level table")
}
