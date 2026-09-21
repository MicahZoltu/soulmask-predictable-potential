# Mask Tech Tree (KeJiShu)

This reference describes how Soulmask's mask technology tree is stored and gated, and how a mod maker reads or edits a node.
It is written for a mod maker who wants to move, retarget, or unlock a node.
Related progression topics live in [proficiencies-and-caps.md](proficiencies-and-caps.md), [weapon-mastery.md](weapon-mastery.md), and the cross-system notes in [console-commands.md](console-commands.md), [training-ground-and-transfer.md](training-ground-and-transfer.md), and [roster-limits.md](roster-limits.md).

Confidence labels used below: **in-game verified** means observed on a running server or client; **asset-level verified** means read from the cooked asset or disassembled from the shipping binary; **inferred** means derived from structure rather than directly observed; **unverified** means plausible but not confirmed.

## 1. Form: Blueprint-driven, not a DataTable

The mask tech tree is a graph of Blueprint assets, not a single DataTable. (Asset-level verified)
There are **778** `BP_KJS_*` assets under `/Game/Blueprints/KeJiShu/`: **180** main nodes and **598** sub-nodes. (Asset-level verified)
The `~1560` figure in older community notes counted both the `.uasset` and `.uexp` halves of each asset pair, and the public `rubensayshi/soulmask-codex` parse reports 777 nodes; the direct asset listing of 778 is authoritative. (Asset-level verified)
A DataTable, `DT_AllTechTreeNode`, exists alongside the nodes, but it is only an index; the actual gate and unlock data is stored on each node Blueprint's class-default object. (Asset-level verified)

The node categories are:

| Category | Meaning | Count |
| --- | --- | --- |
| `main` | Main node, standard mode | 102 |
| `main_action` | Main node, Action mode | 41 |
| `main_management` | Main node, Management mode | 37 |
| `sub` | Sub-node, standard mode | 382 |
| `sub_action` | Sub-node, Action mode | 126 |
| `sub_management` | Sub-node, Management mode | 89 |

The category counts above are from the public 777-node parse; the direct listing counts 598 sub-nodes, one more than the 597 the parse classifies. (Parse-derived; the one-node discrepancy is inferred)
Main nodes total `102 + 41 + 37 = 180` in both. (Asset-level verified)

Most nodes exist in three parallel trees: a base tree, an `_Action` tree, and a `_Management` tree.
The standard (non-Action, non-Management) server template uses the base tree, but all three must be edited to cover every game mode. (Asset-level verified)

## 2. Asset layout

Main nodes live under `/Game/Blueprints/KeJiShu/Node/` and sub-nodes under `/Game/Blueprints/KeJiShu/SubNode/<category>/`. (Asset-level verified)

| Asset class | Example | Example path |
| --- | --- | --- |
| Main node | `BP_KJS_JianZhu_TuShi` | `/Game/Blueprints/KeJiShu/Node/BP_KJS_JianZhu_TuShi` |
| Sub-node | `BP_KJS_SubNode_JZ_TuShi_QiTa` | `/Game/Blueprints/KeJiShu/SubNode/JianZhu/BP_KJS_SubNode_JZ_TuShi_QiTa` |
| Sub-node, Action | `BP_KJS_SubNode_JZ_TuShi_QiTa_Action` | `/Game/Blueprints/KeJiShu/SubNode_Action/JianZhu/BP_KJS_SubNode_JZ_TuShi_QiTa_Action` |
| Sub-node, Management | `BP_KJS_SubNode_JZ_TuShi_QiTa_Management` | `/Game/Blueprints/KeJiShu/SubNode_Management/JianZhu/BP_KJS_SubNode_JZ_TuShi_QiTa_Management` |
| Index DataTable | `DT_AllTechTreeNode` | `/Game/Blueprints/DataTable/TechTree/DT_AllTechTreeNode` |

The index DataTable also ships `_Action` and `_Management` variants. (Asset-level verified)

## 3. Node fields

Each node's data is on its `Default__<Class>_C` class-default object.
`Name` and `Description` are localization keys, resolved through `Content/Localization/Game/en/Game.locres`. (Asset-level verified)

### 3.1 Main nodes

A main node (`Node*` CDO) has these fields:

