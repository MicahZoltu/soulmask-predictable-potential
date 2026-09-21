# Training Ground and Transfer Systems

This reference describes the two shipped Soulmask systems that are most often mistaken for ways to move progression from one tribesman onto another: the Training Ground and the Mysterious Stone Table.
It is written for a mod maker who wants to know exactly what each system does, which values are editable, and where the boundary between data and new logic falls.
Related progression topics live in [proficiencies-and-caps.md](proficiencies-and-caps.md), [weapon-mastery.md](weapon-mastery.md), [talents.md](talents.md), and [tech-tree.md](tech-tree.md).

Confidence labels used below: **in-game verified** means observed on a running server or client; **asset-level verified** means read from the cooked asset or disassembled from the shipping binary; **inferred** means derived from structure rather than directly observed; **unverified** means plausible but not confirmed.

## 1. Training Ground overview

The Training Ground is a 1.0 / Shifting Sands-era addition for training a seated trainee from a seated mentor. (Release attribution; not derivable from the assets)
It is a two-seat station: a coach and a student occupy the `CoachSocket` and `StudentSocket` seats for the duration of a session, and `bNeedMoveToGongZuoTai = true` requires them to be moved to the station. (Asset-level verified)
The station itself is the practice building, distinct from the practice dummy described in section 2.

| Asset | Game path | Role |
| --- | --- | --- |
| `BP_JianZhuTrainingGround` | `/Game/Blueprints/JianZhu/QiTa/BP_JianZhuTrainingGround` | The station; native parent `AHJianZhuTrainingGround` |
| `BP_JianZhu_WeaponTrain_Base` | `/Game/Blueprints/JianZhu/JiaJu/BP_JianZhu_WeaponTrain_Base` | Practice dummy (`HJianZhuWeaponTrain`) |
| `WBP_TrainingGround`, `WBP_TrainingArrangement`, `WBP_TrainingInfo`, `WBP_TrainingSelectPage`, `WBP_SelectZuRenTraining` | `/Game/Blueprints/UI/JianZhu/TrainingGround/` | Client UI |
| `BP_KJS_SubNode_JZ_TuShi_QiTa` | `/Game/Blueprints/KeJiShu/` | Mask tech node that unlocks the station (`NeedMaskLevel = 30`) |

The owning native classes are `AHJianZhuTrainingGround`, `UHTrainingGroundManager`, and `UHTrainGroundInterfaceComponent`, with client widgets `UHUITrainingGround`, `UHUITrainGroundManage`, `UHUITrainingArrangement`, and `UHTrainingInfoWidget`. (Asset-level verified)
`BP_JianZhuTrainingGround` has zero `FunctionExport`s, so all behavior is native and driven by server RPCs; only its class-default-object data is editable. (Asset-level verified)

### 1.1 The four training tracks

`ETrainingType` has exactly four members, each an independent entry in the station's `TraningExpAddMap` (the shipped spelling omits the second `i`). (Asset-level verified)

| `ETrainingType` | UI label | What the track does |
| --- | --- | --- |
| `ShuLianDuTraining` | 战斗技巧提升 / Combat Skill Improvement | Raises the trainee's weapon proficiency **cap** toward the mentor's cap |
| `NGTraining` | 天赋学习 / Talent Learn | Grants one random positive talent the mentor possesses |
| `NGLevelTraining` | 天赋升级 / Talent Upgrade | Raises the star level of an already-learned trainee talent |
| `ZhuanJingTraining` | (no localized label shipped; text key `4669275F4F954DAA23F8D08E4F6A4DFE`) | Weapon-mastery track |

The single English-labeled view of the mechanics is the station UI: `WBP_TrainingArrangement.TextBlock_Describe_2` (Combat Skill) states the trainee learns the mentor's combat skill up to the mentor's cap, and that a combat-class tribesman can raise a primary weapon's cap to 125 while other weapons cap at 100. (Asset-level verified)
`ZhuanJingTraining` carries a `TraningExpAddMap` entry and a text key with no localized string in this build; whether it is reachable through the shipped UI is unverified.

