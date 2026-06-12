import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-react-native";
import { decodeJpeg } from "@tensorflow/tfjs-react-native";
import * as mobilenet from "@tensorflow-models/mobilenet";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import { Platform } from "react-native";

const isWeb = Platform.OS === "web";

// PlantVillage 38 classes in the same order as the animeshakr/plant-disease-efficientnetv2s model
const PLANTVILLAGE_LABELS = [
  "Apple___Apple_scab", "Apple___Black_rot", "Apple___Cedar_apple_rust", "Apple___healthy",
  "Blueberry___healthy",
  "Cherry_(including_sour)___Powdery_mildew", "Cherry_(including_sour)___healthy",
  "Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot", "Corn_(maize)___Common_rust_", "Corn_(maize)___Northern_Leaf_Blight", "Corn_(maize)___healthy",
  "Grape___Black_rot", "Grape___Esca_(Black_Measles)", "Grape___Leaf_blight_(Isariopsis_Leaf_Spot)", "Grape___healthy",
  "Orange___Haunglongbing_(Citrus_greening)",
  "Peach___Bacterial_spot", "Peach___healthy",
  "Pepper,_bell___Bacterial_spot", "Pepper,_bell___healthy",
  "Potato___Early_blight", "Potato___Late_blight", "Potato___healthy",
  "Raspberry___healthy",
  "Soybean___healthy",
  "Squash___Powdery_mildew",
  "Strawberry___Leaf_scorch", "Strawberry___healthy",
  "Tomato___Bacterial_spot", "Tomato___Early_blight", "Tomato___Late_blight",
  "Tomato___Leaf_Mold", "Tomato___Septoria_leaf_spot", "Tomato___Spider_mites Two-spotted_spider_mite",
  "Tomato___Target_Spot", "Tomato___Tomato_Yellow_Leaf_Curl_Virus", "Tomato___Tomato_mosaic_virus", "Tomato___healthy",
] as const;

// ImageNet class IDs that correspond to plant/leaf-related concepts
const PLANT_IMAGENET_IDS = new Set([
  924, 925, 926, 927, 928, 929, 930, 931, 932, 933, 934, 935, 936, 937, 938, 939,
  940, 941, 942, 943, 944, 945, 946, 947, 948, 949, 950, 951, 952, 953, 954, 955,
  956, 957, 958, 959, 960, 961, 962, 963, 964, 965, 966, 967, 968, 969, 970, 971,
  972, 973, 974, 975, 976, 977, 978, 979, 980, 981, 982, 983, 984, 985, 986, 987,
  988, 989, 990, 991, 992, 993, 994, 995, 996, 997, 998, 999,
]);

let plantModel: tf.GraphModel | null = null;
let mobileNetInstance: mobilenet.MobileNet | null = null;

/**
 * Attempts to load a TF.js plant-disease model from bundled assets.
 * To use, convert the TFLite model to TF.js format (see scripts/convert_model.py)
 * and place the output in assets/plant_model/ directory.
 */
async function loadBundledPlantModel(): Promise<boolean> {
  if (plantModel) return true;
  try {
    const modelJson = require("../assets/plant_model/model.json");
    const weights = require("../assets/plant_model/group1-shard1of1.bin");
    const { bundleResourceIO } = await import("@tensorflow/tfjs-react-native");
    await tf.ready();
    plantModel = await tf.loadGraphModel(bundleResourceIO(modelJson, weights));
    console.log("Plant-disease model loaded from bundle");
    return true;
  } catch {
    console.log("No bundled plant model found, using fallback");
    return false;
  }
}

async function loadMobileNetFallback(): Promise<boolean> {
  if (mobileNetInstance) return true;
  try {
    await tf.ready();
    mobileNetInstance = await mobilenet.load({ version: 2, alpha: 0.5 });
    console.log("MobileNetV2 fallback loaded");
    return true;
  } catch {
    return false;
  }
}

export async function loadOfflineModel(): Promise<boolean> {
  const bundled = await loadBundledPlantModel();
  if (bundled) return true;
  return loadMobileNetFallback();
}

