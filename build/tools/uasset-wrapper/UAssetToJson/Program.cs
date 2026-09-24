using UAssetAPI;
using UAssetAPI.UnrealTypes;
using Newtonsoft.Json;

if (args.Length < 2)
{
	Console.Error.WriteLine("usage: UAssetToJson <input.uasset> <output.json> [engineMajorMinor]");
	return 2;
}

string inputPath = args[0];
string outputPath = args[1];

EngineVersion engineVersion = EngineVersion.VER_UE4_27;
if (args.Length >= 3)
{
	string spec = args[2];
	string[] parts = spec.Split('.');
	int major = int.Parse(parts[0]);
	int minor = int.Parse(parts[1]);
	int numeric = major * 10 + minor;
	engineVersion = (EngineVersion)numeric;
}

UAsset asset = new UAsset(inputPath, engineVersion);
string json = asset.SerializeJson(Formatting.Indented);
File.WriteAllText(outputPath, json);
Console.WriteLine($"wrote {outputPath}");
return 0;
