const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Configuração mínima para resolver problemas do Metro
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

module.exports = config;