import { View, Text, StyleSheet } from "react-native";
import { useEffect } from "react";
import Animated, { useAnimatedStyle, withSpring, useSharedValue } from "react-native-reanimated";
import { AlertTriangle, ShieldCheck, AlertCircle } from "lucide-react-native";
import { colors, borderRadius } from "../theme";

interface Props {
  percentage: number;
}

const severityConfig = [
  { max: 0, color: colors.severity.healthy, label: "Healthy", icon: ShieldCheck },
  { max: 30, color: colors.severity.mild, label: "Mild", icon: AlertCircle },
  { max: 60, color: colors.severity.moderate, label: "Moderate", icon: AlertTriangle },
  { max: 100, color: colors.severity.severe, label: "Severe", icon: AlertTriangle },
];

export function SeverityGauge({ percentage }: Props) {
  const clamped = Math.max(0, Math.min(100, percentage));
  const config = severityConfig.find((c) => clamped <= c.max) ?? severityConfig[severityConfig.length - 1];
  const animatedWidth = useSharedValue(0);
  const Icon = config.icon;

  useEffect(() => {
    animatedWidth.value = withSpring(Math.max(clamped, 6), { damping: 15, stiffness: 60 });
  }, [clamped]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${animatedWidth.value}%`,
  }));

  return (
    <View style={[styles.container, { backgroundColor: config.bg }]}>
      <View style={styles.header}>
        <View style={styles.labelRow}>
          <Icon size={16} stroke={config.color} />
          <Text style={[styles.label, { color: config.color }]}>{config.label}</Text>
        </View>
        <Text style={[styles.percent, { color: config.color }]}>{clamped.toFixed(1)}%</Text>
      </View>
      <View style={styles.track}>
        <Animated.View style={[styles.bar, { backgroundColor: config.color }, barStyle]} />
      </View>
      {clamped > 0 && (
        <Text style={styles.hint}>
          {clamped <= 30 ? "Low severity — monitor regularly." : clamped <= 60 ? "Moderate severity — take action soon." : "High severity — treat immediately."}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { borderRadius: borderRadius.md, padding: 14, gap: 10, marginHorizontal: 20 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  labelRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  label: { fontSize: 15, fontWeight: "700" },
  percent: { fontSize: 15, fontWeight: "700" },
  track: { height: 10, backgroundColor: "#e2e8f0", borderRadius: 5, overflow: "hidden" },
  bar: { height: "100%", borderRadius: 5 },
  hint: { fontSize: 12, color: colors.textTertiary, lineHeight: 16 },
});
