# Native Binary Analysis — Recovering Hard-Coded Gameplay From the Soulmask Server

This is a reference for reading gameplay behavior that is compiled into the shipping Soulmask Linux dedicated server instead of serialized into a cooked asset.
The audience is a mod maker or reverse engineer who needs to locate a native constant, recover a class's property layout without symbols, or judge whether a native patch is feasible.
Asset extraction is covered in [extracting-cooked-assets.md](extracting-cooked-assets.md); the cooked-asset side of the proficiency system is in [asset-analysis.md](asset-analysis.md) and [../game-reference/proficiencies-and-caps.md](../game-reference/proficiencies-and-caps.md).
Confidence labels are High, Medium, Low, and Inference.

## 1. The binary and its symbol surface

The binary is `/tmp/soulmask-server/WS/Binaries/Linux/WSServer-Linux-Shipping` (145,145,320 bytes).
It is ELF64 `ET_EXEC`, non-PIE, so a file virtual address is also the runtime address.

```sh
BIN=/tmp/soulmask-server/WS/Binaries/Linux/WSServer-Linux-Shipping
readelf -h "$BIN" | grep -E 'Type|Machine'
readelf -S "$BIN" | grep -E 'symtab|dynsym'
nm "$BIN"            # -> no symbols
nm -D "$BIN" | wc -l # -> 54595
```

`nm` reports `no symbols` and `readelf -S` shows no `.symtab`, so the image is stripped in the ELF symbol-table sense.
What survives is `.dynsym` with 54,595 entries, of which 30,229 are functions and 54,068 are defined (High).
Those exports are dominated by third-party code (OpenSSL, ICU, PhysX, Chaos) plus engine classes and the game-class vtables.
No game C++ method symbols survive: `nm -D | grep -E 'HZiYuan|HProficiency|TrainingGround|JianZhu'` returns only `_ZTV*` vtables, `_ZTIN13UScriptStruct...`, and `TClassCompiledInDefer` vtables.
`readelf -x .gnu_debuglink` names `WSServer-Linux-Shipping.debug`; that file is listed in `Manifest_DebugFiles_Linux.txt` but is not shipped, so full debug info is unavailable.

The consequence for recovery is that method names cannot be looked up.
The available surfaces are the dynamic vtables, the `FName` string literals, the `.rodata` reflection records, and targeted disassembly.

The count of 494 game-class vtables is a working figure, not a reproduced count; an obvious filter over `vtable for` returns 22,063, and the qualitative claim that `.dynsym` is dominated by engine and third-party code is what is verified (Medium).

| Address | Demangled symbol | Kind |
| --- | --- | --- |
| `0x16fd5c0` | `vtable for UHProficiencyConfig` | class vtable |
| `0x1709200` | `vtable for TClassCompiledInDefer<UHProficiencyConfig>` | class registration |
| `0xf80b58` | `vtable for UHZiYuanGuanLiQi` | class vtable |
| `0x1709240` | `vtable for TClassCompiledInDefer<UHZiYuanGuanLiQi>` | class registration |
| `0x14f2670` | `vtable for FProficiencyConfig` | struct |
| `0x14f2520` | `vtable for UScriptStruct::TCppStructOps<FProficiencyConfig>` | struct ops |
| `0x14f2940` | `vtable for UScriptStruct::TCppStructOps<FProficiencyConfigDT>` | struct ops |
| `0x14f23a0` | `vtable for FProficiencyZhiYeLvl` | struct |
| `0x14f2250` | `vtable for UScriptStruct::TCppStructOps<FProficiencyZhiYeLvl>` | struct ops |
| `0x14f1e60` | `vtable for UScriptStruct::TCppStructOps<FBaiBanProficiencyMaxLvl>` | struct ops |
| `0x14f2a90` | `vtable for UScriptStruct::TCppStructOps<FProficiencyData>` | struct ops |
| `0x16fbfd8` | `vtable for UHManRenRandomConfig` | class vtable |
| `0x1596e60` | `vtable for UHManRenProfWidget` | widget vtable |
| `0x15967d0` | `vtable for UHManRenOwnerWidget` | widget vtable |
| `0x13e76f0` | `vtable for UHManRenSelectWidget` | widget vtable |
| `0x1660d68` | `vtable for UHTrainingGroundManager` | class vtable |
| `0x16625b8` | `vtable for TClassCompiledInDefer<UHTrainingGroundManager>` | class registration |
| `0xfc4880` | `vtable for AHJianZhuTrainingGround` | class vtable |
| `0x1588c68` | `vtable for TClassCompiledInDefer<AHJianZhuTrainingGround>` | class registration |
| `0xfe4540` | `vtable for UHTrainGroundInterfaceComponent` | component vtable |
| `0x1662578` | `vtable for TClassCompiledInDefer<UHTrainGroundInterfaceComponent>` | class registration |
| `0x13e4160` | `vtable for UHUITrainingGround` | widget vtable |
| `0x1410448` | `vtable for UHUITrainGroundManage` | widget vtable |
| `0x16fb160` | `vtable for UHZiYuanDaoJuMap` | class vtable |
| `0xf81068` | `vtable for UHZiYuanZhuangBei` | class vtable |
| `0xf80de0` | `vtable for UHZiYuanHongJingShi` | class vtable |
| `0x16fb4d8` | `vtable for UHZiYuanShengWuList` | class vtable |
| `0x16fb970` | `vtable for UHZiYuanPeiFangList` | class vtable |

Two names that appear in documentation are not native classes.
There is no `HProficiencyData` class; the name exists only as the struct `FProficiencyData` (`UScriptStruct::TCppStructOps<FProficiencyData>`, vtable `0x14f2a90`).
There is no `HZiYuanItem` class; the resource subsystem uses `UHZiYuanGuanLiQi` (`0xf80b58`), `UHZiYuanDaoJuMap` (`0x16fb160`), `UHZiYuanZhuangBei` (`0xf81068`), `UHZiYuanHongJingShi` (`0xf80de0`), `UHZiYuanShengWuList` (`0x16fb4d8`), and `UHZiYuanPeiFangList` (`0x16fb970`).

```sh
nm -D --defined-only "$BIN" | c++filt | grep -E 'UHProficiencyConfig|UHZiYuanGuanLiQi|UHTrainingGroundManager|AHJianZhuTrainingGround|UHManRen'
```

## 2. Reading class property records from `.rodata`

A class whose C++ methods have no symbols still has a generated reflection block, and that block carries enough information to recover every property name, its type-independent record, and its object offset.
The Unreal build emits the following for a class with reflected properties:

- A set of **property-parameter records** in `.rodata`, one per property.
  Each record is `0x28` bytes for an integer property, and the record's dword at `+0x24` is the property's `Offset` into the class object.
  The record also holds a pointer to the property's name string elsewhere in the image.
