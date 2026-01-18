module.exports = ({ config }) => ({
  ...config,
  extra: {
    ...(config.extra ?? {}),
    sentryDsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
    sentryTest: process.env.EXPO_PUBLIC_SENTRY_TEST,
    sentryCaptureConsole: process.env.EXPO_PUBLIC_SENTRY_CAPTURE_CONSOLE,
  },
  "plugins": [
    "@react-native-community/datetimepicker"
  ]
});
