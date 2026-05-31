const { withAndroidManifest } = require('@expo/config-plugins');

module.exports = function withDisableMediaSession(config) {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults;
    const mainApplication = androidManifest.manifest.application[0];

    // Remove MediaSessionService yang didaftarkan expo-av
    if (mainApplication.service) {
      mainApplication.service = mainApplication.service.filter(
        (s) => !s.$['android:name']?.includes('MediaSession') &&
               !s.$['android:name']?.includes('ExponentAV')
      );
    }

    return config;
  });
};
