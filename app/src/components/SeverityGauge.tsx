import { View, Text, StyleSheet } from "react-native";
import { useEffect } from "react";
import Animated, { useAnimatedStyle, withSpring, useSharedValue } from "react-native-reanimated";

interface Props {
  percentage: number;
}

const severityConfig = [
  { max: 0, color: "#22c55e", label: "Healthy", bg: "#f0fdf4" },
  { max: 30, color: "#eab308", label: "Mild", bg: "#fefce8" },
  { max: 60, color: "#f97316", label: "Moderate", bg: "#fff7ed" },
  { max: 100, color: "#ef4444", label: "Severe", bg: "#fef2f2" },
];

export function SeverityGauge({ percentage }: Props) {
  const clamped = Math.max(0, Math.min(100, percentage));
  const config = severityConfig.find((c) => clamped <= c.max) ?? severityConfig[severityConfig.length - 1];
  const animatedWidth = useSharedValue(0);

  useEffect(() => {
    animatedWidth.value = withSpring(Math.max(clamped, 6), { damping: 15, stiffness: 60 });
  }, [clamped]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${animatedWidth.value}%`,
  }));

  return (
    <View style={[styles.container, { backgroundColor: config.bg }]}>
      <View style={styles.header}>
        <Text style={[styles.label, { color: config.color }]}>{config.label}</Text>
        <Text style={[styles.percent, { color: config.color }]}>{clamped.toFixed(1)}%</Text>
      </View>
      <View style={styles.track}>
        <Animated.View style={[styles.bar, { backgroundColor: config.color }, barStyle]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { borderRadius: 12, padding: 14, gap: 8 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  label: { fontSize: 15, fontWeight: "700" },
  percent: { fontSize: 15, fontWeight: "700" },
  track: { height: 10, backgroundColor: "#e5e7eb", borderRadius: 5, overflow: "hidden" },
  bar: { height: "100%", borderRadius: 5 },
});
