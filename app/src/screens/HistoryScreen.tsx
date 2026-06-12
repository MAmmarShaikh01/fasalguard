import { View, Text, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { Leaf, ArrowRight, FlaskConical, Sparkles, Trash2 } from "lucide-react-native";
import { useDiagnosticStore } from "../store/useDiagnosticStore";
import type { DiagnosticResult } from "../types";

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export function HistoryScreen() {
  const history = useDiagnosticStore((s) => s.history);
  const restoreResult = useDiagnosticStore((s) => s.restoreResult);
  const clearHistory = useDiagnosticStore((s) => s.clearHistory);

  return (
    <View style={styles.container}>
      <Animated.View entering={FadeInDown.duration(500)} style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerIconWrap}>
            <FlaskConical size={22} stroke="#fff" />
          </View>
          <View style={{ flexShrink: 1 }}>
            <Text style={styles.title}>History</Text>
            <Text style={styles.subtitle}>Previously scanned plants and their diagnosis results</Text>
          </View>
          {history.length > 0 && (
            <TouchableOpacity onPress={clearHistory} style={styles.clearButton}>
              <Trash2 size={18} stroke="#ef4444" />
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
              <Text style={[styles.statNum, { color: "#16a34a" }]}>{history.filter(h => h.disease.toLowerCase().includes("healthy")).length}</Text>
              <Text style={styles.statLabel}>Healthy</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={[styles.statNum, { color: "#dc2626" }]}>{history.filter(h => !h.disease.toLowerCase().includes("healthy")).length}</Text>
              <Text style={styles.statLabel}>Diseased</Text>
            </View>
          </View>
        )}
      </Animated.View>

      {history.length === 0 ? (
        <Animated.View entering={FadeInUp.duration(600).springify()} style={styles.empty}>
          <View style={styles.emptyIconWrap}>
            <Leaf size={48} stroke="#22c55e" strokeWidth={1.5} />
          </View>
          <Text style={styles.emptyTitle}>No scans yet</Text>
          <Text style={styles.emptyText}>
            Scan a leaf to see your plant identification history here.
          </Text>
          <Sparkles size={20} stroke="#d1d5db" />
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
            return (
              <AnimatedTouchable
                entering={FadeInUp.duration(400).delay(index * 60).springify()}
                style={styles.card}
                onPress={() => restoreResult(item)}
                activeOpacity={0.7}
              >
                <View style={styles.cardLeft}>
                  <View style={[styles.cardIcon, isHealthy ? styles.healthyIcon : styles.diseasedIcon]}>
                    <Leaf size={18} stroke={isHealthy ? "#16a34a" : "#dc2626"} />
                  </View>
                </View>
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
                    <Text style={styles.confidence}>{(item.confidence * 100).toFixed(1)}% confidence</Text>
                    <Text style={styles.severity}>Severity: {item.severity_percentage.toFixed(1)}%</Text>
                  </View>
                </View>
                <ArrowRight size={16} stroke="#22c55e" />
              </AnimatedTouchable>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f0fdf4" },
  header: { paddingTop: 50, paddingHorizontal: 16, paddingBottom: 16, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#f0f0f0", gap: 16 },
  headerTop: { flexDirection: "row", alignItems: "center", gap: 14 },
  headerIconWrap: { width: 44, height: 44, borderRadius: 14, backgroundColor: "#22c55e", justifyContent: "center", alignItems: "center",     boxShadow: "0 0 10px rgba(34,197,94,0.3)", elevation: 6 },
  clearButton: { padding: 8, backgroundColor: "#fef2f2", borderRadius: 8 },
  title: { fontSize: 22, fontWeight: "800", color: "#15803d" },
  subtitle: { fontSize: 13, color: "#9ca3af", marginTop: 1 },
  statsRow: { flexDirection: "row", backgroundColor: "#f0fdf4", borderRadius: 12, padding: 12 },
  stat: { flex: 1, alignItems: "center" },
  statNum: { fontSize: 20, fontWeight: "800", color: "#1a1a1a" },
  statLabel: { fontSize: 11, color: "#9ca3af", fontWeight: "500", marginTop: 1 },
  statDivider: { width: 1, backgroundColor: "#d1d5db" },
  empty: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12, padding: 32 },
  emptyIconWrap: { width: 88, height: 88, borderRadius: 44, backgroundColor: "#f0fdf4", justifyContent: "center", alignItems: "center", borderWidth: 2, borderColor: "#bbf7d0" },
  emptyTitle: { fontSize: 20, fontWeight: "700", color: "#374151" },
  emptyText: { fontSize: 14, color: "#9ca3af", textAlign: "center", lineHeight: 20 },
  list: { padding: 16, gap: 10, paddingBottom: 32 },
  card: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", padding: 16, borderRadius: 16, gap: 14,     boxShadow: "0 0 8px rgba(0,0,0,0.04)", elevation: 2, borderWidth: 1, borderColor: "#f0f0f0" },
  cardLeft: {},
  cardIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: "center", alignItems: "center" },
  healthyIcon: { backgroundColor: "#f0fdf4" },
  diseasedIcon: { backgroundColor: "#fef2f2" },
  cardBody: { flex: 1, gap: 3 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  plantName: { fontSize: 16, fontWeight: "700", color: "#1a1a1a", flex: 1 },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 8 },
  healthyBadge: { backgroundColor: "#f0fdf4" },
  diseasedBadge: { backgroundColor: "#fef2f2" },
  badgeText: { fontSize: 11, fontWeight: "600" },
  healthyText: { color: "#16a34a" },
  diseasedText: { color: "#dc2626" },
  diseaseText: { fontSize: 13, color: "#6b7280" },
  cardFooter: { flexDirection: "row", gap: 12, marginTop: 2 },
  confidence: { fontSize: 12, color: "#9ca3af" },
  severity: { fontSize: 12, color: "#9ca3af" },
});
