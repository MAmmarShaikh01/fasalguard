import { useState, useRef, useCallback } from "react";
import { View, StyleSheet, TouchableOpacity, Text, ActivityIndicator, Image, Platform, ScrollView, Modal, Linking } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { CameraView, useCameraPermissions } from "expo-camera";
import Animated, { FadeIn, FadeInUp, FadeInDown, useAnimatedStyle, withSpring, useSharedValue } from "react-native-reanimated";
import { ImagePlus, Leaf, Upload, ScanLine, Info, Camera, Clock } from "lucide-react-native";
import { useDiagnosticStore } from "../store/useDiagnosticStore";
import { predictLeaf, predictLeafFromFile, checkQualityFromFile } from "../services/api";
import { compressImage } from "../utils/compress";
import { checkImageQuality } from "../utils/imageQuality";
import { QualityBadge } from "../components/QualityBadge";
import { colors, shadows, borderRadius, typography } from "../theme";
import type { DiagnosticResult } from "../types";

const isWeb = Platform.OS === "web";

type Stage = "home" | "camera" | "review";

function extractPlantName(label: string): string {
  return label.split("___")[0].replace(/_/g, " ").replace(/\(/g, "").replace(/\)/g, "").trim().toLowerCase();
}

function validatePredictions(
  result: DiagnosticResult,
  topK: number = 3
): string | null {
  if (result.confidence >= 0.55) return null;
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

  const goToAbout = useCallback(() => setScreen("about"), [setScreen]);
  const goToHistory = useCallback(() => setScreen("history"), [setScreen]);

  const leafScale = useSharedValue(1);
  const [isLeafHovered, setIsLeafHovered] = useState(false);

  const leafAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: leafScale.value }],
  }));

  const [permission, requestPermission] = useCameraPermissions();
  const [stage, setStage] = useState<Stage>("home");
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [quality, setQuality] = useState({ isBlurry: false, isTooDark: false, likelyLeaf: true, passed: true });
  const [cameraReady, setCameraReady] = useState(false);
  const [showPermDialog, setShowPermDialog] = useState(false);

  async function openCamera() {
    if (!permission) return;
    if (permission.granted) {
      setCameraReady(false);
      setStage("camera");
    } else if (permission.canAskAgain) {
      setShowPermDialog(true);
    } else {
      setError("Camera permission is permanently denied. Please enable it in your device settings.");
    }
  }

  async function handlePermAllow() {
    setShowPermDialog(false);
    const result = await requestPermission();
    if (result.granted) {
      setCameraReady(false);
      setStage("camera");
    } else {
      setError("Camera access was denied. You can enable it later in your device settings.");
    }
  }

  function handlePermDeny() {
    setShowPermDialog(false);
    setError("Camera access was denied. You can enable it later in your device settings.");
  }

  function openSettings() {
    Linking.openSettings();
  }

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
    if (!cameraRef.current || !cameraReady) return;
    const photo = await cameraRef.current.takePictureAsync({ quality: 0.8 });
    if (photo?.uri) { setPreviewUri(photo.uri); setStage("review"); await processAndPredict(photo.uri); }
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
    setStage("home"); setPreviewUri(null);
    setQuality({ isBlurry: false, isTooDark: false, likelyLeaf: true, passed: true }); setError(null);
  }, []);

  const handleProceedAnyway = useCallback(async () => {
    if (!previewUri) return; await processAndPredict(previewUri, true);
  }, [previewUri]);

  const handleBackToHome = useCallback(() => {
    setStage("home"); setPreviewUri(null); setError(null);
  }, []);

  if (isWeb) {
    return (
      <View style={styles.container}>
        <TouchableOpacity onPress={goToAbout} style={styles.aboutButton} activeOpacity={0.7}>
          <Info size={18} stroke={colors.textTertiary} />
        </TouchableOpacity>
        {stage === "home" && (
          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={true} bounces={false}>
            <Animated.View entering={FadeInUp.duration(600).springify()}>
              <View style={styles.heroSection}>
                <Animated.View
                  style={[styles.decorRing, isLeafHovered && styles.decorRingHovered, leafAnimatedStyle]}
                  onMouseEnter={() => { setIsLeafHovered(true); leafScale.value = withSpring(1.08, { damping: 8, stiffness: 100 }); }}
                  onMouseLeave={() => { setIsLeafHovered(false); leafScale.value = withSpring(1, { damping: 10, stiffness: 120 }); }}
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
      {stage === "home" && (
        <Animated.View entering={FadeInUp.duration(600).springify()} style={styles.homeRoot}>
          <View style={styles.homeHeader}>
            <TouchableOpacity onPress={goToAbout} style={styles.headerIconBtn} activeOpacity={0.7}>
              <Info size={20} stroke={colors.textTertiary} />
            </TouchableOpacity>
            <Text style={styles.homeTitle}>FasalGuard</Text>
            <TouchableOpacity onPress={goToHistory} style={styles.headerIconBtn} activeOpacity={0.7}>
              <Clock size={20} stroke={colors.textTertiary} />
            </TouchableOpacity>
          </View>

          <View style={styles.heroArea}>
            <View style={styles.heroIconWrap}>
              <Leaf size={52} stroke={colors.primary} strokeWidth={1.5} />
            </View>
            <Text style={styles.heroHeading}>Leaf Disease Scanner</Text>
            <Text style={styles.heroSub}>Take or upload a photo to detect disease</Text>
          </View>

          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.cameraBtn} onPress={openCamera} activeOpacity={0.85}>
              <View style={styles.actionIconWrap}>
                <Camera size={28} stroke="#fff" strokeWidth={2} />
              </View>
              <Text style={styles.actionBtnLabel}>Take Photo</Text>
              <Text style={styles.actionBtnHint}>Use Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.galleryBtn} onPress={pickFromGallery} activeOpacity={0.85}>
              <View style={[styles.actionIconWrap, { backgroundColor: colors.primaryBg }]}>
                <ImagePlus size={28} stroke={colors.primary} strokeWidth={2} />
              </View>
              <Text style={[styles.actionBtnLabel, { color: colors.text }]}>Upload Image</Text>
              <Text style={styles.actionBtnHint}>From Gallery</Text>
            </TouchableOpacity>
          </View>

          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}
          {isProcessing && (
            <View style={styles.homeLoading}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.webLoadingText}>Analyzing leaf...</Text>
            </View>
          )}
        </Animated.View>
      )}

      {stage === "camera" && (
        <View style={styles.cameraWrapper}>
          <CameraView ref={cameraRef} style={styles.cameraView} facing="back" onCameraReady={() => setCameraReady(true)} onMountError={() => setError("Camera failed to start. Please try again.")}>
            <View style={styles.cameraOverlay}>
              <TouchableOpacity onPress={handleBackToHome} style={styles.cameraBackBtn} activeOpacity={0.7}>
                <Text style={styles.cameraBackText}>Back</Text>
              </TouchableOpacity>
              <View style={styles.frame} />
              {error && <Text style={styles.error}>{error}</Text>}
              {!cameraReady && !error && (
                <View style={styles.cameraLoadingWrap}>
                  <ActivityIndicator size="large" color="#fff" />
                  <Text style={styles.cameraLoadingText}>Starting camera...</Text>
                </View>
              )}
              <View style={styles.controls}>
                <TouchableOpacity onPress={pickFromGallery} style={styles.iconButton} activeOpacity={0.7}>
                  <ImagePlus size={24} stroke="#fff" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.captureButton, (!cameraReady || isProcessing) && { opacity: 0.4 }]}
                  onPress={takePicture} disabled={!cameraReady || isProcessing}
                >
                  {isProcessing ? <ActivityIndicator color="#fff" /> : <View style={styles.captureInner} />}
                </TouchableOpacity>
                <View style={{ width: 48 }} />
              </View>
            </View>
          </CameraView>
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

      <Modal visible={showPermDialog} transparent animationType="fade" onRequestClose={handlePermDeny}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconWrap}>
              <Camera size={32} stroke={colors.primary} />
            </View>
            <Text style={styles.modalTitle}>Camera Access Required</Text>
            <Text style={styles.modalText}>
              FasalGuard needs camera access to scan your plant leaves and detect diseases. Your photos are processed securely and not stored.
            </Text>
            <TouchableOpacity style={styles.modalAllowBtn} onPress={handlePermAllow} activeOpacity={0.85}>
              <Text style={styles.modalAllowText}>Allow Camera Access</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalDenyBtn} onPress={handlePermDeny} activeOpacity={0.7}>
              <Text style={styles.modalDenyText}>Maybe Later</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
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
  aboutButton: { position: "absolute", top: 50, right: 20, width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surface, justifyContent: "center", alignItems: "center", zIndex: 10, ...shadows.sm },

  homeRoot: { flex: 1, paddingTop: Platform.OS === "ios" ? 56 : 16, paddingHorizontal: 24 },
  homeHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 32 },
  headerIconBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surface, justifyContent: "center", alignItems: "center", ...shadows.sm },
  homeTitle: { fontSize: 20, fontWeight: "800", color: colors.primaryDeep, letterSpacing: -0.3 },
  heroArea: { alignItems: "center", gap: 10, marginBottom: 40, paddingTop: 20 },
  heroIconWrap: { width: 90, height: 90, borderRadius: 45, backgroundColor: colors.primaryBg, justifyContent: "center", alignItems: "center", borderWidth: 3, borderColor: colors.primaryLight, marginBottom: 8 },
  heroHeading: { fontSize: 24, fontWeight: "800", color: colors.text, letterSpacing: -0.3 },
  heroSub: { fontSize: 14, color: colors.textSecondary, fontWeight: "500" },
  actionRow: { flexDirection: "row", gap: 14, marginBottom: 24 },
  cameraBtn: { flex: 1, backgroundColor: colors.primary, borderRadius: borderRadius.lg, padding: 20, alignItems: "center", gap: 8, ...shadows.glow(colors.primary) },
  galleryBtn: { flex: 1, backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: 20, alignItems: "center", gap: 8, borderWidth: 1.5, borderColor: colors.primaryLight, ...shadows.sm },
  actionIconWrap: { width: 52, height: 52, borderRadius: 26, backgroundColor: "rgba(255,255,255,0.2)", justifyContent: "center", alignItems: "center" },
  actionBtnLabel: { fontSize: 15, fontWeight: "700", color: "#fff" },
  actionBtnHint: { fontSize: 11, color: colors.textTertiary, fontWeight: "500" },
  homeLoading: { alignItems: "center", gap: 12, paddingVertical: 20 },

  cameraWrapper: { flex: 1, backgroundColor: "#000" },
  cameraView: { flex: 1 },
  cameraOverlay: { flex: 1, justifyContent: "flex-end", alignItems: "center", paddingBottom: 50, gap: 20 },
  cameraBackBtn: { position: "absolute", top: 50, left: 20, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: "rgba(255,255,255,0.2)", borderRadius: 20 },
  cameraBackText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  cameraLoadingWrap: { position: "absolute", top: "40%", alignItems: "center", gap: 12 },
  cameraLoadingText: { color: "#fff", fontSize: 15, fontWeight: "500" },
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
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "center", alignItems: "center", padding: 32 },
  modalContent: { width: "100%", maxWidth: 340, backgroundColor: colors.surface, borderRadius: borderRadius.xl, padding: 28, alignItems: "center", gap: 14, ...shadows.lg },
  modalIconWrap: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primaryBg, justifyContent: "center", alignItems: "center", marginBottom: 4 },
  modalTitle: { fontSize: 19, fontWeight: "700", color: colors.text, textAlign: "center" },
  modalText: { fontSize: 14, color: colors.textSecondary, textAlign: "center", lineHeight: 20 },
  modalAllowBtn: { width: "100%", backgroundColor: colors.primary, paddingVertical: 14, borderRadius: borderRadius.md, alignItems: "center", marginTop: 8 },
  modalAllowText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  modalDenyBtn: { paddingVertical: 10, alignItems: "center" },
  modalDenyText: { color: colors.textTertiary, fontSize: 14, fontWeight: "500" },
});
