// metro.config.js
const { getDefaultConfig } = require("expo/metro-config");

module.exports = (() => {
  const config = getDefaultConfig(__dirname);

  return {
    ...config,
    resolver: {
      ...config.resolver,
      extraNodeModules: {
        crypto: require.resolve("react-native-crypto"),
        stream: require.resolve("stream-browserify"),
        buffer: require.resolve("buffer/"),
        events: require.resolve("events/"),
        process: require.resolve("process/browser"),
        util: require.resolve("util/"),
      },
    },
  };
})();
