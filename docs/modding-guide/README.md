# Modding Guide

This folder explains how to build, load, test, and ship a Soulmask mod, with a Linux-first workflow built on the shipped cooked assets.
The table lists the guides in a suggested reading order, and each guide marks what is proven versus what is still unverified in game.

| File | Covers |
| --- | --- |
| [`tooling.md`](tooling.md) | The tools used to read, edit, and pack cooked UE 4.27 assets. |
| [`authoring-pipeline.md`](authoring-pipeline.md) | Taking a data-only mod from retail assets to a loadable unsigned `_P.pak`. |
| [`data-editing.md`](data-editing.md) | The UAssetAPI edit operations on cooked `.uasset`/`.uexp` pairs. |
| [`packaging-and-loading.md`](packaging-and-loading.md) | Pak format, mod layout, engine scan paths, and the signature gate. |
| [`testing.md`](testing.md) | Confirming a mod mounts and its overridden data reaches the running game. |
| [`official-modkit-and-modconfiger.md`](official-modkit-and-modconfiger.md) | When the official Modkit and `ModConfiger` are needed and when they can be skipped. |
| [`distribution-and-anticheat.md`](distribution-and-anticheat.md) | Signed versus unsigned distribution and the shipped anti-cheat surface. |

The game values these guides act on are documented in [`../game-reference/`](../game-reference/), and the extraction step they assume is in [`../reverse-engineering/extracting-cooked-assets.md`](../reverse-engineering/extracting-cooked-assets.md); the full index is at [`../README.md`](../README.md).
