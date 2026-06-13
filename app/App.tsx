import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, View, TouchableOpacity, Text, Platform } from "react-native";
import { Scan, MessageCircle, Clock } from "lucide-react-native";
import { CameraScreen } from "./src/screens/CameraScreen";
import { ResultScreen } from "./src/screens/ResultScreen";
import { ChatScreen } from "./src/screens/ChatScreen";
import { HistoryScreen } from "./src/screens/HistoryScreen";
import { useDiagnosticStore } from "./src/store/useDiagnosticStore";
import type { Screen } from "./src/types";
import { colors, shadows, borderRadius } from "./src/theme";

const tabs: { key: Screen; label: string; icon: typeof Scan }[] = [
  { key: "camera", label: "Scan", icon: Scan },
  { key: "history", label: "History", icon: Clock },
  { key: "chat", label: "Chat", icon: MessageCircle },
];

export default function App() {
  const screen = useDiagnosticStore((s) => s.currentScreen);
  const setScreen = useDiagnosticStore((s) => s.setScreen);
  const showTabs = screen !== "result";

  return (
    <GestureHandlerRootView style={styles.root}>
      <StatusBar style="dark" />
      <View style={styles.content}>
        {screen === "camera" && <CameraScreen />}
        {screen === "result" && <ResultScreen />}
        {screen === "history" && <HistoryScreen />}
        {screen === "chat" && <ChatScreen />}
      </View>
      {showTabs && (
        <View style={styles.tabBar}>
          <View style={styles.tabBarInner}>
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = screen === tab.key;
              return (
                <TouchableOpacity
                  key={tab.key}
                  style={styles.tab}
                  onPress={() => setScreen(tab.key)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.tabIconWrap, active && styles.tabIconWrapActive]}>
                    <Icon size={20} stroke={active ? colors.primary : colors.textTertiary} strokeWidth={active ? 2.5 : 1.8} />
                  </View>
                  <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { flex: 1 },
  tabBar: {
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === "ios" ? 28 : 16,
    paddingTop: 8,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    ...shadows.lg,
  },
  tabBarInner: {
    flexDirection: "row",
    backgroundColor: colors.bg,
    borderRadius: borderRadius.lg,
    padding: 4,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    paddingVertical: 8,
    borderRadius: borderRadius.md,
  },
  tabIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: "center",
    alignItems: "center",
  },
  tabIconWrapActive: {
    backgroundColor: colors.surface,
    ...shadows.sm,
  },
  tabLabel: { fontSize: 11, color: colors.textTertiary, fontWeight: "500" },
  tabLabelActive: { color: colors.primaryDark, fontWeight: "700" },
});