### 1.2 Acquisition recipes

The station, dummy, and training-forget potion are built from three recipes; the Training Ground node's `KeJiPeiFangSoftList` unlocks the first two. (Asset-level verified)

| Recipe | Output | Inputs | Notes |
| --- | --- | --- | --- |
| `BP_PeiFang_TrainingGround` | `DaoJu_TrainingGround` (训练场) | 40 Stone Brick, 20 Hardwood Board, 40 Bronze Ingot, 20 Leather | `PeiFangDengJi = 2`; Crafting Table Construction Workshop; 60 s; Wood & Stone proficiency; 120 XP |
| `BP_PeiFang_WeaponTrain` | `DaoJu_JianZhu_WeaponTrain` (训练假人) | 20 Hardwood Board, 20 Bronze Ingot, 10 Hardwood Stick | 30 s |
| `BP_PeiFang_XunLianYiWangYao` | `BP_DaoJuFunction_XunLianYiWangYao` (训练遗忘药) | 1 Illusion Fruit, 2 Bloodstone, 2 Plant Essence, 10 Cocoa Powder or Mint | Alchemy Table; forgets one talent learned through training |

## 2. Editable fields and rates

The station's class default object is a `NormalExport`, so its values are UAssetAPI-editable on Linux. (Asset-level verified)

| Field | Shipped value | Meaning |
| --- | --- | --- |
| `CoachLvRequired` | `50` | Minimum character level for the coach seat |
| `HoldCharacterCount` | `2` | Seats occupied for a session |
| `MaxLogNum` | `100` | Training-log entry cap |
| `bNeedMoveToGongZuoTai` | `true` | Both actors must be moved to the station |
| `ZuoWeiData` | seats `CoachSocket`, `StudentSocket` | The two physical seats |

`TraningExpAddMap` is a `MapProperty` keyed by `ETrainingType`. (Asset-level verified)
Each value is a struct `FTraningExpAdd` with fields `UpgradeExpConfig`, `QualityAndExpRate`, `BaseExpPerSeconds`, `JinGuWanConfig`, `WeaponAdd`, `ArmorAdd`, `JinGuWanWeaponAdd`, and `JinGuWanArmorAdd`. (Asset-level verified)
The station's default object also carries `ProficiencyTypeAndWeaponType`, a map with one entry per weapon type, all nine mapping to their `EProficiency`. (Asset-level verified)

| Track key | `BaseExpPerSeconds` | `UpgradeExpConfig` (level band → `UpgradeExp`) |
| --- | --- | --- |
| `ShuLianDuTraining` | `1` | `0–60:1800`, `60–90:3600`, `90–120:7200`, `120–150:14400` |
| `NGTraining` | `1` | `0–1000:14400` |
| `NGLevelTraining` | `1` | `0–2:7200`, `2–3:14400` |
| `ZhuanJingTraining` | `1` | `0–1000:14400` |

Progress is `BaseExpPerSeconds` experience per second against the band's `UpgradeExp`. (Inferred from the field names and the native track design)
`QualityAndExpRate` is keyed by character quality `0–5` and currently resolves to `1.0, 0.8, 0.6, 0.4, 0.2, 0.0`; the quality-`5` entry is `0.0` on every track, so a quality-5 trainee gains no progress. (Asset-level verified)
Material multipliers `WeaponAdd` run from bone `0.05` to bronze `0.1` to black iron `0.2` to forged steel `0.4` to refined steel `0.8`, and `ArmorAdd` runs from bone `0.0125` to bronze `0.025` to black iron `0.05` to forged steel `0.1` to refined steel `0.2`. (Asset-level verified)
Speed-up items in `JinGuWanConfig` add `+1`/`+2`/`+4` and are carried by `DaoJu_Item_ZhiWuJingCui_C`, `_NingXueGao_C`, and `_ShengXueGao_C`. (Asset-level verified)