export async function classifyOffline(imageUri: string): Promise<{
  isHealthy: boolean;
  confidence: number;
  label: string;
  plantName: string;
} | null> {
  if (!plantModel && !mobileNetInstance) {
    const loaded = await loadOfflineModel();
    if (!loaded) return null;
  }

  try {
    // --- Path 1: Plant-disease specific model (38-class PlantVillage) ---
    if (plantModel) {
      const resized = await manipulateAsync(
        imageUri,
        [{ resize: { width: 384, height: 384 } }],
        { format: SaveFormat.JPEG, base64: true }
      );
      if (!resized.base64) return null;

      let imageTensor: tf.Tensor3D;
      if (!isWeb) {
        const raw = tf.util.encodeString(resized.base64, "base64");
        imageTensor = decodeJpeg(raw, 3);
      } else {
        const img = new (globalThis as any).Image(384, 384);
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = reject;
          img.src = `data:image/jpeg;base64,${resized.base64}`;
        });
        const canvas = document.createElement("canvas");
        canvas.width = 384;
        canvas.height = 384;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, 384, 384);
        const pixels = ctx.getImageData(0, 0, 384, 384).data;
        const arr = new Float32Array(384 * 384 * 3);
        for (let i = 0; i < 384 * 384; i++) {
          arr[i * 3] = pixels[i * 4] / 255;
          arr[i * 3 + 1] = pixels[i * 4 + 1] / 255;
          arr[i * 3 + 2] = pixels[i * 4 + 2] / 255;
        }
        imageTensor = tf.tensor3d(arr, [384, 384, 3]);
      }

      const batched = tf.expandDims(imageTensor, 0) as tf.Tensor4D;
      const output = plantModel.predict(batched) as tf.Tensor;
      const probs = Array.from(await output.data());
      tf.dispose([imageTensor, batched, output]);

      const topIdx = probs.indexOf(Math.max(...probs));
      const topScore = probs[topIdx];
      const rawLabel = PLANTVILLAGE_LABELS[topIdx] || "Unknown";
      const plantName = rawLabel.split("___")[0]
        .replace(/_/g, " ").replace(/\(/g, "").replace(/\)/g, "").trim();
      const isHealthy = rawLabel.toLowerCase().includes("healthy");

      return { isHealthy, confidence: topScore, label: rawLabel, plantName };
    }

    // --- Path 2: MobileNetV2 fallback (ImageNet) with plant-relevant scoring ---
    if (mobileNetInstance) {
      const resized = await manipulateAsync(
        imageUri,
        [{ resize: { width: 224, height: 224 } }],
        { format: SaveFormat.JPEG, base64: true }
      );
      if (!resized.base64) return null;

      let imageTensor: tf.Tensor3D;
      if (!isWeb) {
        const raw = tf.util.encodeString(resized.base64, "base64");
        imageTensor = decodeJpeg(raw);
      } else {
        const img = new (globalThis as any).Image(224, 224);
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = reject;
          img.src = `data:image/jpeg;base64,${resized.base64}`;
        });
        imageTensor = tf.browser.fromPixels(img) as tf.Tensor3D;
      }

      const predictions = await mobileNetInstance.classify(imageTensor, 5);
      tf.dispose(imageTensor);

      if (!predictions || predictions.length === 0) return null;

      const top = predictions[0];
      const plantMatch = predictions.find(
        (p) => p.className.toLowerCase().includes("leaf")
          || p.className.toLowerCase().includes("plant")
          || p.className.toLowerCase().includes("flower")
          || p.className.toLowerCase().includes("tree")
      );

      const label = plantMatch?.className || top.className;
      const confidence = plantMatch?.probability || top.probability;
      const isPlant = !!plantMatch;

      return {
        isHealthy: true,
        confidence: isPlant ? confidence : confidence * 0.5,
        label: label,
        plantName: label.split(",")[0].trim(),
      };
    }

    return null;
  } catch (e) {
    console.warn("Offline classification error:", e);
    return null;
  }
}
