import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Magnetometer } from "expo-sensors";
import * as Location from "expo-location";
import { ScreenContainer } from "@/components/screen-container";

// Kaaba coordinates (Makkah)
const KAABA_LAT = 21.4225;
const KAABA_LNG = 39.8262;

interface LocationData {
  latitude: number;
  longitude: number;
}

/**
 * Calculate bearing (direction) from one point to another
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
 * Calculate distance between two points (Haversine formula)
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
  const [location, setLocation] = useState<LocationData | null>(null);
  const [heading, setHeading] = useState(0);
  const [qiblaAngle, setQiblaAngle] = useState(0);
  const [distance, setDistance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const rotationAnim = useRef(new Animated.Value(0)).current;
  const magnetometerSubscription = useRef<any>(null);

  // Get user location
  useEffect(() => {
    const getLocation = async () => {
      try {
        setLoading(true);
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setError("Location permission denied");
          setLoading(false);
          return;
        }

        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        const { latitude, longitude } = loc.coords;
        setLocation({ latitude, longitude });

        // Calculate Qibla direction
        const qibla = calculateBearing(latitude, longitude, KAABA_LAT, KAABA_LNG);
        setQiblaAngle(qibla);

        // Calculate distance
        const dist = calculateDistance(latitude, longitude, KAABA_LAT, KAABA_LNG);
        setDistance(dist);

        setLoading(false);
      } catch (err) {
        setError("Failed to get location");
        setLoading(false);
      }
    };

    getLocation();
  }, []);

  // Subscribe to magnetometer
  useEffect(() => {
    if (!location) return;

    Magnetometer.setUpdateInterval(100);

    magnetometerSubscription.current = Magnetometer.addListener(({ x, y }) => {
      // Calculate heading from magnetometer X and Y values
      let heading = Math.atan2(y, x) * (180 / Math.PI);
      heading = (heading + 90 + 360) % 360;

      setHeading(heading);

      // Animate rotation
      Animated.timing(rotationAnim, {
        toValue: heading,
        duration: 100,
        easing: Easing.linear,
        useNativeDriver: true,
      }).start();
    });

    return () => {
      if (magnetometerSubscription.current) {
        magnetometerSubscription.current.remove();
      }
    };
  }, [location, rotationAnim]);

  const handleRefresh = async () => {
    try {
      setLoading(true);
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const { latitude, longitude } = loc.coords;
      setLocation({ latitude, longitude });
      const qibla = calculateBearing(latitude, longitude, KAABA_LAT, KAABA_LNG);
      setQiblaAngle(qibla);
      const dist = calculateDistance(latitude, longitude, KAABA_LAT, KAABA_LNG);
      setDistance(dist);
      setLoading(false);
    } catch (err) {
      setError("Failed to refresh location");
      setLoading(false);
    }
  };

  // Calculate deviation from Qibla
  let deviation = Math.abs(qiblaAngle - heading);
  if (deviation > 180) {
    deviation = 360 - deviation;
  }

  const isAligned = deviation < 5;
  const alignmentColor = isAligned ? "#22C55E" : "#F59E0B";

  return (
    <ScreenContainer className="bg-background flex-1">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>🕌 Qibla Compass</Text>
          <Text style={styles.headerSubtitle}>Direction to Makkah</Text>
        </View>

        {/* Main Content */}
        {loading ? (
          <View style={styles.centerContent}>
            <Text style={styles.loadingText}>Loading compass...</Text>
          </View>
        ) : error ? (
          <View style={styles.centerContent}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.button} onPress={handleRefresh}>
              <Text style={styles.buttonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.content}>
            {/* Compass Circle */}
            <View style={styles.compassWrapper}>
              <View style={styles.compass}>
                {/* Cardinal directions */}
                <Text style={[styles.cardinal, styles.cardinalN]}>N</Text>
                <Text style={[styles.cardinal, styles.cardinalE]}>E</Text>
                <Text style={[styles.cardinal, styles.cardinalS]}>S</Text>
                <Text style={[styles.cardinal, styles.cardinalW]}>W</Text>

                {/* Compass needle (shows device heading) */}
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
                      transform: [{ rotate: `${qiblaAngle}deg` }],
                    },
                  ]}
                >
                  <View style={styles.qiblaArrow}>
                    <Text style={styles.qiblaIcon}>🕋</Text>
                  </View>
                </View>

                {/* Center dot */}
                <View style={styles.centerDot} />
              </View>
            </View>

            {/* Deviation Info */}
            <View style={[styles.deviationBox, { borderColor: alignmentColor }]}>
              <Text style={styles.deviationLabel}>Deviation</Text>
              <Text style={[styles.deviationValue, { color: alignmentColor }]}>
                {Math.round(deviation)}°
              </Text>
              <Text style={styles.deviationStatus}>
                {isAligned ? "✓ Aligned" : "Adjust"}
              </Text>
            </View>

            {/* Info Grid */}
            <View style={styles.infoGrid}>
              <View style={styles.infoBox}>
                <Text style={styles.infoLabel}>Qibla</Text>
                <Text style={styles.infoValue}>{Math.round(qiblaAngle)}°</Text>
              </View>
              <View style={styles.infoBox}>
                <Text style={styles.infoLabel}>Your Heading</Text>
                <Text style={styles.infoValue}>{Math.round(heading)}°</Text>
              </View>
              <View style={styles.infoBox}>
                <Text style={styles.infoLabel}>Distance</Text>
                <Text style={styles.infoValue}>
                  {distance > 1000 ? `${(distance / 1000).toFixed(0)}k` : Math.round(distance)} km
                </Text>
              </View>
              <View style={styles.infoBox}>
                <Text style={styles.infoLabel}>Status</Text>
                <Text style={[styles.infoValue, { color: alignmentColor }]}>
                  {isAligned ? "Ready" : "Adjust"}
                </Text>
              </View>
            </View>

            {/* Instructions */}
            <View style={styles.instructions}>
              <Text style={styles.instructionsTitle}>How to Use</Text>
              <Text style={styles.instructionsText}>
                • Hold phone level{"\n"}
                • Rotate until red needle aligns with 🕋{"\n"}
                • That's your Qibla direction
              </Text>
            </View>

            {/* Refresh Button */}
            <TouchableOpacity style={styles.button} onPress={handleRefresh}>
              <Text style={styles.buttonText}>🔄 Refresh Location</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  header: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#F0F0FF",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#8B8BB0",
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
  content: {
    flex: 1,
    gap: 16,
  },
  compassWrapper: {
    alignItems: "center",
    marginVertical: 12,
  },
  compass: {
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: "#12122A",
    borderWidth: 3,
    borderColor: "#22C55E",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    overflow: "hidden",
  },
  cardinal: {
    position: "absolute",
    fontSize: 16,
    fontWeight: "700",
    width: 30,
    textAlign: "center",
  },
  cardinalN: {
    top: 12,
    color: "#EF4444",
  },
  cardinalE: {
    right: 12,
    color: "#8B8BB0",
  },
  cardinalS: {
    bottom: 12,
    color: "#8B8BB0",
  },
  cardinalW: {
    left: 12,
    color: "#8B8BB0",
  },
  needle: {
    position: "absolute",
    width: 6,
    height: 120,
    alignItems: "center",
  },
  needleRed: {
    width: 5,
    height: 60,
    backgroundColor: "#EF4444",
    borderRadius: 2.5,
  },
  needleWhite: {
    width: 5,
    height: 60,
    backgroundColor: "#F0F0FF",
    borderRadius: 2.5,
  },
  qiblaIndicator: {
    position: "absolute",
    width: 240,
    height: 240,
    justifyContent: "flex-start",
    alignItems: "center",
  },
  qiblaArrow: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(34, 197, 94, 0.2)",
    borderWidth: 2,
    borderColor: "#22C55E",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  qiblaIcon: {
    fontSize: 24,
  },
  centerDot: {
    position: "absolute",
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#7C3AED",
    borderWidth: 2,
    borderColor: "#F0F0FF",
  },
  deviationBox: {
    backgroundColor: "#12122A",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    borderWidth: 2,
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
  },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  infoBox: {
    flex: 1,
    minWidth: "48%",
    backgroundColor: "#12122A",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2A2A4A",
  },
  infoLabel: {
    fontSize: 10,
    color: "#8B8BB0",
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#22C55E",
  },
  instructions: {
    backgroundColor: "#12122A",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#2A2A4A",
  },
  instructionsTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#F0F0FF",
    marginBottom: 6,
  },
  instructionsText: {
    fontSize: 11,
    color: "#8B8BB0",
    lineHeight: 16,
  },
  button: {
    backgroundColor: "rgba(34, 197, 94, 0.2)",
    borderRadius: 8,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#22C55E",
    alignItems: "center",
  },
  buttonText: {
    color: "#22C55E",
    fontSize: 14,
    fontWeight: "600",
  },
});
