import { useState, useRef, useCallback } from "react";
import { View, StyleSheet, TouchableOpacity, Text, ActivityIndicator, Image, Platform } from "react-native";
import * as ImagePicker from "expo-image-picker";
import Animated, { FadeIn, FadeInUp, FadeInDown } from "react-native-reanimated";
import { ImagePlus, Leaf, Upload } from "lucide-react-native";
import { useDiagnosticStore } from "../store/useDiagnosticStore";
import { predictLeaf, predictLeafFromFile, checkQualityFromFile } from "../services/api";
import { compressImage } from "../utils/compress";
import { checkImageQuality } from "../utils/imageQuality";
import { QualityBadge } from "../components/QualityBadge";
import type { DiagnosticResult } from "../types";

const isWeb = Platform.OS === "web";

type Stage = "viewfinder" | "review";

function extractPlantName(label: string): string {
  return label.split("___")[0].replace(/_/g, " ").replace(/\(/g, "").replace(/\)/g, "").trim().toLowerCase();
}

function getPlantFromPrediction(p: { label: string }): string {
  return extractPlantName(p.label);
}

function validatePredictions(
  result: DiagnosticResult,
  topK: number = 3
): string | null {
  if (result.confidence >= 0.55) return null;

  const topP = result.top_predictions ?? [];
  const topN = topP.slice(0, topK);

  return null;
}