The global server multiplier `TrainingExpRatio` (`GameXishu.json`, default `1`, range `0.1–100`) scales all training experience, so it shortens every one of the four tracks. (Asset-level verified)
The group-`1` value differs per preset: `1` in Base and Management, `10` in Action, `50` in Creative, and `5` in PVP. (Asset-level verified)

### 2.1 Duration reference

At `BaseExpPerSeconds = 1` and no multipliers, a band's cost in seconds equals its `UpgradeExp`.

| Track | Band | `UpgradeExp` | Time at rate 1 |
| --- | --- | --- | --- |
| `ShuLianDuTraining` | `0–60` | `1800` | 30 min |
| `ShuLianDuTraining` | `60–90` | `3600` | 1 h |
| `ShuLianDuTraining` | `90–120` | `7200` | 2 h |
| `ShuLianDuTraining` | `120–150` | `14400` | 4 h |
| `NGTraining` | `0–1000` | `14400` | 4 h |
| `NGLevelTraining` | `0–2` | `7200` | 2 h |
| `NGLevelTraining` | `2–3` | `14400` | 4 h |
| `ZhuanJingTraining` | `0–1000` | `14400` | 4 h |

Community reporting gives roughly `7h 46m` per talent learned; the shipped track data computes to 4 h before `TrainingExpRatio`, quality, gear, and `JinGuWan` multipliers, so the two figures describe different measurement contexts and the reported figure is unverified here. (Reported estimate; track math is asset-level verified)

### 2.2 Practice dummy (separate path)

`BP_JianZhu_WeaponTrain_Base` is not the station. (Asset-level verified)
It carries 108 `WeaponTrainData` entries whose `AddProficiencyPerSecond` ranges `0.2–1.4`, whose `TrainMeetMaxLevel = 130`, and whose `ConsumeWeaponDuration = 0.1`; the tick period is `IncreaseProfInterval = 10`, the asset's `WeaponTypeProfMap` has nine entries, and `bIsSupportSetTuoGuanYuan = true`. (Asset-level verified)
The dummy raises the character's **current** proficiency value, not the cap, so it is a self-training path independent of a mentor. (Asset-level verified)

## 3. Coach gate and tech-tree access

`CoachLvRequired = 50` gates who may sit in the coach seat; the UI reinforces it with "成为导师需要族人等级超过50级" (`WBP_TrainingSelectPage.TextBlock_101`). (Asset-level verified)
In the shipped tracks, mentor stats are read as bounds rather than copied: the trainee's cap cannot exceed the mentor's cap for that weapon, and the trainee learns from the mentor's own talent list with the talent level capped by the mentor's level. (Asset-level verified)
The native enforcement strings are `HPlayerController.cpp:45394` = "导师的【{0}】熟练度上限过低，无法教授受训者!" and `HUITrainingArrangement.cpp:1677` = "导师的熟练度上限需要高于受训者". (Asset-level verified)
For a donor→recipient value transfer, mentor stats do not matter, because no function exists that reads a mentor's stored value as a source; a mentor-transfer feature is new logic, not a gated existing one. (Inferred from the native surface in section 4)

### 3.1 The tech-tree gate

The station is unlocked by the subnode `BP_KJS_SubNode_JZ_TuShi_QiTa` ("Furniture") under the `BP_KJS_*` tech tree. (Asset-level verified)
The subnode is gated at `NeedMaskLevel = 30` with `ConsumePoints = 3`, requires the parent main `BP_KJS_JianZhu_TuShi` (itself mask 30) and the prerequisite sub `BP_KJS_SubNode_JianZaoFang_3`, and the tree is Blueprint-driven rather than a DataTable. (Asset-level verified)
The parent's `PreNodeList` gates the leaf even if the leaf's own gate is lowered, so both must be edited, and the `_Action` and `_Management` variants carry the same structure with their own parents. (Asset-level verified)
The full node table, the parent and prerequisite values, the recommended two-value edit, and the alternative surgical reparent are in [tech-tree.md](tech-tree.md) §5. (Cross-reference)

### 3.2 Recipe tier and side effects

