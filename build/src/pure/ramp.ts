// The roster ramp from DESIGN.md ("Tribesman cap growth") and docs/game-reference/roster-limits.md.
// The mask applier sets `native base + tier value`, so each tier stores the cumulative total offset, not a per-click delta.
// The per-tier step differs per mode because Survival and Tribe Mode each load their own coefficient manager asset, so each manager's maps must carry that mode's increment.
export const NATIVE_RECRUIT_BASE = 3
export const RAMP_TIER_COUNT = 15
export const RAMP_FIRST_GATE_AWARENESS = 4
export const RAMP_GATE_STEP_AWARENESS = 4
export const SURVIVAL_RAMP_TIER_INCREMENT = 3
export const TRIBAL_RAMP_TIER_INCREMENT = 6

export interface RampTier {
	key: string
	cumulativeOffset: number
}

function validateRampIndex(index: number): void {
	if (!Number.isInteger(index) || index < 0 || index >= RAMP_TIER_COUNT) {
		throw new Error(`ramp tier index out of range: ${index}`)
	}
}

function validateTierIncrement(tierIncrement: number): void {
	if (!Number.isInteger(tierIncrement) || tierIncrement <= 0) {
		throw new Error(`ramp tier increment must be a positive integer: ${tierIncrement}`)
	}
}

export function rampGateAwareness(index: number): number {
	validateRampIndex(index)
	return RAMP_FIRST_GATE_AWARENESS + RAMP_GATE_STEP_AWARENESS * index
}

export function rampCumulativeOffset(index: number, tierIncrement: number): number {
	validateRampIndex(index)
	validateTierIncrement(tierIncrement)
	return tierIncrement * (index + 1)
}

export function rampKey(index: number): string {
	validateRampIndex(index)
	return `ZhaoMuRamp${String(index + 1).padStart(2, "0")}`
}

// The manager units carry a validation range, so the top tier's cumulative offset must fit inside it or the game clamps every larger offset down to the range maximum.
export function rampValueCeiling(tierIncrement: number): number {
	return rampCumulativeOffset(RAMP_TIER_COUNT - 1, tierIncrement)
}

export function buildRampTiers(tierIncrement: number): RampTier[] {
	validateTierIncrement(tierIncrement)
	const tiers: RampTier[] = []
	for (let index = 0; index < RAMP_TIER_COUNT; index += 1) {
		tiers.push({
			key: rampKey(index),
			cumulativeOffset: rampCumulativeOffset(index, tierIncrement),
		})
	}
	return tiers
}

export function parseRampTierIncrement(raw: string): number {
	if (!/^[0-9]+$/.test(raw)) throw new Error(`invalid ramp tier increment: ${raw}`)
	const parsed = Number(raw)
	if (!Number.isInteger(parsed) || parsed <= 0) throw new Error(`invalid ramp tier increment: ${raw}`)
	return parsed
}

export function rampTierIncrementFromParams(params: Record<string, string>): number {
	const raw = params.tierIncrement
	if (raw === undefined) throw new Error("missing ramp tier increment parameter")
	return parseRampTierIncrement(raw)
}

// The StringTableEntry keys the shipped node already used; the rebuilt tiers cycle them because the game falls back to the base name when a per-tier description is absent.
export const RAMP_NODE_NAME_KEY = "1_1012"
export const RAMP_NODE_DESCRIPTION_KEYS = ["1_1012_1", "1_1012_2", "1_1012_3"] as const
export const RAMP_STRING_TABLE = "/Game/Blueprints/UI/MianJia/String_Mask_XiuFu_Table.String_Mask_XiuFu_Table"