- A **property-pointer array** that lists the record addresses.
- A **class-registration block** that references that array, points at a registration thunk, and is immediately followed by the class vtable.

Reading the pair (name string, offset) from each record reconstructs the class layout without any debug file.
This works because the reflection data is compiled into the shipping image even though the symbol table is not.

### 2.1 Worked example — `UHProficiencyConfig`

`UHProficiencyConfig` is the native parent of `/Game/Blueprints/ZiYuanGuanLi/BP_ProficiencyConfig`, and it owns the proficiency cap constants that are absent from every cooked asset.
The chain is:

1. The class's property-parameter records sit at `0x16fd110`..`0x16fd188` plus the initial-current pair at `0x16fcf40`/`0x16fcf68`.
2. A property-pointer array at `0x16fd480` references those records (29 entries).
3. The class-registration block at `0x16fd568` references that array at `0x16fd598`, points at the registration thunk `0x5164150`, and is immediately followed by `vtable for UHProficiencyConfig` at `0x16fd5c0`.
4. The thunk `0x5164150` loads the static `UClass*` slot `0x8d329c0` and passes the constructor `0x5164260` to the shared construct routine.
5. The constructor `0x5164260` writes vptr `0x16fd5d0`, which is `vtable for UHProficiencyConfig + 16`.

| Record vaddr | Name string vaddr | Property | Offset |
| --- | --- | --- | --- |
| `0x16fcf40` | `0xb252fc` | `ProfInitLvlMin` | `0x28` |
| `0x16fcf68` | `0xc4ed9c` | `ProfInitLvlMax` | `0x2c` |
| `0x16fd110` | `0xb35d3c` | `ProfInitMaxLvlMin` | `0xe0` |
| `0x16fd138` | `0xbb6466` | `ProfInitMaxLvlMax` | `0xe4` |
| `0x16fd160` | `0xc6d6c7` | `ProfMaxLvlLowerLimit` | `0xe8` |
| `0x16fd188` | `0xca5582` | `ProfMaxLvlUpperLimit` | `0xec` |
| `0x16fd1b0` | `0xafc3b4` | `ProfInitChuShiBodyMaxLvl` | `0xf0` |
| `0x16fd2c8` | `0xbd227b` | `FuZhiYeProfMaxLvlMap` | — |

`FuZhiYeProfMaxLvlMap` is declared on `UHProficiencyConfig` but is absent from every cooked config object, so it is a native-declared map with no data source at runtime.
The property records prove the name-to-offset mapping; the constructors prove the values.
The same technique recovers `FProficiencyData`'s members: the struct records at `0x14ef878`..`0x14ef968` give `+0x4 ProfLvl`, `+0x8 ProfMaxLvl`, `+0xc ProfMaxLvl_Init`, `+0x10 ProfMaxLvl_Add`, `+0x14 ProfExp`, `+0x18 UnlockBenefitList`, with an element stride of `0x28`.

The script below resolves each record's name pointer and `Offset` directly from the file and walks the property-pointer array at `0x16fd480`.
It is self-contained and needs only the binary.

```sh
BIN=/tmp/soulmask-server/WS/Binaries/Linux/WSServer-Linux-Shipping
# The first LOAD segment maps vaddr 0x200000 to file offset 0, so file offset = vaddr - 0x200000.
# Each 0x28-byte property-parameter record holds a name pointer at +0x0 and the int Offset at +0x24.
bun -e '
const { readFileSync } = require("fs")
const buf = readFileSync(process.argv[1])
const at = (vaddr) => vaddr - 0x200000
const readCString = (vaddr) => { let p = at(vaddr), text = ""; while (buf[p] !== 0 && text.length < 64) { text += String.fromCharCode(buf[p]); p++ } return text }
const recordName = (record) => readCString(Number(buf.readBigUInt64LE(at(record))))
const dumpRecord = (record) => {
  const offset = buf.readUInt32LE(at(record) + 0x24)
  console.log(record.toString(16), recordName(record), "offset", "0x" + offset.toString(16))
}
for (const [base, count] of [[0x16fcf40, 2], [0x16fd110, 4]]) for (let i = 0; i < count; i++) dumpRecord(base + i * 0x28)
for (let entry = 0x16fd480; entry < 0x16fd568; entry += 8) {
  const record = Number(buf.readBigUInt64LE(at(entry)))
  if (record > 0x200000 && record < 0x8a6b370) console.log("array", entry.toString(16), "->", record.toString(16), recordName(record))
}
' "$BIN"
```

A related recovery trick is the **stat string**: a native function that emits a named profile stat embeds its own name in `.rodata`.
`UHChengZhangComponent.InitProficiency.for.if` at `.rodata 0xc3fd2f` names the initializer described in section 5.

## 3. Constructor-immediate recovery

Once a class constructor address is known, disassembling it surfaces the hard-coded defaults the class writes into itself.
For `UHProficiencyConfig` the constructor is at `0x5164260`.

```asm
5164260: push %rbx
5164264: mov  (%rdi),%rbx                 ; rbx = new object (FObjectInitializer::Obj)
516426a: call 556a660                     ; UObject base constructor
516426f: movq $0x16fd5d0,(%rbx)           ; vtable for UHProficiencyConfig + 16
5164276: movabs $0x3200000001,%rax
5164280: mov  %rax,0x28(%rbx)             ; 0x28 = 1, 0x2c = 0x32 = 50
51642e2: movaps -0x4a9ab79(%rip),%xmm2    ; xmm2 = 16 bytes at 0x6c9770
51642e9: movups %xmm2,0xe0(%rbx)          ; 0xe0..0xec = 75, 100, 50, 150
51642f0: movl $0x32,0xf0(%rbx)            ; 0xf0 = 0x32 = 50
```

The 16 bytes at `0x6c9770` are `4b 00 00 00 64 00 00 00 32 00 00 00 96 00 00 00`, i.e. `75, 100, 50, 150`.
The constructor also zeroes `ZhuFuZhiYeQuanZhongMap` at object offset `0x1a8` at `0x516437b`.

```sh
objdump -d --start-address=0x5164260 --stop-address=0x51643b0 "$BIN"
objdump -s --start-address=0x6c9770 --stop-address=0x6c9780 "$BIN"
```

| Field | Offset | Value | Meaning | Confidence |
| --- | --- | --- | --- | --- |
| `ProfInitLvlMin` | `0x28` | **1** | initial current-value roll floor | High |
| `ProfInitLvlMax` | `0x2c` | **50** | initial current-value roll ceiling | High |
| `ProfInitMaxLvlMin` | `0xe0` | **75** | initial cap roll floor | High |
| `ProfInitMaxLvlMax` | `0xe4` | **100** | initial cap roll ceiling | High |
| `ProfMaxLvlLowerLimit` | `0xe8` | **50** | cap clamp floor | High |
| `ProfMaxLvlUpperLimit` | `0xec` | **150** | cap clamp ceiling | High |
| `ProfInitChuShiBodyMaxLvl` | `0xf0` | **50** | initial/blank body cap default | High |