`BP_PeiFang_TrainingGround` carries `PeiFangDengJi = 2`; lower it to `1` if the crafting menu enforces the recipe tier independently of the tech node. (Asset-level verified)
The node's `KeJiPeiFangSoftList` unlocks eight recipes, all of which become craftable at the same lowered gate: TrainingGround, WeaponTrain, ZaoPen, HuoPen_3, MuTouRen, JinYangTuo, JinYuMi, and WeaponShowCase. (Asset-level verified)
Clearing the parent's `AutoLearnSubNodeList` also removes the automatic stone-hammer recipe; it remains manually unlockable at mask 30. (Asset-level verified)
The other `JianZhu_TuShi` subnodes keep their own `NeedMaskLevel` and prerequisites, so they remain locked. (Asset-level verified)

## 4. Decisive semantics: a cap raise with no value transfer

The Combat Skill track raises the trainee's weapon proficiency cap incrementally toward the mentor's cap over time. (Asset-level verified)
The effective ceiling is the lower of the mentor's cap for that weapon and a class limit: 125 for a combat class's primary weapon, 100 for other weapons. (Asset-level verified)
The raise is recorded as a `+1` increment to the native `ProfMaxLvl_Init` member of `FProficiencyData` (`+0xc`, written at `0x4603f32`), one point at a time, so it is one of the two ways an existing character's effective cap can exceed the recruitment roll; the other is the `ProfMaxLevelInc` gift, which writes `ProfMaxLvl_Add`. (Asset-level verified)
The native hard ceiling on any cap composition is `ProfMaxLvlUpperLimit = 150`, with the recruitment roll described in [proficiencies-and-caps.md](proficiencies-and-caps.md). (Asset-level verified)

The Training Ground performs **no** donor→recipient proficiency-value or numeric talent-value transfer. (Asset-level verified)
The trainee's current proficiency values are never overwritten from the mentor; only the cap moves, and it moves by time accumulation rather than by copying a number. (Asset-level verified)

### 4.1 Native surface that proves the absence

The complete native RPC and literal surface for the station, read from the shipping binary: (Asset-level verified)

```text
ServerReqTrainingGround
ServerRequestTrainGroundData
ServerReqAddTrainingInfo
ServerReqCancelTrainingInfo
ServerReqChangeOrderTrainingInfo
ServerReqestAddOrRemoveWaitTrainData
ServerReqRestartTraining
ServerPauseWeaponTraining
ServerSetWeaponTrainInfoStruct
ServerManRenShuLianDu
ServerManRenUnlockShuLianDuBenefit
ServerQueryCanTrainingZuRen
ServerQueryTrainingLog
ServerRequestShuLianDuData
ClientOpenTrainingGroundUI
ClientOpenWeaponTrainUI
ClientManRenShuLianDu
ClientManRenUnlockShuLianDuBenefit
ClientReciveShuLianDuData
ClientReciveShuLianDuLevel
ClientRefreshCanTrainingZuRen
ClientRefreshLatestCanTraining
ClientRefreshTrainingLog
ClientReplicateCampfireTrainGroundData
ClientRepWaitTrainWeaponData
ClientRepWeaponTrainValue
SetShuLianDuMaxVal
GetShuLianDuAfterAddPer
GetProficiencyData
SetProficiencyData
OnClickedChooseCoach
OnClickedCoachDesc
RestartTrainingMontageEvent
RestartTrainingTime
CoachLvRequired
CoachName
CoachUID
JiaoLianList
LeftJiaoLianList
RightJiaoLianList
Button_CoachDesc
Button_SelectCoach
Image_Coach
ManRenTuoGuanYuanData
NGTrainingNum
```

Every `Server*` name is a training-queue, restart, pause, or data-request operation; `ServerManRenShuLianDu`/`ServerManRenUnlockShuLianDuBenefit` unlock a proficiency track for a tribesman rather than copying a value. (Asset-level verified)
There is no `Transfer`, `Inherit`, or `Copy` proficiency function, no donor/recipient pair, and no parameter that carries a source proficiency value anywhere in the binary's literal set. (Asset-level verified)
`TuoGuan` in these names is the resource/auto-management proxy (`CanTuoGuan`, `GongZuoTaiTuoGuan`, `SelectTuoGuanYuanAnJian`), not a talent-transfer concept. (Asset-level verified)

