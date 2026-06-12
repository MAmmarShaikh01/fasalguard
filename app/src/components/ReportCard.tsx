import { View, Text, StyleSheet, Image } from "react-native";
import Markdown from "react-native-markdown-display";
import Animated, { FadeInUp, FadeIn } from "react-native-reanimated";
import { Droplets, Sun, FlaskConical, Sprout, AlertTriangle } from "lucide-react-native";
import type { DiagnosticResult } from "../types";
import { SeverityGauge } from "./SeverityGauge";

interface Props {
  result: DiagnosticResult;
  imageUri?: string;
}

const markdownStyles = {
  body: { color: "#374151", fontSize: 15, lineHeight: 22 },
  heading1: { fontSize: 20, fontWeight: "700" as const, color: "#1a1a1a", marginBottom: 8 },
  heading2: { fontSize: 17, fontWeight: "600" as const, color: "#1a1a1a", marginBottom: 6 },
  strong: { fontWeight: "700" as const },
  link: { color: "#22c55e" },
  blockquote: { borderLeftColor: "#22c55e", borderLeftWidth: 3, paddingLeft: 12, color: "#6b7280", fontStyle: "italic" as const },
};

export function ReportCard({ result, imageUri }: Props) {
  const top3 = result.top_predictions ?? [];
  const plantName = result.plant_name || result.disease.split("___")[0].replace(/_/g, " ");
  const isHealthy = result.disease.toLowerCase().includes("healthy");

  return (
    <Animated.View entering={FadeInUp.duration(500).springify()} style={styles.card}>
      {imageUri && (
        <Animated.View entering={FadeIn.duration(600)}>
          <Image source={{ uri: imageUri }} style={styles.image} />
        </Animated.View>
      )}

      <View style={styles.plantRow}>
        <View style={styles.plantInfo}>
          <View style={[styles.statusDot, { backgroundColor: isHealthy ? "#16a34a" : "#dc2626" }]} />
          <Text style={styles.plantName}>{plantName}</Text>
        </View>
        <View style={[styles.statusBadge, isHealthy ? styles.healthyBadge : styles.diseasedBadge]}>
          <Text style={[styles.statusText, isHealthy ? styles.healthyText : styles.diseasedText]}>
            {isHealthy ? "Healthy" : "Diseased"}
          </Text>
        </View>
      </View>

      <Text style={styles.disease}>
        {result.disease.replace(/_/g, " ").replace("___", " — ")}
      </Text>

      <View style={styles.confidenceRow}>
        <FlaskConical size={15} stroke="#9ca3af" />
        <Text style={styles.confidence}>Confidence: {(result.confidence * 100).toFixed(1)}%</Text>
      </View>

      {(result.confidence < 0.5 && (!result.top_predictions || result.top_predictions.length < 2 || result.confidence - result.top_predictions[1].score <= 0.08)) && (
        <View style={styles.lowConfBanner}>
          <AlertTriangle size={16} stroke="#92400e" />
          <Text style={styles.lowConfText}>Low confidence — the image may not contain a clear leaf. Consider retaking.</Text>
        </View>
      )}

      {result.warnings && result.warnings.length > 0 && (
        <View style={styles.lowConfBanner}>
          <AlertTriangle size={16} stroke="#92400e" />
          <View style={{ flex: 1 }}>
            {result.warnings.map((w, i) => (
              <Text key={i} style={styles.lowConfText}>{w}</Text>
            ))}
          </View>
        </View>
      )}

      <SeverityGauge percentage={result.severity_percentage} />

      {result.watering && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Sprout size={18} stroke="#22c55e" />
            <Text style={styles.sectionTitle}>Plant Care Guide</Text>
          </View>
          <View style={styles.careRow}>
            <Droplets size={16} stroke="#3b82f6" />
            <Text style={styles.careLabel}>Water: <Text style={styles.careValue}>{result.watering.frequency}</Text></Text>
          </View>
          <Text style={styles.careDetail}>{result.watering.tips}</Text>
          <View style={styles.careRow}>
            <Sun size={16} stroke="#f59e0b" />
            <Text style={styles.careLabel}>Sunlight: <Text style={styles.careValue}>{result.watering.sunlight}</Text></Text>
          </View>
        </View>
      )}

      {result.treatment && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <FlaskConical size={18} stroke="#22c55e" />
            <Text style={styles.sectionTitle}>Treatment</Text>
          </View>
          <Markdown style={markdownStyles}>{result.treatment}</Markdown>
        </View>
      )}

      {top3.length > 1 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Sprout size={18} stroke="#9ca3af" />
            <Text style={[styles.sectionTitle, { color: "#9ca3af" }]}>Top Predictions</Text>
          </View>
          {top3.map((p, i) => (
            <View key={i} style={[styles.top3Row, i === 0 && styles.top3RowFirst]}>
              <View style={[styles.rankBadge, i === 0 && { backgroundColor: "#22c55e" }]}>
                <Text style={[styles.rankText, i === 0 && { color: "#fff" }]}>#{i + 1}</Text>
              </View>
              <Text style={styles.top3Label} numberOfLines={1}>
                {p.label.replace(/_/g, " ").replace("___", " — ")}
              </Text>
              <View style={[styles.scoreBadge, i === 0 && { backgroundColor: "#f0fdf4" }]}>
                <Text style={styles.top3Score}>{(p.score * 100).toFixed(1)}%</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  lowConfBanner: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#fffbeb", borderWidth: 1, borderColor: "#fde68a", borderRadius: 10, padding: 12 },
  lowConfText: { flex: 1, fontSize: 13, color: "#92400e", lineHeight: 18 },
  card: { backgroundColor: "#fff", borderRadius: 20, padding: 20, margin: 16,     boxShadow: "0 0 16px rgba(0,0,0,0.06)", elevation: 4, gap: 14 },
  image: { width: "100%", height: 240, borderRadius: 16 },
  plantRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  plantInfo: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  plantName: { fontSize: 22, fontWeight: "800", color: "#1a1a1a", flex: 1 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 10 },
  healthyBadge: { backgroundColor: "#f0fdf4" },
  diseasedBadge: { backgroundColor: "#fef2f2" },
  statusText: { fontSize: 13, fontWeight: "700" },
  healthyText: { color: "#16a34a" },
  diseasedText: { color: "#dc2626" },
  disease: { fontSize: 14, color: "#6b7280", lineHeight: 20 },
  confidenceRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  confidence: { fontSize: 13, color: "#9ca3af", fontWeight: "500" },
  section: { borderTopWidth: 1, borderTopColor: "#f0f0f0", paddingTop: 14, marginTop: 2, gap: 8 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 2 },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#1a1a1a" },
  careRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  careLabel: { fontSize: 14, color: "#374151" },
  careValue: { fontWeight: "600" },
  careDetail: { fontSize: 13, color: "#6b7280", lineHeight: 18, paddingLeft: 22 },
  top3Row: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8, paddingHorizontal: 10, borderRadius: 10 },
  top3RowFirst: { backgroundColor: "#f0fdf4" },
  rankBadge: { width: 28, height: 28, borderRadius: 14, backgroundColor: "#f3f4f6", justifyContent: "center", alignItems: "center" },
  rankText: { fontSize: 12, fontWeight: "700", color: "#6b7280" },
  top3Label: { flex: 1, fontSize: 14, color: "#374151" },
  scoreBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, backgroundColor: "#f3f4f6" },
  top3Score: { fontSize: 13, fontWeight: "600", color: "#374151" },
});
