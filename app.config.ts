// Load environment variables with proper priority (system > .env)
import "./scripts/load-env.js";
import type { ExpoConfig } from "expo/config";

const bundleId = "space.manus.noor.muslim.app.t20260315";
const timestamp = bundleId.split(".").pop()?.replace(/^t/, "") ?? "";
const schemeFromBundleId = `manus${timestamp}`;

const env = {
  appName: "Noor: Muslim Companion",
  appSlug: "noor-muslim-app",
  logoUrl: "https://d2xsxph8kpxj0f.cloudfront.net/310519663439098309/PwZqfFHUutxrDZYiC93bM3/noor-icon-ctYX2bjwmJFumB7xz9TDZ9.png",
  scheme: schemeFromBundleId,
  iosBundleId: bundleId,
  androidPackage: bundleId,
};

const config: ExpoConfig = {
  name: env.appName,
  slug: env.appSlug,
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: env.scheme,
  userInterfaceStyle: "dark",
  newArchEnabled: true,
  ios: {
    supportsTablet: true,
    bundleIdentifier: env.iosBundleId,
    infoPlist: {
      UIBackgroundModes: ["audio", "fetch", "remote-notification"],
      NSLocationWhenInUseUsageDescription:
        "Noor needs your location to calculate accurate prayer times and Qibla direction.",
      NSLocationAlwaysAndWhenInUseUsageDescription:
        "Noor needs your location to calculate accurate prayer times and Qibla direction.",
      NSMotionUsageDescription:
        "Noor uses your device's motion sensors for the Qibla compass.",
      NSCameraUsageDescription:
        "Noor uses your camera to scan product barcodes for Halal ingredient verification.",
    },
  },
  android: {
    adaptiveIcon: {
      backgroundColor: "#0A0A1A",
      foregroundImage: "./assets/images/android-icon-foreground.png",
      backgroundImage: "./assets/images/android-icon-background.png",
      monochromeImage: "./assets/images/android-icon-monochrome.png",
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
    package: env.androidPackage,
    permissions: [
      "POST_NOTIFICATIONS",
      "ACCESS_FINE_LOCATION",
      "ACCESS_COARSE_LOCATION",
      "VIBRATE",
      "RECEIVE_BOOT_COMPLETED",
      "FOREGROUND_SERVICE",
    ],
    intentFilters: [
      {
        action: "VIEW",
        autoVerify: true,
        data: [{ scheme: env.scheme, host: "*" }],
        category: ["BROWSABLE", "DEFAULT"],
      },
    ],
  },
  web: {
    bundler: "metro",
    output: "static",
    favicon: "./assets/images/favicon.png",
  },
  plugins: [
    "expo-router",
    [
      "expo-camera",
      {
        "cameraPermission": "Allow Noor to access your camera to scan product barcodes for Halal verification.",
        "microphonePermission": "Allow Noor to access your microphone.",
        "recordAudioAndroid": false
      }
    ],
    [
      "expo-audio",
      {
        microphonePermission: "Allow $(PRODUCT_NAME) to access your microphone.",
      },
    ],
    [
      "expo-location",
      {
        locationWhenInUsePermission:
          "Allow Noor to use your location for prayer times and Qibla direction.",
        locationAlwaysAndWhenInUsePermission:
          "Allow Noor to use your location for prayer times and Qibla direction.",
      },
    ],
    [
      "expo-video",
      {
        supportsBackgroundPlayback: true,
        supportsPictureInPicture: true,
      },
    ],
    [
      "expo-splash-screen",
      {
        image: "./assets/images/splash-icon.png",
        imageWidth: 200,
        resizeMode: "contain",
        backgroundColor: "#0A0A1A",
        dark: {
          backgroundColor: "#0A0A1A",
        },
      },
    ],
    [
      "expo-build-properties",
      {
        android: {
          buildArchs: ["armeabi-v7a", "arm64-v8a"],
        },
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
};

export default config;
