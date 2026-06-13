import { useEffect } from "react";
import { View, StyleSheet, Text, ActivityIndicator } from "react-native";
import Animated, { FadeInUp, FadeIn } from "react-native-reanimated";
import { Leaf } from "lucide-react-native";
import { useDiagnosticStore } from "../store/useDiagnosticStore";
import { colors, typography } from "../theme";

export function LoadingScreen() {
  const setScreen = useDiagnosticStore((s) => s.setScreen);

  useEffect(() => {
    const timer = setTimeout(() => {
      setScreen("camera");
    }, 2500);
    return () => clearTimeout(timer);
  }, [setScreen]);

  return (
    <View style={styles.root}>
      <Animated.View entering={FadeInUp.duration(800).springify()} style={styles.content}>
        <View style={styles.iconWrap}>
          <Leaf size={56} stroke="#22c55e" strokeWidth={1.5} />
        </View>
        <Text style={styles.title}>FasalGuard</Text>
        <Text style={styles.tagline}>Apni Fasal Ki Hifazat Karein</Text>
      </Animated.View>
      <Animated.View entering={FadeIn.duration(1000).delay(800)} style={styles.loaderWrap}>
        <ActivityIndicator size="large" color="#22c55e" />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#064e3b",
    justifyContent: "center",
    alignItems: "center",
    gap: 48,
  },
  content: {
    alignItems: "center",
    gap: 12,
  },
  iconWrap: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255,255,255,0.12)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.2)",
  },
  title: {
    fontSize: 36,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 15,
    color: "rgba(255,255,255,0.7)",
    fontWeight: "500",
  },
  loaderWrap: {
    position: "absolute",
    bottom: 80,
  },
});
