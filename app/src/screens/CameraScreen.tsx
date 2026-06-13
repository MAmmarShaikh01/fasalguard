import { useState, useRef, useCallback } from "react";
import { View, StyleSheet, TouchableOpacity, Text, ActivityIndicator, Image, Platform, ScrollView } from "react-native";
import * as ImagePicker from "expo-image-picker";
import Animated, { FadeIn, FadeInUp, FadeInDown, useAnimatedStyle, withSpring, useSharedValue } from "react-native-reanimated";
import { ImagePlus, Leaf, Upload, ScanLine } from "lucide-react-native";
import { useDiagnosticStore } from "../store/useDiagnosticStore";
import { predictLeaf, predictLeafFromFile, checkQualityFromFile } from "../services/api";
import { compressImage } from "../utils/compress";
import { checkImageQuality } from "../utils/imageQuality";
import { QualityBadge } from "../components/QualityBadge";
import { colors, shadows, borderRadius, typography } from "../theme";
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

  const leafScale = useSharedValue(1);
  const leafRotate = useSharedValue(0);
  const [isLeafHovered, setIsLeafHovered] = useState(false);

  const leafAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: leafScale.value }, { rotate: `${leafRotate.value}deg` }],
  }));

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
          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={true} bounces={false}>
            <Animated.View entering={FadeInUp.duration(600).springify()}>
              <View style={styles.heroSection}>
                <Animated.View
                  style={[styles.decorRing, isLeafHovered && styles.decorRingHovered, leafAnimatedStyle]}
                  onMouseEnter={() => { setIsLeafHovered(true); leafScale.value = withSpring(1.08, { damping: 8, stiffness: 100 }); leafRotate.value = withSpring(-5, { damping: 6, stiffness: 80 }); }}
                  onMouseLeave={() => { setIsLeafHovered(false); leafScale.value = withSpring(1, { damping: 10, stiffness: 120 }); leafRotate.value = withSpring(0, { damping: 8, stiffness: 100 }); }}
                >
                  <View style={[styles.decorRingInner, isLeafHovered && styles.decorRingInnerHovered]}>
                    <View style={[styles.webIconWrap, isLeafHovered && styles.webIconWrapHovered]}>
                      <Leaf size={44} stroke={isLeafHovered ? "#fff" : colors.primary} strokeWidth={1.5} />
                    </View>
                  </View>
                </Animated.View>
                <Text style={styles.webTitle}>FasalGuard</Text>
                <Text style={styles.webTagline}>AI-Powered Plant Disease Detector</Text>
              </View>

              <View style={styles.webInfoCards}>
                <View style={styles.infoCard}>
                  <View style={styles.infoIconWrap}>
                    <ScanLine size={18} stroke={colors.primary} />
                  </View>
                  <View style={styles.infoTextWrap}>
                    <Text style={styles.infoTitle}>Instant Diagnosis</Text>
                    <Text style={styles.infoText}>Snap a leaf photo and get AI-powered disease identification in seconds</Text>
                  </View>
                </View>
                <View style={styles.infoCard}>
                  <View style={[styles.infoIconWrap, { backgroundColor: colors.warningBg }]}>
                    <Leaf size={18} stroke={colors.warning} />
                  </View>
                  <View style={styles.infoTextWrap}>
                    <Text style={styles.infoTitle}>Treatment Advice</Text>
                    <Text style={styles.infoText}>Receive tailored treatment recommendations and plant care guides</Text>
                  </View>
                </View>
                <View style={styles.infoCard}>
                  <View style={[styles.infoIconWrap, { backgroundColor: "#f0f0ff" }]}>
                    <Upload size={18} stroke="#6366f1" />
                  </View>
                  <View style={styles.infoTextWrap}>
                    <Text style={styles.infoTitle}>Scan History</Text>
                    <Text style={styles.infoText}>Track your plant's health over time with saved diagnosis history</Text>
                  </View>
                </View>
              </View>

              <View style={styles.ctaSection}>
                <TouchableOpacity style={styles.primaryButton} onPress={pickFromWeb} activeOpacity={0.85}>
                  <Upload size={20} stroke="#fff" />
                  <Text style={styles.buttonText}>Upload a Leaf Photo</Text>
                </TouchableOpacity>
                <Text style={styles.ctaHint}>Supports JPG, PNG, WEBP</Text>
              </View>

              {error && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}
              {isProcessing && (
                <View style={styles.webLoading}>
                  <ActivityIndicator size="large" color={colors.primary} />
                  <Text style={styles.webLoadingText}>Analyzing leaf...</Text>
                </View>
              )}
            </Animated.View>
          </ScrollView>
        )}
        {stage === "review" && previewUri && (
          <Animated.View entering={FadeIn.duration(400)} style={styles.reviewContainer}>
            <Image source={{ uri: previewUri }} style={styles.reviewImage} resizeMode="contain" />
            <QualityBadge blurry={quality.isBlurry} dark={quality.isTooDark} likelyLeaf={quality.likelyLeaf} onRetake={handleRetake} onProceed={handleProceedAnyway} />
            {isProcessing && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color={colors.primary} />
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
              <ActivityIndicator size="large" color={colors.primary} />
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
  scroll: { flex: 1, backgroundColor: colors.bg },
  scrollContent: { paddingVertical: 40, paddingHorizontal: 24, gap: 28 },
  decorRing: { width: 120, height: 120, borderRadius: 60, backgroundColor: colors.primaryBg, justifyContent: "center", alignItems: "center", borderWidth: 2, borderColor: colors.primaryLight, cursor: "pointer", transition: "all 0.2s ease" },
  decorRingHovered: { backgroundColor: colors.primary, borderColor: colors.primaryDeep },
  decorRingInner: { width: 96, height: 96, borderRadius: 48, backgroundColor: colors.surface, justifyContent: "center", alignItems: "center", borderWidth: 2, borderColor: colors.primaryLight, ...shadows.glow(colors.primary), cursor: "pointer", transition: "all 0.2s ease" },
  decorRingInnerHovered: { backgroundColor: colors.primaryDeep, borderColor: colors.primaryDeep },
  heroSection: { alignItems: "center", gap: 10, paddingTop: 20, marginBottom: 16 },
  webIconWrap: { width: 60, height: 60, borderRadius: 30, backgroundColor: colors.primaryBg, justifyContent: "center", alignItems: "center", cursor: "pointer", transition: "all 0.2s ease" },
  webIconWrapHovered: { backgroundColor: colors.primary },
  webTitle: { fontSize: 32, fontWeight: "800", color: colors.primaryDeep, letterSpacing: -0.5 },
  webTagline: { fontSize: 15, color: colors.textSecondary, fontWeight: "500" },
  webInfoCards: { gap: 12, marginBottom: 12 },
  infoIconWrap: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.primaryBg, justifyContent: "center", alignItems: "center" },
  infoTextWrap: { flex: 1, gap: 2 },
  infoTitle: { fontSize: 15, fontWeight: "600", color: colors.text },
  infoCard: { flexDirection: "row", alignItems: "flex-start", gap: 14, backgroundColor: colors.surface, padding: 16, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.cardBorder, ...shadows.sm },
  infoText: { fontSize: 13, color: colors.textSecondary, lineHeight: 18 },
  ctaSection: { gap: 10, paddingTop: 24 },
  ctaHint: { fontSize: 12, color: colors.textTertiary, textAlign: "center", fontWeight: "500" },
  webLoading: { alignItems: "center", gap: 12, paddingTop: 8 },
  webLoadingText: { color: colors.primary, fontSize: 16, fontWeight: "500" },
  primaryButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: colors.primary, paddingVertical: 16, borderRadius: borderRadius.lg, ...shadows.glow(colors.primary) },
  buttonText: { color: "#fff", fontSize: 17, fontWeight: "600" },
  overlay: { flex: 1, justifyContent: "flex-end", alignItems: "center", paddingBottom: 50, gap: 20 },
  hint: { color: "#fff", fontSize: 14, fontWeight: "500", textShadow: "0 0 4px rgba(0,0,0,0.5)" },
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
  errorBox: { backgroundColor: colors.errorBg, padding: 16, borderRadius: borderRadius.md, alignItems: "center", gap: 10, marginHorizontal: 32 },
  errorText: { color: colors.errorText, fontSize: 14, textAlign: "center" },
  retryButton: { backgroundColor: colors.error, paddingHorizontal: 20, paddingVertical: 8, borderRadius: borderRadius.sm },
  retryText: { color: "#fff", fontWeight: "600", fontSize: 14 },
});