| Field | Meaning |
| --- | --- |
| `Name` | Localization key for the node name |
| `Desciption` | Localization key for the description (misspelled in the shipped property) |
| `NeedMaskLevel` | Awareness Strength gate |
| `Icon` | Icon asset |
| `PreNodeList` | Prerequisite main nodes |
| `SubNodeList` | Child sub-nodes |
| `AutoLearnSubNodeList` | Sub-nodes granted automatically |

### 3.2 Sub-nodes

A sub-node (`SubNode*` CDO) has these fields:

| Field | Meaning |
| --- | --- |
| `Name` | Localization key for the node name |
| `Description` | Localization key for the description |
| `ConsumePoints` | Point cost to purchase the node |
| `NeedMaskLevel` | Awareness Strength gate |
| `PreMainNodeList` | Prerequisite main nodes |
| `PreSubNodeList` | Prerequisite sub-nodes |
| `KeJiPeiFangSoftList` | Recipe assets the node unlocks, as full asset paths |

The public parse additionally exposes `unlocks_recipes` (derived from `KeJiPeiFangSoftList`), `child_sub_nodes`, and `auto_learn_sub_nodes`. (Inferred)
The parsed per-node fields are `id`, `category`, `is_sub`, `name_zh`, `description_zh`, `required_mask_level`, `consume_points`, `prerequisite_main_nodes`, `prerequisite_sub_nodes`, `child_sub_nodes`, `auto_learn_sub_nodes`, `unlocks_recipes`, and `icon_path`. (Asset-level verified)

### 3.3 DT_AllTechTreeNode

`DT_AllTechTreeNode` is a DataTable with **102** rows.
Each row maps a numeric row key to one main-node Blueprint class. (Asset-level verified)
The table does not enumerate every main node, and it does not carry `NeedMaskLevel`, prerequisites, or costs; those live on the Blueprint. (Asset-level verified)
Treat it as a lookup index from a numeric tech id to a main-node class, not as the tree definition. (Inferred)

## 4. Awareness Strength gating

Every node's gate is its `NeedMaskLevel`, expressed in Awareness Strength levels. (Asset-level verified)
The field range is **1-60**, and the tree is spread across roughly **35** distinct mask levels in play. (Asset-level verified for the range; the ~35 spread is inferred from the node set)
A sub-node's `ConsumePoints` cost ranges **1-6** across the tree. (Asset-level verified)
The awareness (mask) level ceiling is the server option `MaxLevel`, default `60`, hard-clamped 1-60 by its schema. (Asset-level verified)
A node is purchasable only when the character's awareness reaches `NeedMaskLevel` and every `PreMainNodeList`/`PreSubNodeList` prerequisite is satisfied. (Inferred)

## 5. Moving or retargeting a node

To move a node earlier, change the values on its Blueprint CDO; there is no DataTable row to edit. (Asset-level verified)
The Training Ground subnode is the worked example; the station it unlocks, its acquisition recipes, and the recipe-tier side effects are in [training-ground-and-transfer.md](training-ground-and-transfer.md) §1 and §3. (Cross-reference)

### 5.1 Training Ground node

`BP_KJS_SubNode_JZ_TuShi_QiTa` ("Furniture", 家具) unlocks the Training Ground and practice dummy.

The node's full current values:

| Asset | Property | Current value |
| --- | --- | --- |
| `BP_KJS_SubNode_JZ_TuShi_QiTa` | `NeedMaskLevel` | 30 |
| `BP_KJS_SubNode_JZ_TuShi_QiTa` | `ConsumePoints` | 3 |
| `BP_KJS_SubNode_JZ_TuShi_QiTa` | `PreMainNodeList` | `[BP_KJS_JianZhu_TuShi]` |
| `BP_KJS_SubNode_JZ_TuShi_QiTa` | `PreSubNodeList` | `[BP_KJS_SubNode_JianZaoFang_3]` |
| `BP_KJS_JianZhu_TuShi` (parent main) | `NeedMaskLevel` | 30 |
| `BP_KJS_JianZhu_TuShi` | `PreNodeList` | `[BP_KJS_GJ_JiDi (mask 25), BP_KJS_GZT_YingHuo_2 (mask 20)]` |
| `BP_KJS_JianZhu_TuShi` | `AutoLearnSubNodeList` | `[BP_KJS_SubNode_JZ_TuShi_ShiZhuan]` |
| `BP_KJS_JianZhu_TuShi` | `SubNodeList` | includes `BP_KJS_SubNode_JZ_TuShi_QiTa` |

