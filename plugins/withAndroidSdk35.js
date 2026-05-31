const { withAppBuildGradle } = require('@expo/config-plugins');

module.exports = function withAndroidSdk35(config) {
  return withAppBuildGradle(config, (config) => {
    const buildGradle = config.modResults.contents;

    // Ganti compileSdkVersion 34 -> 35
    config.modResults.contents = buildGradle
      .replace(/compileSdkVersion\s+\d+/, 'compileSdkVersion 35')
      .replace(/compileSdk\s+=?\s*\d+/, 'compileSdk = 35')
      .replace(/targetSdkVersion\s+\d+/, 'targetSdkVersion 35')
      .replace(/targetSdk\s+=?\s*\d+/, 'targetSdk = 35');

    return config;
  });
};
