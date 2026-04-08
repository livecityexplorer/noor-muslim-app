import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import { Magnetometer } from "expo-sensors";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";

// Kaaba coordinates
const KAABA_LAT = 21.4225;
const KAABA_LNG = 39.8262;

/**
 * Calculate bearing between two points using Haversine formula
 */
function calculateBearing(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number
): number {
  const dLng = ((toLng - fromLng) * Math.PI) / 180;
  const fromLatRad = (fromLat * Math.PI) / 180;
  const toLatRad = (toLat * Math.PI) / 180;

  const y = Math.sin(dLng) * Math.cos(toLatRad);
  const x =
    Math.cos(fromLatRad) * Math.sin(toLatRad) -
    Math.sin(fromLatRad) * Math.cos(toLatRad) * Math.cos(dLng);

  let bearing = (Math.atan2(y, x) * 180) / Math.PI;
  return (bearing + 360) % 360;
}

/**
 * Calculate distance using Haversine formula
 */
function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function QiblaScreen() {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [heading, setHeading] = useState(0);
  const [qiblaAngle, setQiblaAngle] = useState(0);
  const [distance, setDistance] = useState(0);
  const [hasPermission, setHasPermission] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const rotationAnim = useRef(new Animated.Value(0)).current;
  const lastHeadingRef = useRef(0);
  const subscriptionRef = useRef<any>(null);

  /**
   * Initialize location
   */
  useEffect(() => {
    const initLocation = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setError("Location permission denied");
          setIsLoading(false);
          return;
        }

        setHasPermission(true);
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        const { latitude, longitude } = loc.coords;
        setLocation({ lat: latitude, lng: longitude });

        // Calculate Qibla bearing
        const qibla = calculateBearing(latitude, longitude, KAABA_LAT, KAABA_LNG);
        setQiblaAngle(qibla);

        // Calculate distance
        const dist = calculateDistance(latitude, longitude, KAABA_LAT, KAABA_LNG);
        setDistance(dist);

        setIsLoading(false);
      } catch (err) {
        setError("Failed to get location");
        setIsLoading(false);
      }
    };

    initLocation();
  }, []);

  /**
   * Subscribe to magnetometer
   */
  useEffect(() => {
    if (!hasPermission || !location) return;

    Magnetometer.setUpdateInterval(100);

    subscriptionRef.current = Magnetometer.addListener(({ x, y }) => {
      try {
        // Calculate heading from magnetometer
        let heading = Math.atan2(y, x) * (180 / Math.PI);
        heading = (heading + 90 + 360) % 360; // Adjust for device orientation

        // Only update if change is significant
        const diff = Math.abs(heading - lastHeadingRef.current);
        if (diff > 1 || diff < -1) {
          lastHeadingRef.current = heading;
          setHeading(heading);

          // Animate rotation
          Animated.timing(rotationAnim, {
            toValue: heading,
            duration: 100,
            easing: Easing.linear,
            useNativeDriver: true,
          }).start();
        }
      } catch (error) {
        console.error("Magnetometer error:", error);
      }
    });

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.remove();
      }
    };
  }, [hasPermission, location, rotationAnim]);

  const handleRetry = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const { latitude, longitude } = loc.coords;
      setLocation({ lat: latitude, lng: longitude });
      const qibla = calculateBearing(latitude, longitude, KAABA_LAT, KAABA_LNG);
      setQiblaAngle(qibla);
      const dist = calculateDistance(latitude, longitude, KAABA_LAT, KAABA_LNG);
      setDistance(dist);
    } catch (err) {
      setError("Failed to update location");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Calculate deviation
  const deviation = Math.abs(qiblaAngle - heading);
  const shortestDeviation = deviation > 180 ? 360 - deviation : deviation;
  const isAligned = shortestDeviation < 5;

  const deviationText =
    shortestDeviation < 1
      ? "Perfect"
      : shortestDeviation < 5
        ? "Close"
        : shortestDeviation < 15
          ? "Adjust"
          : "Turn";

  return (
    <ScreenContainer className="bg-background">
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <LinearGradient
          colors={["rgba(34, 197, 94, 0.15)", "transparent"]}
          style={styles.header}
        >
          <Text style={styles.title}>🕌 Qibla Compass</Text>
          <Text style={styles.subtitle}>Find direction to Makkah</Text>
        </LinearGradient>

        {/* Content */}
        <View style={styles.content}>
          {isLoading ? (
            <View style={styles.centerBox}>
              <Text style={styles.loadingText}>Loading compass...</Text>
            </View>
          ) : error ? (
            <View style={styles.centerBox}>
              <Text style={styles.errorText}>⚠️ {error}</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={handleRetry}>
                <Text style={styles.retryBtnText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {/* Compass Container */}
              <View style={styles.compassContainer}>
                {/* Background circle */}
                <View style={styles.compassBg}>
                  {/* Cardinal directions */}
                  <Text style={[styles.cardinal, styles.north]}>N</Text>
                  <Text style={[styles.cardinal, styles.east]}>E</Text>
                  <Text style={[styles.cardinal, styles.south]}>S</Text>
                  <Text style={[styles.cardinal, styles.west]}>W</Text>

                  {/* Degree markers */}
                  {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
                    <View
                      key={deg}
                      style={[
                        styles.degreeMarker,
                        {
                          transform: [
                            {
                              rotate: `${deg}deg`,
                            },
                          ],
                        },
                      ]}
                    >
                      <View style={styles.markerDot} />
                    </View>
                  ))}

                  {/* Animated compass needle */}
                  <Animated.View
                    style={[
                      styles.needle,
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
                    <View style={styles.needleRed} />
                    <View style={styles.needleWhite} />
                  </Animated.View>

                  {/* Qibla indicator (static, shows where Qibla is) */}
                  <View
                    style={[
                      styles.qiblaIndicator,
                      {
                        transform: [
                          {
                            rotate: `${qiblaAngle}deg`,
                          },
                        ],
                      },
                    ]}
                  >
                    <View style={styles.qiblaArrow}>
                      <Text style={styles.kabaIcon}>🕋</Text>
                    </View>
                  </View>

                  {/* Center circle */}
                  <View style={styles.centerCircle} />
                </View>

                {/* Deviation display */}
                <View style={styles.deviationBox}>
                  <Text style={styles.deviationLabel}>Deviation</Text>
                  <Text
                    style={[
                      styles.deviationValue,
                      {
                        color: isAligned ? "#22C55E" : "#F59E0B",
                      },
                    ]}
                  >
                    {Math.round(shortestDeviation)}°
                  </Text>
                  <Text style={styles.deviationStatus}>{deviationText}</Text>
                </View>
              </View>

              {/* Info Cards */}
              <View style={styles.infoContainer}>
                <View style={styles.infoCard}>
                  <Text style={styles.infoLabel}>Qibla Direction</Text>
                  <Text style={styles.infoValue}>{Math.round(qiblaAngle)}°</Text>
                </View>
                <View style={styles.infoCard}>
                  <Text style={styles.infoLabel}>Your Heading</Text>
                  <Text style={styles.infoValue}>{Math.round(heading)}°</Text>
                </View>
                <View style={styles.infoCard}>
                  <Text style={styles.infoLabel}>Distance to Makkah</Text>
                  <Text style={styles.infoValue}>
                    {distance > 1000 ? `${(distance / 1000).toFixed(1)}k` : Math.round(distance)} km
                  </Text>
                </View>
                <View style={styles.infoCard}>
                  <Text style={styles.infoLabel}>Status</Text>
                  <Text
                    style={[
                      styles.infoValue,
                      {
                        color: isAligned ? "#22C55E" : "#F59E0B",
                      },
                    ]}
                  >
                    {isAligned ? "Aligned ✓" : "Adjust"}
                  </Text>
                </View>
              </View>

              {/* Instructions */}
              <View style={styles.instructionsBox}>
                <Text style={styles.instructionsTitle}>How to Use</Text>
                <Text style={styles.instructionsText}>
                  1. Hold phone flat and level{"\n"}
                  2. Rotate until red needle aligns with Kaaba icon 🕋{"\n"}
                  3. That's your Qibla direction
                </Text>
              </View>

              {/* Refresh Button */}
              <TouchableOpacity style={styles.refreshBtn} onPress={handleRetry}>
                <Text style={styles.refreshBtnText}>🔄 Refresh Location</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    color: "#F0F0FF",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: "#8B8BB0",
  },
  content: {
    paddingHorizontal: 20,
    gap: 20,
  },
  centerBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: "#8B8BB0",
  },
  errorText: {
    fontSize: 16,
    color: "#EF4444",
    textAlign: "center",
  },
  retryBtn: {
    backgroundColor: "rgba(34, 197, 94, 0.2)",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: "#22C55E",
  },
  retryBtnText: {
    color: "#22C55E",
    fontSize: 14,
    fontWeight: "600",
  },
  compassContainer: {
    alignItems: "center",
    gap: 16,
  },
  compassBg: {
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: "#12122A",
    borderWidth: 3,
    borderColor: "#22C55E",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
  },
  cardinal: {
    position: "absolute",
    fontSize: 18,
    fontWeight: "800",
    width: 40,
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
  degreeMarker: {
    position: "absolute",
    width: 280,
    height: 280,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  markerDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#4A4A6A",
    marginTop: 8,
  },
  needle: {
    position: "absolute",
    width: 8,
    height: 140,
    alignItems: "center",
  },
  needleRed: {
    width: 6,
    height: 80,
    backgroundColor: "#EF4444",
    borderRadius: 3,
  },
  needleWhite: {
    width: 6,
    height: 60,
    backgroundColor: "#F0F0FF",
    borderRadius: 3,
  },
  qiblaIndicator: {
    position: "absolute",
    width: 280,
    height: 280,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  qiblaArrow: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(34, 197, 94, 0.25)",
    borderWidth: 2,
    borderColor: "#22C55E",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },
  kabaIcon: {
    fontSize: 28,
  },
  centerCircle: {
    position: "absolute",
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#7C3AED",
    borderWidth: 3,
    borderColor: "#F0F0FF",
  },
  deviationBox: {
    backgroundColor: "#12122A",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2A2A4A",
    minWidth: 140,
  },
  deviationLabel: {
    fontSize: 11,
    color: "#8B8BB0",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  deviationValue: {
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 4,
  },
  deviationStatus: {
    fontSize: 12,
    color: "#8B8BB0",
    fontWeight: "600",
  },
  infoContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "space-between",
  },
  infoCard: {
    flex: 1,
    minWidth: "48%",
    backgroundColor: "#12122A",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2A2A4A",
  },
  infoLabel: {
    fontSize: 10,
    color: "#8B8BB0",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "800",
    color: "#22C55E",
  },
  instructionsBox: {
    backgroundColor: "#12122A",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#2A2A4A",
    gap: 8,
  },
  instructionsTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#F0F0FF",
  },
  instructionsText: {
    fontSize: 12,
    color: "#8B8BB0",
    lineHeight: 18,
  },
  refreshBtn: {
    backgroundColor: "rgba(34, 197, 94, 0.2)",
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: "#22C55E",
    alignItems: "center",
  },
  refreshBtnText: {
    color: "#22C55E",
    fontSize: 14,
    fontWeight: "600",
  },
});