The field names and per-offset mapping come from the property records in section 2; the values come from two independent reads, the constructor disassembly in this section and the runtime read in section 4.

The patch sites that write these constants are:

| Field | Object offset | Constructor site | Value |
| --- | --- | --- | --- |
| `ProfInitLvlMin` / `ProfInitLvlMax` | `0x28` / `0x2c` | `0x5164276` (`movabs $0x3200000001`) | 1 / 50 |
| `ProfInitMaxLvlMin` / `ProfInitMaxLvlMax` | `0xe0` / `0xe4` | `0x51642e9` (`movaps 0x6c9770`), constant at `0x6c9770` | 75 / 100 |
| `ProfMaxLvlLowerLimit` / `ProfMaxLvlUpperLimit` | `0xe8` / `0xec` | same 16-byte constant at `0x6c9770` | 50 / 150 |
| `ProfInitChuShiBodyMaxLvl` | `0xf0` | `0x51642f0` (`movl $0x32`) | 50 |

## 4. Runtime confirmation

The static reads are confirmed by breaking on the constructor under gdb and reading the freshly constructed object.
The server needs a 64-bit `steamclient.so`; the installed depot ships a 32-bit stub at the root and the real 64-bit library under `linux64/`.
The symlink below is what makes the server start under gdb.

Save the script below as `cap_cdo_verify.gdb` in the working directory.
It breaks at `0x5164260`, dereferences `%rdi` to get the new object, finishes the constructor, and reads the fields.

```gdb
set pagination off
set confirm off
set breakpoint pending on
handle SIGSEGV nostop noprint pass
break *0x5164260
run
printf "===== STOP =====\n"
info registers rip rdi
set $obj = *(void**)$rdi
printf "object @ %p  ctor @ %p\n", $obj, $rip
finish
printf "after ctor:\n"
printf "  +0x28 ProfInitLvlMin           = %d\n", *(int*)($obj+0x28)
printf "  +0x2c ProfInitLvlMax           = %d\n", *(int*)($obj+0x2c)
printf "  +0xe0 ProfInitMaxLvlMin        = %d\n", *(int*)($obj+0xe0)
printf "  +0xe4 ProfInitMaxLvlMax        = %d\n", *(int*)($obj+0xe4)
printf "  +0xe8 ProfMaxLvlLowerLimit     = %d\n", *(int*)($obj+0xe8)
printf "  +0xec ProfMaxLvlUpperLimit     = %d\n", *(int*)($obj+0xec)
printf "  +0xf0 ProfInitChuShiBodyMaxLvl = %d\n", *(int*)($obj+0xf0)
printf "Class UClass ptr @ 0x8d329c0 = %p\n", *(void**)0x8d329c0
quit
```

```sh
mkdir -p /home/coder/.steam/sdk64
ln -sf /tmp/soulmask-server/linux64/steamclient.so /home/coder/.steam/sdk64/steamclient.so
cd /tmp/soulmask-server/WS/Binaries/Linux
gdb -batch -x cap_cdo_verify.gdb \
  --args ./WSServer-Linux-Shipping WS Level01_Main -server -log -UTF8Output \
  -MULTIHOME=0.0.0.0 -EchoPort=18889 -forcepassthrough -nullrhi
```

The object and `UClass` addresses differ per run because the executable is non-PIE but the heap is randomized.

```text
Breakpoint 1, 0x0000000005164260
object @ 0x711c22434780
  +0x28 ProfInitLvlMin           = 1
  +0x2c ProfInitLvlMax           = 50
  +0xe0 ProfInitMaxLvlMin        = 75
  +0xe4 ProfInitMaxLvlMax        = 100
  +0xe8 ProfMaxLvlLowerLimit     = 50
  +0xec ProfMaxLvlUpperLimit     = 150
  +0xf0 ProfInitChuShiBodyMaxLvl = 50
Class UClass ptr @ 0x8d329c0 = 0x711c51f21780
```

A **hardware read watchpoint** on a live `UHProficiencyConfig` field is the technique for finding the code that consumes a constant.
Setting a read watchpoint on `obj+0xe0` and letting server startup trigger the reads stops at the consuming function.

Save the script below as `cap_rwatch3.gdb`; it sets read watchpoints on `obj+0xe0` for the first three `UHProficiencyConfig` constructors and prints the first twelve stops.

```gdb
set pagination off
set confirm off
set breakpoint pending on
handle SIGSEGV nostop noprint pass
handle SIGILL nostop noprint pass
handle SIGFPE nostop noprint pass
set $count = 0
break *0x5164260
commands
  silent
  set $obj = *(void**)$rdi
  set $count = $count + 1
  if $count <= 3
    rwatch -l *(int*)($obj+0xe0)
    printf "RWATCH set #%d obj=%p\n", $count, $obj
  end
  continue
end
run
printf "--- STOP 1 rip=%p ---\n", $pc
bt
continue
printf "--- STOP 2 rip=%p ---\n", $pc
bt
continue
printf "--- STOP 3 rip=%p ---\n", $pc
bt
continue
printf "--- STOP 4 rip=%p ---\n", $pc
bt
continue
printf "--- STOP 5 rip=%p ---\n", $pc
bt
continue
printf "--- STOP 6 rip=%p ---\n", $pc
bt
continue
printf "--- STOP 7 rip=%p ---\n", $pc
bt
continue
printf "--- STOP 8 rip=%p ---\n", $pc
bt
continue
printf "--- STOP 9 rip=%p ---\n", $pc
bt
continue
printf "--- STOP 10 rip=%p ---\n", $pc
bt
continue
printf "--- STOP 11 rip=%p ---\n", $pc
bt
continue
printf "--- STOP 12 rip=%p ---\n", $pc
bt
continue
```

```sh
gdb -batch -x cap_rwatch3.gdb \
  --args ./WSServer-Linux-Shipping WS Level01_Main -server -log -UTF8Output \
  -MULTIHOME=0.0.0.0 -EchoPort=18889 -forcepassthrough -nullrhi
# expected stop at rip 0x41b7bf3 with Value = 75 (ProfInitMaxLvlMin)
```

## 5. Identity functions and cap writers

The proficiency cap is produced and rewritten by a small set of native functions whose addresses are recovered by a combination of stat strings, the vtable/registration technique, read watchpoints, and call-site scans.

