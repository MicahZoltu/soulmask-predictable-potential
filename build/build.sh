#!/usr/bin/env bash
# Builds the combined ConsistentProgression_P.pak from the extracted retail content trees.
# Override any of these variables to point at another toolchain or asset tree.
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"

export SOULMASK_CLIENT_CONTENT="${SOULMASK_CLIENT_CONTENT:-/tmp/soulmask-client/extracted/WS/Content}"
export SOULMASK_SERVER_CONTENT="${SOULMASK_SERVER_CONTENT:-/tmp/soulmask-server/extracted/WS/Content}"
export DOTNET_ROOT="${DOTNET_ROOT:-/tmp/dotnet}"
export REPAK_PATH="${REPAK_PATH:-/usr/local/bin/repak}"
export UASSET_TO_JSON_DLL="${UASSET_TO_JSON_DLL:-/tmp/uasset2json/UAssetToJson/bin/Release/net8.0/UAssetToJson.dll}"
export ROUNDTRIP_DLL="${ROUNDTRIP_DLL:-/tmp/pipeline-scratch/roundtrip/bin/Release/net8.0/roundtrip.dll}"

exec bun run "$HERE/src/main.ts"
