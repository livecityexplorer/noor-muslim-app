import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface GradientHeaderProps {
  title: string;
  subtitle?: string;
  rightElement?: React.ReactNode;
}

export function GradientHeader({ title, subtitle, rightElement }: GradientHeaderProps) {
  return (
    <LinearGradient
      colors={["#4A1080", "#1E3A8A", "#0A0A1A"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      {/* Subtle geometric overlay */}
      <View style={styles.geometricOverlay} pointerEvents="none">
        <View style={styles.circle1} />
        <View style={styles.circle2} />
      </View>
      <View style={styles.content}>
        <View style={styles.textContainer}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {rightElement ? <View style={styles.rightElement}>{rightElement}</View> : null}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    overflow: "hidden",
  },
  geometricOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  circle1: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1,
    borderColor: "rgba(124, 58, 237, 0.3)",
    top: -40,
    right: 20,
  },
  circle2: {
    position: "absolute",
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: "rgba(79, 195, 247, 0.2)",
    top: 10,
    right: 60,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#F0F0FF",
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 13,
    color: "#8B8BB0",
    marginTop: 2,
  },
  rightElement: {
    marginLeft: 12,
  },
});
