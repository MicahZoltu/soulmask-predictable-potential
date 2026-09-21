# Editing Cooked Assets with UAssetAPI

This guide covers the concrete edit operations on cooked Soulmask `.uasset`/`.uexp` pairs after they have been extracted: the UAssetAPI JSON model, DataTable value and row edits, Blueprint class-default objects, map and condition-bag edits, and localization.
It assumes the extraction and packaging pipeline from [`authoring-pipeline.md`](authoring-pipeline.md) and [`packaging-and-loading.md`](packaging-and-loading.md), and the tool catalog in [`tooling.md`](tooling.md).
It marks each operation as proven at the asset level or unverified in game; an asset that round-trips byte-identically is structurally valid, but whether the shipping game reads the overridden value is a separate, largely unverified question.

## The UAssetAPI JSON model

UAssetAPI exports a cooked asset to one JSON document whose top level carries `NameMap`, `Imports`, and `Exports`.
`NameMap` is the asset's FName table: every name a row or property refers to must be present in it.
`Imports` holds the external objects the asset references; a negative object index resolves to `Imports[-index - 1]`, so the readable identity of a reference is that import's `ObjectName`.
`Exports` holds the asset's objects, each tagged with a `$type` such as `UAssetAPI.ExportTypes.DataTableExport, UAssetAPI`.

A cooked DataTable is a single `DataTableExport`.
Its rows live in `Exports[0].Table.Data`.
Each row is a `StructPropertyData` whose `Name` is the row name, whose `StructType` is the row struct, and whose `Value` is the row's property array.
Typical row structs are `NaturalGiftEffectConfig`, `NaturalGiftConfig`, `NaturalGiftDetail`, `ProficiencyZhiYeLvl`, `CaiJiDaoJuBaoDataTable`, and `XiHaoConfig`.
The export's own `Exports[0].Data` carries the table's `RowStruct` as an `ObjectPropertyData` whose `Value` is an import index.

```json
{
  "$type": "UAssetAPI.ExportTypes.DataTableExport, UAssetAPI",
  "Table": {
    "$type": "UAssetAPI.ExportTypes.UDataTable, UAssetAPI",
    "Data": [
      {
        "$type": "UAssetAPI.PropertyTypes.Structs.StructPropertyData, UAssetAPI",
        "StructType": "ProficiencyZhiYeLvl",
        "Name": "QiJu",
        "Value": [
          { "$type": "UAssetAPI.PropertyTypes.Objects.BytePropertyData, UAssetAPI", "ByteType": "FName", "EnumType": "EProficiency", "EnumValue": "EProficiency::QiJu", "Name": "ProfType" },
          { "$type": "UAssetAPI.PropertyTypes.Objects.IntPropertyData, UAssetAPI", "Name": "MinAdd", "Value": 15 },
          { "$type": "UAssetAPI.PropertyTypes.Objects.IntPropertyData, UAssetAPI", "Name": "MaxAdd", "Value": 25 }
        ]
      }
    ]
  },
  "Data": [
    { "$type": "UAssetAPI.PropertyTypes.Objects.ObjectPropertyData, UAssetAPI", "Name": "RowStruct", "Value": -5 }
  ],
  "ObjectName": "DT_Prof_ZhiYe_ZongJiang"
}
```

Each property is a tagged object with a `$type`, a `Name`, and a type-specific payload: `IntPropertyData` uses `Value`, `FloatPropertyData` uses `Value`, `BoolPropertyData` uses `Value`, `StrPropertyData` uses `Value`, `BytePropertyData` with `ByteType: "FName"` uses `EnumValue`, and `StructPropertyData` nests a `Value` property array.
A `MapPropertyData` payload is an array of `[keyProperty, valueProperty]` pairs.
A localized `TextPropertyData` carries a `CultureInvariantString` (the baked fallback) and a `Value` that is the 32-hex FText key.

A cooked Blueprint is an `Exports` list of objects; its class-default object is the export named `Default__<Class>_C`.
The CDO's `Data` is a property array shaped exactly like a DataTable row's `Value`.

### Export and import flow

The wrapper reads an asset with its sibling `.uexp` automatically, serializes it, and can re-deserialize a replacement JSON.
The wrapper source, environment, and build, and the full round-trip flow, are in [`authoring-pipeline.md`](authoring-pipeline.md).
`Write` emits both `outputBase.uasset` and `outputBase.uexp`.
The replacement JSON must live under a different base name than `outputBase`, because the wrapper writes `<outputBase>.export.json` before it reads the replacement.