export function CameraScreen() {
  const cameraRef = useRef<any>(null);
  const setCapturedImage = useDiagnosticStore((s) => s.setCapturedImage);
  const setResult = useDiagnosticStore((s) => s.setResult);
  const setScreen = useDiagnosticStore((s) => s.setScreen);
  const setProcessing = useDiagnosticStore((s) => s.setProcessing);
  const setError = useDiagnosticStore((s) => s.setError);
  const addToHistory = useDiagnosticStore((s) => s.addToHistory);
  const isProcessing = useDiagnosticStore((s) => s.isProcessing);
  const error = useDiagnosticStore((s) => s.error);

  const [stage, setStage] = useState<Stage>("viewfinder");
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [quality, setQuality] = useState({ isBlurry: false, isTooDark: false, likelyLeaf: true, passed: true });

  async function processAndPredict(uri: string, force = false) {
    try {
      setProcessing(true);
      setError(null);
      const compressed = await compressImage(uri);
      const q = await checkImageQuality(compressed);
      setQuality(q);
      setCapturedImage(compressed);
      if (!force && !q.passed) { setStage("review"); return; }
      let result;
      try {
        result = await predictLeaf(compressed);
      } catch {
        if (isWeb) throw new Error("Prediction failed. Check your connection.");
        const { classifyOffline } = await import("../services/offline");
        const offline = await classifyOffline(compressed);
        if (offline) {
          result = {
            disease: offline.label,
            plant_name: offline.plantName,
            confidence: offline.confidence,
            severity_percentage: offline.isHealthy ? 0 : 50,
            timestamp: Date.now(),
          };
        } else {
          throw new Error("Both online and offline analysis failed.");
        }
      }
      const validationError = validatePredictions(result);
      if (validationError) {
        setError(validationError);
        setProcessing(false);
        return;
      }
      const enriched = { ...result, imageUri: compressed };
      setResult(enriched);
      addToHistory(enriched);
      setScreen("result");
    } catch (e: any) {
      setError(e.message || "Prediction failed");
    } finally { setProcessing(false); }
  }

  async function takePicture() {
    if (!cameraRef.current) return;
    const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
    if (photo?.uri) { setPreviewUri(photo.uri); await processAndPredict(photo.uri); }
  }

  async function pickFromGallery() {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.7 });
    if (!result.canceled && result.assets[0]) { setPreviewUri(result.assets[0].uri); await processAndPredict(result.assets[0].uri); }
  }

  async function pickFromWeb() {
    const input = document.createElement("input");
    input.type = "file"; input.accept = "image/*";
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const blobUri = URL.createObjectURL(file);
      setPreviewUri(blobUri);
      try {
        setProcessing(true);
        setError(null);
        let q;
        try {
          q = await checkQualityFromFile(file);
        } catch {
          q = await checkImageQuality(blobUri);
        }
        setQuality({
          isBlurry: q.is_blurry,
          isTooDark: q.is_too_dark,
          likelyLeaf: q.likely_leaf,
          passed: q.passed,
        });
        setCapturedImage(blobUri);
        if (!q.passed) { setStage("review"); setProcessing(false); return; }
        let result;
        try {
          result = await predictLeafFromFile(file);
        } catch {
          if (isWeb) throw new Error("Prediction failed. Check your connection.");
          const { classifyOffline } = await import("../services/offline");
          const offline = await classifyOffline(blobUri);
          if (offline) {
            result = {
              disease: offline.label,
              plant_name: offline.plantName,
              confidence: offline.confidence,
              severity_percentage: offline.isHealthy ? 0 : 50,
              timestamp: Date.now(),
            };
          } else {
            throw new Error("Both online and offline analysis failed.");
          }
        }
        const validationError = validatePredictions(result);
        if (validationError) {
          setError(validationError);
          setProcessing(false);
          return;
        }
        const enriched = { ...result, imageUri: blobUri };
        setResult(enriched);
        addToHistory(enriched);
        setScreen("result");
      } catch (e: any) {
        setError(e.message || "Prediction failed");
      } finally { setProcessing(false); }
    };
    input.click();
  }

  const handleRetake = useCallback(() => {
    setStage("viewfinder"); setPreviewUri(null);
    setQuality({ isBlurry: false, isTooDark: false, likelyLeaf: true, passed: true }); setError(null);
  }, []);

  const handleProceedAnyway = useCallback(async () => {
    if (!previewUri) return; await processAndPredict(previewUri, true);
  }, [previewUri]);

  if (isWeb) {
    return (
      <View style={styles.container}>
        {stage === "viewfinder" && (
          <Animated.View entering={FadeInUp.duration(600).springify()} style={styles.webPicker}>
            <View style={styles.webIconWrap}>
              <Leaf size={48} stroke="#fff" strokeWidth={1.5} />
            </View>
            <Text style={styles.webTitle}>Plant Scanner</Text>
            <Text style={styles.webSubtitle}>Take or upload a photo of a leaf to identify the plant and detect any diseases. The AI model will analyze the leaf and provide treatment recommendations.</Text>
            <TouchableOpacity style={styles.primaryButton} onPress={pickFromWeb} activeOpacity={0.85}>
              <Upload size={20} stroke="#fff" />
              <Text style={styles.buttonText}>Choose Image</Text>
            </TouchableOpacity>
            {error && <Text style={styles.error}>{error}</Text>}
            {isProcessing && (
              <View style={styles.webLoading}>
                <ActivityIndicator size="large" color="#22c55e" />
                <Text style={styles.webLoadingText}>Analyzing leaf...</Text>
              </View>
            )}
          </Animated.View>
        )}
        {stage === "review" && previewUri && (
          <Animated.View entering={FadeIn.duration(400)} style={styles.reviewContainer}>
            <Image source={{ uri: previewUri }} style={styles.reviewImage} resizeMode="contain" />
            <QualityBadge blurry={quality.isBlurry} dark={quality.isTooDark} likelyLeaf={quality.likelyLeaf} onRetake={handleRetake} onProceed={handleProceedAnyway} />
            {isProcessing && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color="#22c55e" />
                <Text style={styles.loadingText}>Analyzing leaf...</Text>
              </View>
            )}
            {error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity style={styles.retryButton} onPress={handleRetake}>
                  <Text style={styles.retryText}>Try Again</Text>
                </TouchableOpacity>
              </View>
            )}
          </Animated.View>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {stage === "viewfinder" && (
        <View style={styles.camera}>
          <Animated.View entering={FadeInDown.duration(500)} style={styles.overlay}>
            <Text style={styles.hint}>Take a photo of a leaf to identify the plant and detect diseases</Text>
            <View style={styles.frame} />
            {error && <Text style={styles.error}>{error}</Text>}
            <View style={styles.controls}>
              <TouchableOpacity onPress={pickFromGallery} style={styles.iconButton} activeOpacity={0.7}>
                <ImagePlus size={24} stroke="#fff" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.captureButton, isProcessing && { opacity: 0.5 }]}
                onPress={takePicture} disabled={isProcessing}
              >
                {isProcessing ? <ActivityIndicator color="#fff" /> : <View style={styles.captureInner} />}
              </TouchableOpacity>
              <View style={{ width: 48 }} />
            </View>
          </Animated.View>
        </View>
      )}

      {stage === "review" && previewUri && (
        <Animated.View entering={FadeIn.duration(400)} style={styles.reviewContainer}>
          <Image source={{ uri: previewUri }} style={styles.reviewImage} resizeMode="contain" />
          <QualityBadge blurry={quality.isBlurry} dark={quality.isTooDark} likelyLeaf={quality.likelyLeaf} onRetake={handleRetake} onProceed={handleProceedAnyway} />
          {isProcessing && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#22c55e" />
              <Text style={styles.loadingText}>Analyzing leaf...</Text>
            </View>
          )}
          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={handleRetake}>
                <Text style={styles.retryText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  camera: { flex: 1 },
  webPicker: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f0fdf4", gap: 16, padding: 32 },
  webIconWrap: { width: 96, height: 96, borderRadius: 48, backgroundColor: "#22c55e", justifyContent: "center", alignItems: "center", marginBottom: 8,     boxShadow: "0 0 20px rgba(34,197,94,0.35)", elevation: 10 },
  webTitle: { fontSize: 28, fontWeight: "800", color: "#15803d" },
  webSubtitle: { fontSize: 15, color: "#6b7280", textAlign: "center", marginBottom: 8 },
  webLoading: { alignItems: "center", gap: 12 },
  webLoadingText: { color: "#22c55e", fontSize: 16, fontWeight: "500" },
  primaryButton: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#22c55e", paddingHorizontal: 28, paddingVertical: 14, borderRadius: 14,     boxShadow: "0 0 12px rgba(34,197,94,0.3)", elevation: 6 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  overlay: { flex: 1, justifyContent: "flex-end", alignItems: "center", paddingBottom: 50, gap: 20 },
  hint: { color: "#fff", fontSize: 14, fontWeight: "500",     textShadow: "0 0 4px rgba(0,0,0,0.5)" },
  frame: { width: 280, height: 280, borderRadius: 16, borderWidth: 2, borderColor: "rgba(255,255,255,0.6)", position: "absolute", top: "28%", alignSelf: "center" },
  controls: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 48 },
  captureButton: { width: 72, height: 72, borderRadius: 36, borderWidth: 4, borderColor: "#fff", justifyContent: "center", alignItems: "center" },
  captureInner: { width: 56, height: 56, borderRadius: 28, backgroundColor: "#fff" },
  iconButton: { width: 48, height: 48, borderRadius: 24, backgroundColor: "rgba(255,255,255,0.25)", justifyContent: "center", alignItems: "center" },
  error: { color: "#ef4444", backgroundColor: "#fff", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, fontSize: 14, overflow: "hidden" },
  reviewContainer: { flex: 1, backgroundColor: "#1a1a1a", justifyContent: "center", alignItems: "center", gap: 16 },
  reviewImage: { width: "100%", height: "60%" },
  loadingOverlay: { ...StyleSheet.absoluteFill, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", gap: 12 },
  loadingText: { color: "#fff", fontSize: 16, fontWeight: "500" },
  errorBox: { backgroundColor: "#fef2f2", padding: 16, borderRadius: 12, alignItems: "center", gap: 10, marginHorizontal: 32 },
  errorText: { color: "#991b1b", fontSize: 14, textAlign: "center" },
  retryButton: { backgroundColor: "#ef4444", paddingHorizontal: 20, paddingVertical: 8, borderRadius: 8 },
  retryText: { color: "#fff", fontWeight: "600", fontSize: 14 },
});
