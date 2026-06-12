/**
 * Downloads the fine-tuned ViT TFLite model and labels for offline inference.
 * Run this AFTER converting the model to TFLite via convert_vit_to_tflite_colab.py
 *
 * Usage:
 *   1. Run convert_vit_to_tflite_colab.py on Colab
 *   2. Upload model_float16.tflite + class_indices.json to a HuggingFace repo
 *   3. Update MODEL_REPO and FILES below
 *   4. Run: node scripts/download_model_assets.js
 */

const https = require("https");
const fs = require("fs");
const path = require("path");

// TODO: Update MODEL_REPO after uploading TFLite files to HuggingFace
// Currently downloads the old EfficientNetV2S model as fallback
const MODEL_REPO = "animeshakr/plant-disease-efficientnetv2s";
const FILES = [
  { name: "model_float16_quant.tflite", output: "model.tflite" },
  { name: "class_indices.json", output: "class_indices.json" },
];

const OUTPUT_DIR = path.join(__dirname, "..", "app", "assets", "plant_model");

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https
      .get(url, (response) => {
        if (response.statusCode === 302 || response.statusCode === 301) {
          file.close();
          fs.unlinkSync(dest);
          return download(response.headers.location, dest).then(resolve).catch(reject);
        }
        if (response.statusCode !== 200) {
          file.close();
          fs.unlinkSync(dest);
          reject(new Error(`HTTP ${response.statusCode}: ${url}`));
          return;
        }
        response.pipe(file);
        file.on("finish", () => {
          file.close();
          resolve();
        });
      })
      .on("error", (err) => {
        file.close();
        fs.unlinkSync(dest, () => {});
        reject(err);
      });
  });
}

async function main() {
  console.log("🌿 Downloading PlantVillage model for offline inference...\n");

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  for (const file of FILES) {
    const url = `https://huggingface.co/${MODEL_REPO}/resolve/main/${file.name}`;
    const dest = path.join(OUTPUT_DIR, file.output);
    console.log(`Downloading ${file.name}...`);
    try {
      await download(url, dest);
      const stats = fs.statSync(dest);
      console.log(`  ✅ Saved (${(stats.size / 1024 / 1024).toFixed(1)} MB): ${dest}`);
    } catch (err) {
      console.error(`  ❌ Failed: ${err.message}`);
    }
  }

  console.log("\n✅ Done! Model files ready in app/assets/plant_model/");
  console.log("\n📱 To use for offline inference:");
  console.log("   The app will automatically detect and use the model");
  console.log("   via react-native-fast-tflite (native) or TF.js (bundled).\n");
}

main().catch(console.error);