The node's `KeJiPeiFangSoftList` unlocks eight recipes: `BP_PeiFang_TrainingGround`, `BP_PeiFang_WeaponTrain`, `BP_PeiFang_JZ_ZaoPen`, `BP_PeiFang_HuoPen_3`, `BP_PeiFang_MuTouRen`, `BP_PeiFang_JinYangTuo`, `BP_PeiFang_JinYuMi`, and `BP_Formula_Building_WeaponShowCase`. (Asset-level verified)
The prerequisite sub `BP_KJS_SubNode_JianZaoFang_3` ("Building Technique", 建造工艺) is mask level 30, cost 2, gated on `BP_KJS_SubNode_JZ_TuShi_ShiZhuan`. (Asset-level verified)

The `_Action` variant is mask 30 with `PreMainNodeList = [BP_KJS_JianZhu_TuShi_Action]` and `PreSubNodeList = [BP_KJS_SubNode_JZ_TuShi_Action]`; its parent main has `PreNodeList = [BP_KJS_GJ_JiDi_Action, BP_KJS_GZT_YingHuo_2]`. (Asset-level verified)
The `_Management` variant is mask 30, cost 3, `PreMainNodeList = [BP_KJS_JianZhu_TuShi_Management]`, `PreSubNodeList = [BP_KJS_SubNode_JZ_TuShi_Management]`, parent `PreNodeList = [BP_KJS_GJ_JiDi_Management, BP_KJS_GZT_YingHuo_2]`. (Asset-level verified)

### 5.2 Comparison: the forgetfulness potion at 35

The forgetfulness potion is gated separately at mask level **35** by the sub-node `BP_KJS_SubNode_ZhiYaoTai_4` ("Intermediate Alchemy", 中级制药工艺). (Asset-level verified)
So the Training Ground and the potion sit on the same stone-building branch at consecutive mask tiers, 30 and 35; lowering one does not move the other. (Asset-level verified)

### 5.3 Recommended edit

Keep the node under its parent category and open the category early; this touches only value edits and array clears, so it needs no new asset reference. (Asset-level verified for the values; Linux authorability discussed in section 6)

Per tree (base, `_Action`, `_Management`):

1. On `BP_KJS_SubNode_JZ_TuShi_QiTa*`: set `NeedMaskLevel` 30 → 5, clear `PreSubNodeList` (empty array), set `ConsumePoints` 3 → 1.
2. On the parent main `BP_KJS_JianZhu_TuShi*`: set `NeedMaskLevel` 30 → 5, clear `PreNodeList` (empty array), clear `AutoLearnSubNodeList` (empty array).

The parent's `PreNodeList` must also be cleared because the parent requires `BP_KJS_GJ_JiDi` (mask 25) and `BP_KJS_GZT_YingHuo_2` (mask 20); lowering only the leaf is insufficient. (Asset-level verified)
Clearing `AutoLearnSubNodeList` also prevents the stone-hammer recipe from auto-granting early. (Inferred)
The `_Action` variant has no `ConsumePoints` property; leave its cost as shipped. (Asset-level verified)
The node's other seven recipes unlock alongside the Training Ground; splitting only the Training Ground recipe out would require a new node, which cannot be created with UAssetAPI. (Asset-level verified)

An alternative surgical reparent (move the sub-node under an early main such as `BP_KJS_GZT_YingHuo` at mask 5 or `BP_KJS_JianZhu_MaoCao` at mask 1) requires editing `SubNodeList` membership and adding an Import reference to the early main asset. (Asset-level verified for the current structure; the Import addition is unverified)

## 6. Editability

The decisive fact is that the gate data is a Blueprint CDO property, not a DataTable row. (Asset-level verified)

- **What is Linux-editable.** The node CDO `BP_KJS_SubNode_JZ_TuShi_QiTa` is a typed `NormalExport` (7 typed properties), so scalar and array value edits such as `NeedMaskLevel`, `ConsumePoints`, and clearing `PreSubNodeList` re-parse with UAssetAPI on Linux. (Asset-level verified)
  The index `DT_AllTechTreeNode` is a `DataTableExport`, so its rows and `NameMap` are Linux-editable, but it carries no gate data. (Asset-level verified)