## Editing a DataTable row by value

Locate the table at `Exports[0].Table.Data`, find the row by `Name`, find the property by `Name`, and set its `Value`.
For example, `DT_Tribe` row `Box_Tribe_Middle` holds a `DaoJuBaoContent` array whose entry 0 has an `IntPropertyData` named `SelectedRandomProbability`, originally `100`:

```json
{ "Name": "Box_Tribe_Middle", "Value": [ { "Name": "DaoJuBaoContent", "Value": [ { "Name": "SelectedRandomProbability", "Value": 100 } ] } ] }
```

Changing that field from `100` to `101` changes exactly one byte of the `.uexp` (offset 198, octal `144` to `145`) and leaves the `.uasset` byte-identical; the edited asset re-parses cleanly and itself round-trips to binary equality.
That is the minimal one-byte diff guarantee: a genuine cooked DataTable that changes one scalar serializes with no structural drift.
A no-change round-trip of `DT_GiftZongBiao` and `DT_Tribe` reproduces both the `.uasset` and `.uexp` with identical SHA-256, so the baseline is exact.

Read a value back by re-exporting the edited asset and inspecting the field, or by round-tripping it again and comparing hashes; the build pipeline re-exports each edited asset and requires the second pass to reproduce the edited bytes.
One shape drift to expect: a float appears as a JSON number on export but as a string on reparse, so a float reader must accept both.

## Adding and deleting rows

To add a row, clone an existing row object, rename it, set its fields, append it to `Exports[0].Table.Data`, and append the new row name to `NameMap`.
Cloning a `DT_PinZhiGoodNGStarWeight` row, naming it `6`, and appending `6` to `NameMap` imports and re-parses at seven rows.
Without the `NameMap` append, UAssetAPI aborts with `FName+DummyFNameSerializationException`; a row name absent from `NameMap` cannot serialize.
Every enum or type name the new row introduces must also be in `NameMap`: a new `EProficiency::<Skill>` row needs `<Skill>`, `EProficiency::<Skill>`, and `EProficiency` present.
The row struct does not change; a new row uses the same `StructType` and the same `Value` field set as its siblings.

Array and map growth both work.
Cloning a `JueSeLvlProfLvlList` element, mutating its `JueSeLvlMin`/`JueSeLvlMax` and `ProfInitLvlMin`/`ProfInitLvlMax`, and appending it produced a four-element array that re-parsed as four elements.
In-row map growth and shrink both survive a round trip.

To delete rows, remove the row objects from `Exports[0].Table.Data`.
Deleting the class skill rows from `DT_Prof_ZhiYe_*` and all 42 rows from `DT_GiftFuMiann` re-parses correctly at the reduced count.
Do not express a deletion by emptying an array inside a row: UAssetAPI cannot re-serialize an empty `NaturalGiftDetail` array, so an emptied pool row fails to round-trip.
Whether the shipping game accepts a hand-added or hand-deleted row that round-trips structurally is unverified; the supported route for the signed Workshop payload is ModConfiger.

## Editing Blueprint class-default objects

The class-default export is the object whose `ObjectName` is `Default__<Class>_C`.
Its export type decides what is possible:

| Export type | JSON shape | Editable with UAssetAPI |
| --- | --- | --- |
| `NormalExport` | typed `Data` property array | yes, in place |
| `RawExport` | opaque base64 blob | no |

`BP_ProficiencyConfig`, `BP_ManRenRandomConfig`, `BP_JianZhuTrainingGround`, `BP_SGQ_*`, `BP_PeiFang_*`, `BP_SuiJi_BuLuo`, `BP_Mask_XiuFu*`, and the `BP_KJS_SubNode_*` objects export as `NormalExport`.
`BP_ZiYuanGuanLiQi` is the hard boundary: its CDO exports as a `RawExport` with an opaque 176,472-character base64 blob.
That `RawExport` owns `GoodNGMaxNum`, `DT_GoodNGConfig`, and the `DT_PinZhi*` references, so none of them can be value-edited or repointed on Linux.

