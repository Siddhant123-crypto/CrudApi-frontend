// BUG-016: Dynamic Expo config wrapper allowing Google Maps Android API key
// injection via environment variable / EAS secret without modifying app.json branding.
module.exports = ({ config }) => {
  const envMapsKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (envMapsKey && envMapsKey.trim().length > 0) {
    return {
      ...config,
      android: {
        ...config.android,
        config: {
          ...(config.android?.config || {}),
          googleMaps: {
            ...(config.android?.config?.googleMaps || {}),
            apiKey: envMapsKey.trim(),
          },
        },
      },
    };
  }
  return config;
};
