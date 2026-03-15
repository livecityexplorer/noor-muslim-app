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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle, Line, Path, G, Text as SvgText } from "react-native-svg";

// Kaaba coordinates
const KAABA_LAT = 21.4225;
const KAABA_LNG = 39.8262;

function calculateQiblaDirection(lat: number, lng: number): number {
  const latRad = (lat * Math.PI) / 180;
  const lngDiff = ((KAABA_LNG - lng) * Math.PI) / 180;
  const kaabaLatRad = (KAABA_LAT * Math.PI) / 180;

  const y = Math.sin(lngDiff) * Math.cos(kaabaLatRad);
  const x =
    Math.cos(latRad) * Math.sin(kaabaLatRad) -
    Math.sin(latRad) * Math.cos(kaabaLatRad) * Math.cos(lngDiff);

  let bearing = (Math.atan2(y, x) * 180) / Math.PI;
  bearing = (bearing + 360) % 360;
  return bearing;
}

function calculateDistance(lat: number, lng: number): number {
  const R = 6371;
  const dLat = ((KAABA_LAT - lat) * Math.PI) / 180;
  const dLng = ((KAABA_LNG - lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat * Math.PI) / 180) *
      Math.cos((KAABA_LAT * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function getMagneticHeading(x: number, y: number): number {
  let heading = Math.atan2(y, x) * (180 / Math.PI);
  heading = (heading + 360) % 360;
  return heading;
}

const COMPASS_SIZE = 280;
const COMPASS_RADIUS = COMPASS_SIZE / 2 - 20;

function CompassDial({ rotation, qiblaAngle }: { rotation: number; qiblaAngle: number }) {
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const majorTicks = [0, 45, 90, 135, 180, 225, 270, 315];
  const center = COMPASS_SIZE / 2;

  return (
    <Svg width={COMPASS_SIZE} height={COMPASS_SIZE}>
      {/* Outer ring */}
      <Circle
        cx={center}
        cy={center}
        r={COMPASS_RADIUS + 10}
        fill="none"
        stroke="#2A2A4A"
        strokeWidth={2}
      />
      {/* Inner ring */}
      <Circle
        cx={center}
        cy={center}
        r={COMPASS_RADIUS - 10}
        fill="rgba(18, 18, 42, 0.8)"
        stroke="#1C1C3A"
        strokeWidth={1}
      />

      {/* Tick marks */}
      {Array.from({ length: 72 }).map((_, i) => {
        const angle = (i * 5 - rotation) * (Math.PI / 180);
        const isMajor = i % 9 === 0;
        const isCardinal = i % 18 === 0;
        const tickLen = isCardinal ? 16 : isMajor ? 10 : 6;
        const r1 = COMPASS_RADIUS - 2;
        const r2 = r1 - tickLen;
        const x1 = center + r1 * Math.sin(angle);
        const y1 = center - r1 * Math.cos(angle);
        const x2 = center + r2 * Math.sin(angle);
        const y2 = center - r2 * Math.cos(angle);
        return (
          <Line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={isCardinal ? "#F59E0B" : isMajor ? "#4A4A6A" : "#2A2A4A"}
            strokeWidth={isCardinal ? 2 : 1}
          />
        );
      })}

      {/* Cardinal direction labels */}
      {majorTicks.map((deg, i) => {
        const angle = (deg - rotation) * (Math.PI / 180);
        const r = COMPASS_RADIUS - 30;
        const x = center + r * Math.sin(angle);
        const y = center - r * Math.cos(angle);
        const isNorth = deg === 0;
        return (
          <SvgText
            key={deg}
            x={x}
            y={y + 5}
            textAnchor="middle"
            fill={isNorth ? "#EF4444" : "#8B8BB0"}
            fontSize={isNorth ? 14 : 10}
            fontWeight={isNorth ? "bold" : "normal"}
          >
            {directions[i]}
          </SvgText>
        );
      })}

      {/* Qibla direction arrow */}
      {(() => {
        const qiblaRad = (qiblaAngle - rotation) * (Math.PI / 180);
        const arrowLen = COMPASS_RADIUS - 15;
        const ax = center + arrowLen * Math.sin(qiblaRad);
        const ay = center - arrowLen * Math.cos(qiblaRad);
        const tailLen = 20;
        const tx = center - tailLen * Math.sin(qiblaRad);
        const ty = center + tailLen * Math.cos(qiblaRad);
        return (
          <G>
            {/* Qibla glow */}
            <Circle
              cx={ax}
              cy={ay}
              r={8}
              fill="rgba(34, 197, 94, 0.3)"
            />
            {/* Arrow line */}
            <Line
              x1={tx}
              y1={ty}
              x2={ax}
              y2={ay}
              stroke="#22C55E"
              strokeWidth={3}
              strokeLinecap="round"
            />
            {/* Kaaba icon */}
            <SvgText
              x={ax}
              y={ay + 5}
              textAnchor="middle"
              fill="#22C55E"
              fontSize={14}
            >
              🕋
            </SvgText>
          </G>
        );
      })()}

      {/* Center dot */}
      <Circle cx={center} cy={center} r={8} fill="#7C3AED" />
      <Circle cx={center} cy={center} r={4} fill="#F0F0FF" />

      {/* North indicator (fixed) */}
      <Path
        d={`M ${center} ${center - COMPASS_RADIUS + 5} L ${center - 6} ${center - COMPASS_RADIUS + 18} L ${center + 6} ${center - COMPASS_RADIUS + 18} Z`}
        fill="#EF4444"
      />
    </Svg>
  );
}

export default function QiblaScreen() {
  const [location, setLocationState] = useState<{ lat: number; lng: number } | null>(null);
  const [heading, setHeading] = useState(0);
  const [qiblaAngle, setQiblaAngle] = useState(0);
  const [distance, setDistance] = useState(0);
  const [accuracy, setAccuracy] = useState<"low" | "medium" | "high">("low");
  const [hasPermission, setHasPermission] = useState(false);
  const [sensorAvailable, setSensorAvailable] = useState(true);
  const [calibrating, setCalibrating] = useState(false);
  const rotationAnim = useRef(new Animated.Value(0)).current;
  const lastHeading = useRef(0);

  useEffect(() => {
    (async () => {
      // Check sensor availability
      const available = await Magnetometer.isAvailableAsync();
      setSensorAvailable(available);

      // Get location
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        setHasPermission(true);
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const lat = loc.coords.latitude;
        const lng = loc.coords.longitude;
        setLocationState({ lat, lng });
        const qibla = calculateQiblaDirection(lat, lng);
        const dist = calculateDistance(lat, lng);
        setQiblaAngle(qibla);
        setDistance(dist);
      }
    })();
  }, []);

  useEffect(() => {
    if (!sensorAvailable) return;
    Magnetometer.setUpdateInterval(100);
    const subscription = Magnetometer.addListener(({ x, y, z }) => {
      const mag = Math.sqrt(x * x + y * y + z * z);
      // Determine accuracy based on field strength
      if (mag > 20 && mag < 65) {
        setAccuracy("high");
      } else if (mag > 10) {
        setAccuracy("medium");
      } else {
        setAccuracy("low");
      }

      const newHeading = getMagneticHeading(x, y);
      const diff = newHeading - lastHeading.current;
      // Smooth out small jitters
      if (Math.abs(diff) > 1) {
        lastHeading.current = newHeading;
        setHeading(newHeading);
        Animated.timing(rotationAnim, {
          toValue: newHeading,
          duration: 100,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }).start();
      }
    });
    return () => subscription.remove();
  }, [sensorAvailable, rotationAnim]);

  const handleCalibrate = useCallback(() => {
    setCalibrating(true);
    setTimeout(() => setCalibrating(false), 3000);
  }, []);

  const accuracyColor = accuracy === "high" ? "#22C55E" : accuracy === "medium" ? "#F59E0B" : "#EF4444";
  const accuracyLabel = accuracy === "high" ? "High Accuracy" : accuracy === "medium" ? "Medium Accuracy" : "Low Accuracy — Calibrate";

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={["#001A0A", "#0A1A0A", "#0A0A1A"]}
        style={styles.header}
      >
        <View style={styles.decorCircle} />
        <SafeAreaView edges={["top"]}>
          <Text style={styles.headerTitle}>Qibla Direction</Text>
          <Text style={styles.headerSubtitle}>Direction of the Kaaba in Makkah</Text>
        </SafeAreaView>
      </LinearGradient>

      <View style={styles.content}>
        {!hasPermission ? (
          <View style={styles.permissionContainer}>
            <Text style={styles.permissionIcon}>📍</Text>
            <Text style={styles.permissionTitle}>Location Required</Text>
            <Text style={styles.permissionText}>
              Qibla direction requires your location to calculate the direction of the Kaaba.
            </Text>
            <TouchableOpacity
              style={styles.permissionBtn}
              onPress={async () => {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status === "granted") {
                  setHasPermission(true);
                  const loc = await Location.getCurrentPositionAsync({});
                  const lat = loc.coords.latitude;
                  const lng = loc.coords.longitude;
                  setLocationState({ lat, lng });
                  setQiblaAngle(calculateQiblaDirection(lat, lng));
                  setDistance(calculateDistance(lat, lng));
                }
              }}
            >
              <Text style={styles.permissionBtnText}>Grant Location Access</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Compass */}
            <View style={styles.compassContainer}>
              {/* Outer glow ring */}
              <View style={styles.compassGlow} />
              <CompassDial rotation={heading} qiblaAngle={qiblaAngle} />
            </View>

            {/* Info Cards */}
            <View style={styles.infoRow}>
              <View style={styles.infoCard}>
                <Text style={styles.infoLabel}>Qibla Direction</Text>
                <Text style={styles.infoValue}>{Math.round(qiblaAngle)}°</Text>
              </View>
              <View style={styles.infoCard}>
                <Text style={styles.infoLabel}>Distance to Makkah</Text>
                <Text style={styles.infoValue}>
                  {distance > 1000 ? `${(distance / 1000).toFixed(1)}k` : Math.round(distance)} km
                </Text>
              </View>
            </View>

            {/* Accuracy indicator */}
            <View style={[styles.accuracyBadge, { borderColor: accuracyColor }]}>
              <View style={[styles.accuracyDot, { backgroundColor: accuracyColor }]} />
              <Text style={[styles.accuracyText, { color: accuracyColor }]}>{accuracyLabel}</Text>
            </View>

            {/* Calibration */}
            {!sensorAvailable ? (
              <View style={styles.noSensorCard}>
                <Text style={styles.noSensorText}>
                  ⚠️ Magnetometer not available on this device. Qibla direction shown based on GPS only.
                </Text>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.calibrateBtn}
                onPress={handleCalibrate}
              >
                <Text style={styles.calibrateBtnText}>
                  {calibrating ? "Calibrating... Move in figure-8 pattern" : "🔄 Calibrate Compass"}
                </Text>
              </TouchableOpacity>
            )}

            {/* Instructions */}
            <View style={styles.instructionsCard}>
              <Text style={styles.instructionsTitle}>How to use</Text>
              <Text style={styles.instructionsText}>
                Hold your phone flat and level. The green arrow points toward the Kaaba in Makkah. Rotate your body until the arrow points straight up on the screen — that is your Qibla direction.
              </Text>
              <Text style={styles.instructionsCalib}>
                For best accuracy: move your phone in a figure-8 pattern to calibrate the compass.
              </Text>
            </View>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0A0A1A" },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    overflow: "hidden",
  },
  decorCircle: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: "rgba(34, 197, 94, 0.15)",
    top: -60,
    right: -40,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "700",
    color: "#F0F0FF",
    paddingTop: 8,
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#8B8BB0",
    marginTop: 2,
  },
  content: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 16,
  },
  permissionContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    paddingHorizontal: 32,
  },
  permissionIcon: { fontSize: 60 },
  permissionTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#F0F0FF",
  },
  permissionText: {
    fontSize: 14,
    color: "#8B8BB0",
    textAlign: "center",
    lineHeight: 22,
  },
  permissionBtn: {
    backgroundColor: "rgba(34, 197, 94, 0.2)",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderWidth: 1,
    borderColor: "#22C55E",
  },
  permissionBtnText: {
    color: "#22C55E",
    fontSize: 15,
    fontWeight: "600",
  },
  compassContainer: {
    width: COMPASS_SIZE + 20,
    height: COMPASS_SIZE + 20,
    alignItems: "center",
    justifyContent: "center",
  },
  compassGlow: {
    position: "absolute",
    width: COMPASS_SIZE + 20,
    height: COMPASS_SIZE + 20,
    borderRadius: (COMPASS_SIZE + 20) / 2,
    backgroundColor: "rgba(34, 197, 94, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(34, 197, 94, 0.2)",
  },
  infoRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  infoCard: {
    flex: 1,
    backgroundColor: "#12122A",
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2A2A4A",
  },
  infoLabel: {
    fontSize: 11,
    color: "#8B8BB0",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 22,
    fontWeight: "800",
    color: "#22C55E",
  },
  accuracyBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#12122A",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 1,
  },
  accuracyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  accuracyText: {
    fontSize: 13,
    fontWeight: "600",
  },
  noSensorCard: {
    backgroundColor: "rgba(245, 158, 11, 0.1)",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.3)",
    width: "100%",
  },
  noSensorText: {
    color: "#F59E0B",
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
  },
  calibrateBtn: {
    backgroundColor: "rgba(34, 197, 94, 0.15)",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: "rgba(34, 197, 94, 0.3)",
  },
  calibrateBtnText: {
    color: "#22C55E",
    fontSize: 14,
    fontWeight: "600",
  },
  instructionsCard: {
    backgroundColor: "#12122A",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#2A2A4A",
    width: "100%",
    gap: 8,
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
  instructionsCalib: {
    fontSize: 12,
    color: "#4A4A6A",
    lineHeight: 18,
    fontStyle: "italic",
  },
});
