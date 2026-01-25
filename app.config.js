const ensurePlugin = (plugins, plugin) => {
  const hasPlugin = plugins.some((entry) => {
    if (Array.isArray(entry)) return entry[0] === plugin;
    return entry === plugin;
  });

  return hasPlugin ? plugins : [...plugins, plugin];
};

module.exports = ({ config }) => {
  const basePlugins = Array.isArray(config.plugins) ? config.plugins : [];
  const plugins = ensurePlugin(
    basePlugins,
    "@react-native-community/datetimepicker"
  );

  return {
    ...config,
    extra: {
      ...(config.extra ?? {}),
      sentryDsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
      sentryTest: process.env.EXPO_PUBLIC_SENTRY_TEST,
      sentryCaptureConsole: process.env.EXPO_PUBLIC_SENTRY_CAPTURE_CONSOLE,
    },
    plugins,
  };
};
