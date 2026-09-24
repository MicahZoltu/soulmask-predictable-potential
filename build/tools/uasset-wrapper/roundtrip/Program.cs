using System;
using System.IO;
using System.Text;
using UAssetAPI;
using UAssetAPI.UnrealTypes;
using Newtonsoft.Json;

// usage: roundtrip <input.uasset> <outputBaseWithoutExtension> [replaceFromFile]
if (args.Length < 2)
{
    Console.Error.WriteLine("usage: roundtrip <input.uasset> <outputBase> [replacementJson]");
    return 2;
}
string inputPath = args[0];
string outputBase = args[1];

UAsset asset = new UAsset(inputPath, EngineVersion.VER_UE4_27);
string json = asset.SerializeJson(Formatting.Indented);
File.WriteAllText(outputBase + ".export.json", json);

string importJson = json;
if (args.Length >= 3) importJson = File.ReadAllText(args[2], Encoding.UTF8);

UAsset imported = UAsset.DeserializeJson(importJson);
imported.Write(outputBase + ".uasset");
Console.WriteLine($"wrote {outputBase}.uasset (+ .uexp if separate)");
return 0;
