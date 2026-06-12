import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import Animated, { FadeInUp, BounceIn } from "react-native-reanimated";
import { RefreshCw, ArrowRight, AlertTriangle } from "lucide-react-native";

interface Props {
  blurry: boolean;
  dark: boolean;
  likelyLeaf: boolean;
  onRetake?: () => void;
  onProceed?: () => void;
}

export function QualityBadge({ blurry, dark, likelyLeaf, onRetake, onProceed }: Props) {
  if (!blurry && !dark && likelyLeaf) return null;

  const warnings: string[] = [];
  if (!likelyLeaf) warnings.push("Not a leaf");
  if (blurry) warnings.push("Blurry");
  if (dark) warnings.push("Too dark");

  return (
    <Animated.View entering={BounceIn.duration(500).springify()} style={styles.container}>
      <View style={styles.badge}>
        <View style={styles.iconWrap}>
          <AlertTriangle size={18} stroke="#92400e" />
        </View>
        <Text style={styles.text}>{warnings.join(" · ")}</Text>
      </View>
      <View style={styles.actions}>
        {onRetake && (
          <TouchableOpacity style={styles.actionButton} onPress={onRetake} activeOpacity={0.8}>
            <RefreshCw size={14} stroke="#92400e" />
            <Text style={styles.actionText}>Retake</Text>
          </TouchableOpacity>
        )}
        {onProceed && (
          <TouchableOpacity style={[styles.actionButton, styles.proceedButton]} onPress={onProceed} activeOpacity={0.8}>
            <Text style={[styles.actionText, { color: "#166534" }]}>Proceed</Text>
            <ArrowRight size={14} stroke="#166534" />
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: "#fef3c7", padding: 14, borderRadius: 16, width: "90%", alignSelf: "center", gap: 10, borderWidth: 1, borderColor: "#fde68a" },
  badge: { flexDirection: "row", alignItems: "center", gap: 8 },
  iconWrap: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#fde68a", justifyContent: "center", alignItems: "center" },
  text: { color: "#92400e", fontSize: 14, fontWeight: "600", flex: 1 },
  actions: { flexDirection: "row", gap: 8, justifyContent: "center" },
  actionButton: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, backgroundColor: "#fde68a" },
  proceedButton: { backgroundColor: "#bbf7d0" },
  actionText: { fontSize: 13, fontWeight: "600", color: "#92400e" },
});
