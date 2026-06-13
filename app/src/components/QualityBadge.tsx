import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import Animated, { FadeInUp, BounceIn } from "react-native-reanimated";
import { RefreshCw, ArrowRight, AlertTriangle, ImageOff } from "lucide-react-native";
import { colors, shadows, borderRadius } from "../theme";

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
  if (!likelyLeaf) warnings.push("Image may not be a leaf");
  if (blurry) warnings.push("Blurry");
  if (dark) warnings.push("Too dark");

  return (
    <Animated.View entering={BounceIn.duration(500).springify()} style={styles.container}>
      <View style={styles.badge}>
        <View style={styles.iconWrap}>
          {!likelyLeaf ? (
            <ImageOff size={18} stroke={colors.warningText} />
          ) : (
            <AlertTriangle size={18} stroke={colors.warningText} />
          )}
        </View>
        <View style={styles.textWrap}>
          <Text style={styles.title}>Photo Quality Issue</Text>
          <Text style={styles.text}>{warnings.join(" · ")}</Text>
        </View>
      </View>
      <View style={styles.actions}>
        {onRetake && (
          <TouchableOpacity style={styles.actionButton} onPress={onRetake} activeOpacity={0.8}>
            <RefreshCw size={14} stroke={colors.warningText} />
            <Text style={styles.actionText}>Retake</Text>
          </TouchableOpacity>
        )}
        {onProceed && (
          <TouchableOpacity style={[styles.actionButton, styles.proceedButton]} onPress={onProceed} activeOpacity={0.8}>
            <Text style={[styles.actionText, { color: colors.primaryDeep }]}>Analyze Anyway</Text>
            <ArrowRight size={14} stroke={colors.primaryDeep} />
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: colors.warningBg, padding: 14, borderRadius: borderRadius.lg, width: "90%", alignSelf: "center", gap: 10, borderWidth: 1, borderColor: "#fde68a", ...shadows.sm },
  badge: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  iconWrap: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#fde68a", justifyContent: "center", alignItems: "center" },
  textWrap: { flex: 1, gap: 2 },
  title: { fontSize: 13, fontWeight: "700", color: colors.warningText },
  text: { color: colors.warningText, fontSize: 13, fontWeight: "500", opacity: 0.8 },
  actions: { flexDirection: "row", gap: 8, justifyContent: "center" },
  actionButton: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 16, paddingVertical: 8, borderRadius: borderRadius.sm, backgroundColor: "#fde68a" },
  proceedButton: { backgroundColor: "#bbf7d0" },
  actionText: { fontSize: 13, fontWeight: "600", color: colors.warningText },
});
