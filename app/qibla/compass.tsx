import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
  Dimensions,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { Magnetometer } from "expo-sensors";
import * as Location from "expo-location";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

const { width } = Dimensions.get("window");
const COMPASS_SIZE = Math.min(width - 40, 320);

interface LocationCoords {
  latitude: number;
  longitude: number;
}

/**
 * Calculate Qibla direction (bearing) from user's location
 * Qibla coordinates: Kaaba in Mecca (21.4225° N, 39.8262° E)
 */
function calculateQiblaDirection(userLat: number, userLon: number): number {
  const KAABA_LAT = 21.4225;
  const KAABA_LON = 39.8262;

  const dLon = ((KAABA_LON - userLon) * Math.PI) / 180;
  const lat1 = (userLat * Math.PI) / 180;
  const lat2 = (KAABA_LAT * Math.PI) / 180;

  const y = Math.sin(dLon) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);

  let bearing = (Math.atan2(y, x) * 180) / Math.PI;
  bearing = (bearing + 360) % 360;

  return bearing;
}

/**
 * Normalize angle to 0-360 range
 */
function normalizeAngle(angle: number): number {
  return ((angle % 360) + 360) % 360;
}

/**
 * Calculate the shortest angular distance between two angles
 */
function getAngularDifference(angle1: number, angle2: number): number {
  let diff = angle2 - angle1;
  if (diff > 180) diff -= 360;
  if (diff < -180) diff += 360;
  return diff;
}

export default function QiblaCompassScreen() {
  const [location, setLocation] = useState<LocationCoords | null>(null);
  const [qiblaDirection, setQiblaDirection] = useState<number>(0);
  const [deviceHeading, setDeviceHeading] = useState<number>(0);
  const [deviationAngle, setDeviationAngle] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Animated values
  const compassRotation = useSharedValue(0);
  const needleRotation = useSharedValue(0);

  const magnetometerSubscription = useRef<any>(null);

  // Get user location on mount
  useEffect(() => {
    const getLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setError("Location permission denied");
          setLoading(false);
          return;
        }

        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        const coords: LocationCoords = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        };

        setLocation(coords);

        // Calculate Qibla direction
        const qibla = calculateQiblaDirection(coords.latitude, coords.longitude);
        setQiblaDirection(qibla);

        setLoading(false);
      } catch (err) {
        setError("Could not get location");
        setLoading(false);
      }
    };

    getLocation();
  }, []);

  // Subscribe to magnetometer (compass heading)
  useEffect(() => {
    if (!location) return;

    const subscription = Magnetometer.addListener((data: any) => {
      const { x, y } = data;

      // Calculate heading from magnetometer data
      let heading = Math.atan2(y, x) * (180 / Math.PI);
      heading = normalizeAngle(heading);

      setDeviceHeading(heading);

      // Calculate deviation from Qibla
      const deviation = getAngularDifference(heading, qiblaDirection);
      setDeviationAngle(deviation);

      // Animate compass rotation
      compassRotation.value = withTiming(-heading, { duration: 100 });

      // Animate needle rotation (Qibla direction relative to device heading)
      const needleAngle = qiblaDirection - heading;
      needleRotation.value = withTiming(needleAngle, { duration: 100 });
    });

    magnetometerSubscription.current = subscription;

    return () => {
      subscription.remove();
    };
  }, [location, qiblaDirection, compassRotation, needleRotation]);

  // Animated styles for compass
  const compassAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${compassRotation.value}deg` }],
  }));

  // Animated styles for needle
  const needleAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${needleRotation.value}deg` }],
  }));

  if (loading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" color="#7C3AED" />
        <Text className="text-foreground mt-4">Loading compass...</Text>
      </ScreenContainer>
    );
  }

  if (error) {
    return (
      <ScreenContainer className="items-center justify-center p-6">
        <Text className="text-error text-lg font-bold mb-4">Error</Text>
        <Text className="text-muted text-center">{error}</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="items-center justify-center p-6">
      {/* Header */}
      <View className="w-full mb-8">
        <Text className="text-2xl font-bold text-foreground text-center">
          Qibla Compass
        </Text>
        <Text className="text-sm text-muted text-center mt-2">
          Point your device towards Mecca
        </Text>
      </View>

      {/* Compass Container */}
      <View className="items-center mb-8">
        {/* Outer compass circle */}
        <View
          style={[
            styles.compassOuter,
            { width: COMPASS_SIZE, height: COMPASS_SIZE },
          ]}
        >
          {/* Animated compass background with degree markers */}
          <Animated.View
            style={[
              styles.compassInner,
              { width: COMPASS_SIZE - 20, height: COMPASS_SIZE - 20 },
              compassAnimatedStyle,
            ]}
          >
            {/* Cardinal direction labels */}
            <Text style={styles.cardinalN} className="font-bold text-foreground">
              N
            </Text>
            <Text style={styles.cardinalE} className="font-bold text-foreground">
              E
            </Text>
            <Text style={styles.cardinalS} className="font-bold text-foreground">
              S
            </Text>
            <Text style={styles.cardinalW} className="font-bold text-foreground">
              W
            </Text>
          </Animated.View>

          {/* Qibla needle (red) */}
          <Animated.View
            style={[
              styles.needleContainer,
              { width: COMPASS_SIZE, height: COMPASS_SIZE },
              needleAnimatedStyle,
            ]}
          >
            <View style={styles.needle} />
          </Animated.View>

          {/* Center dot */}
          <View style={styles.centerDot} />
        </View>
      </View>

      {/* Deviation Indicator */}
      <View className="w-full bg-surface rounded-2xl p-6 mb-6 border border-border">
        <Text className="text-sm text-muted mb-2">Deviation from Qibla</Text>
        <View className="flex-row items-center justify-between">
          <Text className="text-3xl font-bold text-primary">
            {Math.abs(deviationAngle).toFixed(1)}°
          </Text>
          <Text className="text-sm text-muted">
            {deviationAngle > 0 ? "Turn Right" : deviationAngle < 0 ? "Turn Left" : "Aligned"}
          </Text>
        </View>
      </View>

      {/* Location Info */}
      {location && (
        <View className="w-full bg-surface rounded-2xl p-4 border border-border">
          <Text className="text-xs text-muted mb-2">Your Location</Text>
          <Text className="text-sm text-foreground font-mono">
            {location.latitude.toFixed(4)}°, {location.longitude.toFixed(4)}°
          </Text>
          <Text className="text-xs text-muted mt-2">Qibla Direction: {qiblaDirection.toFixed(1)}°</Text>
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  compassOuter: {
    borderRadius: 9999,
    backgroundColor: "#12122A",
    borderWidth: 2,
    borderColor: "#7C3AED",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  compassInner: {
    borderRadius: 9999,
    backgroundColor: "#0A0A1A",
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    borderWidth: 1,
    borderColor: "#2A2A4A",
  },
  cardinalN: {
    position: "absolute",
    top: 12,
    fontSize: 16,
  },
  cardinalE: {
    position: "absolute",
    right: 12,
    fontSize: 16,
  },
  cardinalS: {
    position: "absolute",
    bottom: 12,
    fontSize: 16,
  },
  cardinalW: {
    position: "absolute",
    left: 12,
    fontSize: 16,
  },
  needleContainer: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
  },
  needle: {
    width: 4,
    height: COMPASS_SIZE / 2 - 30,
    backgroundColor: "#EF4444",
    borderRadius: 2,
    shadowColor: "#EF4444",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 5,
  },
  centerDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#7C3AED",
    position: "absolute",
    zIndex: 10,
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 8,
  },
});
