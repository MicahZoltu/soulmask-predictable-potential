# Reverse Engineering

This folder records how the Soulmask findings were obtained and how to reproduce them from the shipping files.
It is written for a mod maker or researcher who needs to extract assets, read the dedicated-server binary, or design an experiment of their own.
Claims here are labelled by evidence level: the extraction and analysis guides use asset-level, binary-level, inferred, or unverified, and `native-binary-analysis.md` uses High, Medium, Low, or Inference.

| File | Covers |
| --- | --- |
| [`extracting-cooked-assets.md`](extracting-cooked-assets.md) | Recovering the retail AES key and unpacking the retail paks on Linux. |
| [`asset-analysis.md`](asset-analysis.md) | Parsing, inspecting, editing, and re-serializing cooked assets with UAssetAPI. |
| [`native-binary-analysis.md`](native-binary-analysis.md) | Reading hard-coded gameplay out of the shipping Linux dedicated-server binary. |
| [`probe-methodology.md`](probe-methodology.md) | Designing temporary probe paks to make one uncertain behavior observable. |

The AES key documented in the extraction guide is a secret: within the maintained document set it appears only there and must not be copied into other documents or committed around.
The transient probe sources these methods produce live under `artifacts/` and are not deliverables.
For where these methods fit in the wider set, see the master index at [`../README.md`](../README.md); the guided authoring path is in [`../modding-guide/authoring-pipeline.md`](../modding-guide/authoring-pipeline.md).
