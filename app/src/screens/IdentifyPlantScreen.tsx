import { useState, useCallback } from "react";
import { View, StyleSheet, TouchableOpacity, Text, ActivityIndicator, Image, Platform, ScrollView } from "react-native";
import * as ImagePicker from "expo-image-picker";
import Animated, { FadeIn, FadeInDown, FadeInUp, BounceIn } from "react-native-reanimated";
import { Upload, Search, RotateCcw, ScanLine, Flower2, ImagePlus } from "lucide-react-native";
import { identifyPlant, identifyPlantFromFile } from "../services/api";
import { compressImage } from "../utils/compress";
import type { PlantIdentification } from "../types";

const isWeb = Platform.OS === "web";

export function IdentifyPlantScreen() {
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [result, setResult] = useState<PlantIdentification | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function processAndIdentify(uri: string) {
    try {
      setLoading(true);
      setError(null);
      setResult(null);
      const compressed = await compressImage(uri);
      setPreviewUri(compressed);
      const data = await identifyPlant(compressed);
      setResult(data);
    } catch (e: any) {
      setError(e.message || "Identification failed");
    } finally {
      setLoading(false);
    }
  }

  async function pickFromGallery() {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.7 });
    if (!res.canceled && res.assets[0]) {
      await processAndIdentify(res.assets[0].uri);
    }
  }

  async function pickFromWeb() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setPreviewUri(URL.createObjectURL(file));
      try {
        setLoading(true);
        setError(null);
        setResult(null);
        const data = await identifyPlantFromFile(file);
        setResult(data);
      } catch (e: any) {
        setError(e.message || "Identification failed");
      } finally {
        setLoading(false);
      }
    };
    input.click();
  }

  const handleReset = useCallback(() => {
    setPreviewUri(null);
    setResult(null);
    setError(null);
  }, []);

  if (!previewUri) {
    return (
      <View style={styles.container}>
        <Animated.View entering={FadeInDown.duration(600).springify()} style={styles.hero}>
          <View style={styles.heroIconWrap}>
            <Flower2 size={40} stroke="#fff" strokeWidth={1.5} />
          </View>
          <Text style={styles.heroTitle}>Plant Identifier</Text>
          <Text style={styles.heroSubtitle}>Snap a photo to discover any plant species</Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(700).springify().delay(200)} style={styles.uploadArea}>
          {isWeb ? (
            <TouchableOpacity style={styles.uploadButton} onPress={pickFromWeb} activeOpacity={0.85}>
              <Upload size={32} stroke="#22c55e" strokeWidth={1.5} />
              <Text style={styles.uploadTitle}>Upload Image</Text>
              <Text style={styles.uploadHint}>JPG, PNG up to 10MB</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.uploadButton} onPress={pickFromGallery} activeOpacity={0.85}>
              <ImagePlus size={32} stroke="#22c55e" strokeWidth={1.5} />
              <Text style={styles.uploadTitle}>Choose from Gallery</Text>
              <Text style={styles.uploadHint}>Pick a photo of any plant</Text>
            </TouchableOpacity>
          )}
        </Animated.View>

        <Animated.View entering={FadeIn.duration(800).delay(400)} style={styles.tipsContainer}>
          <View style={styles.tipRow}>
            <View style={styles.tipDot} />
            <Text style={styles.tipText}>Take a clear, well-lit photo</Text>
          </View>
          <View style={styles.tipRow}>
            <View style={styles.tipDot} />
            <Text style={styles.tipText}>Focus on leaves or flowers</Text>
          </View>
          <View style={styles.tipRow}>
            <View style={styles.tipDot} />
            <Text style={styles.tipText}>Avoid blurry or dark images</Text>
          </View>
        </Animated.View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Animated.View entering={FadeIn.duration(400)}>
        <Image source={{ uri: previewUri }} style={styles.preview} resizeMode="cover" />
      </Animated.View>

      {loading && (
        <Animated.View entering={FadeIn} style={styles.loadingCard}>
          <ActivityIndicator size="large" color="#22c55e" />
          <Text style={styles.loadingText}>Identifying plant...</Text>
        </Animated.View>
      )}

      {error && (
        <Animated.View entering={BounceIn} style={styles.errorCard}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={handleReset}>
            <RotateCcw size={16} stroke="#fff" />
            <Text style={styles.retryBtnText}>Try Again</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {result && !loading && (
        <Animated.View entering={FadeInUp.duration(500).springify()} style={styles.resultCard}>
          {result.warning ? (
            <View style={styles.warningContent}>
              <View style={styles.warningIconWrap}>
                <Search size={22} stroke="#92400e" />
              </View>
              <Text style={styles.warningTitle}>Not a Plant</Text>
              <Text style={styles.warningText}>{result.warning}</Text>
              {result.green_ratio != null && (
                <Text style={styles.greenRatio}>Green score: {(result.green_ratio * 100).toFixed(0)}%</Text>
              )}
            </View>
          ) : (
            <>
              <View style={styles.resultBadge}>
                <Search size={18} stroke="#22c55e" />
                <Text style={styles.resultBadgeText}>Identified</Text>
              </View>

              <Text style={styles.plantName}>{result.plant_name}</Text>

              <View style={styles.confidenceRow}>
                <View style={styles.confidenceBar}>
                  <View style={[styles.confidenceFill, { width: `${Math.min(result.confidence * 100, 100)}%` }]} />
                </View>
                <Text style={styles.confidenceText}>{(result.confidence * 100).toFixed(1)}%</Text>
              </View>

              {result.top_predictions && result.top_predictions.length > 1 && (
                <View style={styles.topPredictions}>
                  <Text style={styles.topPredTitle}>Other possibilities</Text>
                  {result.top_predictions.slice(1, 4).map((p, i: number) => (
                    <View key={i} style={styles.predRow}>
                      <Text style={styles.predRank}>#{i + 2}</Text>
                      <Text style={styles.predLabel} numberOfLines={1}>{p.label}</Text>
                      <Text style={styles.predScore}>{(p.score * 100).toFixed(1)}%</Text>
                    </View>
                  ))}
                </View>
              )}
            </>
          )}
        </Animated.View>
      )}

      {!loading && (
        <TouchableOpacity style={styles.newScanBtn} onPress={handleReset} activeOpacity={0.85}>
          <ScanLine size={20} stroke="#fff" />
          <Text style={styles.newScanText}>Identify Another</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f0fdf4" },
  scrollContent: { paddingBottom: 40 },
  hero: { alignItems: "center", paddingTop: 60, paddingBottom: 24, paddingHorizontal: 32 },
  heroIconWrap: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: "#22c55e",
    justifyContent: "center", alignItems: "center", marginBottom: 16,
    boxShadow: "0 0 20px rgba(34,197,94,0.35)", elevation: 10,
  },
  heroTitle: { fontSize: 28, fontWeight: "800", color: "#15803d", marginBottom: 6 },
  heroSubtitle: { fontSize: 15, color: "#6b7280", textAlign: "center", lineHeight: 22 },
  uploadArea: { paddingHorizontal: 32, marginBottom: 24 },
  uploadButton: {
    backgroundColor: "#fff", borderRadius: 20, borderWidth: 2, borderColor: "#bbf7d0",
    borderStyle: "dashed", padding: 36, alignItems: "center", gap: 10,
    boxShadow: "0 0 10px rgba(0,0,0,0.05)", elevation: 2,
  },
  uploadTitle: { fontSize: 18, fontWeight: "700", color: "#1a1a1a" },
  uploadHint: { fontSize: 13, color: "#9ca3af" },
  tipsContainer: { paddingHorizontal: 48, gap: 10 },
  tipRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  tipDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#86efac" },
  tipText: { fontSize: 14, color: "#6b7280" },
  preview: { width: "100%", height: 300 },
  loadingCard: {
    backgroundColor: "#fff", margin: 16, padding: 24, borderRadius: 16,
    alignItems: "center", gap: 12,     boxShadow: "0 0 12px rgba(0,0,0,0.08)", elevation: 4,
  },
  loadingText: { fontSize: 16, fontWeight: "600", color: "#374151" },
  errorCard: { backgroundColor: "#fef2f2", margin: 16, padding: 20, borderRadius: 16, alignItems: "center", gap: 12 },
  errorText: { color: "#991b1b", fontSize: 14, textAlign: "center" },
  retryBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#ef4444", paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  retryBtnText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  resultCard: { backgroundColor: "#fff", margin: 16, padding: 24, borderRadius: 20, gap: 16, boxShadow: "0 0 20px rgba(34,197,94,0.1)", elevation: 6 },
  resultBadge: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", backgroundColor: "#f0fdf4", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  resultBadgeText: { fontSize: 13, fontWeight: "600", color: "#16a34a" },
  plantName: { fontSize: 26, fontWeight: "800", color: "#1a1a1a" },
  confidenceRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  confidenceBar: { flex: 1, height: 10, backgroundColor: "#e5e7eb", borderRadius: 5, overflow: "hidden" },
  confidenceFill: { height: "100%", backgroundColor: "#22c55e", borderRadius: 5 },
  confidenceText: { fontSize: 15, fontWeight: "700", color: "#16a34a", minWidth: 52, textAlign: "right" },
  topPredictions: { borderTopWidth: 1, borderTopColor: "#e5e7eb", paddingTop: 12, gap: 8 },
  topPredTitle: { fontSize: 12, fontWeight: "600", color: "#9ca3af", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 },
  predRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 6, paddingHorizontal: 8, borderRadius: 8, backgroundColor: "#f9fafb" },
  predRank: { fontSize: 13, fontWeight: "700", color: "#9ca3af", width: 24 },
  predLabel: { flex: 1, fontSize: 14, color: "#374151" },
  predScore: { fontSize: 14, fontWeight: "600", color: "#374151" },
  newScanBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#22c55e", marginHorizontal: 16, paddingVertical: 16, borderRadius: 16 },
  newScanText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  warningContent: { alignItems: "center", gap: 12, paddingVertical: 8 },
  warningIconWrap: { width: 48, height: 48, borderRadius: 24, backgroundColor: "#fef3c7", justifyContent: "center", alignItems: "center" },
  warningTitle: { fontSize: 20, fontWeight: "800", color: "#92400e" },
  warningText: { fontSize: 14, color: "#6b7280", textAlign: "center", lineHeight: 20 },
  greenRatio: { fontSize: 12, color: "#9ca3af", fontWeight: "500" },
});
