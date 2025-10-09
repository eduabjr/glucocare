const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Adicionar suporte para resolução de módulos
config.resolver.alias = {
  ...config.resolver.alias,
  crypto: 'react-native-crypto',
  stream: 'stream-browserify',
  buffer: 'buffer',
  util: 'util',
  events: 'events',
  process: 'process',
};

// Configurar extensões de arquivo
config.resolver.sourceExts.push('cjs');

module.exports = config;