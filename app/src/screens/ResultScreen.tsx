import { View, StyleSheet, TouchableOpacity, Text, ScrollView, Share } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { ArrowLeft, RefreshCw, Share2, Leaf } from "lucide-react-native";
import { useDiagnosticStore } from "../store/useDiagnosticStore";
import { ReportCard } from "../components/ReportCard";
import { colors, shadows, borderRadius } from "../theme";

export function ResultScreen() {
  const insets = useSafeAreaInsets();
  const result = useDiagnosticStore((s) => s.currentResult);
  const imageUri = useDiagnosticStore((s) => s.capturedImageUri);
  const setScreen = useDiagnosticStore((s) => s.setScreen);
  const reset = useDiagnosticStore((s) => s.reset);

  if (!result) return null;
  const r = result;

  async function handleShare() {
    await Share.share({
      message: `FasalGuard Diagnosis: ${r.disease.replace(/_/g, " ").replace("___", " — ")}\nConfidence: ${(r.confidence * 100).toFixed(1)}%\nSeverity: ${r.severity_percentage.toFixed(1)}%`,
    });
  }

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeInDown.duration(500)} style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <TouchableOpacity onPress={() => { reset(); setScreen("camera"); }} style={styles.headerBtn}>
          <ArrowLeft size={22} stroke={colors.primaryDeep} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Leaf size={18} stroke={colors.primary} />
          <Text style={styles.title}>Diagnosis</Text>
        </View>
        <TouchableOpacity onPress={handleShare} style={styles.headerBtn}>
          <Share2 size={20} stroke={colors.primaryDeep} />
        </TouchableOpacity>
      </Animated.View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <ReportCard result={result} imageUri={imageUri ?? undefined} />
      </ScrollView>

      <Animated.View entering={FadeInUp.duration(500)} style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 8) + 8 }]}>
        <TouchableOpacity
          style={styles.newScanButton}
          onPress={() => { reset(); setScreen("camera"); }}
          activeOpacity={0.85}
        >
          <RefreshCw size={18} stroke="#fff" />
          <Text style={styles.scanButtonText}>New Scan</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 16, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  headerBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.bg, justifyContent: "center", alignItems: "center" },
  headerCenter: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { fontSize: 18, fontWeight: "700", color: colors.primaryDeep },
  bottomBar: { backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: "#f1f5f9", paddingTop: 8 },
  newScanButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: colors.primary, margin: 16, paddingVertical: 16, borderRadius: borderRadius.lg, ...shadows.glow(colors.primary) },
  scanButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
