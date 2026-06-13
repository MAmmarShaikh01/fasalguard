import { View, Text, StyleSheet, Image } from "react-native";
import Markdown from "react-native-markdown-display";
import Animated, { FadeInUp, FadeIn } from "react-native-reanimated";
import { Droplets, Sun, FlaskConical, Sprout, AlertTriangle, ShieldCheck, Bug } from "lucide-react-native";
import type { DiagnosticResult } from "../types";
import { SeverityGauge } from "./SeverityGauge";
import { colors, shadows, borderRadius, typography } from "../theme";

interface Props {
  result: DiagnosticResult;
  imageUri?: string;
}

const markdownStyles = {
  body: { color: colors.textSecondary, fontSize: 15, lineHeight: 22 },
  heading1: { fontSize: 20, fontWeight: "700" as const, color: colors.text, marginBottom: 8 },
  heading2: { fontSize: 17, fontWeight: "600" as const, color: colors.text, marginBottom: 6 },
  strong: { fontWeight: "700" as const },
  link: { color: colors.primary },
  blockquote: { borderLeftColor: colors.primary, borderLeftWidth: 3, paddingLeft: 12, color: colors.textTertiary, fontStyle: "italic" as const },
  code_inline: { backgroundColor: colors.bg, color: colors.text, paddingHorizontal: 4, borderRadius: 4 },
  fence: { backgroundColor: colors.bg, padding: 12, borderRadius: borderRadius.sm },
};