A `NormalExport` CDO is edited like a row: find the property by `Name` and set its `Value`.
Adding a native property tag is possible, and a name absent from `NameMap` such as `ProfInitMaxLvlMin`, `ProfInitMaxLvlMax`, `ProfMaxLvlLowerLimit`, or `ProfMaxLvlUpperLimit` must be appended to `NameMap` first.
A typed array property accepts cloned element additions, as the `JueSeLvlProfLvlList` proof above shows.
Two CDO value edits each change exactly one `.uexp` byte: `BaiBanProfMaxLvlList[0].MaxLvl` `40`→`45` at offset `3084` (octal `050`→`055`), and `JueSeLvlProfLvlList[2].ProfInitLvlMax` `25`→`30` at offset `919` (octal `031`→`036`); both re-parse to the edited value and round-trip byte-stably.
CDO overrides are proven to round-trip on disk; whether the game reads an overridden CDO from the `_P.pak` is unverified.

ModConfiger is the Windows/Modkit route for the operations a cooked-asset edit cannot express for a signed mod: DataTable row merge, DataTable row deletion, ActorComponent attachment, Blueprint addition or replacement, and spawner-only sub-level attachment.
It is a Blueprint class asset with no text format; see [`official-modkit-and-modconfiger.md`](official-modkit-and-modconfiger.md).

## Map and condition-bag edits

A map property's `Value` is an array of `[keyProperty, valueProperty]` pairs.
Edit a value by walking to the pair and setting its `Value`, and shrink the map by splicing pairs out.
Setting `DT_ZhuanJingSLD` row 21 `SLDGaiLv[0].GaiLv` to `1.0` and shrinking its nested `JiNengChi` map from seven entries to one imported and re-parsed at nine rows with one `JiNengChi` entry.

A condition bag is referenced by an object index, not by name: `TiaoJianBaoList` is an array whose entries are references, and the readable identity is `Imports[-index - 1].ObjectName`, for example `BP_Gift_IsZDZhiYeZhanShi_C`.
Repoint a gate by replacing the index with an existing bag's index.
The shipped bags already cover the class, tribe, and quality semantics (`BP_Gift_IsZDZhiYe_C`, `BP_Gift_IsSHZhiYe_C`, `BP_Gift_IsZDZhiYeZhanShi_C`, `BP_Gift_IsZDZhiYeLieShou_C`, `BP_Gift_IsZDZhiYeWeiShi_C`, `BP_Gift_IsSHZhiYeZaGong_C`, `BP_Gift_IsSHZhiYeJiangRen_C`, `BP_Gift_IsZhiYeKuLi_C`, and `BP_Gift_IsPinZhi_4+_C`), so re-gating an existing row needs no new Blueprint.
A repointed index must exist in `Imports`; pointing at a bag the asset does not already import requires adding the import and its package.
`ClanDemand` and `ZhiYeDemand` are empty on every shipped positive-pool row, so gating lives entirely in `TiaoJianBaoList`.

The re-serialize limitation to know is the empty struct array.
UAssetAPI cannot serialize an empty `NaturalGiftDetail` array, so a pool row whose `NGDetailList` is emptied will not round-trip.
Delete the row, or reduce the list to at least one entry.

## Localization editing

A talent name and description live twice: inline in the DataTable as `TextPropertyData.CultureInvariantString`, and in the cooked `Game.locres` keyed by the `TextPropertyData.Value` FText key (32 hex).
When a locres entry exists for the `(Namespace, Value)` pair, the locres is display-authoritative and the inline source is only a fallback, so the locres edit is the exact way to change displayed text.

The retail file is `WS/Content/Localization/Game/en/Game.locres`, a UE4 version 3 (CityHash64 UTF-16) string table.
Its layout is a 16-byte magic, one version byte (`3`), an `int64` string-table offset, an `int32` entry count, an `int32` namespace count, then per namespace a `uint32` namespace hash, an `FString` name, an `int32` key count and per key a `uint32` key hash, an `FString` key, a `uint32` source hash and an `int32` string-table index, then the string table of `FString` text plus `int32` reference count.
A positive string length means one-byte (ASCII/Latin-1) content and a negative length means UTF-16.
The file is 3,503,072 bytes and exposes an empty namespace plus 40,068 keys; the three `Battle-Tested` title keys `48E1BCB7…`, `8C62A5F9…`, and `C922A5EB…` reference the shared text `Experience - Battle-tested`.

A reader/writer for this format must keep each string's original encoded bytes so an unchanged serialize is byte-identical, and must append a fresh string-table entry per replacement so an entry shared by several keys is never clobbered.
It should fail fast when a requested key is absent or the format is unexpected, verify by re-parsing and reading the settled text back, and require a second serialize to reproduce the edited bytes.
The build pipeline's locres edit implements exactly these guarantees (see `../../build/README.md`).

