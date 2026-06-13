import { View, StyleSheet, Text, TouchableOpacity, ScrollView, Platform } from "react-native";
import { ArrowLeft, Leaf, GraduationCap, Target, Code } from "lucide-react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { useDiagnosticStore } from "../store/useDiagnosticStore";
import { colors, shadows, borderRadius, typography } from "../theme";

export function AboutScreen() {
  const setScreen = useDiagnosticStore((s) => s.setScreen);

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => setScreen("camera")} style={styles.backButton} activeOpacity={0.7}>
          <ArrowLeft size={22} stroke={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInUp.duration(600).springify()} style={styles.heroSection}>
          <View style={styles.iconWrap}>
            <Leaf size={48} stroke={colors.primary} strokeWidth={1.5} />
          </View>
          <Text style={styles.appTitle}>FasalGuard</Text>
          <Text style={styles.version}>Version 1.0.0</Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(600).delay(150)} style={styles.creatorsCard}>
          <View style={styles.creatorHeader}>
            <GraduationCap size={22} stroke={colors.primary} />
            <Text style={styles.sectionTitle}>Created By</Text>
          </View>
          <View style={styles.creatorRow}>
            <View style={styles.creatorDot} />
            <Text style={styles.creatorText}>
              <Text style={styles.creatorName}>Muhammad Ammar Shaikh</Text>
              {" & "}
              <Text style={styles.creatorName}>Azhar</Text>
            </Text>
          </View>
          <Text style={styles.creatorSubtext}>SMIT Students - Batch 2025</Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(600).delay(300)} style={styles.card}>
          <View style={styles.cardHeader}>
            <Target size={22} stroke={colors.primary} />
            <Text style={styles.sectionTitle}>Purpose</Text>
          </View>
          <Text style={styles.cardText}>
            FasalGuard is an AI-powered plant disease detection app built as a final year project. It helps farmers and gardeners identify plant diseases instantly by taking a photo of a leaf.
          </Text>
          <Text style={styles.cardText}>
            Using a YOLOv8 leaf detection model and a Vision Transformer (ViT) classifier trained on 38 plant disease classes, the app provides accurate diagnoses along with treatment recommendations and care guides.
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(600).delay(450)} style={styles.card}>
          <View style={styles.cardHeader}>
            <Code size={22} stroke={colors.primary} />
            <Text style={styles.sectionTitle}>The Problem & Solution</Text>
          </View>
          <Text style={styles.cardText}>
            Plant diseases cause significant crop losses every year. Many farmers lack access to expert plant pathologists for timely diagnosis. FasalGuard bridges this gap by bringing AI-powered disease detection directly to your phone.
          </Text>
          <Text style={styles.cardText}>
            Simply point your camera at a leaf, and the app will identify the disease, suggest treatments, and help you monitor your plant's health over time.
          </Text>
        </Animated.View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 56 : 16,
    paddingBottom: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.bg,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    gap: 20,
  },
  heroSection: {
    alignItems: "center",
    gap: 10,
    paddingVertical: 20,
  },
  iconWrap: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: colors.primaryBg,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: colors.primaryLight,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.primaryDeep,
  },
  version: {
    fontSize: 14,
    color: colors.textTertiary,
    fontWeight: "500",
  },
  creatorsCard: {
    backgroundColor: colors.primaryBg,
    padding: 20,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.primaryLight,
    gap: 12,
  },
  creatorHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  creatorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  creatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  creatorText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: "500",
    flex: 1,
  },
  creatorName: {
    fontWeight: "700",
    color: colors.primaryDark,
  },
  creatorSubtext: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: "500",
    marginLeft: 18,
  },
  card: {
    backgroundColor: colors.surface,
    padding: 20,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    gap: 10,
    ...shadows.sm,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.text,
  },
  cardText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 21,
  },
});