| Symbol / role | Address | How it was identified |
| --- | --- | --- |
| `UHChengZhangComponent::InitProficiency` (create/refresh) | `0x41b7730` | stat string `UHChengZhangComponent.InitProficiency.for.if` at `.rodata 0xc3fd2f` |
| initializer caller (one-shot setup, flag 0) | `0x41b7481`, from `0x41b7410` | disassembly of the caller |
| config getter (object holding config at `+0x9d0`) | `0x4430280` | reached from the selector |
| int-range RNG (xorshift128, `(min,max,state)`) | `0x41c4af0` | called at `0x41b7d0d`; seeded via `pthread_getspecific` at `0x8bc7ef0` and splitmix64 from `clock_gettime` |
| per-proficiency cap recompute | `0x41c4f30` | called from `0x41c8fdb` and `0x4603f46` |
| active-effect sum helper | `0x41c5000` | called with `0x34` (52) at `0x41c4fa3`, with `0x33` (51) at `0x41c533e` |
| additive/blank/attribute helper | `0x41c49a0` | called at `0x41b795d` and `0x41c4fc4` |
| proficiency setter / copy | `0x41c7cb0` | writes `+0x4`, `+0xc`, `+0x14`, `+0x8`; caller `0x4f0ee0b` inside deserializer `0x4f0ed30` |
| mentor/training increment | `0x4603f32` | `addl $0x1,0xc(%rbp,%r14,1)` then `call 0x41c4f30` |
| forced re-init | `0x4879a50` → `0x41b7730` flag 1 | clears the array first |
| save/replication deserializer | `0x4f0ed30` | reaches the setter |

The selector `0x41b7730` loops over proficiency index `%ebx` from `0` to `0x1f` (`0x41b8120: add $0x1,%ebx; cmp $0x1f,%ebx`), and for each proficiency runs one of two cap paths, then clamps and stores.
The config object is fetched at `0x9d0(%r14)`, where `%r14` is the object returned by the getter at `0x4430280`.
The character's proficiency array is at `%r12+0x518` (count `+0x520`, capacity `+0x524`), element stride `0x28`.

The native map/field offsets the create path reads are:

| Field / key | Location | Meaning |
| --- | --- | --- |
| `BaiBanProfMaxLvlList` | `config+0x1f8` | blank-body caps (combat 40 / craft 10) |
| `ZhiYeProfMaxLvlMap` | `config+0x108` | class cap table map, keyed by `character+0x3391` |
| `ZhiYeProfLvlMap` | `config+0x80` | class starting-value map |
| `FuZhiYeProfMaxLvlMap` | `config+0x158` | secondary-profession cap map, empty at runtime |
| `ProfConfigDTList` | `config+0xf8` / `config+0x100` | 23-entry table gate, byte `ProfType` at `+0`, DataTable at `+8`, stride `0x10` |
| blank-body flag | `character+0x26c8 & 3 == 1` | selects the blank-body path; the initializer tests bit 0 at `0x41b7be4`, and the recompute helper gates the blank/attribute term on the two-bit test at `0x41c4a11` |
| class key | `character+0x3391` | primary class id |
| secondary key | `character+0x3392` | `ClanFuZhiYe` |
| archetype row name | `character+0x3378` | `CustomizeRowName`, seeds `Init` |
| active gifts | `character+0x640` | gift array, stride `0x110` |
| exclusion array | `(*(character+0xa8)+0x120)+0x3f0` | self-exclusion ids |
| component owner / manager | `component+0xa8`, `manager+0x9d0`, `manager+0x1b0` | owner plumbing and archetype table pointer |

The create-branch store sites are `0x41b8103` (`mov %ebp,0xc(%rax,%rcx,8)`, `ProfMaxLvl_Init`), `0x41b80ff` (`mov %edx,0x8(%rax,%rcx,8)`, `ProfMaxLvl`), and `0x41b8107` (`ProfMaxLvl_Add = 0`).
The `ProfMaxLvl` store is `0x41b80ff`; the preceding `0x41b80fb` (`mov 0x2c(%rsp),%edx`) only loads the accumulator, so `0x41b80ff` is the disassembly-verified store site.
Other create-branch sites are `0x41b7bcd`..`0x41b7bd0` (`tableValue - existingAdd`), `0x41b7bed`..`0x41b7d0d` (base `RandRange`), `0x41b804d`/`0x41b7ebd` (class `RandRange(MinAdd, MaxAdd)`), `0x41b809c` (accumulator add), and `0x41c4f9c` (recompute loads effect `0x34`).
The splitmix64 RNG seeding is `0x41b7c14`..`0x41b7cf1`.
The refresh branch recomputes `+0x8 = clamp(stored +0xc + helper, lower, upper)` at `0x41b79a9`..`0x41b79cc` and never writes `+0xc`.

The selector contains a per-character archetype branch at `0x41b79d9` that is often missed.
It tests `character+0x3378`; when non-null it resolves the archetype DataTable through `component+0xa8` → `0x4dccfc0(owner)` → `+0x1b0`, looks the row up with `0x41eeba0`, and looks `profType` up in a `TMap` embedded in the row at `0x41b7b52`..`0x41b7bc8`.
When the map contains `profType`, `Init` is set to the row value minus the existing add (clamped) and the base+class path is bypassed; when it does not, the lookup returns `-1` and the code falls through to the base+class path at `0x41b7bd6`.

### 5.1 Reconstructed cap algorithm

The base-roll path and the class-bonus path were recovered at instruction level.
The recompute is `0x41c4f30 = clamp(Init + round(Σ active effect-52) + blank/attribute term, 0xe8, 0xec)`.

The initializer `0x41b7730` is create-only and gated.
It loops all 31 `EProficiency` indices but processes only the 23 proficiencies present in `ProfConfigDTList` at `config+0xf8`/`config+0x100` (byte `ProfType` at `+0`, DataTable at `+8`, stride `0x10`).
The eight enum values with no `DT_ProficiencyConfig_*` table and no `DT_Prof_ZhiYe_*` row — `BuZhuo`, `YangZhi`, `TuZai`, `QieShi`, `YanMo`, `ZhuBao`, `JianZhu`, `PouJie` — are skipped entirely.
For a processed proficiency it writes `+0xc` only when no `FProficiencyData` entry exists; an existing entry is refreshed (`+0x8` only) and keeps its stored `Init`.
The whole call is one-shot under the guard at `component+0xb0` and runs only when `character+0xf8 == 3`, so a stored cap survives on an existing recruit and only fresh creation or the forced re-init reflects a data change.