Replace a key by mapping the 32-hex key to new text; the reader walks every namespace and repoints matching keys to a newly appended string entry.
Ship the edited file at its retail path inside the `_P.pak` (`repak pack --version V11 --mount-point ../../../`), where the `_P` priority overrides the base pak's locres just like any asset override.
The asset-override mechanism is proven; locres priority over the base pak at runtime is unverified.
See [`packaging-and-loading.md`](packaging-and-loading.md) for the pak layout and the `-fileopenlog` load path.

## What cannot be done by data alone

- **Row deletion for a signed Workshop mod.** UAssetAPI can delete rows in a Linux-built pak, but ModConfiger supplies the canonical row-deletion table the Workshop payload expects, so use ModConfiger when the mod must be signed or registered.
- **ActorComponent attachment.** ModConfiger-only.
- **Blueprint addition or replacement.** ModConfiger-only; there is no standalone Linux cooker for Soulmask's native row structs.
- **New assets.** UAssetAPI edits existing assets only and cannot create a `.uasset`/`.uexp` pair, so a brand-new DataTable (for example a new `DT_GiftZhengMian_<camp>`) requires a Modkit cook.
- **Blueprint and native logic.** Level-to-cap selection, quality-tiered origin conditions, Training Ground value transfer, and companion combat tuning live in native code or Blueprint bytecode; ship the data knobs and treat the logic as Windows/native.
- **`RawExport` manager properties.** Fields on `BP_ZiYuanGuanLiQi` (`GoodNGMaxNum`, `DT_GoodNGConfig`, `BadNGRandomMinNum`/`MaxNum`, `XiHaoRandomMinNum`/`MaxNum`) need a raw byte patch or ModConfiger.
- **`GameXishu*.json`.** A plaintext disk config read from `WS/Config/GameplaySettings/`, not a pak entry; it cannot be shipped in a `_P.pak`.

## What each edit kind needs

| Edit kind | What it touches | Linux | Windows | Tool |
| --- | --- | --- | --- | --- |
| Value edit | DataTable row scalar or struct field | yes, proven | not required | UAssetAPI + repak |
| Row add | `Table.Data` + `NameMap` append | yes, structurally proven | ModConfiger for the signed path | UAssetAPI + repak |
| Row delete | remove from `Table.Data` | yes, proven | ModConfiger row-deletion table | UAssetAPI / ModConfiger |
| Map shrink | in-row `[key, value]` pairs | yes, proven | not required | UAssetAPI + repak |
| CDO edit (`NormalExport`) | typed `Data` property array | yes, proven | not required | UAssetAPI + repak |
| CDO edit (`RawExport`) | opaque blob | no | raw patch / ModConfiger | native patcher / Modkit |
| Locres | `Game.locres` string table | yes, byte-identical round-trip | not required | locres reader/writer + repak |
| New asset | create `.uasset`/`.uexp` | no | yes | Modkit cook |
| Blueprint logic / component | Blueprint bytecode / component attach | no | yes | Modkit + ModConfiger |

The in-game read of an overridden asset is unverified; the pak mount and `_P` priority are proven.

## Foot-guns

- **Dummy FName.** A new row or property name must be appended to `NameMap` or UAssetAPI throws `FName+DummyFNameSerializationException`.
- **Empty-array serialization.** UAssetAPI cannot re-serialize an empty `NaturalGiftDetail` array; delete the row instead of emptying `NGDetailList`.
- **`RawExport`.** `BP_ZiYuanGuanLiQi` and its manager properties are opaque; treat them as raw-patch or ModConfiger work only.
- **Inline text versus locres authority.** The DataTable `CultureInvariantString` is a fallback; an existing locres entry wins for display.
- **Replacement-file naming.** The replacement JSON must not be `<outputBase>.export.json`, or the edit silently no-ops.
- **Float shape drift.** A float may be a JSON number on export and a string on reparse; accept both.
- **Server versus client.** When an asset differs between the two trees (for example `DT_GiftZongBiao`), use the retail client copy as authoritative.
- **Wrong table name.** The defect pool is `DT_GiftFuMiann` (double `n`); `DT_GiftFuMian` does not exist.
- **`GameXishu*.json`.** It is disk config and cannot ride in the pak.

## Related documents

- [`authoring-pipeline.md`](authoring-pipeline.md)
- [`official-modkit-and-modconfiger.md`](official-modkit-and-modconfiger.md)
- [`packaging-and-loading.md`](packaging-and-loading.md)
- [`../reverse-engineering/asset-analysis.md`](../reverse-engineering/asset-analysis.md)
