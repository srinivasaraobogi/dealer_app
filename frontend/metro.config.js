const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Enable package.json "exports" field resolution so axios resolves to its
// browser build instead of the Node.js CJS bundle (which imports "crypto").
config.resolver.unstable_enablePackageExports = true;

module.exports = config;
