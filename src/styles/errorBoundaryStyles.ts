import { StyleSheet } from 'react-native';

// ErrorBoundary is a class component — it cannot use useTheme().
// Static fallback colors are used instead of theme tokens.
const BACKGROUND = '#fff';
const TEXT_PRIMARY = '#333';
const TEXT_SECONDARY = '#666';
const SUCCESS = '#4CAF50';
const TEXT_INVERSE = '#fff';
const BACKGROUND_SECONDARY = '#f5f5f5';
const ERROR = '#d32f2f';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BACKGROUND,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    alignItems: 'center',
    maxWidth: 400,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: TEXT_PRIMARY,
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: TEXT_SECONDARY,
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    backgroundColor: SUCCESS,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  buttonText: {
    color: TEXT_INVERSE,
    fontSize: 16,
    fontWeight: '600',
  },
  errorDetails: {
    maxHeight: 200,
    width: '100%',
    backgroundColor: BACKGROUND_SECONDARY,
    padding: 10,
    borderRadius: 8,
    marginTop: 20,
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: TEXT_PRIMARY,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 12,
    color: ERROR,
    marginBottom: 8,
  },
  stackTrace: {
    fontSize: 10,
    color: TEXT_SECONDARY,
    fontFamily: 'monospace',
  },
});