A UE4SS Lua mod can call the existing native `Server*`/`Client*` UFUNCTIONs through reflection, but doing so only adds, cancels, reorders, or restarts time-based training. (Inferred)
The mentorship value-transfer feature is new logic: it cannot be produced by a data edit or by calling an existing function. (Asset-level verified)

## 5. Talent tracks and the leakage caveat

`NGTraining` grants one random positive talent the mentor possesses per session, newly learned talents start at level I, a tribesman holds at most six positive talents, and some talents require the matching weapon. (Asset-level verified)
`NGLevelTraining` raises the star level of an already-held talent, cannot exceed the mentor's level for that talent, and proceeds in sequence. (Asset-level verified)
The tier-up chain consumes `UpgradeNGID` links in `DT_GiftZongBiao`, where each row name is the `NGID`; 450 rows are upgradable, for example `100011 → 100012 → 100013` (star I → II → III). (Asset-level verified)
The track only changes a talent's star, never its family, so it cannot change the composition of a build. (Asset-level verified)

Leakage caveat: the `NGTraining` track grants talents from the mentor's set, so it can introduce talents a player did not intend for a controlled composition. (Inferred)
`DT_TalentToBeBanned` is native and does not provably block curated pool grants, and `LearnedNGID = 0` does not provably block a Training Ground grant, so neither can be relied on to prevent the leak. (Unverified)
The talent-tier pacing lives in `NGLevelTraining.UpgradeExpConfig` and is editable; normalizing the quality-`5` `QualityAndExpRate` entry to `1.0` is required before a quality-5 trainee can use the talent tracks at all. (Asset-level verified)

## 6. Mysterious Stone Table (deep copy / Remodel)

The Mysterious Stone Table is a multi-purpose facility: its node also handles mask replacement and hibernation-pod repair, not only body recording. (Asset-level verified)

### 6.1 Assets and acquisition

| Asset | Path | Role |
| --- | --- | --- |
| `AHJianZhuKeLongTai` | server binary | Native in-world object |
| `UHUIKeLong`, `UHKeLongDataWidget` | server binary | Client UI |
| `FManRenKeLongData` | server binary | Record struct; element of `ManRenKeLongDataList` and `CacheKeLongDataList` |
| `BP_GongZuoTai_GaoKeJi` | `/Game/Blueprints/JianZhu/GongZuoTai/BP_GongZuoTai_GaoKeJi` | High-tech workbench that runs the system and holds every cost field |
| `DaoJu_BuJian_GaoKeJi_Lv1_C` | `BP_GongZuoTai_GaoKeJi` | "Mysterious Stone Table Part 1" upgrade part |

The system is acquired in the Ancient Ruins dungeons, not crafted freely: defeat `巡视者Ⅲ型` (Wind-eroded Dunes) or `杀戮者X` (River Valley) and take the complete Mysterious Stone Table and its parts from the relic room. (Asset-level verified)
`ShenDuLuRu_NoBuJian`/`ChongSuKeLong_NoBuJian` confirm a required Part 1. (Asset-level verified)
The mask's `数据更新一` (Data Update 1) unlocks body-data recording and `数据更新二` (Data Update 2) unlocks Deep Scan; the UI shows `TBCantKeLong = 数据更新一未修复` and `TBCantKeLong_ShenDu = 数据更新二未修复`. (Asset-level verified)
The tutorial string `YinDaoData2.151` frames Data Update 1 as the answer to a favorite tribesman dying. (Asset-level verified)

### 6.2 The three recording modes

`WBP_KeLong`'s `Get_Button_Tips2` bytecode gives the authoritative description: (Asset-level verified)

