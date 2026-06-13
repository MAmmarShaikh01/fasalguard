import { View, Text, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { Leaf, ArrowRight, FlaskConical, Sparkles, Trash2, ScanLine } from "lucide-react-native";
import { useDiagnosticStore } from "../store/useDiagnosticStore";
import { colors, shadows, borderRadius, typography } from "../theme";
import type { DiagnosticResult } from "../types";

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

function getSeverityColor(pct: number): string {
  if (pct <= 0) return colors.severity.healthy;
  if (pct <= 30) return colors.severity.mild;
  if (pct <= 60) return colors.severity.moderate;
  return colors.severity.severe;
}

export function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const history = useDiagnosticStore((s) => s.history);
  const restoreResult = useDiagnosticStore((s) => s.restoreResult);
  const clearHistory = useDiagnosticStore((s) => s.clearHistory);

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeInDown.duration(500)} style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerTop}>
          <View style={styles.headerIconWrap}>
            <ScanLine size={22} stroke="#fff" />
          </View>
          <View style={{ flexShrink: 1 }}>
            <Text style={styles.title}>History</Text>
            <Text style={styles.subtitle}>Previously scanned plants and their diagnosis results</Text>
          </View>
          {history.length > 0 && (
            <TouchableOpacity onPress={clearHistory} style={styles.clearButton}>
              <Trash2 size={18} stroke={colors.error} />
            </TouchableOpacity>
          )}
        </View>
        {history.length > 0 && (
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statNum}>{history.length}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={[styles.statNum, { color: colors.successText }]}>{history.filter(h => h.disease.toLowerCase().includes("healthy")).length}</Text>
              <Text style={styles.statLabel}>Healthy</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={[styles.statNum, { color: colors.errorText }]}>{history.filter(h => !h.disease.toLowerCase().includes("healthy")).length}</Text>
              <Text style={styles.statLabel}>Diseased</Text>
            </View>
          </View>
        )}
      </Animated.View>

      {history.length === 0 ? (
        <Animated.View entering={FadeInUp.duration(600).springify()} style={styles.empty}>
          <View style={styles.emptyIconWrap}>
            <Leaf size={48} stroke={colors.primary} strokeWidth={1.5} />
          </View>
          <Text style={styles.emptyTitle}>No scans yet</Text>
          <Text style={styles.emptyText}>
            Scan a leaf to see your plant identification history here.
          </Text>
        </Animated.View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(_, i) => i.toString()}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }: { item: DiagnosticResult; index: number }) => {
            const plant = item.plant_name || item.disease.split("___")[0].replace(/_/g, " ");
            const isHealthy = item.disease.toLowerCase().includes("healthy");
            const sevColor = getSeverityColor(item.severity_percentage);
            return (
              <AnimatedTouchable
                entering={FadeInUp.duration(400).delay(index * 60).springify()}
                style={styles.card}
                onPress={() => restoreResult(item)}
                activeOpacity={0.7}
              >
                <View style={[styles.cardAccent, { backgroundColor: sevColor }]} />
                <View style={styles.cardBody}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.plantName}>{plant}</Text>
                    <View style={[styles.badge, isHealthy ? styles.healthyBadge : styles.diseasedBadge]}>
                      <Text style={[styles.badgeText, isHealthy ? styles.healthyText : styles.diseasedText]}>
                        {isHealthy ? "Healthy" : "Diseased"}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.diseaseText} numberOfLines={1}>
                    {item.disease.replace(/_/g, " ").replace("___", " — ")}
                  </Text>
                  <View style={styles.cardFooter}>
                    <View style={styles.footerItem}>
                      <FlaskConical size={12} stroke={colors.textTertiary} />
                      <Text style={styles.footerLabel}>{(item.confidence * 100).toFixed(1)}%</Text>
                    </View>
                    <View style={styles.footerItem}>
                      <View style={[styles.severityDot, { backgroundColor: sevColor }]} />
                      <Text style={styles.footerLabel}>{item.severity_percentage.toFixed(1)}% severity</Text>
                    </View>
                  </View>
                </View>
                <ArrowRight size={16} stroke={colors.primary} />
              </AnimatedTouchable>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: 16, paddingBottom: 16, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: "#f1f5f9", gap: 16 },
  headerTop: { flexDirection: "row", alignItems: "center", gap: 14 },
  headerIconWrap: { width: 44, height: 44, borderRadius: borderRadius.md, backgroundColor: colors.primary, justifyContent: "center", alignItems: "center", ...shadows.glow(colors.primary) },
  clearButton: { padding: 8, backgroundColor: colors.errorBg, borderRadius: borderRadius.sm },
  title: { fontSize: 22, fontWeight: "800", color: colors.primaryDeep },
  subtitle: { fontSize: 13, color: colors.textTertiary, marginTop: 1 },
  statsRow: { flexDirection: "row", backgroundColor: colors.bg, borderRadius: borderRadius.md, padding: 12 },
  stat: { flex: 1, alignItems: "center" },
  statNum: { fontSize: 20, fontWeight: "800", color: colors.text },
  statLabel: { fontSize: 11, color: colors.textTertiary, fontWeight: "500", marginTop: 1 },
  statDivider: { width: 1, backgroundColor: "#e2e8f0" },
  empty: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12, padding: 32 },
  emptyIconWrap: { width: 88, height: 88, borderRadius: 44, backgroundColor: colors.surface, justifyContent: "center", alignItems: "center", borderWidth: 2, borderColor: colors.primaryLight, ...shadows.md },
  emptyTitle: { fontSize: 20, fontWeight: "700", color: colors.textSecondary },
  emptyText: { fontSize: 14, color: colors.textTertiary, textAlign: "center", lineHeight: 20 },
  list: { padding: 16, gap: 10, paddingBottom: 32 },
  card: { flexDirection: "row", alignItems: "center", backgroundColor: colors.surface, borderRadius: borderRadius.lg, overflow: "hidden", ...shadows.sm, borderWidth: 1, borderColor: "#f1f5f9" },
  cardAccent: { width: 4, alignSelf: "stretch" },
  cardBody: { flex: 1, gap: 3, padding: 14, paddingLeft: 12 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  plantName: { fontSize: 16, fontWeight: "700", color: colors.text, flex: 1 },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: borderRadius.full },
  healthyBadge: { backgroundColor: colors.successBg },
  diseasedBadge: { backgroundColor: colors.errorBg },
  badgeText: { fontSize: 11, fontWeight: "600" },
  healthyText: { color: colors.successText },
  diseasedText: { color: colors.errorText },
  diseaseText: { fontSize: 13, color: colors.textSecondary },
  cardFooter: { flexDirection: "row", gap: 16, marginTop: 4 },
  footerItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  footerLabel: { fontSize: 12, color: colors.textTertiary },
  severityDot: { width: 8, height: 8, borderRadius: 4 },
});