export function ReportCard({ result, imageUri }: Props) {
  const top3 = result.top_predictions ?? [];
  const plantName = result.plant_name || result.disease.split("___")[0].replace(/_/g, " ");
  const isHealthy = result.disease.toLowerCase().includes("healthy");
  const topConfidence = top3[0]?.score ?? result.confidence;

  return (
    <Animated.View entering={FadeInUp.duration(500).springify()} style={styles.card}>
      {imageUri && (
        <Animated.View entering={FadeIn.duration(600)} style={styles.imageWrapper}>
          <Image source={{ uri: imageUri }} style={styles.image} />
          <View style={styles.imageOverlay}>
            <View style={[styles.imageStatusBadge, isHealthy ? styles.healthyBadge : styles.diseasedBadge]}>
              {isHealthy ? (
                <ShieldCheck size={14} stroke={colors.successText} />
              ) : (
                <Bug size={14} stroke={colors.errorText} />
              )}
              <Text style={[styles.imageStatusText, isHealthy ? styles.healthyText : styles.diseasedText]}>
                {isHealthy ? "Healthy" : "Diseased"}
              </Text>
            </View>
          </View>
        </Animated.View>
      )}

      <View style={styles.plantSection}>
        <View style={styles.plantRow}>
          <View style={styles.plantInfo}>
            <View style={[styles.statusDot, { backgroundColor: isHealthy ? colors.success : colors.error }]} />
            <Text style={styles.plantName}>{plantName}</Text>
          </View>
        </View>
        <Text style={styles.disease}>
          {result.disease.replace(/_/g, " ").replace("___", " — ")}
        </Text>
      </View>

      <View style={styles.metricsRow}>
        <View style={styles.metric}>
          <FlaskConical size={14} stroke={colors.textTertiary} />
          <Text style={styles.metricLabel}>Confidence</Text>
          <Text style={styles.metricValue}>{(topConfidence * 100).toFixed(1)}%</Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metric}>
          <Bug size={14} stroke={colors.textTertiary} />
          <Text style={styles.metricLabel}>Severity</Text>
          <Text style={styles.metricValue}>{result.severity_percentage.toFixed(1)}%</Text>
        </View>
      </View>

      <SeverityGauge percentage={result.severity_percentage} />

      {(result.confidence < 0.5 && (!result.top_predictions || result.top_predictions.length < 2 || result.confidence - result.top_predictions[1].score <= 0.08)) && (
        <View style={styles.warningBanner}>
          <AlertTriangle size={16} stroke={colors.warningText} />
          <Text style={styles.warningText}>We couldn't get a confident read on this — try a clearer photo of the leaf</Text>
        </View>
      )}

      {result.warnings && result.warnings.length > 0 && (
        <View style={styles.warningBanner}>
          <AlertTriangle size={16} stroke={colors.warningText} />
          <View style={{ flex: 1 }}>
            {result.warnings.map((w, i) => (
              <Text key={i} style={styles.warningText}>{w}</Text>
            ))}
          </View>
        </View>
      )}

      {result.watering && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Sprout size={18} stroke={colors.primary} />
            <Text style={styles.sectionTitle}>Plant Care Guide</Text>
          </View>
          <View style={styles.careGrid}>
            <View style={styles.careCard}>
              <Droplets size={16} stroke="#3b82f6" />
              <Text style={styles.careLabel}>Water</Text>
              <Text style={styles.careValue}>{result.watering.frequency}</Text>
            </View>
            <View style={styles.careCard}>
              <Sun size={16} stroke="#f59e0b" />
              <Text style={styles.careLabel}>Sunlight</Text>
              <Text style={styles.careValue}>{result.watering.sunlight}</Text>
            </View>
          </View>
          <Text style={styles.careDetail}>{result.watering.tips}</Text>
        </View>
      )}

      {result.treatment && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <FlaskConical size={18} stroke={colors.primary} />
            <Text style={styles.sectionTitle}>Treatment</Text>
          </View>
          <Markdown style={markdownStyles}>{result.treatment}</Markdown>
        </View>
      )}

      {top3.length > 1 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Sprout size={18} stroke={colors.textTertiary} />
            <Text style={[styles.sectionTitle, { color: colors.textTertiary }]}>Top Predictions</Text>
          </View>
          {top3.map((p, i) => {
            const isFirst = i === 0;
            return (
              <View key={i} style={[styles.top3Row, isFirst && styles.top3RowFirst]}>
                <View style={[styles.rankBadge, isFirst && { backgroundColor: colors.primary }]}>
                  <Text style={[styles.rankText, isFirst && { color: "#fff" }]}>#{i + 1}</Text>
                </View>
                <Text style={styles.top3Label} numberOfLines={1}>
                  {p.label.replace(/_/g, " ").replace("___", " — ")}
                </Text>
                <View style={[styles.scoreBadge, isFirst && { backgroundColor: colors.primaryBg }]}>
                  <Text style={[styles.top3Score, isFirst && { color: colors.primaryDeep, fontWeight: "700" }]}>
                    {(p.score * 100).toFixed(1)}%
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  warningBanner: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: colors.warningBg, borderWidth: 1, borderColor: "#fde68a", borderRadius: borderRadius.md, padding: 12 },
  warningText: { flex: 1, fontSize: 13, color: colors.warningText, lineHeight: 18 },
  card: { backgroundColor: colors.surface, borderRadius: borderRadius.xl, padding: 0, margin: 16, ...shadows.md, overflow: "hidden" },
  imageWrapper: { position: "relative" },
  image: { width: "100%", height: 220 },
  imageOverlay: { position: "absolute", top: 12, right: 12 },
  imageStatusBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: borderRadius.full },
  healthyBadge: { backgroundColor: colors.successBg },
  diseasedBadge: { backgroundColor: colors.errorBg },
  imageStatusText: { fontSize: 12, fontWeight: "700" },
  healthyText: { color: colors.successText },
  diseasedText: { color: colors.errorText },
  plantSection: { paddingHorizontal: 20, paddingTop: 18, gap: 4 },
  plantRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  plantInfo: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  plantName: { fontSize: 22, fontWeight: "800", color: colors.text, flex: 1 },
  disease: { fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
  metricsRow: { flexDirection: "row", marginHorizontal: 20, marginTop: 12, backgroundColor: colors.bg, borderRadius: borderRadius.md, padding: 12 },
  metric: { flex: 1, alignItems: "center", gap: 4 },
  metricDivider: { width: 1, backgroundColor: colors.cardBorder },
  metricLabel: { fontSize: 11, color: colors.textTertiary, fontWeight: "500" },
  metricValue: { fontSize: 15, fontWeight: "700", color: colors.text },
  section: { paddingHorizontal: 20, paddingBottom: 4, gap: 10, borderTopWidth: 1, borderTopColor: "#f1f5f9", paddingTop: 16, marginTop: 4 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  sectionTitle: { ...typography.h3 },
  careGrid: { flexDirection: "row", gap: 10 },
  careCard: { flex: 1, backgroundColor: colors.bg, padding: 14, borderRadius: borderRadius.md, gap: 6, alignItems: "center" },
  careLabel: { fontSize: 12, color: colors.textTertiary, fontWeight: "500" },
  careValue: { fontSize: 14, fontWeight: "600", color: colors.text, textAlign: "center" },
  careDetail: { fontSize: 13, color: colors.textSecondary, lineHeight: 18 },
  top3Row: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 8, paddingHorizontal: 10, borderRadius: borderRadius.md },
  top3RowFirst: { backgroundColor: colors.primaryBg },
  rankBadge: { width: 28, height: 28, borderRadius: 14, backgroundColor: "#f1f5f9", justifyContent: "center", alignItems: "center" },
  rankText: { fontSize: 12, fontWeight: "700", color: colors.textTertiary },
  top3Label: { flex: 1, fontSize: 14, color: colors.textSecondary },
  scoreBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, backgroundColor: "#f1f5f9" },
  top3Score: { fontSize: 13, fontWeight: "600", color: colors.textSecondary },
});