- **What is not proven Linux-side.** No tech-node override has been mounted, and the game read of an overridden node CDO from a `_P.pak` is unverified for any Blueprint CDO. (Unverified)
  Adding a new node asset is impossible with UAssetAPI, which cannot create `.uasset`/`.uexp` pairs. (Asset-level verified)
  Adding an Import reference to a `SubNodeList` (the surgical reparent) is not round-trip proven. (Unverified)
- **What needs Windows/Modkit.** Replacing or rewriting Blueprint logic, and authoring a signed Workshop build, require the Windows Modkit; on Linux the route is an unsigned `_P.pak` loaded with `-fileopenlog`. (Asset-level verified)
- **Relation to ModConfiger.** ModConfiger merges or deletes DataTable entries, attaches Actor Components, and replaces Blueprints, on Windows, with no text/JSON format. (Asset-level verified)
  Because the tree is Blueprint-driven and not tabular, its DataTable row merge is the wrong lever for a node gate; the relevant ModConfiger operation would be a whole-Blueprint replacement. (Inferred)

## 7. Console commands

The command names are literal `Exec` strings in the shipping server binary `WS/Binaries/Linux/WSServer-Linux-Shipping`. (Asset-level verified)

| Command | Argument | Effect |
| --- | --- | --- |
| `UnLock_Techs` | none | Unlocks all technologies |
| `JSMJ` | none | Unlocks all mask nodes whose mask-level requirement the player already meets |

`UnLock_Techs` is the shipped all-tech command; `KeJiShu` is only a class/UI name and is not an exec command. (Asset-level verified)
Mask-node and proficiency setters are catalogued in [console-commands.md](console-commands.md). (Cross-reference)

## 8. Foot-guns

- **It is not a DataTable.** Do not look for a tech-tree row to edit a gate.
  The gate lives on the node's Blueprint CDO (`NeedMaskLevel`, `PreMainNodeList`, `PreSubNodeList`), so a DataTable row merge or row addition changes nothing about a node's availability. (Asset-level verified)
- **The index is only an index.** `DT_AllTechTreeNode` has 102 rows mapping numeric keys to main-node classes; it holds no `NeedMaskLevel`, costs, or prerequisites and does not enumerate every main node. (Asset-level verified)
- **Edits need Blueprint authoring.** Value edits on the typed CDO re-parse, but no tech-node pak has been mounted and the in-game read is unverified; new nodes, Import additions, and logic changes require the Windows Modkit. (Unverified)
- **The 777 count is stale.** The public parse reports 777 nodes; the direct asset listing counts 778 (180 main + 598 sub). (Asset-level verified)
- **Three trees, not one.** The base, `_Action`, and `_Management` variants are separate assets; editing only the base tree leaves the other two game modes gated at the shipped level. (Asset-level verified)
- **The parent spine gates the leaf.** Lowering a sub-node's `NeedMaskLevel` without clearing the parent main's `PreNodeList` leaves the whole branch locked. (Asset-level verified)
- **`Name` and `Description` are localization keys.** Editing a node's displayed name means editing `Game.locres`, not the Blueprint. (Asset-level verified)
- **Recipe unlocks are bundled.** A node's entire `KeJiPeiFangSoftList` unlocks together; there is no per-recipe gate on the node. (Asset-level verified)

## 9. Sources

The node assets, fields, and values are read from the cooked `/Game/Blueprints/KeJiShu/` tree and the `DT_AllTechTreeNode` index. (Asset-level verified)
The category counts and parsed field names come from the public `rubensayshi/soulmask-codex` `tech_tree.json` parse and are cross-checked against the direct asset listing. (Asset-level verified)
The console command literals are read from the shipping server binary. (Asset-level verified)
The asset census and parse method are in [asset-analysis.md](../reverse-engineering/asset-analysis.md); the value-edit and pak workflow is in [data-editing.md](../modding-guide/data-editing.md); the asset tree and cooked-asset model are in [game-and-assets.md](game-and-assets.md); and the Training Ground gate's station context is in [training-ground-and-transfer.md](training-ground-and-transfer.md).