> 可录入的数据分为三类：常规录入、深度录入、外观录入。
> 常规录入的族人在死亡后可重塑。
> 深度录入的族人死亡后可重塑；也可将其数据复制至初始族人，但会失去重塑资格。
> 外观录入仅存储外貌数据，外貌数据可复制到其他族人。

| Operation | Button | Meaning |
| --- | --- | --- |
| Regular Recording (`常规录入`, `NormalLuRu`) | `BtnLuRu` | Record a tribesman; allows Remodel after death |
| Deep Recording / Deep Scan (`深度录入`, `ShenDuLuRu`) | `BtnShenDuLuRu` | Full body scan; allows Remodel after death and copy to the initial character |
| Appearance Recording (`外观录入`, `FaceLuRu`) | `BtnFaceLuRu` | Stores appearance only |
| Remodel (`重塑`, `ChongSu`) | `BtnChongSu` | Rebuild a recorded tribesman from its record |
| Copy body data to initial character (`复制至初始族人`, `FuZhiData`) | `BtnFuZhiData` | Applies a deep-scanned record to the player's initial body |
| Copy appearance to selected tribesman (`复制至选中族人`, `FaceCopy`) | `BtnFaceCopy` | Applies an appearance record to a chosen tribesman |
| Update / Delete (`更新生物信息`, `删除生物信息`) | `BtnGengXin`, `BtnShanChu` | Refresh or delete a record |

`EKeLongType` enumerates `ZhengChangType`, `ShenDuLuRuType`, `FaceScanType`, `FaceCopyType`, `ConvertToDataType`, `ConvertToTribesmenType`. (Asset-level verified)
`EKeLongDataState` enumerates `ZhengChang`, `FuZhi`, `ChongSu`, `KuaFu`, `NoGuiShu`, `ShenDuLuRu`, `FaceLuRu`, `SiWang`. (Asset-level verified)

### 6.3 Remodel

Remodel rebuilds a recorded tribesman after death. (Asset-level verified)
The `GameXishu` toggle `WanMeiChongSu` ("Perfect Remodel") determines whether the record's full stats survive; `DT_XiShuTipsText.WanMeiChongSu` states that level, proficiency (熟练度), and talent entries from the last recording are preserved. (Asset-level verified)
`ChongsuRatio` (`DT_YiWenText.ChongsuRatio` = "肉身重塑时间倍率", default `1`, range `0.1–10`) scales remodeling time. (Asset-level verified)
The `GE_Mask_FuHuo_Buff` description ties perfect remodel to a max-HP boost. (Asset-level verified)
Remodel is a resurrection of the same tribesman, not a transfer into a new recruit. (Asset-level verified)

### 6.4 Body-data copy to the initial character

The deep copy overwrites the player's initial body with a deep-scanned tribesman's body data. (Asset-level verified)
`ShenDuLuRuZuRen_Context` (`HUIKeLong.cpp:1490`) = "是否确认对族人（{0}）进行深度扫描？扫描完成后即可复制其数据至初始角色。" (Asset-level verified)
`String_Mask_XiuFu_Table` describes the unlock as replacing the scanned machine-body data onto the original body, alongside fast remodel and body enhancements. (Asset-level verified)
The recipient is hardcoded to the **initial character / initial body** (`FManRenKeLongData.bChuShiBody`, `ServerChongSuChuShiData`, `FuZhiZuRen_Context`); there is no path that copies body data onto an arbitrary recruit. (Asset-level verified)
Copying **consumes the record**: `FuZhiZuRen_Context` states the initial character data is overwritten irreversibly and the source's entry data is deleted, and `LuRuKeLong_CantLuRu` states a copied tribesman cannot be recorded again. (Asset-level verified)
The living source tribesman is not killed, but its record is destroyed and it permanently loses recording and remodel eligibility. (Asset-level verified)
`WBP_ShiTu`'s FuZhi tooltip confirms the copied character cannot be recorded in the Stone Table again. (Asset-level verified)

### 6.5 Appearance copy

`FaceCopyType` copies an appearance record to a selected tribesman (`BtnFaceCopy` = "复制至选中族人"), the one existing path that writes copied data to an arbitrary recruit. (Asset-level verified)
This is appearance only; it carries no stats, proficiency, or talents. (Asset-level verified)

