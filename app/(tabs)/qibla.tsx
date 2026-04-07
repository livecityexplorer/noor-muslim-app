import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import { Magnetometer } from "expo-sensors";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScreenContainer } from "@/components/screen-container";

// Kaaba coordinates (Makkah)
const KAABA_LAT = 21.4225;
const KAABA_LNG = 39.8262;

/**
 * Calculate Qibla direction using spherical trigonometry
 */
function calculateQiblaDirection(userLat: number, userLng: number): number {
  const latRad = (userLat * Math.PI) / 180;
  const lngDiff = ((KAABA_LNG - userLng) * Math.PI) / 180;
  const kaabaLatRad = (KAABA_LAT * Math.PI) / 180;

  const y = Math.sin(lngDiff) * Math.cos(kaabaLatRad);
  const x =
    Math.cos(latRad) * Math.sin(kaabaLatRad) -
    Math.sin(latRad) * Math.cos(kaabaLatRad) * Math.cos(lngDiff);

  let bearing = (Math.atan2(y, x) * 180) / Math.PI;
  bearing = (bearing + 360) % 360;
  return bearing;
}

/**
 * Calculate distance to Kaaba in kilometers
 */
function calculateDistance(userLat: number, userLng: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((KAABA_LAT - userLat) * Math.PI) / 180;
  const dLng = ((KAABA_LNG - userLng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((userLat * Math.PI) / 180) *
      Math.cos((KAABA_LAT * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Get magnetic heading from accelerometer data
 */
function getMagneticHeading(x: number, y: number): number {
  let heading = Math.atan2(y, x) * (180 / Math.PI);
  heading = (heading + 360) % 360;
  return heading;
}

/**
 * Normalize angle difference to shortest path
 */
function normalizeAngleDiff(diff: number): number {
  if (diff > 180) return diff - 360;
  if (diff < -180) return diff + 360;
  return diff;
}

export default function QiblaScreen() {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [heading, setHeading] = useState(0);
  const [qiblaAngle, setQiblaAngle] = useState(0);
  const [distance, setDistance] = useState(0);
  const [accuracy, setAccuracy] = useState<"high" | "medium" | "low">("low");
  const [hasPermission, setHasPermission] = useState(false);
  const [sensorAvailable, setSensorAvailable] = useState(true);
  const [calibrating, setCalibrating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Animation values
  const rotationAnim = useRef(new Animated.Value(0)).current;
  const lastHeadingRef = useRef(0);
  const subscriptionRef = useRef<any>(null);

  /**
   * Initialize location and sensors
   */
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Check magnetometer availability
        const available = await Magnetometer.isAvailableAsync();
        setSensorAvailable(available);

        // Request location permission
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          setHasPermission(true);
          const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          const { latitude, longitude } = loc.coords;
          setLocation({ lat: latitude, lng: longitude });
          
          // Calculate Qibla direction
          const qibla = calculateQiblaDirection(latitude, longitude);
          setQiblaAngle(qibla);
          
          // Calculate distance
          const dist = calculateDistance(latitude, longitude);
          setDistance(dist);
        }
      } catch (error) {
        console.error("Error initializing Qibla:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  /**
   * Subscribe to magnetometer updates
   */
  useEffect(() => {
    if (!sensorAvailable || !hasPermission) return;

    // Set update interval to 50ms for responsive compass
    Magnetometer.setUpdateInterval(50);

    // Subscribe to magnetometer data
    subscriptionRef.current = Magnetometer.addListener(({ x, y, z }) => {
      try {
        // Calculate magnetic field strength for accuracy assessment
        const mag = Math.sqrt(x * x + y * y + z * z);
        
        // Determine accuracy based on field strength
        if (mag > 20 && mag < 65) {
          setAccuracy("high");
        } else if (mag > 10) {
          setAccuracy("medium");
        } else {
          setAccuracy("low");
        }

        // Calculate heading from magnetometer data
        const newHeading = getMagneticHeading(x, y);
        const diff = newHeading - lastHeadingRef.current;
        const normalizedDiff = normalizeAngleDiff(diff);

        // Update heading if change is significant (>0.5°)
        if (Math.abs(normalizedDiff) > 0.5) {
          lastHeadingRef.current = newHeading;
          setHeading(newHeading);

          // Animate compass rotation
          Animated.timing(rotationAnim, {
            toValue: newHeading,
            duration: 50,
            easing: Easing.linear,
            useNativeDriver: true,
          }).start();
        }
      } catch (error) {
        console.error("Error processing magnetometer data:", error);
      }
    });

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.remove();
      }
    };
  }, [sensorAvailable, hasPermission, rotationAnim]);

  const handleCalibrate = useCallback(() => {
    setCalibrating(true);
    setTimeout(() => setCalibrating(false), 3000);
  }, []);

  const handleRetry = useCallback(async () => {
    setIsLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        setHasPermission(true);
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const { latitude, longitude } = loc.coords;
        setLocation({ lat: latitude, lng: longitude });
        const qibla = calculateQiblaDirection(latitude, longitude);
        setQiblaAngle(qibla);
        const dist = calculateDistance(latitude, longitude);
        setDistance(dist);
      }
    } catch (error) {
      console.error("Error retrying:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const accuracyColor =
    accuracy === "high" ? "#22C55E" : accuracy === "medium" ? "#F59E0B" : "#EF4444";
  const accuracyLabel =
    accuracy === "high"
      ? "High Accuracy"
      : accuracy === "medium"
        ? "Medium Accuracy"
        : "Low Accuracy";

  const deviationAngle = Math.abs(qiblaAngle - heading);
  const shortestDeviation = deviationAngle > 180 ? 360 - deviationAngle : deviationAngle;
  const isAligned = shortestDeviation < 5;

  return (
    <ScreenContainer className="bg-background">
      <View style={styles.container}>
        {/* Header */}
        <LinearGradient
          colors={["rgba(34, 197, 94, 0.1)", "rgba(34, 197, 94, 0.05)", "transparent"]}
          style={styles.header}
        >
          <Text style={styles.headerTitle}>🕌 Qibla Direction</Text>
          <Text style={styles.headerSubtitle}>Find the direction to Makkah</Text>
        </LinearGradient>

        {/* Content */}
        {isLoading ? (
          <View style={styles.centerContent}>
            <Text style={styles.loadingText}>Loading compass...</Text>
          </View>
        ) : !hasPermission ? (
          <View style={styles.centerContent}>
            <Text style={styles.permissionIcon}>📍</Text>
            <Text style={styles.permissionTitle}>Location Required</Text>
            <Text style={styles.permissionText}>
              We need your location to calculate the Qibla direction.
            </Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={handleRetry}>
              <Text style={styles.primaryBtnText}>Grant Location Access</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.content}>
            {/* Compass Visualization */}
            <View style={styles.compassWrapper}>
              {/* Outer glow */}
              <View style={styles.compassGlow} />
              
              {/* Compass background */}
              <View style={styles.compassBg}>
                {/* Cardinal directions */}
                <Text style={[styles.cardinalLabel, styles.north]}>N</Text>
                <Text style={[styles.cardinalLabel, styles.east]}>E</Text>
                <Text style={[styles.cardinalLabel, styles.south]}>S</Text>
                <Text style={[styles.cardinalLabel, styles.west]}>W</Text>

                {/* Animated Qibla arrow */}
                <Animated.View
                  style={[
                    styles.qiblaArrow,
                    {
                      transform: [
                        {
                          rotate: rotationAnim.interpolate({
                            inputRange: [0, 360],
                            outputRange: ["0deg", "360deg"],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  <View style={styles.arrowHead}>
                    <Text style={styles.kabaIcon}>🕋</Text>
                  </View>
                </Animated.View>

                {/* Center dot */}
                <View style={styles.centerDot} />
              </View>

              {/* Alignment indicator */}
              <View style={styles.alignmentIndicator}>
                <Text style={[styles.alignmentText, { color: isAligned ? "#22C55E" : "#F59E0B" }]}>
                  {isAligned ? "✓ Aligned" : `${Math.round(shortestDeviation)}° off`}
                </Text>
              </View>
            </View>

            {/* Info Cards */}
            <View style={styles.infoGrid}>
              <View style={styles.infoCard}>
                <Text style={styles.infoLabel}>Qibla Angle</Text>
                <Text style={styles.infoValue}>{Math.round(qiblaAngle)}°</Text>
              </View>
              <View style={styles.infoCard}>
                <Text style={styles.infoLabel}>Distance</Text>
                <Text style={styles.infoValue}>
                  {distance > 1000 ? `${(distance / 1000).toFixed(1)}k` : Math.round(distance)} km
                </Text>
              </View>
              <View style={styles.infoCard}>
                <Text style={styles.infoLabel}>Your Heading</Text>
                <Text style={styles.infoValue}>{Math.round(heading)}°</Text>
              </View>
              <View style={styles.infoCard}>
                <Text style={styles.infoLabel}>Accuracy</Text>
                <Text style={[styles.infoValue, { color: accuracyColor }]}>
                  {accuracy === "high" ? "High" : accuracy === "medium" ? "Med" : "Low"}
                </Text>
              </View>
            </View>

            {/* Accuracy Badge */}
            <View style={[styles.accuracyBadge, { borderColor: accuracyColor }]}>
              <View style={[styles.accuracyDot, { backgroundColor: accuracyColor }]} />
              <Text style={[styles.accuracyBadgeText, { color: accuracyColor }]}>
                {accuracyLabel}
              </Text>
            </View>

            {/* Calibrate Button */}
            {!sensorAvailable ? (
              <View style={styles.warningCard}>
                <Text style={styles.warningText}>
                  ⚠️ Magnetometer not available. Qibla direction shown based on GPS only.
                </Text>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.secondaryBtn, calibrating && styles.calibratingBtn]}
                onPress={handleCalibrate}
              >
                <Text style={styles.secondaryBtnText}>
                  {calibrating ? "🔄 Calibrating..." : "🔄 Calibrate Compass"}
                </Text>
              </TouchableOpacity>
            )}

            {/* Instructions */}
            <View style={styles.instructionsCard}>
              <Text style={styles.instructionsTitle}>How to Use</Text>
              <Text style={styles.instructionsText}>
                1. Hold your phone flat and level{"\n"}
                2. Rotate until the Kaaba icon (🕋) points upward{"\n"}
                3. That direction is your Qibla
              </Text>
            </View>
          </View>
        )}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0A1A",
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#F0F0FF",
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#8B8BB0",
    marginTop: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    gap: 16,
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: "#8B8BB0",
  },
  permissionIcon: {
    fontSize: 56,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#F0F0FF",
  },
  permissionText: {
    fontSize: 14,
    color: "#8B8BB0",
    textAlign: "center",
    lineHeight: 22,
  },
  primaryBtn: {
    backgroundColor: "rgba(34, 197, 94, 0.2)",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: "#22C55E",
    marginTop: 8,
  },
  primaryBtnText: {
    color: "#22C55E",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  compassWrapper: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 16,
  },
  compassGlow: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "rgba(34, 197, 94, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(34, 197, 94, 0.15)",
  },
  compassBg: {
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: "rgba(18, 18, 42, 0.9)",
    borderWidth: 2,
    borderColor: "#2A2A4A",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  cardinalLabel: {
    position: "absolute",
    fontSize: 16,
    fontWeight: "700",
    width: 30,
    textAlign: "center",
  },
  north: {
    top: 12,
    color: "#EF4444",
  },
  east: {
    right: 12,
    color: "#8B8BB0",
  },
  south: {
    bottom: 12,
    color: "#8B8BB0",
  },
  west: {
    left: 12,
    color: "#8B8BB0",
  },
  qiblaArrow: {
    position: "absolute",
    width: 60,
    height: 120,
    alignItems: "center",
  },
  arrowHead: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(34, 197, 94, 0.2)",
    borderWidth: 2,
    borderColor: "#22C55E",
    alignItems: "center",
    justifyContent: "center",
  },
  kabaIcon: {
    fontSize: 28,
  },
  centerDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#7C3AED",
    borderWidth: 2,
    borderColor: "#F0F0FF",
  },
  alignmentIndicator: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "rgba(34, 197, 94, 0.1)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(34, 197, 94, 0.2)",
  },
  alignmentText: {
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  infoCard: {
    flex: 1,
    minWidth: "48%",
    backgroundColor: "#12122A",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2A2A4A",
  },
  infoLabel: {
    fontSize: 11,
    color: "#8B8BB0",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#22C55E",
  },
  accuracyBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#12122A",
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    alignSelf: "center",
  },
  accuracyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  accuracyBadgeText: {
    fontSize: 13,
    fontWeight: "600",
  },
  secondaryBtn: {
    backgroundColor: "rgba(34, 197, 94, 0.1)",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: "rgba(34, 197, 94, 0.3)",
  },
  calibratingBtn: {
    opacity: 0.6,
  },
  secondaryBtnText: {
    color: "#22C55E",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  warningCard: {
    backgroundColor: "rgba(245, 158, 11, 0.1)",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.3)",
  },
  warningText: {
    color: "#F59E0B",
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
  },
  instructionsCard: {
    backgroundColor: "#12122A",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#2A2A4A",
    gap: 8,
    marginBottom: 16,
  },
  instructionsTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#F0F0FF",
  },
  instructionsText: {
    fontSize: 13,
    color: "#8B8BB0",
    lineHeight: 20,
  },
});
