import { checkQuality } from "../services/api";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";

export async function checkImageQuality(uri: string): Promise<{
  isBlurry: boolean;
  isTooDark: boolean;
  likelyLeaf: boolean;
  passed: boolean;
}> {
  try {
    const result = await checkQuality(uri);
    return {
      isBlurry: result.is_blurry,
      isTooDark: result.is_too_dark,
      likelyLeaf: result.likely_leaf,
      passed: result.passed,
    };
  } catch {
    return { isBlurry: false, isTooDark: false, likelyLeaf: true, passed: true };
  }
}

export async function sharpenImage(uri: string): Promise<string> {
  const result = await manipulateAsync(uri, [], { compress: 0.9, format: SaveFormat.JPEG });
  return result.uri;
}