### 6.6 Server toggles

Both named toggles are `GameXishu` server-config values, not console commands. (Asset-level verified)

| Key | Default | Range | Meaning |
| --- | --- | --- | --- |
| `WanMeiChongSu` | `1` | `0/1` | Perfect remodel; retain level, proficiency, and talents from the record |
| `ZuRenFuZhi` | `1` | `0/1` | "族人复制开关 / Copy Tribesman On/Off"; enables the tribesman copy feature |
| `ChongsuRatio` | `1` | `0.1–10` | Remodel time multiplier |

### 6.7 Costs

All costs are read from the `BP_GongZuoTai_GaoKeJi` default object. (Asset-level verified)

| Operation | Materials | Mask energy |
| --- | --- | --- |
| Remodel (`ChongSuCaiLiaoList` / `ChongSuMianJuNengLiang`) | 2× `DaoJu_Item_Mask_CaiLiao01` | 400 |
| Deep Scan (`ShenDuLuRuCaiLiaoList` / `ShenDuLuRuMianJuNengLiang`) | 50× `Mask_CaiLiao01`, 15× `Mask_CaiLiao02`, 10× `Crystal_Titanium` | 500 |
| Appearance Scan (`ScanFaceCaiLiaoList` / `ScanFaceMianJuNengLiang`) | 20× `Mask_CaiLiao01`, 5× `Mask_CaiLiao02`, 3× `Crystal_Titanium` | 300 |
| Appearance Copy (`CopyFaceCaiLiaoList` / `CopyFaceMianJuNengLiang`) | 20× `Mask_CaiLiao01`, 5× `Mask_CaiLiao02`, 3× `Mask_CaiLiao03` | 500 |
| Tribesman → Data (`TribeToDataCaiLiaoList` / `TribeToDataNengLiang`) | 1× `DaoJu_USB_Empty` | 600 |
| Data → Tribesman (`DataToTribeCaiLiaoList` / `DataToTribeNengLiang`) | 30× `Mask_CaiLiao01`, 5× `Mask_CaiLiao02`, 5× `Mask_CaiLiao03` | 600 |
| Upgrade part (`ShengJiBuJianList`) | `DaoJu_BuJian_GaoKeJi_Lv1` | — |

`DaoJu_USBFlashDrive_C` (`USBDaoJuClass`) is the record-carrier item, and `TribeToData`/`DataToTribe` are the two `ConvertTo*` modes. (Asset-level verified)
The copy-to-initial-character step does not expose its own cost in this default object; the Deep Scan cost is the practical gate. (Asset-level verified)

### 6.8 What the copied record contains

`FManRenKeLongData` fields, in stored order: `ManRenUId`, `ServerID`, `bChuShiBody`, `ManRenClass`, `KeLongBinData`, `ManRenScale3D`, `XianShiData`, `DataState`, `ChongSuLeftTime`, `CloneType`, `ZJJNArray`, `ZhiYeJiNeng`, `FuZhiAClassAttrShouDongDianList`, `FuZhiAClassAttrUnassignedDian`, `FuZhiAClassAttrZiDongDianList`, `FuZhiBClassAttrTotalDian`, `FuZhiManRenExp`, `FuZhiGoodNGBackupList`, `FuZhiBadNGRemoveBackupList`, `AttrPinZhiCoef`, `UsingChengHao`, `bNewData`. (Asset-level verified)

| Group | Fields |
| --- | --- |
| Identity / class | `ManRenUId`, `ServerID`, `ManRenClass`, `bChuShiBody` |
| Appearance / body | `KeLongBinData` (binary body payload), `ManRenScale3D`, `XianShiData` |
| Mastery | `ZJJNArray` |
| Profession skills | `ZhiYeJiNeng` |
| Attribute points | `FuZhiAClassAttrShouDongDianList`, `FuZhiAClassAttrUnassignedDian`, `FuZhiAClassAttrZiDongDianList`, `FuZhiBClassAttrTotalDian` |
| Level / XP | `FuZhiManRenExp` |
| Talents | `FuZhiGoodNGBackupList`, `FuZhiBadNGRemoveBackupList` |
| Quality / title | `AttrPinZhiCoef`, `UsingChengHao` |

