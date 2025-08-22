// Enable package exports resolution for Metro (needed for subpath exports like "motion/react")
const { getDefaultConfig } = require('expo/metro-config');

module.exports = (async () => {
  const config = await getDefaultConfig(__dirname);
  config.resolver = config.resolver || {};
  config.resolver.unstable_enablePackageExports = true;
  return config;
})();

