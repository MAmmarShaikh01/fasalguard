import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, View, TouchableOpacity, Text, Platform } from "react-native";
import { Camera, MessageCircle, Clock } from "lucide-react-native";
import { CameraScreen } from "./src/screens/CameraScreen";
import { ResultScreen } from "./src/screens/ResultScreen";
import { ChatScreen } from "./src/screens/ChatScreen";
import { HistoryScreen } from "./src/screens/HistoryScreen";
import { useDiagnosticStore } from "./src/store/useDiagnosticStore";
import type { Screen } from "./src/types";

const tabs: { key: Screen; label: string; icon: typeof Camera }[] = [
  { key: "camera", label: "Scan", icon: Camera },
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
          {tabs.map((tab, idx) => {
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
                  <Icon size={20} stroke={active ? "#fff" : "#9ca3af"} strokeWidth={active ? 2.5 : 1.8} />
                </View>
                <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
                  {tab.label}
                </Text>
                {active && <View style={styles.tabIndicator} />}
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { flex: 1 },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    paddingBottom: Platform.OS === "ios" ? 28 : 20,
    paddingTop: 8,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -4 },
    elevation: 12,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    position: "relative",
    paddingTop: 4,
  },
  tabIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
  },
  tabIconWrapActive: {
    backgroundColor: "#22c55e",
    shadowColor: "#22c55e",
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  tabLabel: { fontSize: 11, color: "#9ca3af", fontWeight: "500" },
  tabLabelActive: { color: "#16a34a", fontWeight: "700" },
  tabIndicator: {
    position: "absolute",
    top: -1,
    width: 24,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "#22c55e",
  },
});
