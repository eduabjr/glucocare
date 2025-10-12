export default {
  expo: {
    name: "GlucoCare",
    slug: "glucocare",
    version: "1.0.0",
    orientation: "portrait",
    userInterfaceStyle: "light",
    icon: "./assets/icon.png",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    scheme: "glucocare",
    android: {
      package: "com.glucocare.app",
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      config: {
        googleSignIn: {
          androidClientId: "360317541807-19cbu2121eftbm4d9p50mk3okma4bhtj.apps.googleusercontent.com"
        }
      }
    },
    platforms: ["ios", "android", "web"],
    // ✅ EAS Project ID para builds nativos
    extra: {
      eas: {
        projectId: "2d82c0cb-e0fd-40f3-bb50-abd697fa4e8d"
      }
    },
    // ✅ FORÇAR EXPO GO - Remover configurações que causam development build
    ios: {
      bundleIdentifier: "com.glucocare.app"
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    plugins: [
      // ✅ PLUGINS COMPATÍVEIS COM EXPO GO
      "expo-local-authentication",
      "expo-secure-store",
      "expo-sqlite",
      "expo-file-system",
      "expo-document-picker"
    ]
  }
};