There is no explicitly named current-proficiency or proficiency-cap field in `FManRenKeLongData`. (Asset-level verified)
`FuZhiYeProfMaxLvlMap` and `ZhuFuZhiYeQuanZhongMap` are properties of `UHProficiencyConfig`, not of the record. (Asset-level verified)
Because the `WanMeiChongSu` tip explicitly names 熟练度 (proficiency) as retained, proficiency is almost certainly carried inside `KeLongBinData` rather than in a named field. (Inferred)
Whether proficiency **caps** travel with the record or are recomputed from the copied `ManRenClass` is unverified.

## 7. Disabling the Training Ground cap-raise

To disable only the proficiency-cap track while keeping the talent and mastery tracks, edit the station's `TraningExpAddMap` entry for `ShuLianDuTraining`. (Asset-level verified)
In the `Default__BP_JianZhuTrainingGround_C` export: (Asset-level verified)

```text
TraningExpAddMap[ETrainingType::ShuLianDuTraining].BaseExpPerSeconds: 1 -> 0
```

`BaseExpPerSeconds` is an `IntPropertyData`, so this is a plain integer value edit. (Asset-level verified)
Keep the map entry; the station UI and the native accumulator address the track by its enum key, so removing the key risks a null lookup with no benefit over a zero rate. (Inferred)
Fallback if a zero rate is special-cased by the native accumulator: leave `BaseExpPerSeconds = 1` and set every `ShuLianDuTraining.UpgradeExpConfig[*].UpgradeExp` to `1000000000`, which fits in a signed 32-bit integer and never completes in a session. (Inferred)

Side effects: (Asset-level verified / inferred)

- The cap-raise track remains selectable in the UI but accumulates no progress, so a weapon's cap never rises toward the mentor's; the `ProfMaxLevelInc` gift path and the `SetShuLianDuMaxVal` console command become the only remaining cap levers.
- A non-class weapon can no longer be pushed above the uniform non-class cap, so the mastery thresholds 90 and 120 stay closed for off-class weapons.
- `QualityAndExpRate` for quality `5` is `0.0` on every track, which also zeroes a quality-5 trainee in the talent tracks; normalize it to `1.0` per track if quality-5 tribesmen must use the station.
- Do not zero the server `TrainingExpRatio`, because it multiplies all four tracks.
- `CoachLvRequired` and `HoldCharacterCount` are station-wide and unaffected by this edit.

## 8. Foot-guns

- No value-transfer function exists anywhere in the native surface; a mentorship value-transfer feature is new logic, not a data edit. (Asset-level verified)
- Mentor stats and `CoachLvRequired` govern the shipped cap and talent tracks, but no mentor stat is ever read as a source value for a transfer. (Inferred)
- The global `TrainingExpRatio` multiplies all four tracks; it is not a per-track lever. (Asset-level verified)
- The Stone Table deep copy is hardcoded to the initial body and consumes the source record; appearance copy is the only existing arbitrary-recipient path. (Asset-level verified)
- The Training Ground tech gate is a Blueprint CDO, not a DataTable, so it is edited on `BP_KJS_SubNode_JZ_TuShi_QiTa` and its parent, not in `DT_AllTechTreeNode`. (Asset-level verified)
- Lowering the tech gate also unlocks the node's seven other recipes at the same mask level. (Asset-level verified)
- `NGTraining` can leak mentor talents into a controlled composition; `DT_TalentToBeBanned` and `LearnedNGID = 0` are not proven blocks. (Unverified)
- The recruitment cap is baked and stored, so a recruitment-roll config change is visible only on a freshly recruited tribesman; the Training Ground cap-raise and the `ProfMaxLevelInc` gift are the explicit additive exceptions that change an existing character's cap. (Asset-level verified)
