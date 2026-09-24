// Settled progression constants from DESIGN.md ("Proficiency caps", "Recruit starting proficiency").
export const PROFICIENCY_CAP_BASE = 85
export const PROFICIENCY_CAP_LOWER_LIMIT = 50
export const PROFICIENCY_CAP_UPPER_LIMIT = 150
export const CLASS_SKILL_ADDEND = 40
export const CLASS_SKILL_CAP = PROFICIENCY_CAP_BASE + CLASS_SKILL_ADDEND
export const NON_CLASS_SKILL_CAP = PROFICIENCY_CAP_BASE

export const STARTING_CURVE_LEVEL_MIN = 1
export const STARTING_CURVE_LEVEL_MAX = 50
export const STARTING_CURVE_VALUE_MIN = 1
export const STARTING_CURVE_VALUE_MAX = 76
export const CLASS_STARTING_ADDEND = 36
export const NATIVE_START_FALLBACK = 1

// The juese-level array covers every level outright; the guard band catches an out-of-range level 0 and the terminal band catches any level past the shared curve.
export const STARTING_GUARD_LEVEL = 0
export const STARTING_GUARD_VALUE = NATIVE_START_FALLBACK
export const STARTING_PLATEAU_LEVEL_MIN = STARTING_CURVE_LEVEL_MAX + 1
export const STARTING_PLATEAU_LEVEL_MAX = 200

export interface StartingBand {
	minLevel: number
	maxLevel: number
	value: number
}

// Shared non-class starting curve from DESIGN.md: round(1 + 75*(L-1)/49), 1 at level 1 and 76 at level 50.
export function startingCurveValue(level: number): number {
	const span = STARTING_CURVE_LEVEL_MAX - STARTING_CURVE_LEVEL_MIN
	const rise = STARTING_CURVE_VALUE_MAX - STARTING_CURVE_VALUE_MIN
	return Math.round(STARTING_CURVE_VALUE_MIN + rise * (level - STARTING_CURVE_LEVEL_MIN) / span)
}

export function buildStartingBands(): StartingBand[] {
	const bands: StartingBand[] = [
		{ minLevel: STARTING_GUARD_LEVEL, maxLevel: STARTING_GUARD_LEVEL, value: STARTING_GUARD_VALUE },
	]
	for (let level = STARTING_CURVE_LEVEL_MIN; level <= STARTING_CURVE_LEVEL_MAX; level += 1) {
		const value = startingCurveValue(level)
		bands.push({ minLevel: level, maxLevel: level, value })
	}
	bands.push({
		minLevel: STARTING_PLATEAU_LEVEL_MIN,
		maxLevel: STARTING_PLATEAU_LEVEL_MAX,
		value: startingCurveValue(STARTING_CURVE_LEVEL_MAX),
	})
	return bands
}
