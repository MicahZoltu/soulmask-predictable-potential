// The Origin talent display text for the six classes from DESIGN.md ("Talent composition").
// Each description keeps the shipped flavor sentence and growth-rate lead-in and replaces only the skill list with the settled class skill set.

export interface OriginLocalizationDefinition {
	className: string
	titleKey: string
	descKey: string
	title: string
	flavorSentence: string
	growthLeadIn: string
	skills: readonly string[]
}

export const ORIGIN_GROWTH_SUFFIX = " +75%."

export const ORIGIN_LOCALIZATION: readonly OriginLocalizationDefinition[] = [
	{
		className: "Laborer",
		titleKey: "8FF5EB0E4C5C501C2AEB64949C6B94A2",
		descKey: "41EA73D843134186D3A1138294D8F106",
		title: "Origin - Laborer",
		flavorSentence: "Mastered extensive and useful craftsmanship skills while doing heavy labor.",
		growthLeadIn: "Proficiency growth rate for ",
		skills: ["spear", "shield", "logging", "mining", "harvesting", "planting"],
	},
	{
		className: "Porter",
		titleKey: "A063C2114020D58E463FE1BEBDD25BA7",
		descKey: "2BB42DC44E8BAF146F6C70ADAB6E1260",
		title: "Origin - Porter",
		flavorSentence: "Demonstrates exceptional versatility and agility in various tasks",
		growthLeadIn: "Proficiency growth rate for learning ",
		skills: ["gauntlets", "weaving", "potting", "wood & stone", "leatherworking", "kilning"],
	},
	{
		className: "Craftsman",
		titleKey: "822E6FBA474FCC411D1007AFA36FBE3E",
		descKey: "D53DD9424807FD51C7B500A8DD9778C8",
		title: "Origin - Craftsman",
		flavorSentence: "Showed an extraordinary manufacturing talent from a young age and was highly anticipated since then.",
		growthLeadIn: "The proficiency growth rate for learning ",
		skills: ["gauntlets", "craftsmanship", "alchemy", "cooking", "weapon crafting", "armor crafting"],
	},
	{
		className: "Warrior",
		titleKey: "F95A8D9247CEDE8E45D730B272707611",
		descKey: "E1A42A234C160F2B02F7B1B507F9A05A",
		title: "Origin - Fighting",
		flavorSentence: "Raised in a clan that has produced many famous warriors.",
		growthLeadIn: "Proficiency growth rate for ",
		skills: ["spear", "blade", "shield", "bow", "dual-blade", "gauntlets", "great sword", "hammer", "whip"],
	},
	{
		className: "Hunter",
		titleKey: "D422BA5C48C8D54657F1A1B22C72DF0E",
		descKey: "176968E34BF3EBC5771651BA9ABCE012",
		title: "Origin - Hunting",
		flavorSentence: "Raised in a clan that has produced numerous legendary hunters.",
		growthLeadIn: "Proficiency growth rate for ",
		skills: ["spear", "blade", "shield", "bow", "harvesting", "logging"],
	},
	{
		className: "Guard",
		titleKey: "0A19099A4FC4000FEE3B8E852624F6F6",
		descKey: "9036332341CB3F786690F9AD6BC855BE",
		title: "Origin - Guard",
		flavorSentence: "Once promoted to a high position as a temple guard for exceptional martial arts.",
		growthLeadIn: "Proficiency growth rate for ",
		skills: ["spear", "blade", "shield", "bow", "great sword", "mining"],
	},
]

export function formatSkillList(skills: readonly string[]): string {
	if (skills.length === 0) throw new Error("skill list is empty")
	const last = skills[skills.length - 1]
	if (last === undefined) throw new Error("skill list is empty")
	const head = skills.slice(0, -1)
	if (head.length === 0) return last
	const joinedHead = head.join(", ")
	if (head.length === 1) return `${joinedHead} and ${last}`
	return `${joinedHead}, and ${last}`
}

export function buildOriginDescription(definition: OriginLocalizationDefinition): string {
	return `${definition.flavorSentence} ${definition.growthLeadIn}${formatSkillList(definition.skills)}${ORIGIN_GROWTH_SUFFIX}`
}

export function originLocalizationTexts(): Map<string, string> {
	const texts = new Map<string, string>()
	for (const definition of ORIGIN_LOCALIZATION) {
		if (texts.has(definition.titleKey)) throw new Error(`duplicate origin title key ${definition.titleKey}`)
		if (texts.has(definition.descKey)) throw new Error(`duplicate origin description key ${definition.descKey}`)
		texts.set(definition.titleKey, definition.title)
		texts.set(definition.descKey, buildOriginDescription(definition))
	}
	return texts
}