```text
// runs once per component under the one-shot guard at component+0xb0
function initialize_proficiency_caps(character):
    config = get_proficiency_config()                 // UHProficiencyConfig

    for profType in 0..30:
        if profType not in config.ProfConfigDTList:   // 23-entry gate at config+0xf8
            continue
        if an entry for profType already exists:
            entry.ProfMaxLvl = clamp(entry.ProfMaxLvl_Init + helper, 0xe8, 0xec)
            continue                                  // +0xc is preserved

        if character.CustomizeRowName is non-null:    // archetype branch, 0x41b79d9
            row = archetype_table.FindRow(character.CustomizeRowName)
            if row.CustomizeProfMaxLv contains profType:
                init = clamp(row_value - existing_add, 0xe8, 0xec)
                goto store

        // blank-body vs recruit:
        //   character+0x26c8 & 3 == 1 selects the blank-body cap
        //   (initializer bit test 0x41b7be4; recompute helper gate 0x41c4a11)
        if blank_body:
            base = config.ProfInitChuShiBodyMaxLvl          // 0xf0 = 50
        else:
            base = rand_int(config.ProfInitMaxLvlMin, config.ProfInitMaxLvlMax)  // 0xe0..0xe4 = 75..100
            bonus = rand_int(row.MinAdd, row.MaxAdd)        // class tables 15..25
            init = clamp(base + bonus, config.ProfMaxLvlLowerLimit, config.ProfMaxLvlUpperLimit)
        store:
            entry.ProfMaxLvl_Init = init                    // +0xc, 0x41b8103
            entry.ProfMaxLvl      = init + helper           // +0x8, 0x41b80ff
            entry.ProfMaxLvl_Add  = 0                       // +0x10, 0x41b8107
```

The blank-body cap for the non-archetype path is `BaiBanProfMaxLvlList.get(p, config.ProfInitChuShiBodyMaxLvl)`, i.e. 40 for combat skills and 10 for gathering/crafting skills, otherwise 50.
The class-cap bonus is data-driven: every row of every `DT_Prof_ZhiYe_*` table is `MinAdd = 15`, `MaxAdd = 25`, so the recruit maximum is `ProfInitMaxLvlMax 100 + MaxAdd 25 = 125` with a hard ceiling of `ProfMaxLvlUpperLimit 150`.

**Confidence.** High on the constants, the clamp bounds `50`/`150`, the class-bonus range `15..25`, and the native maximum of 125.
Medium on whether the base roll is one roll per character or one roll per proficiency; the numeric result is identical because the clamp bounds never bind for the 90..125 range.
The exact order of adding the class bonus relative to the clamp remains an inference; the recompute and the writers are instruction-level traced.

**High.** The archetype DataTable is `DT_CustomizeNPC` (row struct `CustomizeProficiencyAndGA`, field `CustomizeProfMaxLv`), reached via the `CustomizeProfAndGA` pointer at `[resolve()+0x1b0]`; FProperty offsets, a live resolved-row test (56 rows, matching the archetype table), and the exact per-row cap arithmetic all agree.
Which generation step sets `character+0x3378` remains undetermined.

### 5.2 `ProfMaxLvl_Init` writer inventory

`ProfMaxLvl_Init` at `entry+0xc` has three independent writers — the initializer create branch, the setter/copy, and the mentor increment — while the forced re-init re-runs the create writer.
The other rows in the table below write `+0x8`/`+0x10` or refresh an existing entry, not `+0xc`.

| Writer | Fields | Trigger |
| --- | --- | --- |
| `0x41b8103` (initializer create) | `+0x8`, `+0xc`, `+0x10=0` | recruit entry creation |
| `0x41b79cc` (initializer refresh) | `+0x8` only | re-init over existing entries |
| `0x41c4fba` / `0x41c4feb` (recompute) | `+0x10`, `+0x8` | gift apply (`0x41c8fdb`), mentor (`0x4603f46`) |
| `0x41c7dc8` (setter/copy) | `+0x4`, `+0xc`, `+0x14`, `+0x8` | proficiency deserialization (`0x4f0ee0b`) |
| `0x4603f32` (mentor) | `+0xc` (+1) | training-ground cap increment |
| `0x4879a50` → `0x41b7730` (flag 1) | clears then recreates all | forced re-init |

Because the setter `0x41c7cb0` copies serialized `ProfMaxLvl_Init` on save-load or replication, stored caps survive on existing recruits and cannot be corrected by a pak edit; only fresh creation or the forced re-init reflects a data change.
The effect-52 add is applied through the apply routine `0x41c8ba0`, whose list loop `0x41c8fd0` recomputes over the applied gift's `NGProfTypeList`; the sum skips the currently-applied gift id `gift+0xf0` via the exclusion array at `(*(character+0xa8)+0x120)+0x3f0`, so a cap gift's own list does not add to itself (see [`probe-methodology.md`](probe-methodology.md) for the probe consequence).

```sh
objdump -d --start-address=0x41b7730 --stop-address=0x41b8150 "$BIN"   # selector
objdump -d --start-address=0x41c4af0 --stop-address=0x41c4ba0 "$BIN"   # int-range RNG
objdump -d --start-address=0x41c4f30 --stop-address=0x41c4ff5 "$BIN"   # recompute
objdump -d --start-address=0x41c7cb0 --stop-address=0x41c7e6a "$BIN"   # setter: +0x4/+0xc/+0x14/+0x8
objdump -d --start-address=0x4603f20 --stop-address=0x4603f50 "$BIN"   # mentor: +0xc += 1
bun /tmp/verify-v4/scan_calls.mjs 0x41c7cb0
bun /tmp/verify-v4/scan_calls.mjs 0x41b7730
bun /tmp/verify-v4/scan_calls.mjs 0x41c4f30
```

## 6. Vtable and FName-literal surface for symbol-less classes

When a class has no C++ method symbols, the recoverable method surface is its vtable plus the `FName` literals for its reflected `UFUNCTION` and property names.
The Training Ground is the worked example: `BP_JianZhuTrainingGround` has zero `FunctionExport`s, so all of its behavior is native.

| Symbol | Address | Entries | Notes |
| --- | --- | --- | --- |
| `vtable for UHTrainingGroundManager` | `0x1660d68` | ~70 slots | plain `UObject` manager, vptr `0x1660d78` |
| `vtable for AHJianZhuTrainingGround` | `0xfc4880` | ~90 slots | `AActor`-derived building, vptr `0xfc4890` |
| `vtable for UHTrainGroundInterfaceComponent` | `0xfe4540` | — | component attached by the building |
| `vtable for UHUITrainingGround` | `0x13e4160` | — | client widget |
| `vtable for UHUITrainGroundManage` | `0x1410448` | — | client widget |

Class-specific virtual slots are addresses only, because there are no symbols to name them.
`AHJianZhuTrainingGround` dispatches through `0x4609830` and `0x4609a50` (class-local code) and through actor virtuals such as `0x6e51a90`, `0x6e51a60`, `0x6e52a20`, `0x6e52af0`, `0x6e52910`, `0x6e52a10`, `0x6e535c0`, `0x6e51b20`, `0x6e51ae0`, `0x6e51070`, `0x6e59af0`, `0x6e57bb0`, `0x6e57b30`, `0x6e62630`.
The manager dispatches through `0x50be280` and `0x50be2b0` plus shared object virtuals.
Bound-delegate vtables are also recoverable: `TBaseUObjectMethodDelegateInstance<false, AHJianZhuTrainingGround, void (), ...>` and `<..., void (UAnimMontage*, bool), ...>` at `0xfc6890`/`0xfc6900` show the building binds at least two native delegate callbacks (a no-argument callback and an animation-finished callback).

