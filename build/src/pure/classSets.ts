// The class skill sets from DESIGN.md ("Proficiency caps"), expressed as EProficiency enum names.
// The cap table and the starting table are the two cooked DataTables that must carry the same per-class skill set, at /Game/Blueprints/DataTable/Proficiency/ and /Game/Blueprints/DataTable/NaturalGift/.
export interface ClassDefinition {
	name: string
	tableAssetName: string
	startTableAssetName: string
	skills: readonly string[]
}

export const CLASS_DEFINITIONS: readonly ClassDefinition[] = [
	{
		name: "Hunter",
		tableAssetName: "DT_Prof_ZhiYe_ShouLieZhe",
		startTableAssetName: "SLD_ChuShiLv_LieShou",
		skills: ["Mao", "Dao", "DunPai", "Gong", "CaiShou", "FaMu"],
	},
	{
		name: "Guard",
		tableAssetName: "DT_Prof_ZhiYe_ShouHuZhe",
		startTableAssetName: "SLD_ChuShiLv_WeiShi",
		skills: ["Mao", "Dao", "DunPai", "Gong", "DaJian", "CaiKuang"],
	},
	{
		name: "Warrior",
		tableAssetName: "DT_Prof_ZhiYe_WuWeiZhe",
		startTableAssetName: "SLD_ChuShiLv_ZhanShi",
		skills: ["Mao", "Dao", "DunPai", "Gong", "ShuangDao", "QuanTao", "DaJian", "Chui", "Bian"],
	},
	{
		name: "Laborer",
		tableAssetName: "DT_Prof_ZhiYe_KuLi",
		startTableAssetName: "SLD_ChuShiLv_LiGong",
		skills: ["Mao", "DunPai", "FaMu", "CaiKuang", "CaiShou", "ZhongZhi"],
	},
	{
		name: "Porter",
		tableAssetName: "DT_Prof_ZhiYe_ZaGong",
		startTableAssetName: "SLD_ChuShiLv_ZaGong",
		skills: ["QuanTao", "FangZhi", "ZhiTao", "PaoMu", "RouPi", "RongLian"],
	},
	{
		name: "Craftsman",
		tableAssetName: "DT_Prof_ZhiYe_ZongJiang",
		startTableAssetName: "SLD_ChuShiLv_JiangRen",
		skills: ["QuanTao", "QiJu", "LianJin", "PengRen", "WuQi", "JiaZhou"],
	},
]

export function classDefinition(className: string): ClassDefinition {
	const definition = CLASS_DEFINITIONS.find((candidate) => candidate.name === className)
	if (definition === undefined) throw new Error(`unknown class ${className}`)
	return definition
}

export function classDefinitionFromParams(params: Record<string, string>): ClassDefinition {
	const className = params.className
	if (className === undefined) throw new Error("class skill table edit requires a className parameter")
	return classDefinition(className)
}
