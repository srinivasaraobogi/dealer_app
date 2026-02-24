const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Axios's Node.js CJS bundle imports Node's built-in "crypto" module, which
// doesn't exist in the React Native runtime.  Instead of enabling
// unstable_enablePackageExports globally (which breaks React Native's own
// TurboModule resolution and causes PlatformConstants errors), we redirect
// only the "crypto" import to a minimal shim.
config.resolver.extraNodeModules = {
  crypto: require.resolve('./shims/crypto.js'),
};

module.exports = config;