The verified literal set, gathered by `strings` over the binary, is the name surface for these classes:

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
ETrainingType::ShuLianDuTraining
ETrainingType::NGTraining
ETrainingType::NGLevelTraining
ETrainingType::ZhuanJingTraining
ETrainingGroundLogType::TrainingAutoRestart
ETrainingGroundLogType::TrainingAutoUpgrade
ETrainingGroundLogType::TrainingComplete
ETrainingGroundLogType::TrainingLearned
ETrainingGroundLogType::TrainingModify
ETrainingGroundLogType::TrainingPause
ETrainingGroundLogType::TrainingReorder
ETrainingGroundLogType::TrainingRestart
ETrainingGroundLogType::TrainingStop
ETrainingGroundLogType::TrainningAdd
ETrainingGroundLogType::TrainningCancel
```

The only four `ETrainingType` values are `ShuLianDuTraining` (proficiency), `NGTraining` (talent), `NGLevelTraining` (talent tier-up), and `ZhuanJingTraining` (mastery).
There is no donor/recipient pair, no source-proficiency argument, and no `Transfer`/`Inherit`/`Copy` proficiency function name anywhere in the literal set, so a mentorship value-transfer feature would be new logic rather than a call to an existing function.
`TuoGuan` in this surface is the resource/auto-management proxy, not a talent-transfer concept.

```sh
strings -n 4 "$BIN" | grep -E 'Server.*Train|Client.*Train|ETrainingType|SetShuLianDuMaxVal|Coach|JiaoLian' | sort -u
```

## 7. Console/exec literal recovery

`Exec` command names are literal strings in the shipping binary, so they can be recovered exactly by `strings` and matched to their argument spaces.
The names below are the shipped literals.

| Command literal | String vaddr | Argument space | Notes |
| --- | --- | --- | --- |
| `SLDDengJi` | `0xc4ebda` | `EProficiency` type + level | set one proficiency value |
| `SLDDengJiAll` | `0xc859d8` | level | set all proficiency values |
| `SLDJingYan` | `0xc782b4` | `EProficiency` + exp | add proficiency experience |
| `SetShuLianDuMaxVal` | `0xc782a1` | `EProficiency` + cap | set one proficiency cap |
| `AddNG` | `0xc5d05d` | natural-gift id | add talent |
| `RemoveNG` | `0xb08262` | natural-gift id | remove talent |
| `AddZJ` | `0xb4ea80` | mastery ability index | set mastery ability |
| `ClearNG` | `0xb4ea86` | none | clear all talents |
| `RefreshZJ` | `0xca2a98` | none | recompute mastery |
| `JSMJ` | `0xbdd604` | none | unlock all mask nodes |
| `UnLock_Techs` | `0xca2ab6` | none | unlock all technologies |

The spellings `AddNG` and `RemoveNG` are the shipped literals; `AddNg`/`RemoveNg` are misspellings.
`KeJiShu` is not a command; the tech unlock is `UnLock_Techs`.
`WanMeiChongSu` and `ZuRenFuZhi` are not console commands; both are `GameXishu` server-config toggles (`WS/Config/GameplaySettings/GameXishu_Template.json`, value `1` in the shipped templates).

Parameter types are inferred from the argument spaces and usage; the exact reflection signature (`FIntProperty`/`FByteProperty` order) was not recovered statically because the `exec` thunks are not exported and their `FName` parameters live in runtime-constructed reflection objects (Medium).

```sh
strings -n 4 "$BIN" | grep -E '^(SLDDengJi|SLDDengJiAll|SLDJingYan|SetShuLianDuMaxVal|AddNG|RemoveNG|AddZJ|ClearNG|RefreshZJ|JSMJ|UnLock_Techs)$' | sort -u
```

## 8. Native and runtime options

The Linux dedicated server is directly patchable: it is non-PIE, has no `.symtab` but a full `.dynsym`, and runs under gdb.

### 8.1 Patching the Linux server

Two static edits cover a deterministic cap without code injection.

- **Pin the base range.** Overwrite `.rodata` at `0x6c9770` so `ProfInitMaxLvlMin == ProfInitMaxLvlMax` (for example `4b 00 00 00 4b 00 00 00`). The base roll then returns a constant; the class bonus is made deterministic by a data edit (`DT_Prof_ZhiYe_*.MinAdd == .MaxAdd`).
- **Pin the clamp.** The same 16-byte constant carries `ProfMaxLvlLowerLimit`/`UpperLimit` at bytes `8..15`; set them to the desired fixed cap if the clamp must also be fixed.

Changing the constructor immediates (`0x5164276`, `0x51642e9`, `0x51642f0`) is an alternative, but those instructions are in `.text` and must preserve instruction lengths; the `.rodata` word is a plain 16-byte overwrite.
This patch touches only server-side cap generation and does not affect the Windows client or a client-hosted single-player session.
A level-based cap is hard: the selector never reads character level, there is no free space at the store sites for a longer sequence, and the character-level field offset was not traced; a trampoline/jump-to-cave patch or a rewrite of `0x41b7730` is required and must be re-derived after every game update (Medium that it is achievable, High that it is large and fragile).

### 8.2 Patching the Windows client

`WS/Binaries/Win64/WS-Win64-Shipping.exe` (54,656,352 bytes) carries the `@.themida` marker and yields no Unreal strings under `strings`; `WS/Binaries/Win64/` ships no other executable, and `WS.exe` is a 256 KB launcher.
Single-player and listen-server play run the simulation in the Themida/WinLicense-packed client, so a static file patch is not possible without first unpacking the image.
The practical routes are runtime unpacking (dump the mapped image from a running process, find the equivalent of `0x41b7730` by pattern, then patch memory) or an injector that applies the patch at runtime; both are Windows-only, address-shifted, and build-specific.

### 8.3 Code mods and Workshop

A UE code mod cannot carry an executable patch.
Mods ship as cooked UE assets inside a `.pak` (or a Modkit mod folder), and a `.pak` can contain only pak entries; it cannot replace `WS-Win64-Shipping.exe` or inject a DLL.
The `.pak` route can only override cooked assets.
A native patch is a different distribution model: a patched executable, or a loader/injector plus a binary patch.
Steam Workshop delivery cannot include or overwrite the game executable, and the Modkit does not build native code, so a native patch would have to be distributed outside the Workshop.

### 8.4 Jump/cave feasibility

The `.text` sections have the usual inter-function `int3` padding (for example `0x41b7402`..`0x41b740f` before the initializer at `0x41b7410`), so a small cave can be carved locally with a jump.
The constraint is not space but the absence of any level input and the need to re-locate the function after each patch; a cave patch is feasible in principle and not recommended as a product path.

### 8.5 UE4SS runtime status

| Claim | Status | Confidence |
| --- | --- | --- |
| UE4SS supports UE 4.7–5.x | Supported; the 4.7–4.10 range was added explicitly; the exact upper bound (UE 5.7 or 5.8) is not confirmed against the live release page | Unverified |
| Current stable release | a current v3.x stable is published; the exact version is not confirmed here, and `experimental-latest` adds UE 5.4–5.8, `.jmap`, and an in-process SDK generator | Unverified |
| Install model | Proxy DLL (`dwmapi.dll`) next to the game executable, with `UE4SS.dll` in a `ue4ss` subfolder; manual injection is also supported | High |
| Platform | Windows-only injection; Linux support is stated as not soon | High |
| Lua can read/write UPROPERTYs, call UFunctions, hook native and BP UFunctions | Documented Lua API | High |
| A Soulmask custom game config exists in UE4SS | Not found | High that none is public |
| A working Soulmask UE4SS mod exists | Not found | Medium |
| UE4SS can load into the Themida-packed client | Unproven | Unproven |
| Lua can read/write `UHProficiencyConfig` properties | Plausible once UE4SS is loaded, because they are reflected UPROPERTYs; not tested | Unproven |
| Lua can intercept the cap selector at `0x41b7730` | No — it is not a `UFunction`, so `RegisterHook` does not apply | High |
| Anti-cheat blocks it | The kernel service is reported to install when joining official servers, not for offline/private play | Medium |

The Lua path can duplicate a data edit at runtime (write the config CDO fields) and can call the shipped `exec` setters, but it cannot reach the native roll.
UE4SS runs only on Windows, so it is not a Linux-authorable runtime route.

### 8.6 A local "mod-loader with a patch" testing model

A small loader that applies a memory patch at runtime is the least invasive native option for **local** play.
The shape is a data-only `_P.pak` for the editable cap data, plus a separate loader that patches one or two sites in the running process.

- On the Linux dedicated server the loader is unnecessary: the binary can be patched directly and is the server of record for a private session.
- On the Windows client the loader would have to inject into a Themida-packed process, locate the cap function by pattern, and write the patch; whether the anti-cheat engages on offline/private start is Unproven.
- Legality/feasibility: private/offline use of a local patch is the low-risk case; it is not distributable through Steam Workshop, and official-server use is discouraged.

For local testing without official-server support, a Linux dedicated server plus a small binary patch is the only fully reproducible native route; it does not cover client-hosted single-player.

| Option | What it can achieve | Linux-authorable | Ships via Workshop | Effort | Risk | Durability across patches |
| --- | --- | --- | --- | --- | --- | --- |
| Data-only edits (`_P.pak`) | Class bonus deterministic (`MinAdd=MaxAdd`), blank-body caps, clan/level start values, per-level tables | Yes | Yes, if signed via Modkit | Low | Low | Medium |
| BP CDO override (`BP_ProficiencyConfig` in place) | Same data surface, including the class-to-cap-eligible skill set | Yes | Yes, if signed | Low | Low | Medium |
| Windows Modkit BP cook | New Blueprint classes/CDO edits, repoint `ProficiencyConfigClass` | No | Yes (signed) | High | Low | High for the signed path |
| Runtime Lua hook (UE4SS) | Write reflected config properties, call `exec` setters; cannot hook the cap selector | Authoring yes, loading No | No | Medium to prove it loads | High | Low |
| Native binary patch, Linux server | Pin base roll and clamp, or a code-cave level function | Yes | No | Low for constants, High for level function | Medium | Low; addresses re-derived each patch |
| Native binary patch, Windows client | Same as Linux, but reaches single-player | No | No | Very high | High | Very low |

## 9. Other hard-coded native values

These values live only in the binary, are absent from every cooked asset, and therefore cannot be changed by a pak edit.

| Value | Location | Note |
| --- | --- | --- |
| `ProfInitChuShiBodyMaxLvl = 50` | `UHProficiencyConfig` ctor `0x51642f0`, offset `0xf0` | blank/initial-body cap default when `BaiBanProfMaxLvlList` has no entry |
| `ProfMaxLvlUpperLimit = 150` | constant at `0x6c9770`, written at `0x51642e9`, offset `0xec` | hard ceiling for all cap composition |
| `ProfMaxLvlLowerLimit = 50` | constant at `0x6c9770`, written at `0x51642e9`, offset `0xe8` | hard floor for all cap composition |
| `ZhuFuZhiYeQuanZhongMap` zeroed | ctor `0x516437b`, offset `0x1a8` | secondary-profession weighting; never cooked, so `ClanFuZhiYe` stays `None` and the secondary map is dead on retail |
| `GoodNGMaxNum` native default `5` | `0x444915f` (`movl $0x5,0xa90`), offset `0xa90` | cooked manager default object carries `6` at raw-byte offset `40312`; the manager CDO is a `RawExport` and cannot be typed-edited |
| `BadNGRandomMinNum = 0`, `BadNGRandomMaxNum = 5` | `0x4449169`, offset `0xab8` | defect count range; native |
| rounding constant `1.0` | `0x6c0534` | the recompute's `addss`/`cvtss2si`/`sar $1` rounding sequence |
| `ENaturalGiftEffect::ProfExpInc = 51` | `0x14ec6c0` | effect enum table; writes `ProfExp (+0x14)` |
| `ENaturalGiftEffect::ProfMaxLevelInc = 52` | `0x14ec6d0` | effect enum table; writes `ProfMaxLvl_Add (+0x10)` and `ProfMaxLvl (+0x8)` |
| `ENaturalGiftEffect::Max = 133` | `0x14ecbe0` | enum terminator |

### 9.1 Additional recovered reflection records, vtables, and addresses

The records and anchors below were recovered alongside the cap analysis and are stable enough to re-derive after a patch.
The roster-limit composition built on `AHPlayerState` is in [`../game-reference/roster-limits.md`](../game-reference/roster-limits.md).

| Item | Address / value | Note | Confidence |
| --- | --- | --- | --- |
| `AHPlayerState` vtable `_ZTV13AHPlayerState` | `0x1397918` | complete-object pointer `0x1397928`, written by the constructor | High |
| `AHPlayerState` constructor | `0x49a2050` | `movaps %xmm0,0x4e0(%rbx)` at `0x49a212d` seeds the cap block from `0x6df880` (`03 00 00 00 03 00 00 00 00 00 00 00 00 00 00 00`) | High |
| `AHPlayerState` property records | `0x15f89c0`, `0x15f89e8`, `0x15f8a10`, `0x15f8a38` | `PeiZhiMaxZhaoMuCount` `0x4e0`, `MaxZhaoMuCount` `0x4e4`, `ConfigMaxChuZhanCount` `0x4e8`, `AddCanChuZhanManRenCount` `0x4ec` | High |
| `AHPlayerState::SetMaxZhaoMuCount` | `0x4a307b0` | writes `MaxZhaoMuCount` at `0x4e4` | High |
| mask-effect enum string `TeShuZiType_AddZhaoMuNum` | `0x924af5` | the `AddZhaoMuNum` value channel | High |
| `HZiYuanGuanLiQi` preference-count constructor | `0x444917a` | `movabs $0x300000000,%rdx; mov %rdx,0xad0(%rbx)` seeds `XiHaoRandomMinNum = 0` / `XiHaoRandomMaxNum = 3` | High |
| `HZiYuanGuanLiQi` star-weight offset | `0xaa0` | `PinZhiGoodNGStarWeightMap` | Medium |
| active-gift array / count | `character+0x640` / `character+0x650` | runtime gift list and its count | High |
| level arrays | `character+0x548` / `character+0x550` | level catch-up roller `0x41b8ee0`, level-up caller `0x41b962b`, positive roller `0x41ca960` | Medium |
| mastery xorshift scale | `0x6bfc30` | 24-bit fraction multiplied by `5.960464477539063e-8` in `UHZiYuanGuanLiQi::GetZhuanJingAbilityByShuLianDu` at `0x4453ac0` | High |
| character-initializer once-guard | `0x41b741d` (initializer `0x41b7410`), caller `0x41b677e` | the caller tests `cmpb $0x3,0xf8(%r14)` | High |
| forced re-init callers | `0x4879a50` | 13 callers, including `0x4434860`, `0x4436979`, `0x4438893`, `0x443e0a0`, `0x459d28d`, `0x46436a7`, `0x46add82`, `0x46ae63c`, `0x470ba92`, `0x470fbb8`, `0x49f9642`, `0x49fba28`, `0x4dbedce`; it clears bit 0 of `+0x528` first | High |
| `FProficiencyData` per-field records | `0x14ef8a0` (`+0x8`), `0x14ef8c8` (`+0xc`), `0x14ef8f0` (`+0x10`) | confirm `ProfMaxLvl`, `ProfMaxLvl_Init`, `ProfMaxLvl_Add` | High |
| defect import indices | `DT_BadNGConfig` `-4054` (resolves to `DT_GiftFuMiann`), `DT_PinZhiBadNGRemovePr` `-4059`, `DT_GoodNG` `-4057` | asset import table | High |

### 9.2 `HZiYuanGuanLiQi` manager members

The manager's member names come from Modkit tooltip metadata (Medium), so the names are reliable while the offsets are only confirmed where noted elsewhere.

| Member | Role | Confidence |
| --- | --- | --- |
| `DT_GoodNGConfig`, `DT_BadNGConfig` | random positive-talent and defect tables (`DT_BadNGConfig` import `-4054`) | Medium |
| `DT_XiHaoConfig`, `DT_XingGeConfig` | random preference and personality tables | Medium |
| `DT_NGEffectConfig`, `DT_NGEffectConfigDongWu` (`0xa80`) | talent-effect tables selected by target | Medium |
| `DT_TiaoJianConfig`, `DT_LengLuoEffectConfig`, `DT_GuanXiConfig`, `DT_XiHaoBiaoXian`, `DT_WeiSuiJiCVal` | condition, neglect-effect, relation, preference-expression, and PRD tables | Medium |
| `XiHaoRandomMinNum` / `XiHaoRandomMaxNum` | `0xad0` / `0xad4` preference count range | High |
| `BadNGRandomMinNum` / `BadNGRandomMaxNum` | `0xab8` / `0xabc` defect count range | High |
| `TouKaoSGQCls`, `TouKaoFuJiaDaoJus`, `TouKaoLifeTime`, `TouKaoCheckTimeCD`, `TouKaoBTAssert`, `TouKaoTiShiTxt` | `TouKao` conversion/recruitment fields | Medium |

`MaxLevel` is **not** hard-coded in the native binary.
It is a `GameXishu` setting (`"MaxLevel": 60` in `WS/Config/GameplaySettings/GameXishu_Template.json`), alongside `"CurProfInitRatio": 0`.

The distinction that matters for editing is whether a value is read from the class object or from compiled immediates.
The cap constants are stored as object fields and can be changed by overriding the `BP_ProficiencyConfig` CDO with a pak.
The clamp constant at `0x6c9770` and the constructor immediates are compiled `.rodata`/`.text`; changing them requires a binary patch.

## 10. Foot-guns

**Addresses shift every game build patch.**
Without a `.symtab` and with no shipped debug file, every address in this document must be re-derived after an update.
Anchor to the reflection records, the `FName` literals, and the stat strings (`UHChengZhangComponent.InitProficiency.for.if` at `0xc3fd2f`), which are more stable than raw code addresses.

**Method names are unrecoverable without the debug file.**
`readelf -x .gnu_debuglink` names `WSServer-Linux-Shipping.debug`, but that file is not shipped.
Only vtable addresses, bound-delegate vtables, `FName` literals, and disassembly are available for symbol-less classes; do not expect to recover C++ names or signatures.

**Localization namespaces and map identities are not authoritative.**
The `HZiYuanGuanLiQi:` localization namespace labels the cap fields even though they are `UHProficiencyConfig` properties, so a namespace label does not prove ownership.
Resolve a map from the property records and live reads: `ZhiYeProfLvlMap` is `config+0x80`, `ZhiYeProfMaxLvlMap` is `config+0x108`, and `FuZhiYeProfMaxLvlMap` is `config+0x158` (empty at runtime).
The archetype seed is `DT_CustomizeNPC` via `CustomizeProfAndGA` at `[resolve()+0x1b0]`, and a null at the unrelated `ManRenConfigTable` field `0x16a0` (binding `DT_ManRenConfig`) is a no-op for caps; `DT_XingGeConfig` is not the table read.
Make the binary property records, not the localization, authoritative.

**Do not trust Blueprint bytecode over native evidence.**
A class can have zero `FunctionExport`s (`BP_JianZhuTrainingGround` is the example) while all of its behavior is native; absence of Blueprint functions does not mean absence of behavior.
Conversely, an effect-51 (`ProfExpInc`) apply triggers the cap recompute over the applied gift's proficiency list, so the effect value does not by itself set a cap base.
The per-proficiency state is proven, but the individual draws and the generation step that sets `character+0x3378` remain native RNG.

**A competing config pak in `~mods` can win the mount.**
Unreal 4.27 uses first-match-wins by mount order, so a leftover config override can silently supply different cap constants; confirm the active `~mods` contents before trusting an observed value.

**Stored `ProfMaxLvl_Init` is never rewritten by data.**
Existing recruits keep their caps; only fresh spawns or the native forced re-init `0x4879a50` reflect a cap change.

**Blank-body vs recruit and archetype overrides.**
`BaiBanProfMaxLvlList` is the blank/initial-body cap set (combat 40 / craft 10), not necessarily the recruit set, and the archetype branch can seed `Init` from `DT_CustomizeNPC` for a subset of proficiencies, so a recruit can carry caps outside the frozen base+class band.
Which generation step sets `character+0x3378` remains undetermined.
